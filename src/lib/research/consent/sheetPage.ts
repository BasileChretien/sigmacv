import { asLocale, type Locale } from "@/lib/i18n";
import { researchPanelStrings } from "@/lib/i18n/researchPanel";
import {
  consentLocaleFor,
  consentText,
  documentLabelFor,
  isConsentLocale,
  type ConsentLocale,
} from "./index";
import type { ConsentRecordRow } from "./status";

/** One row of the record table under the printable sheet. */
export interface SheetRecordRow {
  at: string;
  action: string;
  /** The document as the screen names it; the internal version stays off screen. */
  document: string;
  language: string;
  secondaryUse: string;
}

export interface SheetPageModel {
  uiLocale: Locale;
  textLocale: ConsentLocale;
  rows: SheetRecordRow[];
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** "2026-10-22 07:31 UTC": unambiguous in every language, as a record needs. */
function utc(at: Date): string {
  return `${at.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/**
 * What /cv/research-sheet shows: the approved sheet in the language asked for
 * (`lang`, else the UI's own if approved, else English) and the signed-in
 * user's consent record, labelled in the UI locale (`ui`).
 */
export function sheetPageModel(
  query: { lang?: string | string[]; ui?: string | string[] },
  records: readonly ConsentRecordRow[],
): SheetPageModel {
  const uiLocale = asLocale(first(query.ui));
  const lang = first(query.lang);
  const textLocale = isConsentLocale(lang) ? lang : consentLocaleFor(uiLocale);
  const s = researchPanelStrings(uiLocale);
  const rows = records.map((r) => ({
    at: utc(r.at),
    action: r.action === "grant" ? s.recordGrant : s.recordWithdraw,
    document: documentLabelFor(r.version, r.locale) ?? "",
    language: isConsentLocale(r.locale) ? consentText(r.locale).languageName : "",
    secondaryUse: r.secondaryUse === null ? "" : r.secondaryUse ? s.yes : s.no,
  }));
  return { uiLocale, textLocale, rows };
}
