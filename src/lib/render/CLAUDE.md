# render

The renderer family. **Every format derives entirely from the canonical object** — there are no per-format data pipelines. Keep `types.ts` (the `Renderer` interface) stable.

## How it fits together
- `types.ts` — `RENDER_FORMATS` (`html, pdf, docx, latex, markdown, bibtex`), the `Renderer` interface, and `RenderResult` (exactly one of `text` / `buffer` set per format).
- `index.ts` — `getRenderer(format)` lazily `import()`s each renderer so a consumer only pulls the heavy deps it needs (the live preview never loads Playwright or the `docx` lib).
- `pdf.ts` is **not** a separate pipeline: it runs the HTML renderer and prints the result with Playwright. (Excluded from coverage — real Chromium.)
- `docx` is **also HTML-derived**: `docxHtml.ts` emits DOCX-targeted, inline-styled, **table-based** HTML (Word has no flexbox/grid) and converts it with `@turbodocx/html-to-docx` (a maintained fork — the stale `html-to-docx` crashes on `%` cell widths). This carries the template's accent colour, fonts, coloured sidebar, photo and data tables far better than hand-assembly, while staying a real editable `.docx`. The hand-built `docx.ts` (`renderCvDocxBuffer`, using the `docx` lib) is the **fallback** when conversion throws. `image.ts` holds the shared photo decode used by both.
- Shared helpers, used by every text format so output stays consistent: `prepare.ts` (orders/filters sections + items, runs citeproc to text), `emphasize.ts` (`splitSelf`/`wrapSelf` — bold the account holder's name on their own works only), `headerText.ts` (format-agnostic header fields), `metrics.ts`, `authorship.ts`, `charts.ts`, `escape.ts`/`slug.ts`.

## Template styling (DOCX + LaTeX)
`templateStyle.ts` distills the chosen template into a portable `DocStyle` profile (accent colour, serif/sans, accent vs centred vs plain headings, name treatment, `twoColumn`). `docx.ts` and `latex.ts` both consume it so the exports **resemble the selected template** rather than being template-blind. The visual-fidelity caveat is surfaced to users via an export-menu tooltip (Markdown is intrinsically plain).

The **Sidebar** template (`twoColumn`) is the most intricate:
- **LaTeX** (`buildSidebarLatex`): a `paracol` two-column layout; the full-height accent band is painted with **`eso-pic`** at a computed width (not paracol's `\backgroundcolor`, whose overhang overran the content column). The left column prints white and resets to black on `\switchcolumn` — otherwise the right column renders white-on-white.
- **DOCX** (`sidebarLayout`): a borderless two-column table with a shaded accent left cell. The masthead/body builders are shared with the single-column path so the other templates are unchanged.

## Verifying renderer output
- **LaTeX is compile-verifiable** here: write a `.tex` to a throwaway `.preview/`, run `pdflatex`, and read the PDF. URLs are wrapped in `\url{}` (`xurl`) so they break instead of overflowing the margin.
- **DOCX is NOT visually verifiable** (no LibreOffice in this environment) — verify structurally by unzipping `word/document.xml` (the `docx` lib bundles `jszip`, usable from tests; check shading fills, white runs, table grid, and **no empty `<w:tr>`** which corrupts the file in Word). As a visual proxy, screenshot the DOCX-targeted HTML from `docxHtml.ts` with Playwright — `@turbodocx/html-to-docx` maps that HTML faithfully.
- Image fidelity: `image.ts` decodes intrinsic PNG/JPEG size to avoid distortion and falls back to a square box when it can't read dimensions; LaTeX leaves a commented `\includegraphics` note (no photo is embedded in a standalone `.tex`).
- Defensive branches use the `/* v8 ignore next N -- reason */` convention to keep the coverage gate green.
