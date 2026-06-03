import { NextResponse, type NextRequest } from "next/server";

/**
 * App-shell Content-Security-Policy.
 *
 * The CV *document* (preview iframe + PDF) already ships its own strict CSP;
 * this header secures the Next.js app shell (landing + /cv editor). We use a
 * per-request nonce + `strict-dynamic` so Next can nonce its own hydration
 * scripts (it reads the CSP from the request header). In development we relax
 * script-src (HMR needs eval) and allow the HMR websocket, so the dev server
 * isn't broken — production gets the strict policy.
 *
 * Excludes /api (JSON), Next static assets, and /p/ (the public CV document,
 * which carries its own CSP) — see `config.matcher`.
 */
export function middleware(request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = btoa(crypto.randomUUID());

  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // React inline style attributes (style={{…}}) need 'unsafe-inline'; the
    // security value of CSP is overwhelmingly in script-src anyway.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    // The live-preview is a sandboxed srcdoc <iframe>.
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

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
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|p/).*)",
    },
  ],
};
