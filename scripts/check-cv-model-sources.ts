/**
 * Checks that every CV model's funder documents are still the ones it was read
 * against (`src/lib/canonical/cvModelSources.ts`): a reading that is due again,
 * a document that no longer answers, or one the funder's page stopped listing
 * exits 1. Run monthly by `.github/workflows/cv-model-sources.yml`, or by hand:
 *
 *   npm run models:sources
 *
 * The report goes to stdout and, inside GitHub Actions, to the job summary.
 * What to do with each problem: docs/CV-MODELS.md.
 */
import { appendFileSync } from "node:fs";
import {
  FAILING_PROBLEMS,
  checkCvModelSources,
  formatSourceReport,
  type FetchedPage,
} from "@/lib/canonical/cvModelSourceCheck";
import { verifiedCvModelSources } from "@/lib/canonical/cvModelSources";
import { readBodyWithin, resilientFetch } from "@/lib/http";

const USER_AGENT = "SigmaCV CV-model source check (+https://github.com/BasileChretien/sigmacv)";
/** Headers and body alike: `resilientFetch`'s own timeout stops at the headers. */
const TIMEOUT_MS = 30_000;
/** A funder's call page is a few hundred kilobytes; anything far larger is not one. */
const MAX_PAGE_BYTES = 5_000_000;

async function fetchPage(url: string, withBody: boolean): Promise<FetchedPage> {
  const res = await resilientFetch(url, {
    timeoutMs: TIMEOUT_MS,
    retries: 2,
    headers: { "User-Agent": USER_AGENT },
  });
  if (!withBody || !res.ok) {
    await res.body?.cancel();
    return { status: res.status, url: res.url };
  }
  const body = await readBodyWithin(res, Date.now() + TIMEOUT_MS, MAX_PAGE_BYTES);
  if (body === undefined) throw new Error("the page did not finish loading");
  return { status: res.status, url: res.url, body };
}

async function main(): Promise<void> {
  const sources = verifiedCvModelSources();
  const checked = sources.reduce((n, [, docs]) => n + docs.length, 0);
  const findings = await checkCvModelSources(fetchPage, new Date(), sources);
  const report = formatSourceReport(findings, checked);
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  if (findings.some((f) => FAILING_PROBLEMS.has(f.problem))) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
