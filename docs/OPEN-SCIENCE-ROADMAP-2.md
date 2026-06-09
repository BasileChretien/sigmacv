# Open-science / FAIR roadmap — Wave 2

A **shared, living plan** for the next round of FAIR + responsible-assessment work,
continuing [`OPEN-SCIENCE-ROADMAP.md`](OPEN-SCIENCE-ROADMAP.md) (wave 1, phases 0–8,
all ✅) and the FAIR statement in [`OPEN-SCIENCE.md`](OPEN-SCIENCE.md).

Wave 1 already shipped the core FAIR surface (content negotiation, schema.org
`Person` + sitemap/hreflang, identifier-driven everything, per-work provenance,
`CITATION.cff`/`codemeta.json`/`.zenodo.json`, DORA/CoARA alignment, narrative CVs,
opt-in field-normalized metrics, export family). Wave 2 is the **additive** layer on
top of that.

## How we follow this together

Two of us are working this list. Every item has an **owner**:

| Mark | Owner  | Means                                                                                  |
| ---- | ------ | -------------------------------------------------------------------------------------- |
| 🧑‍💻   | Claude | Code, content drafts, metadata files, tests. I do these and open them for your review. |
| 🙋   | Basile | Account / policy / signature actions only a human with the credentials can do.         |
| 👥   | Both   | I prepare the artifact (metadata, draft, PR); you submit / approve / sign.             |

**Effort:** S = <½ day · M = 1–2 days · L = 3+ days.
**Status:** ⬜ planned · 🔜 in progress · ✅ done · ⏸ blocked (reason noted).

Working rhythm: we go **phase by phase in the recommended order** (bottom of file).
I implement the 🧑‍💻 items in a phase, you knock out the 🙋 items in parallel, we
checkpoint at the end of each phase and tick the status column here.

## Cross-cutting requirements (carry over from wave 1 — apply to every code item)

- Verify loop after any `src/lib` change: `npm run typecheck` then `npm run coverage`
  (gate scoped to `src/lib/**`: stmts 98 / branches 87 / funcs 99 / lines 99).
  Unreachable defensive branches use `/* v8 ignore next N -- reason */`.
- Any new user-facing/render string is defined for **all ten locales** (build fails
  otherwise). Bulk locale edits via a file-based Node script, never shell heredocs.
- Schema additions stay **additive** (optional / `.default()`) so `schemaVersion`
  stays **2**; only a structural break bumps it + fills `migrateCanonicalDocument()`.
- Public / API surfaces fail **closed** on consent (only `published` CVs, only
  `projectCvForPublic()` output, `publicIndexable` separate) and are rate-limited.
- External clients send a polite-pool `mailto`, route through `http.ts`, are
  **fail-soft** (a hiccup never breaks a sync), and are unit-tested with mocked `fetch`.

---

## Phase A — Declarations & alignment (credibility, ~zero code)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Owner                             | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------ | ------ |
| A1  | **Barcelona Declaration on Open Research Information (2024)** — SigmaCV runs entirely on open research info (OpenAlex/ORCID/Crossref/DataCite). **Track = "supporter"** (infra/service providers _express support_; only research-performing/funding orgs _sign_). 🧑‍💻 done: `OPEN-SCIENCE.md` section, `/principles` line, README badge softened to **"Barcelona-aligned"** (no over-claim pre-listing), supporter-request email in `docs/OUTREACH.md`. 🙋 **pending: email contact@barcelona-declaration.org** → then upgrade wording "aligned"→"supporter". | 👥                                | S      | 🔜     |
| A2  | **Name the frameworks we already embody** — Leiden Manifesto, Hong Kong Principles, Metric Tide (robustness/humility/transparency/diversity/reflexivity). Added a "Standards & principles we align with" section to `OPEN-SCIENCE.md` (7 frameworks, linked).                                                                                                                                                                                                                                                                                                 | 🧑‍💻 → 🙋 approve                   | S      | ✅     |
| A3  | **Sign DORA + record CoARA alignment** (carries over wave-1 0.7).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 🙋 sign at sfdora.org · 🧑‍💻 record | S      | ⬜     |

_Acceptance:_ `OPEN-SCIENCE.md` has Barcelona + frameworks + DORA/CoARA sections; README shows the badges; F4 page renders them.

## Phase B — Software findability & supply-chain trust

| #   | Item                                                                                                                                                                                                                                                           | Owner                                  | Effort | Depends | Status |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------ | ------- | ------ |
| B1  | **Mint the software DOI** — cut a tagged GitHub release → Zenodo deposits it (config in `.zenodo.json`); write the DOI back into `CITATION.cff`, `.zenodo.json`, `codemeta.json`, README "Citing"; bump `version`/`date-released`. (Carries wave-1 0.2 / 6.3.) | 🙋 release · 🧑‍💻 writeback              | M      | —       | ⬜     |
| B2  | **Archive the code in Software Heritage** → persistent SWHID; add the SWHID badge to README. Complements the Zenodo DOI (FAIR4RS).                                                                                                                             | 🙋 "Save code now" · 🧑‍💻 badge          | S      | —       | ⬜     |
| B3  | **Register the tool in discovery registries** — bio.tools (ELIXIR; qualifies via PubMed/PMID + ClinicalTrials), FAIRsharing (register the canonical CV schema as a _Standard_), RRID via SciCrunch, Research Software Directory.                               | 👥 (I prep metadata, you submit/claim) | M      | B1, C2  | ⬜     |
| B4  | **OpenSSF** — add a Scorecard GitHub Action (`.github/workflows/scorecard.yml`) + apply for the Best Practices badge (I draft the questionnaire answers).                                                                                                      | 👥                                     | M      | —       | ⬜     |
| B5  | **`CHANGELOG.md`** (Keep a Changelog + SemVer) + **SBOM** in CI (CycloneDX) attached to releases.                                                                                                                                                              | 🧑‍💻                                     | M      | —       | ⬜     |

## Phase C — FAIR machinery on the public / API surface (code)

| #   | Item                                                                                                                                                                                                                                                                                                                         | Owner                                                 | Effort | Where                                                                                                        | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ | ------ |
| C1  | **FAIR Signposting `Link` headers** on the public page (`type`, `author` ×ORCID/OpenAlex, `describedby` ×4 typed formats, `license`). `cite-as` deferred to C5 (no CV DOI yet). Shipped: `lib/cv/signposting.ts` (100% cov) + `PUBLIC_FORMAT_META` in `publicFormats.ts` + cache-carried header on HTML & machine responses. | 🧑‍💻                                                    | S      | `src/app/p/[slug]/route.ts`, `lib/cv/signposting.ts`, `lib/cv/publicFormats.ts`, `lib/cv/publicPageCache.ts` | ✅     |
| C2  | **Publish the canonical JSON Schema** as a versioned artifact (`zod-to-json-schema` off `canonical/schema.ts`) at a stable URL + ship a JSON-LD `@context`; submit to SchemaStore.org for editor autocomplete.                                                                                                               | 🧑‍💻 · 🙋 SchemaStore PR                                | M      | `canonical/schema.ts` → generated `/schema/cv/v2.json`                                                       | ⬜     |
| C3  | **RO-Crate export** — new `ro-crate` format packaging CV + provenance + metadata as `ro-crate-metadata.json` (JSON-LD) zipped with the PDF + CSL-JSON. The flagship "wow" item; showcases our per-work provenance. Closest analog: `render/bibtex.ts`.                                                                       | 🧑‍💻                                                    | L      | `render/types.ts`, new `render/rocrate.ts`, `getRenderer()`, `EXPORTABLE`, `publicFormats.ts`, i18n ×10      | ⬜     |
| C4  | **OAI-PMH endpoint** over `publicIndexable` published CVs (`oai_dc` + datacite metadata) so repositories/aggregators can harvest.                                                                                                                                                                                            | 🧑‍💻                                                    | M      | new `src/app/api/oai/route.ts`                                                                               | ⬜     |
| C5  | **DOI minting for CV snapshots** — "freeze & cite this version": immutable snapshot + DataCite (or Zenodo) DOI + versioning, so a CV becomes a citable research object. Flag-gated, off until credentials.                                                                                                                   | 🧑‍💻 code · 🙋 DataCite membership + `DATACITE_*` creds | L      | new `lib/cv/snapshot.ts` + write client (`lib/datacite/mint.ts`), `display.snapshotDoi`, UI                  | ⬜     |
| C6  | **Enrich the schema.org graph** — add `MonetaryGrant`/`Grant`, `Occupation`, `EducationalOccupationalCredential`, and `hasPart` `Dataset`/`SoftwareSourceCode` to the public JSON-LD.                                                                                                                                        | 🧑‍💻                                                    | M      | `lib/cv/publicJsonLd.ts`                                                                                     | ⬜     |

## Phase D — Responsible-assessment depth (mostly _surfacing_ data we already capture)

> Note: `meta.oaStatus`, per-work `meta.license`, and `meta.fwci` are **already
> populated** from OpenAlex (`build.ts:1095`), and CV-level `fwci_mean` +
> `cited_by_percentile_year` exist. D1/D4 are render/UI work, not data plumbing.

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Owner | Effort | Where                                                                                                                                                         | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | **OA-status badges per work** + a profile-level OA share. Per-work badges were pre-built (schema flag, editor toggle, `html.ts` `itemBadges`, `badgeOpenAccess` ×10) → flipped `showOpenAccess` to **default off** (opt-in) per decision. **Profile OA share shipped**: added additive `meta.oaIsOpen` (open/closed/unknown) in `build.ts` for an honest denominator, `openAccessShare()` over countable works, rendered behind the toggle, `openAccessShare` string ×10. Tests + gate green.                                                                                                                                                                                                                                                                                        | 🧑‍💻    | M      | `canonical/schema.ts`, `canonical/build.ts`, `render/metrics.ts`, `render/templates/shared.ts`, `i18n/render.ts`, `render/html.ts`, `components/CvEditor.tsx` | ✅     |
| D2  | **Open data / code links per work** — surface the DataCite/OpenAIRE/software outputs we already merge as "has open data/code".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 🧑‍💻    | M      | `build.ts`/`enrich.ts` link capture + render                                                                                                                  | ⬜     |
| D3  | **Retraction / concern flagging** via Crossref's open Retraction Watch data — mark retracted/withdrawn works. Fail-soft. Strong research-integrity signal almost nobody puts on a CV.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 🧑‍💻    | M      | new `lib/crossref/retractions.ts`, `meta.retracted`, render badge                                                                                             | ⬜     |
| D4  | **Surface field-normalized metrics** + add **NIH iCite RCR**. **FWCI mean is already surfaced** (`METRIC_DEFS`, `curatedMetrics`); the by-year **citation percentile was DELIBERATELY removed** from the catalog (not field-normalized, reads ~100% — see `metrics.ts` note) → do NOT re-add. Net-new = **iCite RCR** only (user-approved, opt-in + caveat). **Shipped:** `lib/icite/client.ts` (PMID-keyed RCR, batched/polite-pool/fail-soft, 100% cov), `enrichCvWithIcite` wired into `cv/sync.ts` (`meta.pmid` → `meta.rcr`), `rcr_mean`/`rcr_n` in `OwnerMetrics` + `curatedMetrics`, `rcr_mean` in `METRIC_DEFS` with a localized "1.0 = NIH-funded average; biomedical-only" context + coverage note ×10. Opt-in/default-none (existing metrics policy). Tests + gate green. | 🧑‍💻    | M      | `render/metrics.ts`, `lib/icite/`, `canonical/enrich.ts`, `i18n/render.ts`, `canonical/schema.ts`                                                             | ✅     |
| D5  | **Opt-in "Open-science footprint"** panel — the researcher's _own_ openness (% OA, has ORCID, % with data/code, preprint share). Framed as self-description, **not** a ranking metric (DORA-safe).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 🧑‍💻    | M      | render + `display` flag                                                                                                                                       | ⬜     |
| D6  | **Complete deferred interoperability** — CRediT roles (`meta.creditRoles`, wave-1 1.7) + Europass ELM JSON-LD export (wave-1 3.4). Lower priority; document the blocker (no clean per-author CRediT source in OpenAlex) if it stays deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 🧑‍💻    | L      | `schema.ts`, `build.ts`, `render/`                                                                                                                            | ⬜     |

## Phase E — Research-vehicle openness (gated on IRB; ties to wave-1 Phase 6)

| #   | Item                                                                                                                                                                           | Owner                           | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------ | ------ |
| E1  | **Public aggregate open-data dashboard** of consented disambiguation corrections (study #2 output) — aggregate-only, live only when `RESEARCH_LOGGING_ENABLED` + IRB approval. | 🧑‍💻 · ⏸ IRB (🙋)                 | L      | ⏸      |
| E2  | **Commit to depositing de-identified study datasets** with DOIs (Zenodo/OSF) post-IRB — state the commitment now in `OPEN-SCIENCE.md`.                                         | 🧑‍💻 statement · 🙋 deposit later | S      | ⬜     |

## Phase F — Explainer content / "information" (10-locale)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                        | Owner                 | Effort | Depends | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------ | ------- | ------ |
| F1  | **"FAIR for your CV" explainer page** — what the machine-readable formats are for, how to cite, how to self-host.                                                                                                                                                                                                                                                           | 🧑‍💻 · 🙋 native review | M      | —       | ⬜     |
| F2  | **Per-metric "why field-normalized" tooltips** citing DORA/Leiden.                                                                                                                                                                                                                                                                                                          | 🧑‍💻                    | M      | D4      | ⬜     |
| F3  | **Transparency page** — data sources + refresh cadence + "what we log (nothing, by default)".                                                                                                                                                                                                                                                                               | 🧑‍💻                    | M      | —       | ⬜     |
| F4  | **Public "Standards & principles we align with" page** rendering A1–A3 (Barcelona, DORA, CoARA, Leiden, Hong Kong, Metric Tide, FAIR/FAIR4RS). Shipped at **`/principles`** ×10 locales (`Principles.tsx` + `i18n/principles.ts` + bare/[locale] routes + seo helpers + sitemap + footer link); browser-verified. Non-EN copy = initial translation, native review pending. | 🧑‍💻                    | M      | A1–A3   | ✅     |

---

## Recommended execution order

Sequenced for **maximum payoff per unit effort** and to unblock dependencies early.

1. **C1** Signposting — pure win, S, showcases the FAIR surface we already have. _(I can start now.)_
2. **A1 + A2** declarations text + **F4** alignment page — you decide endorsements; I draft.
3. **D1** OA badges + **D4** metrics surfacing — data already captured, high visible value.
4. **B2** Software Heritage + **B5** CHANGELOG/SBOM — cheap, durable trust.
5. **C2** publish the JSON Schema — unblocks **B3** (FAIRsharing).
6. **B1** Zenodo DOI (your release) → **B3** registry submissions.
7. **C3** RO-Crate export + **C6** richer schema.org graph.
8. **D2** open data/code links + **D3** retraction flags + **D5** footprint panel.
9. **C4** OAI-PMH.
10. **C5** snapshot DOIs (needs DataCite creds) + **B4** OpenSSF.
11. **F1–F3** explainer content.
12. **D6** CRediT / Europass ELM (deferred-tier).
13. **E1–E2** research dashboard — gated on IRB.

## 🙋 Basile's queue (the human-only actions, gathered)

- [ ] **A1** — email <contact@barcelona-declaration.org> to be listed as a **supporter** (infra/service-provider track; draft in [`OUTREACH.md`](OUTREACH.md)). Wording stays "aligned" until they confirm.
- [ ] **A3** — sign DORA at <https://sfdora.org/>.
- [ ] **B1** — cut a tagged GitHub release (triggers the Zenodo DOI).
- [ ] **B2** — "Save code now" at <https://archive.softwareheritage.org/>.
- [ ] **B3** — submit/claim the bio.tools, FAIRsharing, SciCrunch (RRID), Research Software Directory entries (I'll hand you filled-in metadata).
- [ ] **B4** — create the OpenSSF Best Practices project for the repo (I'll draft the answers).
- [ ] **C2** — open the SchemaStore PR (I'll prepare it).
- [ ] **C5** — obtain DataCite membership + credentials _(only if we want snapshot DOIs)_.

> When an item finishes, flip its **Status** here and check the box. This file is the
> single source of truth for wave-2 progress.
