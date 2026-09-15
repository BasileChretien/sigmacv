import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import type { FunderRow } from "@/lib/funders/join";
import { fill } from "@/lib/i18n/fill";
import type { WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";
import { shortId } from "@/lib/openalex/types";
import {
  funderRepository,
  HAL,
  nationalRepository,
  placeFitsLocations,
  placeKindOf,
  ZENODO,
} from "./repositoryDirectory";
import { monthsLong } from "./rightsSentences";

/**
 * The deposit routes for one closed journal article — ONE action (verb +
 * destination + a one-clause reason) and the other places, built only from stored
 * fields, the committed tables (`repositoryDirectory.ts`) and the owner's funder
 * crosswalk. Pure. The ORDER is the rule, never a score, and every route says
 * which rule put it there:
 *
 *  1. funder   — a confirmed funder repository for a funder the work names;
 *  2. own      — an OPEN repository (HAL, Zenodo, arXiv) the owner's works already
 *                sit in (`owner.depositRepositories`);
 *  3. national — the national repository of the affiliation country (the paper's,
 *                or the owner's current one when they choose it);
 *  4. own      — any other repository OpenAlex lists the owner's works in. After
 *                the national rule: a co-author's institutional repository reaches
 *                that list as easily as the owner's own, and may not take the
 *                owner's deposit;
 *  5. zenodo   — always last, open to anyone; when nothing came before, the
 *                reason says why nothing did.
 *
 * A destination reached by an earlier rule is not repeated. The action's wording
 * never goes beyond the publisher's record (`depositAction`), and the conditions
 * the record states travel with it to the form (`depositNotes`). Nothing here
 * counts works or judges whether a deposit is due.
 */

export type DepositBasis = "paper" | "current";
export type DepositRouteKind = "funder" | "own" | "national" | "zenodo";

type ReasonKey = Extract<
  keyof WorkspaceUiStrings,
  `wlDepositBecause${string}` | "wlDepositZenodoAny"
>;

export interface DepositRoute {
  kind: DepositRouteKind;
  destination: string;
  href: string;
  reason: { key: ReasonKey; params: Readonly<Record<string, string>> };
}

export interface DepositContext {
  /** Route by the affiliation printed on the paper (default) or the owner's current one. */
  basis: DepositBasis;
  /** ISO-3166 code of the owner's current affiliation, when known. */
  currentCountry?: string;
  /** The owner's funder crosswalk keyed by short OpenAlex funder id (`toCrosswalk`). */
  crosswalk: ReadonlyMap<string, FunderRow>;
}

/** The country the routes use: the paper's (one with a national repository first). */
function routingCountry(item: CvItem, ctx: DepositContext): string | undefined {
  if (ctx.basis === "current") return ctx.currentCountry;
  const countries = item.meta.workCountries ?? [];
  return countries.find((code) => nationalRepository(code)) ?? countries[0];
}

function zenodoReason(
  routesSoFar: number,
  country: string | undefined,
  basis: DepositBasis,
): DepositRoute["reason"] {
  if (routesSoFar > 0) return { key: "wlDepositZenodoAny", params: {} };
  if (!country) return { key: "wlDepositBecauseNoAffiliation", params: {} };
  return basis === "current"
    ? { key: "wlDepositBecauseNoRepositoryCurrent", params: { country } }
    : { key: "wlDepositBecauseNoRepositoryPaper", params: { country } };
}

const isOpenPlace = (route: DepositRoute): boolean => placeKindOf(route.href) !== "other";

export function depositRoutes(cv: CanonicalCv, item: CvItem, ctx: DepositContext): DepositRoute[] {
  const routes: DepositRoute[] = [];
  const add = (route: DepositRoute) => {
    if (!routes.some((r) => r.href === route.href)) routes.push(route);
  };

  for (const funder of item.meta.funders ?? []) {
    const row = ctx.crosswalk.get(shortId(funder.id));
    const entry = funderRepository(row?.fundrefDoi);
    if (!entry) continue;
    add({
      kind: "funder",
      destination: entry.destination.name,
      href: entry.destination.href,
      reason: {
        key: "wlDepositBecauseFunder",
        params: { funder: row?.name.trim() || funder.name?.trim() || entry.funder },
      },
    });
  }

  const own = (cv.owner.depositRepositories ?? []).map((repository): DepositRoute => ({
    kind: "own",
    destination: repository.name,
    href: repository.url,
    reason: { key: "wlDepositBecauseOwn", params: { repository: repository.name } },
  }));
  own.filter(isOpenPlace).forEach(add);

  const country = routingCountry(item, ctx);
  const national = nationalRepository(country);
  if (national && country) {
    add({
      kind: "national",
      destination: national.destination.name,
      href: national.destination.href,
      reason: {
        key:
          ctx.basis === "current"
            ? "wlDepositBecauseCurrentCountry"
            : "wlDepositBecausePaperCountry",
        params: { country },
      },
    });
  }

  own.filter((route) => !isOpenPlace(route)).forEach(add);

  add({
    kind: "zenodo",
    destination: ZENODO.name,
    href: ZENODO.href,
    reason: zenodoReason(routes.length, country, ctx.basis),
  });
  return routes;
}

/** Whether choosing the owner's current affiliation changes this work's one action. */
export function basisChangesPrimary(
  cv: CanonicalCv,
  item: CvItem,
  ctx: Omit<DepositContext, "basis">,
): boolean {
  if (!ctx.currentCountry) return false;
  const paper = depositRoutes(cv, item, { ...ctx, basis: "paper" })[0]!;
  const current = depositRoutes(cv, item, { ...ctx, basis: "current" })[0]!;
  return paper.href !== current.href;
}

/** A country code as the viewer's locale names it. */
export function regionName(code: string, locale: string): string {
  /* v8 ignore next -- DisplayNames answers every ISO-3166 alpha-2 code */
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

/** The route's one-clause reason, in the viewer's locale. */
export function depositReason(route: DepositRoute, wu: WorkspaceUiStrings, locale: string): string {
  const { country, ...rest } = route.reason.params;
  return fill(wu[route.reason.key], {
    ...rest,
    ...(country ? { country: regionName(country, locale) } : {}),
  });
}

type Version = NonNullable<CvItem["meta"]["selfArchiving"]>["versions"][number];
type ActionKey = Extract<
  keyof WorkspaceUiStrings,
  "wlDepositPublished" | "wlDepositAccepted" | "wlDepositSubmitted"
>;

/** The version an action names when the record allows several: the publisher's own first. */
const ACTION_BY_VERSION: ReadonlyArray<readonly [Version, ActionKey]> = [
  ["publishedVersion", "wlDepositPublished"],
  ["acceptedVersion", "wlDepositAccepted"],
  ["submittedVersion", "wlDepositSubmitted"],
];

/**
 * The action's words, never beyond the publisher's record:
 *  - a funder's repository takes the accepted manuscript — the funder's policy is
 *    why it is offered, whatever the publisher records;
 *  - no record: the accepted manuscript, not the publisher's PDF, if the journal's
 *    policy allows it;
 *  - a record that allows no deposit, or names only places this destination is not
 *    (`placeFitsLocations`): deposit only if the publishing agreement — or a
 *    statutory right shown above the work — allows it;
 *  - otherwise the version the record allows, the publisher's own first.
 */
export function depositAction(
  item: CvItem,
  route: DepositRoute,
  wu: WorkspaceUiStrings,
  hasStatutoryRight: boolean,
): string {
  const destination = route.destination;
  if (route.kind === "funder") return fill(wu.wlDepositAccepted, { destination });
  const record = item.meta.selfArchiving;
  if (!record) return fill(wu.wlDepositUnrecorded, { destination });
  if (!record.canArchive || !placeFitsLocations(placeKindOf(route.href), record.locations)) {
    return fill(hasStatutoryRight ? wu.wlDepositIfRightOrAgreement : wu.wlDepositIfAgreement, {
      destination,
    });
  }
  const named = ACTION_BY_VERSION.find(([version]) => record.versions.includes(version));
  return fill(named ? wu[named[1]] : wu.wlDepositUnrecorded, { destination });
}

/**
 * What the recorded policy asks of the deposit form — the licence, and the embargo
 * while it runs — and where the publisher's DOI goes: for Zenodo, how to give it
 * without taking it as the deposit's own; for HAL, the box that fills the form in
 * from it (HAL ignores a DOI passed in the link). Not the policy's conditions for a
 * funder's repository, which sets the release itself. `today` is an ISO date
 * (YYYY-MM-DD).
 */
export function depositNotes(
  item: CvItem,
  route: DepositRoute,
  wu: WorkspaceUiStrings,
  locale: string,
  today: string,
): string[] {
  const notes: string[] = [];
  const record = item.meta.selfArchiving;
  if (route.kind !== "funder" && record?.canArchive) {
    if (record.licence) notes.push(fill(wu.wlDepositFormLicence, { licence: record.licence }));
    if (record.embargoEnd) {
      if (record.embargoEnd > today) {
        notes.push(fill(wu.wlDepositFormEmbargoDate, { date: record.embargoEnd }));
      }
    } else if (record.embargoMonths) {
      notes.push(
        fill(wu.wlDepositFormEmbargoDuration, {
          duration: monthsLong(record.embargoMonths, locale),
        }),
      );
    }
  }
  const hasDoi = Boolean(item.csl?.DOI?.trim());
  if (hasDoi && route.href === ZENODO.href) notes.push(wu.wlDepositZenodoDoi);
  if (hasDoi && route.href === HAL.href) notes.push(wu.wlDepositHalDoi);
  return notes;
}

/**
 * ShareYourPaper's page for a DOI (it checks the permission and deposits in Zenodo).
 * The DOI's shape is the one `openalex/client.ts` accepts: no whitespace, `?`, `#`,
 * `%` or backslash, so nothing but path characters reaches the encoding.
 */
export function shareYourPaperHref(doi: string | undefined): string | undefined {
  const bare = doi
    ?.trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "");
  if (!bare || bare.length > 300 || !/^10\.\d{4,9}\/[^\s?#%\\]+$/.test(bare)) return undefined;
  if (bare.split("/").some((segment) => segment === "." || segment === "..")) return undefined;
  return `https://shareyourpaper.org/${encodeURIComponent(bare).replace(/%2F/gi, "/")}`;
}
