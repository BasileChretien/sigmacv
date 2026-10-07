import { describe, expect, it } from "vitest";
import { gitBashCandidates } from "./helpers/bashScript";

/**
 * Where `tests/helpers/bashScript.ts` looks for Git for Windows' bash. The lookup
 * only ever runs on Windows, and CI is Linux, so the part that can be wrong is
 * kept pure and tested here on every platform.
 */
describe("gitBashCandidates", () => {
  it("takes the Git root from `git --exec-path`, wherever PATH found git.exe", () => {
    // Scoop: PATH holds only <scoop>\shims\git.exe; Git itself lives under apps\git\current.
    const [first] = gitBashCandidates(
      "C:/Tools/scoop/apps/git/current/mingw64/libexec/git-core",
      {},
    );
    expect(first).toBe(String.raw`C:\Tools\scoop\apps\git\current\bin\bash.exe`);
  });

  it("reads a standard install the same way", () => {
    const [first] = gitBashCandidates("C:/Program Files/Git/mingw64/libexec/git-core", {});
    expect(first).toBe(String.raw`C:\Program Files\Git\bin\bash.exe`);
  });

  it("falls back to the default install locations when git did not answer", () => {
    expect(
      gitBashCandidates(null, {
        ProgramFiles: String.raw`C:\Program Files`,
        "ProgramFiles(x86)": String.raw`C:\Program Files (x86)`,
        LOCALAPPDATA: String.raw`C:\Home\AppData\Local`,
      }),
    ).toEqual([
      String.raw`C:\Program Files\Git\bin\bash.exe`,
      String.raw`C:\Program Files (x86)\Git\bin\bash.exe`,
      String.raw`C:\Home\AppData\Local\Programs\Git\bin\bash.exe`,
    ]);
  });

  it("asks git first and keeps the default locations behind it", () => {
    const candidates = gitBashCandidates("D:/Git/mingw64/libexec/git-core", {
      ProgramFiles: String.raw`C:\Program Files`,
    });
    expect(candidates).toEqual([
      String.raw`D:\Git\bin\bash.exe`,
      String.raw`C:\Program Files\Git\bin\bash.exe`,
    ]);
  });

  it("offers nothing when it knows nothing, so the callers skip", () => {
    expect(gitBashCandidates(null, {})).toEqual([]);
  });
});
