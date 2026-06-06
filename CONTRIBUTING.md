# Contributing to SigmaCV

Thanks for your interest in improving SigmaCV — an open tool that builds clean
academic CVs from open research data, and open infrastructure for responsible
research assessment. Contributions of all kinds are welcome: bug reports,
documentation, translations, templates, and code.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug or request a feature** — open an issue with steps to reproduce
  (for bugs) or a concrete use case (for features).
- **Improve a translation** — UI and render strings live in `src/lib/i18n/*` as
  typed per-locale records across ten locales (en-US, zh-CN, es-ES, fr-FR,
  de-DE, ja-JP, pt-BR, it-IT, ko-KR, ru-RU). Adding a key forces a value in all
  ten (TypeScript fails the build otherwise).
- **Add a template or export format** — every output derives from the single
  canonical CV object via the `Renderer` interface in `src/lib/render/`. No
  per-format data pipelines.
- **Fix or extend code** — see the workflow below.

## Project conventions (please read before a PR)

- **Architecture is load-bearing.** One canonical CV object (`src/lib/canonical/`)
  is the single source of truth; every renderer is a pure function of it.
  Citations come only from CSL/citeproc so all formats match. The account holder
  is highlighted by **persistent identifier (ORCID / OpenAlex), never by name
  string**. Don't deviate from these without discussion.
- **Privacy & ethics are mandatory, not optional.** Personal data is handled
  under GDPR + Japan APPI: data minimization, per-field publish consent, account
  export and deletion. Research logging is consent-gated and IRB-governed. Keep
  it that way.
- **Immutability.** Curation operations return new objects; never mutate in
  place.
- **Small, focused files.** Prefer many small modules over large ones.

## Development workflow

```bash
npm install
npm run dev          # Next dev server (auto-syncs the DB schema)
npm run typecheck    # tsc --noEmit — run after every code change
npm test             # vitest run — full unit/integration suite
npm run coverage     # ENFORCES the coverage gate on src/lib/**
```

Before opening a PR:

1. `npm run typecheck` passes.
2. `npm run coverage` passes — the gate (scoped to `src/lib/**`) fails below
   **stmts 98 / branches 87 / funcs 99 / lines 99**. New domain code needs
   tests. Genuinely-unreachable defensive branches use an inline
   `/* v8 ignore next N -- reason */` comment.
3. New user-facing or render strings are defined for **all ten locales**.
4. Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, …).
5. Remove one-off QA artifacts (`.preview/` files, throwaway test/script files).

## Security

Please do not open public issues for security vulnerabilities. See
[SECURITY.md](SECURITY.md) if present, or email the maintainer privately (see
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for contact).

## License

By contributing, you agree that your contributions are licensed under the
project's [Apache License 2.0](LICENSE).
