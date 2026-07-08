---
title: "SigmaCV: automated, identifier-based academic CVs from open research information"
tags:
  - academic CV
  - curriculum vitae
  - ORCID
  - OpenAlex
  - bibliometrics
  - responsible research assessment
  - open research information
  - FAIR research software
  - TypeScript
authors:
  - name: Basile Chrétien
    orcid: 0000-0002-7483-2489
    affiliation: 1
affiliations:
  - name: Department of International Medical Education, Nagoya University Graduate School of Medicine, Nagoya, Japan
    index: 1
date: 8 July 2026
bibliography: paper.bib
---

# Summary

`SigmaCV` is a free, open-source web application that assembles a formatted
academic curriculum vitae (CV) automatically from open research information.
After a researcher signs in with their ORCID iD [@haak2012orcid], SigmaCV
aggregates their works and, where the data exists, their positions, education,
funding, editorial and peer-review service, datasets, software, clinical trials,
and patents from twelve open sources, matching each record to the account holder
by persistent identifier — ORCID or OpenAlex author ID [@priem2022openalex] —
rather than by name string. All curation and display choices are stored in a
single schema-validated _canonical object_, from which every output — HTML, PDF,
DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé, and an NIH biosketch — is
derived through one renderer interface, with citations rendered uniformly through
the Citation Style Language [@csl]. The researcher curates the result, chooses a
layout, and exports it or publishes a living public page that re-syncs from the
open record. SigmaCV is released under the Apache-2.0 licence, is fully
self-hostable, and is archived with a citable DOI.

# Statement of need

Researchers routinely produce and update CVs for grant applications, hiring,
promotion, and institutional reporting, yet the academic CV remains one of the
least automated documents in scholarly practice. The underlying facts — a
researcher's publications, grants, and appointments — are increasingly available
as open, identifier-linked metadata through infrastructures such as OpenAlex
[@priem2022openalex], ORCID [@haak2012orcid], and Crossref [@hendricks2020crossref],
but turning that record into a correctly formatted, funder-specific CV is still
largely a manual exercise of transcription and reformatting.

Existing tools address only parts of the task. LaTeX and word-processor templates
control appearance but require the author to enter and maintain every entry by
hand. ORCID stores a structured record and can export it, but does not produce a
formatted, curated CV. Profile aggregators such as Google Scholar render a page,
but are closed, name-based, and cannot be exported into the document formats that
institutions demand. Name-based aggregation also conflates researchers who share a
name — a well-known source of error that is acute for common names and for names
in non-Latin scripts. No widely used tool combines automatic, identifier-based
population from open sources with author-controlled curation and reproducible
multi-format output, and few are open-source or self-hostable. SigmaCV closes this
gap, and does so in a way that embodies responsible-assessment norms rather than
merely reproducing citation counts. It is aimed at researchers at any career
stage, and at the librarians and research-office staff who support them.

# Design and functionality

At the centre of SigmaCV is a single canonical CV object: a schema-validated JSON
document that holds both the curated data and the display choices and serves as
the single source of truth. Every output format is a pure function of this object,
produced through one renderer interface rather than through per-format pipelines,
so a CV exports identically across HTML, PDF, DOCX, LaTeX, Markdown, BibTeX,
CSL-JSON, JSON Résumé, and an NIH biosketch. All references are rendered through
the Citation Style Language via `citeproc-js` [@csl], so citations are consistent
and correctly styled everywhere, and the canonical schema is itself published as a
versioned JSON Schema for reuse.

Records are drawn from twelve open sources: OpenAlex, ORCID, Crossref, DataCite,
OpenAIRE, DBLP, Open Editors Plus, ClinicalTrials.gov, the EU CTIS portal, the
European Patent Office, Wikidata, and ROR. The matching rule is deliberately
conservative: items carrying a persistent identifier are matched by ORCID or
OpenAlex author ID and included automatically, whereas sources without one —
clinical trials, patents, and some grant lookups — are matched by name and
organization and surfaced as _review candidates_ that the user must confirm,
never added silently. Curation is non-destructive (items marked "not mine" are
hidden, not deleted), and self-name highlighting is identifier-driven so it
behaves correctly for common and non-Latin names. SigmaCV additionally offers 58
one-click, reversible layouts for major funders, institutions, and industry —
including narrative formats such as the UKRI Résumé for Research and Innovation,
the Royal Society, and the Swiss SNSF — and localizes its interface into ten
languages.

# Responsible research assessment

SigmaCV is designed as open infrastructure for responsible research assessment.
Quantitative metrics are opt-in and default to none; when enabled, field-normalized
indicators are preferred over raw counts and the h-index, and a journal's Impact
Factor is never shown, operationalizing the San Francisco Declaration on Research
Assessment [@dora2013] and the Leiden Manifesto [@hicks2015leiden]. By running
entirely on open research information and publishing each CV as open,
machine-readable metadata, SigmaCV also puts into practice the Barcelona
Declaration on Open Research Information [@barcelona2024], while its first-class
narrative CVs support the qualitative-assessment goals of the Hong Kong Principles
[@moher2020hongkong]. Personal data is handled under the EU GDPR and Japan's APPI,
with per-field publish consent, full export, and account deletion, and SigmaCV
follows the FAIR principles for research software [@wilkinson2016fair; @barker2022fair4rs].

# Acknowledgements

SigmaCV builds on the open infrastructures it consumes; I thank the
OpenAlex/OurResearch, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR, Open Editors
Plus, and Citation Style Language communities. The software received no specific
external funding.

# References
