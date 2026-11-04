import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { bash, bashFinds, runScript, stubCalls, stubCommand } from "./helpers/bashScript";

/**
 * `scripts/auto-deploy.sh` ships main to production with no person watching, so
 * what it refuses to do matters as much as what it does. Each test builds a
 * throwaway "GitHub" (a bare repository), a developer clone that moves main, and
 * a "server" clone holding a copy of the script, then runs it with stand-ins for
 * the three things it reaches out to: deploy.sh (AUTO_DEPLOY_CMD), the email
 * (AUTO_DEPLOY_NOTIFY_CMD) and curl (first on PATH). The stand-ins write down
 * what they were asked, and nothing real is built, mailed or fetched.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "auto-deploy.sh");

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]): string =>
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.org", ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

function writeStub(dir: string, name: string, body: string): void {
  writeFileSync(join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

interface World {
  dev: string;
  server: string;
  logs: string;
  /** Commit `content` to `file` in the developer clone and push it to main. */
  push: (file: string, content: string, message: string) => string;
  run: (env?: Record<string, string>) => { code: number; out: string };
  /** Run with the script's own mailer, behind a stand-in `docker`; returns what docker was asked. */
  runWithMailer: () => { code: number; out: string; docker: string };
  state: (name: string) => string | null;
  notifications: () => string[];
  bodies: () => string;
  deploys: () => string[];
  curls: () => string[];
}

function world(): World {
  const root = mkdtempSync(join(tmpdir(), "sigmacv-autodeploy-"));
  dirs.push(root);
  const origin = join(root, "origin.git");
  const dev = join(root, "dev");
  const server = join(root, "server");
  const logs = join(root, "logs");
  const bin = join(root, "bin");
  for (const d of [logs, bin]) mkdirSync(d);

  git(root, "init", "--quiet", "--bare", "--initial-branch=main", origin);
  git(root, "clone", "--quiet", origin, dev);
  const push = (file: string, content: string, message: string): string => {
    writeFileSync(join(dev, file), content);
    git(dev, "add", file);
    git(dev, "commit", "--quiet", "-m", message);
    git(dev, "push", "--quiet", "origin", "HEAD:main");
    return git(dev, "rev-parse", "HEAD");
  };
  push("docker-compose.yml", "services:\n  postgres:\n    image: postgres:16-alpine\n", "first");
  git(root, "clone", "--quiet", origin, server);

  // The script under test, untracked in the server checkout as on the real one
  // it is tracked; untracked keeps `git status --untracked-files=no` clean.
  mkdirSync(join(server, "scripts"));
  copyFileSync(script, join(server, "scripts", "auto-deploy.sh"));
  writeFileSync(
    join(server, ".env"),
    'AUTH_URL="https://sigmacv.test/"\nOPENALEX_MAILTO=ops@example.org\n',
  );

  // deploy.sh stand-in: records the commit, moves the checkout like the real one.
  writeStub(
    bin,
    "deploy-stub",
    [
      `echo "$DEPLOY_SHA" >> "${logs}/deploy.calls"`,
      `echo "building..."`,
      `[ -z "\${STUB_DEPLOY_SLEEP:-}" ] || sleep "$STUB_DEPLOY_SLEEP"`,
      `[ "\${STUB_DEPLOY_EXIT:-0}" = 0 ] || { echo "build exploded"; exit "$STUB_DEPLOY_EXIT"; }`,
      `git merge --ff-only --quiet "$DEPLOY_SHA"`,
    ].join("\n"),
  );
  writeStub(
    bin,
    "notify-stub",
    [
      `printf '%s\\n' "$1" >> "${logs}/notify.calls"`,
      `printf '%s\\n----\\n' "$2" >> "${logs}/notify.bodies"`,
    ].join("\n"),
  );
  writeStub(
    bin,
    "curl",
    [`echo "$*" >> "${logs}/curl.calls"`, `exit "\${STUB_CURL_EXIT:-0}"`].join("\n"),
  );

  const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
  const lines = (file: string): string[] =>
    existsSync(join(logs, file))
      ? readFileSync(join(logs, file), "utf8").split("\n").filter(Boolean)
      : [];

  return {
    dev,
    server,
    logs,
    push,
    run: (env = {}) =>
      runScript(join(server, "scripts", "auto-deploy.sh"), {
        [pathKey]: `${bin}${delimiter}${process.env[pathKey] ?? ""}`,
        AUTO_DEPLOY_CMD: join(bin, "deploy-stub"),
        AUTO_DEPLOY_NOTIFY_CMD: join(bin, "notify-stub"),
        AUTO_DEPLOY_CURL: join(bin, "curl"),
        AUTO_DEPLOY_HEALTH_TRIES: "2",
        AUTO_DEPLOY_HEALTH_WAIT: "0",
        ...env,
      }),
    runWithMailer: () => {
      const dockerDir = join(root, "docker-bin");
      mkdirSync(dockerDir, { recursive: true });
      const r = runScript(join(server, "scripts", "auto-deploy.sh"), {
        ...stubCommand(dockerDir, "docker"),
        AUTO_DEPLOY_CMD: join(bin, "deploy-stub"),
        AUTO_DEPLOY_CURL: join(bin, "curl"),
        AUTO_DEPLOY_HEALTH_TRIES: "1",
        AUTO_DEPLOY_HEALTH_WAIT: "0",
      });
      // One call is recorded over several lines: the body and the mail script hold newlines.
      return { ...r, docker: stubCalls(dockerDir, "docker").join("\n") };
    },
    state: (name) => {
      const f = join(server, ".deploy-state", name);
      return existsSync(f) ? readFileSync(f, "utf8").trim() : null;
    },
    notifications: () => lines("notify.calls"),
    bodies: () =>
      existsSync(join(logs, "notify.bodies"))
        ? readFileSync(join(logs, "notify.bodies"), "utf8")
        : "",
    deploys: () => lines("deploy.calls"),
    curls: () => lines("curl.calls"),
  };
}

// Every test spawns dozens of git and bash processes: about 5 s on Linux, and
// several times that on a busy Windows machine. Hence the longer limit.
describe.skipIf(bash === null)("scripts/auto-deploy.sh", { timeout: 120_000 }, () => {
  it("does nothing, silently, when main is what is deployed (first run records the checkout)", () => {
    const w = world();
    const head = git(w.server, "rev-parse", "HEAD");
    const r = w.run();
    expect(r).toEqual({ code: 0, out: "" });
    expect(w.state("deployed")).toBe(head);
    expect(w.deploys()).toEqual([]);
    expect(w.notifications()).toEqual([]);
  });

  it("deploys the exact commit main moved to, checks the site and emails the result", () => {
    const w = world();
    w.run();
    const target = w.push("app.txt", "v2\n", "feat: something new");
    const r = w.run();
    expect(r.code).toBe(0);
    expect(r.out).toContain(`deploying ${target.slice(0, 7)}`);
    expect(w.deploys()).toEqual([target]);
    expect(w.state("deployed")).toBe(target);
    expect(w.curls()).toEqual(["-fsS --max-time 10 -o /dev/null https://sigmacv.test/api/health"]);
    expect(w.notifications()).toEqual([`SigmaCV: deployed ${target.slice(0, 7)}`]);
    expect(w.bodies()).toContain("feat: something new");
    expect(w.bodies()).toContain("Health: ok");
    // The next tick has nothing to do.
    expect(w.run()).toEqual({ code: 0, out: "" });
    expect(w.deploys()).toHaveLength(1);
  });

  it("on a failed deploy, records it, emails once with the output, and does not retry that commit", () => {
    const w = world();
    w.run();
    const before = w.state("deployed");
    const target = w.push("app.txt", "broken\n", "feat: breaks the build");
    const r = w.run({ STUB_DEPLOY_EXIT: "3" });
    expect(r.code).toBe(1);
    expect(w.state("failed")).toBe(target);
    expect(w.state("deployed")).toBe(before);
    expect(w.notifications()).toEqual([`SigmaCV: deploy of ${target.slice(0, 7)} failed`]);
    expect(w.bodies()).toContain("build exploded");
    expect(w.curls()).toEqual([]);

    expect(w.run({ STUB_DEPLOY_EXIT: "3" })).toEqual({ code: 0, out: "" });
    expect(w.deploys()).toEqual([target]);
    expect(w.notifications()).toHaveLength(1);
  });

  it("tries again once main moves past a failed commit, and clears the failure", () => {
    const w = world();
    w.run();
    w.push("app.txt", "broken\n", "feat: breaks the build");
    w.run({ STUB_DEPLOY_EXIT: "3" });
    const fix = w.push("app.txt", "fixed\n", "fix: the build");
    const r = w.run();
    expect(r.code).toBe(0);
    expect(w.deploys().at(-1)).toBe(fix);
    expect(w.state("deployed")).toBe(fix);
    expect(w.state("failed")).toBeNull();
    expect(w.bodies()).toContain("fix: the build");
  });

  it("deploys nothing while paused", () => {
    const w = world();
    w.run();
    w.push("app.txt", "v2\n", "feat: waits");
    writeFileSync(join(w.server, ".deploy-state", "paused"), "");
    expect(w.run()).toEqual({ code: 0, out: "" });
    expect(w.deploys()).toEqual([]);
  });

  const databases =
    "services:\n  postgres:\n    image: postgres:16-alpine\n  events:\n    image: clickhouse/clickhouse-server:24.12-alpine\n";
  // The first two change a line in place. The rest only ADD a service, so the
  // one image line in the diff is the form under test: the plain pattern the
  // guard started with matches none of them.
  const added = (image: string) => `${databases}  extra:\n    image: ${image}\n`;
  it.each([
    ["a postgres", databases.replace("postgres:16-alpine", "postgres:17-alpine")],
    ["a clickhouse", databases.replace("24.12-alpine", "25.3-alpine")],
    ["a registry-qualified postgres", added("docker.io/library/postgres:17-alpine")],
    ["a quoted, registry-qualified postgres", added('"docker.io/library/postgres:17-alpine"')],
    ["a plausible", added("ghcr.io/plausible/community-edition:v3.3.0")],
    ["a variable-given", added("${PG_IMAGE:-postgres:16-alpine}")],
  ])("holds %s image change for a person, and says so once", (_label, compose) => {
    const w = world();
    w.push("docker-compose.yml", databases, "chore: both databases");
    git(w.server, "pull", "--quiet", "--ff-only");
    w.run();
    const target = w.push("docker-compose.yml", compose, "chore: bump db");
    const r = w.run();
    expect(r.code).toBe(0);
    expect(r.out).toContain("data migration");
    expect(w.deploys()).toEqual([]);
    expect(w.state("failed")).toBe(target);
    expect(w.notifications()).toEqual([`SigmaCV: ${target.slice(0, 7)} needs a hand-run deploy`]);
    w.run();
    expect(w.notifications()).toHaveLength(1);
  });

  it("still deploys a compose change that leaves the database images alone", () => {
    const w = world();
    w.run();
    const target = w.push(
      "docker-compose.yml",
      "services:\n  postgres:\n    image: postgres:16-alpine\n  resync-cron:\n    image: curlimages/curl:8.23.0\n",
      "chore: bump curl",
    );
    w.run();
    expect(w.deploys()).toEqual([target]);
  });

  it("holds when main is not a fast-forward of the server's checkout", () => {
    const w = world();
    w.run();
    git(w.server, "commit", "--quiet", "--allow-empty", "-m", "made on the server");
    w.push("app.txt", "v2\n", "feat: elsewhere");
    const r = w.run();
    expect(r.out).toContain("not a fast-forward");
    expect(w.deploys()).toEqual([]);
  });

  it("holds when the server's checkout has uncommitted changes to tracked files", () => {
    const w = world();
    w.run();
    writeFileSync(join(w.server, "docker-compose.yml"), "edited by hand\n");
    w.push("app.txt", "v2\n", "feat: elsewhere");
    expect(w.run().out).toContain("uncommitted changes");
    expect(w.deploys()).toEqual([]);
  });

  it("holds, rather than comparing against nothing, when the recorded deployed commit is unknown", () => {
    const w = world();
    w.run();
    writeFileSync(
      join(w.server, ".deploy-state", "deployed"),
      "0123456789abcdef0123456789abcdef01234567\n",
    );
    w.push(
      "docker-compose.yml",
      "services:\n  postgres:\n    image: postgres:17-alpine\n",
      "chore: bump db",
    );
    const r = w.run();
    expect(r.out).toContain("is not in the server's checkout");
    expect(w.deploys()).toEqual([]);
  });

  // `timeout` is GNU coreutils: on Linux and in Git Bash, not on a bare macOS.
  it.skipIf(!bashFinds("timeout"))(
    "stops a deploy that runs past its time limit, and reports it as failed",
    () => {
      const w = world();
      w.run();
      const before = w.state("deployed");
      const target = w.push("app.txt", "v2\n", "feat: hangs the build");
      const r = w.run({ AUTO_DEPLOY_TIMEOUT: "1", STUB_DEPLOY_SLEEP: "30" });
      expect(r.code).toBe(1);
      expect(r.out).toContain("it was stopped after running for 1 s");
      expect(w.state("failed")).toBe(target);
      expect(w.state("deployed")).toBe(before);
      expect(w.notifications()).toEqual([`SigmaCV: deploy of ${target.slice(0, 7)} failed`]);
    },
  );

  it("does not blame the time limit for a deploy that exits 124 or 137 by itself", () => {
    for (const status of ["124", "137"]) {
      const w = world();
      w.run();
      w.push("app.txt", `v${status}\n`, "feat: dies quickly");
      const r = w.run({ AUTO_DEPLOY_TIMEOUT: "999", STUB_DEPLOY_EXIT: status });
      expect(r.code, status).toBe(1);
      expect(r.out, status).toContain(`deploy.sh exited with status ${status}`);
      expect(r.out, status).not.toContain("stopped after");
    }
  });

  it("logs a failed fetch with a timestamp and tries again at the next run", () => {
    const w = world();
    w.run();
    git(w.server, "remote", "set-url", "origin", join(w.logs, "no-such-repository.git"));
    const r = w.run();
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ \[auto-deploy\] git fetch failed/);
    expect(w.notifications()).toEqual([]);
  });

  it("reports a deploy whose site does not answer, and exits non-zero", () => {
    const w = world();
    w.run();
    const target = w.push("app.txt", "v2\n", "feat: something");
    const r = w.run({ STUB_CURL_EXIT: "22" });
    expect(r.code).toBe(1);
    expect(w.state("deployed")).toBe(target);
    expect(w.curls()).toHaveLength(2);
    expect(w.notifications()).toEqual([
      `SigmaCV: deployed ${target.slice(0, 7)}, but the site's health check failed`,
    ]);
  });

  it.each([
    [
      "OPENALEX_MAILTO",
      "AUTH_URL=https://sigmacv.test\nOPENALEX_MAILTO=ops@example.org\n",
      "ops@example.org",
    ],
    [
      "DEPLOY_NOTIFY_EMAIL before OPENALEX_MAILTO",
      "OPENALEX_MAILTO=ops@example.org\nDEPLOY_NOTIFY_EMAIL='deploys@example.org'\n",
      "deploys@example.org",
    ],
  ])("emails through the app container, to %s", (_label, env, to) => {
    const w = world();
    writeFileSync(join(w.server, ".env"), env);
    w.run();
    w.push("app.txt", "v2\n", "feat: mail me");
    const r = w.runWithMailer();
    expect(r.docker.match(/compose exec -T/g)).toHaveLength(1);
    expect(r.docker).toContain(
      `compose exec -T -e NOTIFY_TO=${to} -e NOTIFY_SUBJECT=SigmaCV: deployed`,
    );
    expect(r.docker).toContain("app node --input-type=module -e");
    expect(r.docker).toContain("feat: mail me");
    // The stand-in docker exits 97: the failure is logged, and the deploy stands.
    expect(r.out).toContain("the email could not be sent");
    expect(r.code).toBe(0);
  });

  it("logs, without emailing, when no address is configured", () => {
    const w = world();
    writeFileSync(join(w.server, ".env"), "AUTH_URL=https://sigmacv.test\n");
    w.run();
    w.push("app.txt", "v2\n", "feat: nobody to tell");
    const r = w.runWithMailer();
    expect(r.out).toContain("not emailed (no DEPLOY_NOTIFY_EMAIL or OPENALEX_MAILTO in .env)");
    expect(r.docker).toBe("");
    expect(r.code).toBe(0);
  });
});

describe("scripts/deploy.sh records what it shipped and never overlaps a deploy", () => {
  const commands = readFileSync(join(repoRoot, "scripts", "deploy.sh"), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");

  it("deploys DEPLOY_SHA when given, by fast-forward only", () => {
    expect(commands).toContain('git merge --ff-only "$DEPLOY_SHA"');
    expect(commands).toContain("git pull --ff-only");
  });

  it("takes the shared lock before touching the checkout", () => {
    expect(commands.indexOf("flock -w 1800 9")).toBeGreaterThan(-1);
    expect(commands.indexOf("flock -w 1800 9")).toBeLessThan(
      commands.indexOf("git merge --ff-only"),
    );
  });

  it("writes the deployed commit last, after the swap", () => {
    const write = commands.indexOf('git rev-parse HEAD >"$STATE_DIR/deployed"');
    expect(write).toBeGreaterThan(commands.indexOf("up -d"));
    expect(write).toBeGreaterThan(commands.indexOf("caddy reload"));
  });

  it("keeps the state directory out of git and out of the image's build context", () => {
    expect(readFileSync(join(repoRoot, ".gitignore"), "utf8")).toMatch(/^\.deploy-state\/$/m);
    expect(readFileSync(join(repoRoot, ".dockerignore"), "utf8")).toMatch(/^\.deploy-state$/m);
  });
});
