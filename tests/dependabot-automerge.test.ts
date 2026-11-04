import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_CHECKS,
  REQUIRED_WORKFLOWS,
  autoMergeDecision,
  pickNextToUpdate,
} from "../scripts/dependabot-automerge.mjs";

/**
 * Which Dependabot PRs merge themselves (scripts/dependabot-automerge.mjs and the
 * two workflows that run it). In October 2026 five security PRs sat unmerged for
 * two weeks while production ran a vulnerable Next.js: nothing merged a
 * Dependabot PR, and each was red on the others' advisories. These tests pin the
 * rule and the wiring the automatic path depends on.
 */
const read = (rel: string): string =>
  readFileSync(join(__dirname, "..", rel), "utf8").replace(/\r\n/g, "\n");

describe("autoMergeDecision", () => {
  const npm = (updateType: string, dependencyNames: string) =>
    autoMergeDecision({ ecosystem: "npm_and_yarn", updateType, dependencyNames });

  it("merges npm patch and minor updates, grouped or single", () => {
    expect(npm("version-update:semver-patch", "zod").merge).toBe(true);
    expect(npm("version-update:semver-minor", "next, zod, fast-uri").merge).toBe(true);
  });

  it("merges GitHub Actions patch and minor updates", () => {
    const d = autoMergeDecision({
      ecosystem: "github_actions",
      updateType: "version-update:semver-minor",
      dependencyNames: "github/codeql-action",
    });
    expect(d).toEqual({ merge: true, reason: "semver-minor of github/codeql-action" });
  });

  it("leaves majors for a person, security fixes included", () => {
    expect(npm("version-update:semver-major", "nodemailer").merge).toBe(false);
  });

  it("leaves Docker and Compose images for a person (a postgres major is a data migration)", () => {
    for (const ecosystem of ["docker", "docker_compose"]) {
      const d = autoMergeDecision({
        ecosystem,
        updateType: "version-update:semver-patch",
        dependencyNames: "postgres",
      });
      expect(d.merge).toBe(false);
      expect(d.reason).toContain(ecosystem);
    }
  });

  it("never merges playwright alone: it must move with the Dockerfile's image tag", () => {
    const d = npm("version-update:semver-minor", "next, playwright, zod");
    expect(d).toEqual({ merge: false, reason: "playwright must move with the Dockerfile" });
    expect(npm("version-update:semver-patch", "@playwright/test").merge).toBe(false);
    // A name that only contains the word is not the coupled package.
    expect(npm("version-update:semver-patch", "playwright-core-ish").merge).toBe(true);
  });

  it("merges nothing when the metadata is missing", () => {
    expect(autoMergeDecision({}).merge).toBe(false);
    expect(npm("", "zod").merge).toBe(false);
    expect(npm("version-update:semver-patch", " , ").merge).toBe(false);
  });
});

describe("pickNextToUpdate", () => {
  const passed = REQUIRED_CHECKS.map((name) => ({
    name,
    status: "COMPLETED",
    conclusion: "SUCCESS",
  }));
  const pr = (number: number, over: Record<string, unknown> = {}) => ({
    number,
    headRefName: `dependabot/npm_and_yarn/pr-${number}`,
    headRefOid: `sha${number}`,
    mergeStateStatus: "BEHIND",
    autoMergeRequest: { enabledAt: "2026-11-04T00:00:00Z" },
    statusCheckRollup: passed,
    createdAt: `2026-11-0${number}T00:00:00Z`,
    ...over,
  });

  const numbers = (next: { prs: Array<{ number: number }> }) => next.prs.map((p) => p.number);

  it("lists the armed PRs behind main oldest first, to try in that order", () => {
    const next = pickNextToUpdate([pr(3), pr(1), pr(2)]);
    expect(next.action).toBe("update");
    expect(numbers(next)).toEqual([1, 2, 3]);
    expect(next.reason).toBe("#1, #2, #3 behind main, oldest first");
  });

  it("waits while an armed PR's required checks run, so it does not update two at once", () => {
    const running = pr(2, {
      mergeStateStatus: "BLOCKED",
      statusCheckRollup: [{ name: REQUIRED_CHECKS[0], status: "IN_PROGRESS", conclusion: "" }],
    });
    expect(pickNextToUpdate([pr(1), running])).toEqual({
      action: "wait",
      reason: "#2 is running its checks",
      prs: [],
    });
    const pendingStatus = pr(3, {
      statusCheckRollup: [{ context: REQUIRED_CHECKS[1], state: "PENDING" }],
    });
    expect(pickNextToUpdate([pendingStatus]).action).toBe("wait");
  });

  it("ignores PRs that are not armed, not behind, or failing a required check", () => {
    const failing = pr(1, {
      statusCheckRollup: [{ name: REQUIRED_CHECKS[1], status: "COMPLETED", conclusion: "FAILURE" }],
    });
    const notArmed = pr(2, { autoMergeRequest: null });
    const clean = pr(3, { mergeStateStatus: "CLEAN" });
    expect(pickNextToUpdate([failing, notArmed, clean])).toEqual({
      action: "none",
      reason: "no armed PR is behind main",
      prs: [],
    });
  });

  it("restarts the checks of an armed PR left blocked with none on its head", () => {
    // An earlier update moved the branch, but its checks never started.
    const stranded = pr(2, { mergeStateStatus: "BLOCKED", statusCheckRollup: [] });
    const next = pickNextToUpdate([pr(1), stranded]);
    expect(next).toEqual({
      action: "dispatch",
      reason: "#2 carries no required check on its head",
      prs: [stranded],
    });
    // Checks that only miss the non-required ones do not count as stranded.
    const audited = pr(3, { mergeStateStatus: "BLOCKED", statusCheckRollup: passed });
    expect(pickNextToUpdate([audited]).action).toBe("none");
    // Nor does a PR that is not armed.
    const unarmed = pr(4, {
      mergeStateStatus: "BLOCKED",
      statusCheckRollup: [],
      autoMergeRequest: null,
    });
    expect(pickNextToUpdate([unarmed]).action).toBe("none");
  });

  it("does not let a non-required check (the Audit) hold a PR back or keep the train waiting", () => {
    const auditRed = pr(1, {
      statusCheckRollup: [
        ...passed,
        { name: "npm audit", status: "COMPLETED", conclusion: "FAILURE" },
        { context: "CodeRabbit", state: "PENDING" },
      ],
    });
    expect(numbers(pickNextToUpdate([auditRed]))).toEqual([1]);
  });

  it("does nothing with no Dependabot PRs open", () => {
    expect(pickNextToUpdate([]).action).toBe("none");
  });
});

describe("the wiring the automatic path depends on", () => {
  it("REQUIRED_CHECKS are the job names of the required workflows, in order", () => {
    const names = REQUIRED_WORKFLOWS.map((wf: string) => {
      const match = read(`.github/workflows/${wf}`).match(/^ {4}name: (.+)$/m);
      return match?.[1];
    });
    expect(names).toEqual(REQUIRED_CHECKS);
  });

  it("each required workflow can be started by dispatch and runs with a read-only token", () => {
    for (const wf of REQUIRED_WORKFLOWS) {
      const yml = read(`.github/workflows/${wf}`);
      expect(yml, wf).toMatch(/^ {2}workflow_dispatch:$/m);
      expect(yml, wf).toMatch(/^permissions:\n {2}contents: read$/m);
      expect(yml, wf).not.toContain("secrets.");
    }
  });

  it("security fixes come as one grouped npm PR", () => {
    const yml = read(".github/dependabot.yml");
    const npmEntry = yml.slice(
      yml.indexOf('package-ecosystem: "npm"'),
      yml.indexOf('package-ecosystem: "github-actions"'),
    );
    expect(npmEntry).toMatch(
      / {6}security:\n {8}applies-to: security-updates\n {8}patterns:\n {10}- "\*"/,
    );
  });

  it("both npm groups leave the playwright pair out, so it cannot hold a group back", () => {
    const yml = read(".github/dependabot.yml");
    const npmEntry = yml.slice(
      yml.indexOf('package-ecosystem: "npm"'),
      yml.indexOf('package-ecosystem: "github-actions"'),
    );
    const groups = npmEntry.split(/^ {6}(?=[a-z-]+:$)/m).slice(1);
    expect(groups.map((g) => g.split(":")[0])).toEqual(["security", "minor-and-patch"]);
    for (const group of groups) {
      expect(group).toMatch(/exclude-patterns:\n {10}- "playwright"\n {10}- "@playwright\/test"/);
    }
  });

  describe("dependabot-auto-merge.yml", () => {
    const yml = read(".github/workflows/dependabot-auto-merge.yml");
    const decideJob = yml.slice(yml.indexOf("\n  decide:"), yml.indexOf("\n  arm:"));
    const armJob = yml.slice(yml.indexOf("\n  arm:"));

    it("decides in a read-only job, from the base branch's rule, only for Dependabot's PRs", () => {
      expect(decideJob).toContain("if: github.event.pull_request.user.login == 'dependabot[bot]'");
      expect(decideJob).toContain("ref: ${{ github.event.pull_request.base.sha }}");
      expect(decideJob).toContain("node scripts/dependabot-automerge.mjs decide");
      expect(decideJob).not.toContain("permissions:");
      expect(yml).toMatch(/^permissions:\n {2}contents: read$/m);
    });

    it("holds the write token in a job that runs no action code, only gh", () => {
      expect(armJob).toContain("needs: decide");
      expect(armJob).toContain("contents: write");
      expect(armJob).not.toMatch(/^\s*(- )?uses:/m);
    });

    it("arms a squash merge when the rule says so, and disarms otherwise", () => {
      expect(armJob).toContain("if: needs.decide.outputs.merge == 'true'");
      expect(armJob).toContain('gh pr merge --auto --squash "$PR_URL"');
      expect(armJob).toContain("if: needs.decide.outputs.merge != 'true'");
      expect(armJob).toContain('gh pr merge --disable-auto "$PR_URL"');
    });
  });

  it("the train runs the train command hourly and may start workflows", () => {
    const yml = read(".github/workflows/dependabot-train.yml");
    expect(yml).toMatch(/cron: "\d+ \* \* \* \*"/);
    expect(yml).toContain("actions: write");
    expect(yml).toContain("node scripts/dependabot-automerge.mjs train");
  });

  it("both new workflows pin every action to a full commit SHA", () => {
    for (const wf of ["dependabot-auto-merge.yml", "dependabot-train.yml"]) {
      const uses = [...read(`.github/workflows/${wf}`).matchAll(/uses: (\S+)/g)].map((m) => m[1]);
      expect(uses.length, wf).toBeGreaterThan(0);
      for (const ref of uses) expect(ref, `${wf}: ${ref}`).toMatch(/@[0-9a-f]{40}$/);
    }
  });
});
