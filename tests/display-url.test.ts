import { describe, expect, it } from "vitest";
import { displayUrl } from "@/lib/render/escape";
import { textHeader } from "@/lib/render/headerText";
import type { CanonicalCv } from "@/lib/canonical/schema";

describe("displayUrl", () => {
  it("strips user:pass@ userinfo from an http(s) URL", () => {
    expect(displayUrl("https://user:pass@example.org/p")).toBe("https://example.org/p");
    expect(displayUrl("http://u@example.org")).toBe("http://example.org");
  });

  it("strips ALL userinfo when the password itself contains @ (multi-@ authority)", () => {
    expect(displayUrl("https://user:pa@ss@example.org/path")).toBe("https://example.org/path");
    expect(displayUrl("https://user:p@ssw@rd@example.org/path")).toBe("https://example.org/path");
  });

  it("leaves a normal URL, a plain label, and a mailto unchanged", () => {
    expect(displayUrl("https://example.org/p")).toBe("https://example.org/p");
    expect(displayUrl("GitHub")).toBe("GitHub");
    expect(displayUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    // An @ in the path/query is NOT authority userinfo → untouched.
    expect(displayUrl("https://example.org/x?u=a@b")).toBe("https://example.org/x?u=a@b");
  });
});

describe("credentials never reach the text-export contact line", () => {
  it("strips userinfo from the website + profile links in textHeader", () => {
    const header = textHeader({
      owner: {
        contact: { website: "https://user:pass@site.example/p" },
        links: [{ label: "", url: "https://user:secret@git.example/me" }],
      },
    } as unknown as CanonicalCv);
    const joined = header.contact.join(" · ");
    expect(joined).not.toContain("user:pass");
    expect(joined).not.toContain("secret");
    expect(joined).toContain("https://site.example/p");
    expect(joined).toContain("https://git.example/me");
  });
});
