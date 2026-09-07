import { describe, expect, it } from "vitest";
import { CONTENT_HASH_SHORT_LEN, contentHashOf, stableJson } from "@/lib/cv/snapshotHash";

describe("snapshot content hash", () => {
  it("serialises with keys sorted recursively, arrays in order, undefined dropped", () => {
    const a = { z: 1, a: { y: [3, { q: 1, p: 2 }], x: undefined }, m: "s" };
    const b = { m: "s", a: { x: undefined, y: [3, { p: 2, q: 1 }] }, z: 1 };
    expect(stableJson(a)).toBe('{"a":{"y":[3,{"p":2,"q":1}]},"m":"s","z":1}');
    expect(stableJson(a)).toBe(stableJson(b));
    // Array ORDER is content (a re-ordered publication list is a different document).
    expect(stableJson({ k: [1, 2] })).not.toBe(stableJson({ k: [2, 1] }));
  });

  it("hashes to lower-case hex SHA-256, independent of key order", () => {
    const h = contentHashOf({ b: 1, a: [1, 2] });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(contentHashOf({ a: [1, 2], b: 1 })).toBe(h);
    expect(contentHashOf({ a: [1, 2], b: 2 })).not.toBe(h);
    expect(CONTENT_HASH_SHORT_LEN).toBeLessThan(64);
  });
});
