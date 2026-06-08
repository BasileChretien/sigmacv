import { describe, expect, it } from "vitest";
import { splitSelf, wrapSelf } from "@/lib/render/emphasize";

describe("splitSelf", () => {
  it("returns a single non-self segment when there are no usable variants", () => {
    expect(splitSelf("Chrétien, B.", [])).toEqual([{ text: "Chrétien, B.", self: false }]);
  });

  it("ignores variants shorter than 2 chars", () => {
    expect(splitSelf("A. Smith", ["A"])).toEqual([{ text: "A. Smith", self: false }]);
  });

  it("splits a matched variant into a self segment", () => {
    const segs = splitSelf("Chrétien, B. & Dolladille, C.", ["Chrétien"]);
    expect(segs.some((s) => s.self && s.text === "Chrétien")).toBe(true);
    expect(segs.some((s) => !s.self && s.text.includes("Dolladille"))).toBe(true);
  });

  it("prefers the longest overlapping variant", () => {
    const segs = splitSelf("Basile Chrétien wrote it", ["Chrétien", "Basile Chrétien"]);
    expect(segs.find((s) => s.self)?.text).toBe("Basile Chrétien");
  });

  it("does not emphasize a short surname embedded inside a longer word", () => {
    // "Berg" must match only the standalone author, never inside "Bergström"
    // (the word-boundary guard; matches the HTML highlighter's behaviour).
    const segs = splitSelf("Bergström, A. & Berg, B.", ["Berg"]);
    expect(segs.filter((s) => s.self).map((s) => s.text)).toEqual(["Berg"]);
  });

  it("still matches an accented surname at a word boundary", () => {
    const segs = splitSelf("Évora, M. & Smith, J.", ["Évora"]);
    expect(segs.filter((s) => s.self).map((s) => s.text)).toEqual(["Évora"]);
  });
});

describe("wrapSelf", () => {
  it("wraps only the self segments", () => {
    expect(wrapSelf("Chrétien, B.", ["Chrétien"], (s) => `**${s}**`)).toBe("**Chrétien**, B.");
  });
  it("returns the text unchanged with no variants", () => {
    expect(wrapSelf("nobody", [], (s) => `**${s}**`)).toBe("nobody");
  });
});
