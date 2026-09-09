import {
  LEDGER_LINE_KEYS,
  type LedgerLine,
  type ProvenanceLedger,
} from "@/lib/cv/provenanceLedger";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "./escape";

/**
 * The provenance ledger as display lines: a localised label and an
 * "n of N (x%)" figure per line. Shared by the opt-in provenance footer of the
 * rendered CV (`provenanceFooter` in templates/shared.ts) and the editor's
 * "Where this came from" panel, so both read the same figures the same way.
 *
 * A line is listed when its denominator is > 0 — "0 of 40" is a statement worth
 * making (no retracted work is on the page; nothing was matched by name only) —
 * except the residual `other` line, which appears only when it counts something.
 * The ledger describes the DOCUMENT's verifiability, never the researcher; see
 * `cv/provenanceLedger.ts`.
 */
export interface LedgerDisplayLine {
  key: keyof Omit<ProvenanceLedger, "kept">;
  label: string;
  /** "n of N (x%)", locale-formatted. */
  figure: string;
}

const LINE_ORDER = LEDGER_LINE_KEYS;

export function ledgerLines(ledger: ProvenanceLedger, locale: string): LedgerDisplayLine[] {
  const s = renderStrings(locale);
  const labels: Record<keyof Omit<ProvenanceLedger, "kept">, string> = {
    identifierMatched: s.provLedgerIdentifier,
    claimed: s.provLedgerClaimed,
    selfEntered: s.provLedgerSelfEntered,
    nameMatched: s.provLedgerNameMatched,
    other: s.provLedgerOther,
    verified: s.provLedgerVerified,
    persistentId: s.provLedgerPid,
    reviewed: s.provLedgerReviewed,
    retractedVisible: s.provLedgerRetracted,
  };
  const numFmt = new Intl.NumberFormat(locale);
  // Count and denominator only. The pure ledger still computes `share`, but no
  // surface prints it as a percentage any more — this formatter feeds the owner's
  // editor panel AND the recipient-facing pages, and a share on the latter reads
  // as a score (2026-09-08 panel, veto 6).
  const figure = (l: LedgerLine): string =>
    s.provLedgerOf
      .replace("{n}", numFmt.format(l.count))
      .replace("{total}", numFmt.format(l.denominator));
  const out: LedgerDisplayLine[] = [];
  for (const key of LINE_ORDER) {
    const l = ledger[key];
    if (l.denominator === 0) continue;
    if (key === "other" && l.count === 0) continue;
    out.push({ key, label: labels[key], figure: figure(l) });
  }
  return out;
}

/**
 * The ledger as a small two-column table for the provenance footer. "" when the
 * document shows nothing (no line has a denominator).
 */
export function provenanceLedgerHtml(ledger: ProvenanceLedger, locale: string): string {
  const lines = ledgerLines(ledger, locale);
  if (lines.length === 0) return "";
  const title = escapeHtml(renderStrings(locale).provLedgerTitle);
  const rows = lines
    .map(
      (l) =>
        `<tr data-ledger="${l.key}"><td>${escapeHtml(l.label)}</td><td>${escapeHtml(l.figure)}</td></tr>`,
    )
    .join("");
  return `<table class="cv-prov-ledger" aria-label="${title}"><caption>${title}</caption><tbody>${rows}</tbody></table>`;
}
