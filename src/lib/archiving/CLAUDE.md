# archiving

The self-archiving programme: help the owner put a legal copy of each closed paper in the right open repository. **Editor-only, end to end** — nothing here reaches the public page, an export, the OAI-PMH feed, a frozen version or the anonymous preview (`tests/funders-not-public.test.ts` checks it at the source).

## Why one folder

The worklist prints three separate facts under a closed work, each with its own source and date: the **publisher's** policy (OA.Works), the **statute** of the country printed on the paper, and the **funder's** policy (`funders/oaPolicies.ts`, joined to the owner's own grants). They must never merge into one verdict. This folder holds the first two and — next — the deposit routes, so the programme reads in one place while `funders/` stays about funders:

- `selfArchivingPass.ts` — the OWNER sync's OA.Works pass (`meta.selfArchiving`). Called from `syncCvForUser` only, never from `buildCvFromOrcid` (which the anonymous preview shares). Sequential, capped, wall-clock budgeted, a 7-day refresh window; a failed call keeps the stored record, an answered "no record" clears it. The HTTP client itself follows the external-client convention at `src/lib/oaworks/client.ts`.
- `statutoryRights.ts` — the committed, hand-verified table of statutory self-archiving rules by country (same `verifiedBy` / `lastVerified` scheme as the funder table). Maintainer note: `docs/STATUTORY-ARCHIVING-RIGHTS.md`.
- `depositRoutes.ts` — _not built yet_ (PR2): one action per closed row (verb + destination + one-clause reason).

## Rules (test-enforced)

- **Facts beside the work, never a state.** No totals, no N-of-M, no percentage, no "coverage", no verdict. Whether a policy or a statute applies is the owner's judgement; statutory sentences say "may also apply".
- **Banned vocabulary** on every `wl*` key in all ten locales and in the statutory table: compliant / compliance / overdue / violation / mandate / mandatory / percent / %, and their translations (`tests/worklist-i18n.test.ts`, `tests/funding-i18n.test.ts`, `tests/statutory-rights.test.ts`).
- **Every fact is dated and sourced**: OA.Works' own "updated" date plus SigmaCV's retrieval date; each statutory entry's `lastVerified` (or the pending wording).
- **Store only what the row prints.** The OA.Works boundary drops copyright-owner names, contributor e-mails and scores; a work that stops being a candidate loses its record.
