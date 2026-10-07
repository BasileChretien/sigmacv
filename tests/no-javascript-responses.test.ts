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
 *     a script is refused whatever it contains.
 *
 * `e2e/production/csp.spec.ts` checks the third in a browser, on a few URLs.
 * This reads the source instead, so it covers the routes that suite cannot
 * reach without a database.
 *
 * Its limit: the first check looks for the type's NAME in the code. A type
 * worked out at runtime (looked up from a file extension, put together from
 * parts) is not seen. Nothing does that today, and no MIME library is installed.
 *
 * If this fails for a good reason (a service worker, an embeddable script):
 * that response becomes loadable by any `<script src>` injected into those
 * pages, so it must carry nothing a user can influence. Decide that first, then
 * exempt that one file here and say why.
 */

/** The JavaScript MIME types of the MIME Sniffing standard, by name. */
const JAVASCRIPT_TYPE =
  /\b(?:application|text)\/(?:x-)?(?:ecmascript|javascript|jscript|livescript)/i;

const SOURCE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
/** Extensions a static file server answers with a JavaScript type. */
const SCRIPT_FILE = /\.(?:[cm]?js|jsm|es|ecma)$/i;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" });
}

describe("the origin serves no JavaScript but Next's own build files", () => {
  it("no source file names a JavaScript content type", () => {
    const sources = filesUnder("src")
      // The generated Prisma client is build output, not our code.
      .filter((file) => SOURCE_FILE.test(file) && !file.startsWith(`generated${path.sep}`))
      .map((file) => path.join("src", file));
    // A sanity floor: an empty list would pass for the wrong reason.
    expect(sources.length).toBeGreaterThan(300);

    const named = [...sources, "next.config.ts"].flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) => (JAVASCRIPT_TYPE.test(line) ? [`${file}:${index + 1}`] : [])),
    );
    expect(named).toEqual([]);
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
