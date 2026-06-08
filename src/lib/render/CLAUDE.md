# render

The renderer family. **Every format derives entirely from the canonical object** — there are no per-format data pipelines. Keep `types.ts` (the `Renderer` interface) stable.

## How it fits together

- `types.ts` — `RENDER_FORMATS` (`html, pdf, docx, latex, markdown, bibtex`), the `Renderer` interface, and `RenderResult` (exactly one of `text` / `buffer` set per format).
- `index.ts` — `getRenderer(format)` lazily `import()`s each renderer so a consumer only pulls the heavy deps it needs (the live preview never loads Playwright or the `docx` lib).
- `pdf.ts` is **not** a separate pipeline: it runs the HTML renderer and prints the result with Playwright. (Excluded from coverage — real Chromium.) **PDF is the only template-faithful export** — it IS the live template.
- `docx.ts` is deliberately **plain / template-agnostic**: a clean single-column, black-on-white, editable document (header, data tables, sections with the self-name bolded). No accent colour, sidebar, centring or photo — Word can't faithfully reproduce the templates and a clean editable doc is more useful. (An HTML→DOCX route was tried and reverted; conversion fidelity wasn't worth the cost.)
- Shared helpers, used by every text format so output stays consistent: `prepare.ts` (orders/filters sections + items, runs citeproc to text), `emphasize.ts` (`splitSelf`/`wrapSelf` — bold the account holder's name on their own works only), `headerText.ts` (format-agnostic header fields), `metrics.ts`, `authorship.ts`, `charts.ts`, `escape.ts`/`slug.ts`.

## Template styling (LaTeX only)

`templateStyle.ts` distills the chosen template into a portable `DocStyle` profile (accent colour, serif/sans, accent vs centred vs plain headings, name treatment, `twoColumn`). **`latex.ts` consumes it** so the `.tex` resembles the selected template; DOCX is plain and ignores it. The export-menu tooltip tells users which formats carry the template (PDF exact, LaTeX close, DOCX/Markdown plain).

The **Sidebar** template (`twoColumn`) is the most intricate, in LaTeX:

- **`buildSidebarLatex`**: a `paracol` two-column layout; the full-height accent band is painted with **`eso-pic`** at a computed width (not paracol's `\backgroundcolor`, whose overhang overran the content column). The left column prints white and resets to black on `\switchcolumn` — otherwise the right column renders white-on-white.

## Verifying renderer output

- **LaTeX is compile-verifiable** here: write a `.tex` to a throwaway `.preview/`, run `pdflatex`, and read the PDF. URLs are wrapped in `\url{}` (`xurl`) so they break instead of overflowing the margin.
- **DOCX is NOT visually verifiable** (no LibreOffice in this environment) — verify structurally by unzipping `word/document.xml` (the `docx` lib bundles `jszip`, usable from tests; check the header text, table cells, and **no empty `<w:tr>`** — an empty row corrupts the file in Word).
- The LaTeX photo: a standalone `.tex` can't embed an image, so it leaves a commented `\includegraphics` note for the author to enable.
- Defensive branches use the `/* v8 ignore next N -- reason */` convention to keep the coverage gate green.
