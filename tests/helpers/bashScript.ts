import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, join, win32 } from "node:path";

/**
 * Runs the repo's bash scripts (`scripts/*.sh`) from a test.
 *
 * WHICH bash matters on Windows. A bare `bash` resolves by PATH order there, and
 * from PowerShell or cmd the first hit is `C:\Windows\System32\bash.exe`, the WSL
 * launcher. It answers `bash --version`, so a probe says "available" — and then it
 * runs the script inside a Linux VM that cannot open a `C:\…` path (the backslashes
 * are eaten: "C:R_gitSigmaCVscripts…: No such file or directory") and is not handed
 * the Windows environment, so `BACKUP_DIR` and friends never arrive. When the VM
 * does not start, the same probe throws and the suite skips. From a Git Bash
 * terminal the MSYS bash comes first on PATH and everything passes. One checkout,
 * three outcomes, decided by which terminal ran the tests.
 *
 * So on Windows the launcher is never asked. The bash that ships with Git for
 * Windows is located by asking git where it lives and run by absolute path: its
 * `bin\bash.exe` wrapper understands Windows paths, inherits the environment, and
 * puts the MSYS coreutils on PATH (`usr\bin\bash.exe` alone does not). Where that
 * finds no bash the result is `null`, and the callers skip. Everywhere else it is
 * plain `bash`, as before.
 */
export const bash: string | null = resolveBash();

function resolveBash(): string | null {
  const candidate = process.platform === "win32" ? gitBashOnWindows() : "bash";
  if (!candidate) return null;
  try {
    execFileSync(candidate, ["--version"], { stdio: "ignore" });
    return candidate;
  } catch {
    return null;
  }
}

function gitBashOnWindows(): string | null {
  return gitBashCandidates(gitExecPath(), process.env).find((exe) => existsSync(exe)) ?? null;
}

/** What `git --exec-path` prints, or null when no git answers. */
function gitExecPath(): string | null {
  try {
    const out = execFileSync("git", ["--exec-path"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Where Git for Windows' bash can be, best guess first.
 *
 * `execPath` is `<root>\mingw64\libexec\git-core` for whichever git answered,
 * so the root is three levels up. Asking git, instead of reading the directory
 * PATH found `git.exe` in, is what covers an install reached through a shim
 * directory (Scoop's `shims`): the shim says nothing about where Git lives.
 * The default install locations stay behind it for a git that is not on PATH.
 *
 * Pure, and on `path.win32`, so it is tested on every platform (CI is Linux).
 */
export function gitBashCandidates(
  execPath: string | null,
  env: Record<string, string | undefined>,
): string[] {
  const roots = [
    execPath && win32.join(execPath, "..", "..", ".."),
    env.ProgramFiles && win32.join(env.ProgramFiles, "Git"),
    env["ProgramFiles(x86)"] && win32.join(env["ProgramFiles(x86)"], "Git"),
    env.LOCALAPPDATA && win32.join(env.LOCALAPPDATA, "Programs", "Git"),
  ];
  return roots
    .filter((root): root is string => Boolean(root))
    .map((root) => win32.join(root, "bin", "bash.exe"));
}

export interface ScriptResult {
  code: number;
  out: string;
}

/** Run a bash script and return its exit code plus combined output. */
export function runScript(script: string, env: Record<string, string>): ScriptResult {
  if (!bash) throw new Error("no usable bash: guard the suite with describe.skipIf(bash === null)");
  try {
    const out = execFileSync(bash, [script], {
      env: { ...process.env, ...env },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

/** Whether the bash that runs the scripts finds `command` — the same lookup a script's own `command -v` does. */
export function bashFinds(command: string): boolean {
  if (!bash) return false;
  try {
    execFileSync(bash, ["-c", 'command -v "$1"', "bash", command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const CALLS_SUFFIX = ".calls";

/**
 * Put a stand-in for `command` in `dir` and return the environment that makes it
 * the first one found. The stand-in satisfies a script's "is it installed" check
 * and fails loudly if it is ever executed, so a test of the guards that come
 * before the real call needs no installed tool and can never reach a real one.
 * Each execution is also written down, for `stubCalls`: a script may silence
 * the call's output (a cleanup trap does), and the record is then the only trace.
 */
export function stubCommand(dir: string, command: string): Record<string, string> {
  writeFileSync(
    join(dir, command),
    [
      "#!/bin/sh",
      `echo "$*" >> "$0${CALLS_SUFFIX}"`,
      `echo "stub ${command} was executed with: $*" >&2`,
      "exit 97",
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
  // Windows spells the variable `Path`; a second, differently-cased key would not replace it.
  const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  return { [pathKey]: `${dir}${delimiter}${process.env[pathKey] ?? ""}` };
}

/** The argument lists the stand-in for `command` in `dir` was executed with, in order. */
export function stubCalls(dir: string, command: string): string[] {
  const record = join(dir, `${command}${CALLS_SUFFIX}`);
  if (!existsSync(record)) return [];
  return readFileSync(record, "utf8").split("\n").filter(Boolean);
}
