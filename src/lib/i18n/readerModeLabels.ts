import { READER_MODE_KEYS, type ReaderModeKey } from "@/lib/render/readerMode";
import type { EditorExtraStrings } from "./editorUi";
import type { UiStrings } from "./ui";

/**
 * The localized label of every display toggle the reader-mode preset forces ON,
 * in `READER_MODE_KEYS` order — the list the owner is shown wherever they opt
 * into the reader view (the Design tab's living-page opt-in, the Versions
 * panel's "freeze as reader view"), so the choice is always made with the same
 * explicit inventory. Pure; reuses the toggles' own editor labels.
 */
export function readerModeKeyLabels(u: UiStrings, eu: EditorExtraStrings): string[] {
  const labels: Record<ReaderModeKey, string> = {
    showProvenance: u.showProvenance,
    showVerifiedBadges: u.showVerifiedBadges,
    showOpenAccess: u.showOpenAccess,
    showCitationCounts: u.showCitationCounts,
    showResearchAreas: u.showResearchAreas,
    showAuthorRole: u.showAuthorRole,
    showCollaboration: u.showCollaboration,
    showCreditRoles: eu.showCreditRoles,
    showDataLinks: u.showDataLinks,
    showSupervisionSummary: eu.supervisionSummaryLabel,
    showReplications: u.showReplications,
    showArchivalStatus: u.showArchivalStatus,
    showPublicEvaluations: u.showPublicEvaluations,
  };
  return READER_MODE_KEYS.map((k) => labels[k]);
}
