import { describe, expect, it } from "vitest";
import { emailSignatureHtml, BADGE_PNG_DISPLAY, BADGE_PNG_SCALE } from "@/lib/cv/emailSignature";

const base = {
  pageUrl: "https://sigmacv.org/p/abc",
  badgePngUrl: "https://sigmacv.org/p/abc/badge.png",
  alt: "Living CV badge",
  linkText: "View my living CV",
};

describe("emailSignatureHtml", () => {
  it("wraps a linked PNG with a text-link fallback beneath it", () => {
    const html = emailSignatureHtml(base);
    expect(html).toContain("<table");
    expect(html).toContain('role="presentation"');
    expect(html).toContain(`href="https://sigmacv.org/p/abc"`);
    // An Outlook-safe PNG — never the SVG badge (classic Outlook renders no SVG).
    expect(html).toContain(`src="https://sigmacv.org/p/abc/badge.png"`);
    expect(html).not.toContain("badge.svg");
    expect(html).toContain('alt="Living CV badge"');
    expect(html).toContain("View my living CV");
    // Linked twice: the image and the text fallback.
    expect(html.match(/<a /g)?.length).toBe(2);
  });

  it("defaults the <img> dimensions to the badge display size", () => {
    const html = emailSignatureHtml(base);
    expect(html).toContain(`width="${BADGE_PNG_DISPLAY.width}"`);
    expect(html).toContain(`height="${BADGE_PNG_DISPLAY.height}"`);
  });

  it("honours explicit width/height when given", () => {
    const html = emailSignatureHtml({ ...base, width: 200, height: 50 });
    expect(html).toContain(`width="200"`);
    expect(html).toContain(`height="50"`);
  });

  it("uses a valid accent for the fallback link, else the brand accent", () => {
    expect(emailSignatureHtml({ ...base, accent: "#0f766e" })).toContain("color:#0f766e");
    expect(emailSignatureHtml({ ...base, accent: "not-a-hex" })).toContain("color:#1f4fd8");
    expect(emailSignatureHtml(base)).toContain("color:#1f4fd8"); // omitted → brand
  });

  it("HTML-escapes untrusted text and URLs (no injection)", () => {
    const html = emailSignatureHtml({
      ...base,
      alt: '"><script>alert(1)</script>',
      linkText: "<b>x</b> & co",
      pageUrl: 'https://x/"onx',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt; &amp; co");
    expect(html).toContain("&quot;onx"); // the quote can't break out of href
  });

  it("oversamples the PNG for hi-DPI mail clients", () => {
    expect(BADGE_PNG_SCALE).toBeGreaterThanOrEqual(2);
    expect(BADGE_PNG_DISPLAY.width).toBeGreaterThan(0);
    expect(BADGE_PNG_DISPLAY.height).toBeGreaterThan(0);
  });
});
