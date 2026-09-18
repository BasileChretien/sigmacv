import type { CslName } from "@/types/csl";

/**
 * Repair of the defects scholarly metadata carries in PERSON NAMES, applied to
 * every name before it reaches a citation (OpenAlex authorships at fetch time,
 * `toCslName`, and the stored CSL names on read). Each repair only undoes a
 * recognisable encoding or casing fault, so a sound name is returned unchanged:
 *
 *  - UTF-8 read as Windows-1252 / Latin-1 ("ChrÃ©tien") is decoded back, but only
 *    when the whole name maps to bytes that form VALID UTF-8 — a real Latin-1
 *    name ("José", "Côté–Smith") never does, so it is never touched;
 *  - a capital right after an accented Latin lowercase letter ("ChréTien",
 *    "JöRg") is lowered: it is what a title-caser leaves when it treats every
 *    non-ASCII letter as a word boundary (JS `\b\w`, or a decomposed "e" +
 *    combining accent). Real internal capitals follow an ASCII letter
 *    ("McDonald", "DiCaprio", "hUiginn") or sit in another script ("ДиКаприо"),
 *    and are kept;
 *  - a U+FFFD (a character lost in some upstream decode) is dropped: "Kenji Uda"
 *    is a better citation than "Kenji U\uFFFDda". The OpenAlex mapper prefers the
 *    name printed on the work when only the profile name is garbled
 *    (`openalex/authorNames.ts`), so this is the last resort. A name that is
 *    nothing BUT replacement characters is kept rather than emptied;
 *  - Unicode is composed (NFC), invisibles (BOM, zero-width space, soft hyphen,
 *    control characters) are removed and whitespace is collapsed. The zero-width
 *    joiners are kept: they carry meaning in Indic and Persian scripts.
 */

const REPLACEMENT = "\uFFFD";

/**
 * Windows-1252 decodes bytes 0x80–0x9F to these characters, so UTF-8 read as
 * Windows-1252 leaves them where a continuation byte was (É = C3 89 → "Ã‰").
 * The remaining bytes 0xA0–0xFF decode to the code point of the same value.
 */
const CP1252_BYTE = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

/** A UTF-8 lead byte (as Windows-1252 shows it) followed by a continuation byte. */
const MOJIBAKE =
  /[\u00C2-\u00F4][\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/;

/** Double encoding happens; three passes is more than any real record needs. */
const MOJIBAKE_PASSES = 3;

const UTF8 = new TextDecoder("utf-8", { fatal: true });

/** Invisible characters with no place in a name (joiners excluded, see above). */
const INVISIBLE = /[\uFEFF\u200B\u2060\u00AD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** A letter, its combining marks, then an ASCII capital. */
const CAPITAL_AFTER_LETTER = /(\p{L})(\p{M}*)([A-Z])/gu;
const LOWER = /^\p{Ll}$/u;
const LATIN = /^\p{Script=Latin}$/u;
/** A letter of a real script (Common / Inherited letters, e.g. the ʻokina, are neutral). */
const NON_LATIN_LETTER = /(?![\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}])\p{L}/u;
const LATIN_LETTER = /\p{Script=Latin}/u;
const LETTER = /\p{L}/u;

/** The bytes Windows-1252 would have decoded to `s`, or null if it could not have. */
function cp1252Bytes(s: string): Uint8Array | null {
  const bytes: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    const byte = cp <= 0xff ? cp : CP1252_BYTE.get(cp);
    if (byte === undefined) return null;
    bytes.push(byte);
  }
  return Uint8Array.from(bytes);
}

function repairMojibake(s: string): string {
  let current = s;
  for (let pass = 0; pass < MOJIBAKE_PASSES && MOJIBAKE.test(current); pass++) {
    const bytes = cp1252Bytes(current);
    if (!bytes) break;
    try {
      current = UTF8.decode(bytes);
    } catch {
      break; // not valid UTF-8: a real Latin-1 name, not an encoding fault
    }
  }
  return current;
}

function dropReplacementChars(s: string): string {
  if (!s.includes(REPLACEMENT)) return s;
  const stripped = s.split(REPLACEMENT).join("");
  return LETTER.test(stripped) ? stripped : s;
}

function repairCase(s: string): string {
  return s.replace(CAPITAL_AFTER_LETTER, (match, prev: string, marks: string, capital: string) => {
    const brokenBoundary =
      LOWER.test(prev) && LATIN.test(prev) && (marks !== "" || prev.charCodeAt(0) > 0x7f);
    return brokenBoundary ? `${prev}${marks}${capital.toLowerCase()}` : match;
  });
}

/**
 * Names repeat across a CV (every co-author, on every work) and the stored names
 * are cleaned on EVERY read (`migrateAuthorNames`), so the pure functions below
 * are memoised — bounded, so a long-running server never grows the cache.
 */
const MEMO_MAX = 10_000;

function memoised(fn: (s: string) => string): (s: string) => string {
  const cache = new Map<string, string>();
  return (s) => {
    const hit = cache.get(s);
    if (hit !== undefined) return hit;
    const out = fn(s);
    if (cache.size >= MEMO_MAX) cache.clear();
    cache.set(s, out);
    return out;
  };
}

/** Printable ASCII, single-spaced and trimmed: none of the faults can occur in it. */
const PLAIN_ASCII = /^[\x21-\x7E]+(?: [\x21-\x7E]+)*$/;

const repairName = memoised((raw) => {
  const composed = repairMojibake(raw.normalize("NFC")).normalize("NFC");
  return repairCase(dropReplacementChars(composed.replace(INVISIBLE, "")))
    .replace(/\s+/g, " ")
    .trim();
});

/** A person name with its encoding and casing faults repaired (see module doc). */
export function cleanPersonName(raw: string): string {
  return PLAIN_ASCII.test(raw) ? raw : repairName(raw);
}

/** True when a name lost a character upstream (U+FFFD). */
export function hasReplacementChar(s: string): boolean {
  return s.includes(REPLACEMENT);
}

/** True when a name holds a letter of a script other than Latin (Cyrillic, Han…). */
export function hasNonLatinLetter(s: string): boolean {
  return NON_LATIN_LETTER.test(s);
}

/** True when a name is written in Latin script only (and has a letter at all). */
export function isLatinScriptOnly(s: string): boolean {
  return LATIN_LETTER.test(s) && !hasNonLatinLetter(s);
}

/**
 * A comparison key for "the same printed name": cleaned, then case, accents,
 * punctuation and spacing folded away ("Chrétien, B." ≈ "CHRETIEN B"). Scripts
 * stay apart. Empty for a name with no letter or digit.
 */
export const personNameKey = memoised((s) =>
  cleanPersonName(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, ""),
);

const CSL_NAME_PARTS = [
  "family",
  "given",
  "literal",
  "dropping-particle",
  "non-dropping-particle",
  "suffix",
] as const;

/** A CSL name with every string part cleaned; the very same object when none changed. */
export function cleanCslName(name: CslName): CslName {
  let out: CslName | undefined;
  for (const part of CSL_NAME_PARTS) {
    const value = name[part];
    if (typeof value !== "string") continue;
    const cleaned = cleanPersonName(value);
    if (cleaned === value) continue;
    out ??= { ...name };
    out[part] = cleaned;
  }
  return out ?? name;
}
