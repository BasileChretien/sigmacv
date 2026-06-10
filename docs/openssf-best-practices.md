# OpenSSF Best Practices badge — drafted answers (roadmap B4)

This is a **ready-to-submit draft** of the OpenSSF Best Practices Badge
self-assessment (passing level) for SigmaCV. The questionnaire lives at
<https://www.bestpractices.dev/> — sign in with GitHub, register the project
(repo `https://github.com/BasileChretien/sigmacv`), and copy the answers below
into the matching criteria. Each criterion notes the status (**Met** / **Unmet**
/ **N/A**) and the justification + URL the form asks for.

> The companion automated half (**OpenSSF Scorecard**) ships as
> `.github/workflows/scorecard.yml`; it runs on push to `main` + weekly and (with
> `publish_results: true`) feeds the public Scorecard API once it has run on the
> default branch.

Legend: ✅ Met · 🟡 needs a one-time human action · ⬜ unmet (future).

---

## Basics

| Criterion                   | Status | Answer / URL                                                                                                                                                 |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `description_good`          | ✅     | README states what the project does in clear language (auto-builds academic CVs from open research data). <https://github.com/BasileChretien/sigmacv#readme> |
| `interact`                  | ✅     | Issues + discussions + PRs on GitHub; CONTRIBUTING.md documents how to engage.                                                                               |
| `contribution`              | ✅     | `CONTRIBUTING.md` at repo root.                                                                                                                              |
| `contribution_requirements` | ✅     | `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1) describe requirements + expectations.                                                    |
| `floss_license`             | ✅     | Apache-2.0 (OSI-approved), `LICENSE` at root, `license` in `package.json`.                                                                                   |
| `license_location`          | ✅     | `LICENSE` in a standard top-level location.                                                                                                                  |
| `documentation_basics`      | ✅     | README + `docs/` (architecture, FAQ, open-science, security) + per-directory `CLAUDE.md` contributor notes.                                                  |
| `documentation_interface`   | ✅     | README "user flow" + FAQ describe the interface; the app is self-documenting (guided editor).                                                                |
| `sites_https`               | ✅     | Project site `https://sigmacv.org` (Caddy auto-HTTPS); repo + docs on GitHub HTTPS.                                                                          |
| `discussion`                | ✅     | GitHub Issues / Discussions for the project.                                                                                                                 |
| `english`                   | ✅     | Docs + maintainer communication in English (UI itself is localized to 10 languages).                                                                         |
| `maintained`                | ✅     | Actively maintained (frequent commits/releases; Scorecard "Maintained" check refreshes weekly).                                                              |

## Change control

| Criterion             | Status | Answer / URL                                                                                      |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `repo_public`         | ✅     | Public git repo on GitHub.                                                                        |
| `repo_track`          | ✅     | All changes tracked in git.                                                                       |
| `repo_interim`        | ✅     | Interim work is on `main` + PR branches; full history public.                                     |
| `repo_distributed`    | ✅     | git (distributed VCS).                                                                            |
| `version_unique`      | ✅     | SemVer; `version` in `package.json` + `CITATION.cff`/`codemeta.json`; tagged releases (`v0.1.0`). |
| `version_semver`      | ✅     | Semantic Versioning.                                                                              |
| `version_tags`        | ✅     | Git tags per release; GitHub Releases.                                                            |
| `release_notes`       | ✅     | `CHANGELOG.md` (Keep a Changelog) + GitHub Release notes.                                         |
| `release_notes_vulns` | ✅     | Changelog/security policy call out security-relevant fixes; no known unfixed vulns at release.    |

## Reporting

| Criterion                       | Status | Answer / URL                                                                     |
| ------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `report_process`                | ✅     | Bug reports via GitHub Issues (`.github/ISSUE_TEMPLATE`).                        |
| `report_tracker`                | ✅     | GitHub Issues is the public tracker.                                             |
| `report_responses`              | ✅     | Maintainer responds to issues/PRs; SUPPORT.md sets expectations.                 |
| `enhancement_responses`         | ✅     | Feature requests handled via Issues/Discussions.                                 |
| `report_archive`                | ✅     | Issue history is publicly archived on GitHub.                                    |
| `vulnerability_report_process`  | ✅     | `SECURITY.md` documents private vulnerability reporting to the maintainer email. |
| `vulnerability_report_private`  | ✅     | Private channel = maintainer email in `SECURITY.md` (not a public issue).        |
| `vulnerability_report_response` | ✅     | `SECURITY.md` states an acknowledgement target ("within a few days").            |

## Quality

| Criterion                     | Status | Answer / URL                                                                                                                |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `build`                       | ✅     | `npm run build` (Next.js); reproducible from a clean `npm ci`.                                                              |
| `build_common_tools`          | ✅     | Standard tooling (Node 22, npm, TypeScript).                                                                                |
| `build_floss_tools`           | ✅     | All build tools are FLOSS.                                                                                                  |
| `test`                        | ✅     | Vitest suite (~800 unit/integration tests) + Playwright E2E; `tests/`.                                                      |
| `test_invocation`             | ✅     | `npm test` (single documented command).                                                                                     |
| `test_most`                   | ✅     | Coverage gate enforced on `src/lib/**` (stmts 98 / branches 87 / funcs 99 / lines 99) via `npm run coverage`.               |
| `test_continuous_integration` | ✅     | GitHub Actions `ci.yml` runs format + typecheck + tests + build on every push/PR.                                           |
| `test_policy`                 | ✅     | Convention: new `src/lib` code needs tests; coverage gate enforces it (documented in `tests/CLAUDE.md` + root `CLAUDE.md`). |
| `tests_are_added`             | ✅     | New features ship with tests (PR history shows test files alongside features).                                              |
| `tests_documented_added`      | ✅     | Test policy documented in `CLAUDE.md` / `tests/CLAUDE.md`.                                                                  |
| `warnings`                    | ✅     | TypeScript `strict: true`; Prettier `format:check` in CI; build fails on type errors.                                       |
| `warnings_fixed`              | ✅     | CI is green on `main` (no outstanding type/format warnings).                                                                |
| `warnings_strict`             | ✅     | `strict: true` (maximally strict tsc) + i18n key completeness enforced at compile time.                                     |

## Security

| Criterion                        | Status | Answer / URL                                                                                                                                         |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `know_secure_design`             | ✅     | `SECURITY.md` documents the threat model + enforced controls; four independent security audits with adversarial verification.                        |
| `know_common_errors`             | ✅     | Audits covered OWASP-style classes (authn/session, IDOR, injection, XSS, SSRF, CSRF, secrets, PII leak).                                             |
| `crypto_published`               | ✅     | Uses standard published crypto only (TLS via Caddy; Auth.js sessions; no home-grown crypto).                                                         |
| `crypto_call`                    | ✅     | Crypto delegated to vetted libraries (Auth.js, platform TLS), not reimplemented.                                                                     |
| `crypto_floss`                   | ✅     | All crypto libraries are FLOSS.                                                                                                                      |
| `crypto_keylength`               | ✅     | `AUTH_SECRET` ≥ 32 chars enforced in prod (`env.ts`); secrets generated with `openssl rand`.                                                         |
| `crypto_working`                 | ✅     | No known-broken algorithms; TLS-only delivery.                                                                                                       |
| `crypto_weaknesses`              | ✅     | No use of MD5/SHA-1 for security; modern defaults.                                                                                                   |
| `crypto_pfs`                     | ✅     | TLS with forward secrecy via Caddy defaults.                                                                                                         |
| `crypto_password_storage`        | ✅     | No app-managed passwords for users — auth is OAuth (ORCID/Google) + email magic-link via Auth.js; DB credentials are env-only secrets.               |
| `crypto_random`                  | ✅     | CSPRNG (`node:crypto` `randomBytes`/`randomUUID`) for tokens/slugs.                                                                                  |
| `delivery_mitm`                  | ✅     | Source via GitHub HTTPS; releases via GitHub; deps via npm registry over HTTPS; Actions SHA-pinned.                                                  |
| `delivery_unsigned`              | ✅     | Delivery channels are integrity-protected (HTTPS + GitHub); SBOM (CycloneDX) attached to releases.                                                   |
| `vulnerabilities_fixed_60_days`  | ✅     | No known unpatched vulnerabilities; audit findings (CRITICAL→INFO) all remediated.                                                                   |
| `vulnerabilities_critical_fixed` | ✅     | Core threat model clean across audits; criticals fixed.                                                                                              |
| `no_leaked_credentials`          | ✅     | Secrets are env-only; deployment fails fast if `POSTGRES_PASSWORD`/`AUTH_SECRET` unset; `.env.production.example` is the template (no real secrets). |

## Analysis

| Criterion                                | Status | Answer / URL                                                                                                                                                                |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static_analysis`                        | ✅     | **CodeQL** SAST (`.github/workflows/codeql.yml`, push/PR/weekly) + TypeScript `strict` type-checking in CI (`npm run typecheck`) + the OpenSSF Scorecard signal.            |
| `static_analysis_common_vulnerabilities` | ✅     | **CodeQL** scans for common vulnerability classes (injection, unsafe deserialization, path traversal, etc.) on every push/PR + weekly, results in Security ▸ Code scanning. |
| `static_analysis_fixed`                  | ✅     | Type/format issues fixed before merge (CI gate).                                                                                                                            |
| `static_analysis_often`                  | ✅     | Runs on every push/PR.                                                                                                                                                      |
| `dynamic_analysis`                       | 🟡     | Playwright E2E exercises the running app; no dedicated fuzzing/DAST (passing level allows this; note as future hardening).                                                  |
| `dynamic_analysis_unsafe`                | N/A    | Memory-unsafe languages not used (TypeScript/Node).                                                                                                                         |
| `dynamic_analysis_enable_assertions`     | ✅     | Zod runtime validation at all system boundaries acts as always-on assertions.                                                                                               |

---

## One-time human actions (🙋 Basile)

1. **Register the project** at <https://www.bestpractices.dev/> (GitHub login) and
   paste the answers above. Most criteria are auto-justifiable with the repo URLs.
2. After the **Scorecard** workflow first runs on `main`, add the badge to the
   README (snippet below) and link the bestpractices badge once issued.
3. Optionally enable **GitHub code scanning** (Security ▸ Code scanning) so the
   Scorecard SARIF upload surfaces in the Security tab.

### Badges to add once live

```markdown
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/BasileChretien/sigmacv/badge)](https://scorecard.dev/viewer/?uri=github.com/BasileChretien/sigmacv)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/PROJECT_ID/badge)](https://www.bestpractices.dev/projects/PROJECT_ID)
```

(Replace `PROJECT_ID` with the number bestpractices.dev assigns on registration.)

## Future hardening (beyond passing)

- ~~**Pin all workflow actions by SHA**~~ — **done**: `ci.yml` / `e2e.yml` /
  `release.yml` / `scorecard.yml` / `codeql.yml` all SHA-pin their actions (with
  `# vX.Y.Z` comments), so the Scorecard "Pinned-Dependencies" check is satisfied
  repo-wide. Dependabot's `github-actions` ecosystem keeps the pins current.
- ~~**CodeQL** workflow for automated SAST~~ — **done**: `.github/workflows/codeql.yml`
  (push/PR/weekly, JS+TS, results in Security ▸ Code scanning).
- Consider **silver/gold** criteria later (signed releases, ≥2 maintainers,
  dependency monitoring already satisfied via `.github/dependabot.yml`).
