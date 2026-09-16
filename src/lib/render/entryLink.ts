import { itemEntryUrl, type CvItem } from "@/lib/canonical/schema";
import { safeHref } from "./escape";

/**
 * The ENTRY's own link — ORCID's `url` on an affiliation (employment,
 * education, distinction, membership, service, invited position), or the
 * owner's own edit of it — prepared ONCE for every renderer.
 *
 * Distinct from the institution link (`meta.institutionUrl` / ROR), which sits
 * behind the institution NAME and is shared by every entry at that institution:
 * this one points at the page documenting THIS record, so it is shown beside
 * the entry rather than wrapped around part of it.
 *
 * The visible label is the link's HOST ("neuropresage.fr"), not the full URL —
 * a CV line has no room for a path, and the host is what tells a reader where
 * the link goes. The text formats print the full URL instead (see
 * `prepare.ts`), since a printed CV cannot be clicked.
 */
export interface EntryLink {
  /** Validated href (`safeHref`); never a `javascript:`/`data:` value. */
  href: string;
  /** Display label: the host without a leading "www.". */
  label: string;
}

/**
 * The prepared link for an entry item, or null when it carries none (the common
 * case) or when the stored value is not a usable http(s) URL. Pure.
 */
export function entryLink(item: Pick<CvItem, "meta">): EntryLink | null {
  const href = safeHref(itemEntryUrl(item));
  if (!href) return null;
  return { href, label: hostLabel(href) };
}

/**
 * The host of a validated href, minus a leading "www." — falling back to the
 * href itself for the values `safeHref` passes but `URL` cannot parse (a bare
 * scheme like "https://", or a `mailto:` a user typed into the field), so the
 * link always carries visible text.
 */
function hostLabel(href: string): string {
  try {
    return new URL(href).host.replace(/^www\./i, "") || href;
  } catch {
    return href;
  }
}
