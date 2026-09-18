import type { CslName } from "@/types/csl";

/**
 * Repair of the defects scholarly metadata carries in PERSON NAMES, applied to
 * every name before it reaches a citation (OpenAlex authorships at fetch time,
 * `toCslName`, and the stored CSL names on read). Each repair only undoes a
 * recognisable fault, and each is built to leave a sound name untouched, because
 * a wrong repair misprints a real person's name on every CV that cites them:
 *
 *  - UTF-8 read as Windows-1252 / Latin-1 ("ChrÃ©tien") is decoded back, word by
 *    word, but only when the bytes form valid UTF-8 AND the result is plausible:
 *    ordinary letters (no combining marks, no IPA, no stray symbol) of ONE script.
 *    Validity alone is not enough — the Czech "LÍŠKA" is valid UTF-8 as bytes
 *    (Í Š = CD 8A, a combining mark) and "Weiß–Schmidt" decodes to an N'Ko letter;
 *  - a title-caser that treats every non-ASCII letter as a word break (JS `\b\w`,
 *    or a decomposed "e" + combining accent) leaves "ChréTien", "JöRg", "éMile".
 *    Such a name is repaired ("Chrétien", "Jörg", "Émile") only when it looks
 *    uniformly mangled: every ASCII letter after an accented lowercase one is a
 *    capital, and each word's ASCII runs are shaped like title case. So real
 *    internal capitals ("McDonald", "DiCaprio", "hUiginn", "ДиКаприо"), all-caps
 *    names ("GONZáLEZ" is left alone rather than made worse), stylised names
 *    ("PréDiCT") and names that merely lack a space ("JoséLuis García") are kept;
 *  - a U+FFFD (a character lost in some upstream decode) is dropped: "Kenji Uda"
 *    is a better citation than a replacement glyph. The OpenAlex mapper prefers
 *    the name printed on the work when only the profile name is garbled
 *    (`openalex/authorNames.ts`), so this is the last resort. A name that is
 *    nothing BUT replacement characters is kept rather than emptied;
 *  - decomposed accents are composed (NFC) — except the CJK compatibility
 *    ideographs, which NFC would swap for their unified forms although people
 *    choose those variants for their names; invisibles (BOM, zero-width space,
 *    soft hyphen, control characters) are removed and whitespace is collapsed.
 *    The zero-width joiners are kept: they carry meaning in Indic and Persian.
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

/** Double (triple…) encoding happens; this bounds the passes on hostile input. */
const MOJIBAKE_PASSES = 8;

const UTF8 = new TextDecoder("utf-8", { fatal: true });

/** Latin letters a decode may plausibly produce: Latin-1, Extended-A, the pinyin
 *  caron vowels and Romanian comma-below letters of Extended-B, and the Vietnamese
 *  block. Not the rest of Extended-B or IPA (what false decodes land on). */
const DECODED_LATIN =
  /^[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u017F\u01CD-\u01DC\u0218-\u021B\u1E00-\u1EFF]$/;
/** Non-letter characters a name may carry: apostrophes, hyphens, middle dot. */
const NAME_PUNCTUATION = /^[\u2010-\u2019\u00B7]$/;
const SCRIPTS: ReadonlyArray<readonly [string, RegExp]> = [
  ["Greek", /^\p{Script=Greek}$/u],
  ["Cyrillic", /^\p{Script=Cyrillic}$/u],
  ["Hebrew", /^\p{Script=Hebrew}$/u],
  ["Arabic", /^\p{Script=Arabic}$/u],
  ["CJK", /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u],
  ["Hangul", /^\p{Script=Hangul}$/u],
];

/** Invisible characters with no place in a name (joiners excluded, see above). */
const INVISIBLE = /[\uFEFF\u200B\u2060\u00AD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** CJK compatibility ideographs (BMP and supplement): kept out of NFC. */
const CJK_COMPATIBILITY = /([\uF900-\uFAFF]|\uD87E[\uDC00-\uDE1F])/;

const ASCII_LETTER = /^[A-Za-z]$/;
const TITLE_SHAPED = /^[A-Z]?[a-z]*$/;
const MARK = /^\p{M}$/u;
const WORD_CHAR = /^[\p{L}\p{M}]$/u;
const LOWER = /^\p{Ll}$/u;
const LATIN = /^\p{Script=Latin}$/u;
/** The saltillo (U+A78C) is a lowercase Latin LETTER used as an apostrophe, as in
 *  "O" + saltillo + "Neill": the capital after it is real. */
const SALTILLO = "\uA78C";
/** A letter of a real script (Common / Inherited letters, e.g. the ʻokina, are neutral). */
const NON_LATIN_LETTER = /(?![\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}])\p{L}/u;
const LATIN_LETTER = /\p{Script=Latin}/u;
const LETTER = /\p{L}/u;

/** NFC, leaving the CJK compatibility ideographs as they were written. */
function compose(s: string): string {
  if (!CJK_COMPATIBILITY.test(s)) return s.normalize("NFC");
  return s
    .split(CJK_COMPATIBILITY)
    .map((part, i) => (i % 2 === 1 ? part : part.normalize("NFC")))
    .join("");
}

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

/** Which script a decoded character belongs to: "" for neutral ASCII / name
 *  punctuation, null for a character no decoded name should contain. */
function decodedScript(ch: string): string | null {
  if (ch.charCodeAt(0) < 0x80) return ASCII_LETTER.test(ch) ? "Latin" : "";
  if (NAME_PUNCTUATION.test(ch)) return "";
  if (DECODED_LATIN.test(ch)) return "Latin";
  for (const [script, re] of SCRIPTS) if (re.test(ch)) return script;
  return null;
}

/** Ordinary characters of one script: what a real decoded word looks like. */
function plausibleWord(word: string): boolean {
  let script = "";
  for (const ch of word) {
    const s = decodedScript(ch);
    if (s === null) return false;
    if (!s) continue;
    if (script && s !== script) return false;
    script = s;
  }
  return true;
}

/** One word decoded back from Windows-1252 mojibake, when it plausibly was that. */
function repairMojibakeWord(word: string): string {
  let current = word;
  let best = word;
  for (let pass = 0; pass < MOJIBAKE_PASSES && MOJIBAKE.test(current); pass++) {
    const bytes = cp1252Bytes(current);
    if (!bytes) break;
    try {
      current = UTF8.decode(bytes);
    } catch {
      break; // not valid UTF-8: a real Latin-1 name, not an encoding fault
    }
    if (plausibleWord(current)) best = current;
  }
  return best;
}

function repairMojibake(s: string): string {
  return MOJIBAKE.test(s) ? s.split(" ").map(repairMojibakeWord).join(" ") : s;
}

function dropReplacementChars(s: string): string {
  if (!s.includes(REPLACEMENT)) return s;
  const stripped = s.split(REPLACEMENT).join("");
  return LETTER.test(stripped) ? stripped : s;
}

/** An accented Latin lowercase letter (a precomposed one, or a base plus marks). */
function isAccentedLower(base: string, marked: boolean): boolean {
  if (!LOWER.test(base) || !LATIN.test(base) || base === SALTILLO) return false;
  return marked || base.charCodeAt(0) > 0x7f;
}

/** The accented letter right before `i` (combining marks skipped), or -1. */
function accentedBefore(chars: readonly string[], i: number): number {
  let j = i - 1;
  while (j >= 0 && MARK.test(chars[j]!)) j--;
  return j >= 0 && isAccentedLower(chars[j]!, j < i - 1) ? j : -1;
}

/** Whether every ASCII-letter run of the word around `i` is shaped like title case. */
function titleShapedWord(chars: readonly string[], i: number): { ok: boolean; start: number } {
  let start = i;
  while (start > 0 && WORD_CHAR.test(chars[start - 1]!)) start--;
  let end = i;
  while (end < chars.length && WORD_CHAR.test(chars[end]!)) end++;
  const runs = chars
    .slice(start, end)
    .map((ch) => (ASCII_LETTER.test(ch) ? ch : " "))
    .join("")
    .split(" ");
  return { ok: runs.every((run) => TITLE_SHAPED.test(run)), start };
}

function repairCase(s: string): string {
  const chars = [...s];
  const capitals: number[] = [];
  for (let i = 1; i < chars.length; i++) {
    if (!ASCII_LETTER.test(chars[i]!) || accentedBefore(chars, i) < 0) continue;
    // The broken title-caser capitalises EVERY letter after an accented one; a
    // lowercase one anywhere means this name never went through it.
    if (chars[i] === chars[i]!.toLowerCase()) return s;
    capitals.push(i);
  }
  if (capitals.length === 0) return s;
  const out = [...chars];
  for (const i of capitals) {
    const word = titleShapedWord(chars, i);
    if (!word.ok) continue;
    out[i] = chars[i]!.toLowerCase();
    // "éMile": the word's own initial is the accented letter — it is the capital.
    const initial = accentedBefore(chars, i);
    const upper = chars[initial]!.toUpperCase();
    if (initial === word.start && upper.length === 1) out[initial] = upper;
  }
  return out.join("");
}

/**
 * Names repeat across a CV (every co-author, on every work) and the stored names
 * are cleaned on EVERY read (`migrateAuthorNames`), so the pure functions below
 * are memoised — bounded in entries and in key length, so a long-running server
 * never grows the cache and an oversized stored name is never kept in it.
 */
const MEMO_MAX = 10_000;
const MEMO_MAX_KEY = 256;

function memoised(fn: (s: string) => string): (s: string) => string {
  const cache = new Map<string, string>();
  return (s) => {
    if (s.length > MEMO_MAX_KEY) return fn(s);
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
  const composed = compose(repairMojibake(compose(raw)));
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
 * A comparison key for "the same printed name": cleaned, then case, punctuation
 * and spacing folded away ("Chrétien, B." ≈ "chrétien b"). Accents are KEPT:
 * "Lü Wei" and "Lu Wei" are different people. Empty for a name with no letter.
 */
export const personNameKey = memoised((s) =>
  cleanPersonName(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, ""),
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
