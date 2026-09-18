/**
 * An author list the publisher deposited twice. Crossref and OpenAlex both carry
 * the RECOVER study (10.3171/2025.1.jns242509) with authors 9–13 printed again as
 * 15–19; a citation then names the same five people twice.
 *
 * Two co-authors can share a name, so one repeated name is never evidence. The
 * signal is a repeated RUN: at least {@link MIN_RUN} consecutive names, of at
 * least two DIFFERENT names, recurring later in the same order. An alphabetical
 * consortium byline ("Wang J, Wang J, Wang J") holds one name repeated, never a
 * run of distinct names printed twice, so it is left alone.
 */

const MIN_RUN = 2;

/** How far the names from `from` repeat those from `to` (non-overlapping, never an
 *  empty key, never into an already-dropped name). */
function runLength(
  keys: readonly string[],
  from: number,
  to: number,
  twins: ReadonlyMap<number, number>,
): number {
  let len = 0;
  while (
    to + len < keys.length &&
    from + len < to &&
    keys[from + len] !== "" &&
    keys[from + len] === keys[to + len] &&
    !twins.has(from + len)
  ) {
    len++;
  }
  return len;
}

function distinctCount(keys: readonly string[], start: number, len: number): number {
  return new Set(keys.slice(start, start + len)).size;
}

/**
 * For a list of name keys (`personNameKey`; "" = no name), every name of a
 * repeated run mapped to the index of its first appearance: dropped index → kept
 * index. Empty when the list repeats nothing. Longest earlier match wins.
 */
export function repeatedRunTwins(keys: readonly string[]): Map<number, number> {
  const twins = new Map<number, number>();
  const seenAt = new Map<string, number[]>();
  let j = 0;
  while (j < keys.length) {
    const key = keys[j]!;
    let best = 0;
    let bestFrom = -1;
    for (const i of seenAt.get(key) ?? []) {
      const len = runLength(keys, i, j, twins);
      if (len > best && distinctCount(keys, j, len) >= 2) {
        best = len;
        bestFrom = i;
      }
    }
    if (best >= MIN_RUN) {
      for (let t = 0; t < best; t++) twins.set(j + t, bestFrom + t);
      j += best;
      continue;
    }
    if (key) seenAt.set(key, [...(seenAt.get(key) ?? []), j]);
    j++;
  }
  return twins;
}
