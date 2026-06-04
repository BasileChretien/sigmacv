/**
 * Master switch for the consent-gated research-logging programme.
 *
 * OFF by default. The disambiguation-error and metric-norms studies (papers #2
 * and #3) require an IRB / ethics protocol with pre-registered confirmatory
 * analyses (see research/CLAUDE.md), which is NOT yet in place. Until it is:
 *   • `logCvSave` writes nothing (no ResearchEvent rows are ever created), and
 *   • the research-consent prompt is not shown (we don't enroll users in a study
 *     that has no governance yet).
 *
 * When ethics approval is obtained, set `RESEARCH_LOGGING_ENABLED=true` (and bump
 * RESEARCH_CONSENT_VERSION so users re-consent under the approved terms) to turn
 * collection back on. The whole pipeline stays intact behind this one flag.
 *
 * Read straight from `process.env` (not the validated `getEnv()`): it's a single
 * optional boolean checked on the save path, and we don't want a malformed
 * unrelated env var to ever turn logging *on* implicitly.
 */
export function isResearchLoggingEnabled(): boolean {
  return process.env.RESEARCH_LOGGING_ENABLED === "true";
}
