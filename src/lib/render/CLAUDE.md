# render

The renderer family. **Every format derives entirely from the canonical object** — there are no per-format data pipelines. Keep `types.ts` (the `Renderer` interface) stable.

## How it fits together

- `types.ts` — `RENDER_FORMATS` (`html, pdf, docx, latex, markdown, bibtex`), the `Renderer` interface, and `RenderResult` (exactly one of `text` / `buffer` set per format).
- `index.ts` — `getRenderer(format)` lazily `import()`s each renderer so a consumer only pulls the heavy deps it needs (the live preview never loads Playwright or the `docx` lib).
- `pdf.ts` is **not** a separate pipeline: it runs the HTML renderer and prints the result with Playwright. (Excluded from coverage — real Chromium.) **PDF is the only template-faithful export** — it IS the live template.
- `docx.ts` is deliberately **plain / template-agnostic**: a clean single-column, black-on-white, editable document (header, data tables, sections with the self-name bolded). No accent colour, sidebar, centring or photo — Word can't faithfully reproduce the templates and a clean editable doc is more useful. (An HTML→DOCX route was tried and reverted; conversion fidelity wasn't worth the cost.)
- **Structured contributions** (`section.contributions`, a contributions section only) are prepared ONCE in `prepare.ts` (`PreparedContribution`: number, title, linked item, the linked entry's reference through citeproc with the style's own number removed) and printed after the prose body by every format: `templates/shared.ts` `contributionsHtml`, `contributionsText.ts` (Markdown, LaTeX), `docx.ts` `contributionParagraphs`, and the funder draft. A card whose entry left the record and has no title of its own is skipped everywhere. A prose section renders when it has a body OR a printable card (`proseSectionHasContent`).
- **Supervisee asterisk** (`display.markSupervisees`, the FRQ's "Nom, Prénom*" rule) is applied ONCE in `prepare.ts` for every format, through `nameMarks.ts`. It is the one deliberate name-string match in the renderers: the names are the owner's own supervision records and they are looked for only in the owner's own author lists (`canonical/supervisees.ts`). Never applied while `hideSuperviseeNames` is on. Everything about the ACCOUNT HOLDER stays identifier-matched.
- Shared helpers, used by every text format so output stays consistent: `prepare.ts` (orders/filters sections + items, runs citeproc to text), `emphasize.ts` (`splitSelf`/`wrapSelf` — bold the account holder's name on their own works only), `headerText.ts` (format-agnostic header fields), `metrics.ts`, `authorship.ts`, `charts.ts`, `escape.ts`/`slug.ts`.
- `entryLink.ts` — the ENTRY's own link (ORCID's `url` for an affiliation, or the owner's override), prepared once for every format: `safeHref`-validated, labelled with its host. HTML shows the host beside the entry; the text formats print the whole URL (`prepare.ts`), because a printed CV can't be clicked. Distinct from the institution link behind the institution name (`meta.institutionUrl`/ROR) — the two sit side by side, never nested.

## Template styling (LaTeX only)

`templateStyle.ts` distills the chosen template into a portable `DocStyle` profile (accent colour, serif/sans, accent vs centred vs plain headings, name treatment, `twoColumn`). **`latex.ts` consumes it** so the `.tex` resembles the selected template; DOCX is plain and ignores it. The export-menu tooltip tells users which formats carry the template (PDF exact, LaTeX close, DOCX/Markdown plain).

The **Sidebar** template (`twoColumn`) is the most intricate, in LaTeX:

- **`buildSidebarLatex`**: a `paracol` two-column layout; the full-height accent band is painted with **`eso-pic`** at a computed width (not paracol's `\backgroundcolor`, whose overhang overran the content column). The left column prints white and resets to black on `\switchcolumn` — otherwise the right column renders white-on-white.

## Verifying renderer output

- **LaTeX is compile-verifiable** here: write a `.tex` to a throwaway `.preview/`, run `pdflatex`, and read the PDF. URLs are wrapped in `\url{}` (`xurl`) so they break instead of overflowing the margin.
- **DOCX is NOT visually verifiable** (no LibreOffice in this environment) — verify structurally by unzipping `word/document.xml` (the `docx` lib bundles `jszip`, usable from tests; check the header text, table cells, and **no empty `<w:tr>`** — an empty row corrupts the file in Word).
- The LaTeX photo: a standalone `.tex` can't embed an image, so it leaves a commented `\includegraphics` note for the author to enable.
- Defensive branches use the `/* v8 ignore next N -- reason */` convention to keep the coverage gate green.
