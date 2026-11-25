# Status

Open maintainer tasks, and the state of features that are switched off, optional or dormant. The root `CLAUDE.md` keeps only what stays true; this page is read when needed and goes stale, so check an entry against the code or the server before repeating it. How to switch each item on: [`GO-LIVE-CHECKLIST.md`](GO-LIVE-CHECKLIST.md). Open-science work: [`OPEN-SCIENCE-ROADMAP-2.md`](OPEN-SCIENCE-ROADMAP-2.md).

Moved from the root `CLAUDE.md` on 2026-11-25 ("Open-science launch tasks", "Scope", and the state notes of the go-live checklist).

## Open maintainer tasks

The FAIR/open-science work is implemented (full status in [`OPEN-SCIENCE-ROADMAP.md`](OPEN-SCIENCE-ROADMAP.md)). These remaining steps are **mine to do**, not code — do them around launch:

- [ ] **Turn research logging on after the consent panel deploys** — study 2026-0310 was approved on 2026-10-21 and `RESEARCH_CONSENT_VERSION` is already 2 (the approved terms), so the step left is `RESEARCH_LOGGING_ENABLED=true` in the server's `.env` and a restart. Nothing then asks anyone to take part: the protocol forbids soliciting, so the panel opens only from the account menu or the editor's foot link. A consent given under version 1 stops counting until the person agrees again in the panel.
- [ ] **Outreach** — the reusable kit is in [`OUTREACH.md`](OUTREACH.md) (libraries / DORA-CoARA / OpenAlex user group).

## Switched off, optional or dormant

- **Research logging** — approved (Nagoya University Bioethics Review Committee, 2026-10-21, 試験番号 2026-0310), switch still OFF until the consent panel is live in production. The research export stays gated (`RESEARCH_EXPORT_*`) until its de-identified fields are finalised against the pre-registration. The consent text exists in Japanese and English only; the other eight languages wait for an approved amendment.
- **Upstream OpenAlex curation** — OFF (`OPENALEX_CURATION_ENABLED` unset); the payload is PROVISIONAL until the real OpenAlex curation API contract is confirmed.
- **WHO ICTRP trials** — DORMANT: the `IctrpTrial` table is empty until WHO clears the use and the weekly import runs.
- **FORRT replications** — DORMANT: the `ForrtReplication` table is empty; no FReD seed ships in the repository yet.
- **EPO patents** and **Jisc Open Policy Finder** — optional, each on only when its credentials are in the server's `.env`.
- **Objection route** — `PREVIEW_SUPPRESSION_KEY` was set on 2026-09-09. `/object` also needs its second ORCID redirect URI registered (see the checklist).

## Done

- [x] **Mint the software DOI** — done at v0.1.0 (2026-06-08): concept DOI `10.5281/zenodo.20594123`. `CITATION.cff` lists a versioned DOI for every release since, up to v0.4.0 (2026-10-07, `10.5281/zenodo.23219549`). The write-back done at each release is in [`RELEASES.md`](RELEASES.md).
- [x] **DORA signed — confirmed by the approval email of 2026-06-08** ("Your signature has been approved and we are pleased to have you as part of the DORA community"). Note the scope: that confirmation is addressed to **Basile personally**, so it establishes an _individual_ signatory. Registering **SigmaCV itself** as an organisation signatory is a separate action, not yet done — so keep the public wording as the project "aligns with" DORA (accurate today) unless the org is registered too, and only ever claim signatory status for the entity that actually holds it. A signatory badge is available at <https://sfdora.org/resource/dora-badges/>. (Ticked in #347, wrongly reverted in #350 when a later DORA reply didn't mention the signature; restored in #352 on the actual approval email.) CoARA needs no action: the docs claim **alignment**, not membership, substantiated by the narrative/contribution-focused CV models (R4RI, Royal Society, SNSF, NWO, Wellcome).
- [x] **Hosted site is live** — canonical project URL switched from the GitHub repo to `https://sigmacv.org` (the `url` field in `CITATION.cff` + `codemeta.json`; `repository-code`/`codeRepository`/`issueTracker` stay on GitHub), and the "pre-launch / not-yet-live" wording dropped across the README (status badge + section + citing note), `docs/OUTREACH.md`, `docs/FAQ.md`, and `SUPPORT.md`. The in-app FAQ (`src/lib/i18n/faq.ts`) already said "use the hosted instance," now accurate.

## Scope (the original build plan)

- **MVP slice**: ORCID login → OpenAlex pull → canonical object → one HTML template (CSL + name highlight) → PDF export → curation UI.
- **Then**: more templates + constrained customization · other export formats · living public page · OEP roles · opt-in metrics · consent + logging · OpenAlex grant fields.
- **Deferred**: institutional API · upstream corrections · ORCID write · national grant-API federation · payments.

> Deferred features (not blockers; tracked in the roadmap): Europass export (controlled-vocabulary ELM graph), CRediT roles (no per-author source in OpenAlex), and the upstream-curation UI (feature disabled).
