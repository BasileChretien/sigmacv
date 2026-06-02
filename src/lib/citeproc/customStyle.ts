import { validateStyleXml } from "./engine";

/**
 * Resolve a user-supplied CSL citation style — by repository id (e.g. "nature",
 * "jama") or by URL — into a usable INDEPENDENT style XML.
 *
 * This lets people bring any style from the Zotero / CSL style repository (the
 * same one Zotero/Mendeley use) without us having to vendor thousands of files.
 *
 * Safety:
 *  - Outbound fetches are restricted to an explicit host allowlist (no SSRF to
 *    arbitrary/internal hosts), for both the initial fetch and any dependent
 *    parent it links to.
 *  - Size + time caps on every fetch.
 *  - The result is validated by actually rendering a one-item bibliography with
 *    citeproc, so dependent/note-only/malformed styles are rejected here, never
 *    at render time.
 */

/** User-facing failure — the API route surfaces `.message` directly. */
export class CustomStyleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomStyleError";
  }
}

/** Hosts we trust to serve CSL XML. */
const ALLOWED_HOSTS = new Set([
  "www.zotero.org",
  "zotero.org",
  "raw.githubusercontent.com",
  "www.citationstyles.org",
  "citationstyles.org",
]);

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 600_000; // matches CustomStyleSchema.xml cap; APA ≈ 85 KB

export interface ResolvedStyle {
  /** Sanitised slug used as the display.cslStyle key + cache key. */
  id: string;
  /** Human-readable style title from the CSL `<info><title>`. */
  title: string;
  /** Independent CSL style XML, ready for citeproc. */
  xml: string;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 128);
}

/** Build the Zotero repository URL for a bare style id/slug. */
function slugToUrl(slug: string): string {
  return `https://www.zotero.org/styles/${slug}`;
}

function assertAllowedHost(url: URL): void {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new CustomStyleError("Only http(s) style URLs are supported.");
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new CustomStyleError(
      `Styles can only be fetched from the Zotero/CSL repository (got "${url.hostname}").`,
    );
  }
}

/** Normalise the user's input into an allowed absolute URL to fetch. */
function inputToUrl(rawInput: string): URL {
  const input = rawInput.trim();
  if (!input) throw new CustomStyleError("Enter a style id or URL.");

  if (/^https?:\/\//i.test(input)) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new CustomStyleError("That doesn't look like a valid URL.");
    }
    assertAllowedHost(url);
    return url;
  }

  // Bare id/slug (optionally a ".csl" suffix or a "…/styles/<slug>" tail).
  const slug = sanitizeStyleSlug(input);
  return new URL(slugToUrl(slug));
}

/**
 * Turn a human input into a CSL style slug. The CSL style id is almost always
 * the lowercased, hyphenated title, so we normalise accordingly — this lets a
 * user type a friendly name ("Nature Medicine", "The Lancet", "APA") instead of
 * needing to know the exact id ("nature-medicine", "the-lancet", "apa").
 */
function sanitizeStyleSlug(input: string): string {
  const tail = input.split("/").pop() ?? input;
  const slug = tail
    .replace(/\.csl$/i, "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[\s_]+/g, "-") // spaces / underscores → hyphen
    .replace(/[^a-z0-9.-]/g, "") // drop anything else
    .replace(/-+/g, "-") // collapse repeats
    .replace(/^[-.]+|[-.]+$/g, ""); // trim leading/trailing separators
  if (!slug) {
    throw new CustomStyleError("Enter a citation style name, id, or URL.");
  }
  return slug;
}

async function fetchStyleText(url: URL): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/vnd.citationstyles.style+xml, application/xml, text/xml, */*" },
      signal: controller.signal,
      redirect: "follow",
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "failed";
    throw new CustomStyleError(`Fetching the style ${reason}.`);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 404) {
    throw new CustomStyleError("No style found at that id/URL.");
  }
  if (!res.ok) {
    throw new CustomStyleError(`The style server returned ${res.status}.`);
  }

  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) {
    throw new CustomStyleError("That style file is too large.");
  }
  const text = await res.text();
  if (text.length > MAX_BYTES) {
    throw new CustomStyleError("That style file is too large.");
  }
  return text;
}

function extractLinkTags(xml: string): string[] {
  return xml.match(/<link\b[^>]*>/gi) ?? [];
}

/** The href of a `rel="independent-parent"` link, if this is a dependent style. */
function dependentParentHref(xml: string): string | null {
  const dep = extractLinkTags(xml).find((t) =>
    /rel=["']independent-parent["']/i.test(t),
  );
  if (!dep) return null;
  return /href=["']([^"']+)["']/i.exec(dep)?.[1] ?? null;
}

function extractTitle(xml: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(xml);
  return m?.[1]?.trim().replace(/\s+/g, " ") || "Custom style";
}

/** The `<info><id>` self-URL, used to derive a stable slug. */
function extractStyleId(xml: string): string | null {
  return /<id[^>]*>([\s\S]*?)<\/id>/i.exec(xml)?.[1]?.trim() ?? null;
}

function looksLikeCsl(xml: string): boolean {
  // The canonical CSL namespace is http://purl.org/net/xbiblio/csl; accept any
  // ".../csl" namespace on a <style> root to be tolerant of minor variants.
  return /<style\b[^>]*\bxmlns=["'][^"']*\/csl["']/i.test(xml);
}

/**
 * Resolve a style id/URL to an independent CSL style. Throws CustomStyleError
 * with a user-facing message on any failure.
 */
export async function resolveCslStyle(rawInput: string): Promise<ResolvedStyle> {
  const url = inputToUrl(rawInput);
  let xml = await fetchStyleText(url);

  if (!looksLikeCsl(xml)) {
    throw new CustomStyleError("That didn't look like a CSL style file.");
  }

  // Dependent style → fetch its independent parent (citeproc needs the parent).
  const parentHref = dependentParentHref(xml);
  if (parentHref) {
    let parentUrl: URL;
    try {
      // Parent ids are usually http://www.zotero.org/styles/<slug>; upgrade to https.
      parentUrl = new URL(parentHref.replace(/^http:/i, "https:"));
    } catch {
      throw new CustomStyleError("This style links to an invalid parent style.");
    }
    assertAllowedHost(parentUrl);
    xml = await fetchStyleText(parentUrl);
    if (!looksLikeCsl(xml) || dependentParentHref(xml)) {
      throw new CustomStyleError("Could not resolve this style's parent style.");
    }
  }

  const verdict = validateStyleXml(xml);
  if (!verdict.ok) throw new CustomStyleError(verdict.reason);

  const title = extractTitle(xml);
  const styleIdUrl = extractStyleId(xml);
  const slugSource = styleIdUrl?.split("/").pop() ?? rawInput;
  const id = sanitizeId(slugSource) || sanitizeId(extractTitle(xml)) || "custom-style";

  return { id, title, xml };
}
