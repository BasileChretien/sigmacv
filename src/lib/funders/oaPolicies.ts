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
    policyUrl: "https://www.ukri.org/publications/ukri-open-access-policy/",
    effectiveFrom: "2022-04-01",
    statements: [
      "immediate open access for peer-reviewed research articles submitted from 1 April 2022",
      "CC BY licence (CC BY-ND by exception)",
      "either the version of record in the journal or the author accepted manuscript in a repository, with no embargo",
      "monographs, book chapters and edited collections published from 1 January 2024: open access within 12 months",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/100010269",
    name: "Wellcome",
    policyUrl:
      "https://wellcome.org/grant-funding/guidance/open-access-guidance/open-access-policy",
    effectiveFrom: "2021-01-01",
    statements: [
      "immediate open access for research articles submitted from 1 January 2021",
      "CC BY licence",
      "the article or its author accepted manuscript in PubMed Central / Europe PMC on publication, with no embargo",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/100000002",
    name: "National Institutes of Health (NIH)",
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
    policyUrl: "https://www.nsf.gov/public-access",
    statements: [
      "peer-reviewed journal articles and juried conference papers from NSF-funded work are deposited in the NSF Public Access Repository (NSF-PAR)",
      "the accepted manuscript or the version of record is deposited",
    ],
    verifiedBy: "maintainer-pending",
  },
  // ERC, the European Commission, ANR, FWF and NWO scope their policy by CALL,
  // not by date — so no `effectiveFrom` on any of the five; the call wording
  // lives in the statements.
  {
    fundrefDoi: "10.13039/501100000781",
    name: "European Research Council (ERC)",
    policyUrl: "https://erc.europa.eu/manage-your-project/open-science",
    statements: [
      "ERC grants follow the Horizon Europe open-access terms",
      "immediate open access for peer-reviewed publications",
      "deposit in a trusted repository, CC BY licence (CC BY-NC or CC BY-ND allowed for monographs)",
      "applies to grants under Horizon Europe (the 2021 calls onwards)",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/501100000780",
    name: "European Commission (Horizon Europe)",
    policyUrl:
      "https://research-and-innovation.ec.europa.eu/strategy/strategy-research-and-innovation/our-digital-future/open-science_en",
    statements: [
      "immediate open access for peer-reviewed publications from Horizon Europe grants (the 2021 calls onwards)",
      "deposit of the version of record or the author accepted manuscript in a trusted repository",
      "CC BY licence (CC BY-NC or CC BY-ND allowed for monographs)",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/501100001665",
    name: "Agence Nationale de la Recherche (ANR)",
    policyUrl: "https://anr.fr/fr/lanr/engagements/la-science-ouverte/",
    statements: [
      "immediate open access for publications from projects funded from the 2022 calls onwards (Plan S)",
      "deposit of the full text in HAL",
      "CC BY licence",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/100000865",
    name: "Bill & Melinda Gates Foundation",
    policyUrl: "https://openaccess.gatesfoundation.org/",
    effectiveFrom: "2025-01-01",
    statements: [
      "a preprint of every funded research article, immediately, under CC BY",
      "from 2025 the foundation no longer pays article processing charges",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/501100002428",
    name: "Austrian Science Fund (FWF)",
    policyUrl: "https://www.fwf.ac.at/en/research-funding/open-access-policy",
    statements: [
      "immediate open access for peer-reviewed publications from the 2021 calls onwards (Plan S)",
      "CC BY licence",
      "deposit in a repository",
    ],
    verifiedBy: "maintainer-pending",
  },
  {
    fundrefDoi: "10.13039/501100003246",
    name: "Dutch Research Council (NWO)",
    policyUrl: "https://www.nwo.nl/en/open-science",
    statements: [
      "immediate open access for publications from calls from 2021 onwards (Plan S)",
      "CC BY licence",
    ],
    verifiedBy: "maintainer-pending",
  },
];

const BY_DOI = new Map(FUNDER_OA_POLICIES.map((p) => [p.fundrefDoi.toLowerCase(), p]));

/** The recorded policy for a FundRef DOI, or undefined when SigmaCV has none. */
export function funderOaPolicy(fundrefDoi: string | undefined): FunderOaPolicy | undefined {
  return fundrefDoi ? BY_DOI.get(fundrefDoi.trim().toLowerCase()) : undefined;
}
