# CV models: reading them against the funders' rules

> Maintainer note. The catalog lives in `src/lib/canonical/cvModels.ts`, the
> documents each model was read against in `src/lib/canonical/cvModelSources.ts`.

A CV model is a starting point: it shows, orders and titles the CV's sections
the way a funder's CV is laid out. Where a funder takes its CV as an online form,
the model is a drafting aid for that form and its description says so. A model
is only as good as its last reading of the funder's rules, and funders reissue
those rules with each call. This note says how to read one and how to record it.

## Reading a model

1. Find the funder's **current** call documents on its own site: the call text,
   the applicant guide, the CV template or the notice for its submission portal.
   A university's summary may point to them but is not the source.
2. For the CV, establish:
   - where it goes (a form on a portal, an upload, a template) and for whom;
   - its headings and their order, in the funder's words;
   - its limits: pages, number of publications, time window;
   - what the funder says about metrics (impact factor, h-index, DORA);
   - its language and page format.
3. Set the model to match: `sections` (shown, in order), `display`
   (`publicationsLimit`, `summaryBlockPosition: "hidden"` where metrics are
   banned, `pageFormat`, …) and `titleOverrides` (the funder's own headings, in
   English when the funder asks for an English CV). Where SigmaCV has no section
   for one of the funder's headings, leave it out and name it in the description
   rather than borrowing an unrelated section.
4. Write the `description` with the call it was read against (e.g. "AAPG 2027"),
   and the nine translations in `src/lib/i18n/cvModelDescriptions.ts`. Funder
   names, form names and portals stay untranslated.
5. Record each document in `cvModelSources.ts`:
   - `document`, the funder's own name for it, and `url`;
   - `listedOn`, the funder's page that links to it, when there is one;
   - `lastVerified`, the day you read it;
   - `recheckBy`, when the funder's next rules are expected (its next call).
     Without it the reading is due twelve months later.
6. Add or update the model's assertions in `tests/cv-models.test.ts`: each one
   is a rule the funder states.

The editor prints "Checked against _documents_ on _date_" under a model with a
record, and from `recheckBy` on adds that the funder may have changed its rules
since. A model without a record prints nothing: it has not been read against a
funder document, and the line never claims otherwise.

## The French funders, read on 2026-10-16

| Model           | What the funder says                                                                                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anr`           | The CV is the "CV appels à projets" form on appelsprojetsrecherche.fr; "Il n'est pas possible de déposer un modèle libre". Impact factor and h-index "proscrit". Funding goes under "Distinctions". Evaluators ask for "l'apport des cinq publications principales", in English. |
| `frm`           | "Principal Investigator (PI) & Co-PI" CV in the Synto portal, in English: "Journal Impact factor, H index and other metrics must not be included." Calls ask for the ten major publications and patents of the last ten years.                                                   |
| `fondation-arc` | A PDF CV with no prescribed structure, a short CV (3,000 or 5,000 characters), and up to ten peer-reviewed publications entered by PMID. No position on metrics.                                                                                                                 |
| `atip-avenir`   | A CV template in English with the headings Cursus, Professional experience, Grants, Teaching and supervision experience, Awards and scientific prizes, Learned societies, each with a character limit; the five main publications go in the online form, Vancouver style.        |

Not verified, and why:

- **FRM's form fields.** The Synto CV form is behind a login; the notices show
  its metrics rule but not its fields. `support@frm.org` could send the list.
- **INCa (PLBIO and similar calls).** The form asks for a short coordinator CV
  (two pages, publications excluded), five main publications of the last five
  years and up to ten or fifteen articles, depending on the call. Its headings
  are free, so no model was added; it is the next candidate.
- **No model, no structure.** DGOS hospital programmes (PHRC-N, PRME, PREPS,
  via INNOVARC), ANRS MIE, the Ligue contre le cancer and the Fondation de
  France ask for "a CV" without a structure.
- **IUF.** Its application template is only inside its candidate portal.
- **Every other model** in the catalog has not yet been read against a funder
  document, and carries no record.
