# Frequently asked questions

A plain-language FAQ for everyone — no technical knowledge needed. (The same
answers appear inside the app.)

### What is SigmaCV?

SigmaCV is a free, open tool that builds your academic CV for you from the public
research record, and keeps it in sync. You curate what shows, choose the style,
and export to PDF, Word, LaTeX, Markdown and more — or publish a web page that
updates itself. It's also "open infrastructure for responsible research
assessment", run not-for-profit.

### What is an ORCID iD?

ORCID is a **free, unique identifier for researchers** — think of it as a
permanent digital name tag that stays with you across jobs, name changes, and
journals. SigmaCV uses it to find _your_ work reliably (never by name alone). You
can get one in a couple of minutes at [orcid.org](https://orcid.org).

### Is it free?

Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence.
You can run your own copy, or use the hosted version when it launches.

### Is it live yet?

Not as a hosted service — SigmaCV is **pre-launch**. You can run your own copy
today (see the [README](../README.md)), and a free hosted version that anyone can
sign in to is planned. ⭐ Star or watch the repository to hear when it opens.

### Where does my CV data come from?

From open research data sources, read as **public metadata only**: OpenAlex
(publications & metrics), ORCID (your verified identity, plus positions,
education, funding, peer-review and service), Crossref and DataCite (metadata),
OpenAIRE (datasets & software), DBLP (conference papers), and Open Editors Plus
(editorial roles). Grants also come from Crossref and the UKRI, NIH and NSF
databases; clinical trials from ClinicalTrials.gov and the EU CTIS; and patents
from the EPO. SigmaCV never reads private documents and never changes anything in
those databases on your behalf.

### How do you know which publications are mine?

Your work is matched by **identifier** — your ORCID iD or OpenAlex author ID —
**never by your name as text**. That avoids the "someone else with my name"
mix-ups that plague name-based tools. Sources without an identifier (clinical
trials, patents, some grant lookups) are matched by name + organization and shown
as **review candidates that you confirm**, rather than added silently. You then
curate the list, marking anything wrong as **"not mine"** (it's hidden, never
deleted).

### Will citation metrics or the Impact Factor be shown?

No metrics are shown by default. Metrics are **opt-in** and you choose them; we
prefer field-normalized indicators over raw counts, and we **never** display a
journal's Impact Factor on your CV — in line with [DORA](https://sfdora.org/).

### How is my privacy protected? Can I export or delete my data?

SigmaCV reads only public research metadata, asks for **per-field consent** before
anything is published, and **never logs your choices for research without your
explicit consent**. You can **export your data and delete your account at any
time** (GDPR + Japan APPI). See [SECURITY.md](../SECURITY.md) for the full
security posture.
