import { describe, expect, it } from "vitest";
import { iconSvg, resolveLink, type IconName } from "@/lib/render/icons";

const ALL_ICONS: IconName[] = [
  "email",
  "phone",
  "location",
  "website",
  "link",
  "scholar",
  "github",
  "linkedin",
  "orcid",
  "mastodon",
  "researchgate",
  "bluesky",
  "x",
  "youtube",
];

describe("iconSvg", () => {
  it("emits a CSP-safe decorative inline svg for every icon", () => {
    for (const name of ALL_ICONS) {
      const svg = iconSvg(name);
      expect(svg.startsWith('<svg class="cv-ico"')).toBe(true);
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toMatch(/<path d="[^"]+"\/>/);
      expect(svg).not.toContain("<script");
    }
  });

  it("renders ORCID in its brand green and everything else in currentColor", () => {
    expect(iconSvg("orcid")).toContain('fill="#A6CE39"');
    expect(iconSvg("github")).toContain('fill="currentColor"');
    expect(iconSvg("email")).toContain('fill="currentColor"');
  });
});

describe("resolveLink (host-only detection)", () => {
  const cases: Array<[string, IconName, string | undefined]> = [
    ["https://github.com/foo", "github", "GitHub"],
    ["github.com/foo", "github", "GitHub"], // no scheme → completed, host read
    ["https://gist.github.com/foo", "github", "GitHub"],
    ["https://www.linkedin.com/in/foo", "linkedin", "LinkedIn"], // www. stripped
    ["https://orcid.org/0000-0002-7483-2489", "orcid", "ORCID"],
    ["https://scholar.google.com/citations?user=x", "scholar", "Google Scholar"],
    ["https://scholar.google.de/citations?user=x", "scholar", "Google Scholar"],
    ["https://x.com/foo", "x", "X"],
    ["https://twitter.com/foo", "x", "X"],
    ["https://m.twitter.com/foo", "x", "X"], // m. stripped
    ["https://researchgate.net/profile/foo", "researchgate", "ResearchGate"],
    ["https://www.researchgate.net/profile/foo", "researchgate", "ResearchGate"],
    ["https://youtube.com/@foo", "youtube", "YouTube"],
    ["https://youtu.be/abc", "youtube", "YouTube"],
    ["https://bsky.app/profile/foo", "bluesky", "Bluesky"],
    ["https://foo.bsky.social/", "bluesky", "Bluesky"],
    ["https://mastodon.social/@foo", "mastodon", "Mastodon"],
    ["https://mastodon.world/@foo", "mastodon", "Mastodon"], // startsWith heuristic
    ["https://example.com/me", "link", undefined], // unknown host → generic
    ["fosstodon.org/@foo", "link", undefined], // unknown Mastodon instance → honest generic
    ["not a url at all", "link", undefined], // unparseable → generic, never throws
    ["", "link", undefined], // empty → generic
  ];
  it.each(cases)("resolves %s", (url, icon, service) => {
    const r = resolveLink(url);
    expect(r.icon).toBe(icon);
    expect(r.service).toBe(service);
  });
});
