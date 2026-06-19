import { z } from "zod";
import type { CanonicalCv, CvLink, CvOwner, CvSectionType } from "@/lib/canonical/schema";
import { addManualEntry, updateOwner } from "@/lib/canonical/curate";

/**
 * JSON Résumé IMPORT (https://jsonresume.org/schema) — the mirror of the
 * `jsonresume` export. Lets a user bring an existing résumé from another tool.
 *
 * Design (deliberately ADDITIVE and safe):
 *  - It only ever ADDS manual entries and FILLS EMPTY profile fields; it never
 *    overwrites data the user already has, and never touches OpenAlex/ORCID works.
 *  - **Publications are intentionally skipped** — they would duplicate the works
 *    SigmaCV already pulls from OpenAlex. The import focuses on the biographical
 *    sections those sources don't supply (work history, education, skills, awards,
 *    languages, volunteering, projects, references) plus the header/profile.
 *  - Pure + immutable: returns a NEW `CanonicalCv` via the existing curate ops.
 *  - Fail-soft: every field is optional, unknown keys are ignored, and malformed
 *    input is reported (never throws).
 */

// All résumé fields are optional so a partial/old document still imports what it
// has; unknown keys are stripped by Zod (we only read what we map).
const str = z.string().optional();

const JsonResumeSchema = z.object({
  basics: z
    .object({
      name: str,
      label: str,
      email: str,
      phone: str,
      url: str,
      summary: str,
      location: z.object({ address: str, city: str, region: str, countryCode: str }).optional(),
      profiles: z.array(z.object({ network: str, username: str, url: str })).optional(),
    })
    .optional(),
  work: z.array(z.object({ name: str, position: str, startDate: str, endDate: str })).optional(),
  volunteer: z
    .array(z.object({ organization: str, position: str, startDate: str, endDate: str }))
    .optional(),
  education: z
    .array(z.object({ institution: str, area: str, studyType: str, startDate: str, endDate: str }))
    .optional(),
  awards: z.array(z.object({ title: str, date: str, awarder: str })).optional(),
  skills: z.array(z.object({ name: str, keywords: z.array(z.string()).optional() })).optional(),
  languages: z.array(z.object({ language: str, fluency: str })).optional(),
  projects: z.array(z.object({ name: str, description: str })).optional(),
  references: z.array(z.object({ name: str, reference: str })).optional(),
});

export type JsonResume = z.infer<typeof JsonResumeSchema>;

/** Error codes a caller maps to a localized message. */
export type JsonResumeParseError = "too-large" | "invalid-json" | "invalid-shape";

export type ParseResult =
  | { ok: true; resume: JsonResume }
  | { ok: false; error: JsonResumeParseError };

/** Reject absurdly large pastes/uploads before parsing (a résumé is small). */
const MAX_INPUT_BYTES = 1_000_000;
/** Cap entries imported per section, so a crafted file can't flood a section. */
const PER_SECTION_CAP = 200;

/** Parse + validate JSON Résumé text. Pure; never throws. */
export function parseJsonResume(text: string): ParseResult {
  if (text.length > MAX_INPUT_BYTES) return { ok: false, error: "too-large" };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  const parsed = JsonResumeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid-shape" };
  return { ok: true, resume: parsed.data };
}

/** Profile fields the import can fill (for the summary shown to the user). */
export type FilledProfileField =
  | "displayName"
  | "headline"
  | "summary"
  | "email"
  | "phone"
  | "website"
  | "location"
  | "links";

export interface ImportOptions {
  /** Unique prefix for generated item ids, so importing twice can't collide. */
  idPrefix: string;
}

export interface ImportSummary {
  /** Header/profile fields that were empty and got filled. */
  profileFilled: FilledProfileField[];
  /** Number of entries added, per section type. */
  counts: Partial<Record<CvSectionType, number>>;
  /** Total entries added across all sections. */
  total: number;
}

export interface ImportResult {
  cv: CanonicalCv;
  summary: ImportSummary;
}

const clean = (s: string | undefined): string => (s ?? "").trim();
/** Join non-empty parts with " — " (role — org, degree — institution, …). */
const joinDash = (parts: (string | undefined)[]): string =>
  parts.map(clean).filter(Boolean).join(" — ");
/** Join non-empty parts with a space. */
const joinSpace = (parts: (string | undefined)[]): string =>
  parts.map(clean).filter(Boolean).join(" ");

/** A " (start–end)" suffix from a date range; "" when no date is present. */
function dateSuffix(start: string | undefined, end: string | undefined): string {
  const s = clean(start);
  const e = clean(end);
  if (s && e) return ` (${s}–${e})`;
  if (s) return ` (${s})`;
  if (e) return ` (${e})`;
  return "";
}

/** Normalize a URL for dedupe (lowercase, no trailing slash). */
const normUrl = (url: string): string => url.trim().toLowerCase().replace(/\/+$/, "");

/** Fill empty profile fields from `basics`; never overwrites existing values. */
function importBasics(
  cv: CanonicalCv,
  basics: NonNullable<JsonResume["basics"]>,
  filled: FilledProfileField[],
): CanonicalCv {
  const owner = cv.owner;
  const patch: Partial<CvOwner> = {};
  const contact: NonNullable<CvOwner["contact"]> = {};

  if (clean(basics.name) && !clean(owner.displayName)) {
    patch.displayName = clean(basics.name);
    filled.push("displayName");
  }
  if (clean(basics.label) && !clean(owner.headline)) {
    patch.headline = clean(basics.label);
    filled.push("headline");
  }
  if (clean(basics.summary) && !clean(owner.summary)) {
    patch.summary = clean(basics.summary);
    filled.push("summary");
  }
  if (clean(basics.email) && !clean(owner.contact?.email)) {
    contact.email = clean(basics.email);
    filled.push("email");
  }
  if (clean(basics.phone) && !clean(owner.contact?.phone)) {
    contact.phone = clean(basics.phone);
    filled.push("phone");
  }
  if (clean(basics.url) && !clean(owner.contact?.website)) {
    contact.website = clean(basics.url);
    filled.push("website");
  }
  const location = joinDash([basics.location?.city, basics.location?.region])
    ? [basics.location?.city, basics.location?.region, basics.location?.countryCode]
        .map(clean)
        .filter(Boolean)
        .join(", ")
    : clean(basics.location?.countryCode);
  if (location && !clean(owner.contact?.location)) {
    contact.location = location;
    filled.push("location");
  }

  // Append profile links not already present (dedupe by normalized URL).
  const existingLinks = owner.links;
  const seen = new Set(existingLinks.map((l) => normUrl(l.url)));
  const newLinks: CvLink[] = [];
  for (const p of basics.profiles ?? []) {
    const url = clean(p.url);
    if (!url || seen.has(normUrl(url))) continue;
    seen.add(normUrl(url));
    newLinks.push({ label: clean(p.network), url });
  }
  if (newLinks.length) {
    patch.links = [...existingLinks, ...newLinks];
    filled.push("links");
  }

  if (Object.keys(contact).length) patch.contact = contact;
  return Object.keys(patch).length ? updateOwner(cv, patch) : cv;
}

/**
 * Import a parsed JSON Résumé into a canonical CV — additive only. Fills empty
 * profile fields and appends manual entries for the supported sections. Pure +
 * immutable; returns the new CV and a summary of what was imported.
 */
export function importJsonResume(
  cv: CanonicalCv,
  resume: JsonResume,
  opts: ImportOptions,
): ImportResult {
  const filled: FilledProfileField[] = [];
  let next = resume.basics ? importBasics(cv, resume.basics, filled) : cv;
  const counts: Partial<Record<CvSectionType, number>> = {};
  let total = 0;

  // Each section type is processed exactly once below, so a type's count is set
  // once (never accumulated).
  function addSection<T>(
    type: CvSectionType,
    rows: T[] | undefined,
    toText: (row: T) => string,
  ): void {
    if (!rows) return;
    let n = 0;
    for (const row of rows.slice(0, PER_SECTION_CAP)) {
      const before = next;
      next = addManualEntry(next, type, toText(row), `${opts.idPrefix}:${type}:${n}`);
      // addManualEntry no-ops (same ref) on blank text — only count real adds.
      if (next !== before) n++;
    }
    if (n) {
      counts[type] = n;
      total += n;
    }
  }

  addSection("positions", resume.work, (w) =>
    joinDash([w.position, w.name]).concat(dateSuffix(w.startDate, w.endDate)),
  );
  addSection("service", resume.volunteer, (v) =>
    joinDash([v.position, v.organization]).concat(dateSuffix(v.startDate, v.endDate)),
  );
  addSection("education", resume.education, (e) =>
    joinDash([joinSpace([e.studyType, e.area]), e.institution]).concat(
      dateSuffix(e.startDate, e.endDate),
    ),
  );
  addSection("awards", resume.awards, (a) => {
    const date = clean(a.date);
    return joinDash([a.title, a.awarder]) + (date ? ` (${date})` : "");
  });
  addSection("skills", resume.skills, (s) => {
    const kw = (s.keywords ?? []).map(clean).filter(Boolean);
    return clean(s.name) + (kw.length ? `: ${kw.join(", ")}` : "");
  });
  addSection("languages", resume.languages, (l) => {
    const fluency = clean(l.fluency);
    return joinSpace([l.language, fluency ? `(${fluency})` : ""]);
  });
  addSection("other", resume.projects, (p) => {
    const desc = clean(p.description);
    return clean(p.name) + (desc ? ` — ${desc}` : "");
  });
  addSection("references", resume.references, (r) => {
    const ref = clean(r.reference);
    return clean(r.name) + (ref ? `: ${ref}` : "");
  });

  return { cv: next, summary: { profileFilled: filled, counts, total } };
}
