import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

/**
 * What the Content-Security-Policy of prerendered pages relies on.
 *
 * Those pages are sent `script-src 'self' …` (`src/lib/security/csp.ts`): any
 * script FILE on the site's own origin may load, on them and in every view
 * reached from them by client-side navigation (the lookup, the preview, the
 * editor). That is safe only while the origin serves nothing but Next's own
 * build files as JavaScript:
 *
 *  1. our code gives no response a JavaScript content type;
 *  2. `public/` holds no script file, which Next would serve as JavaScript;
 *  3. every response is `nosniff`, so a page, a JSON file or an export named as
 *     a script is refused whatever it contains;
 *  4. no request is rewritten to another server, whose scripts the origin would
 *     then serve as its own (Plausible's proxy setup is such a rewrite).
 *
 * `e2e/production/csp.spec.ts` checks the third in a browser, on a few URLs.
 * This reads the source instead, so it covers the routes that suite cannot
 * reach without a database.
 *
 * Its limits. The first check looks for the type's NAME in the code: a type
 * worked out at runtime (looked up from a file extension, put together from
 * parts, copied from a response fetched elsewhere and passed on) is not seen.
 * Nothing does that today, and no MIME library is installed. The fourth reads
 * `rewrites` in `next.config.ts` and looks for a `rewrite` call under `src`. It
 * does not read what stands in front of the app: a path the reverse proxy hands
 * to another server never reaches this code (the `Caddyfile`, whose site block
 * proxies to the app alone today).
 *
 * If this fails for a good reason (a service worker, an embeddable script):
 * that response becomes loadable by any `<script src>` injected into those
 * pages, so it must carry nothing a user can influence. Decide that first, then
 * exempt that one file here and say why.
 */

/** The JavaScript MIME types of the MIME Sniffing standard, by name. */
const JAVASCRIPT_TYPE =
  /\b(?:application|text)\/(?:x-)?(?:ecmascript|javascript|jscript|livescript)/i;

/** `NextResponse.rewrite(…)`, by its method: whatever the response class is imported as. */
const REWRITE_CALL = /\.rewrite\s*\(/;

const SOURCE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
/** Extensions a static file server answers with a JavaScript type. */
const SCRIPT_FILE = /\.(?:[cm]?js|jsm|es|ecma)$/i;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" });
}

/** Our own source files under `src`. */
function ownSources(): string[] {
  const sources = filesUnder("src")
    // The generated Prisma client is build output, not our code.
    .filter((file) => SOURCE_FILE.test(file) && !file.startsWith(`generated${path.sep}`))
    .map((file) => path.join("src", file));
  // A sanity floor: an empty list would pass for the wrong reason.
  expect(sources.length).toBeGreaterThan(300);
  return sources;
}

/** Every line of `files` that matches `pattern`, as `file:line`. */
function linesMatching(files: string[], pattern: RegExp): string[] {
  return files.flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, index) => (pattern.test(line) ? [`${file}:${index + 1}`] : [])),
  );
}

describe("the origin serves no JavaScript but Next's own build files", () => {
  it("no source file names a JavaScript content type", () => {
    expect(linesMatching([...ownSources(), "next.config.ts"], JAVASCRIPT_TYPE)).toEqual([]);
  });

  // A rewrite to another path of this app serves no foreign script, and fails
  // here all the same. Before exempting one by name: `src/proxy.ts` picks the
  // policy from the address as requested, and Next runs it before the rewrites
  // of the config. So a rewrite onto a prerendered page sends that page the
  // nonce shape, under which none of its scripts run, unless the lookup learns
  // of it (`src/lib/security/prerenderedScripts.ts`). Read off Next's router,
  // not tried: there is no rewrite to try it on.
  it("no request is rewritten: not by the Next config, not by a source file", () => {
    expect(nextConfig.rewrites).toBeUndefined();
    expect(linesMatching(ownSources(), REWRITE_CALL)).toEqual([]);
  });

  it("public/ holds no script file", () => {
    const files = filesUnder("public");
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((file) => SCRIPT_FILE.test(file))).toEqual([]);
  });

  it("every path is answered with nosniff", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const everywhere = rules.filter((rule) => rule.source === "/:path*");
    expect(everywhere.flatMap((rule) => rule.headers)).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
  });
});
