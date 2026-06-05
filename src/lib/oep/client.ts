import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * Open Editors Plus (OEP) adapter — editorial roles by ORCID.
 *
 * OEP is the project owner's own dataset; this reads it from a configurable
 * JSON source (`OEP_DATA_URL`). With no source configured the integration is a
 * no-op (no editorial section), so the app runs without it.
 *
 * Expected dataset shape (JSON array):
 *   [{ "orcid": "0000-...", "journal": "…", "role": "Associate Editor",
 *      "startYear": 2020, "endYear": 2023 }, …]
 */
export interface EditorialRole {
  journal: string;
  role: string;
  startYear?: number;
  endYear?: number;
}

interface OepRecord {
  orcid?: string;
  journal?: string;
  role?: string;
  startYear?: number;
  endYear?: number;
}

const OEP_FETCH_TIMEOUT_MS = 15_000;

/**
 * Reject hostnames that resolve to (or literally are) loopback / link-local /
 * private / cloud-metadata addresses — the classic SSRF targets. This catches IP
 * LITERALS and the well-known metadata names; it does NOT resolve DNS, so a
 * hostname that A-records into a private range is not caught here (a deeper
 * residual, mitigated by OEP_DATA_URL being operator-set, not user input).
 */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  // ALWAYS blocked — never a legitimate dataset host, even in dev: the cloud
  // metadata name and link-local ranges (the classic SSRF-to-metadata targets).
  if (h === "metadata.google.internal") return true;
  if (/^169\.254\./.test(h) || /^fe80:/i.test(h)) return true;
  // Loopback / private ranges are legitimate in local dev (e.g. a local OEP
  // server on localhost), so only block them in production.
  if (process.env.NODE_ENV === "production") {
    if (h === "localhost" || h.endsWith(".localhost")) return true;
    if (/^(127\.|0\.|10\.|192\.168\.)/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
    if (h === "::1" || h === "::") return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true; // IPv6 unique-local (ULA)
    if (/^::ffff:(127\.|10\.|192\.168\.|169\.254\.)/i.test(h)) return true;
  }
  return false;
}

/**
 * Validate the operator-configured `OEP_DATA_URL` before fetching: require an
 * http(s) scheme and reject loopback/link-local/private/metadata hosts.
 * `OEP_DATA_URL` is operator-set (not user input), so this is defence-in-depth
 * against a misconfiguration that would turn the fetch into an SSRF primitive.
 */
export function isAllowedOepUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  return !isBlockedHost(u.hostname);
}

export async function fetchEditorialRoles(
  orcid: string,
): Promise<EditorialRole[]> {
  const url = process.env.OEP_DATA_URL;
  if (!url) return [];
  if (!isAllowedOepUrl(url)) {
    logger.warn("oep.dataset_url_rejected", {});
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OEP_FETCH_TIMEOUT_MS);
  try {
    // Bound the request, and re-validate the final host after any redirect so an
    // allowed host can't 3xx the fetch onto an internal address.
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: controller.signal });
    if (res.url) {
      try {
        if (isBlockedHost(new URL(res.url).hostname)) {
          logger.warn("oep.dataset_url_rejected", {});
          return [];
        }
      } catch {
        return [];
      }
    }
    if (!res.ok) {
      logger.warn("oep.dataset_fetch_failed", { status: res.status });
      return [];
    }
    const data = (await res.json()) as OepRecord[];
    const bare = normalizeOrcid(orcid);
    return data
      .filter(
        (r) => r.journal && r.role && normalizeOrcid(r.orcid) === bare,
      )
      .map((r) => ({
        journal: r.journal as string,
        role: r.role as string,
        startYear: r.startYear,
        endYear: r.endYear,
      }));
  } catch (err) {
    logger.warn("oep.editorial_roles_failed", { err });
    return [];
  } finally {
    clearTimeout(timer);
  }
}
