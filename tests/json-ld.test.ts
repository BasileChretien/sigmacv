import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/jsonLd";

describe("serializeJsonLd", () => {
  it("escapes < so a value can't break out of a <script> element", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script>");
  });

  it("produces valid JSON (round-trips after unescaping)", () => {
    const out = serializeJsonLd({ "@type": "Person", name: "A < B" });
    const parsed = JSON.parse(out.replace(/\\u003c/g, "<"));
    expect(parsed).toEqual({ "@type": "Person", name: "A < B" });
  });
});
