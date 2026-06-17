import { describe, expect, it } from "vitest";
import { qrSvg } from "@/lib/cv/qrSvg";

describe("qrSvg", () => {
  it("renders a scannable QR SVG for a URL", () => {
    const svg = qrSvg("https://sigmacv.org/p/abc-def");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('role="img"');
    expect(svg).toContain("<title>");
    expect(svg).toContain('shape-rendering="crispEdges"');
    // White background + near-black modules: high-contrast, deliberately un-themed.
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#1f2328"');
    // A non-empty module path.
    expect(/d="M\d/.test(svg)).toBe(true);
  });

  it("is deterministic for the same input", () => {
    expect(qrSvg("https://sigmacv.org/p/x")).toBe(qrSvg("https://sigmacv.org/p/x"));
  });

  it("includes a quiet-zone margin in the viewBox", () => {
    const svg = qrSvg("https://sigmacv.org/p/abc");
    const dim = Number(/viewBox="0 0 (\d+) \d+"/.exec(svg)?.[1]);
    // Smallest QR is 21 modules; + 8 for the 4-module quiet zone on each side.
    expect(dim).toBeGreaterThanOrEqual(21 + 8);
  });

  it("scales the QR version up for longer input", () => {
    const short = Number(/viewBox="0 0 (\d+)/.exec(qrSvg("https://sigmacv.org/p/a"))?.[1]);
    const long = Number(
      /viewBox="0 0 (\d+)/.exec(qrSvg("https://sigmacv.org/p/" + "a".repeat(200)))?.[1],
    );
    expect(long).toBeGreaterThan(short);
  });
});
