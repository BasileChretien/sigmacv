import { z } from "zod";
import { APPROVED_CONSENT_LOCALES } from "./index";

/**
 * The body of POST /api/account/consent.
 *
 * A grant names the consent version and the language of the text the person
 * read, so the record says what was agreed to; a version the server no longer
 * holds is refused (the page was loaded before an update). Checkbox ② is
 * `secondaryUse`, false unless ticked. A withdrawal may name the language of
 * the panel it was made from. Unknown keys are refused.
 */
const GrantSchema = z
  .object({
    consent: z.literal(true),
    version: z.number().int().positive(),
    locale: z.enum(APPROVED_CONSENT_LOCALES),
    secondaryUse: z.boolean().optional(),
  })
  .strict();

const WithdrawSchema = z
  .object({
    consent: z.literal(false),
    locale: z.enum(APPROVED_CONSENT_LOCALES).optional(),
  })
  .strict();

export const ConsentRequestSchema = z.union([GrantSchema, WithdrawSchema]);
export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;

/** The 422 message for a body that is neither a grant nor a withdrawal. */
export const CONSENT_REQUEST_SHAPE =
  "Expected { consent: true, version, locale, secondaryUse? } or { consent: false, locale? }";
