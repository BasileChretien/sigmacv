import { z } from "zod";
import { readBodyWithin, resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * OA.Works permissions API — the self-archiving policy OA.Works records for ONE
 * journal article, looked up by DOI.
 *
 *   GET https://bg.api.oa.works/permissions/<doi>
 *   → 200 `{ best_permission, all_permissions[] }` (verified live 2026-09-15 on
 *     10.1016/j.cell.2020.01.001, 10.1002/pds.5000 and 10.1111/fcp.12345);
 *   → 501 with the text "DOI is not a journal article" for a DOI OA.Works does
 *     not resolve to a journal article (verified the same day).
 *
 * No auth, no documented rate limit (none verified — the owner sync makes at
 * most one call per closed article, sequentially, under a wall-clock budget),
 * data in the public domain (Zenodo record 3813854). The project is alive but
 * quiet since 2021, so every record is shown DATED — its own `meta.updated`,
 * which OA.Works writes day-first ("27/01/2021 00:00:00", "20/08/2024 06:05";
 * verified on the records above) — and every call is FAIL-SOFT. The old
 * api.openaccessbutton.org host is gone (Open Access Button closed 2025-11-18).
 *
 * Only `best_permission` is read, and only what the owner worklist prints (data
 * minimisation): whether archiving is allowed, which versions, where, the
 * embargo, the licence of the deposited copy, the publisher's deposit statement,
 * the record's "updated" date and one archived copy of the publisher's policy.
 * Copyright-owner names, contributor e-mail addresses, scores and the rest are
 * dropped at this boundary.
 *
 * No `?affiliation=` parameter, deliberately: with one, OA.Works folds an
 * institution's or a country's policy INTO `best_permission` (verified: a French
 * ROR id turned Cell's 12-month embargo into 6 months, issuer
 * `affiliation.id: ["FR"]`). That would merge the statutory line into the
 * publisher line; SigmaCV keeps the two apart (`archiving/statutoryRights.ts`).
 *
 * Three outcomes, because the caller treats them differently: `found` and `none`
 * are answers (the stored record is replaced, or cleared); `failed` is not (the
 * stored record stays and the work is retried on a later sync).
 */

const OAWORKS_API = "https://bg.api.oa.works/permissions";
const MAX_BYTES = 1_000_000;
const MAX_DOI = 300;
const DOI_RE = /^10\.\d{4,9}\/\S+$/;
/** The issuers whose record is the publisher's policy (OA.Works writes "Publisher"). */
const PUBLISHER_ISSUERS: ReadonlySet<string> = new Set(["journal", "publisher"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ARTICLE_VERSIONS = [
  "submittedVersion",
  "acceptedVersion",
  "publishedVersion",
] as const;
export type ArticleVersion = (typeof ARTICLE_VERSIONS)[number];

/** Bounds applied at the boundary (the canonical schema enforces the same). */
export const PERMISSION_LIMITS = {
  locations: 8,
  location: 100,
  licence: 100,
  depositStatement: 2000,
  url: 2048,
  embargoMonths: 600,
} as const;

/** The printed subset of one OA.Works `best_permission`. */
export interface SelfArchivingPermission {
  canArchive: boolean;
  /** Canonical order: submitted, accepted, published. */
  versions: ArticleVersion[];
  embargoMonths?: number;
  /** ISO date OA.Works computed for THIS article. */
  embargoEnd?: string;
  /** Repository kinds as OA.Works words them ("Institutional Repository", …). */
  locations: string[];
  licence?: string;
  /** Publisher-required text, markup stripped; never translated. */
  depositStatement?: string;
  /** ISO date of the record's own last update (`meta.updated`). */
  recordUpdated?: string;
  /** An archived copy of the publisher's policy (web.archive.org / perma.cc). */
  policyUrl?: string;
}

export type PermissionLookup =
  | { status: "found"; permission: SelfArchivingPermission }
  | { status: "none" }
  | { status: "failed" };

const NONE: PermissionLookup = { status: "none" };
const FAILED: PermissionLookup = { status: "failed" };

const optionalText = z.string().optional().catch(undefined);
const optionalList = z.array(z.unknown()).optional().catch(undefined);

const BestPermissionSchema = z.object({
  can_archive: z.boolean(),
  version: optionalText,
  versions: optionalList,
  licence: optionalText,
  locations: optionalList,
  embargo_months: z.number().optional().catch(undefined),
  embargo_end: optionalText,
  deposit_statement: optionalText,
  meta: z.object({ updated: optionalText }).optional().catch(undefined),
  provenance: z.object({ archiving_policy: z.unknown() }).optional().catch(undefined),
  issuer: z.object({ type: optionalText }).optional().catch(undefined),
});
type BestPermission = z.infer<typeof BestPermissionSchema>;

/**
 * A DOI as a bare "10.x/…" string, or undefined. Dot segments ("." / "..") are
 * refused: the DOI's "/" stays a path separator in the request URL, so a segment
 * like ".." would walk the request out of `/permissions/` — and a stored
 * `csl.DOI` is owner-editable and carries no format constraint of its own.
 */
function bareDoi(doi: string): string | undefined {
  const bare = doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "");
  if (bare.length > MAX_DOI || !DOI_RE.test(bare)) return undefined;
  return bare.split("/").some((segment) => segment === "." || segment === "..") ? undefined : bare;
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** A real calendar date in ISO form, or undefined. */
function validIsoDate(value: string): string | undefined {
  if (!ISO_DATE.test(value)) return undefined;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

/** OA.Works' day-first "DD/MM/YYYY[ hh:mm[:ss]]" (or an ISO date) → ISO date. */
export function isoFromRecordDate(raw: string | undefined): string | undefined {
  const value = raw?.trim() ?? "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(value);
  if (iso) return validIsoDate(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const dayFirst = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s|$)/.exec(value);
  if (!dayFirst) return undefined;
  const [, day = "", month = "", year = ""] = dayFirst;
  return validIsoDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
}

function versionsOf(p: BestPermission): ArticleVersion[] {
  const named = new Set<string>(
    [...(p.versions ?? []), p.version].filter((v): v is string => typeof v === "string"),
  );
  return ARTICLE_VERSIONS.filter((v) => named.has(v));
}

function locationsOf(raw: readonly unknown[] | undefined): string[] {
  const out: string[] = [];
  for (const entry of raw ?? []) {
    if (typeof entry !== "string") continue;
    const location = collapse(entry);
    if (!location || location.length > PERMISSION_LIMITS.location || out.includes(location)) {
      continue;
    }
    out.push(location);
    if (out.length >= PERMISSION_LIMITS.locations) break;
  }
  return out;
}

/** A bounded, non-empty text, or undefined (never truncated: a cut-off
 *  publisher statement would be a misquote). */
function boundedText(value: string | undefined, max: number): string | undefined {
  const text = value === undefined ? "" : collapse(value);
  return text && text.length <= max ? text : undefined;
}

/**
 * The publisher's statement as plain text. OA.Works passes the publisher's inline
 * markup through (`<i><scp>CYP</scp>2B6</i>`). One character scan drops every
 * angle bracket and whatever sits between an opening `<` and the next `>` (an
 * unterminated `<` drops the rest), so no markup survives a nested or broken tag
 * such as `<scr<script>ipt>` — even though React would escape it on render. A
 * scan, not a multi-character regex: a one-pass regex strip can re-form a tag.
 */
function plainStatement(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let text = "";
  let inTag = false;
  for (const ch of value) {
    if (ch === "<") inTag = true;
    else if (ch === ">") inTag = false;
    else if (!inTag) text += ch;
  }
  return text;
}

/** An archived URL whose address names a sharing / archiving / embargo policy. */
const POLICY_LIKE = /self-?archiv|sharing|embargo|open-?access|author|copyright|polic/i;

/**
 * One archived copy of the publisher's policy. OA.Works lists several snapshots
 * in no useful order — for Wiley the first is a price list and the second the
 * self-archiving page (verified 2026-09-15) — so an address that names a policy
 * wins, then the first valid http(s) URL.
 */
function policyUrlOf(raw: unknown): string | undefined {
  const entries = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const urls = entries
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((url) => /^https?:\/\/\S+$/i.test(url) && url.length <= PERMISSION_LIMITS.url);
  return urls.find((url) => POLICY_LIKE.test(url)) ?? urls[0];
}

function toPermission(p: BestPermission): SelfArchivingPermission {
  const recorded = {
    recordUpdated: isoFromRecordDate(p.meta?.updated),
    policyUrl: policyUrlOf(p.provenance?.archiving_policy),
  };
  // A refusal prints only that no permission is recorded, with the record's date
  // and the archived policy: nothing else from the record is kept.
  if (!p.can_archive) return { canArchive: false, versions: [], locations: [], ...recorded };
  const months = p.embargo_months;
  return {
    ...recorded,
    canArchive: true,
    versions: versionsOf(p),
    embargoMonths:
      months !== undefined &&
      Number.isInteger(months) &&
      months >= 0 &&
      months <= PERMISSION_LIMITS.embargoMonths
        ? months
        : undefined,
    embargoEnd: p.embargo_end ? validIsoDate(p.embargo_end.trim()) : undefined,
    locations: locationsOf(p.locations),
    licence: boundedText(p.licence, PERMISSION_LIMITS.licence),
    depositStatement: boundedText(
      plainStatement(p.deposit_statement),
      PERMISSION_LIMITS.depositStatement,
    ),
    recordUpdated: isoFromRecordDate(p.meta?.updated),
    policyUrl: policyUrlOf(p.provenance?.archiving_policy),
  };
}

function userAgent(mailto: string | undefined): string {
  const contact = mailto?.trim() ? `; mailto:${mailto.trim()}` : "";
  return `SigmaCV (+https://github.com/BasileChretien/sigmacv${contact})`;
}

/** The longest one lookup may take, headers and body together. */
const OAWORKS_TIMEOUT_MS = 8_000;
/**
 * The self-archiving permission OA.Works records for a journal article's DOI.
 * `none` for a malformed DOI (no call), a 4xx other than 429 — including the
 * 501 "DOI is not a journal article" — or a 200 with no `best_permission`;
 * `failed` for a network error, a redirect, a timeout (headers or body), a 429 /
 * 5xx, a missing, stalled, malformed or oversized body, or a `best_permission`
 * this parser cannot read. `timeoutMs` bounds the whole lookup (the caller's
 * remaining budget), never beyond the client's own limit. Never throws.
 */
export async function fetchSelfArchivingPermission(
  doi: string,
  mailto?: string,
  timeoutMs: number = OAWORKS_TIMEOUT_MS,
): Promise<PermissionLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const limit = Math.max(1, Math.min(OAWORKS_TIMEOUT_MS, timeoutMs));
  const deadline = Date.now() + limit;
  try {
    // The DOI's own "/" stays a path separator (OA.Works routes on it); every
    // other reserved character is escaped — and the parsed URL must still sit
    // under /permissions/ (a second guard behind bareDoi's dot-segment check).
    const url = new URL(`${OAWORKS_API}/${encodeURIComponent(bare).replace(/%2F/gi, "/")}`);
    /* v8 ignore next -- bareDoi refuses every dot segment; this is the second guard */
    if (!url.pathname.startsWith("/permissions/10.")) return NONE;
    const res = await resilientFetch(url.href, {
      headers: { Accept: "application/json", "User-Agent": userAgent(mailto) },
      // One attempt: the pass retries a failed work on a later sync, and a 501
      // "DOI is not a journal article" is not worth asking twice.
      timeoutMs: limit,
      retries: 0,
      // No redirect is followed: the User-Agent carries the contact address, which
      // must not be forwarded to another host.
      redirect: "error",
      // `retrievedAt` must mean when SigmaCV asked, not when a cache did.
      cache: "no-store",
    });
    if (res.status === 429 || (res.status >= 500 && res.status !== 501)) return FAILED;
    if (!res.ok) return NONE;
    const body = await readBodyWithin(res, deadline, MAX_BYTES);
    if (body === undefined) return FAILED;
    const data: unknown = JSON.parse(body);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return FAILED;
    const raw = (data as { best_permission?: unknown }).best_permission;
    if (raw === undefined || raw === null) return NONE;
    const best = BestPermissionSchema.safeParse(raw);
    if (!best.success) return FAILED;
    // Only a journal's or a publisher's record is the publisher's policy the
    // worklist names; any other issuer is no record of that policy.
    const issuer = best.data.issuer?.type?.trim().toLowerCase();
    if (!issuer || !PUBLISHER_ISSUERS.has(issuer)) return NONE;
    return { status: "found", permission: toPermission(best.data) };
  } catch (err) {
    logger.warn("oaworks.fetch_failed", { err });
    return FAILED;
  }
}
