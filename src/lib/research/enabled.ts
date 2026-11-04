/**
 * Master switch for the consent-gated research-logging programme.
 *
 * OFF by default. The disambiguation-error and CV-composition studies run
 * under Nagoya University's observational study 2026-0310, approved by the
 * Bioethics Review Committee on 2026-10-21 (see research/CLAUDE.md). While off:
 *   • `logCvSave` writes nothing (no ResearchEvent rows are ever created),
 *   • the editor link and the consent form do not exist, and
 *   • the consent route refuses a grant.
 * Withdrawal never depends on it: an account holding a consent keeps the
 * account-menu entry and "Stop taking part", and the route accepts it.
 *
 * RESEARCH_CONSENT_VERSION is already 2, the approved terms, so turning the
 * study on is `RESEARCH_LOGGING_ENABLED=true` alone, once the research panel
 * that implements the approved consent screen is deployed.
 *
 * Read straight from `process.env` (not the validated `getEnv()`): it's a single
 * optional boolean checked on the save path, and we don't want a malformed
 * unrelated env var to ever turn logging *on* implicitly.
 */
export function isResearchLoggingEnabled(): boolean {
  return process.env.RESEARCH_LOGGING_ENABLED === "true";
}
