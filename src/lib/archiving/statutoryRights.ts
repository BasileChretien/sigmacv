/**
 * Statutory self-archiving rules by country — a committed, hand-verified DATA
 * table keyed by ISO-3166 alpha-2 code, in the style of `funders/oaPolicies.ts`.
 * Never scraped, never inferred. The owner worklist joins an entry's phrases into
 * one sentence under a closed work whose affiliation on the paper
 * (`meta.workCountries`) is in that country, BESIDE the publisher's policy and
 * the funder's — never merged into either, and never a verdict: every rule here
 * hangs on conditions no metadata carries (public funding of the work or of the
 * institution, the journal's periodicity, co-authors' agreement, the discipline),
 * so the sentence says it "may also apply" and the judgement stays the owner's.
 * Only a country whose law or national policy GIVES the author something is
 * listed: a line saying "no right" would read as a ban under a paper whose
 * publisher may well allow a deposit, so such a country is simply absent.
 * The vocabulary of a verdict and of a quantity is banned by test
 * (`tests/statutory-rights.test.ts`).
 *
 * Two filters keep a line away from a work the rule cannot cover, so the owner is
 * never asked to weigh what the data already rules out:
 *  - `appliesFrom` — the rule's start; a work whose effective year is EARLIER
 *    than that year gets no line (a work of the start year, or of no known year,
 *    still does — the data cannot rule it out);
 *  - `workTypes` — the CSL types the rule covers (a periodical-only right is not
 *    printed under a book chapter); absent = any type.
 *
 * Three kinds, worded differently in the worklist:
 *  - `author-right`        — a secondary-publication right the author MAY use;
 *  - `deposit-requirement` — the law tells the researcher to deposit in a
 *                            repository (Spain): an obligation, and said so;
 *  - `funding-policy`      — no statute; a national policy tied to public grants.
 *
 * `sourceKind` says what `sourceUrl` is — the legal text itself, or a named
 * guidance page explaining it — and the worklist labels the link accordingly.
 *
 * Verification works exactly as in the funder table: `"maintainer"` entries were
 * read against `sourceUrl` (or, where that site refuses automated reading, a
 * verbatim quotation of the text on `guidanceUrl`) on `lastVerified`;
 * `"maintainer-pending"` entries were drafted and not yet confirmed, carry no
 * date, and are worded so. `docs/STATUTORY-ARCHIVING-RIGHTS.md` lists every
 * entry for the maintainer to re-check.
 */

export const STATUTORY_KINDS = ["author-right", "deposit-requirement", "funding-policy"] as const;
export type StatutoryKind = (typeof STATUTORY_KINDS)[number];

export const STATUTORY_SOURCE_KINDS = ["legal-text", "guidance"] as const;
export type StatutorySourceKind = (typeof STATUTORY_SOURCE_KINDS)[number];

interface StatutoryEntryBase {
  /** ISO-3166 alpha-2, upper-case — the join key. */
  countryCode: string;
  kind: StatutoryKind;
  /** The instrument's own name, untranslated. */
  instrument: string;
  /** Where the rule is read (https). */
  sourceUrl: string;
  /** Whether `sourceUrl` is the legal text itself or a guidance page about it. */
  sourceKind: StatutorySourceKind;
  /** A further guidance page quoting or explaining the text, when one was used. */
  guidanceUrl?: string;
  /** ISO date the rule took effect, when works from earlier years cannot fall under it. */
  appliesFrom?: string;
  /** The CSL item types the rule covers; absent = any type. */
  workTypes?: readonly string[];
  /** Short factual phrases in English, joined with "; " in the sentence. */
  statements: string[];
}

/** Read against the source on `lastVerified`. */
interface StatutoryEntryVerified extends StatutoryEntryBase {
  verifiedBy: "maintainer";
  lastVerified: string;
}

/** Drafted, not yet confirmed — no verification date exists. */
interface StatutoryEntryPending extends StatutoryEntryBase {
  verifiedBy: "maintainer-pending";
  lastVerified?: never;
}

export type StatutoryArchivingEntry = StatutoryEntryVerified | StatutoryEntryPending;

const JOURNAL_ARTICLES = ["article-journal"] as const;
/** CSL types of "a work of scientific literature": texts, never datasets or software. */
const SCHOLARLY_LITERATURE = [
  "article-journal",
  "article",
  "chapter",
  "book",
  "paper-conference",
  "report",
  "thesis",
] as const;

export const STATUTORY_ARCHIVING: readonly StatutoryArchivingEntry[] = [
  {
    countryCode: "FR",
    kind: "author-right",
    instrument: "Code de la recherche, art. L533-4 (loi n° 2016-1321, art. 30)",
    sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033205794",
    sourceKind: "legal-text",
    guidanceUrl:
      "https://www.ouvrirlascience.fr/guide-application-loi-republique-numerique-article-30-ecrits-scientifiques-version-courte/",
    workTypes: JOURNAL_ARTICLES,
    statements: [
      "a scientific writing from research funded at least half by the State, local authorities, public bodies, national agencies or EU funds",
      "published in a periodical appearing at least once a year",
      "the final version of the manuscript accepted for publication, free of charge, in an open format",
      "when the publisher makes it free, or at most 6 months (science, technology, medicine) or 12 months (humanities, social sciences) from first publication",
      "even after granting exclusive rights to a publisher, subject to the agreement of any co-authors",
      "the copy may not be used for commercial publishing",
      "a rule of public order: contrary contract clauses are deemed unwritten",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "DE",
    kind: "author-right",
    instrument: "Urheberrechtsgesetz (UrhG) § 38 Abs. 4",
    sourceUrl: "https://www.gesetze-im-internet.de/urhg/__38.html",
    sourceKind: "legal-text",
    guidanceUrl:
      "https://irights.info/artikel/kein-durchbruch-5-jahre-zweitveroeffentlichungsrecht-fuer-wissenschaftliche-zeitschriftenbeitraege/29822",
    workTypes: JOURNAL_ARTICLES,
    statements: [
      "a scientific contribution from research at least half funded by public money",
      "published in a collection appearing periodically at least twice a year",
      "even after granting the publisher an exclusive right of use",
      "the accepted manuscript version, 12 months after first publication",
      "for no commercial purpose; the source of first publication must be cited",
      "an agreement to the author's disadvantage is ineffective",
      "the legislative reasoning limits it to publicly funded projects and non-university institutes, not basic-funded university research",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "AT",
    kind: "author-right",
    instrument: "Urheberrechtsgesetz (UrhG) § 37a",
    sourceUrl: "https://www.jusline.at/gesetz/urhg/paragraf/37a",
    sourceKind: "legal-text",
    workTypes: JOURNAL_ARTICLES,
    statements: [
      "a scientific contribution written as a member of the academic staff of a research institution at least half funded by public money",
      "published in a collection appearing periodically at least twice a year",
      "even after granting the publisher a right of use",
      "the accepted manuscript version, 12 months after first publication",
      "for no commercial purpose; the source of first publication must be cited",
      "an agreement to the author's disadvantage is ineffective",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "NL",
    kind: "author-right",
    instrument: "Auteurswet, art. 25fa (Taverne amendment)",
    sourceUrl: "https://wetten.overheid.nl/BWBR0001886",
    sourceKind: "legal-text",
    guidanceUrl:
      "https://www.openaccess.nl/en/policies/open-access-in-dutch-copyright-law-taverne-amendment",
    workTypes: ["article-journal", "chapter", "paper-conference"],
    statements: [
      "a short scientific work from research funded wholly or partly by Dutch public funds",
      "made available to the public free of charge after a reasonable period following first publication",
      "the source of first publication must be clearly cited",
      "Dutch universities read short works as articles, proceedings papers and book chapters, and the reasonable period as six months",
      "under that reading, for authors employed at a Dutch university, the published version is shared through its repository",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "BE",
    kind: "author-right",
    instrument: "Code de droit économique / Wetboek van economisch recht, art. XI.196 § 2/1",
    sourceUrl: "https://www.ejustice.just.fgov.be/eli/loi/2013/02/28/2013A11134/justel",
    sourceKind: "legal-text",
    guidanceUrl:
      "https://www.kuleuven.be/open-science/what-is-open-science/scholarly-publishing-and-open-access/open-access-kuleuven/belgian-oa-legislation",
    workTypes: JOURNAL_ARTICLES,
    statements: [
      "a scientific article from research financed at least half by public funds",
      "even after assigning the rights to a periodical's publisher or placing them under a simple or exclusive licence",
      "the manuscript, free of charge in open access, 12 months (humanities, social sciences) or 6 months (other sciences) after first publication in a periodical",
      "the source of first publication must be cited",
      "the publishing contract may set a shorter delay; the King may extend it",
      "the right cannot be waived; when a connecting factor is located in Belgium, it applies whatever law the parties chose",
      "applies also to works created before it took effect on 15 September 2018 and not then in the public domain",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "BG",
    kind: "author-right",
    instrument:
      "Закон за авторското право и сродните му права, чл. 60, ал. 2–4 (ДВ, бр. 100 от 2023 г.)",
    sourceUrl: "https://dv.parliament.bg/DVWeb/showMaterialDV.jsp?idMat=201485",
    sourceKind: "legal-text",
    appliesFrom: "2021-06-07",
    workTypes: SCHOLARLY_LITERATURE,
    statements: [
      "a work of scientific literature created in connection with research funded wholly or partly by public funds",
      "the author keeps the right to make it, or parts of it, public in non-commercial educational or scientific repositories",
      "once a publisher has accepted it for publication; the text names no version and sets no later delay",
      "the publisher must be mentioned",
      "any agreement that prevents or restricts this right is null and void",
      "a publisher may not restrict publication solely because the work is already in such a repository",
      "in force since 1 December 2023; applies to works as at 7 June 2021, not to contracts concluded or rights acquired before that date",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "ES",
    kind: "deposit-requirement",
    instrument: "Ley 14/2011 de la Ciencia, art. 37, as amended by Ley 17/2022",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2022-14581",
    sourceKind: "legal-text",
    appliesFrom: "2022-09-07",
    statements: [
      "public-sector research staff, or research financed mainly by public funds, publishing results in scientific publications",
      "shall deposit a copy of the final version accepted for publication, with its associated data, in an institutional or subject open-access repository",
      "at the same time as publication",
      "in force since 7 September 2022; a requirement on the researcher, not an optional right",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "JP",
    kind: "funding-policy",
    instrument:
      "Cabinet Office, national policy on open access to publicly funded scholarly publications and scientific data (February 2024)",
    sourceUrl: "https://www.lib.kyushu-u.ac.jp/en/services/open/mandate",
    sourceKind: "guidance",
    appliesFrom: "2025-04-01",
    statements: [
      "no statute: a government policy for publicly funded research",
      "immediate open access in the institution's repository to peer-reviewed papers published in e-journals, accepted manuscripts included",
      "and to the underlying data the journal requires to be published, such as supplementary data",
      "for grants from the FY2025 calls: JSPS KAKENHI, JST Strategic Basic Research Programs (some excluded), AMED Strategic Basic Research Programs, JST FOREST",
      "grants adopted before FY2024 are excluded even if awarded in FY2025",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
];

const BY_COUNTRY = new Map(STATUTORY_ARCHIVING.map((e) => [e.countryCode, e]));

/** The work a statutory line would sit under: its effective year and CSL type. */
export interface StatutoryWorkContext {
  year?: number;
  type?: string;
}

function covers(entry: StatutoryArchivingEntry, work: StatutoryWorkContext): boolean {
  if (entry.appliesFrom && work.year !== undefined) {
    if (work.year < Number(entry.appliesFrom.slice(0, 4))) return false;
  }
  return !entry.workTypes || (work.type !== undefined && entry.workTypes.includes(work.type));
}

/**
 * The entries for a work's affiliation countries, in the order the countries are
 * stored, one per country (codes compared upper-case), keeping only the rules
 * that can cover the work (see `appliesFrom` / `workTypes`); empty when SigmaCV
 * has none — which the worklist leaves silent rather than guessing.
 */
export function statutoryArchivingFor(
  countryCodes: readonly string[] | undefined,
  work: StatutoryWorkContext = {},
): StatutoryArchivingEntry[] {
  const out: StatutoryArchivingEntry[] = [];
  for (const code of countryCodes ?? []) {
    const entry = BY_COUNTRY.get(code.trim().toUpperCase());
    if (entry && !out.includes(entry) && covers(entry, work)) out.push(entry);
  }
  return out;
}
