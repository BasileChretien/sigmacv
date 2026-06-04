# research

The consent-gated research-logging pipeline (this project is also a research vehicle: disambiguation-error and self-presentation studies).

- **`enabled.ts`** — the **master switch** `isResearchLoggingEnabled()` (env `RESEARCH_LOGGING_ENABLED`, **default OFF**). The whole programme is **paused until an IRB / ethics protocol exists**: while off, `logCvSave` writes nothing (checked before the consent read) and the consent prompt is hidden. To re-enable after approval, set the flag **and** bump `RESEARCH_CONSENT_VERSION` so users re-consent under the approved terms.
- **`log.ts`** — writes `ResearchEvent` rows. **It writes nothing unless the master switch is on AND `User.researchConsent` is true.** This gate is mandatory (GDPR + Japan APPI; logging only under IRB, confirmatory analyses pre-registered).
- **`diff.ts`** — computes the curation deltas that are the actual research signal (e.g. "mine/not-mine" corrections, composition choices), so logged events are minimal and structured rather than raw snapshots.

Treat both the flag and the consent check as hard preconditions — never log on a path that could run without them, and keep events data-minimized.
