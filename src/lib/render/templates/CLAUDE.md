# render/templates

The **HTML** templates — the on-screen CV and the source of truth for each template's visual identity. (The DOCX/LaTeX exports don't re-implement these; they *resemble* them via `render/templateStyle.ts`.)

- **`index.ts`** — the template registry (`classic`, `modern`, `sidebar`, `ats`, `rirekisho`); the editor's thumbnail gallery picks from it.
- **`shared.ts`** — the common builder (header, sections, citation list, charts, authorship table, name highlight, print CSS) that the templates configure. Most logic lives here.
- Per-template files (`classic.ts`, `modern.ts`, `sidebar.ts`, `ats.ts`) tune layout/colour/headings. **`rirekisho.ts`** is the Japanese 履歴書 layout (distinct structure). **`ats.ts`** is intentionally plain/monochrome for parser safety.
- `types.ts` — the template contract.

When you add or change a template, update `templateStyle.ts` so DOCX + LaTeX track it (e.g. `sidebar` sets `twoColumn`).
