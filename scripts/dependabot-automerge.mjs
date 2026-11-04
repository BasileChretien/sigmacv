#!/usr/bin/env node
/**
 * Which Dependabot pull requests merge themselves, and how they get there.
 *
 * Two commands, one per workflow:
 *
 *   decide  (.github/workflows/dependabot-auto-merge.yml, on each Dependabot PR)
 *           reads the update's metadata from the environment and writes
 *           `merge=true|false` to $GITHUB_OUTPUT. The workflow then arms
 *           GitHub's auto-merge, which merges once the required checks pass,
 *           or disarms it.
 *
 *   train   (.github/workflows/dependabot-train.yml, hourly)
 *           brings ONE armed PR that has fallen behind main up to date, then
 *           starts the required checks on it; or restarts the checks of an
 *           armed PR an earlier update left without any.
 *
 * What the train cannot fix waits for a person, with a warning in its log: an
 * update GitHub refuses (the workflow token may not touch workflow files), and
 * a required check that failed. Once the train has pushed to a branch,
 * Dependabot no longer rebases it, so a conflict there needs a person too.
 *
 * Why the train exists: main requires branches to be up to date, and auto-merge
 * never updates a branch. Dependabot rebases only on a conflict, so once one PR
 * merges, an armed PR with no conflict waits behind main forever. The workflow
 * token can update the branch, but pushes made with it start no workflow, so the
 * required checks would never report on the new head. Starting them by
 * workflow_dispatch is the one thing that token may do that does start a run.
 * (Dependabot refuses a "@dependabot rebase" comment from that token.)
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Dependabot's names for the ecosystems whose patch/minor updates merge themselves. */
export const AUTO_MERGE_ECOSYSTEMS = new Set(["npm_and_yarn", "github_actions"]);

export const AUTO_MERGE_UPDATE_TYPES = new Set([
  "version-update:semver-patch",
  "version-update:semver-minor",
]);

/**
 * Never merged alone: the npm `playwright` version must match the Dockerfile's
 * runtime image tag (tests/dockerfile-playwright-sync.test.ts), so its PR is red
 * by itself and needs a hand to move both.
 */
export const NEVER_AUTO_MERGE = new Set(["playwright", "@playwright/test"]);

/** The checks branch protection requires on main (ci.yml and e2e.yml job names). */
export const REQUIRED_CHECKS = ["Format · Typecheck · Test · Build", "Playwright journeys"];

/** The workflows that produce REQUIRED_CHECKS, started on a branch the train updated. */
export const REQUIRED_WORKFLOWS = ["ci.yml", "e2e.yml"];

/**
 * @param {{ ecosystem?: string, updateType?: string, dependencyNames?: string }} update
 *   fetch-metadata's `package-ecosystem`, `update-type` (the highest in a group)
 *   and `dependency-names` (comma-separated).
 * @returns {{ merge: boolean, reason: string }}
 */
export function autoMergeDecision({ ecosystem = "", updateType = "", dependencyNames = "" }) {
  if (!AUTO_MERGE_ECOSYSTEMS.has(ecosystem)) {
    return { merge: false, reason: `ecosystem "${ecosystem}" is merged by hand` };
  }
  if (!AUTO_MERGE_UPDATE_TYPES.has(updateType)) {
    return { merge: false, reason: `update type "${updateType}" is merged by hand` };
  }
  const names = dependencyNames
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.length === 0) return { merge: false, reason: "no dependency names in the metadata" };
  const coupled = names.filter((name) => NEVER_AUTO_MERGE.has(name));
  if (coupled.length > 0) {
    return { merge: false, reason: `${coupled.join(", ")} must move with the Dockerfile` };
  }
  return {
    merge: true,
    reason: `${updateType.replace("version-update:", "")} of ${names.join(", ")}`,
  };
}

const FAILED = new Set([
  "FAILURE",
  "ERROR",
  "TIMED_OUT",
  "CANCELLED",
  "STARTUP_FAILURE",
  "ACTION_REQUIRED",
]);

/** The rollup entries for the required checks: CheckRun has `name`, StatusContext has `context`. */
function requiredEntries(pr) {
  return (pr.statusCheckRollup ?? []).filter((c) => REQUIRED_CHECKS.includes(c.name ?? c.context));
}

function isPending(entry) {
  if (entry.status !== undefined) return entry.status !== "COMPLETED";
  return entry.state === "PENDING" || entry.state === "EXPECTED";
}

function isFailed(entry) {
  return FAILED.has(entry.conclusion ?? entry.state ?? "");
}

const byAge = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));

/**
 * What the train does this hour, from `gh pr list --json` rows of open Dependabot
 * PRs. Only PRs with auto-merge armed count, oldest first.
 *
 *   wait      an armed PR's required checks are running. One PR at a time, since
 *             a merge would put any PR updated now behind main again.
 *   dispatch  an armed PR is blocked and its head carries no required check at
 *             all: an earlier update moved it but its checks never started.
 *   update    armed PRs behind main, in the order to try them: GitHub can refuse
 *             one (the workflow token may not touch workflow files), and the
 *             train then moves on to the next.
 *   none      nothing to do.
 *
 * @param {Array<Record<string, any>>} prs
 * @returns {{ action: "none" | "wait" | "dispatch" | "update", reason: string,
 *   prs: Array<{ number: number, headRefName: string, headRefOid: string }> }}
 */
export function pickNextToUpdate(prs) {
  const armed = prs.filter((pr) => pr.autoMergeRequest).sort(byAge);
  const running = armed.find((pr) => requiredEntries(pr).some(isPending));
  if (running) {
    return { action: "wait", reason: `#${running.number} is running its checks`, prs: [] };
  }
  const unchecked = armed.find(
    (pr) => pr.mergeStateStatus === "BLOCKED" && requiredEntries(pr).length === 0,
  );
  if (unchecked) {
    return {
      action: "dispatch",
      reason: `#${unchecked.number} carries no required check on its head`,
      prs: [unchecked],
    };
  }
  const behind = armed
    .filter((pr) => pr.mergeStateStatus === "BEHIND")
    .filter((pr) => !requiredEntries(pr).some(isFailed));
  if (behind.length === 0) return { action: "none", reason: "no armed PR is behind main", prs: [] };
  return {
    action: "update",
    reason: `${behind.map((pr) => `#${pr.number}`).join(", ")} behind main, oldest first`,
    prs: behind,
  };
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decide() {
  const decision = autoMergeDecision({
    ecosystem: process.env.ECOSYSTEM,
    updateType: process.env.UPDATE_TYPE,
    dependencyNames: process.env.DEPENDENCIES,
  });
  console.log(`${decision.merge ? "auto-merge" : "leave for a person"}: ${decision.reason}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `merge=${decision.merge}\n`);
  }
}

async function train() {
  const repo = process.env.REPO;
  if (!repo) throw new Error("REPO (owner/name) is not set");
  const fields =
    "number,headRefName,headRefOid,mergeStateStatus,autoMergeRequest,statusCheckRollup,createdAt";
  const prs = JSON.parse(
    gh([
      "pr",
      "list",
      "--repo",
      repo,
      "--author",
      "app/dependabot",
      "--state",
      "open",
      "--limit",
      "50",
      "--json",
      fields,
    ]),
  );
  const next = pickNextToUpdate(prs);
  console.log(`${next.action}: ${next.reason}`);
  if (next.action === "dispatch") {
    startRequiredWorkflows(repo, next.prs[0].headRefName);
    return;
  }
  if (next.action !== "update") return;
  for (const pr of next.prs) {
    try {
      await updateAndStartChecks(repo, pr);
      return;
    } catch (error) {
      // A warning, not a failure: a refusal is permanent for that PR, and a red
      // run every hour would only bury it. The PR stays open for a person.
      console.log(
        `::warning::#${pr.number} was not updated (${error.message}); trying the next one`,
      );
    }
  }
  console.log("::warning::no behind PR could be updated; they wait for a person");
}

function startRequiredWorkflows(repo, ref) {
  for (const workflow of REQUIRED_WORKFLOWS) {
    gh(["workflow", "run", workflow, "--repo", repo, "--ref", ref]);
  }
  console.log(`started ${REQUIRED_WORKFLOWS.join(", ")} on ${ref}`);
}

async function updateAndStartChecks(repo, { number, headRefName, headRefOid }) {
  gh([
    "api",
    "-X",
    "PUT",
    `repos/${repo}/pulls/${number}/update-branch`,
    "-f",
    `expected_head_sha=${headRefOid}`,
  ]);
  // The update is asynchronous: start the checks only once the branch has moved,
  // or they would run on the old head.
  for (let i = 0; i < 24; i += 1) {
    await sleep(5000);
    const head = gh([
      "pr",
      "view",
      String(number),
      "--repo",
      repo,
      "--json",
      "headRefOid",
      "--jq",
      ".headRefOid",
    ]).trim();
    if (head && head !== headRefOid) {
      console.log(`#${number} updated to ${head.slice(0, 7)}`);
      startRequiredWorkflows(repo, headRefName);
      return;
    }
  }
  throw new Error("the branch did not move within two minutes of the update request");
}

/* v8 ignore next 9 -- CLI entry point; the pure functions above are what the tests cover */
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const command = process.argv[2];
  if (command === "decide") decide();
  else if (command === "train") await train();
  else {
    console.error("usage: dependabot-automerge.mjs decide|train");
    process.exit(2);
  }
}
