import { afterEach, describe, expect, it, vi } from "vitest";

// Minimal env so getEnv() (OPENALEX_MAILTO) doesn't throw; fetch is stubbed.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

import { fetchJournalNamesByIssn } from "@/lib/openalex/client";

function jsonRes(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "ERR",
    headers: { get: () => null },
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchJournalNamesByIssn", () => {
  it("maps every ISSN a source carries (incl. issn_l) to its display name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonRes({
          results: [
            { display_name: "BMC Ophthalmology", issn: ["1471-2415"], issn_l: "1471-2415" },
            { display_name: "The BMJ", issn: ["0959-8138", "1756-1833"], issn_l: "0959-8138" },
          ],
        }),
      ),
    );
    const map = await fetchJournalNamesByIssn(["1471-2415", "0959-8138", "1756-1833"]);
    expect(map.get("1471-2415")).toBe("BMC Ophthalmology");
    expect(map.get("0959-8138")).toBe("The BMJ");
    expect(map.get("1756-1833")).toBe("The BMJ"); // electronic ISSN resolves too
  });

  it("makes no request and returns an empty map for no ISSNs", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect((await fetchJournalNamesByIssn([])).size).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("fails soft to an empty map on an HTTP error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonRes({}, false, 404)));
    expect((await fetchJournalNamesByIssn(["1471-2415"])).size).toBe(0);
  });
});
