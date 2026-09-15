import type { RepositorySource } from "@/lib/openalex/repositories";

/**
 * Where a deposit can go — the committed tables behind the owner worklist's
 * deposit routes (`depositRoutes.ts`), in the style of `funders/oaPolicies.ts`:
 * data, never scraped, each entry with the page it was read on and when. The
 * maintainer note is `docs/DEPOSIT-ROUTES.md`.
 *
 *  - known destinations — the deposit FORM of a few open repositories (HAL,
 *    Zenodo, arXiv), linked instead of their homepage;
 *  - non-deposit sources — sources OpenAlex types `repository` that do not take
 *    an author's deposit (indexes, aggregators, data and archive platforms), so
 *    "your works are already in PubMed" is never offered as a place to deposit;
 *  - national repositories by country (France → HAL);
 *  - funder repositories by FundRef DOI (NIH → PubMed Central through NIHMS,
 *    Wellcome → Europe PMC plus). A
 *    destination nobody has confirmed is recorded but never routed to: a link is
 *    an action, and an unconfirmed action is not offered.
 */

export interface DepositDestination {
  name: string;
  /** The deposit form, or the repository's own page when no form URL is known. */
  href: string;
}

const HAL_SOURCE_ID = "S4306402512";
const ZENODO_SOURCE_ID = "S4306400562";
const ARXIV_SOURCE_ID = "S4306400194";

export const HAL: DepositDestination = { name: "HAL", href: "https://hal.science/submit" };
export const ZENODO: DepositDestination = {
  name: "Zenodo",
  href: "https://zenodo.org/uploads/new",
};
const ARXIV: DepositDestination = { name: "arXiv", href: "https://arxiv.org/submit" };

const KNOWN_DESTINATIONS: ReadonlyMap<string, DepositDestination> = new Map([
  [HAL_SOURCE_ID, HAL],
  [ZENODO_SOURCE_ID, ZENODO],
  [ARXIV_SOURCE_ID, ARXIV],
]);

/** What kind of place a destination link is, for reading the publisher's recorded locations. */
export type PlaceKind = "hal" | "zenodo" | "arxiv" | "other";

export function placeKindOf(href: string): PlaceKind {
  if (href === HAL.href) return "hal";
  if (href === ZENODO.href) return "zenodo";
  if (href === ARXIV.href) return "arxiv";
  return "other";
}

/**
 * Whether a place counts as one of the locations a publisher's policy names, in
 * OA.Works' vocabulary ("Institutional Repository", "Non-commercial Subject
 * Repository", "Any Repository", …). HAL is an institutional repository (through
 * its portals) and a non-commercial one; Zenodo a non-commercial, general
 * repository; arXiv a subject repository and a preprint server; any other place is
 * only known to be a repository. No recorded location means no constraint.
 */
export function placeFitsLocations(kind: PlaceKind, locations: readonly string[]): boolean {
  if (locations.length === 0) return true;
  return locations.some((raw) => {
    const location = raw
      .toLowerCase()
      .replace(/[^a-z]+/g, " ")
      .trim();
    if (/\bany (repository|website)\b/.test(location)) return true;
    switch (kind) {
      case "hal":
        return (
          /\binstitutional repository\b/.test(location) ||
          (/\bnon commercial\b/.test(location) && /\brepository\b/.test(location))
        );
      case "zenodo":
        return location === "non commercial repository" || /\bgeneral repository\b/.test(location);
      case "arxiv":
        return /\bsubject repository\b/.test(location) || /\bpreprint server\b/.test(location);
      case "other":
        return false;
    }
  });
}

/**
 * OpenAlex sources typed `repository` that take no author deposit — ids and names
 * read off OpenAlex on 2026-09-15 (the most frequent repository sources, and the
 * ones on a pharmacology CV). Preprint servers are among them: medRxiv and bioRxiv
 * take no manuscript of a paper already accepted or published, and SSRN and
 * Research Square are commercially owned, so none is ever offered as the place a
 * published paper goes.
 */
export const NON_DEPOSIT_SOURCES: ReadonlyMap<string, string> = new Map([
  ["S4306525036", "PubMed"],
  ["S2764455111", "PubMed Central"],
  ["S4306400806", "Europe PMC"],
  ["S4306401280", "DOAJ"],
  ["S7407056385", "Institutional Repositories DataBase (IRDB)"],
  ["S4306402641", "LA Referencia"],
  ["S4306401271", "RePEc"],
  ["S4306401293", "Dialnet"],
  ["S4306401404", "CyberLeninka"],
  ["S4306402487", "OSTI"],
  ["S4377196900", "OpenGrey"],
  ["S4306402433", "RCAAP"],
  ["S4377196282", "Figshare"],
  ["S4398183272", "GBIF"],
  ["S7407053449", "DiSSCo"],
  ["S4377196806", "Harvard Dataverse"],
  ["S4306401843", "DANS"],
  ["S7407051768", "NAKALA"],
  ["S4406923039", "Gallica"],
  ["S3005729997", "medRxiv"],
  ["S4306400573", "medRxiv"],
  ["S4306402567", "bioRxiv"],
  ["S4210172589", "SSRN"],
  ["S6309402219", "Preprints.org"],
  ["S4306525896", "Research Square"],
]);

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Whether a source is HAL or one of its portals (hal.inria.fr,
 * hal-amu.archives-ouvertes.fr, …): every portal deposits through HAL itself.
 */
export function isHalFamily(source: Pick<RepositorySource, "sourceId" | "homepageUrl">): boolean {
  if (source.sourceId === HAL_SOURCE_ID) return true;
  const host = hostOf(source.homepageUrl);
  if (!host) return false;
  return (
    host === "hal.science" ||
    host.endsWith(".hal.science") ||
    host === "archives-ouvertes.fr" ||
    host.endsWith(".archives-ouvertes.fr") ||
    /^hal[.-]/.test(host)
  );
}

/** One place the owner's works already sit, as the worklist links it. */
export interface OwnerDepositRepository {
  sourceId: string;
  name: string;
  url: string;
}

/** A repository counts only when at least this many of the owner's works sit in it. */
const MIN_WORKS_IN_REPOSITORY = 2;
const MAX_OWNER_REPOSITORIES = 3;

/**
 * The places the owner's works already sit, most works first: non-deposit
 * sources dropped, HAL portals merged into HAL, a known deposit form preferred to
 * a homepage, a source without an https link dropped (a plain-http homepage still
 * identifies a HAL portal, whose link is then HAL's own form), at least
 * {@link MIN_WORKS_IN_REPOSITORY} works, at most {@link MAX_OWNER_REPOSITORIES}.
 * The counts order the list and are not kept.
 */
export function ownerDepositRepositories(
  sources: readonly RepositorySource[],
): OwnerDepositRepository[] {
  const merged = new Map<string, { entry: OwnerDepositRepository; works: number }>();
  for (const source of sources) {
    if (NON_DEPOSIT_SOURCES.has(source.sourceId)) continue;
    const hal = isHalFamily(source);
    const key = hal ? HAL_SOURCE_ID : source.sourceId;
    const known = hal ? HAL : KNOWN_DESTINATIONS.get(source.sourceId);
    const homepage = source.homepageUrl?.startsWith("https://") ? source.homepageUrl : undefined;
    const url = known?.href ?? homepage;
    const name = known?.name ?? source.name.trim();
    if (!url || !name || name.length > 300) continue;
    const seen = merged.get(key);
    merged.set(
      key,
      seen
        ? { entry: seen.entry, works: seen.works + source.works }
        : { entry: { sourceId: key, name, url }, works: source.works },
    );
  }
  return [...merged.values()]
    .filter((m) => m.works >= MIN_WORKS_IN_REPOSITORY)
    .sort((a, b) => b.works - a.works)
    .slice(0, MAX_OWNER_REPOSITORIES)
    .map((m) => m.entry);
}

interface VerifiedEntry {
  verifiedBy: "maintainer";
  lastVerified: string;
}
interface PendingEntry {
  verifiedBy: "maintainer-pending";
  lastVerified?: never;
}

export type NationalRepository = {
  /** ISO-3166 alpha-2, upper-case. */
  countryCode: string;
  destination: DepositDestination;
  /** The repository's own page, read on `lastVerified`. */
  sourceUrl: string;
} & (VerifiedEntry | PendingEntry);

export const NATIONAL_REPOSITORIES: readonly NationalRepository[] = [
  {
    countryCode: "FR",
    destination: HAL,
    sourceUrl: "https://hal.science/",
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
];

export type FunderRepository = {
  /** FundRef DOI, `10.13039/<digits>` — the join key, as in `funders/oaPolicies.ts`. */
  fundrefDoi: string;
  funder: string;
  destination: DepositDestination;
  /** The page the destination was confirmed on. */
  sourceUrl: string;
} & (VerifiedEntry | PendingEntry);

export const FUNDER_REPOSITORIES: readonly FunderRepository[] = [
  {
    fundrefDoi: "10.13039/100000002",
    funder: "National Institutes of Health (NIH)",
    destination: { name: "PubMed Central (NIHMS)", href: "https://www.nihms.nih.gov/" },
    sourceUrl: "https://www.nihms.nih.gov/",
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/100010269",
    funder: "Wellcome",
    destination: { name: "Europe PMC plus", href: "https://plus.europepmc.org/" },
    // Wellcome's own page names Europe PMC plus for self-archiving the accepted
    // manuscript (CC BY, on publication); read in a browser, as wellcome.org
    // refuses automated reading.
    sourceUrl:
      "https://wellcome.org/research-funding/guidance/open-access-guidance/depositing-your-wellcome-funded-research",
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
];

const NATIONAL_BY_COUNTRY = new Map(NATIONAL_REPOSITORIES.map((n) => [n.countryCode, n]));
const FUNDER_BY_DOI = new Map(FUNDER_REPOSITORIES.map((f) => [f.fundrefDoi.toLowerCase(), f]));

/** The national repository for a country code, when SigmaCV records a confirmed one. */
export function nationalRepository(
  countryCode: string | undefined,
): NationalRepository | undefined {
  const entry = countryCode ? NATIONAL_BY_COUNTRY.get(countryCode.trim().toUpperCase()) : undefined;
  return entry?.verifiedBy === "maintainer" ? entry : undefined;
}

/** The funder repository for a FundRef DOI — confirmed entries only. */
export function funderRepository(fundrefDoi: string | undefined): FunderRepository | undefined {
  const entry = fundrefDoi ? FUNDER_BY_DOI.get(fundrefDoi.trim().toLowerCase()) : undefined;
  return entry?.verifiedBy === "maintainer" ? entry : undefined;
}
