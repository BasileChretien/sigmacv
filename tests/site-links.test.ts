import { afterEach, describe, expect, it } from "vitest";
import { getSiteLinks } from "@/lib/siteLinks";

const KEYS = [
  "NEXT_PUBLIC_GITHUB_URL",
  "NEXT_PUBLIC_LINKEDIN_URL",
  "NEXT_PUBLIC_BUYMEACOFFEE_URL",
] as const;

afterEach(() => {
  for (const k of KEYS) delete (process.env as Record<string, string | undefined>)[k];
});

describe("getSiteLinks", () => {
  it("returns sanitized links from the public env vars", () => {
    process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/x/y";
    process.env.NEXT_PUBLIC_LINKEDIN_URL = "linkedin.com/in/x"; // bare domain → https
    process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL = "javascript:alert(1)"; // unsafe → dropped
    const links = getSiteLinks();
    expect(links.github).toBe("https://github.com/x/y");
    expect(links.linkedin).toBe("https://linkedin.com/in/x");
    expect(links.coffee).toBe("");
  });

  it("returns empty strings when the env vars are unset", () => {
    expect(getSiteLinks()).toEqual({ github: "", linkedin: "", coffee: "" });
  });
});
