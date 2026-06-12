# Pre-registration — Study 3: Self-presentation & metric norms in researcher CVs

> **Status: DRAFT v1.0 — pending PI review, IRB approval, and OSF registration.**
> Hypotheses and analysis choices below were drafted for the PI to confirm or
> amend; they become binding only at OSF registration. Record the registration
> DOI and IRB number below, and freeze the analysis script BEFORE accessing
> data. No confirmatory analysis may run before this is registered. See
> [`README.md`](README.md) and the IRB protocol in [`../irb/`](../irb/).

## Administrative

|                             |                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Title                       | Metrics by choice: self-presentation decisions in researcher CVs built from open data |
| Authors                     | Basile Chrétien ‹+ co-authors TBC at registration›                                    |
| IRB protocol №              | ‹recorded after approval›                                                             |
| Consent version(s) in scope | v1 (`researchConsentVersion = 1`; bumped version restarts scope)                      |
| OSF registration DOI        | ‹recorded at registration›                                                            |
| Analysis script (frozen)    | `analysis/study3/` + commit hash, committed before data access                        |

## Background & rationale

How researchers choose to present themselves — which metrics they show, how they
order and curate works, whether they highlight their own name — reflects and
shapes assessment norms. SigmaCV's composition choices are an unobtrusive measure
of these decisions across a multinational, multi-disciplinary user base.
**Gap:** the research-assessment reform debate (DORA, CoARA, Leiden Manifesto)
is rich in institutional position statements but poor in **revealed-preference
evidence from researchers themselves**. Surveys measure stated attitudes; CVs
submitted to specific calls are constrained by the call. A CV builder in which
every metric is strictly opt-in and field-normalized alternatives sit beside
the h-index at equal cost observes what researchers _choose_ when the tool
imposes no default — a direct behavioural read on how far reform norms have
travelled.

## Hypotheses (confirmatory)

- **H1 (restraint).** Among actively-composed CVs (defined in Exclusions),
  **fewer than 50%** display ANY author-level metric — i.e., when metrics are
  a free opt-in rather than a platform default, restraint is the majority
  choice.
- **H2 (norm persistence).** Among CVs that display at least one metric, the
  **h-index is selected at least as often as either field-normalized
  indicator** (FWCI mean, iCite RCR mean) — i.e., the legacy norm persists
  even when DORA-aligned alternatives are equally available and the UI's
  one-click "responsible metrics" preset selects only the field-normalized
  set. (Directional: h-index selection proportion ≥ each field-normalized
  indicator's proportion.)
- **H3 (early-career signalling).** The probability of displaying any metric
  **decreases with career age** (proxied by years since first publication):
  earlier-career researchers, facing more evaluation events, are more likely
  to show metrics.

Anything not listed here is **exploratory** and reported as such — including
locale/field composition differences, template and citation-style choices,
self-name highlighting, peer-reviewed-only filtering, authorship-table use,
and longitudinal change across snapshots.

## Design

- **Type:** observational, cross-sectional at the analysis cutoff
  (longitudinal change across a user's snapshots is exploratory).
- **Unit of analysis:** one user's CV composition, taken as the **last**
  `composition_snapshot` before the cutoff.
- **Data source:** consent-gated `ResearchEvent` rows of type
  `composition_snapshot` (the minimized `diff.ts` signal, not raw documents),
  de-identified via the IRB export.

## Sampling & consent

- Population: users who opted into research logging under consent version v1;
  collection only after the master switch + IRB export gate are enabled under
  the approved protocol.
- **Stopping rule / target N:** analysis cutoff at the EARLIER of (a) 12
  months after logging is enabled, or (b) the first month-end with ≥ 300
  consenting users having ≥ 1 actively-composed snapshot. If fewer than 100
  such users exist at the deadline, H1–H3 are reported as exploratory only.

## Variables (grounded in the logged signal)

- **Composition outcomes:** `showMetrics` ∧ `metricsShown ≠ ∅` (H1, H3);
  membership of `h_index`, `fwci_mean`, `rcr_mean` in `metricsShown` (H2).
- **Covariates:** career age = cutoff year − first-publication year (from the
  logged per-section year summaries; exact derivation frozen in the analysis
  script); productivity proxy = included-publication count; CV `locale`;
  template. No other covariates in confirmatory models.
- **Active-choice marker:** a snapshot counts as **actively composed** when it
  differs from the build defaults in at least one display field OR follows ≥ 1
  curation event by the same user — distinguishing a decision from an
  untouched default, per the pre-specified rule frozen with the script.

## Analysis plan

- **H1:** one-sample exact binomial test of P(any metric shown) < 0.5 over
  actively-composed CVs; report the proportion with Wilson 95% CI.
- **H2:** among metric-displaying CVs, pairwise McNemar tests of h-index
  selection vs each field-normalized indicator (paired within CV); H2 is
  confirmed if the h-index proportion is ≥ both, with neither McNemar test
  contradicting at the corrected α.
- **H3:** logistic regression of any-metric display on career age (per 5
  years), adjusted for productivity proxy and locale group; report OR + 95% CI.
- **Inference criteria:** two-sided α = 0.05, Holm correction across the
  three hypothesis families; effect sizes + CIs throughout.
- **Exclusions:** defaults-only CVs (fail the active-choice marker) are
  excluded from H1–H3 (their share is reported descriptively); maintainer/test
  accounts per the frozen exclusion file; withdrawn users (rows erased).
- **Missing data / robustness (pre-specified):** complete-case primary;
  sensitivity (i) including defaults-only CVs in H1's denominator,
  (ii) using the FIRST snapshot instead of the last, (iii) excluding the
  maintainer's institutional networks' locale group if it exceeds 50% of the
  sample (early-adopter skew).

## Ethics & data handling

GDPR + Japan APPI. De-identified analysis dataset only; separate key table held
by the 個人情報管理者; withdrawal erases the user's rows. No direct identifiers in
the analysis data. Composition snapshots are the minimized `diff.ts` signal, not
raw documents.
