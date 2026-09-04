import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * Software Heritage API — archival status of a software repository, by origin
 * (source-repository) URL.
 *
 * Software Heritage is the universal archive of software source code; a
 * repository it has crawled has at least one recorded "visit" (a snapshot of
 * the repo at a point in time). We surface the LATEST full snapshot's id as a
 * Software Heritage persistent identifier (SWHID) — a preservation/FAIR signal
 * for software CV items, independent of whether the repo is still online. Free,
 * no auth. Fails soft (returns null) — a miss (including a 404, meaning "not
 * archived") is not an error and never breaks a sync.
 *
 * TODO(verify-live): the dev environment has no outbound internet, so the exact
 * response shape below is unverified against the live API. Documented shape:
 *   GET https://archive.softwareheritage.org/api/1/origin/<url-encoded origin>/visit/latest/?require_snapshot=true
 *   → 200 with `{ "snapshot": "<40-hex>", "date": "<ISO 8601>", ... }` when the
 *     origin has an archived snapshot; 404 when the origin is unknown or has no
 *     full (non-partial) snapshot yet (`require_snapshot=true` excludes those).
 * The parser also tolerates `snapshot_id` / `target` as alternate field names and
 * a snapshot nested under `snapshot: { id: "..." }`, in case the shape differs.
 */

const SWH_API = "https://archive.softwareheritage.org/api/1/origin";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 20_000;

/** A Software Heritage snapshot id is a 40-character lowercase hex SHA-1. */
const SWHID_HEX_RE = /^[0-9a-f]{40}$/;

/** Recognized source-code hosts we consider worth a Software Heritage lookup. */
const REPO_HOST_RE = /^(www\.)?(github|gitlab|codeberg|bitbucket)\.(com|org)$/i;

export interface SoftwareHeritageArchival {
  /** `swh:1:snp:<40-hex>` — the persistent identifier for the archived snapshot. */
  swhid: string;
  /** ISO date of the snapshot's visit, when the API reported one. */
  archivedAt?: string;
}

/**
 * Whether a URL points at a recognized source-code hosting platform — the kind
 * of URL worth querying Software Heritage's origin index for. Defensive: any
 * parse failure or unrecognized host returns false.
 */
export function isRepositoryUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && REPO_HOST_RE.test(u.hostname);
  } catch {
    return false;
  }
}

function hexId(value: unknown): string | undefined {
  if (typeof value === "string" && SWHID_HEX_RE.test(value)) return value;
  return undefined;
}

function snapshotIdFrom(record: Record<string, unknown>): string | undefined {
  const direct = hexId(record.snapshot) ?? hexId(record.snapshot_id) ?? hexId(record.target);
  if (direct) return direct;
  const nested = record.snapshot;
  if (typeof nested === "object" && nested !== null) {
    return hexId((nested as Record<string, unknown>).id);
  }
  return undefined;
}

function dateFrom(record: Record<string, unknown>): string | undefined {
  const raw = record.date;
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Look up the latest archived (full) snapshot for a repository origin URL.
 * Returns null when the origin isn't a recognized repo host, isn't archived
 * (404), or on any failure. Never throws.
 */
export async function fetchSoftwareHeritageArchival(
  originUrl: string,
): Promise<SoftwareHeritageArchival | null> {
  if (!isRepositoryUrl(originUrl)) return null;

  const url = `${SWH_API}/${encodeURIComponent(originUrl)}/visit/latest/?require_snapshot=true`;

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 }, // archival status is effectively static day-to-day
      timeoutMs: 12_000,
    });
    // A 404 means "not archived" — not an error.
    if (!res.ok) return null;

    const body = await res.text();
    if (body.length > MAX_BYTES) return null;
    const data = JSON.parse(body) as unknown;
    if (typeof data !== "object" || data === null) return null;

    const snapshot = snapshotIdFrom(data as Record<string, unknown>);
    if (!snapshot) return null;

    const archivedAt = dateFrom(data as Record<string, unknown>);
    const swhid = `swh:1:snp:${snapshot}`;
    return archivedAt ? { swhid, archivedAt } : { swhid };
  } catch (err) {
    logger.warn("softwareheritage.fetch_failed", { err });
    return null;
  }
}
