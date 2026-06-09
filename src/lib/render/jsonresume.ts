import {
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import type { CslItem } from "@/types/csl";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * JSON Résumé export (https://jsonresume.org/schema). A widely-supported,
 * language-neutral CV interchange format with FIXED English keys — so no new
 * i18n strings. Derived entirely from the canonical object: non-citation
 * entries use `displayText`, citation entries use their CSL payload (the same
 * data citeproc renders). Empty fields/sections are omitted so the output stays
 * schema-clean.
 */

interface ResumeProfile {
  network: string;
  url: string;
}

interface ResumeWorkItem {
  name: string;
}

interface ResumePublication {
  name: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

/** ISO-ish date string from a CSL `issued` date-parts ("2024", "2024-05",
 *  "2024-05-01"), or undefined when no year is present. */
function cslDate(csl: CslItem): string | undefined {
  const parts = csl.issued?.["date-parts"]?.[0];
  const year = parts?.[0];
  if (year == null) return undefined;
  const pad = (n: unknown): string => String(n).padStart(2, "0");
  const segments = [String(year)];
  if (parts?.[1] != null) segments.push(pad(parts[1]));
  if (parts?.[2] != null) segments.push(pad(parts[2]));
  return segments.join("-");
}

function doiUrl(csl: CslItem): string | undefined {
  if (csl.URL) return csl.URL;
  if (csl.DOI) return `https://doi.org/${csl.DOI}`;
  return undefined;
}

/** A non-citation entry's plain text, or a citation's title — what to list when
 *  a section maps to a flat string-only JSON Résumé field (work/education/…). */
function entryText(item: CvItem): string {
  return (itemDisplayText(item) ?? item.csl?.title ?? "").trim();
}

function sectionByType(cv: CanonicalCv, type: CvSection["type"]): CvSection | undefined {
  return visibleSections(cv).find((s) => s.type === type);
}

function flatItems(section: CvSection | undefined): ResumeWorkItem[] {
  if (!section) return [];
  return visibleItems(section)
    .map((it) => entryText(it))
    .filter((name) => name.length > 0)
    .map((name) => ({ name }));
}

function publicationsOf(cv: CanonicalCv): ResumePublication[] {
  const sections = visibleSections(cv).filter(
    (s) => s.type === "publications" || s.type === "preprints",
  );
  const out: ResumePublication[] = [];
  for (const section of sections) {
    for (const item of visibleItems(section)) {
      // visibleItems already drops hidden + "not mine"; here we only skip
      // non-citation entries (no CSL) that might sit in a publications section.
      const csl = item.csl;
      if (!csl) continue;
      const pub: ResumePublication = { name: (csl.title ?? "").trim() || "Untitled" };
      const publisher = (csl["container-title"] ?? csl.publisher ?? "").trim();
      if (publisher) pub.publisher = publisher;
      const releaseDate = cslDate(csl);
      if (releaseDate) pub.releaseDate = releaseDate;
      const url = doiUrl(csl);
      if (url) pub.url = url;
      out.push(pub);
    }
  }
  return out;
}

function profilesOf(cv: CanonicalCv): ResumeProfile[] {
  return (cv.owner.links ?? [])
    .map((l) => ({ network: (l.label ?? "").trim(), url: (l.url ?? "").trim() }))
    .filter((p) => p.url.length > 0)
    .map((p) => (p.network ? p : { network: "Link", url: p.url }));
}

/** Build the JSON Résumé object (https://jsonresume.org/schema). Pure. */
export function buildJsonResume(cv: CanonicalCv): Record<string, unknown> {
  const owner = cv.owner;
  const contact = owner.contact ?? {};

  const basics: Record<string, unknown> = {
    name: owner.displayName || "",
  };
  if (owner.headline?.trim()) basics.label = owner.headline.trim();
  if (contact.email?.trim()) basics.email = contact.email.trim();
  if (contact.website?.trim()) basics.url = contact.website.trim();
  if (owner.summary?.trim()) basics.summary = owner.summary.trim();
  if (contact.location?.trim()) {
    basics.location = { address: contact.location.trim() };
  }
  const profiles = profilesOf(cv);
  if (profiles.length) basics.profiles = profiles;

  const resume: Record<string, unknown> = { basics };

  const work = flatItems(sectionByType(cv, "positions"));
  if (work.length) resume.work = work;

  const education = flatItems(sectionByType(cv, "education"));
  if (education.length) resume.education = education;

  const publications = publicationsOf(cv);
  if (publications.length) resume.publications = publications;

  const awards = flatItems(sectionByType(cv, "awards"));
  if (awards.length) resume.awards = awards;

  const skills = flatItems(sectionByType(cv, "skills"));
  if (skills.length) resume.skills = skills;

  const languages = flatItems(sectionByType(cv, "languages"));
  if (languages.length) resume.languages = languages;

  return resume;
}

export function renderCvJsonResume(cv: CanonicalCv): string {
  return `${JSON.stringify(buildJsonResume(cv), null, 2)}\n`;
}

export const jsonresumeRenderer: Renderer = {
  format: "jsonresume",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "jsonresume",
      mimeType: "application/json",
      filename: `${cvSlug(cv.owner.displayName)}-resume.json`,
      text: renderCvJsonResume(cv),
    };
  },
};
