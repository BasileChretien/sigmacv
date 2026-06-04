# citeproc

CSL citation rendering — the reason citations are **identical across every output format**.

- **`engine.ts`** — builds a `citeproc-js` engine from vendored CSL assets, with `retrieveLocale`/`retrieveItem` reading from `assets/`. Engine init is ~0.7s, which is why the test timeout is raised.
- **`assets.ts`** — loads the vendored `.csl` styles + en-US locale. They are vendored by **`npm run fetch-csl`** (not committed-by-hand); the "missing asset" branches are defensive and marked `/* v8 ignore */`.
- **`styleCatalog.ts`** + **`customStyle.ts`** — the selectable style list and validation/resolution of a chosen style (strict CSL validation; the editor's single searchable style control resolves through here).
- **`highlight.ts`** — wraps the account holder's `selfNameVariants` for **`authoredBySelf` items only**. Highlighting is identifier-driven; a name string is never the trigger, so common names / CJK scripts never false-highlight.

Renderers consume citeproc **text** output via `render/prepare.ts` — don't re-format citations per format.
