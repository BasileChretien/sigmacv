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
 *  - `unreachable`— the document no longer answers at its address (moved or
 *                   withdrawn, which usually comes with a new edition), or the
 *                   funder's page that listed it is gone;
 *  - `unlisted`   — the funder's page (`listedOn`) answers but no longer links
 *                   to the document: a new edition has probably replaced it;
 *  - `unreadable` — the site refused an automated read (401/403/429). Reported,
 *                   never failing: a site that blocks robots would otherwise
 *                   turn every run red and teach everyone to ignore it.
 * The fetch is the caller's (the script passes a polite resilient one; tests a
 * fake), so this module makes no network call of its own.
 */

/** What one GET answered: its status, and its body when the caller asked for it. */
export interface FetchedPage {
  status: number;
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

/** Whether `html` links to `url`, written absolute, root-relative, or with `&amp;`. */
export function pageLinksTo(html: string, url: string): boolean {
  const { pathname, search } = new URL(url);
  const relative = pathname + search;
  return [url, relative, relative.replaceAll("&", "&amp;")].some((form) => html.includes(form));
}

type Answer = { kind: "ok"; body?: string } | { kind: "refused" | "gone"; detail: string };

async function ask(fetchPage: PageFetcher, url: string, withBody: boolean): Promise<Answer> {
  let page: FetchedPage;
  try {
    page = await fetchPage(url, withBody);
  } catch (err) {
    return { kind: "gone", detail: `no answer (${err instanceof Error ? err.message : "error"})` };
  }
  if (page.status >= 200 && page.status < 300) return { kind: "ok", body: page.body };
  if (REFUSED_STATUSES.has(page.status)) {
    return { kind: "refused", detail: `HTTP ${page.status}: the site refused an automated read` };
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
  if (document.kind === "refused") finding(source.url, "unreadable", document.detail);
  if (document.kind === "gone") finding(source.url, "unreachable", document.detail);

  if (source.listedOn) {
    const listing = await ask(fetchPage, source.listedOn, true);
    if (listing.kind === "refused") finding(source.listedOn, "unreadable", listing.detail);
    if (listing.kind === "gone") finding(source.listedOn, "unreachable", listing.detail);
    if (listing.kind === "ok" && !pageLinksTo(listing.body ?? "", source.url)) {
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
    "To re-read a model and record the new reading, see docs/CV-MODELS.md.",
    "",
  ].join("\n");
}
