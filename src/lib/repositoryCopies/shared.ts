import { readBodyWithin, resilientFetch } from "@/lib/http";

/**
 * Repository copies — is a closed journal article ALREADY in a repository
 * somewhere, whatever OpenAlex knows? OpenAlex (and Unpaywall, its source) miss
 * deposits routinely: on one owner's CV, 2026-09-16, 17 of 51 "no open copy
 * found" articles had a HAL record — 3 with a file (one since 2021), 14 notices
 * without one — and neither OpenAlex nor Unpaywall saw any of them. So the
 * owner sync asks the repositories themselves, one DOI at a time, in the order
 * that found the most: HAL, Europe PMC, OpenAIRE (the aggregator of institutional
 * repositories), Zenodo. Each client here follows the external-client convention
 * (`src/lib/oaworks/client.ts`): keyless, one attempt, no redirect, `no-store`, a
 * byte cap, a contact address in the User-Agent, and three outcomes — `found` and
 * `none` are answers, `failed` is not (the pass retries on a later sync).
 *
 * A copy is stored with what the worklist prints (data minimisation): where, the
 * record's id and page, whether a FILE is there (a notice without one is a
 * different thing: the deposit then means adding the file to it), the host's
 * name and the record's date. Nothing else from the responses is kept.
 */

export const COPY_SOURCES = ["hal", "europepmc", "openaire", "zenodo"] as const;
export type CopySource = (typeof COPY_SOURCES)[number];

export interface RepositoryCopy {
  source: CopySource;
  /** The repository's own identifier of the record (hal-…, PMC…, an OpenAIRE id, a Zenodo id). */
  id: string;
  /** The record's page, https. */
  url: string;
  /** Whether a full-text file is open there — false for a metadata-only notice. */
  hasFile: boolean;
  /** The host's name where the source names one (OpenAIRE's hosted-by). */
  name?: string;
  /** The record's own date (ISO date), where the source gives one. */
  recorded?: string;
}

export type CopyLookup =
  { status: "found"; copies: RepositoryCopy[] } | { status: "none" } | { status: "failed" };

export const NONE: CopyLookup = { status: "none" };
export const FAILED: CopyLookup = { status: "failed" };

/** Bounds applied at the boundary (the canonical schema enforces the same). */
export const COPY_LIMITS = { id: 100, url: 2048, name: 200, perSource: 3 } as const;
/** The longest one lookup may take, headers and body together. */
export const COPY_TIMEOUT_MS = 8_000;
const MAX_BYTES = 1_000_000;
const MAX_DOI = 300;
const DOI_RE = /^10\.\d{4,9}\/\S+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** A DOI as the repositories key it: bare, sane, no dot segment (owner-editable input). */
export function bareDoi(doi: string): string | undefined {
  const bare = doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "");
  if (bare.length > MAX_DOI || !DOI_RE.test(bare)) return undefined;
  return bare.split("/").some((segment) => segment === "." || segment === "..") ? undefined : bare;
}

function userAgent(mailto: string | undefined): string {
  const contact = mailto?.trim() ? `; mailto:${mailto.trim()}` : "";
  return `SigmaCV (+https://github.com/BasileChretien/sigmacv${contact})`;
}

/** An ISO date (YYYY-MM-DD) from a source's date string, or nothing. */
export function isoDate(value: unknown): string | undefined {
  return typeof value === "string" && ISO_DATE.test(value) ? value.slice(0, 10) : undefined;
}

/** A bounded string field, or nothing. */
export function text(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : undefined;
}

/**
 * One GET of a JSON document under the lookup's time limit. `undefined` means a
 * failure worth retrying later (a timeout, a 429, a 5xx, an unreadable body);
 * `null` means the source answered that it has nothing (a 404).
 */
export async function getJson(
  url: URL,
  mailto: string | undefined,
  timeoutMs: number,
): Promise<unknown | null | undefined> {
  const limit = Math.max(1, Math.min(COPY_TIMEOUT_MS, timeoutMs));
  const deadline = Date.now() + limit;
  try {
    const res = await resilientFetch(url.href, {
      headers: { Accept: "application/json", "User-Agent": userAgent(mailto) },
      timeoutMs: limit,
      retries: 0,
      redirect: "error",
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const body = await readBodyWithin(res, deadline, MAX_BYTES);
    if (body === undefined) return undefined;
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

/** The first `n` copies, a copy with a file first — the fact the worklist acts on. */
export function bestFirst(
  copies: RepositoryCopy[],
  n: number = COPY_LIMITS.perSource,
): RepositoryCopy[] {
  return [...copies].sort((a, b) => Number(b.hasFile) - Number(a.hasFile)).slice(0, n);
}
