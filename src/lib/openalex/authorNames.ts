import { repeatedRunTwins } from "@/lib/text/authorRuns";
import {
  cleanPersonName,
  hasNonLatinLetter,
  hasReplacementChar,
  isLatinScriptOnly,
  personNameKey,
} from "@/lib/text/personName";
import { shortId, type OpenAlexAuthorship, type OpenAlexWork } from "./types";

/**
 * OpenAlex author lists, repaired once, where the payload arrives (`client.ts`),
 * so every consumer — the CSL author list, the self match and its position, the
 * author count, co-author ORCIDs, the claim flow's author picker — sees the same
 * list. Two faults are OpenAlex's own:
 *
 *  - the profile name (`author.display_name`) is OpenAlex's pick for the whole
 *    author profile, not what this work printed (`raw_author_name`). When the
 *    profile name is garbled (U+FFFD: "Kenji U\uFFFDda" for a byline "Kenji Uda") or
 *    in another script than a Latin byline (a Cyrillic "Осаму Сузукі" profile for
 *    "Osamu Suzuki" on an English paper), the printed name is used. A Latin
 *    profile name for a byline printed in another script is kept, as before: a
 *    romanised name stays romanised;
 *  - a byline deposited twice (see `text/authorRuns.ts`) is collapsed onto its
 *    first copy, keeping whichever copy is better identified — one of the account
 *    holder's author ids, then an ORCID — in the first copy's place, and merging
 *    the corresponding flag and affiliations. First/last positions are re-derived
 *    when the dropped copy held the last author.
 *
 * Every name is then cleaned (`text/personName.ts`: casing, encoding). Pure; the
 * very same work comes back when there is nothing to repair.
 */

/** The name to print for one authorship, or undefined when it has none. */
export function authorshipName(a: OpenAlexAuthorship): string | undefined {
  const profile = a.author?.display_name ?? "";
  const printed = a.raw_author_name ?? "";
  const cleanProfile = cleanPersonName(profile);
  const cleanPrinted = cleanPersonName(printed);
  let chosen = cleanProfile || cleanPrinted;
  if (cleanProfile && cleanPrinted) {
    const garbled = hasReplacementChar(profile) && !hasReplacementChar(printed);
    const otherScript = hasNonLatinLetter(cleanProfile) && isLatinScriptOnly(cleanPrinted);
    if (garbled || otherScript) chosen = cleanPrinted;
  }
  return chosen || undefined;
}

function withCleanNames(a: OpenAlexAuthorship): OpenAlexAuthorship {
  if (!a || typeof a !== "object") return a;
  const name = authorshipName(a);
  const raw =
    typeof a.raw_author_name === "string" ? cleanPersonName(a.raw_author_name) : undefined;
  const rawChanged = raw !== undefined && raw !== a.raw_author_name;
  const author = a.author;
  const displayChanged = author != null && name !== undefined && author.display_name !== name;
  if (!rawChanged && !displayChanged) return a;
  return {
    ...a,
    ...(rawChanged ? { raw_author_name: raw } : {}),
    ...(displayChanged ? { author: { ...author, display_name: name } } : {}),
  };
}

/** The byline as printed, the key a deposited-twice run repeats. */
function bylineKey(a: OpenAlexAuthorship): string {
  if (!a || typeof a !== "object") return "";
  return personNameKey(a.raw_author_name || a.author?.display_name || "");
}

function identityRank(a: OpenAlexAuthorship, prefer: ReadonlySet<string> | undefined): number {
  const id = shortId(a.author?.id);
  if (id && prefer?.has(id)) return 3;
  if (a.author?.orcid) return 2;
  return id ? 1 : 0;
}

/** One authorship for two copies of the same byline entry, at the first's place. */
function mergeTwin(
  kept: OpenAlexAuthorship,
  dropped: OpenAlexAuthorship,
  prefer: ReadonlySet<string> | undefined,
): OpenAlexAuthorship {
  const primary = identityRank(dropped, prefer) > identityRank(kept, prefer) ? dropped : kept;
  const other = primary === kept ? dropped : kept;
  return {
    ...primary,
    author_position: kept.author_position,
    ...(kept.is_corresponding || dropped.is_corresponding ? { is_corresponding: true } : {}),
    ...(!primary.institutions?.length && other.institutions?.length
      ? { institutions: other.institutions }
      : {}),
    ...(!primary.countries?.length && other.countries?.length
      ? { countries: other.countries }
      : {}),
  };
}

/** OpenAlex's "first" / "middle" / "last", re-derived for the shortened list. */
function withPosition(
  a: OpenAlexAuthorship,
  i: number,
  n: number,
  hadLast: boolean,
): OpenAlexAuthorship {
  if (!a || typeof a !== "object") return a;
  let position = a.author_position;
  if (i === n - 1 && n > 1 && hadLast) position = "last";
  else if (position === "last") position = "middle";
  return position === a.author_position ? a : { ...a, author_position: position };
}

/**
 * A work with its author names repaired and a deposited-twice byline collapsed.
 * `preferAuthorIds` (short ids) are the account holder's: of two copies, the one
 * carrying such an id is kept, so the self match survives the collapse.
 */
export function normalizeWorkAuthors(
  work: OpenAlexWork,
  preferAuthorIds?: ReadonlySet<string>,
): OpenAlexWork {
  const list = work?.authorships;
  if (!Array.isArray(list) || list.length === 0) return work;
  const named = list.map(withCleanNames);
  const renamed = named.some((a, i) => a !== list[i]);
  const twins = repeatedRunTwins(named.map(bylineKey));
  if (twins.size === 0) return renamed ? { ...work, authorships: named } : work;

  const merged = [...named];
  for (const [dropped, kept] of twins) {
    merged[kept] = mergeTwin(merged[kept]!, named[dropped]!, preferAuthorIds);
  }
  const hadLast = named.some((a) => a?.author_position === "last");
  const remaining = merged.filter((_, i) => !twins.has(i));
  const authorships = remaining.map((a, i) => withPosition(a, i, remaining.length, hadLast));
  return { ...work, authorships };
}
