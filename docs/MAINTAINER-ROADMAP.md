# Maintainer roadmap — growth, research, sustainability

> **Audience:** Basile (sole maintainer). This is the _non-code_ to-do list — the
> things only a human with an inbox, an IRB office, and a community can do.
> Product/engineering work has its own tracks (CHANGELOG, roadmap docs); this
> file deliberately contains almost none of it. Drafted 2026-06-11.
>
> Companion docs: [`OUTREACH.md`](OUTREACH.md) (ready-to-use outreach kit),
> [`DISCOVERABILITY-ROADMAP.md`](DISCOVERABILITY-ROADMAP.md) (SEO/GEO — largely
> executed), [`OPEN-SCIENCE-ROADMAP-2.md`](OPEN-SCIENCE-ROADMAP-2.md) (FAIR —
> complete), `docs/preregistration/` (study 2 & 3 templates).

**The one-paragraph strategy.** The code is in good shape and live; the binding
constraints are now (1) **users** — papers 2 and 3 are adoption-gated, and the
viral loop (public CVs) needs seed traffic; (2) the **research programme's slow
external clocks** — IRB review and the P1 submission take months and should
start now, in parallel with growth, not after it; (3) **sustainability** — a
solo-maintained live service with a research programme attached needs a second
pair of hands and a funding line before it needs any new feature.

Legend: 🔴 do this week · 🟠 this month · 🟡 this quarter · 🔁 recurring.

---

## 1. Growth & adoption

The SEO/GEO foundation is built (guides, glossary, persona pages, llms.txt,
9-market landing pages). What's missing is **distribution through humans** —
academic trust networks, not ads.

### 1a. Librarian / institutional channel (highest yield)

- 🔴 **Reply-thread Laurent Jonchère (HAL-Rennes)** — he gave feedback that
  became a shipped feature (PR #115) and was told to re-sync. Ask him directly:
  would HAL-Rennes mention SigmaCV in its researcher-support pages, newsletter,
  or a training session? Offer a 20-minute demo call. One library endorsement
  outperforms months of SEO and is replicable evidence for the next library.
- 🟠 **Execute `OUTREACH.md` systematically**: research-support / scholarly-
  communication mailing lists (LIBER, EAHIL for health-science libraries —
  your domain), DORA and CoARA signatory networks (responsible-metrics CVs are
  the differentiator they care about), and the OpenAlex user group (they
  showcase tools built on their data). Track sends/replies in a simple sheet —
  treat it like a pharmacovigilance follow-up log: every contact gets exactly
  one polite follow-up after ~2 weeks.
- 🟡 **One conference presence**: a poster or tool-demo at an open-science /
  scientometrics venue (e.g. STI/ENID, FORCE11, OAI workshop, or a national
  open-science day in FR/JP). The P1 preprint is the abstract. Archive the
  poster on Zenodo so it has a DOI and a link back.

### 1b. Community / direct channels

- 🟠 **One honest "I built this" post** in each of: r/AskAcademia (or r/PhD),
  academic Bluesky, Mastodon (fediscience/scholar instances). Lead with the
  problem ("your CV is already public — ORCID + OpenAlex can write it for
  you"), not the product. Time it to a re-sync-digest or P1-preprint moment so
  there's news value. Expect one of the three to outperform; double down there.
- 🟠 **Product Hunt**: the kit is merged (PRs #105/#106). If the launch hasn't
  fired, schedule it for a Tuesday; expect modest yield (wrong audience) but
  free backlinks. Don't spend more than the prepared kit on it.
- 🟡 **Use your own networks**: Nagoya international-education colleagues
  (every incoming researcher needs a CV), the Caen pharmacology group
  (Dolladille/Fedrizzi co-author network), and your own email signature +
  paper bylines pointing at sigmacv.org.

### 1c. Retention loop (the missing product piece — code, queued)

- The **re-sync digest email** ("your last sync found 2 new publications and
  1 review candidate") is the single highest-leverage growth feature not yet
  built. The data side now exists (`Cv.lastSyncReport`, shipped 2026-06).
  🧑‍💻 Code task for a future session: opt-in email per user, monthly cron,
  unsubscribe link, SMTP already configured for auth mail.
- 🔁 **Watch the funnel monthly** (Plausible + Metabase): visit → sign-in →
  sync complete → export/publish → return visit. The sign-in and publish-nudge
  events exist (PR #97). Decide one improvement per month from the worst step —
  don't add features anywhere else in the funnel.

### 1d. What NOT to do

No paid ads, no consumer-growth features that compromise the research design,
no new data sources for growth's sake, no second SEO wave until the human
channels have been worked. The public-CV attribution footer is the compounding
asset; everything above is about seeding it.

---

## 3. Research programme

Two principles: **start the slow clocks now** (IRB + journal review run in
months), and **never gate P1 on adoption** (it's an infrastructure paper).

### 3a. Paper 1 (tool/infrastructure → QSS)

- 🔴 **Commit the benchmark work** sitting uncommitted in the working tree
  (`scripts/benchmark-namesake-ambiguity.ts`, `docs/paper/benchmark/`, the
  draft edits). It contains the strongest novel result (namesake burden:
  E-Asian median 13 vs Anglophone 2) and is currently protected by nothing.
- 🔴 **Decide co-authors** (your call, flagged open since June): solo vs
  inviting e.g. Dolladille for the quantitative section. Decide venue order:
  QSS first; fallback PLOS ONE / JASIST.
- 🟠 **Mint the version DOI**: cut the tagged release so Zenodo deposits it,
  write the DOI back into `CITATION.cff` / `.zenodo.json` / README (the
  documented one-time release task), and cite that DOI in the paper.
- 🟠 **Preprint immediately on submission** (SocArXiv or arXiv cs.DL) — the
  preprint _is_ the outreach asset for §1.
- 🟡 After acceptance: update the citing metadata everywhere; notify the
  registries (bio.tools, FAIRsharing/RSD when their IDs arrive).

### 3b. Papers 2 & 3 (disambiguation errors; self-presentation) — IRB first

- 🔴 **Finish the pre-registration placeholders** in
  `docs/preregistration/study-2-*.md` and `study-3-*.md` — they are the actual
  blocker for everything downstream. Freeze hypotheses, outcomes, and the
  analysis plan; pick the minimal event set (already implemented in
  `research/diff.ts`).
- 🟠 **Submit the Nagoya IRB application** (観察研究専門審査委員会 route, one
  observational protocol covering both studies, electronic informed consent —
  the parameters are already worked out in your IRB notes). Confirm the
  研究責任者 (faculty PI) — that conversation is the long pole; have it now.
- 🟠 **Register both studies on OSF** once the IRB number exists; record IRB №
  - OSF DOIs in the repo; freeze the analysis scripts before any data.
- 🟡 **Only then**: set `RESEARCH_LOGGING_ENABLED`, bump
  `RESEARCH_CONSENT_VERSION` (forced re-consent under approved terms), and let
  data accrue. The consent gate and de-identified export pipeline are already
  built and audited — do not touch them before approval.
- 🔁 While waiting: every adoption action in §1 is also a sample-size action
  for P2/P3. Nothing else to do here — by design.

### 3c. Sigma-Score (the namesake debt)

- 🟡 Decide: either give Sigma-Score a short methods preprint of its own
  (definition, rationale vs FWCI/RCR, worked examples — it currently ships as
  an opt-in metric with no citable definition), or rename the project before
  the brand accretes further. Keeping an eponymous, undefined metric in a
  responsible-metrics tool is the one internal inconsistency a reviewer will
  poke.

---

## 5. Sustainability

The real long-term risk isn't code quality (audited, 98%+ coverage gate, green
CI); it's **bus factor 1** plus **funding = your wallet**.

### 5a. Funding (apply while the FAIR work is fresh)

- 🟠 **CZI EOSS** (Essential Open Source Software for Science) — SigmaCV is a
  textbook fit: open infrastructure for research assessment, DORA-aligned,
  Zenodo DOI, RRID, OpenSSF badge — exactly what their reviewers score. Watch
  for the next cycle and prepare the 2-page proposal from the README +
  `OPEN-SCIENCE.md` (a session of work, mostly assembly).
- 🟠 **NLnet / NGI Zero Commons** — EU-hosted, GDPR-exemplary, open source;
  small grants (€5–50k), lightweight application (a web form). This one is low
  effort — apply this month. Covers the VPS for years and could fund a paid
  accessibility audit.
- 🟡 Second ring: OpenAIRE open calls, Invest in Open Infrastructure, Mozilla
  Technology Fund; and institutional in-kind support (Nagoya or UNICAEN
  hosting/credits — ask, the FAIR portfolio makes it an easy yes).
- 🔁 Put grant deadlines in the calendar; one application per quarter max —
  this must not crowd out the papers.

### 5b. Bus factor & community

- 🟠 **Make the repo contributor-ready**: 5–10 `good-first-issue`s (there are
  real ones: i18n key additions, template tweaks, a11y fixes), a CONTRIBUTING
  pass that says how to get a dev environment in 15 minutes, and a "looking
  for a co-maintainer" line in the README.
- 🟡 **Recruit one co-maintainer** from wherever §1 outreach bites (the
  CoARA/OpenAlex communities are full of research-software engineers). This
  also unblocks the deferred OpenSSF _silver_ badge, which requires a second
  maintainer.
- 🟡 **Write the continuity note**: one page (private repo or password
  manager) saying what dies when you stop paying the VPS, where backups live,
  and how a successor would redeploy (now §9 of `SERVER-RUNBOOK.md`) +
  data-handover terms consistent with the privacy policy.

### 5c. Operational hygiene (mostly done — keep it boring)

- 🔁 Monthly: backup test-restore (§2 of the runbook), offsite freshness,
  dependency PRs (Dependabot), `docker compose pull` base-image refresh.
- 🔁 Per OEP dataset release (~yearly): rebuild seed + `npm run oep:import`.
- ⏳ Pending external replies (no action until they arrive): FAIRsharing /
  SciCrunch / RSD registry IDs → wire into CITATION.cff; Barcelona Declaration
  supporter listing; EPO OPS credential validation (reminder set 2026-06-15) →
  set `EPO_OPS_KEY/SECRET` in prod to wake the Patents section.

---

## Sequencing cheat-sheet (first 4 weeks)

| Week | Growth (§1)                                 | Research (§3)                            | Sustainability (§5)                   |
| ---- | ------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| 1    | Email Laurent (library ask)                 | Commit benchmark; decide P1 co-authors   | —                                     |
| 2    | First 5 outreach emails from OUTREACH.md    | Finish pre-registration placeholders     | NLnet application                     |
| 3    | First community post (Bluesky/Mastodon)     | 研究責任者 conversation → IRB submission | good-first-issues + CONTRIBUTING pass |
| 4    | Product Hunt (if not yet fired); follow-ups | Zenodo version DOI; P1 submission prep   | Continuity note                       |
