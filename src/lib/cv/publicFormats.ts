import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderCvBibtex } from "@/lib/render/bibtex";
import { cvCslItems } from "@/lib/render/csljson";
import type { CslItem } from "@/types/csl";
import { profilePageJsonLd } from "./publicJsonLd";

/**
 * Machine-readable formats for a PUBLISHED public CV (`/p/[slug]`), the FAIR
 * surface. Everything here is PURE: it takes an already-PUBLIC-PROJECTED
 * `CanonicalCv` (run through `projectCvForPublic` so personal/contact-gated
 * fields are gone) and a slug, and turns it into one of the supported formats.
 *
 * The route stays thin: it does slug lookup + publish gating + rate limiting,
 * then calls `serializePublicCv` and copies the returned content-type/extension.
 */

/** The formats a public CV can be served as. `html` is the default page. */
export const PUBLIC_FORMATS = ["html", "jsonld", "csljson", "bibtex", "json"] as const;
export type PublicFormat = (typeof PUBLIC_FORMATS)[number];

/** Media type for each machine format (html is served by the page route itself). */
const CONTENT_TYPE: Record<Exclude<PublicFormat, "html">, string> = {
  jsonld: "application/ld+json; charset=utf-8",
  csljson: "application/vnd.citationstyles.csl+json; charset=utf-8",
  bibtex: "application/x-bibtex; charset=utf-8",
  json: "application/json; charset=utf-8",
};

/** Filename extension (suffix path + Content-Disposition) for each machine format. */
const EXTENSION: Record<Exclude<PublicFormat, "html">, string> = {
  jsonld: "jsonld",
  csljson: "csl.json",
  bibtex: "bib",
  json: "json",
};

/**
 * Trailing path suffixes that force a machine format, longest-first so
 * ".csl.json" is matched before ".json". An explicit suffix on the slug
 * (e.g. `/p/alice-x7.bib`) overrides Accept negotiation.
 */
const SUFFIXES: ReadonlyArray<{ suffix: string; format: Exclude<PublicFormat, "html"> }> = [
  { suffix: ".csl.json", format: "csljson" },
  { suffix: ".jsonld", format: "jsonld" },
  { suffix: ".json", format: "json" },
  { suffix: ".bib", format: "bibtex" },
];

/**
 * Strip a known format suffix off a captured `[slug]`. Returns the real slug +
 * the forced format, or null when the slug carries no recognised extension (so
 * the caller falls back to Accept negotiation and serves HTML by default).
 */
export function formatFromSlug(
  raw: string,
): { slug: string; format: Exclude<PublicFormat, "html"> } | null {
  const lower = raw.toLowerCase();
  for (const { suffix, format } of SUFFIXES) {
    if (lower.endsWith(suffix) && raw.length > suffix.length) {
      return { slug: raw.slice(0, raw.length - suffix.length), format };
    }
  }
  return null;
}

/** A media type the client asked for → our format key (null if not one of ours). */
const ACCEPT_MAP: Record<string, Exclude<PublicFormat, "html">> = {
  "application/ld+json": "jsonld",
  "application/vnd.citationstyles.csl+json": "csljson",
  "application/x-bibtex": "bibtex",
  "text/x-bibtex": "bibtex",
  "application/json": "json",
};

interface AcceptEntry {
  type: string;
  q: number;
  order: number;
}

/** Parse one `Accept` element ("type/subtype;q=0.8") into {type, q}. Invalid
 *  q-values fall back to 1 (per RFC: absent/garbled quality = 1.0). */
function parseAcceptEntry(part: string, order: number): AcceptEntry | null {
  const segments = part.split(";").map((s) => s.trim());
  const type = (segments[0] ?? "").toLowerCase();
  if (!type) return null;
  let q = 1;
  for (const seg of segments.slice(1)) {
    const m = /^q=(.*)$/i.exec(seg);
    if (m) {
      const parsed = Number.parseFloat(m[1]!);
      q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1;
    }
  }
  return { type, q, order };
}

/**
 * Choose a format from an `Accept` header. Respects q-values (highest wins;
 * ties break by header order). Unknown/`*` types and an absent header both fall
 * back to `html` — the browser default and the safe choice. A `q=0` entry is a
 * rejection and never selected.
 */
export function chooseFormatFromAccept(accept: string | null | undefined): PublicFormat {
  if (!accept) return "html";
  const entries: AcceptEntry[] = [];
  accept.split(",").forEach((part, i) => {
    const entry = parseAcceptEntry(part, i);
    if (entry) entries.push(entry);
  });
  // Sort by quality desc, then by original order asc (stable preference).
  entries.sort((a, b) => (b.q - a.q) || (a.order - b.order));
  for (const entry of entries) {
    if (entry.q <= 0) continue;
    const format = ACCEPT_MAP[entry.type];
    if (format) return format;
  }
  return "html";
}

/**
 * Visible, owned, not-"not mine" CSL items for the public exports. Thin alias of
 * the single shared predicate in `render/csljson.ts` (`cvCslItems`) so the
 * public CSL-JSON + BibTeX surfaces and the authenticated owner download can
 * never diverge. Re-exported under the public name for existing callers/tests.
 */
export function publicCslItems(cv: CanonicalCv): CslItem[] {
  return cvCslItems(cv);
}

export interface SerializedPublicCv {
  /** Full Content-Type header value (includes charset). */
  contentType: string;
  /** The serialized body. */
  body: string;
  /** Filename extension (no leading dot), e.g. "bib" or "csl.json". */
  extension: string;
}

/**
 * Serialize an already-public-projected CV to a machine format. `slug` is only
 * needed by the JSON-LD URL. Pure — no IO. The `html` format is served by the
 * page route directly, so it is not produced here (callers handle html first).
 */
export function serializePublicCv(
  cv: CanonicalCv,
  format: Exclude<PublicFormat, "html">,
  slug: string,
): SerializedPublicCv {
  const meta = { contentType: CONTENT_TYPE[format], extension: EXTENSION[format] };
  switch (format) {
    case "jsonld":
      return { ...meta, body: profilePageJsonLd(cv, slug) };
    case "json":
      // The open canonical object itself (already projected — no personal data).
      return { ...meta, body: JSON.stringify(cv) };
    case "csljson":
      return { ...meta, body: JSON.stringify(publicCslItems(cv)) };
    case "bibtex":
      return { ...meta, body: renderCvBibtex(cv) };
  }
}
