import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * Format-agnostic header fields for the TEXT renderers (Markdown / LaTeX / DOCX).
 * Photo is intentionally excluded (text formats). Each renderer escapes these
 * strings in its own syntax before emitting them.
 */
export interface TextHeader {
  headline?: string;
  /** Contact parts in display order: location, email, phone, website, links. */
  contact: string[];
  summary?: string;
}

export function textHeader(cv: CanonicalCv): TextHeader {
  const c = cv.owner.contact ?? {};
  const contact: string[] = [];
  if (c.location) contact.push(c.location);
  if (c.email) contact.push(c.email);
  if (c.phone) contact.push(c.phone);
  if (c.website) contact.push(c.website);
  for (const l of cv.owner.links ?? []) {
    const url = (l.url ?? "").trim();
    if (!url) continue;
    contact.push(l.label?.trim() ? `${l.label.trim()}: ${url}` : url);
  }
  return {
    headline: cv.owner.headline?.trim() || undefined,
    contact,
    summary: cv.owner.summary?.trim() || undefined,
  };
}
