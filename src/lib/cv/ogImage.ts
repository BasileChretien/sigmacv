import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * Display props for the per-CV Open Graph / social-share card (`/p/<slug>/og`).
 * PURE + tested under the gate; the image Route Handler just renders these into
 * an `ImageResponse`, so every branching decision lives here, not in the JSX.
 *
 * Only already-public profile text is used (name / headline / most-recent visible
 * position / accent colour) — the route hands us the public-projected CV, and we
 * never touch contact or other gated fields.
 */
export interface OgImageProps {
  /** Large name line. Falls back to a generic label when no display name. */
  name: string;
  /** Short role line under the name (headline → summary), or "" when none. */
  headline: string;
  /** Most-recent visible affiliation/position line, or "" when none. */
  affiliation: string;
  /** Accent bar / wordmark colour — the CV's chosen accent. */
  accentColor: string;
}

/** Generic name shown when the CV has no display name set. */
const NAME_FALLBACK = "Curriculum Vitae";
/** Default accent (mirrors the schema default) when none is resolvable. */
const DEFAULT_ACCENT = "#1f4fd8";
/** Keep the secondary lines from overflowing the 1200×630 card. */
const HEADLINE_MAX = 120;
const AFFILIATION_MAX = 90;

/** Collapse whitespace to a single clean line. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Trim to `max` chars on a word boundary when possible, adding an ellipsis. */
function truncate(s: string, max: number): string {
  const clean = oneLine(s);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

/**
 * The owner's most-recent VISIBLE position, as a single line. A position item's
 * `displayText` already reads like "Assistant Professor, Nagoya University
 * (2024–present)"; we strip a trailing "(years)" suffix so the card stays clean.
 * Hidden / "not mine" items are skipped (they aren't on the public CV either).
 */
function latestAffiliation(cv: CanonicalCv): string {
  const section = cv.sections.find((s) => s.type === "positions");
  if (!section) return "";
  // Items are built most-recent-first; take the first visible one.
  const item = section.items.find((it) => it.included && it.notMine !== true);
  const text = item?.displayText;
  if (!text) return "";
  return oneLine(text).replace(/\s*\([^()]*\)\s*$/, "").trim();
}

/**
 * Extract the OG-card display props from a (public-projected) canonical CV.
 * Pure: no I/O, no mutation. The headline prefers the user's headline, then the
 * summary; affiliation is the most-recent visible position; accent comes from
 * the display choices (with a safe default).
 */
export function ogImageProps(cv: CanonicalCv): OgImageProps {
  const name = oneLine(cv.owner.displayName || "") || NAME_FALLBACK;
  const rawHeadline = cv.owner.headline || cv.owner.summary || "";
  return {
    name: truncate(name, HEADLINE_MAX),
    headline: truncate(rawHeadline, HEADLINE_MAX),
    affiliation: truncate(latestAffiliation(cv), AFFILIATION_MAX),
    /* v8 ignore next -- accentColor is a schema-validated, defaulted hex; the
       fallback only guards a hand-constructed CV with an empty accent. */
    accentColor: cv.display.accentColor || DEFAULT_ACCENT,
  };
}
