import { DEGREE_LEVELS, type CvItem, type DegreeLevel } from "@/lib/canonical/schema";
import { degreeLabel, type RenderStrings } from "@/lib/i18n/render";

/**
 * The opt-in "Supervision summary" line (`display.showSupervisionSummary`):
 * "12 supervised: 5 PhD (4 completed), 6 Master's, 1 Postdoc". Computed from the
 * supervision items a render actually lists (visible, not "not mine"), so the
 * figure can never disagree with the entries under it. Pure.
 */

export interface SupervisionLevelCount {
  level: DegreeLevel;
  count: number;
  /** Items at this level whose recorded status is "completed". */
  completed: number;
}

export interface SupervisionSummary {
  /** Every listed supervision item, including those with no degree level. */
  total: number;
  /** Per-level counts in seniority order, levels with no items omitted. */
  levels: SupervisionLevelCount[];
}

/** Seniority order for the per-level breakdown (not the vocabulary order). */
const LEVEL_ORDER: readonly DegreeLevel[] = [
  "phd",
  "postdoc",
  "clinical-fellow",
  "master",
  "bachelor",
  "other",
];

/**
 * Count the listed supervision items by degree level. "Completed" counts ONLY a
 * recorded `status: "completed"` — an end year alone is not treated as completion
 * (a discontinued supervision has one too). Items without a degree level count
 * toward the total only.
 */
export function supervisionSummary(items: readonly CvItem[]): SupervisionSummary {
  const counts = new Map<DegreeLevel, SupervisionLevelCount>();
  for (const level of DEGREE_LEVELS) counts.set(level, { level, count: 0, completed: 0 });
  for (const it of items) {
    const level = it.meta.degreeLevel;
    if (!level) continue;
    const row = counts.get(level)!;
    row.count += 1;
    if (it.meta.status === "completed") row.completed += 1;
  }
  return {
    total: items.length,
    levels: LEVEL_ORDER.map((l) => counts.get(l)!).filter((r) => r.count > 0),
  };
}

/**
 * The localized one-line text of a summary, or "" when nothing is listed:
 * "<total> supervised: <n> <level> (<m> completed), …". The completed
 * parenthetical is omitted at zero; with no levelled items only the total shows.
 */
export function supervisionSummaryText(summary: SupervisionSummary, rs: RenderStrings): string {
  if (summary.total === 0) return "";
  const head = rs.supervisionSummaryTotal.replace("{n}", String(summary.total));
  const parts = summary.levels.map((r) => {
    const base = `${r.count} ${degreeLabel(rs, r.level)}`;
    return r.completed > 0
      ? `${base} (${rs.supervisionSummaryCompleted.replace("{n}", String(r.completed))})`
      : base;
  });
  return parts.length ? `${head}: ${parts.join(", ")}` : head;
}
