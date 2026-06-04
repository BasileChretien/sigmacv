# research

The consent-gated research-logging pipeline (this project is also a research vehicle: disambiguation-error and self-presentation studies).

- **`log.ts`** — writes `ResearchEvent` rows. **It writes nothing unless `User.researchConsent` is true.** This gate is mandatory (GDPR + Japan APPI; logging only under IRB, confirmatory analyses pre-registered).
- **`diff.ts`** — computes the curation deltas that are the actual research signal (e.g. "mine/not-mine" corrections, composition choices), so logged events are minimal and structured rather than raw snapshots.

Treat the consent check as a hard precondition — never log on a path that could run without it, and keep events data-minimized.
