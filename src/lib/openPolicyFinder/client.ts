import { readBodyWithin, resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { chooseRoute, type RouteJudge } from "@/lib/archiving/policyRoutes";
import {
  ARTICLE_VERSIONS,
  isoFromRecordDate,
  PERMISSION_LIMITS,
  type ArticleVersion,
  type PolicyRoute,
  type SelfArchivingPermission,
} from "@/lib/oaworks/client";

export type { PolicyRoute } from "@/lib/oaworks/client";

/**
 * Jisc Open Policy Finder (formerly Sherpa Romeo) — the self-archiving policy
 * recorded for a JOURNAL, looked up by ISSN.
 *
 *   GET https://api.openpolicyfinder.jisc.ac.uk/retrieve?item-type=publication
 *       &format=Json&limit=5&filter=[["issn","equals","<issn>"]]
 *       header `x-api-key: <key>`
 *   → 200 `{ items: [{ id, issns: [{ issn }], system_metadata: { id, date_modified },
 *       publisher_policy: [{ open_access_prohibited, permitted_oa: [{ article_version[],
 *       additional_oa_fee, location: { location[], location_phrases[], named_repository[] },
 *       embargo?: { amount, units }, license?: [{ license }], prerequisites?,
 *       conditions?[] }] }] }], totalHits }` — gzip, declared in Content-Encoding
 *     (verified live 2026-09-18 on twenty journals; the legacy v2.sherpa.ac.uk
 *     host, which took the key as a query parameter, was retired in April 2026).
 *
 * Terms: SigmaCV's key (Jisc case CS-00957483, 2026-09-17). Jisc approved the use
 * as described to them: short factual lines from a journal's record, shown
 * privately to each researcher in their own editor, credited to Open Policy
 * Finder with a link to the journal's record and the date retrieved; never on a
 * public page, in an export, or redistributed (`cv/licensedPolicies.ts` strips
 * the records from every download); lookups by ISSN, for the owner's own closed
 * articles, during their own sync, cached, a journal asked at most once a week
 * (`archiving/selfArchivingPass.ts`). The
 * data is CC BY-NC-ND 4.0. Keep all of that true when changing this client or
 * its callers.
 *
 * The client returns every route SigmaCV may name — no additional fee (that is
 * paid open access, not self-archiving), no prerequisite (a funder, a subject,
 * "when required by funder": conditions SigmaCV cannot see), a repository among
 * its places, a readable embargo — and {@link permissionFor} picks, per
 * article, a default to store with them all: the journal's policy is one, but
 * which of its routes an article can take TODAY depends on the article's date,
 * and which one fits depends on where the row deposits (the row picks again). Places are
 * kept in Open Policy Finder's own words ("Non-Commercial Institutional
 * Repository"), which the place matcher (`archiving/repositoryDirectory.ts`)
 * reads; a named repository is kept by its name.
 *
 * A journal that now publishes every article open at no extra fee (a route for
 * the published version under a Creative Commons licence, in the journal
 * itself, with no fee and no prerequisite) has the policy of an open-access
 * journal: it describes articles published open, not a closed one — which this
 * client is only ever asked about. Such a closed article appeared before the
 * journal flipped (Psychological Medicine, 2026-09-18: its record offers the
 * publisher's PDF under CC BY), so the record is no record of its policy:
 * `none`, and the pass falls back to OA.Works and the law.
 *
 * Four outcomes: `found` and `none` (no record for the ISSN, or the record of an
 * open-access journal) are answers; `failed` is not — any other non-200 (a
 * search endpoint that 404s did not say "nothing"), a network error, a
 * redirect, a timeout, a stalled, malformed or oversized body; `unauthorized`
 * (401/403: an unknown key, or one over its quota) means the key is not
 * accepted now, and the pass stops asking for the sync. Never throws.
 */

const OPF_API = "https://api.openpolicyfinder.jisc.ac.uk/retrieve";
/** The journal's public record page — the link the credit points at (checked 2026-09-18). */
const OPF_RECORD = "https://openpolicyfinder.jisc.ac.uk/publication/";
const OPF_TIMEOUT_MS = 8_000;
const MAX_BYTES = 2_000_000;
const ISSN_RE = /^(\d{4})-?(\d{3}[\dX])$/i;

/** Places that are a repository, or cover one ("Any Website"). */
const REPOSITORY_PLACES: ReadonlySet<string> = new Set([
  "any_repository",
  "any_website",
  "institutional_repository",
  "non_commercial_repository",
  "non_commercial_institutional_repository",
  "non_commercial_subject_repository",
  "subject_repository",
  "preprint_repository",
]);

const VERSION_OF: Readonly<Record<string, ArticleVersion>> = {
  submitted: "submittedVersion",
  accepted: "acceptedVersion",
  published: "publishedVersion",
};

const MONTHS_PER: Readonly<Record<string, number>> = { months: 1, years: 12 };
const DAYS_PER: Readonly<Record<string, number>> = { days: 1, weeks: 7 };
/** The days of each month of a common year. */
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** The fewest days any run of `months` consecutive calendar months holds. */
function fewestDays(months: number): number {
  let fewest = Infinity;
  for (let start = 0; start < 12; start++) {
    let days = 0;
    for (let i = 0; i < months % 12; i++) days += MONTH_DAYS[(start + i) % 12]!;
    fewest = Math.min(fewest, days);
  }
  return Math.floor(months / 12) * 365 + fewest;
}

/** What Open Policy Finder records for one journal. */
export interface JournalPolicy {
  /** Empty: the record permits no route SigmaCV may name. */
  routes: PolicyRoute[];
  recordUpdated?: string;
  policyUrl?: string;
}

export type JournalPolicyLookup =
  | { status: "found"; policy: JournalPolicy }
  | { status: "none" }
  | { status: "failed" }
  | { status: "unauthorized" };

interface Phrase {
  value?: unknown;
  phrase?: unknown;
}
interface PermittedOa {
  article_version?: unknown;
  additional_oa_fee?: unknown;
  location?: { location?: unknown; location_phrases?: unknown; named_repository?: unknown };
  embargo?: { amount?: unknown; units?: unknown };
  license?: unknown;
  prerequisites?: unknown;
  conditions?: unknown;
}
interface Item {
  issns?: unknown;
  system_metadata?: { id?: unknown; date_modified?: unknown };
  publisher_policy?: unknown;
}

const NONE: JournalPolicyLookup = { status: "none" };
const FAILED: JournalPolicyLookup = { status: "failed" };
const UNAUTHORIZED: JournalPolicyLookup = { status: "unauthorized" };

/** Every readable ISSN of a value (one, or a list), as `1234-567X`, once each. */
export function issnList(raw: unknown): string[] {
  const all = (Array.isArray(raw) ? raw : [raw]).map((one) =>
    Array.isArray(one) ? undefined : normalIssn(one),
  );
  return [...new Set(all.filter((issn): issn is string => issn !== undefined))];
}

/** `1234-567X` from an ISSN, or the first readable one of a list; undefined otherwise. */
export function normalIssn(raw: unknown): string | undefined {
  if (Array.isArray(raw)) {
    for (const one of raw) {
      const found = normalIssn(one);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof raw !== "string") return undefined;
  const m = ISSN_RE.exec(raw.trim());
  return m ? `${m[1]}-${m[2]!.toUpperCase()}` : undefined;
}

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown, max: number): string | undefined => {
  if (typeof value !== "string") return undefined;
  const t = value.replace(/\s+/g, " ").trim();
  return t && t.length <= max ? t : undefined;
};

function versionsOf(entry: PermittedOa): ArticleVersion[] {
  const named = new Set(
    list(entry.article_version).map((v) => (typeof v === "string" ? VERSION_OF[v] : undefined)),
  );
  return ARTICLE_VERSIONS.filter((v) => named.has(v));
}

/**
 * Months of embargo, never shorter than the record's: an embargo in days or
 * weeks takes the fewest whole months that hold that many days whatever month
 * it starts in (365 days: 12 months; 183 days: 7, as six months can be 181).
 * 0 when none is set; undefined when it cannot be read (the route is dropped).
 */
function embargoOf(entry: PermittedOa): number | undefined {
  if (entry.embargo === undefined) return 0;
  const { amount, units } = entry.embargo;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return undefined;
  const unit = typeof units === "string" ? units : "";
  let months: number;
  if (MONTHS_PER[unit] !== undefined) {
    months = Math.ceil(amount * MONTHS_PER[unit]);
  } else if (DAYS_PER[unit] !== undefined) {
    const days = Math.ceil(amount * DAYS_PER[unit]);
    months = 0;
    while (months <= PERMISSION_LIMITS.embargoMonths && fewestDays(months) < days) months++;
  } else {
    return undefined;
  }
  return months <= PERMISSION_LIMITS.embargoMonths ? months : undefined;
}

/** Any prerequisite at all (funders, subjects, "when required by funder"…). */
function hasPrerequisite(entry: PermittedOa): boolean {
  const p = entry.prerequisites;
  if (p === undefined || p === null) return false;
  if (typeof p !== "object") return true;
  return Object.entries(p).some(
    ([key, value]) => !key.endsWith("_phrases") && (!Array.isArray(value) || value.length > 0),
  );
}

function placeCodes(entry: PermittedOa): string[] {
  return list(entry.location?.location).filter((v): v is string => typeof v === "string");
}

/** The route's places in Open Policy Finder's own words; a named repository by its name. */
function placesOf(entry: PermittedOa): string[] {
  const phrases = new Map<string, string>();
  for (const raw of list(entry.location?.location_phrases)) {
    const p = raw as Phrase;
    const phrase = text(p?.phrase, PERMISSION_LIMITS.location);
    if (typeof p?.value === "string" && phrase) phrases.set(p.value, phrase);
  }
  const out: string[] = [];
  const add = (place: string | undefined) => {
    if (place && !out.includes(place) && out.length < PERMISSION_LIMITS.locations) out.push(place);
  };
  for (const code of placeCodes(entry)) {
    if (code === "named_repository") {
      for (const name of list(entry.location?.named_repository)) {
        add(text(name, PERMISSION_LIMITS.location));
      }
      continue;
    }
    add(phrases.get(code) ?? text(code.replace(/_/g, " "), PERMISSION_LIMITS.location));
  }
  return out;
}

/** The first Creative Commons licence the route sets (`cc_by_nc_nd` → `cc-by-nc-nd`); others are not a form's licence. */
function licenceOf(entry: PermittedOa): string | undefined {
  for (const raw of list(entry.license)) {
    const code = text((raw as { license?: unknown } | null)?.license, PERMISSION_LIMITS.licence);
    if (code?.startsWith("cc_")) return code.replace(/_/g, "-");
  }
  return undefined;
}

function conditionsOf(entry: PermittedOa): string[] | undefined {
  const out = list(entry.conditions)
    .map((c) => text(c, PERMISSION_LIMITS.condition)?.replace(/\.+$/, ""))
    .filter((c): c is string => c !== undefined && c !== "")
    .slice(0, PERMISSION_LIMITS.conditions);
  return out.length ? out : undefined;
}

/** A route SigmaCV may name: no fee, no prerequisite, a repository among its places, readable. */
function routeOf(entry: PermittedOa): PolicyRoute | undefined {
  if (entry.additional_oa_fee === "yes" || hasPrerequisite(entry)) return undefined;
  if (!placeCodes(entry).some((code) => REPOSITORY_PLACES.has(code))) return undefined;
  const versions = versionsOf(entry);
  const embargoMonths = embargoOf(entry);
  if (versions.length === 0 || embargoMonths === undefined) return undefined;
  return {
    versions,
    embargoMonths,
    locations: placesOf(entry),
    licence: licenceOf(entry),
    conditions: conditionsOf(entry),
  };
}

function permittedOf(item: Item): PermittedOa[] {
  const policies = list(item.publisher_policy) as Array<{
    open_access_prohibited?: unknown;
    permitted_oa?: unknown;
  }>;
  return policies
    .filter((p) => p?.open_access_prohibited !== "yes")
    .flatMap((p) => list(p?.permitted_oa) as PermittedOa[])
    .filter((entry): entry is PermittedOa => typeof entry === "object" && entry !== null);
}

/** The journal publishes every article open at no fee: its policy is an open-access journal's. */
function isOpenJournal(item: Item): boolean {
  return permittedOf(item).some(
    (entry) =>
      list(entry.article_version).includes("published") &&
      entry.additional_oa_fee !== "yes" &&
      !hasPrerequisite(entry) &&
      placeCodes(entry).includes("this_journal") &&
      list(entry.license).some((l) => {
        const code = (l as { license?: unknown } | null)?.license;
        return typeof code === "string" && code.startsWith("cc_");
      }),
  );
}

function toPolicy(item: Item): JournalPolicy {
  const id = item.system_metadata?.id;
  return {
    routes: permittedOf(item)
      .map(routeOf)
      .filter((r): r is PolicyRoute => r !== undefined)
      .slice(0, PERMISSION_LIMITS.routes),
    recordUpdated: isoFromRecordDate(
      typeof item.system_metadata?.date_modified === "string"
        ? item.system_metadata.date_modified
        : undefined,
    ),
    policyUrl:
      typeof id === "number" && Number.isInteger(id) && id > 0 ? `${OPF_RECORD}${id}` : undefined,
  };
}

/**
 * The journal's policy in the shape the worklist reads, for one article: the
 * route `chooseRoute` picks as its default (`archiving/policyRoutes.ts`), with
 * every route kept for the row to pick again. No route: no self-archiving
 * permission SigmaCV can name, with the record's dates and link.
 */
export function permissionFor(policy: JournalPolicy, judge: RouteJudge): SelfArchivingPermission {
  const recorded = {
    recordUpdated: policy.recordUpdated,
    policyUrl: policy.policyUrl,
    routes: policy.routes,
  };
  const best = chooseRoute(policy.routes, judge);
  if (!best) return { canArchive: false, versions: [], locations: [], ...recorded };
  return { ...best, canArchive: true, ...recorded };
}

function userAgent(mailto: string | undefined): string {
  const contact = mailto?.trim() ? `; mailto:${mailto.trim()}` : "";
  return `SigmaCV (+https://github.com/BasileChretien/sigmacv${contact})`;
}

/**
 * The self-archiving policy Open Policy Finder records for the journal with this
 * ISSN. `none` for an ISSN it cannot read (no call), no record, or an
 * open-access journal's record; `unauthorized` when the key is refused; `failed`
 * for anything else that is not an answer. `timeoutMs` bounds the whole lookup
 * (the caller's remaining budget), never beyond the client's own limit.
 */
export async function fetchJournalPolicy(
  issn: string,
  apiKey: string,
  mailto?: string,
  timeoutMs: number = OPF_TIMEOUT_MS,
): Promise<JournalPolicyLookup> {
  const wanted = normalIssn(issn);
  if (!wanted || !apiKey.trim()) return NONE;
  const limit = Math.max(1, Math.min(OPF_TIMEOUT_MS, timeoutMs));
  const deadline = Date.now() + limit;
  try {
    const url = new URL(OPF_API);
    url.searchParams.set("item-type", "publication");
    url.searchParams.set("format", "Json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("filter", JSON.stringify([["issn", "equals", wanted]]));
    const res = await resilientFetch(url.href, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent(mailto),
        "x-api-key": apiKey.trim(),
      },
      timeoutMs: limit,
      retries: 0,
      // The key and the contact address go to this host only.
      redirect: "error",
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      // The status only: never the key, never the request.
      logger.warn("opf.key_refused", { status: res.status });
      return UNAUTHORIZED;
    }
    if (!res.ok) return FAILED;
    const body = await readBodyWithin(res, deadline, MAX_BYTES);
    if (body === undefined) return FAILED;
    const data: unknown = JSON.parse(body);
    const items = (data as { items?: unknown } | null)?.items;
    if (!Array.isArray(items)) return FAILED;
    // Only a record that lists the ISSN asked about is that journal's.
    const item = items.find(
      (it): it is Item =>
        typeof it === "object" &&
        it !== null &&
        list((it as Item).issns).some(
          (i) => normalIssn((i as { issn?: unknown })?.issn) === wanted,
        ),
    );
    if (!item || isOpenJournal(item)) return NONE;
    return { status: "found", policy: toPolicy(item) };
  } catch (err) {
    logger.warn("opf.fetch_failed", { err });
    return FAILED;
  }
}
