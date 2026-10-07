import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { logger } from "@/lib/log";

/**
 * The inline scripts of the pages `next build` prerendered, as sha256 hashes for
 * the Content-Security-Policy (`csp.ts` explains why prerendered pages need them).
 *
 * Read off the build output Next itself serves from: `prerender-manifest.json`
 * names the prerendered routes, `server/app/<route>.html` is the page. Nothing
 * here runs at build time, so there is no artifact to regenerate or to copy into
 * the standalone image: the hashes are computed from the bytes that are served.
 *
 * Fails closed. A route this cannot vouch for (not in the manifest, revalidated
 * at runtime, file unreadable) gets null, and the caller then sends the nonce
 * policy: a prerendered page is script-less under it, never more permissive.
 *
 * The HTML read here is build output made from the repository alone (no user
 * data, nothing fetched), which is what makes hashing whatever inline script it
 * contains safe.
 */

/** `<script …>…</script>`; an attribute value may contain `>`. */
const SCRIPT_ELEMENT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;
const HAS_SRC = /(?:^|\s)src\s*=/i;
/** Data blocks (JSON-LD…) are never executed, so CSP never asks about them. */
const DATA_BLOCK_TYPE = /(?:^|\s)type\s*=\s*["']?application\/(?:ld\+)?json\b/i;

/**
 * Base64 sha256 of every inline script in `html`, in document order, each once.
 *
 * The browser hashes a script's text after the HTML parser has normalised
 * newlines to LF, so the same is done here.
 */
export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>();
  for (const [, attributes = "", body = ""] of html.matchAll(SCRIPT_ELEMENT)) {
    if (body === "" || HAS_SRC.test(attributes) || DATA_BLOCK_TYPE.test(attributes)) continue;
    const text = body.replace(/\r\n?/g, "\n");
    hashes.add(createHash("sha256").update(text, "utf8").digest("base64"));
  }
  return [...hashes];
}

/** Routes whose HTML is fixed at build time (a revalidated page changes later). */
function readPrerenderedRoutes(distDir: string): ReadonlySet<string> {
  const manifest: unknown = JSON.parse(
    readFileSync(path.join(distDir, "prerender-manifest.json"), "utf8"),
  );
  const routes = (manifest as { routes?: unknown } | null)?.routes;
  if (typeof routes !== "object" || routes === null) throw new Error("no routes in the manifest");
  return new Set(
    Object.entries(routes as Record<string, { initialRevalidateSeconds?: unknown } | null>)
      .filter(([, route]) => route?.initialRevalidateSeconds === false)
      .map(([pathname]) => pathname),
  );
}

function htmlFile(distDir: string, route: string): string {
  return path.join(distDir, "server", "app", `${route === "/" ? "/index" : route}.html`);
}

/** Next matches `/%61bout` to `/about`; so must the lookup, or that spelling is script-less. */
function decodedPathname(pathname: string): string {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

/** The inline-script hashes of the prerendered page at `pathname`, or null. */
export type PrerenderedScriptLookup = (pathname: string) => readonly string[] | null;

/**
 * A lookup over the build in `distDir` (`.next`). The manifest and each page
 * are read once, on first use, and kept: a build does not change while its
 * server runs. A read that FAILS is not kept. It is tried again on the next
 * request, since caching a passing failure would leave pages script-less until
 * a restart, and it is logged the first time only.
 *
 * `pathname` comes from the request, but it only ever selects a file when it is
 * exactly a route of the manifest, so it cannot be used to read anything else.
 */
export function createPrerenderedScriptLookup(distDir: string): PrerenderedScriptLookup {
  let routes: ReadonlySet<string> | undefined;
  const byRoute = new Map<string, readonly string[] | null>();
  // Bounded: the manifest itself, then at most one entry per route in it.
  const logged = new Set<string>();

  function logOnce(event: string, key: string, fields: Record<string, unknown>): void {
    if (logged.has(key)) return;
    logged.add(key);
    logger.error(event, fields);
  }

  return (pathname) => {
    if (!routes) {
      try {
        routes = readPrerenderedRoutes(distDir);
      } catch (error) {
        // Every prerendered page is script-less until this reads.
        logOnce("csp.prerender_manifest_unreadable", "", { error });
        return null;
      }
    }
    const route = decodedPathname(pathname);
    if (!routes.has(route)) return null;
    const known = byRoute.get(route);
    if (known !== undefined) return known;
    try {
      const hashes = inlineScriptHashes(readFileSync(htmlFile(distDir, route), "utf8"));
      byRoute.set(route, hashes);
      return hashes;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // A prerendered non-page (robots.txt, an OG image) has no HTML, ever.
        byRoute.set(route, null);
      } else {
        logOnce("csp.prerendered_page_unreadable", route, { route, error });
      }
      return null;
    }
  };
}
