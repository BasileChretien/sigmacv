import { NextResponse } from "next/server";

/**
 * Liveness/readiness probe for the reverse proxy and the container healthcheck.
 *
 * Caddy's active health check (`health_uri /api/health`) and the Docker
 * `healthcheck:` poll this to learn when a freshly-started app container can
 * actually serve traffic. During a redeploy the proxy HOLDS requests
 * (`lb_try_duration`) until this returns 200 on the NEW container, so swapping
 * containers no longer 502s mid-deploy. See `Caddyfile` and `DEPLOY.md`.
 *
 * Deliberately dependency-free: it must answer the instant Next.js is listening,
 * WITHOUT touching Postgres or any external API. Gating readiness on the database
 * would let a transient DB blip mark every container unhealthy and pull the whole
 * site out of rotation — the opposite of what we want here. A 200 means "this
 * process is up and routable"; individual routes still surface their own DB /
 * upstream errors.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// Some probes use HEAD; answer it identically (empty body, 200).
export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
