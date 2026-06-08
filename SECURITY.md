# Security

SigmaCV handles personal data (names, emails, ORCID iDs, CV contents) under
**GDPR** and **Japan APPI**, and doubles as an IRB-governed research vehicle, so
security and privacy are first-class concerns.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the maintainer
(chretien.basile.jean.bernard.u4@s.mail.nagoya-u.ac.jp) rather than opening a
public issue. We aim to acknowledge within a few days.

## Security posture

The codebase has been through four independent multi-lens security audits
(authentication/session, access control/IDOR, injection, XSS, secrets/config,
SSRF, CSRF/cookies, infra/DoS, PII/data-leak, dependencies) — the most recent a
multi-agent automated hardening pass (2026-06-08, see below) — each with
adversarial verification of every finding. Across all passes the **core threat
model has been clean**: no confirmed account takeover, cross-user data leak,
remote code execution, IDOR, SQL injection, or stored XSS. All findings from
CRITICAL down to INFO have been remediated.

### What is enforced

- **Authentication** — Auth.js v5, database-backed sessions (no forgeable JWT),
  no dangerous OAuth account-linking, provider tokens dropped before persistence,
  `AUTH_SECRET` ≥ 32 chars + `AUTH_URL` required in production.
- **Authorization / tenant isolation** — every user-data query is scoped to the
  server-derived `session.user.id`; no endpoint accepts a client-supplied object
  id. The public CV page is gated by an unguessable 80-bit capability slug + a
  `published` flag + a PII-stripping projection.
- **Injection** — zero raw SQL (parameterised Prisma only); no shell-out / no
  server-side LaTeX compilation; DOI/path inputs are allow-listed before use.
- **XSS** — citeproc output is entity-encoded; all owner free-text is HTML-escaped;
  `href`s are scheme-allow-listed; the photo data-URL is a strict, end-anchored
  base64 boundary (no SVG); JSON-LD is `<`-escaped via a shared helper; the public
  page ships a strict `default-src 'none'` CSP as an HTTP header.
- **SSRF** — outbound fetches (claim-by-DOI, custom-CSL, OEP) use fixed hosts /
  host allow-lists with **manual redirect re-validation** and timeouts; private /
  link-local / metadata targets are blocked.
- **CSRF** — every state-changing route enforces `SameSite=Lax` **and** an
  `isSameOrigin` check that **fails closed in production**.
- **DoS** — request bodies are size-capped by **streaming** (not the spoofable
  `content-length`); expensive routes are per-user rate-limited; the public page is
  per-IP + globally rate-limited on the real peer IP, render-cached, and
  negative-caches unknown slugs.
- **Privacy** — public projection strips `owner.personal` and gates contact fields
  behind per-field opt-in (default off); the data export omits tokens; the
  structured logger redacts sensitive keys recursively and reduces Errors to
  `{name, message}`.

### 2026-06-08 hardening pass

A fourth audit run by parallel specialist reviewers (security, type-safety,
correctness, database, performance), each finding adversarially re-verified
before it was applied, drove a further round of defence-in-depth fixes. Every
change shipped with unit tests; the full suite and the `src/lib` coverage gate
were kept green throughout.

- **Abuse resistance** — the Postgres rate limiter now does an **atomic**
  check-and-increment (the cap is enforced inside the `UPDATE … WHERE count <
max`), closing a lost-update race where concurrent requests for one key could
  both pass the cap. The Auth.js `Account`/`Session` foreign keys are indexed;
  the sitemap and GDPR-export queries are bounded, and the export reports a
  truncation flag + true total so it is **never silently incomplete**.
- **Export injection** — the Markdown renderer escapes user free-text section
  titles + name/honorific and collapses control characters in the YAML
  frontmatter (a newline-bearing display name can no longer break out of the
  frontmatter block); `safeHref` strips `user:pass@` userinfo so a pasted
  credential can't leak into an `href` / LaTeX `\url{}`; previously-unbounded
  canonical-document string fields are length-capped.
- **Self-name highlighting** matches only at **Unicode word boundaries**, so a
  short surname ("Li") can't false-highlight inside a longer word ("Library")
  while accented / CJK names still match.
- **Data integrity (re-sync)** — the source merge no longer (a) double-lists a
  claimed preprint a source later publishes, (b) drops a "not mine" / hidden
  decision when one DOI appears in two sections, or (c) collides curation between
  two same-named review venues. Schema migrations are now fully immutable (they
  never mutate the caller's stored document).
- **Input validation** — `locale` is constrained to a BCP-47 shape with a safe
  fallback, neutralising injection-shaped values before they reach `Intl` /
  JSON-LD.

## Operator requirements (production)

Set these before exposing the app publicly (see `.env.production.example`):

- `POSTGRES_PASSWORD` — **required**; deployment fails fast if unset.
- `AUTH_SECRET` — ≥ 32 chars (`openssl rand -base64 33`).
- `AUTH_URL` — the canonical HTTPS origin (anchors OAuth callbacks + the CSRF
  origin check).
- `RATE_LIMIT_PERSIST=true` — durable, cross-instance rate limiting.
- Keep Postgres **unpublished** to the internet (the compose files `expose` only).
- Caddy sets `X-Forwarded-For` to the real peer and `request_body max_size`; keep
  `/api/internal/*` blocked at the edge.

## Accepted residual risks

These are documented, low-severity, and not code-fixable today:

1. **ORCID OIDC has no PKCE/nonce.** ORCID's discovery advertises neither, and
   Auth.js refuses an unadvertised check. Mitigated by a confidential client
   (server-side code exchange with the secret), the `state` check, and no open
   redirect. We will switch to `["state","pkce"]` the moment ORCID advertises it.
2. **Database session token stored at rest.** Inherent to the Auth.js database
   session strategy. Mitigated by managed-Postgres encryption-at-rest, keeping
   `DATABASE_URL` secret, and not publishing Postgres.
3. **Research-export DOI re-identification.** A publication DOI is quasi-identifying;
   the offline export now HMAC-pseudonymises DOIs/source-ids, and the whole
   programme ships **disabled** behind an IRB env-flag triad with a separate
   re-identification key table (対照表) held only by the personal-information
   manager. To be finalised against the IRB pre-registration before enabling.

## Research data handling

Research logging is **off by default** and double-gated (a master switch +
explicit per-user consent). Logged events are minimised structured signals (no
names/emails/ORCIDs). The researcher export is **offline only** (no network
route), triple-env/IRB-gated, and pseudonymised. See `src/lib/research/CLAUDE.md`.
