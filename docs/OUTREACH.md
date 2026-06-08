# Outreach kit (Phase 4.4)

A reusable one-pager for introducing SigmaCV to the audiences most likely to
adopt and amplify it: **research libraries / scholarly-communication teams**, the
**research-assessment reform community** (DORA / CoARA), and the **open-metadata
ecosystem** (ORCID, OpenAlex / OurResearch, ROR, Crossref). Copy/paste and adapt.

## One-line pitch

> SigmaCV auto-builds a clean, customizable academic CV from open research data
> (OpenAlex, ORCID) — free for individuals, open-source, privacy-first, and FAIR
> by design.

## Elevator paragraph (reusable blurb)

> SigmaCV turns a researcher's ORCID iD into a polished, up-to-date CV in
> seconds, pulling publications and metadata from open sources and rendering
> every format (PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé, NIH
> biosketch) from a single canonical object so citations are identical
> everywhere. It is open-source (Apache-2.0), self-hostable, and built to the
> FAIR principles: authorship is matched by persistent identifier rather than
> name string, every record carries provenance, metrics are opt-in and
> field-normalized (DORA-aligned), and a published CV is machine-readable
> (schema.org JSON-LD, content-negotiated CSL-JSON/BibTeX). No data harvesting,
> no lock-in: per-field publish consent, full export, and account deletion are
> built in.

## Why it's different (the wedge)

- **Non-extractive.** Open-source, self-hostable, no selling of profiles. The
  deliberate opposite of closed academic-profile silos.
- **Identifier-driven, never name-based.** Correct for common names and
  non-Latin scripts; reduces the author-disambiguation errors that distort
  metrics.
- **FAIR + machine-readable public pages.** Findable (JSON-LD, sitemap),
  Accessible (content negotiation, open export), Interoperable (PIDs + CSL),
  Reusable (provenance + license).
- **Responsible assessment.** Metrics default to none; field-normalized over
  h-index, consistent with DORA/CoARA.
- **Funder-ready in one click.** A 58-model CV-model catalog reconfigures the CV
  to the structure a given call or employer expects — grant funders (ERC, MSCA,
  NIH/NSF, DFG, JSPS, the DORA-aligned narrative formats UKRI R4RI / Royal
  Society / SNSF, …), public-institution / job CVs (Europass, academic,
  rirekisho, UN P.11), and industry/clinical CVs (ICH-GCP investigator / FDA
  1572, biotech R&D, physician, Medical Affairs) — reversibly, with the R4RI /
  Royal-Society narrative modules as first-class prose sections.
- **Gives back (planned v2).** "Not mine" corrections can flow upstream to
  improve the shared scholarly record.

## Key facts (for a slide or email)

|              |                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| License      | Apache-2.0 (code); outputs licensable CC0/CC BY by the author                                                                   |
| Data sources | OpenAlex, ORCID (public API), Crossref, ROR, DataCite, Open Editors Plus                                                        |
| Formats      | HTML · PDF · DOCX · LaTeX · Markdown · BibTeX · CSL-JSON · JSON Résumé · NIH biosketch · ERC/MSCA/NSF/JSPS grant CVs · raw JSON |
| CV models    | 58 one-click, reversible layouts: grant funders · public-institution/job CVs · industry/clinical CVs                            |
| Privacy      | GDPR + Japan APPI; per-field publish consent; export + delete                                                                   |
| Locales      | 10 (en, zh, es, fr, de, ja, pt, it, ko, ru)                                                                                     |
| Hosting      | SaaS or self-host (Docker Compose, single VPS)                                                                                  |
| Cite         | [`CITATION.cff`](../CITATION.cff) · DOI via Zenodo (on release)                                                                 |

## Suggested channels

- **Libraries / scholarly comms:** subject-librarian newsletters, LibGuides
  ("Researcher profiles & CV tools"), ORCID outreach events, institutional
  open-research weeks. Highest institutional multiplier.
- **Reform community:** DORA and CoARA working groups, the metascience /
  research-on-research community.
- **Open-metadata ecosystem:** the OpenAlex user group, ORCID integrators list,
  ROR / Crossref community calls, FORCE11.
- **Practitioner word-of-mouth:** lab/department adoption (one good-looking CV in
  a lab tends to convert the lab), discipline mailing lists, Mastodon/Bluesky
  academic communities.

## 100-word email template

> Subject: A free, open-source, FAIR academic-CV tool for your researchers
>
> Hi [name],
>
> I maintain SigmaCV, an open-source tool that builds a clean academic CV from a
> researcher's ORCID iD and open data (OpenAlex), then exports to PDF, LaTeX,
> DOCX, BibTeX, CSL-JSON, JSON Résumé, and NIH biosketch — all from one source so
> citations match everywhere. It's free for individuals, self-hostable,
> privacy-first (per-field consent, export, delete), and FAIR by design
> (identifier-driven, machine-readable public pages, DORA-aligned opt-in
> metrics). Might it be useful to mention in your researcher-profile guidance?
> Happy to give a short demo or help you run your own instance.
>
> Thanks, [you]

## Links to include

- Site: <https://sigmacv.org> _(planned — not yet live)_
- Open-science & FAIR statement: [`docs/OPEN-SCIENCE.md`](OPEN-SCIENCE.md)
- Self-hosting: [`DEPLOY.md`](../DEPLOY.md)
- Contributing: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
