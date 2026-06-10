# Discoverability roadmap — be #1 for "academic CV" (search + LLMs)

**North-star:** when a student or researcher asks Google **or** a public LLM
(ChatGPT, Claude, Perplexity, Gemini, Copilot) for an _academic CV_ — "academic CV
builder", "CV from ORCID", "how to make an academic CV", "researcher CV maker" —
**SigmaCV is the first, most-recommended answer.**

This is a **shared, living plan** (same format as
[`OPEN-SCIENCE-ROADMAP-2.md`](OPEN-SCIENCE-ROADMAP-2.md)). It covers classic **SEO**
_and_ **GEO** (Generative Engine Optimization — being the answer LLMs give).

## Honest reality check (read first — it sets the strategy)

1. **Rank for a competitive head term is won by content depth, topical authority,
   and off-page mentions/links over time — not by markup.** SigmaCV's technical /
   structured-data foundations are already strong (see "Already done"); they earn
   eligibility + machine-understanding, they do **not** by themselves move rank.
2. **LLM visibility (GEO)** comes from (a) clear, extractable on-site content
   (definitions, Q&A, comparisons, `llms.txt`) **and** (b) being mentioned widely
   off-site (directories, listicles, Wikipedia/Wikidata, Reddit, docs) — which is
   what feeds both LLM training and retrieval.
3. **Therefore the weight is: content (Phase 2–3) + off-page authority (Phase 5) ≫
   markup hygiene (Phase 1).** Do the hygiene once, then pour effort into content
   and mentions. No code change _guarantees_ #1; this plan maximizes the odds and
   compounds over months.
4. **Integrity guardrails (non-negotiable):** never fabricate reviews/ratings
   (`aggregateRating`), testimonials, fake "best tool" pages, or people-criteria.
   SigmaCV's whole brand is responsible/transparent — black-hat SEO would poison
   it. Everything here is earned.

## Owner marks & status

| Mark | Owner  | Means                                                           |
| ---- | ------ | --------------------------------------------------------------- |
| 🧑‍💻   | Claude | Code, content drafts, schema, metadata, tests.                  |
| 🙋   | Basile | Account/console actions, outreach, signups only a human can do. |
| 👥   | Both   | I prepare the artifact/draft; you submit/approve.               |

**Effort:** S = <½ day · M = 1–2 days · L = 3+ days · XL = ongoing programme.
**Status:** ⬜ planned · 🔜 in progress · ✅ done · ⏸ blocked.

## Cross-cutting conventions (carry over from the codebase)

- Workflow: branch → PR → `gh pr checks <n> --watch` → squash-merge to protected `main`.
- Any new user-facing string is defined for **all 10 locales** (build fails otherwise);
  bulk locale edits via a file-based Node script, never shell heredocs.
- After `src/lib` changes: `npm run typecheck` then `npm run coverage` (gate
  stmts 98 / branches 87 / funcs 99 / lines 99).
- New landing pages ride the existing machinery: add an id to `LANDING_PAGE_IDS`
  (`src/lib/i18n/landingPages.ts`) → it's auto-routed (`app/[locale]/[page]`),
  sitemapped (`app/sitemap.ts` iterates the ids), and gets `WebPage` + `FAQPage`
  JSON-LD via `components/LandingPage.tsx`. **Adding an id forces copy in all 10 locales.**
- Don't regress what works (ProfilePage/Person rich result, hreflang, sitemap).
- **D2 `@graph` is NOT part of this** — it surfaces _datasets_ to Dataset Search, irrelevant to ranking for "academic CV". Stay parked.

---

## ✅ Already done (foundations — don't redo)

- Homepage `SoftwareApplication` JSON-LD (free, `price:0`) + `WebSite` + `Organization` + `Person` (`components/StructuredData.tsx`).
- `FAQPage` JSON-LD on the FAQ and on every landing page (`lib/faqJsonLd.ts`).
- 7 SEO landing pages (orcid-to-cv, nih-biosketch, academic-cv-template, openalex-cv, publication-list, latex-cv, funder-cv-templates) ×10 locales.
- Sitemap (per-entry hreflang) + `robots.ts` (all crawlers incl. GPTBot/ClaudeBot/PerplexityBot/Google-Extended allowed) + canonical + OG/Twitter + 10-locale hreflang.
- `/p/[slug]` public CV pages with `ProfilePage`/`Person` JSON-LD + "Made with SigmaCV" referral footer; opt-in `publicIndexable`.
- Fast stack (Next 16 / React 19.2), Plausible analytics, Zenodo DOI, registry submissions in flight (bio.tools/FAIRsharing/RSD), OUTREACH kit.
- **`llms.txt` + `llms-full.txt`** (T1) served at the site root — the GEO foundation: authoritative, extractable description + Q&A for ChatGPT/Claude/Perplexity/Gemini, guarded by `tests/llms-txt.test.ts`.
- **Deepened 7 landing pages** (C1) ×10 locales — intro + 4-step how-to + why + 5-FAQ + related-page links via the new `src/lib/i18n/landingContent.ts`; `LandingPage.tsx` now also emits `HowTo` JSON-LD (T2) and hub-and-spoke internal links (part of T6). Non-English copy machine-drafted, flagged for native review.
- **Enriched homepage `SoftwareApplication`** (T4) — `softwareVersion`, `datePublished`, `inLanguage` ×10, real `screenshot` (`public/screenshot-home.webp`); no `aggregateRating`. (`SearchAction` deliberately skipped — no on-site search.)
- **Homepage "who it's for" personas** (C2) ×10 locales — students & grad applicants / PhD & postdocs / faculty & PIs / clinicians & research staff, via the new `src/lib/i18n/landingAudience.ts`; homepage copy in `landing.ts` already strong (hero + 3-step how-it-works + features + trust + explore links).
- **Wikidata entity** (G2) — item [Q140158386](https://www.wikidata.org/wiki/Q140158386) created (official site / repo / DOI / license / TypeScript); its QID is wired into the homepage `Organization` + `SoftwareApplication` `sameAs` (`components/StructuredData.tsx`) so site↔Wikidata cross-reference for entity recognition.
- **`/guides` surface** (B1) + **7 cornerstone guides** (B2 complete) — typed, English-first content under `src/lib/guides/`, rendered at `/guides` + `/guides/[slug]` with Article + BreadcrumbList + FAQPage + ItemList JSON-LD, a named-author (E-E-A-T) byline, sitemap entries, and a homepage-footer link. Adding more guides = data-only.
- **Persona pages** (C3) — all 5 shipped ×10 locales (`phd-cv`, `postdoc-cv`, `grad-school-cv`, `faculty-cv`, `research-cv`), full landing-page depth (intro/steps/why/FAQ + HowTo/FAQPage/BreadcrumbList/WebPage JSON-LD), via a non-invasive `landingAll` facade (`src/lib/i18n/personaPages.ts` + `landingAll.ts`) that leaves the original 7 pages untouched. Sitemap iterates `ALL_LANDING_PAGE_IDS`.
- **Topic pages** (C4, in progress) — first batch of 3 (`cv-from-google-scholar` [honest open-alternative framing], `erc-cv`, `import-publications-to-cv`) ×10 locales, via a 3rd `landingAll` family (`src/lib/i18n/topicPages.ts`); full landing depth + HowTo/FAQPage/BreadcrumbList/WebPage JSON-LD, bare & localized routes, sitemap. 15 landing-style pages now live (7 original + 5 persona + 3 topic).
- **Glossary** (C6) — `/glossary` + `/glossary/[slug]` (English-first) with `DefinedTerm`/`DefinedTermSet`/`BreadcrumbList`/`FAQPage` JSON-LD; 9 terms (ORCID, OpenAlex, FWCI, h-index, CSL, NIH biosketch, preprint, DORA, Leiden Manifesto) in `src/lib/glossary/`. Reuses the shared `renderContentBlock` (extracted from guides). Sitemap + homepage-footer link. Adding terms = data-only.

---

## Phase 0 — Measure & target (you can't rank what you don't track)

| #   | Item                                                                                                                                                                                                                                                                                                | Owner | Effort | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | ------ |
| M1  | **Google Search Console** + **Bing Webmaster Tools** — verify the domain, submit `sitemap.xml`, watch Coverage/Performance. The single most important measurement surface. _(Done 2026-06-10: GSC domain property verified via Porkbun DNS TXT + `sitemap.xml` submitted; Bing imported from GSC.)_ | 🙋    | S      | ✅     |
| M2  | **Keyword universe** — finalize the target table below (head + long-tail + question intents, split student vs researcher, per locale). Pick 1 primary + 2–3 secondary terms per page.                                                                                                               | 👥    | S      | ⬜     |
| M3  | **Rank + LLM baseline** — record today's Google position for the head terms and, for each of ChatGPT / Claude / Perplexity / Gemini, whether SigmaCV is named for "best academic CV builder" etc. Re-check monthly.                                                                                 | 🙋    | S      | ⬜     |
| M4  | **Funnel tracking** — Plausible goals for organic-search and LLM-referral landings → sign-in → publish, so we see which content converts.                                                                                                                                                           | 🧑‍💻    | S      | ⬜     |

## Phase 1 — Technical & structured-data hygiene (finish the gaps)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                       | Owner | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------ | ------ |
| T1  | **`llms.txt` + `llms-full.txt`** (`public/`, served at root) — the clean, authoritative description of what SigmaCV is, who it's for, the formats, key pages, how to use/self-host. The one clearly-missing GEO foundation; perfectly on-brand. **Top first move.**                                                                                                                        | 🧑‍💻    | S      | ✅     |
| T2  | **`HowTo` JSON-LD** on the how-to landing pages ("How to make an academic CV from your ORCID") — step entities → eligible for how-to rich results + clean LLM extraction.                                                                                                                                                                                                                  | 🧑‍💻    | S      | ✅     |
| T3  | **`BreadcrumbList` JSON-LD** + visible breadcrumbs on landing/guide pages — site structure signal. _(BreadcrumbList JSON-LD already shipped on landing pages; visible breadcrumb UI still ⬜.)_                                                                                                                                                                                            | 🧑‍💻    | S      | 🔜     |
| T4  | **Enrich `SoftwareApplication`** — add `featureList`, `screenshot`, `softwareVersion`, `operatingSystem: "Web"`, `inLanguage` (10). **Do NOT add `aggregateRating`** unless real, verifiable reviews exist.                                                                                                                                                                                | 🧑‍💻    | S      | ✅     |
| T5  | **Core Web Vitals + crawl health** — confirm LCP/CLS/INP green (Next 16 should be fine), no broken links, OG images render, every page has one `<h1>` + descriptive alt text.                                                                                                                                                                                                              | 🧑‍💻    | S      | ⬜     |
| T6  | **`WebSite` `SearchAction` / sitelinks searchbox** + tighten internal-linking graph (hub-and-spoke from homepage → landing pages → guides). _(Landing-page hub-and-spoke internal links shipped with C1. `SearchAction` **skipped on purpose**: SigmaCV has no on-site search endpoint, so a sitelinks-searchbox target would be fabricated — revisit only if real site search is built.)_ | 🧑‍💻    | S      | 🔜     |

## Phase 2 — On-site content depth (the real ranking lever)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Owner                 | Effort | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------ | ------ |
| C1  | **Deepen the 7 existing landing pages** from thin (subhead + 2 FAQ) to comprehensive (≈800–1500 words: what/why, step-by-step with screenshots, comparison, 6–10 FAQ, internal links, CTA). Extend `LandingPageStrings` (more sections) + `LandingPage.tsx`. ×10 locales.                                                                                                                                                                                                                       | 🧑‍💻 · 🙋 native review | L      | ✅     |
| C2  | **Homepage copy depth** — make the value proposition unambiguous for the head term ("free academic CV builder for students & researchers — from ORCID/OpenAlex"), add a concise "how it works" + "who it's for (students / PhD / postdoc / faculty)" + outcomes.                                                                                                                                                                                                                                | 🧑‍💻                    | M      | ✅     |
| C3  | **Persona pages** — distinct high-intent pages: **student/grad-school CV**, **PhD-application CV**, **postdoc CV**, **faculty/tenure CV**, **research CV**. Each speaks to that searcher's need. _(Done: all 5 shipped ×10 locales — `phd-cv`, `postdoc-cv`, `grad-school-cv`, `faculty-cv`, `research-cv` — via a non-invasive `landingAll` facade over the landing machinery (`personaPages.ts`), full landing depth + JSON-LD, bare & localized routes, in the sitemap.)_                    | 🧑‍💻                    | L      | ✅     |
| C4  | **Expand the landing-page set** to the high-intent queries in the keyword table (target ~20–30 pages total). Each = one `LANDING_PAGE_IDS` entry. Batch by theme. _(In progress — 15 landing-style pages now live: 7 original + 5 persona + first **topic** batch of 3 (`cv-from-google-scholar`, `erc-cv`, `import-publications-to-cv`) ×10 locales, via a 3rd `landingAll` family `topicPages.ts`. Adding more = data + route files.)_                                                        | 🧑‍💻 · 🙋 review        | L      | 🔜     |
| C5  | **Examples / templates gallery** — real (illustrative) academic-CV examples by field/career stage; highly linkable + high-intent ("academic CV example/template"). Could reuse the render engine to generate sample CVs.                                                                                                                                                                                                                                                                        | 🧑‍💻                    | L      | ⬜     |
| C6  | **Glossary / concept pages** — ORCID, OpenAlex, FWCI, h-index, CSL, Sigma-Score, biosketch, Europass… Entity coverage that LLMs cite and that wins "what is X" queries; internally links to the tool. _(Done: `/glossary` + `/glossary/[slug]` with **DefinedTerm + DefinedTermSet + BreadcrumbList + FAQPage** JSON-LD, English-first, in `src/lib/glossary/`; first 6 terms — ORCID, OpenAlex, FWCI, h-index, CSL, NIH biosketch. More = data-only. Sigma-Score/Europass/preprint/DORA TBD.)_ | 🧑‍💻                    | M      | ✅     |

## Phase 3 — Content marketing / topical authority (blog + guides)

> No `/blog` or `/guides` surface exists yet — this is the biggest **net-new** build and the strongest long-term lever for both Google authority and LLM citation.

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner          | Effort | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ | ------ |
| B1  | **Build a `/guides` (or `/blog`) surface** — MDX-or-DB-backed, indexable, in the sitemap, with `Article`/`TechArticle` + `BreadcrumbList` JSON-LD, author = the maintainer (E-E-A-T), dates, internal links. _(Done: typed, English-first guides under `src/lib/guides/`, rendered by `GuidePage`/`GuidesIndex` at `/guides` + `/guides/[slug]`; Article + BreadcrumbList + FAQPage + ItemList JSON-LD, named-author byline, sitemap, homepage-footer link. Per-locale = later (I1).)_                                                                                                                                                         | 🧑‍💻             | L      | ✅     |
| B2  | **Cornerstone guides** (definitive, linkable, LLM-citable): "The complete guide to the academic CV", "Academic CV vs résumé", "How to list publications on a CV", "Academic CV for grad-school applications", "How long should an academic CV be", "Academic CV format by country", "Responsible use of metrics on a CV (DORA/Leiden)". _(Done — all 7 shipped: how to write an academic CV · academic CV vs résumé · how to list publications · how long should it be · academic CV for grad school · responsible use of metrics (DORA/Leiden) · academic CV format by country. Adding more = data-only edit to `src/lib/guides/guides.ts`.)_ | 🧑‍💻 · 🙋 review | XL     | ✅     |
| B3  | **Editorial cadence** — a steady publishing rhythm (freshness + breadth) targeting the question-intent keyword set; refresh top pages quarterly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 👥             | XL     | ⬜     |

## Phase 4 — GEO (be the answer LLMs give)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Owner | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------ | ------ |
| G1  | **`llms.txt`** (= T1) + structure all key content as clean **Q&A / definitions / comparisons** (the shapes LLMs extract verbatim).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 🧑‍💻    | S      | ⬜     |
| G2  | **Wikidata item** for SigmaCV (software entity: instance-of, license, repo, official site, based-on OpenAlex/ORCID) — a structured fact LLMs and search both consume. _(Item created: [Q140158386](https://www.wikidata.org/wiki/Q140158386); wired into the homepage `sameAs` JSON-LD to close the loop.)_                                                                                                                                                                                                                                                                                                                                                  | 👥    | S      | ✅     |
| G3  | **Wikipedia** — only once genuinely notable (independent coverage); otherwise contribute SigmaCV as a citation/external link on relevant articles (academic CV, ORCID, OpenAlex). No self-promotion spam.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 🙋    | M      | ⏸      |
| G4  | **Listed where LLMs retrieve** — AlternativeTo, Product Hunt, G2/Capterra, SaaSHub, "awesome-open-science"/"awesome-research-tools" GitHub lists, ORCID integrations directory. _(2026-06-10: PR to **helenahartmann/awesome-PhD** Career section ([#15](https://github.com/helenahartmann/awesome-PhD/pull/15)) + suggestion issue on **LimHyungTae/Awesome-PhD-CV** ([#4](https://github.com/LimHyungTae/Awesome-PhD-CV/issues/4)). **awesome-selfhosted deferred to ~Oct 2026** (4-month-age rule); brandonhimpfen/awesome-open-science skipped (anti-early-stage policy). AlternativeTo/SaaSHub/Product Hunt still 🙋 — listing kit + PH pack drafted.)_ | 🙋    | M      | 🔜     |
| G5  | **Monitor LLM answers monthly** (M3 loop) and close gaps the models reveal (missing comparison, unclear pricing, etc.).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 👥    | XL     | ⬜     |

## Phase 5 — Off-page authority & backlinks (dominant lever)

| #   | Item                                                                                                                                                                                                                                 | Owner | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------ | ------ |
| O1  | **University library research guides (LibGuides)** — librarians curate "tools for researchers/CVs"; a single listing is high-authority + exactly on-audience. Use the OUTREACH kit. **Highest-ROI off-page channel for this niche.** | 🙋    | XL     | ⬜     |
| O2  | **Tool directories** — bio.tools/FAIRsharing/RSD (in flight) + AlternativeTo, Product Hunt launch, G2/Capterra, SaaS directories.                                                                                                    | 🙋    | M      | 🔜     |
| O3  | **Academic communities** — ORCID blog/integrations, OpenAlex user group, DORA/CoARA, academic Mastodon/Bluesky, r/AskAcademia · r/PhD · r/GradSchool (value-first, not spam).                                                        | 🙋    | XL     | ⬜     |
| O4  | **The infrastructure paper (#1)** — a citable publication (cite the Zenodo DOI) → durable academic backlinks + credibility LLMs weight heavily.                                                                                      | 🙋    | L      | ⬜     |
| O5  | **Guest posts / mentions** — write for research-tools / open-science blogs; respond to relevant journalist/blogger queries.                                                                                                          | 🙋    | XL     | ⬜     |

## Phase 6 — The `/p/[slug]` organic flywheel (compounding long-tail)

| #   | Item                                                                                                                                                                                     | Owner | Effort | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | ------ |
| F1  | **Nudge publishing** — every published, indexable CV is a page ranking for "{name} academic CV" and builds topical authority. Add a gentle, consensual in-app prompt to publish + share. | 🧑‍💻    | M      | ⬜     |
| F2  | **Make public CVs best-in-class SEO targets** — confirm titles/meta/OG per CV, fast render, the "Made with SigmaCV" referral link (exists). Each is also a live demo of the product.     | 🧑‍💻    | S      | ⬜     |

## Phase 7 — International (you already have 10 locales)

| #   | Item                                                                                                                                                                                                                                                                                                                    | Owner                 | Effort | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------ | ------ |
| I1  | **Localized head terms** — target the lower-competition non-English equivalents you can already serve via hreflang: _CV académique / universitaire_ (fr), _wissenschaftlicher Lebenslauf_ (de), _CV académico_ (es), _学术简历_ (zh), _履歴書 / アカデミックCV_ (ja), etc. Localized landing pages for the top markets. | 🧑‍💻 · 🙋 native review | L      | ⬜     |

## Phase 8 — Iterate

| #   | Item                                                                                                                         | Owner | Effort | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | ------ |
| R1  | **Monthly review** (GSC + Plausible + LLM-answer check) → refresh winners, prune/redirect losers, double down on what ranks. | 👥    | XL     | ⬜     |

---

## Target keyword universe (Phase 0 M2 — refine, then map 1 primary per page)

**Head / tool-intent:** academic CV · academic CV builder/maker/generator · researcher CV · scientific CV · research CV · free academic CV builder.
**Integration-intent:** ORCID to CV · CV from ORCID · OpenAlex CV · CV from Google Scholar · import publications to CV · automatic CV from publications · publication list generator.
**Student-intent:** academic CV for grad school · PhD application CV · grad-school CV · CV for master's application · student academic CV.
**Researcher-intent:** postdoc CV · faculty CV · tenure CV · academic CV template/example/format.
**Funder/format-intent:** NIH biosketch generator · NSF biosketch · ERC CV · Horizon Europe CV · Europass academic / alternative · LaTeX academic CV · moderncv alternative · Overleaf CV alternative.
**Question-intent (blog/LLM):** how to write an academic CV · academic CV vs resume · how to list publications on a CV · what to include in an academic CV · how long should an academic CV be · academic CV format by country.

## KPIs

- Google position for "academic CV builder" / "ORCID to CV" / "researcher CV" (track monthly; target page 1 → top 3).
- Organic clicks/impressions (GSC), organic share of signups (Plausible).
- **LLM mention rate**: % of {ChatGPT, Claude, Perplexity, Gemini} that name SigmaCV for "best academic CV builder" / "tool to make a CV from ORCID" (target: named by all four).
- Referring domains (esp. `.edu` LibGuides), count of indexed `/p/*` pages.

## Recommended execution order

1. **Phase 0** (M1–M4) — measurement first; **🙋 GSC/Bing + baseline** in parallel with my work.
2. **T1 `llms.txt`** — fast, on-brand, the missing GEO foundation. _(I can start immediately.)_
3. **C1 deepen the 7 landing pages** + **C2 homepage depth** — the real on-site ranking lever.
4. **T2–T6** hygiene (HowTo/Breadcrumb/SoftwareApplication enrich/CWV) — quick wins alongside C1.
5. **B1 build `/guides`** + **B2 first 3 cornerstone guides** — start the authority engine.
6. **C3 persona pages** + **C4 expand landing set** + **C6 glossary** — breadth.
7. **O1/O2/O4 off-page** (🙋, ongoing from now) + **G2 Wikidata** + **G4 directories**.
8. **I1 localized head terms** · **F1 publish-nudge** · **C5 examples gallery**.
9. **R1 monthly loop** — forever.

---

## How to execute this in a fresh session

Paste the kickoff prompt in [`docs/DISCOVERABILITY-KICKOFF-PROMPT.md`](DISCOVERABILITY-KICKOFF-PROMPT.md)
into a new session. It points the agent at this file as the source of truth and the
recommended execution order above.
