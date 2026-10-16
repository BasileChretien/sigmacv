import type { CvModelId } from "./cvModels";
import {
  cvModelSourceDueOn,
  isCvModelSourceDue,
  verifiedCvModelSources,
  type CvModelSource,
} from "./cvModelSources";

/**
 * The monthly check behind the `CV model sources` workflow: for every model read
 * against a funder document (`cvModelSources.ts`), whether that reading still
 * holds. Four things can be wrong with one source:
 *  - `due`        — its `recheckBy` day has come: the funder's next rules are
 *                   expected, so the model must be read again;
 *  - `unreachable`— the document, or the funder's page that listed it, answers
 *                   that it is gone (a 4xx such as 404 or 410), or the document
 *                   now redirects to another address;
 *  - `unlisted`   — the funder's page (`listedOn`) answers but no longer links
 *                   to the document: a revised version or a new edition has
 *                   probably replaced it there;
 *  - `unreadable` — no usable answer this time: the site refused a robot
 *                   (401, 403, 429), failed (5xx), or did not answer. Reported,
 *                   never failing: a maintenance window or a robot-shy site
 *                   would otherwise turn runs red for nothing, and the due date
 *                   still catches a reading that has gone stale.
 * The fetch is the caller's (the script passes a polite resilient one; tests a
 * fake), so this module makes no network call of its own.
 */

/** What one GET answered: its status, its final address, and its body when asked for. */
export interface FetchedPage {
  status: number;
  /** The address the answer came from, after redirects (absent: the one asked). */
  url?: string;
  body?: string;
}

/** GET `url`; read the body only when `withBody`. Throws when nothing answers. */
export type PageFetcher = (url: string, withBody: boolean) => Promise<FetchedPage>;

export type SourceProblem = "due" | "unreachable" | "unlisted" | "unreadable";

export interface SourceFinding {
  modelId: CvModelId;
  document: string;
  /** The address the problem is about: the document, or the page that lists it. */
  url: string;
  problem: SourceProblem;
  detail: string;
}

/** The problems that make the run fail; `unreadable` is reported only. */
export const FAILING_PROBLEMS: ReadonlySet<SourceProblem> = new Set([
  "due",
  "unreachable",
  "unlisted",
]);

/** Statuses a site uses to refuse a robot rather than to say the page is gone. */
const REFUSED_STATUSES = new Set([401, 403, 429]);

/** Host, path and query, decoded, so two spellings of one address compare equal. */
function addressKey(url: URL): string {
  const decode = (s: string): string => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  return `${url.host}${decode(url.pathname)}${decode(url.search)}`;
}

/** Whether two addresses name the same document (the scheme and fragment aside). */
function sameDocument(a: string, b: string): boolean {
  return addressKey(new URL(a)) === addressKey(new URL(b));
}

const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

/**
 * Whether the page at `base`, whose HTML is `html`, links to `url`: any href,
 * absolute or relative to the page, that resolves to the same host, path and
 * query, however its characters are escaped.
 */
export function pageLinksTo(html: string, url: string, base: string): boolean {
  for (const m of html.matchAll(HREF)) {
    const href = (m[1] ?? m[2] ?? m[3] ?? "").replaceAll("&amp;", "&");
    let resolved: string;
    try {
      resolved = new URL(href, base).href;
    } catch {
      continue;
    }
    if (sameDocument(resolved, url)) return true;
  }
  return false;
}

type Answer =
  { kind: "ok"; url?: string; body?: string } | { kind: "unreadable" | "gone"; detail: string };

async function ask(fetchPage: PageFetcher, url: string, withBody: boolean): Promise<Answer> {
  let page: FetchedPage;
  try {
    page = await fetchPage(url, withBody);
  } catch (err) {
    const why = err instanceof Error ? err.message : "error";
    return { kind: "unreadable", detail: `no answer (${why})` };
  }
  if (page.status >= 200 && page.status < 300) {
    return { kind: "ok", url: page.url, body: page.body };
  }
  if (REFUSED_STATUSES.has(page.status)) {
    return {
      kind: "unreadable",
      detail: `HTTP ${page.status}: the site refused an automated read`,
    };
  }
  if (page.status >= 500) {
    return { kind: "unreadable", detail: `HTTP ${page.status}: the site failed to answer` };
  }
  return { kind: "gone", detail: `HTTP ${page.status}` };
}

async function checkOne(
  modelId: CvModelId,
  source: CvModelSource,
  fetchPage: PageFetcher,
  now: Date,
): Promise<SourceFinding[]> {
  const findings: SourceFinding[] = [];
  const finding = (url: string, problem: SourceProblem, detail: string): void => {
    findings.push({ modelId, document: source.document, url, problem, detail });
  };

  if (isCvModelSourceDue(source, now)) {
    finding(
      source.url,
      "due",
      `read on ${source.lastVerified}, due again on ${cvModelSourceDueOn(source)}`,
    );
  }

  const document = await ask(fetchPage, source.url, false);
  if (document.kind === "ok" && document.url && !sameDocument(document.url, source.url)) {
    // A withdrawn file often redirects to the funder's home page, which answers 200.
    finding(source.url, "unreachable", `now redirects to ${document.url}`);
  } else if (document.kind !== "ok") {
    finding(source.url, document.kind === "gone" ? "unreachable" : "unreadable", document.detail);
  }

  if (source.listedOn) {
    const listing = await ask(fetchPage, source.listedOn, true);
    if (listing.kind !== "ok") {
      finding(
        source.listedOn,
        listing.kind === "gone" ? "unreachable" : "unreadable",
        listing.detail,
      );
    } else if (!pageLinksTo(listing.body ?? "", source.url, listing.url ?? source.listedOn)) {
      finding(source.listedOn, "unlisted", "the funder's page no longer links to the document");
    }
  }
  return findings;
}

/** Check every source, one request at a time (a funder's site is asked a handful of times a month). */
export async function checkCvModelSources(
  fetchPage: PageFetcher,
  now: Date,
  sources: ReadonlyArray<readonly [CvModelId, readonly CvModelSource[]]> = verifiedCvModelSources(),
): Promise<SourceFinding[]> {
  const findings: SourceFinding[] = [];
  for (const [modelId, modelSources] of sources) {
    for (const source of modelSources) {
      findings.push(...(await checkOne(modelId, source, fetchPage, now)));
    }
  }
  return findings;
}

/** The run's report, in Markdown (the console and the workflow's job summary). */
export function formatSourceReport(findings: readonly SourceFinding[], checked: number): string {
  const heading = `## CV model sources: ${checked} document(s) checked`;
  if (findings.length === 0) return `${heading}\n\nEvery reading is current.\n`;
  const rows = findings.map(
    (f) => `| \`${f.modelId}\` | ${f.document} | ${f.problem} | ${f.detail} | ${f.url} |`,
  );
  return [
    heading,
    "",
    "| Model | Document | Problem | Detail | Address |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "What to do with each problem: docs/CV-MODELS.md.",
    "",
  ].join("\n");
}
