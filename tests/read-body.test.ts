import { describe, expect, it } from "vitest";
import { readJsonBodyWithLimit } from "@/lib/readBody";

function jsonReq(body: string): Request {
  return new Request("http://x/api", { method: "POST", body });
}

describe("readJsonBodyWithLimit", () => {
  it("parses a small JSON body under the limit", async () => {
    const r = await readJsonBodyWithLimit(jsonReq(JSON.stringify({ a: 1 })), 1_000);
    expect(r).toEqual({ ok: true, value: { a: 1 } });
  });

  it("rejects a body over the byte ceiling as too large (not trusting content-length)", async () => {
    const big = JSON.stringify({ x: "y".repeat(5_000) });
    const r = await readJsonBodyWithLimit(jsonReq(big), 1_000);
    expect(r).toEqual({ ok: false, tooLarge: true });
  });

  it("flags invalid JSON distinctly from too-large", async () => {
    const r = await readJsonBodyWithLimit(jsonReq("{ not json"), 1_000);
    expect(r).toEqual({ ok: false, tooLarge: false });
  });

  it("handles a request with no body stream (returns invalid JSON for empty)", async () => {
    const r = await readJsonBodyWithLimit(new Request("http://x/api"), 1_000);
    expect(r).toEqual({ ok: false, tooLarge: false });
  });

  it("counts bytes, not characters (multi-byte UTF-8)", async () => {
    // 400 '★' chars = 1200 bytes (3 bytes each) — over a 1000-byte ceiling even
    // though it's only 400 characters.
    const body = JSON.stringify({ s: "★".repeat(400) });
    const r = await readJsonBodyWithLimit(jsonReq(body), 1_000);
    expect(r).toEqual({ ok: false, tooLarge: true });
  });
});
