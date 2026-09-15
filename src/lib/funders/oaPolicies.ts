/**
 * Funder open-access policies — a committed, hand-verified DATA table keyed by
 * FundRef DOI. Never scraped, never inferred: every entry links the policy on
 * the funder's own domain and carries a few short factual phrases the owner
 * worklist joins into one sentence. The sentence sits beside what SigmaCV
 * found for the work; whether the policy applies to that work is the owner's
 * judgement, not the software's — so the vocabulary of a verdict (compliant,
 * non-compliant, overdue, mandate) is banned here by test.
 *
 * Two kinds of entry, told apart by `verifiedBy`, and the worklist words them
 * differently:
 *  - `"maintainer"` — checked against the live policy page on `lastVerified`;
 *    the sentence says "as recorded on <date>".
 *  - `"maintainer-pending"` — written from memory on a machine with no
 *    internet access and NOT yet confirmed; it carries NO `lastVerified` (the
 *    type forbids one, and `tests/funder-oa-policies.test.ts` enforces the
 *    pairing), and the sentence says so: "drafted from memory and not yet
 *    confirmed against the funder's site". Never "as recorded on".
 *
 * Maintenance: `docs/FUNDER-OA-POLICIES.md` lists every pending entry for the
 * maintainer to confirm against the live page before deploy.
 */

interface FunderOaPolicyBase {
  /** FundRef DOI, `10.13039/<digits>` — the join key. */
  fundrefDoi: string;
  name: string;
  /** The policy on the funder's own domain (https). */
  policyUrl: string;
  /**
   * ISO date the current terms took effect — set ONLY when the funder states
   * a date. A funder that scopes its policy by call ("from the 2021 calls")
   * gets no `effectiveFrom`: the call wording stays in `statements`, and a
   * January-1 proxy would be a date the funder never said.
   */
  effectiveFrom?: string;
  /** Short factual phrases, joined with "; " in the sentence. */
  statements: string[];
}

/** Confirmed against the live policy page on `lastVerified`. */
interface FunderOaPolicyVerified extends FunderOaPolicyBase {
  verifiedBy: "maintainer";
  /** ISO date the entry was last checked against the policy page. */
  lastVerified: string;
}

/** Written from memory, not yet confirmed — no verification date exists. */
interface FunderOaPolicyPending extends FunderOaPolicyBase {
  verifiedBy: "maintainer-pending";
  lastVerified?: never;
}

export type FunderOaPolicy = FunderOaPolicyVerified | FunderOaPolicyPending;

export const FUNDER_OA_POLICIES: readonly FunderOaPolicy[] = [
  {
    fundrefDoi: "10.13039/100014013",
    name: "UK Research and Innovation (UKRI)",
    // The policy page (updated 22 June 2026) gives both dates; UKRI's guidance
    // pages for research articles (26 August 2026) and for monographs, book
    // chapters and edited collections (7 July 2026) give the rest.
    policyUrl: "https://www.ukri.org/publications/ukri-open-access-policy/",
    effectiveFrom: "2022-04-01",
    statements: [
      "peer-reviewed research articles submitted for publication on or after 1 April 2022: immediately open access, with no embargo",
      "either the version of record in the journal or the author accepted manuscript in a repository at final publication",
      "a CC BY licence (CC BY-ND by exception)",
      "monographs, book chapters and edited collections published on or after 1 January 2024: open access within 12 months, CC BY preferred",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/100010269",
    name: "Wellcome",
    // Read in a browser on 2026-09-15 (the page says "Last updated: 2 January
    // 2025"); wellcome.org refuses automated reading. No effective date is stated.
    policyUrl:
      "https://wellcome.org/research-funding/guidance/ending-a-grant/open-access-guidance/open-access-policy",
    statements: [
      "original research it funds freely available from Europe PMC on publication",
      "a CC BY licence (CC BY-ND by exception)",
      "the Version of Record or the Author Accepted Manuscript in Europe PMC; an accepted manuscript is self-archived through Europe PMC plus",
      "a data availability statement",
      "monographs and book chapters: an embargo of up to 6 months",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/100000002",
    name: "National Institutes of Health (NIH)",
    // Still unconfirmed: sharing.nih.gov and grants.nih.gov put a bot check in
    // front of automated readers (2026-09-15). Confirm it by hand.
    policyUrl: "https://sharing.nih.gov/public-access-policy",
    effectiveFrom: "2025-07-01",
    statements: [
      "2024 NIH Public Access Policy",
      "applies to manuscripts accepted for publication on or after 1 July 2025",
      "the author accepted manuscript is submitted to PubMed Central",
      "publicly available in PubMed Central on the official date of publication, with no embargo",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/100000001",
    name: "National Science Foundation (NSF)",
    // The page (updated 18 September 2025) states no version and no embargo, so
    // neither does the entry.
    policyUrl: "https://www.nsf.gov/public-access",
    statements: [
      "NSF awardees deposit all peer-reviewed publications and juried conference papers in the NSF Public Access Repository (NSF-PAR)",
      "policy: NSF Public Access Plan 2.0, for open, immediate and equitable access to NSF-funded research",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  // ERC, the European Commission, ANR, FWF and NWO scope their terms by
  // programme, project or call rather than by one date: the scope is in the
  // statements, and no January-1 `effectiveFrom` stands in for it.
  {
    fundrefDoi: "10.13039/501100000781",
    name: "European Research Council (ERC)",
    policyUrl: "https://erc.europa.eu/manage-your-project/open-science",
    statements: [
      "ERC grants under Horizon Europe (2021–2027) follow its open-access terms",
      "at publication, peer-reviewed publications deposited immediately in open access in a trusted repository",
      "CC BY or equivalent (long-text publications may exclude commercial use or derivative works)",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/501100000780",
    name: "European Commission (Horizon Europe)",
    // The Commission's own open-science page carries no terms; the page of its
    // research executive agency does.
    policyUrl: "https://rea.ec.europa.eu/open-science_en",
    statements: [
      "applies to Horizon Europe grants",
      "peer-reviewed publications in open access, the final version or the peer-reviewed manuscript deposited in a trusted repository",
      "journal articles under CC BY or an equivalent licence; long texts may also use CC BY-NC or CC BY-ND",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/501100001665",
    name: "Agence Nationale de la Recherche (ANR)",
    // Read in French; the page was updated on 6 November 2023.
    policyUrl: "https://anr.fr/fr/lanr/engagements/la-science-ouverte/",
    statements: [
      "projects funded from 2022: publications in immediate open access under CC BY or equivalent",
      "the full text (accepted manuscript or publisher's version) deposited in HAL, at the latest at publication",
      "a subscription journal is possible through the rights retention strategy",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/100000865",
    name: "Gates Foundation",
    policyUrl: "https://openaccess.gatesfoundation.org/open-access-policy/",
    effectiveFrom: "2025-01-01",
    statements: [
      "all published research it funds, in whole or in part, from 1 January 2025",
      "a preprint on a recognised preprint server, available immediately without embargo under CC BY 4.0",
      "accepted articles deposited on publication in PubMed Central or another openly accessible repository",
      "underlying data accessible immediately and as open as possible",
      "the foundation does not pay article processing charges",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/501100002428",
    name: "Austrian Science Fund (FWF)",
    policyUrl:
      "https://www.fwf.ac.at/en/about-us/what-we-do/open-science/open-access-policy/open-access-policy-for-peer-reviewed-publications",
    statements: [
      "peer-reviewed publications from FWF projects approved after 31 December 2020",
      "open access at publication: an open access journal, a transformative agreement, or self-archiving with no embargo",
      "a CC BY licence or an equivalent free licence (CC BY-ND only in exceptional cases the FWF approves)",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
  {
    fundrefDoi: "10.13039/501100003246",
    name: "Dutch Research Council (NWO)",
    policyUrl: "https://www.nwo.nl/en/open-access-publishing",
    statements: [
      "all NWO calls published since 1 January 2021 (Plan S)",
      "scholarly articles in open access immediately at publication, without embargo",
      "a CC BY licence (CC BY-ND in exceptional cases)",
      "routes: a fully open access journal, a transformative agreement, or immediate deposit in an open access repository",
    ],
    verifiedBy: "maintainer",
    lastVerified: "2026-09-15",
  },
];

const BY_DOI = new Map(FUNDER_OA_POLICIES.map((p) => [p.fundrefDoi.toLowerCase(), p]));

/** The recorded policy for a FundRef DOI, or undefined when SigmaCV has none. */
export function funderOaPolicy(fundrefDoi: string | undefined): FunderOaPolicy | undefined {
  return fundrefDoi ? BY_DOI.get(fundrefDoi.trim().toLowerCase()) : undefined;
}
