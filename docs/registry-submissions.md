# Registry submissions (roadmap B3)

Ready-to-submit metadata for registering SigmaCV in research-software / standards
registries — so the tool and its canonical schema are **findable** beyond GitHub.
🧑‍💻 prepared this; **🙋 Basile submits** each (most need an account / ORCID login).

After each submission, write the returned identifier (RRID, bio.tools ID,
FAIRsharing DOI) back into `CITATION.cff`, `README.md`, and `codemeta.json`, and add
a badge where one exists.

## Core metadata (reuse everywhere)

| Field            | Value                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name             | SigmaCV                                                                                                                                                                                                                        |
| Short summary    | Auto-generates clean, customizable academic CVs from open research data (OpenAlex, ORCID, Crossref, DataCite, Open Editors Plus) — free for individuals, open-source, FAIR by design.                                          |
| Description      | Open infrastructure for responsible research assessment: one canonical CV object drives every output format, citations render through CSL, and the account holder is matched by persistent identifier rather than name string. |
| Homepage         | <https://sigmacv.org>                                                                                                                                                                                                          |
| Source code      | <https://github.com/BasileChretien/sigmacv>                                                                                                                                                                                    |
| Issue tracker    | <https://github.com/BasileChretien/sigmacv/issues>                                                                                                                                                                             |
| License          | Apache-2.0                                                                                                                                                                                                                     |
| Version          | 0.1.0                                                                                                                                                                                                                          |
| Software DOI     | 10.5281/zenodo.20594123                                                                                                                                                                                                        |
| Canonical schema | <https://sigmacv.org/schema/cv/v2.json> (JSON Schema draft-07)                                                                                                                                                                 |
| Languages        | TypeScript · Node.js                                                                                                                                                                                                           |
| Platform         | Web application (SaaS or self-hosted via Docker; Linux/macOS/Windows)                                                                                                                                                          |
| Cost / access    | Free of charge · open access · open source                                                                                                                                                                                     |
| Maturity         | Mature (live at sigmacv.org)                                                                                                                                                                                                   |
| Keywords         | academic CV · curriculum vitae · ORCID · OpenAlex · bibliometrics · responsible research assessment · FAIR · open science · CSL                                                                                                |
| Maintainer       | Basile Chrétien · ORCID [0000-0002-7483-2489](https://orcid.org/0000-0002-7483-2489) · Nagoya University Graduate School of Medicine                                                                                           |
| Contact email    | chretien.basile.jean.bernard.u4@s.mail.nagoya-u.ac.jp                                                                                                                                                                          |

---

## 1. bio.tools (ELIXIR)

**Submit at:** <https://bio.tools/> → sign in → "Add a tool". **Effort:** ~15 min.

| Field            | Value                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| biotoolsID       | `sigmacv` (suggested)                                                                            |
| Name / homepage  | SigmaCV · <https://sigmacv.org>                                                                  |
| Description      | Core short summary (above)                                                                       |
| Tool type        | Web application                                                                                  |
| Topic (EDAM)     | _Data management_ · _Literature and language_ (pick the closest in the form's autocomplete)      |
| Operation (EDAM) | _Data retrieval_ · _Formatting_ · _Annotation_ (approximate — the form autocompletes EDAM terms) |
| License          | Apache-2.0                                                                                       |
| Language         | TypeScript                                                                                       |
| Maturity / cost  | Mature · Free of charge · Open access                                                            |
| Link / docs      | Repository + issue tracker (above); docs in the repo `README.md` / `docs/`                       |
| Credit           | Basile Chrétien (ORCID above), role: Developer / Maintainer                                      |
| Publication      | Software DOI 10.5281/zenodo.20594123 (type: "Other" / software)                                  |

> ⚠️ **Fit caveat:** bio.tools is life-science-focused. SigmaCV qualifies via its
> biomedical sources (PubMed/PMID, ClinicalTrials.gov + EU CTIS, NIH iCite RCR), so
> frame that relevance. If curators consider it out of scope, the other three
> registries below are the cleaner fits — no loss.

## 2. FAIRsharing — register the **canonical CV schema** as a Standard

**Submit at:** <https://fairsharing.org/> → sign in → "Add content" → **Standard**.
We register the published JSON Schema (a reusable _model/format_), not the app.

| Field            | Value                                                                                                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name             | SigmaCV Canonical CV Schema                                                                                                                                                                                                                                                             |
| Abbreviation     | SigmaCV-CV                                                                                                                                                                                                                                                                              |
| Standard type    | model/format (JSON Schema, draft-07)                                                                                                                                                                                                                                                    |
| Homepage / spec  | <https://sigmacv.org/schema/cv/v2.json>                                                                                                                                                                                                                                                 |
| Description      | A versioned JSON Schema for a researcher's CV as open, machine-readable metadata — curated works, positions, education, funding, narrative sections and display choices — derived from SigmaCV's source-of-truth schema and published so other tools can validate and adopt the format. |
| Year of creation | 2026 · Status: Ready                                                                                                                                                                                                                                                                    |
| Domains (pick)   | Bibliographic metadata · Citation · Research information                                                                                                                                                                                                                                |
| Subjects (pick)  | Information science · Library and information science                                                                                                                                                                                                                                   |
| License          | Apache-2.0                                                                                                                                                                                                                                                                              |
| Related records  | Implemented by **SigmaCV** (tool); relates to CSL, schema.org `Person`, JSON Résumé, ORCID                                                                                                                                                                                              |
| Contact          | Basile Chrétien (ORCID + email above)                                                                                                                                                                                                                                                   |

## 3. RRID via SciCrunch ✅ DONE — `RRID:SCR_028552`

> **Status (2026-06-11):** approved by the SciCrunch curation team and wired into
> `CITATION.cff`, `codemeta.json`, and `README.md` (badge + Citing section).
> Resolves at <https://scicrunch.org/resolver/RRID:SCR_028552>. Remaining manual
> step for the owner: log in to SciCrunch → **My Account → Home → "Associate
> ORCID iD"** to link ownership.

**Submit at:** <https://scicrunch.org/> → "Contribute" → **Resource**. Required:
name, URL, description (the rest optional). Anyone may register; **claim ownership**
as the author. A software RRID is often issued immediately; a curator confirms
within ~1 working day. **Effort:** ~5 min.

| Field         | Value                                           |
| ------------- | ----------------------------------------------- |
| Resource name | SigmaCV                                         |
| Resource type | Tool / Software                                 |
| URL           | <https://sigmacv.org>                           |
| Description   | Core short summary (above)                      |
| Optional      | Repository, Apache-2.0 license, keywords, ORCID |

> Outcome: an `RRID:SCR_xxxxxxx`. Add it to the README + `CITATION.cff` and cite it
> on the site so others reference SigmaCV unambiguously.

## 4. Research Software Directory

**Submit at:** <https://research-software-directory.org/> → log in with **ORCID**
→ "+" → "New Software". Independent maintainers can request access by emailing
<rsd@esciencecenter.nl> from your account. The RSD can auto-ingest metadata from
the GitHub repo + Zenodo, so much of the below is pulled automatically.

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Name / brief    | SigmaCV · core short summary (above)                          |
| Get-started URL | <https://sigmacv.org>                                         |
| Repository      | <https://github.com/BasileChretien/sigmacv> (enable scraping) |
| License         | Apache-2.0                                                    |
| Keywords        | Core keywords (above)                                         |
| Contributors    | Basile Chrétien (ORCID above)                                 |
| Related output  | Zenodo DOI 10.5281/zenodo.20594123                            |

---

## Other low-effort registries (optional, same core metadata)

- **OpenAlex / ROR** — already consumed, not applicable as a listing target.
- **Awesome lists** (e.g., awesome-open-science, awesome-research-software) — a PR adding SigmaCV.
- **AlternativeTo / SaaSHub** — consumer-discovery surfaces (lower research value).
