# Maintainer roadmap — growth, research, sustainability

> **Audience:** Basile (sole maintainer). This is the _non-code_ to-do list — the
> things only a human with an inbox, an IRB office, and a community can do.
> Product/engineering work has its own tracks (CHANGELOG, roadmap docs); this
> file deliberately contains almost none of it. Drafted 2026-06-11.
>
> Companion docs: [`OUTREACH.md`](OUTREACH.md) (ready-to-use outreach kit),
> [`DISCOVERABILITY-ROADMAP.md`](DISCOVERABILITY-ROADMAP.md) (SEO/GEO — largely
> executed), [`OPEN-SCIENCE-ROADMAP-2.md`](OPEN-SCIENCE-ROADMAP-2.md) (FAIR —
> complete).

**The one-paragraph strategy.** The code is in good shape and live; the binding
constraints are now (1) **users** — the viral loop (public CVs) needs seed
traffic; and (2) **sustainability** — a solo-maintained live service needs a
second pair of hands and a funding line before it needs any new feature.

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
  open-science day in FR/JP). Archive the poster on Zenodo so it has a DOI and
  a link back.

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
  (the Caen pharmacology group), and your own email signature pointing at
  sigmacv.org.

### 1c. Retention loop (the missing product piece — code, queued)

- ✅ **Built 2026-06-11** (PR #118): the **re-sync digest email** — opt-in toggle,
  monthly per-user cadence, one-click unsubscribe, 10 locales. 🙋 To turn it ON:
  the free outbound-SMTP setup (SMTP2GO + Porkbun DNS) in [`EMAIL-SETUP.md`](EMAIL-SETUP.md)
  — sigmacv.org has no SMTP today (Porkbun reroute is inbound-only).
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

## 5. Sustainability

The real long-term risk isn't code quality (audited, 98%+ coverage gate, green
CI); it's **bus factor 1** plus **funding = your wallet**.

### 5a. Funding (apply while the FAIR work is fresh)

- 🟠 **CZI EOSS** (Essential Open Source Software for Science) — SigmaCV is a
  textbook fit: open infrastructure for research assessment, DORA-aligned,
  Zenodo DOI, RRID, OpenSSF badge — exactly what their reviewers score. Watch
  for the next cycle and prepare the 2-page proposal from the README +
  `OPEN-SCIENCE.md` (a session of work, mostly assembly).
- ⛔ **NLnet / NGI Zero Commons: CLOSED** — the 13th and final call ended
  June 1, 2026; the remaining 2026 NGI calls (Taler, Fediversity) do not fit.
  → 🟠 **Primary target: CZI EOSS Cycle 6 — LOI due Oct 18, 2026**
  ($100–400k/2 yrs; biomedical relevance required — lean on the pharmacist/
  pharmacoepidemiology profile, NIH biosketch + iCite RCR + clinical-trial
  features). Use the 4 months to grow the adoption numbers the LOI will cite;
  a draft LOI skeleton is prepared (kept locally, outside the repo).
- 🟡 Second ring: OpenAIRE open calls, Invest in Open Infrastructure, Mozilla
  Technology Fund; and institutional in-kind support (Nagoya or UNICAEN
  hosting/credits — ask, the FAIR portfolio makes it an easy yes).
- 🔁 Put grant deadlines in the calendar; one application per quarter max.

### 5b. Bus factor & community

- ✅ **Repo contributor-ready** (2026-06-12): 15-minute setup + co-maintainer
  call in CONTRIBUTING/README, and six scoped issues seeded (#123–#128, four
  labelled good-first-issue).
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

| Week | Growth (§1)                                 | Sustainability (§5)                   |
| ---- | ------------------------------------------- | ------------------------------------- |
| 1    | Email Laurent (library ask)                 | —                                     |
| 2    | First 5 outreach emails from OUTREACH.md    | NLnet application                     |
| 3    | First community post (Bluesky/Mastodon)     | good-first-issues + CONTRIBUTING pass |
| 4    | Product Hunt (if not yet fired); follow-ups | Continuity note                       |
