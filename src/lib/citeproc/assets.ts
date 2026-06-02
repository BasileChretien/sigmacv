import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Loads vendored CSL style + locale XML from disk (populated by `fetch-csl`).
 * Files are read once and cached in-process.
 *
 * Paths are resolved from `process.cwd()` (the project root in dev and the
 * standalone runtime); `next.config.ts` traces this directory into the
 * standalone build via `outputFileTracingIncludes`.
 */

const ASSETS_DIR = join(process.cwd(), "src", "lib", "citeproc", "assets");
const STYLES_DIR = join(ASSETS_DIR, "styles");
const LOCALES_DIR = join(ASSETS_DIR, "locales");

export const DEFAULT_STYLE = "apa";
export const DEFAULT_LOCALE = "en-US";

const styleCache = new Map<string, string>();
/**
 * User-added CSL styles (resolved from the Zotero/CSL repo), kept SEPARATE from
 * vendored styles and only consulted after disk — so a custom style can never
 * shadow or poison a bundled one (`getStyleXml` always prefers vendored).
 */
const customStyleCache = new Map<string, string>();
let localeCache: string | null = null;

function sanitizeKey(key: string): string {
  return key.replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

function vendoredStylePath(key: string): string {
  return join(STYLES_DIR, `${key}.csl`);
}

/** Read a CSL style by key (e.g. "apa"), falling back to the default. */
export function getStyleXml(styleKey: string): string {
  const key = sanitizeKey(styleKey) || DEFAULT_STYLE;
  const cached = styleCache.get(key);
  if (cached) return cached;

  const path = vendoredStylePath(key);
  if (existsSync(path)) {
    const xml = readFileSync(path, "utf8");
    styleCache.set(key, xml);
    return xml;
  }

  // Not a bundled style — use a registered custom style if one exists.
  const custom = customStyleCache.get(key);
  if (custom) return custom;

  if (key !== DEFAULT_STYLE) return getStyleXml(DEFAULT_STYLE);
  /* v8 ignore next 3 -- defensive: assets are vendored by fetch-csl */
  throw new Error(
    `CSL style "${key}" not found at ${path}. Run \`npm run fetch-csl\`.`,
  );
}

/**
 * Register a user-added CSL style XML under an id so subsequent `getStyleXml`
 * calls in this process resolve it. Refuses to overwrite a vendored style key
 * (bundled styles always win) — prevents cache poisoning of the shared styles.
 * Idempotent; the canonical document is the durable store (re-registered per
 * render), this map is just an in-process fast path.
 */
export function registerStyleXml(id: string, xml: string): void {
  const key = sanitizeKey(id);
  if (!key || !xml) return;
  if (existsSync(vendoredStylePath(key))) return;
  customStyleCache.set(key, xml);
}

/**
 * Return locale XML. The MVP bundles only en-US, so we return it for any
 * requested language tag (citeproc requests "en-US", "en", or "us").
 */
export function getLocaleXml(_lang?: string): string {
  if (localeCache) return localeCache;
  const path = join(LOCALES_DIR, `locales-${DEFAULT_LOCALE}.xml`);
  /* v8 ignore next 5 -- defensive: the en-US locale is vendored by fetch-csl */
  if (!existsSync(path)) {
    throw new Error(
      `CSL locale not found at ${path}. Run \`npm run fetch-csl\`.`,
    );
  }
  localeCache = readFileSync(path, "utf8");
  return localeCache;
}

/** List the style keys available on disk (for the UI dropdown). */
export function listAvailableStyles(): string[] {
  if (!existsSync(STYLES_DIR)) return [];
  return readdirSync(STYLES_DIR)
    .filter((f) => f.endsWith(".csl"))
    .map((f) => f.replace(/\.csl$/, ""))
    .sort();
}
