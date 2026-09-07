import type { CanonicalCv } from "@/lib/canonical/schema";
import { t } from "@/lib/i18n";
import { careerContextBlock, type CareerContextBlock } from "./careerContext";
import { displayUrl } from "./escape";
import { resolveLink } from "./icons";

/** One labelled contact line ("Email" / "basile@…") for a format that prints
 *  the contact block as separate, parser-safe lines rather than one dot-joined row. */
export interface LabeledContact {
  label: string;
  value: string;
}

/**
 * The contact parts as LABELLED lines, in the same order `textHeader` uses
 * (location, email, phone, website, links): the fixed fields carry the CV
 * language's editor labels ("Email", "Téléphone", …); a link carries its own
 * label or the detected service name ("GitHub"), falling back to a plain
 * "Link". For the ATS DOCX, where a résumé parser reads one field per line.
 */
export function labeledContact(cv: CanonicalCv): LabeledContact[] {
  const locale = cv.display.locale;
  const c = cv.owner.contact ?? {};
  const out: LabeledContact[] = [];
  if (c.location) out.push({ label: t(locale, "location"), value: c.location });
  if (c.email) out.push({ label: t(locale, "email"), value: c.email });
  if (c.phone) out.push({ label: t(locale, "phone"), value: c.phone });
  if (c.website) out.push({ label: t(locale, "website"), value: displayUrl(c.website) });
  for (const l of cv.owner.links ?? []) {
    const url = (l.url ?? "").trim();
    if (!url) continue;
    const label = l.label?.trim() || resolveLink(url).service || t(locale, "links");
    out.push({ label, value: displayUrl(url) });
  }
  return out;
}

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
  /**
   * The opt-in, owner-declared "Career context" block (label + plain lines), or
   * null when off/empty. Context for a reader only — see `careerContext.ts`.
   */
  careerContext: CareerContextBlock | null;
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
    careerContext: careerContextBlock(cv),
  };
}
