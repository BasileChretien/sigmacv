import { auth } from "@/auth";
import { isSameOrigin } from "@/lib/security/origin";
import { clientIp } from "@/lib/security/clientIp";

/**
 * Shared caller-identity gate for the template/style THUMBNAIL-gallery routes
 * (`/api/cv/preview/gallery`, `/api/cv/preview/styles`).
 *
 * These only render a CLIENT-SUPPLIED document into each template/public-style —
 * no DB read, no user data — so they serve BOTH signed-in users AND anonymous
 * callers (the no-login interactive preview at `/preview/[orcid]`, so the style
 * picker shows real thumbnails before sign-in). Same-origin is still enforced
 * (CSRF defence-in-depth); anonymous callers are rate-limited by IP instead of
 * user id, and each route keeps its own item/body caps + rate ceiling.
 *
 * NOT used by `/api/cv/preview` (reads the user's publish state) or
 * `/api/cv/style/resolve` (makes outbound fetches — an SSRF surface); those stay
 * account-gated.
 *
 * Returns the rate-limit identity key (`u:<id>` or `ip:<addr>`) to fold into the
 * route's own bucket prefix, or a 403 when the origin check fails.
 */
export async function previewCaller(
  req: Request,
): Promise<{ ok: true; key: string } | { ok: false; status: 403 }> {
  if (!isSameOrigin(req)) return { ok: false, status: 403 };
  const session = await auth();
  const key = session?.user?.id ? `u:${session.user.id}` : `ip:${clientIp(req)}`;
  return { ok: true, key };
}
