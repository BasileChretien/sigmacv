# Pre-registration — Study 3: Self-presentation & metric norms in researcher CVs

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

How researchers choose to present themselves — which metrics they show, how they
order and curate works, whether they highlight their own name — reflects and
shapes assessment norms. SigmaCV's composition choices are an unobtrusive measure
of these decisions across a multinational, multi-disciplinary user base.
‹State the gap this study fills and its relevance to responsible-assessment
(DORA/CoARA) debates.›

## Hypotheses (confirmatory)

_Placeholders — fill in your genuine pre-analysis hypotheses._

- **H1.** ‹e.g. Opting to display any author-level metric is associated with
  ‹career stage / field / metric value›.›
- **H2.** ‹e.g. Field-normalized metrics are chosen over the h-index more often
  by ‹group›.›
- **H3.** ‹…›

Anything not listed here is **exploratory** and reported as such.

## Design

- **Type:** observational, cross-sectional (optionally longitudinal across edits).
- **Unit of analysis:** ‹the user's CV composition / a composition snapshot›.
- **Data source:** consent-gated `ResearchEvent` rows of type
  `composition_snapshot`, de-identified via the IRB export.

## Sampling & consent

- Population: users who opted into research logging under the in-scope consent
  version(s); collection only after the master switch + IRB export gate are
  enabled under the approved protocol.
- Stopping rule / target N: ‹pre-specify›.

## Variables (grounded in the logged signal)

- **Composition features:** `template`, `cslStyle`, `locale`, `highlightSelf` +
  `highlightStyle`, `showMetrics` + which `metrics`, `peerReviewedOnly`,
  `countLetters`, `publicationOrder`, `publicationsLimit`,
  `showAuthorshipTable` + `authorshipRoles`, `showCharts`, `showCitationCounts`,
  `showOpenAccess`, fonts/density, and per-section visibility/order/counts.
- **Covariates (as available + consented):** field, career stage proxy
  (first-publication year), productivity/citation summaries, country/locale.
  ‹Specify exactly which, and their source.›
- **Outcome(s):** ‹the composition choice(s) under test in each hypothesis›.

## Analysis plan

- **Primary model(s):** ‹e.g. logistic/multinomial regression per choice;
  state predictors and how multiple choices are handled›.
- **Inference criteria:** ‹α, multiplicity correction, effect sizes + CIs›.
- **Exclusions:** ‹defaults-only CVs (never edited), test accounts, withdrawals›.
  Note: distinguishing an active choice from an untouched default must be
  pre-specified.
- **Missing data / robustness:** ‹approach + pre-specified sensitivity analyses›.

## Ethics & data handling

GDPR + Japan APPI. De-identified analysis dataset only; separate key table held
by the 個人情報管理者; withdrawal erases the user's rows. No direct identifiers in
the analysis data. Composition snapshots are the minimized `diff.ts` signal, not
raw documents.
