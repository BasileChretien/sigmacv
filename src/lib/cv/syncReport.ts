import { z } from "zod";
import {
  CvSectionTypeSchema,
  REVIEW_FLAGS,
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { stripInlineMarkup } from "@/lib/text/markup";

/**
 * The "what changed" report of a sync — computed by comparing the previous
 * canonical document with the freshly-built one, persisted on the Cv row
 * (`lastSyncReport`) and surfaced in the editor. A re-sync silently merging new
 * works into a 400-item CV is invisible to the user otherwise; this makes the
 * living-CV behaviour observable ("3 new items, 1 needs review") and gives the
 * review candidates a place to be noticed.
 *
 * Also the home of the sync's per-source observability: item counts and fetch
 * durations per source. Every external client fails SOFT (an upstream hiccup
 * yields an empty array, never an error), so a "0" count here is the only
 * user-visible trace that a source contributed nothing this time.
 */

/** Cap on the per-item entries stored in a report (counts stay exact). */
export const SYNC_REPORT_MAX_ITEMS = 50;
/** Cap on a stored entry's title length. */
const TITLE_MAX = 200;

export const SyncReportEntrySchema = z.object({
  sectionType: CvSectionTypeSchema,
  itemId: z.string().max(1024),
  title: z.string().max(TITLE_MAX),
  /** Set when the new item arrived as a review candidate (advisory flag). */
  reviewFlag: z.enum(REVIEW_FLAGS).optional(),
});
export type SyncReportEntry = z.infer<typeof SyncReportEntrySchema>;

export const SyncReportSchema = z.object({
  /** ISO timestamp of the sync that produced this report. */
  syncedAt: z.string().max(64),
  /** True for the FIRST sync (no previous document): `added` is left empty and
   *  `addedTotal` is the whole imported item count. */
  initial: z.boolean(),
  addedTotal: z.number().int().min(0),
  /** Items that were in the previous document but not in this build (e.g. an
   *  OpenAlex id merge). Curation hides items, it never removes them — so a
   *  non-zero count here is genuinely "the source no longer lists this". */
  removedTotal: z.number().int().min(0),
  /** Up to {@link SYNC_REPORT_MAX_ITEMS} newly-appeared items, document order. */
  added: z.array(SyncReportEntrySchema).max(SYNC_REPORT_MAX_ITEMS),
  /** How many of the added items carry a review flag (counted over ALL added
   *  items, not just the stored sample). */
  reviewCandidates: z.number().int().min(0),
  /** Items contributed per source by this build (a silent fail-soft shows as 0). */
  sourceCounts: z.record(z.string().max(64), z.number().int()).optional(),
  /** Per-source fetch durations in ms (sync-performance observability). */
  timingsMs: z.record(z.string().max(64), z.number().int()).optional(),
});
export type SyncReport = z.infer<typeof SyncReportSchema>;

/**
 * Above this many added items, the banner summarizes the additions by section
 * ("Publications 9 · Grants 4") instead of listing every title — so a big
 * first-week sync (or a backfill) never floods the editor with a long list.
 */
export const SYNC_REPORT_SUMMARY_THRESHOLD = 12;

/**
 * The added entries that arrived as review candidates — the action-worthy ones.
 * New non-flagged items are auto-included and need no decision; these are what
 * the banner foregrounds and lets the user jump to.
 */
export function reviewEntries(report: SyncReport): SyncReportEntry[] {
  return report.added.filter((e) => e.reviewFlag !== undefined);
}

/**
 * Added entries grouped by section, most-added first — drives the summarized
 * banner when there are too many additions to list. Counts are over the stored
 * sample (≤ {@link SYNC_REPORT_MAX_ITEMS}); the banner appends a "+N more" when
 * `addedTotal` exceeds what was stored.
 */
export function addedBySectionType(
  report: SyncReport,
): Array<{ sectionType: SyncReportEntry["sectionType"]; count: number }> {
  const counts = new Map<SyncReportEntry["sectionType"], number>();
  for (const e of report.added) counts.set(e.sectionType, (counts.get(e.sectionType) ?? 0) + 1);
  return [...counts.entries()]
    .map(([sectionType, count]) => ({ sectionType, count }))
    .sort((a, b) => b.count - a.count);
}

function entryTitle(item: CvItem): string {
  // The "what's new" banner is plain text — flatten any kept inline tags (<i>/…)
  // so a title never shows a literal "<i>" in the banner.
  const title = stripInlineMarkup(item.csl?.title ?? itemDisplayText(item) ?? "");
  return title.slice(0, TITLE_MAX);
}

export interface SyncReportOptions {
  syncedAt: string;
  sourceCounts?: Record<string, number>;
  timingsMs?: Record<string, number>;
}

/**
 * Compare the previous canonical document with the freshly-built one and
 * summarize what the sync changed. Pure; never throws on well-formed documents.
 * Items are identified by their stable id (the same key the build's carry-over
 * uses), so a curation flip is never miscounted as an add/remove.
 */
export function computeSyncReport(
  prev: CanonicalCv | null,
  next: CanonicalCv,
  opts: SyncReportOptions,
): SyncReport {
  const prevIds = new Set<string>();
  if (prev) {
    for (const s of prev.sections) for (const it of s.items) prevIds.add(it.id);
  }

  const added: SyncReportEntry[] = [];
  let addedTotal = 0;
  let reviewCandidates = 0;
  const nextIds = new Set<string>();
  for (const s of next.sections) {
    for (const it of s.items) {
      nextIds.add(it.id);
      if (prev && !prevIds.has(it.id)) {
        addedTotal++;
        if (it.meta.reviewFlag !== undefined) reviewCandidates++;
        if (added.length < SYNC_REPORT_MAX_ITEMS) {
          added.push({
            sectionType: s.type,
            itemId: it.id,
            title: entryTitle(it),
            reviewFlag: it.meta.reviewFlag,
          });
        }
      }
    }
  }

  let removedTotal = 0;
  for (const id of prevIds) if (!nextIds.has(id)) removedTotal++;

  // First sync: the whole document is "new" — report the import size without
  // flooding the entry list (the editor shows a one-line welcome instead).
  if (!prev) {
    for (const s of next.sections) {
      for (const it of s.items) {
        addedTotal++;
        if (it.meta.reviewFlag !== undefined) reviewCandidates++;
      }
    }
  }

  return {
    syncedAt: opts.syncedAt,
    initial: prev === null,
    addedTotal,
    removedTotal,
    added,
    reviewCandidates,
    sourceCounts: opts.sourceCounts,
    timingsMs: opts.timingsMs,
  };
}

/** Parse a stored report (Postgres JSON) — null on any shape mismatch, so a
 *  corrupt/legacy value degrades to "no report" rather than failing the page. */
export function safeParseSyncReport(input: unknown): SyncReport | null {
  const parsed = SyncReportSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** One entry of the public "What's new" strip. */
export interface RecentAddition {
  /** The canonical item id — lets the public "What's new" strip deep-link to the
   *  entry in the rendered CV (`#item-<id>`). */
  itemId: string;
  title: string;
  sectionType: CvSectionType;
}

/**
 * The most recent, still-visible additions for the public "What's new" strip,
 * derived from the persisted last-sync report and the (public-projected) CV:
 *  - never the initial import (that is not "new" to a visitor);
 *  - drops review candidates (unconfirmed name/registry matches — never advertised);
 *  - drops any added item the owner has since hidden or removed (cross-checked
 *    against the CV's currently-visible items);
 *  - capped to `max`, kept in sync (document) order.
 * Returns [] when there is nothing fresh to show.
 */
export function publicRecentAdditions(
  report: SyncReport | null,
  cv: CanonicalCv,
  max = 5,
): RecentAddition[] {
  if (!report || report.initial) return [];
  const visibleIds = new Set<string>();
  for (const section of visibleSections(cv)) {
    for (const item of visibleItems(section)) visibleIds.add(item.id);
  }
  const out: RecentAddition[] = [];
  for (const entry of report.added) {
    if (entry.reviewFlag) continue;
    if (!visibleIds.has(entry.itemId)) continue;
    out.push({ itemId: entry.itemId, title: entry.title, sectionType: entry.sectionType });
    if (out.length >= max) break;
  }
  return out;
}
