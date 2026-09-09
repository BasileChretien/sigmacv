/**
 * Edge-safe constants for the objection flow, shared by `auth.config.ts` (the
 * provider list) and `src/lib/auth/objection.ts` (the callback, which touches
 * the database and must not be imported from the edge-safe config).
 */
export const OBJECTION_PROVIDER_ID = "orcid-object";
export const OBJECTION_DONE_PATH = "/object/done";
