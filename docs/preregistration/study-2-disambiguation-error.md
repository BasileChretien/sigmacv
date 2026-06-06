# Pre-registration — Study 2: Author-disambiguation errors in open scholarly data

> **Status: DRAFT TEMPLATE — not yet registered.** Complete the `‹…›`
> placeholders, then deposit on OSF (or equivalent), record the registration DOI
> and IRB number below, and freeze the analysis script BEFORE accessing data. No
> confirmatory analysis may run before this is registered. See
> [`README.md`](README.md) and the IRB protocol in [`../irb/`](../irb/).

## Administrative

| | |
|---|---|
| Title | ‹final title› |
| Authors | Basile Chrétien ‹+ co-authors› |
| IRB protocol № | ‹recorded after approval› |
| Consent version(s) in scope | ‹e.g. v1› (`researchConsentVersion`) |
| OSF registration DOI | ‹recorded at registration› |
| Analysis script (frozen) | ‹repo path + commit hash, committed before data access› |

## Background & rationale

Author identifiers (ORCID, OpenAlex author IDs) drive metric attribution, yet
they contain disambiguation errors (same-name collisions, split/merged
profiles). SigmaCV surfaces candidate misattributions and records users'
own "this isn't mine" corrections, giving a rare ground-truth-ish signal on
where and how author assignment fails. ‹State the gap this study fills.›

## Hypotheses (confirmatory)

State each as directional and falsifiable. _Placeholders — fill in your genuine
pre-analysis hypotheses._

- **H1.** ‹e.g. The rate of "not mine" assertions differs by match basis, being
  higher for `openalex-id`-only matches than for `orcid` matches.›
- **H2.** ‹e.g. Works carrying a `reviewFlag` (e.g. `orcid-conflict`) are more
  likely to be asserted "not mine" than unflagged works.›
- **H3.** ‹…›

Anything not listed here is **exploratory** and will be reported as such.

## Design

- **Type:** observational, within open-data + user-correction events. No
  intervention.
- **Unit of analysis:** ‹the (user, work) pair / the assertion event›.
- **Data source:** consent-gated `ResearchEvent` rows of type
  `disambiguation_assertion`, de-identified via the IRB export
  (`buildResearchExport`; subjects are HMAC pseudonyms, never user ids).

## Sampling & consent

- Population: SigmaCV users who opted into research logging
  (`User.researchConsent = true`) under the in-scope consent version(s).
- Logging master switch (`RESEARCH_LOGGING_ENABLED`) and the IRB export gate are
  OFF until approval; collection begins only after enabling under the approved
  protocol.
- Stopping rule / target N: ‹pre-specify, e.g. fixed analysis date or N
  assertions›.

## Variables (grounded in the logged signal)

- **Exposure:** `meta.matchBasis` ∈ {`orcid`, `openalex-id`, `both`, `claimed`};
  `meta.reviewFlag` (e.g. `orcid-conflict`); `authoredBySelf`.
- **Outcome:** `notMine` assertion (+ structured `notMineReason` ∈
  {`different-person`, `duplicate`, `wrong-field`, `other`}); the mirror
  false-negative signal from `claimed`/claim-by-DOI events.
- **Covariates:** work `year`, `type`, author count/position, OA status,
  field. ‹Specify exactly which.›

## Analysis plan

- **Primary model:** ‹e.g. mixed-effects logistic regression of assertion on
  match basis, random intercept by user›. State link, predictors, random
  effects, and how clustering is handled.
- **Inference criteria:** ‹α, correction for multiplicity, effect-size +
  CI reporting›.
- **Exclusions:** ‹duplicate events, test accounts, withdrawals erased per
  consent withdrawal›.
- **Missing data:** ‹approach›.
- **Robustness / sensitivity:** ‹pre-specified alternatives›.

## Ethics & data handling

GDPR + Japan APPI. Analyst works only from the de-identified dataset; the
re-identification key table (対照表) is held separately by the 個人情報管理者 and
is never shared with the analyst. Withdrawal erases the user's `ResearchEvent`
rows (and their key-table entry). No names, emails, or ORCIDs appear in the
analysis dataset.
