import { itemEffectiveYear, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { openAccessStates, type OpenAccessRow } from "@/lib/cv/worklist";
import { depositRoutes, type DepositContext, type DepositRoute } from "./depositRoutes";
import { placeFitsLocations, placeKindOf, type PlaceKind } from "./repositoryDirectory";
import type { StatutoryArchivingEntry } from "./statutoryRights";

/**
 * Which closed journal articles the owner can deposit TODAY, and on what ground.
 * The worklist shows these and nothing else — a work under a running embargo,
 * or with neither a recorded permission nor a statutory right, is not listed.
 *
 * Two grounds, in this order:
 *  - the publisher's policy as OA.Works recorded it: self-archiving allowed for
 *    a named version, and the embargo (if any) has ended — the record's own
 *    end date, or its duration counted from the work's publication date;
 *  - a statutory secondary-publication right for a country printed on the
 *    owner's authorship, once its delay has run: the accepted manuscript. Only
 *    entries with a `delayMonths` qualify (an author right whose text sets no
 *    delay counts from publication). Such a right is a rule of law the
 *    publisher's terms do not remove, so a recorded refusal does not bar it.
 *
 * Dates are ISO `YYYY-MM-DD` and compared as strings. A work's publication date
 * is filled to the END of what is known (a bare year = 31 December) when a
 * delay is counted from it, so a delay is never called over before it can be —
 * and to the START (a bare year = 1 January) when a right's commencement is
 * checked against it, so a work is never put under a right that may predate it.
 */

type SelfArchivingRecord = NonNullable<CvItem["meta"]["selfArchiving"]>;
export type DepositVersion = SelfArchivingRecord["versions"][number];

export interface DepositNow {
  basis: "publisher" | "statute";
  /** The version the ground allows — the best the record names, or the accepted manuscript. */
  version: DepositVersion;
  /** The ISO date the embargo or the statutory delay ended; absent when there was none. */
  since?: string;
  /** The statutory entry the deposit rests on (basis "statute"). */
  entry?: StatutoryArchivingEntry;
}

/** A closed journal article the owner can deposit today, with its worklist row. */
export interface DepositReadyRow {
  row: OpenAccessRow;
  item: CvItem;
  now: DepositNow;
  /** The deposit routes (first = the action), when a context was given. */
  routes: DepositRoute[];
}

const VERSION_ORDER: readonly DepositVersion[] = [
  "publishedVersion",
  "acceptedVersion",
  "submittedVersion",
];

/** A closed journal article gets a deposit action; nothing else does. */
export function depositCandidate(item: CvItem | undefined): CvItem | undefined {
  return item?.csl?.type === "article-journal" ? item : undefined;
}

const pad = (n: number): string => String(n).padStart(2, "0");
const lastDay = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

function knownParts(item: Pick<CvItem, "meta" | "csl">): [number, number?, number?] | undefined {
  const year = itemEffectiveYear(item);
  if (year === undefined) return undefined;
  const parts = item.csl?.issued?.["date-parts"]?.[0];
  // The CSL parts count only when they carry the effective year (an override wins).
  const known = parts && Number(parts[0]) === year ? parts : undefined;
  return [
    year,
    known && known[1] !== undefined ? Number(known[1]) : undefined,
    known && known[2] !== undefined ? Number(known[2]) : undefined,
  ];
}

/**
 * The work's publication date, filled to the END of the known period: the CSL
 * `issued` parts when they carry the effective year, else the year alone.
 */
export function publishedBy(item: Pick<CvItem, "meta" | "csl">): string | undefined {
  const parts = knownParts(item);
  if (!parts) return undefined;
  const [year, m, d] = parts;
  const month = m ?? 12;
  return `${year}-${pad(month)}-${pad(d ?? lastDay(year, month))}`;
}

/** The same date filled to the START of the known period (a bare year = 1 January). */
export function publishedFrom(item: Pick<CvItem, "meta" | "csl">): string | undefined {
  const parts = knownParts(item);
  if (!parts) return undefined;
  const [year, m, d] = parts;
  return `${year}-${pad(m ?? 1)}-${pad(d ?? 1)}`;
}

/** `iso` plus `months`, the day clamped to the target month's length. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(d, lastDay(year, month)))}`;
}

function byPublisher(item: CvItem, today: string): DepositNow | null {
  const record = item.meta.selfArchiving;
  if (!record?.canArchive) return null;
  const version = VERSION_ORDER.find((v) => record.versions.includes(v));
  if (!version) return null;
  let since: string | undefined;
  if (record.embargoEnd) {
    since = record.embargoEnd;
  } else if (record.embargoMonths) {
    const published = publishedBy(item);
    if (!published) return null;
    since = addMonths(published, record.embargoMonths);
  }
  if (since !== undefined && since > today) return null;
  return { basis: "publisher", version, since };
}

function byStatute(
  item: CvItem,
  statutory: readonly StatutoryArchivingEntry[],
  today: string,
): DepositNow | null {
  const published = publishedBy(item);
  const earliest = publishedFrom(item);
  if (!published || !earliest) return null;
  for (const entry of statutory) {
    if (entry.kind !== "author-right" || entry.delayMonths === undefined) continue;
    // The right must have been in force when the work appeared: the work's
    // earliest possible date on or after the commencement (`covers()` checked
    // the year only — a March 2021 paper is not under a right of June 2021).
    if (entry.appliesFrom !== undefined && earliest < entry.appliesFrom) continue;
    const since = entry.delayMonths > 0 ? addMonths(published, entry.delayMonths) : undefined;
    if (since !== undefined && since > today) continue;
    return { basis: "statute", version: "acceptedVersion", since, entry };
  }
  return null;
}

/**
 * The ground on which `item` can be deposited today, or null. `place` is where
 * the action would deposit: a recorded permission that does not cover that
 * place is no ground for it — a right that has run is, whatever the record
 * names. When both hold, the one allowing the better version wins (a right to
 * the accepted manuscript outranks a record that allows only the submitted one).
 */
export function depositNow(
  item: CvItem,
  statutory: readonly StatutoryArchivingEntry[],
  today: string,
  place?: PlaceKind,
): DepositNow | null {
  const publisher = byPublisher(item, today);
  const statute = byStatute(item, statutory, today);
  if (!publisher) return statute;
  if (statute) {
    const covers =
      place === undefined || placeFitsLocations(place, item.meta.selfArchiving!.locations);
    if (
      !covers ||
      VERSION_ORDER.indexOf(statute.version) < VERSION_ORDER.indexOf(publisher.version)
    ) {
      return statute;
    }
  }
  return publisher;
}

/** Today as an ISO date, in UTC. */
export const isoToday = (): string => new Date().toISOString().slice(0, 10);

/**
 * The worklist's rows: every countable journal article with no open copy found
 * that can be deposited today, in document order, with its routes — the ground
 * is judged for the action's place. The chips on the publication rows read the
 * same list, so the two never disagree.
 */
export function depositReadyRows(
  cv: CanonicalCv,
  today: string,
  ctx: DepositContext,
): DepositReadyRow[] {
  const itemsById = new Map<string, CvItem>(
    cv.sections.flatMap((s) => s.items).map((it) => [it.id, it]),
  );
  const ready: DepositReadyRow[] = [];
  for (const row of openAccessStates(cv).rows) {
    if (row.state !== "no-open-copy-found") continue;
    const item = depositCandidate(itemsById.get(row.itemId));
    if (!item) continue;
    const routes = depositRoutes(cv, item, ctx);
    /* v8 ignore next -- Zenodo closes every route list; kept for the type. */
    if (!routes[0]) continue;
    const now = depositNow(item, row.statutory, today, placeKindOf(routes[0].href));
    if (now) ready.push({ row, item, now, routes });
  }
  return ready;
}
