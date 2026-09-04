import type { CanonicalCv, CareerContextEntry, CareerContextKind } from "@/lib/canonical/schema";
import { renderStrings, type RenderStrings } from "@/lib/i18n/render";

/**
 * The owner-declared "Career context" block, prepared ONCE for every renderer
 * (HTML/PDF via `templates/shared.ts`, Markdown / LaTeX / DOCX via
 * `headerText.ts`): a localized label and one plain line per declared entry —
 * "Career break (parental leave), 2019–2020", "Part-time 60%, 2021–2023",
 * "Clinical duties alongside research, 2016–" — plus, when opted in, "First
 * publication: 2012 (14 years active)".
 *
 * RULE (load-bearing, DORA / CoARA): these values are CONTEXT for a human reader
 * and nothing else. Nothing in SigmaCV may divide, weight, scale or otherwise
 * normalise any metric by them — no "outputs per active year", no
 * break-adjusted h-index, no "academic age" correction. The block reads the
 * owner's declaration and prints it; `owner.metrics` and every figure in
 * `render/metrics.ts` are computed without ever looking at it. Assessing
 * relative to opportunity is the PANEL's judgement, made in context, not a
 * number this tool computes on their behalf.
 */
export interface CareerContextBlock {
  /** Localized block label ("Career context (self-declared)"). */
  label: string;
  /** One plain-text line per entry (+ the first-publication line when enabled). */
  lines: string[];
}

const KIND_KEY: Record<CareerContextKind, keyof RenderStrings> = {
  "career-break": "careerKindCareerBreak",
  "part-time": "careerKindPartTime",
  "clinical-duties": "careerKindClinicalDuties",
  caring: "careerKindCaring",
  military: "careerKindMilitary",
  other: "careerKindOther",
};

/** "2019–2020", or "2016–" for an ongoing entry (en dash, as in date ranges). */
function dateRange(entry: CareerContextEntry): string {
  return `${entry.start}–${entry.end ?? ""}`;
}

/** One context line for an entry: kind [pct%] [(note)], range. */
export function careerContextEntryLine(entry: CareerContextEntry, locale: string): string {
  const rs = renderStrings(locale);
  const kind = rs[KIND_KEY[entry.kind]];
  const pct =
    entry.kind === "part-time" && typeof entry.fraction === "number"
      ? ` ${Math.round(entry.fraction * 100)}%`
      : "";
  const note = entry.note?.trim() ? ` (${entry.note.trim()})` : "";
  return `${kind}${pct}${note}, ${dateRange(entry)}`;
}

/**
 * The effective first-publication year: the owner's own override when set,
 * otherwise the value derived at build from the kept publications.
 */
export function effectiveFirstPublicationYear(cv: CanonicalCv): number | undefined {
  const ctx = cv.owner.careerContext;
  return ctx?.firstPublicationYearOverride ?? ctx?.firstPublicationYear;
}

/**
 * The block for a render, or null when the owner has not enabled it
 * (`display.showCareerContext`, default off) or there is nothing to show.
 * `nowYear` only feeds the "(n years active)" span of the first-publication
 * line — a calendar span for the reader, never an input to any metric.
 */
export function careerContextBlock(
  cv: CanonicalCv,
  nowYear: number = new Date().getUTCFullYear(),
): CareerContextBlock | null {
  if (!cv.display.showCareerContext) return null;
  const ctx = cv.owner.careerContext;
  if (!ctx) return null;
  const locale = cv.display.locale;
  const lines = ctx.entries.map((e) => careerContextEntryLine(e, locale));
  const first = effectiveFirstPublicationYear(cv);
  if (ctx.showFirstPublicationYear && first !== undefined) {
    const years = Math.max(0, nowYear - first);
    lines.push(
      renderStrings(locale)
        .careerFirstPublication.replace("{year}", String(first))
        .replace("{n}", String(years)),
    );
  }
  if (lines.length === 0) return null;
  return { label: renderStrings(locale).careerContextLabel, lines };
}
