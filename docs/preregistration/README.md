# Pre-registration & analysis plans

SigmaCV is also a research vehicle. Per the project charter and CLAUDE.md,
**confirmatory analyses on user-contributed data must be pre-registered** and
conducted under an ethics / IRB protocol. This directory holds the analysis
plans; no confirmatory analysis should run before its plan is registered (e.g.
on OSF) and the IRB protocol number recorded here.

All three studies use only data collected under **explicit, opt-in research
consent** (`User.researchConsent`, default off). Consent is versioned
(`researchConsentVersion` + `researchConsentAt`); withdrawal erases previously
collected `ResearchEvent` rows. See `/privacy` and `src/lib/research/`.

## Studies

### 1. Tool / infrastructure paper
- **Type:** descriptive (no confirmatory hypotheses); does not require user data.
- **Source:** the canonical-object + single-renderer-interface design itself.

### 2. Author-disambiguation-error study
- **Signal:** `disambiguation_assertion` events — "not mine" flips with a
  structured `reason`, the build-computed `reviewFlag`, `authoredBySelf`, and
  (planned) the identifier-match basis.
- **Plan:** _TODO — register before analysis._ Pre-specify error taxonomy,
  exposure (match basis), outcome (assertion), and the model.

### 3. Self-presentation / metric-norms study
- **Signal:** `composition_snapshot` events — template, citation style, locale,
  highlight, metrics shown, peer-reviewed-only, publication order, authorship
  table/roles, charts, fonts, and per-section visibility/order/counts.
- **Plan:** _TODO — register before analysis._ Pre-specify the composition
  features, covariates, and the confirmatory hypotheses.

## Checklist before any confirmatory analysis
- [ ] IRB protocol number recorded here
- [ ] OSF (or equivalent) pre-registration link recorded here
- [ ] Consent version(s) in scope documented
- [ ] Analysis script committed and frozen prior to data access
