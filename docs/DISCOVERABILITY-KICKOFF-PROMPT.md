# Kickoff prompt — "make SigmaCV #1 for academic CV"

Copy everything in the fenced block below into a fresh Claude Code session (run from
the repo root, on an up-to-date `main`).

```
You are working on SigmaCV (C:\R_git\SigmaCV) — a free, open-source academic-CV
builder (Next.js 16 / React 19.2 / TypeScript / Prisma, deployed at sigmacv.org).

MISSION: make SigmaCV the #1 result — in Google AND in public LLMs (ChatGPT,
Claude, Perplexity, Gemini, Copilot) — when a STUDENT or RESEARCHER looks for an
"academic CV" (e.g. "academic CV builder", "CV from ORCID", "researcher CV maker",
"how to make an academic CV", "PhD application CV"). This is an SEO + GEO
(Generative Engine Optimization) programme.

SOURCE OF TRUTH: read docs/DISCOVERABILITY-ROADMAP.md in full first. It has the
strategy, the honest reality check, the phases (0–8), the target-keyword universe,
the KPIs, and the RECOMMENDED EXECUTION ORDER. Follow that order. Tick the Status
column and keep the doc current as you go. Also skim docs/OUTREACH.md and the
existing SEO surfaces it references.

WHAT TO DO (autonomously, "continue as recommended"):
- Work the 🧑‍💻 items in the recommended order, one focused PR each:
  branch → implement → `npm run typecheck` && `npm run coverage` (gate:
  stmts 98 / branches 87 / funcs 99 / lines 99) → browser-verify if it renders →
  `gh pr create` → `gh pr checks <n> --watch` → `gh pr merge <n> --squash
  --delete-branch`. main is protected; CI is "Format · Typecheck · Test · Build".
- START with: T1 `llms.txt` (+ llms-full.txt) — fast, on-brand, the one missing
  GEO foundation. THEN C1 (deepen the 7 existing landing pages) + C2 (homepage
  content depth) — the real ranking lever — and the T2–T6 markup quick-wins.
  THEN B1 (build a /guides surface) + B2 (first cornerstone guides).
- Landing/guide pages ride the existing machinery: add an id to LANDING_PAGE_IDS
  (src/lib/i18n/landingPages.ts) → auto-routed + sitemapped + gets WebPage+FAQPage
  JSON-LD via components/LandingPage.tsx. ADDING A KEY/PAGE FORCES COPY IN ALL 10
  LOCALES (en-US, zh-CN, es-ES, fr-FR, de-DE, ja-JP, pt-BR, it-IT, ko-KR, ru-RU) —
  TypeScript fails the build otherwise. Write bulk locale content via a file-based
  Node script, NEVER shell heredocs. Non-English copy = initial translation,
  flagged for native review (same convention as existing pages).
- For 🙋 items (Google Search Console, Bing, directory signups, LibGuide outreach,
  Wikidata/Wikipedia, baseline rank/LLM checks): you can't do them — list them
  clearly for me with exact steps/URLs, and prep any artifact I'll submit.

GUARDRAILS (non-negotiable — SigmaCV's brand is responsible/transparent):
- NEVER fabricate reviews, testimonials, `aggregateRating`, fake "best tool"
  pages, or any people/authority you can't verify. Earn everything.
- Do NOT implement the D2 JSON-LD `@graph` dataset work — it's irrelevant to this
  goal (it surfaces datasets to Dataset Search, not "academic CV" rank). Leave parked.
- Do NOT regress existing SEO: the homepage SoftwareApplication JSON-LD, the
  ProfilePage/Person rich result on /p/[slug], FAQPage blocks, hreflang ×10, the
  sitemap, robots (all crawlers allowed). Verify these still hold after changes.
- Honest expectations: markup/llms.txt are hygiene; #1 for a competitive head term
  is won by content depth + off-page authority over time. Weight content (Phase
  2–3) and the off-page list (Phase 5) accordingly; don't over-invest in markup.

OUTPUT EACH SESSION: what shipped (PRs), the updated roadmap statuses, and the
exact 🙋 actions I should take next. Save notable decisions to project memory.

Begin by reading docs/DISCOVERABILITY-ROADMAP.md, confirm the plan in 3–4 lines,
then start with T1 (llms.txt).
```
