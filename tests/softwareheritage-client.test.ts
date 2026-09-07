import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSoftwareHeritageArchival, isRepositoryUrl } from "@/lib/softwareheritage/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, text: async () => JSON.stringify(body) } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("isRepositoryUrl", () => {
  it("accepts GitHub/GitLab/Codeberg/Bitbucket https URLs", () => {
    expect(isRepositoryUrl("https://github.com/user/repo")).toBe(true);
    expect(isRepositoryUrl("https://www.github.com/user/repo")).toBe(true);
    expect(isRepositoryUrl("https://gitlab.com/user/repo")).toBe(true);
    expect(isRepositoryUrl("https://codeberg.org/user/repo")).toBe(true);
    expect(isRepositoryUrl("http://bitbucket.org/user/repo")).toBe(true);
  });

  it("rejects other hosts, malformed URLs, and undefined", () => {
    expect(isRepositoryUrl("https://zenodo.org/record/1")).toBe(false);
    expect(isRepositoryUrl("not a url")).toBe(false);
    expect(isRepositoryUrl(undefined)).toBe(false);
    expect(isRepositoryUrl("")).toBe(false);
    expect(isRepositoryUrl("ftp://github.com/user/repo")).toBe(false);
  });
});

describe("fetchSoftwareHeritageArchival", () => {
  it("parses the documented shape: snapshot + date", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ snapshot: "a".repeat(40), date: "2024-01-15T00:00:00Z" })),
    );
    const result = await fetchSoftwareHeritageArchival("https://github.com/user/repo");
    expect(result?.swhid).toBe(`swh:1:snp:${"a".repeat(40)}`);
    expect(result?.archivedAt).toBe("2024-01-15T00:00:00.000Z");
  });

  it("tolerates snapshot_id / target alternate field names", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ snapshot_id: "b".repeat(40) })),
    );
    const result = await fetchSoftwareHeritageArchival("https://github.com/user/repo");
    expect(result?.swhid).toBe(`swh:1:snp:${"b".repeat(40)}`);
    expect(result?.archivedAt).toBeUndefined();
  });

  it("tolerates a nested snapshot.id object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ snapshot: { id: "c".repeat(40) } })),
    );
    const result = await fetchSoftwareHeritageArchival("https://github.com/user/repo");
    expect(result?.swhid).toBe(`swh:1:snp:${"c".repeat(40)}`);
  });

  it("returns null for a 404 (not archived) without treating it as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({}, false, 404)),
    );
    expect(await fetchSoftwareHeritageArchival("https://github.com/user/repo")).toBeNull();
  });

  it("returns null for a non-repository-host URL without making a call", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchSoftwareHeritageArchival("https://example.com/foo")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("returns null when the snapshot id isn't 40-hex", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ snapshot: "not-hex" })),
    );
    expect(await fetchSoftwareHeritageArchival("https://github.com/user/repo")).toBeNull();
  });

  it("returns null on a malformed (non-object) response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(null)),
    );
    expect(await fetchSoftwareHeritageArchival("https://github.com/user/repo")).toBeNull();
  });

  it("fails soft on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await fetchSoftwareHeritageArchival("https://github.com/user/repo")).toBeNull();
  });

  it("ignores an unparsable date, still returning the swhid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ snapshot: "d".repeat(40), date: "not-a-date" })),
    );
    const result = await fetchSoftwareHeritageArchival("https://github.com/user/repo");
    expect(result?.swhid).toBe(`swh:1:snp:${"d".repeat(40)}`);
    expect(result?.archivedAt).toBeUndefined();
  });

  it("returns null when the body exceeds the byte cap", async () => {
    const huge = "x".repeat(30_000);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, text: async () => huge }) as unknown as Response),
    );
    expect(await fetchSoftwareHeritageArchival("https://github.com/user/repo")).toBeNull();
  });
});
