# tests

Vitest unit + integration suite (~4,800 tests across ~390 files). Config in `vitest.config.ts`; `@` is aliased to `src/`.

## Running

```bash
npm test                                   # whole suite
npm run coverage                           # suite + ENFORCE the gate (what CI runs)
npx vitest run tests/curate.test.ts        # one file
npx vitest run -t "Sidebar template"       # tests matching a name
npx vitest tests/curate.test.ts            # watch one file
```

## Environment

- Default env is **node** (fast) for pure-logic tests. Component tests opt into jsdom per-file with a `// @vitest-environment jsdom` header comment.
- `testTimeout` is 30s (not the 5s default): citeproc engine init is ~0.7s per render and the multi-render tests do many, especially under coverage instrumentation.
- External APIs are never hit — clients are tested with mocked `fetch`; Prisma is mocked. Fixtures live in `tests/fixtures/` (e.g. `openalex-works.json`).
- Tests that run a `scripts/*.sh` go through `tests/helpers/bashScript.ts`, never a bare `bash`. On Windows a bare `bash` is the WSL launcher when the tests start from PowerShell (it cannot open a Windows drive path and is not handed the Windows environment) and Git Bash when they start from Git Bash; the helper asks git where it is installed (`git --exec-path`, then the default install locations) and runs that Git for Windows' bash by absolute path either way; where it finds none the suites skip. A tool the script checks for, or calls on its way out (`rclone`, `docker`), gets a stand-in first on PATH (`stubCommand`): the guards behind an "is it installed" check then run on machines without the tool (CI's runner has no rclone), no test can reach a real remote, daemon or database, and `stubCalls` returns what the script sent to the stand-in.

## Coverage gate

Scoped to `src/lib/**`, fails the run below **stmts 98 / branches 87 / funcs 99 / lines 99**. **CI enforces it**: the test step of `.github/workflows/ci.yml` runs `npm run coverage` (not `npm test`) inside the required `Format · Typecheck · Test · Build` check. Measured on the runner on 2026-10-02: 98.76 / 93.93 / 99.46 / 99.49, about 3 min for the step against 1.5–2 min without instrumentation; the slowest single test took 9 s. `src/lib/render/pdf.ts` (Playwright) and `src/lib/db.ts` (Prisma singleton) are excluded. New `src/lib` code generally needs a test that exercises it; mark truly-unreachable defensive branches with `/* v8 ignore next N -- reason */` rather than contriving a test.

Two things to know when reading the gate locally:

- **A failing test suppresses the coverage table.** Vitest prints no report, and checks no threshold, when any test fails — fix the failures first.
- **On a busy machine the heavy render tests can time out under coverage** (`export-parity`, `peer-review`, `supervisee-marks`, `template-style`, `pub-limit` at 30 s; `pdf-page-geometry` at 60 s). They pass alone and on CI. Before suspecting the code, re-run with nothing else using the machine, or with `--testTimeout=180000`.

## QA-artifact hygiene

When verifying renderer output (e.g. compiling a `.tex` or building a `.docx`), generate throwaway files via a temporary `tests/_*_gen.test.ts` writing into a git-ignored `.preview/`, then **delete the temp test and `.preview/` before committing**. The same applies to one-off `scripts/_*.mjs`. Don't commit generated PDFs/DOCX/preview files.
