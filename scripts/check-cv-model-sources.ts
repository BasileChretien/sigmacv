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
import { resilientFetch } from "@/lib/http";

const USER_AGENT = "SigmaCV CV-model source check (+https://github.com/BasileChretien/sigmacv)";

async function fetchPage(url: string, withBody: boolean): Promise<FetchedPage> {
  const res = await resilientFetch(url, {
    timeoutMs: 30_000,
    retries: 2,
    headers: { "User-Agent": USER_AGENT },
  });
  if (!withBody || !res.ok) {
    await res.body?.cancel();
    return { status: res.status };
  }
  return { status: res.status, body: await res.text() };
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
