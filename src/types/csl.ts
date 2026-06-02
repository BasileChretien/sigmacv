import { z } from "zod";

/**
 * CSL-JSON ("citeproc JSON") item shape.
 *
 * This is the input contract for citeproc-js. We validate the subset of fields
 * we actually populate from OpenAlex, but keep `.passthrough()` so any extra
 * CSL fields survive round-trips and reach the citation processor untouched.
 *
 * Spec: https://github.com/citation-style-language/schema (csl-data.json)
 */

export const CslNameSchema = z
  .object({
    family: z.string().optional(),
    given: z.string().optional(),
    /** Use for organizations / un-splittable names; citeproc prints verbatim. */
    literal: z.string().optional(),
    "dropping-particle": z.string().optional(),
    "non-dropping-particle": z.string().optional(),
    suffix: z.string().optional(),
  })
  .passthrough();
export type CslName = z.infer<typeof CslNameSchema>;

export const CslDateSchema = z
  .object({
    /** e.g. [[2024, 5, 1]] — year, optional month, optional day. */
    "date-parts": z.array(z.array(z.union([z.number(), z.string()]))).optional(),
    raw: z.string().optional(),
    literal: z.string().optional(),
  })
  .passthrough();
export type CslDate = z.infer<typeof CslDateSchema>;

export const CslItemSchema = z
  .object({
    id: z.string(),
    /** CSL type, e.g. "article-journal", "paper-conference", "book". */
    type: z.string(),
    title: z.string().optional(),
    author: z.array(CslNameSchema).optional(),
    editor: z.array(CslNameSchema).optional(),
    issued: CslDateSchema.optional(),
    "container-title": z.string().optional(),
    "collection-title": z.string().optional(),
    publisher: z.string().optional(),
    "publisher-place": z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    page: z.string().optional(),
    number: z.string().optional(),
    DOI: z.string().optional(),
    URL: z.string().optional(),
    ISSN: z.union([z.string(), z.array(z.string())]).optional(),
    ISBN: z.string().optional(),
    abstract: z.string().optional(),
    language: z.string().optional(),
  })
  // Strict: reject unknown fields so a client cannot smuggle arbitrary CSL keys
  // (e.g. `note`/`annote`) into the citation processor via PATCH/preview.
  .strict();
export type CslItem = z.infer<typeof CslItemSchema>;
