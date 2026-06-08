# tests

Vitest unit + integration suite (~535 tests across ~59 files). Config in `vitest.config.ts`; `@` is aliased to `src/`.

## Running

```bash
npm test                                   # whole suite
npm run coverage                           # suite + ENFORCE the gate
npx vitest run tests/curate.test.ts        # one file
npx vitest run -t "Sidebar template"       # tests matching a name
npx vitest tests/curate.test.ts            # watch one file
```

## Environment

- Default env is **node** (fast) for pure-logic tests. Component tests opt into jsdom per-file with a `// @vitest-environment jsdom` header comment.
- `testTimeout` is 30s (not the 5s default): citeproc engine init is ~0.7s per render and the multi-render tests do many, especially under coverage instrumentation.
- External APIs are never hit — clients are tested with mocked `fetch`; Prisma is mocked. Fixtures live in `tests/fixtures/` (e.g. `openalex-works.json`).

## Coverage gate

Scoped to `src/lib/**`, fails the run below **stmts 98 / branches 87 / funcs 99 / lines 99**. `src/lib/render/pdf.ts` (Playwright) and `src/lib/db.ts` (Prisma singleton) are excluded. New `src/lib` code generally needs a test that exercises it; mark truly-unreachable defensive branches with `/* v8 ignore next N -- reason */` rather than contriving a test.

## QA-artifact hygiene

When verifying renderer output (e.g. compiling a `.tex` or building a `.docx`), generate throwaway files via a temporary `tests/_*_gen.test.ts` writing into a git-ignored `.preview/`, then **delete the temp test and `.preview/` before committing**. The same applies to one-off `scripts/_*.mjs`. Don't commit generated PDFs/DOCX/preview files.
