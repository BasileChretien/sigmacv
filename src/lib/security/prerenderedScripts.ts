import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { logger } from "@/lib/log";

/**
 * The inline scripts of the pages `next build` prerendered, as sha256 hashes for
 * the Content-Security-Policy (`csp.ts` explains why prerendered pages need them).
 *
 * Read off the build output: `prerender-manifest.json` names the prerendered
 * routes, `server/app/<route>.html` is the page as built. Nothing here runs at
 * build time, so there is no artifact to regenerate or to copy into the
 * standalone image. Since 16.3.8 Next answers from a copy of that file, which it
 * makes on the page's first request (`server/route-cache/…`): the same bytes, so
 * the same hashes, as long as nothing rewrites the copy. One thing can, on a
 * case-insensitive filesystem only: see the mis-cased address test in
 * `e2e/production/csp.spec.ts`.
 *
 * Fails closed. A route this cannot vouch for (not in the manifest, revalidated
 * at runtime, file unreadable) gets null, and the caller then sends the nonce
 * policy: a prerendered page is script-less under it, never more permissive.
 *
 * The HTML read here is build output made from the repository alone (no user
 * data, nothing fetched), which is what makes hashing whatever inline script it
 * contains safe.
 */

/**
 * `<script …>…</script …>`, cut where the HTML tokenizer cuts it: a tag name ends
 * at whitespace, `/` or `>` (so `<script-x>` is not a script, and `</script
 * bar>` does close one), and an attribute value may contain `>`. A script cut
 * anywhere else would be hashed as text the browser never runs.
 */
const SCRIPT_ELEMENT =
  /<script(?=[\t\n\f\r />])((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script(?=[\t\n\f\r />])(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
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

interface ManifestRoute {
  initialRevalidateSeconds?: unknown;
  srcRoute?: unknown;
}

/**
 * Routes whose HTML is fixed at build time (a revalidated page changes later),
 * each with the route file it was built from when the manifest names it:
 * `/guides/[slug]` for `/guides/how-to-write-an-academic-cv`, itself for `/about`.
 */
function readPrerenderedRoutes(distDir: string): ReadonlyMap<string, string | null> {
  const manifest: unknown = JSON.parse(
    readFileSync(path.join(distDir, "prerender-manifest.json"), "utf8"),
  );
  const routes = (manifest as { routes?: unknown } | null)?.routes;
  if (typeof routes !== "object" || routes === null) throw new Error("no routes in the manifest");
  return new Map(
    Object.entries(routes as Record<string, ManifestRoute | null>)
      .filter(([, route]) => route?.initialRevalidateSeconds === false)
      .map(([pathname, route]) => [
        pathname,
        typeof route?.srcRoute === "string" ? route.srcRoute : null,
      ]),
  );
}

function htmlFile(distDir: string, route: string): string {
  return path.join(distDir, "server", "app", `${route === "/" ? "/index" : route}.html`);
}

/**
 * The prerendered route Next answers `pathname` with, or null.
 *
 * Next matches the fixed segments of a route as they are written and
 * percent-decodes only what it reads as a parameter. So
 * `/guides/how%2Dto-write-an-academic-cv` and `/%66r/about` are served from the
 * prerender, and `/%61bout` is a 404 rendered per request. (Observed on 16.3.8.
 * Up to 16.3.6 it served /about for that spelling too.) A wrong guess either
 * way is the bug this module exists to prevent or its mirror: a prerendered
 * page sent the nonce policy runs no script, and a page rendered per request
 * does not need the allow-list.
 *
 * A catch-all parameter (`[...path]`) is not followed across segments: a
 * prerendered catch-all page with several segments under it is matched only as
 * written, and a percent-encoded spelling of it gets null. No such page exists
 * today (the only catch-all is a route handler, `api/auth/[...nextauth]`), and
 * `e2e/production/csp.spec.ts` fails on a build that has one.
 */
function prerenderedRouteFor(
  pathname: string,
  routes: ReadonlyMap<string, string | null>,
): string | null {
  if (routes.has(pathname)) return pathname;
  const written = pathname.split("/");
  let decoded: string[];
  try {
    decoded = written.map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
  // A parameter holds no slash: one that comes out of an escape names another path.
  if (decoded.some((segment) => segment.includes("/"))) return null;
  const route = decoded.join("/");
  const pattern = routes.get(route)?.split("/");
  if (pattern?.length !== written.length) return null;
  const fixedSegmentsAsWritten = pattern.every(
    (segment, index) => segment.startsWith("[") || segment === written[index],
  );
  return fixedSegmentsAsWritten ? route : null;
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
 * `pathname` comes from the request, but it only ever selects a file when it
 * names a route of the manifest (as written, or with a parameter segment
 * percent-encoded), so it cannot be used to read anything else.
 */
export function createPrerenderedScriptLookup(distDir: string): PrerenderedScriptLookup {
  let routes: ReadonlyMap<string, string | null> | undefined;
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
    const route = prerenderedRouteFor(pathname, routes);
    if (route === null) return null;
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
