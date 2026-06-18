import type { CanonicalCv } from "@/lib/canonical/schema";
import { displayUrl } from "./escape";
import { resolveLink } from "./icons";

/**
 * Format-agnostic header fields for the TEXT renderers (Markdown / LaTeX / DOCX).
 * Photo is intentionally excluded (text formats). Each renderer escapes these
 * strings in its own syntax before emitting them.
 */
export interface TextHeader {
  /** Honorific/title prefix shown before the name, e.g. "Dr". */
  honorific?: string;
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
  // displayUrl strips any `user:pass@` userinfo so a credential never leaks into a
  // text export (the href-side stripping in safeHref doesn't reach these formats).
  if (c.website) contact.push(displayUrl(c.website));
  for (const l of cv.owner.links ?? []) {
    const url = (l.url ?? "").trim();
    if (!url) continue;
    // The text formats have no icons, but a bare URL still reads better auto-labelled
    // with its detected service ("GitHub: https://github.com/…") than as a raw URL.
    const label = l.label?.trim() || resolveLink(url).service;
    const shown = displayUrl(url);
    contact.push(label ? `${label}: ${shown}` : shown);
  }
  return {
    honorific: cv.owner.honorific?.trim() || undefined,
    headline: cv.owner.headline?.trim() || undefined,
    contact,
    summary: cv.owner.summary?.trim() || undefined,
  };
}
