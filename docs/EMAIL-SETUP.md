# Outbound email setup — free, no branding (SMTP2GO + Porkbun)

> **Status:** the app's email features (magic-link sign-in + the opt-in re-sync
> digest, PR #118) are **dormant** until `EMAIL_SERVER`/`EMAIL_FROM` are set.
> sigmacv.org currently has **inbound-only** mail (Porkbun's free reroute
> forwarding) and no outbound SMTP. This guide creates the outbound side at
> **zero cost**, without touching the existing forwarding.

## Why SMTP2GO (decision record, 2026-06)

| Option                         | Free tier                           | Deal-breaker?                                                                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SMTP2GO** ✅                 | 1,000/mo, 200/day, forever, no card | None found: **no branding injected**, domain auth via 3 CNAMEs, ports 2525/587 (Hetzner only blocks 25). NZ company — an EU **adequacy-decision** country (GDPR-workable).                                                                              |
| Brevo                          | 300/day (~9k/mo), EU company        | **Injects a "Sent with Brevo" badge into every free-plan email, transactional SMTP included** — would mangle our localized plain-text digests. Removal costs ≥$9/mo.                                                                                    |
| Resend                         | 3,000/mo, 100/day, 1 domain         | Runner-up if volume outgrows SMTP2GO. US processor (transfer mechanism needed); free tier has no analytics.                                                                                                                                             |
| Self-hosted Postfix on the VPS | $0                                  | Hetzner blocks outbound port 25 (unblock by support request), fresh-IP reputation → digests silently spam-foldered at Gmail/Outlook. The failure mode is invisible, which kills a retention feature. Revisit only if a relay ever becomes unacceptable. |

Volume check: digests are **monthly per opted-in user** + magic-link logins.
1,000/month covers ~900 opted-in users; the app's own batch cap is 200/run.

## Setup (≈20 minutes, all free)

### 1. SMTP2GO account

1. Sign up at <https://www.smtp2go.com> (free plan, no credit card).
2. **Sending → Verified Senders → Sender domains → Add sigmacv.org.**
   You'll be shown **three CNAME records** (return-path/SPF, DKIM, tracking).
   Until the domain verifies, the free plan caps at 25 emails/hour — verification
   lifts it.

### 2. DNS at Porkbun (coexists with the reroute)

The free email forwarding uses **MX records**; we only add CNAMEs + one TXT, so
**inbound forwarding is untouched**.

1. Porkbun → sigmacv.org → DNS: add the three CNAMEs exactly as SMTP2GO shows
   them (names like `em1234._domainkey`, a return-path host, a tracking host —
   values point at smtp2go domains).
2. Add a basic DMARC policy (alignment comes from SMTP2GO's DKIM):

   ```
   TYPE  TXT
   HOST  _dmarc
   VALUE v=DMARC1; p=none; rua=mailto:privacy@sigmacv.org
   ```

   (`privacy@` already forwards via the reroute. Tighten `p=none` →
   `p=quarantine` after a few clean weeks of reports.)

3. Back in SMTP2GO, hit **Verify** — usually green within minutes.

### 3. A From address that can receive replies

Use a real, reply-able sender (we have free inbound forwarding — no excuse for
`no-reply@`):

1. Porkbun → Email Forwarding: add `hello@sigmacv.org` → your inbox (same as
   the existing `privacy@` reroute).
2. The digest's one-click unsubscribe is in every mail anyway (RFC 8058), so
   replies are a bonus channel, not a compliance need.

### 4. SMTP credentials → `.env` on the VPS

1. SMTP2GO → **Sending → SMTP Users → Add SMTP user.** Prefer a **generated
   alphanumeric password** — the value goes into a URL, and `@ : / %` etc. would
   need percent-encoding (same trap as the hex-only `PLAUSIBLE_DB_PASSWORD`).
2. In the server's `.env`:

   ```
   EMAIL_SERVER="smtp://SMTPUSER:SMTPPASSWORD@mail.smtp2go.com:2525"
   EMAIL_FROM="SigmaCV <hello@sigmacv.org>"
   ```

   Port 2525 (or 587) — both are open from Hetzner; TLS is negotiated via
   STARTTLS automatically.

### 5. Deploy + verify

```bash
cd ~/sigmacv
git pull
docker compose up -d --build          # needs the #117/#118 image anyway
```

Setting `EMAIL_SERVER` also enables **email magic-link sign-in** (the sign-in
page gains an email option) — that's the easiest end-to-end SMTP test:

1. **Spam-score check:** go to <https://www.mail-tester.com>, copy its
   throwaway address, enter it in the SigmaCV email-sign-in box, then check the
   score (target ≥ 9/10; fix whatever it flags — usually a missing DNS record).
2. **Magic link to yourself:** sign in by email, confirm delivery to your inbox
   (not spam).
3. **Digest dry-run:** opt in via the editor's "Email updates" toggle, then run
   the call from INSIDE the Docker network (Caddy 404s `/api/internal/*` from
   outside, and the app port isn't published to the host). The `digest-cron`
   container has both curl and the secret:

   ```bash
   docker compose exec -T digest-cron sh -c \
     'curl -fsS -X POST -H "Authorization: Bearer $RESYNC_SECRET" http://app:3000/api/internal/digest'
   ```

   Expect `{"ok":true,"configured":true,...}`. A real digest only sends when a
   re-sync actually **changed** your CV since the last digest (per-user monthly
   floor) — so `"sent":0` on a quiet account is correct, not a failure. The
   `digest-cron` container then handles the daily ping forever.

4. **Unsubscribe round-trip:** when a digest arrives, click its unsubscribe
   link; confirm the account toggle is off.

### 6. Paperwork (one-time)

- **Privacy policy:** add SMTP2GO as an email-delivery processor (New Zealand —
  EU adequacy decision 2013/65/EU, reconfirmed 2024). Data shared: recipient
  address + the digest text (titles of the user's own public works).
- The digest itself is already GDPR-clean by design: opt-in default-off,
  one-click unsubscribe, flag included in the account data export.

## Limits to remember

- Free plan: **1,000 emails/month, 200/day** (and 25/hour only while the domain
  is unverified). The app's digest batch is capped at 200/run and per-user
  monthly, so organic growth hits the monthly cap at roughly ~900 opted-in
  users — by then, SMTP2GO's paid tier ($15/mo) or Resend (3k/mo free) are the
  upgrade paths, with **no code change** (it's all the `EMAIL_SERVER` URL).
