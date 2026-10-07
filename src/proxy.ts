import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/security/csp";
import { createPrerenderedScriptLookup } from "@/lib/security/prerenderedScripts";

/**
 * App-shell Content-Security-Policy.
 *
 * The CV *document* (preview iframe + PDF) already ships its own strict CSP;
 * this header secures the Next.js app shell (landing + /cv editor). A route
 * rendered per request gets a per-request nonce + `strict-dynamic`, so Next can
 * nonce its own hydration scripts (it reads the CSP from the request header). A
 * prerendered route carries no nonce in its HTML, so it gets the hashes of its
 * inline scripts instead — `src/lib/security/csp.ts` has the two shapes and the
 * reasoning. In development we relax script-src (HMR needs eval) and allow the
 * HMR websocket, so the dev server isn't broken — production gets the strict
 * policy.
 *
 * Excludes /api (JSON), Next static assets, and /p/ (the public CV document,
 * which carries its own CSP) — see `config.matcher`.
 *
 * Next 16 renamed the `middleware` file convention to `proxy` (same request
 * interception, same `config` export); this is that file. It runs on the Node.js
 * runtime, which is what lets it read the build output.
 */

// The build this server serves: `next start` and the standalone `server.js` both
// run with the directory that holds `.next` as their working directory. (A
// custom `distDir`, or `next start <dir>` from elsewhere, would not be found:
// prerendered pages would then get the nonce policy and run no script.)
const prerenderedScriptHashes = createPrerenderedScriptLookup(
  path.join(/* turbopackIgnore: true */ process.cwd(), ".next"),
);

export function proxy(request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  // Base64 of 16 RAW random bytes (128 bits) — stronger and more standard than
  // base64-ing the 36-char UUID *string* (which only encodes hex ASCII).
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));

  const csp = contentSecurityPolicy({
    isDev,
    nonce,
    // Build-time-inlined; unset/blank → analytics is not in the policy at all.
    analyticsSrc: process.env.NEXT_PUBLIC_PLAUSIBLE_SRC,
    // `next dev` prerenders nothing, and its policy does not need hashes.
    prerenderedScriptHashes: isDev ? null : prerenderedScriptHashes(request.nextUrl.pathname),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the request CSP to apply the nonce to its own scripts.
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|p/).*)",
    },
  ],
};
