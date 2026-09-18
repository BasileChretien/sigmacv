import { repeatedRunTwins } from "@/lib/text/authorRuns";
import {
  cleanPersonName,
  hasNonLatinLetter,
  hasReplacementChar,
  isLatinScriptOnly,
  personNameKey,
} from "@/lib/text/personName";
import { normalizeOrcid, shortId, type OpenAlexAuthorship, type OpenAlexWork } from "./types";

/**
 * OpenAlex author lists, repaired once, where the payload arrives (`client.ts`),
 * so every consumer — the CSL author list, the self match and its position, the
 * author count, co-author ORCIDs, the claim flow's author picker — sees the same
 * list. Two faults are OpenAlex's own:
 *
 *  - the profile name (`author.display_name`) is OpenAlex's pick for the whole
 *    author profile, not what this work printed (`raw_author_name`). When the
 *    profile name is garbled (a U+FFFD where the byline reads "Kenji Uda") or in
 *    another script than a Latin byline (a Cyrillic "Осаму Сузукі" profile for
 *    "Osamu Suzuki" on an English paper), the printed name is used — unless the
 *    printed name is itself garbled. A Latin profile name for a byline printed in
 *    another script is kept, as before: a romanised name stays romanised;
 *  - a byline deposited twice (see `text/authorRuns.ts`) is collapsed onto its
 *    first copy. Two copies carrying DIFFERENT ORCID iDs are two people and are
 *    never merged. Of each pair the better-identified copy is kept — one of the
 *    account holder's author ids, then an ORCID, then any author id — in the first
 *    copy's place, its missing ORCID filled from the twin, with both copies'
 *    affiliations and the corresponding flag; first/last positions are re-derived
 *    when the dropped copy held the last author.
 *
 * Every name is then cleaned (`text/personName.ts`: casing, encoding). Pure and
 * defensive (a malformed entry is passed through, never thrown on); the very same
 * work comes back when there is nothing to repair.
 */

/** The account holder, whose copy of a doubled entry is the one to keep. (No
 *  ORCID here: two copies with ORCIDs carry the SAME one, or are never merged.) */
export interface OwnerIdentity {
  /** OpenAlex author ids, short ("A5001069481") or URL form. */
  authorIds?: readonly string[];
}

const text = (v: unknown): string => (typeof v === "string" ? v : "");

/** The name to print for one authorship, or undefined when it has none. */
export function authorshipName(a: OpenAlexAuthorship): string | undefined {
  const profile = text(a.author?.display_name);
  const printed = text(a.raw_author_name);
  const cleanProfile = cleanPersonName(profile);
  const cleanPrinted = cleanPersonName(printed);
  let chosen = cleanProfile || cleanPrinted;
  if (cleanProfile && cleanPrinted && !hasReplacementChar(printed)) {
    const garbled = hasReplacementChar(profile);
    const otherScript = hasNonLatinLetter(cleanProfile) && isLatinScriptOnly(cleanPrinted);
    if (garbled || otherScript) chosen = cleanPrinted;
  }
  return chosen || undefined;
}

function isAuthorship(a: unknown): a is OpenAlexAuthorship {
  return typeof a === "object" && a !== null;
}

function withCleanNames(a: OpenAlexAuthorship): OpenAlexAuthorship {
  if (!isAuthorship(a)) return a;
  const name = authorshipName(a);
  const raw =
    typeof a.raw_author_name === "string" ? cleanPersonName(a.raw_author_name) : undefined;
  const rawChanged = raw !== undefined && raw !== a.raw_author_name;
  const author = isAuthorship(a.author) ? a.author : undefined;
  const displayChanged = author !== undefined && name !== undefined && author.display_name !== name;
  if (!rawChanged && !displayChanged) return a;
  return {
    ...a,
    ...(rawChanged ? { raw_author_name: raw } : {}),
    ...(displayChanged ? { author: { ...author, display_name: name } } : {}),
  };
}

/** The byline as printed, the key a deposited-twice run repeats. */
function bylineKey(a: OpenAlexAuthorship): string {
  if (!isAuthorship(a)) return "";
  return personNameKey(text(a.raw_author_name) || text(a.author?.display_name));
}

function orcidOf(a: OpenAlexAuthorship): string {
  return isAuthorship(a) ? normalizeOrcid(text(a.author?.orcid)) : "";
}

function identityRank(a: OpenAlexAuthorship, ownerIds: ReadonlySet<string>): number {
  const id = shortId(text(a.author?.id));
  if (id && ownerIds.has(id)) return 3;
  if (orcidOf(a)) return 2;
  return id ? 1 : 0;
}

/** Both lists, first-seen order, each entry once (by `key`); undefined when empty. */
function union<T>(
  a: readonly T[] | null | undefined,
  b: readonly T[] | null | undefined,
  key: (t: T) => string,
): T[] | undefined {
  const seen = new Set<string>();
  const out = [...(a ?? []), ...(b ?? [])].filter((t) => {
    const k = key(t);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return out.length ? out : undefined;
}

/** An institution's identity for the union: its id, else its name, else itself. */
const institutionKey = (i: unknown): string => {
  const rec = isAuthorship(i) ? (i as { id?: unknown; display_name?: unknown }) : {};
  return text(rec.id) || text(rec.display_name) || JSON.stringify(i);
};

/**
 * One authorship for two copies of the same byline entry, at the first's place:
 * the better-identified copy's identity (its missing ORCID filled from the other,
 * which the ORCID veto guarantees is the same iD), both copies' affiliations and
 * countries, and "corresponding" when either says so.
 */
function mergeTwin(
  kept: OpenAlexAuthorship,
  dropped: OpenAlexAuthorship,
  rank: (a: OpenAlexAuthorship) => number,
): OpenAlexAuthorship {
  const primary = rank(dropped) > rank(kept) ? dropped : kept;
  const other = primary === kept ? dropped : kept;
  const orcid = primary.author?.orcid || other.author?.orcid;
  const author =
    primary.author && !primary.author.orcid && orcid
      ? { ...primary.author, orcid }
      : primary.author;
  const institutions = union(primary.institutions, other.institutions, institutionKey);
  const countries = union(primary.countries, other.countries, (c) => String(c));
  return {
    ...primary,
    author_position: kept.author_position,
    ...(author !== primary.author ? { author } : {}),
    ...(kept.is_corresponding || dropped.is_corresponding ? { is_corresponding: true } : {}),
    ...(institutions ? { institutions } : {}),
    ...(countries ? { countries } : {}),
  };
}

/** OpenAlex's "first" / "middle" / "last", re-derived for the shortened list. */
function withPosition(
  a: OpenAlexAuthorship,
  i: number,
  n: number,
  hadLast: boolean,
): OpenAlexAuthorship {
  if (!isAuthorship(a)) return a;
  let position = a.author_position;
  if (i === n - 1 && n > 1 && hadLast) position = "last";
  else if (position === "last") position = "middle";
  return position === a.author_position ? a : { ...a, author_position: position };
}

/** A work with its author names repaired and a deposited-twice byline collapsed. */
export function normalizeWorkAuthors(work: OpenAlexWork, owner: OwnerIdentity = {}): OpenAlexWork {
  const list = work?.authorships;
  if (!Array.isArray(list) || list.length === 0) return work;
  const named = list.map(withCleanNames);
  const renamed = named.some((a, i) => a !== list[i]);
  const orcids = named.map(orcidOf);
  const twins = repeatedRunTwins(
    named.map(bylineKey),
    (i, j) => !orcids[i] || !orcids[j] || orcids[i] === orcids[j],
  );
  if (twins.size === 0) return renamed ? { ...work, authorships: named } : work;

  const ownerIds = new Set((owner.authorIds ?? []).map(shortId).filter(Boolean));
  const rank = (a: OpenAlexAuthorship) => identityRank(a, ownerIds);
  const merged = [...named];
  for (const [dropped, kept] of twins) {
    merged[kept] = mergeTwin(merged[kept]!, named[dropped]!, rank);
  }
  const hadLast = named.some((a) => isAuthorship(a) && a.author_position === "last");
  const remaining = merged.filter((_, i) => !twins.has(i));
  const authorships = remaining.map((a, i) => withPosition(a, i, remaining.length, hadLast));
  return { ...work, authorships };
}
