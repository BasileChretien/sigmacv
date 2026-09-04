import type { CvItem } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "./escape";

/**
 * The opt-in CRediT contribution line appended under a citation entry (HTML /
 * PDF): "Roles: Conceptualization, Formal analysis". The `title` attribute says
 * where the roles came from — self-declared in the editor, or read from the
 * publisher's Crossref deposit — so a reader can weigh the claim. Role names are
 * localised through the render dictionary; the list stays in CRediT's taxonomy
 * order (the stored order). "" for an item without roles, so the caller can
 * append it unconditionally once the display toggle is on.
 */
export function creditRolesHtml(item: CvItem, locale: string): string {
  const roles = item.meta.creditRoles;
  if (!roles || roles.length === 0) return "";
  const s = renderStrings(locale);
  const names = roles.map((r) => s.creditRoles[r]).join(", ");
  const title =
    item.meta.creditRolesSource === "self" ? s.creditRolesSelfTitle : s.creditRolesCrossrefTitle;
  return `<span class="cv-credit" title="${escapeHtml(title)}">${escapeHtml(
    s.creditRolesLabel,
  )} ${escapeHtml(names)}</span>`;
}
