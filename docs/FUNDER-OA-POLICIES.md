# Funder open-access policy table — maintainer note

The table lives at `src/lib/funders/oaPolicies.ts`. It is **data, not scraping**: a short, hand-verified list of funders whose open-access policy is public and stable, keyed by FundRef DOI (`10.13039/…`), each with the policy URL on the funder's own domain, a few short factual phrases, and — once a maintainer has confirmed the entry against the live page — the date it was last checked.

The owner worklist ("Your grants and their open-access policies", editor-only) joins those phrases into one sentence and puts it beside what SigmaCV found for the work. The sentence depends on `verifiedBy`:

- `"maintainer"` (confirmed live; `lastVerified` is required): "_Funder_'s open-access policy, as recorded on _date_: …".
- `"maintainer-pending"` (written from memory, not yet checked; `lastVerified` is **absent** — the type forbids it and `tests/funder-oa-policies.test.ts` enforces the pairing): "_Funder_'s open-access policy, drafted from memory and not yet confirmed against the funder's site: …". Never "as recorded on" — a date on an unchecked entry would describe a check that never happened.

That is all it does. Whether the policy applies to a given work is the owner's judgement; the software never says so, never colours a row, never counts works "needing action", and nothing from this table reaches the public page, an export, the OAI feed or a frozen version (`tests/funders-not-public.test.ts`).

## Vocabulary

Every entry is tested (`tests/funder-oa-policies.test.ts`): the words compliant, non-compliant, overdue and mandate never appear in a name, URL or statement — write "asks for" / "requires" instead. Statements are short (≤ 160 characters), factual and in English; the ten-locale UI wraps them, it does not translate them.

## Entries awaiting live confirmation (`verifiedBy: "maintainer-pending"`)

The first version of the table was written from memory on a machine with no internet access, and every entry is still in this state: the owner sees the "drafted from memory and not yet confirmed" wording for all of them. **Before deploy, open each policy page, confirm the URL resolves on the funder's own domain and the statements still match, correct or drop what does not, then set `verifiedBy: "maintainer"` and add `lastVerified` (today's ISO date) — the two go together, and a pending entry must carry no date.** The test fails if a pending entry is missing from this list.

`effectiveFrom` is set only where the funder states a date (UKRI, Wellcome, NIH, Gates). ERC, the European Commission, ANR, FWF and NWO scope their policy by **call** ("from the 2021 / 2022 calls"), so those five carry no `effectiveFrom` — the call wording is in the statements — and a January-1 proxy must not be reintroduced.

| FundRef DOI             | Funder                               | Policy URL to confirm                                                                                                     | Points to check                                                                                                                     |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `10.13039/100014013`    | UK Research and Innovation (UKRI)    | https://www.ukri.org/publications/ukri-open-access-policy/                                                                | articles from 2022-04-01, CC BY (CC BY-ND by exception), VoR or AAM with no embargo; long-form outputs from 2024-01-01, ≤ 12 months |
| `10.13039/100010269`    | Wellcome                             | https://wellcome.org/grant-funding/guidance/open-access-guidance/open-access-policy                                       | articles submitted from 2021-01-01, CC BY, PMC / Europe PMC on publication                                                          |
| `10.13039/100000002`    | National Institutes of Health (NIH)  | https://sharing.nih.gov/public-access-policy                                                                              | 2024 policy; manuscripts accepted on or after 2025-07-01; AAM to PubMed Central; public on the date of publication                  |
| `10.13039/100000001`    | National Science Foundation (NSF)    | https://www.nsf.gov/public-access                                                                                         | deposit in NSF-PAR; confirm the current embargo terms (the entry deliberately states none) and add an `effectiveFrom` if stated     |
| `10.13039/501100000781` | European Research Council (ERC)      | https://erc.europa.eu/manage-your-project/open-science                                                                    | follows Horizon Europe terms; immediate OA, trusted repository, CC BY (NC / ND allowed for monographs)                              |
| `10.13039/501100000780` | European Commission (Horizon Europe) | https://research-and-innovation.ec.europa.eu/strategy/strategy-research-and-innovation/our-digital-future/open-science_en | the page may have moved; the Horizon Europe grant-agreement article on open science is the authoritative text                       |
| `10.13039/501100001665` | Agence Nationale de la Recherche     | https://anr.fr/fr/lanr/engagements/la-science-ouverte/                                                                    | Plan S from the 2022 calls; deposit in HAL; CC BY                                                                                   |
| `10.13039/100000865`    | Bill & Melinda Gates Foundation      | https://openaccess.gatesfoundation.org/                                                                                   | 2025 policy: preprint required under CC BY; APCs no longer paid from 2025                                                           |
| `10.13039/501100002428` | Austrian Science Fund (FWF)          | https://www.fwf.ac.at/en/research-funding/open-access-policy                                                              | Plan S from 2021; CC BY; repository deposit                                                                                         |
| `10.13039/501100003246` | Dutch Research Council (NWO)         | https://www.nwo.nl/en/open-science                                                                                        | Plan S from the 2021 calls; CC BY                                                                                                   |

## Candidates deliberately left out

Not included because a policy URL on the funder's own domain could not be stated with confidence offline. Add each only with a verified URL and a `lastVerified` date:

- **SNSF** (`10.13039/501100001711`) — Plan S aligned; the policy page carries an opaque path token.
- **Formas** (`10.13039/501100001862`), **FCT** (`10.13039/501100001871`) — cOAlition S members.
- **JSPS** (`10.13039/501100001691`), **JST** (`10.13039/501100002241`), **AMED** (`10.13039/100009619`) — Japan's Cabinet Office immediate-OA policy for competitive funding from FY2025 applies; cite each funder's own page, not the Cabinet Office's.
- **DFG** (`10.13039/501100001659`) — encourages rather than requires; include only if the wording is worth showing.

## Adding or updating an entry

1. Find the FundRef DOI (Crossref's funder registry, or OpenAlex `/funders/F…` → `ids.crossref`).
2. Open the policy page on the funder's own domain; write `policyUrl` exactly as it resolves.
3. Write up to eight short statements: what is asked for (immediate / embargo), licence, where (repository / journal), and from when ("applies to grants awarded from …"). Omit anything you are not sure of rather than guessing.
4. Set `effectiveFrom` only when the funder states a date; set `lastVerified` to today; `verifiedBy: "maintainer"`.
5. Run `npx vitest run tests/funder-oa-policies.test.ts` — it checks the DOI shape, the domain, the dates, the vocabulary and (for pending entries) this note.

The table is small on purpose. A funder that is not in it produces the sentence "SigmaCV has no policy record for _funder_." — which is the truth, and better than a guess.
