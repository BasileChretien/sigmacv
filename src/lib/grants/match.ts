/**
 * Name + organization matching for external sources that carry NO usable
 * identifier (national grant APIs, clinical-trial registries, patents).
 *
 * Load-bearing rule: a candidate is accepted ONLY when BOTH the person's name
 * AND one of their known organizations match — **never name alone**. Even then,
 * a match only makes the item a *review candidate* (the user confirms it); it is
 * never auto-trusted. This keeps the "identifier-first, never by bare name"
 * invariant intact for sources that lack identifiers.
 */

/** Name particles / stopwords that must not count as a matching token. */
const STOPWORDS = new Set([
  "the",
  "of",
  "and",
  "for",
  "de",
  "da",
  "do",
  "van",
  "von",
  "der",
  "den",
  "la",
  "le",
  "el",
  "du",
  "di",
  "dos",
  "das",
]);

/** Lower-case, strip diacritics + punctuation, split into significant tokens. */
export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export interface PersonMatch {
  /** Significant lower-cased name tokens (given + family). */
  nameTokens: string[];
  /** Family-name token — must always be present in a candidate name. */
  surname: string;
  /** Lower-cased known organization names (current + past affiliations). */
  orgs: string[];
}

/** Build a {@link PersonMatch} from a display name + known organization names. */
export function personMatch(displayName: string, orgs: string[]): PersonMatch {
  const tokens = tokenize(displayName);
  return {
    nameTokens: tokens,
    surname: tokens[tokens.length - 1] ?? "",
    orgs: orgs.map((o) => o.toLowerCase().trim()).filter((o) => o.length > 2),
  };
}

function nameMatches(person: PersonMatch, candidate: string): boolean {
  if (!person.surname) return false;
  const cand = new Set(tokenize(candidate));
  // The family name is mandatory.
  if (!cand.has(person.surname)) return false;
  // …and at least one OTHER name token (a given name) must also appear, so a
  // bare surname collision ("Smith") can never match by itself.
  const others = person.nameTokens.filter((t) => t !== person.surname);
  return others.length === 0 ? true : others.some((t) => cand.has(t));
}

function orgMatches(person: PersonMatch, candidateOrg: string): boolean {
  const cand = candidateOrg.toLowerCase().trim();
  if (cand.length <= 2) return false;
  // Substring either direction handles "University of Caen" ⊂ "University of
  // Caen Normandy" and trailing ", Japan"-style suffixes.
  return person.orgs.some((o) => cand.includes(o) || o.includes(cand));
}

/**
 * Accept a candidate ONLY when its name AND organization both match the person.
 * Returns false whenever the candidate has no organization — never name-only.
 */
export function matchesNameAndOrg(
  person: PersonMatch,
  candidateName: string,
  candidateOrg: string | undefined,
): boolean {
  if (!candidateOrg) return false;
  return nameMatches(person, candidateName) && orgMatches(person, candidateOrg);
}

/** A grant from a national funder API (name+org matched → review candidate). */
export interface FunderGrant {
  source: "ukri" | "nih" | "nsf";
  /** Award / grant number. */
  externalId: string;
  title: string;
  funder?: string;
  /** The matched awardee organization. */
  org?: string;
  startYear?: number;
  endYear?: number;
}
