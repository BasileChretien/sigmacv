/**
 * Real client IP from the proxy headers, for per-IP rate limiting.
 *
 * Caddy is configured to OVERWRITE `X-Forwarded-For` with the real peer
 * (`header_up X-Forwarded-For {remote_host}`), so the trusted value is the
 * RIGHTMOST hop — never the leftmost client-supplied one (which an attacker could
 * rotate to evade a per-IP limit). Falls back to `X-Real-IP`, then `"unknown"`.
 *
 * Shared by every anonymous, per-IP-limited route (public page, OAI, the no-login
 * preview + its render/thumbnail endpoints) so the extraction lives in one tested
 * place rather than being re-implemented per route.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** {@link clientIpFromHeaders} for a `Request`. */
export function clientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}
