/**
 * Statutory self-archiving rules by country — a committed, hand-verified DATA
 * table keyed by ISO-3166 alpha-2 code, in the style of `funders/oaPolicies.ts`.
 * Never scraped, never inferred. The owner worklist joins an entry's phrases into
 * one sentence under a closed work whose affiliation on the paper
 * (`meta.workCountries`) is in that country, BESIDE the publisher's policy and
 * the funder's — never merged into either, and never a verdict: every right here
 * hangs on conditions no metadata carries (the share of public funding, the
 * journal's periodicity, co-authors' agreement, the discipline), so the sentence
 * says it "may also apply" and the judgement stays the owner's. The vocabulary of
 * a verdict and of a quantity is banned by test (`tests/statutory-rights.test.ts`).
 *
 * Four kinds, worded differently in the worklist:
 *  - `author-right`         — a secondary-publication right the author MAY use;
 *  - `deposit-requirement`  — the law tells the researcher to deposit (Spain):
 *                             an obligation, not an option, and said so;
 *  - `funding-policy`       — no statute; a national policy tied to public grants;
 *  - `no-author-right`      — the country has no such right in law (said, so the
 *                             owner does not go looking for one).
 *
 * Verification works exactly as in the funder table: `"maintainer"` entries were
 * read against `sourceUrl` (or, where that site refuses automated reading, a
 * verbatim quotation of the text on `guidanceUrl`) on `lastVerified`;
 * `"maintainer-pending"` entries were drafted and not yet confirmed, carry no
 * date, and are worded so. `docs/STATUTORY-ARCHIVING-RIGHTS.md` lists every
 * entry for the maintainer to re-check.
 */

export const STATUTORY_KINDS = [
  "author-right",
  "deposit-requirement",
  "funding-policy",
  "no-author-right",
] as const;
export type StatutoryKind = (typeof STATUTORY_KINDS)[number];

interface StatutoryEntryBase {
  /** ISO-3166 alpha-2, upper-case — the join key. */
  countryCode: string;
  kind: StatutoryKind;
  /** The instrument's own name, untranslated. */
  instrument: string;
  /** Where the rule's text lives (https). */
  sourceUrl: string;
  /** A named guidance page quoting or explaining the text, when one was used. */
  guidanceUrl?: string;
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

export const STATUTORY_ARCHIVING: readonly StatutoryArchivingEntry[] = [
  {
    countryCode: "FR",
    kind: "author-right",
    instrument: "Code de la recherche, art. L533-4 (loi n° 2016-1321, art. 30)",
    sourceUrl: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033205794",
    guidanceUrl:
      "https://www.ouvrirlascience.fr/guide-application-loi-republique-numerique-article-30-ecrits-scientifiques-version-courte/",
    statements: [
      "a scientific writing from research funded at least half by the State, local authorities, public bodies, national agencies or EU funds",
      "published in a periodical appearing at least once a year",
      "the final version of the manuscript accepted for publication, free of charge, in an open format",
      "once the publisher makes it free to read, otherwise after at most 6 months (science, technology, medicine) or 12 months (humanities, social sciences)",
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
    statements: [
      "a scientific contribution from research at least half funded by public money",
      "published in a collection appearing periodically at least twice a year",
      "even after granting the publisher an exclusive right of use",
      "the accepted manuscript version, 12 months after first publication",
      "for no commercial purpose; the source of first publication must be cited",
      "an agreement to the author's disadvantage is ineffective",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "AT",
    kind: "author-right",
    instrument: "Urheberrechtsgesetz (UrhG) § 37a",
    sourceUrl: "https://www.jusline.at/gesetz/urhg/paragraf/37a",
    statements: [
      "a scientific contribution from research at least half funded by public money",
      "published in a collection appearing periodically at least twice a year",
      "the accepted manuscript version, 12 months after first publication",
      "for no commercial purpose; the source of first publication must be cited",
      "an agreement to the author's disadvantage is ineffective",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    countryCode: "NL",
    kind: "author-right",
    instrument: "Auteurswet, art. 25fa (Taverne amendment)",
    sourceUrl: "https://wetten.overheid.nl/BWBR0001886",
    guidanceUrl:
      "https://www.openaccess.nl/en/policies/open-access-in-dutch-copyright-law-taverne-amendment",
    statements: [
      "a short scientific work from research funded wholly or partly by Dutch public funds",
      "made available to the public free of charge after a reasonable period following first publication",
      "the source of first publication must be clearly cited",
      "Dutch universities read short works as articles, proceedings papers and book chapters, and the reasonable period as six months",
      "under that reading the published version is shared through the institutional repository",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "BE",
    kind: "author-right",
    instrument: "Code de droit économique / Wetboek van economisch recht, art. XI.196 § 2/1",
    sourceUrl:
      "https://www.kuleuven.be/open-science/what-is-open-science/scholarly-publishing-and-open-access/open-access-kuleuven/belgian-oa-legislation",
    statements: [
      "a journal article from research financed at least half by public funds, domestic or foreign",
      "the accepted version, 6 months after publication (sciences) or 12 months (humanities, social sciences)",
      "the source of first publication must be cited",
      "the publisher cannot ask the author to waive the right, even by invoking non-Belgian law",
      "applies to articles published before 2018 too",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "ES",
    kind: "deposit-requirement",
    instrument: "Ley 14/2011 de la Ciencia, art. 37, as amended by Ley 17/2022",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2022-14581",
    statements: [
      "public-sector research staff, or research financed mainly by public funds, publishing results in scientific publications",
      "shall deposit a copy of the final version accepted for publication, with its associated data, in an institutional or subject open-access repository",
      "at the same time as publication",
      "a requirement on the researcher, not an optional right",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    countryCode: "IT",
    kind: "no-author-right",
    instrument: "Decreto-legge 91/2013, art. 4 (converted by legge 112/2013)",
    sourceUrl: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2013-08-08;91",
    statements: [
      "no statutory right for authors to self-archive",
      "the decree asks the public bodies that fund research to adopt open-access measures",
      "a bill creating a secondary-publication right was pending when this entry was drafted",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    countryCode: "JP",
    kind: "funding-policy",
    instrument:
      "Cabinet Office, national policy on open access to publicly funded scholarly publications and scientific data (February 2024)",
    sourceUrl: "https://www.lib.kyushu-u.ac.jp/en/services/open/mandate",
    statements: [
      "no statute: a government policy for publicly funded research",
      "immediate open access to peer-reviewed papers, accepted manuscripts included, and their underlying data",
      "applies to competitive grants from the FY2025 calls onwards, among them JSPS KAKENHI, JST strategic basic research programs and AMED",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
];

const BY_COUNTRY = new Map(STATUTORY_ARCHIVING.map((e) => [e.countryCode, e]));

/**
 * The entries for a work's affiliation countries, in the order the countries are
 * stored, one per country (codes compared upper-case); empty when SigmaCV has
 * none — which the worklist leaves silent rather than guessing.
 */
export function statutoryArchivingFor(
  countryCodes: readonly string[] | undefined,
): StatutoryArchivingEntry[] {
  const out: StatutoryArchivingEntry[] = [];
  for (const code of countryCodes ?? []) {
    const entry = BY_COUNTRY.get(code.trim().toUpperCase());
    if (entry && !out.includes(entry)) out.push(entry);
  }
  return out;
}
