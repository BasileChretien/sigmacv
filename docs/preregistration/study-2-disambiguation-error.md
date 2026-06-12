# Pre-registration — Study 2: Author-disambiguation errors in open scholarly data

> **Status: DRAFT v1.0 — pending PI review, IRB approval, and OSF registration.**
> Hypotheses and analysis choices below were drafted for the PI to confirm or
> amend; they become binding only at OSF registration. Record the registration
> DOI and IRB number below, and freeze the analysis script BEFORE accessing
> data. No confirmatory analysis may run before this is registered. See
> [`README.md`](README.md) and the IRB protocol in [`../irb/`](../irb/).

## Administrative

|                             |                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Title                       | Where author identifiers fail: user-asserted misattribution corrections in open scholarly data |
| Authors                     | Basile Chrétien ‹+ co-authors TBC at registration›                                             |
| IRB protocol №              | ‹recorded after approval›                                                                      |
| Consent version(s) in scope | v1 (`researchConsentVersion = 1`; bumped version restarts scope)                               |
| OSF registration DOI        | ‹recorded at registration›                                                                     |
| Analysis script (frozen)    | `analysis/study2/` + commit hash, committed before data access                                 |

## Background & rationale

Author identifiers (ORCID, OpenAlex author IDs) drive metric attribution, yet
they contain disambiguation errors (same-name collisions, split/merged
profiles). SigmaCV surfaces candidate misattributions and records users'
own "this isn't mine" corrections, giving a rare ground-truth-ish signal on
where and how author assignment fails. **Gap:** existing disambiguation
evaluations rely on gold sets built by third-party annotators over small or
field-specific corpora; author-validated error signals at the level of the
live, multinational open record are essentially absent. This study uses the
account holder's own assertion — the most authoritative available judge of
"is this work mine?" — to estimate _where_ identifier-based attribution fails
(by match basis, by heuristic flag, and by work characteristics), informing
both metric reliability debates and the design of curation interfaces.
(Companion descriptive context, no overlap in hypotheses: the namesake-burden
benchmark in the SigmaCV tool paper.)

## Hypotheses (confirmatory)

Each is directional and falsifiable; the logged signal that operationalizes it
is named in Variables.

- **H1 (match strength).** The probability that a work is asserted "not mine"
  is **higher for works matched by `openalex-id` only** than for works whose
  matched authorship carries the user's ORCID (`orcid` or `both`). Rationale:
  the ORCID-carrying authorship embeds an author-side claim; inferred
  OpenAlex-only clustering does not.
- **H2 (heuristic validity).** Works carrying the build's advisory
  `reviewFlag = "orcid-conflict"` (an own work whose authorship lists a
  DIFFERENT ORCID) are **more likely to be asserted "not mine"** than
  unflagged identifier-matched works — i.e., the deployed heuristic has
  positive predictive signal.
- **H3 (collision surface).** Among identifier-matched works, the probability
  of a "not mine" assertion **increases with the number of authors** on the
  work (larger author lists create more same-name collision surface for
  clustering errors).

Anything not listed here is **exploratory** and will be reported as such —
including: reason-code composition (`notMineReason`), the false-negative
mirror signal (claim-by-DOI / `claimed` additions), year/field/OA patterns,
and any cross-locale differences.

## Design

- **Type:** observational, within open-data + user-correction events. No
  intervention.
- **Unit of analysis:** the (user, work) pair, i.e. one identifier-matched
  work in one consenting user's CV; the outcome is whether it ever receives a
  "not mine" assertion during the observation window.
- **Data source:** consent-gated `ResearchEvent` rows of type
  `disambiguation_assertion` (assertions and retractions), joined to the
  per-work exposure fields captured in the same minimized event payloads
  (`diff.ts` signals), de-identified via the IRB export
  (`buildResearchExport`; subjects are HMAC pseudonyms, never user ids).

## Sampling & consent

- Population: SigmaCV users who opted into research logging
  (`User.researchConsent = true`) under consent version v1.
- Logging master switch (`RESEARCH_LOGGING_ENABLED`) and the IRB export gate
  are OFF until approval; collection begins only after enabling under the
  approved protocol.
- **Stopping rule / target N:** data collection closes at the EARLIER of
  (a) 12 months after the logging switch is enabled, or (b) the first month-end
  at which ≥ 150 consenting users have ≥ 1 disambiguation assertion event.
  A simulation-based sensitivity check (frozen with the analysis script)
  documents the detectable odds-ratio range at the achieved N; if fewer than
  30 users contribute assertions at the deadline, all analyses are reported
  as exploratory (no confirmatory claims).

## Variables (grounded in the logged signal)

- **Exposure:** `meta.matchBasis` ∈ {`orcid`, `openalex-id`, `both`,
  `claimed`} (H1 contrast: `openalex-id` vs {`orcid`,`both`}; `claimed` works
  are excluded from H1–H3 — ownership was user-asserted, so misattribution by
  the matcher is undefined); `meta.reviewFlag` = `orcid-conflict` vs none
  (H2); `meta.authorCount` (H3, per +1 author, log-scaled).
- **Outcome:** a `notMine` assertion (retracted assertions are counted per the
  rule pre-specified in Exclusions); structured `notMineReason` ∈
  {`different-person`, `duplicate`, `wrong-field`, `other`} is exploratory.
- **Covariates (all models):** publication `year` (decade-centred), work
  `type` (article vs other), `meta.authorPosition` of the matched authorship
  (first/last vs middle), `meta.oaIsOpen`. No other covariates.

## Analysis plan

- **Primary model:** mixed-effects logistic regression of the "not mine"
  outcome on match basis (H1), review flag (H2), and log author count (H3),
  plus the covariates above, with a **random intercept per user** (pseudonym)
  to handle within-user clustering. Logit link; one model, three pre-specified
  coefficient tests.
- **Inference criteria:** two-sided α = 0.05 with **Holm correction across
  H1–H3**; report odds ratios with 95% CIs and the random-intercept variance.
  Directionality must match the hypothesis for confirmation.
- **Exclusions:** (a) maintainer/test accounts (pseudonyms of accounts listed
  in the frozen exclusion file); (b) withdrawn users (rows already erased per
  consent withdrawal); (c) duplicate events for the same (user, work): the
  LAST event in the window decides the outcome (an assert later retracted
  counts as no assertion — the user corrected themselves); (d) `claimed`
  works (see Exposure).
- **Missing data:** complete-case for covariates with missingness reported per
  variable; sensitivity model dropping each covariate with > 20% missingness.
- **Robustness / sensitivity (pre-specified):** (i) refit treating an
  ever-asserted (even-if-retracted) outcome as positive; (ii) refit excluding
  users with > 500 works (mega-profile robustness); (iii) cluster-robust GLM
  without random effects.

## Ethics & data handling

GDPR + Japan APPI. Analyst works only from the de-identified dataset; the
re-identification key table (対照表) is held separately by the 個人情報管理者 and
is never shared with the analyst. Withdrawal erases the user's `ResearchEvent`
rows (and their key-table entry). No names, emails, or ORCIDs appear in the
analysis dataset.
