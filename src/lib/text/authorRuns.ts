/**
 * An author list the publisher deposited twice. Crossref and OpenAlex both carry
 * the RECOVER study (10.3171/2025.1.jns242509) with authors 9–13 printed again as
 * 15–19; a citation then names the same five people twice.
 *
 * Dropping a real co-author is far worse than printing one twice, so the bar is
 * high. Two co-authors can share a name, so one repeated name is never evidence;
 * the signal is a repeated RUN of at least {@link MIN_RUN} consecutive names, at
 * least two of them different, recurring later in the same order. Two is not
 * enough: large collaborations sort their byline alphabetically within each
 * institution, and the CMS paper 10.1016/j.physletb.2024.138633 prints
 * "J. Wang, Z. Wang" twice for four different people. For the same reason no list
 * longer than {@link MAX_AUTHORS} is ever collapsed — those bylines are where such
 * coincidences live, and the list endpoint caps a work at 100 authors anyway. A
 * caller can veto a pair (`sameEntry`), e.g. two different ORCID iDs.
 *
 * Every run of a name is compared with at most {@link MAX_CANDIDATES} earlier
 * appearances, so a hostile list of one repeated name stays cheap.
 */

const MIN_RUN = 3;
const MAX_AUTHORS = 500;
const MAX_CANDIDATES = 32;

/** Whether the entries at two indices may be the same person (default: always). */
export type SameEntry = (earlier: number, later: number) => boolean;

/** How far the names from `from` repeat those from `to` (non-overlapping, never an
 *  empty key, never into an already-dropped name), and whether the run holds two
 *  different names. */
function runAt(
  keys: readonly string[],
  from: number,
  to: number,
  twins: ReadonlyMap<number, number>,
  sameEntry: SameEntry,
): number {
  let len = 0;
  let mixed = false;
  while (
    to + len < keys.length &&
    from + len < to &&
    keys[from + len] !== "" &&
    keys[from + len] === keys[to + len] &&
    !twins.has(from + len) &&
    sameEntry(from + len, to + len)
  ) {
    if (keys[from + len] !== keys[from]) mixed = true;
    len++;
  }
  return mixed ? len : 0;
}

/**
 * For a list of name keys (`personNameKey`; "" = no name), every name of a
 * repeated run mapped to the index of its first appearance: dropped index → kept
 * index. Empty when the list repeats nothing. Longest earlier match wins.
 */
export function repeatedRunTwins(
  keys: readonly string[],
  sameEntry: SameEntry = () => true,
): Map<number, number> {
  const twins = new Map<number, number>();
  if (keys.length > MAX_AUTHORS) return twins;
  const seenAt = new Map<string, number[]>();
  let j = 0;
  while (j < keys.length) {
    const key = keys[j]!;
    const earlier = key ? seenAt.get(key) : undefined;
    let best = 0;
    let bestFrom = -1;
    for (const i of (earlier ?? []).slice(-MAX_CANDIDATES)) {
      const len = runAt(keys, i, j, twins, sameEntry);
      if (len > best) {
        best = len;
        bestFrom = i;
      }
    }
    if (best >= MIN_RUN) {
      for (let t = 0; t < best; t++) twins.set(j + t, bestFrom + t);
      j += best;
      continue;
    }
    if (earlier) earlier.push(j);
    else if (key) seenAt.set(key, [j]);
    j++;
  }
  return twins;
}
