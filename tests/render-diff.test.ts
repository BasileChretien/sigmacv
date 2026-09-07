import { describe, expect, it } from "vitest";
import type { SnapshotDiff } from "@/lib/cv/snapshots";
import { injectSnapshotChrome, snapshotBannerHtml } from "@/lib/cv/snapshotPage";
import { formatSnapshotDate, renderDiffHtml, renderDiffMarkdown } from "@/lib/render/diff";

const EMPTY: SnapshotDiff = {
  sections: [],
  sectionsAdded: [],
  sectionsRemoved: [],
  displayChanged: [],
  ownerChanged: [],
  narrativeChanged: [],
  metricsChanged: [],
  hasChanges: false,
};

const FULL: SnapshotDiff = {
  sections: [
    {
      sectionId: "publications",
      sectionType: "publications",
      title: "Publications <b>",
      added: [{ id: "W1", label: "A new & shiny paper", year: 2026 }],
      removed: [{ id: "W2", label: "", year: 2020 }],
      hidden: [{ id: "W3", label: "Hidden one" }],
      unhidden: [{ id: "W4", label: "Back again" }],
    },
  ],
  sectionsAdded: [{ sectionId: "languages", sectionType: "languages", title: "Languages" }],
  sectionsRemoved: [{ sectionId: "skills", sectionType: "skills", title: "Skills" }],
  displayChanged: ["template", "cslStyle"],
  ownerChanged: ["headline"],
  narrativeChanged: [
    {
      sectionId: "narrative-knowledge",
      title: "Knowledge",
      wordsBefore: 3,
      wordsAfter: 5,
      delta: 2,
    },
  ],
  metricsChanged: [
    { key: "h_index", from: 12, to: 14 },
    { key: "i10_index", from: null, to: 20 },
  ],
  hasChanges: true,
};

const CTX = {
  version: 3,
  frozenAt: "2026-09-04T10:00:00.000Z",
  ownerName: "Basile <Chrétien>",
  frozenHref: "https://sigmacv.test/p/basile-x/v/tok",
  liveHref: "https://sigmacv.test/p/basile-x",
};

describe("formatSnapshotDate", () => {
  it("formats a calendar date for the locale (UTC)", () => {
    expect(formatSnapshotDate("2026-09-04T23:59:00.000Z", "en-US")).toBe("September 4, 2026");
    expect(formatSnapshotDate("2026-09-04T00:00:00.000Z", "fr-FR")).toContain("2026");
  });
  it("returns the input for an unparseable timestamp", () => {
    expect(formatSnapshotDate("not-a-date", "en-US")).toBe("not-a-date");
  });
});

describe("renderDiffHtml", () => {
  it("renders every change group, escaped, with the nav links", () => {
    const html = renderDiffHtml(FULL, "en-US", CTX);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain("Basile &lt;Chrétien&gt; — Changes since version 3");
    expect(html).toContain("Publications &lt;b&gt;");
    expect(html).toContain("A new &amp; shiny paper (2026)");
    // A blank label falls back to the id.
    expect(html).toContain("W2 (2020)");
    expect(html).toContain("<h3>Added</h3>");
    expect(html).toContain("<h3>Removed</h3>");
    expect(html).toContain("<h3>Hidden</h3>");
    expect(html).toContain("<h3>Shown again</h3>");
    expect(html).toContain("Sections added");
    expect(html).toContain("Sections removed");
    expect(html).toContain("Knowledge: 3 → 5 words");
    expect(html).toContain("h_index</span>: 12 → 14");
    expect(html).toContain("i10_index</span>: — → 20");
    expect(html).toContain("template, cslStyle");
    expect(html).toContain("headline");
    expect(html).toContain('href="https://sigmacv.test/p/basile-x/v/tok"');
    expect(html).toContain('href="https://sigmacv.test/p/basile-x"');
    expect(html).not.toContain("<script");
  });

  it("says 'no changes' and omits the nav without hrefs", () => {
    const html = renderDiffHtml(EMPTY, "en-US", {
      version: 1,
      frozenAt: CTX.frozenAt,
      ownerName: "A",
    });
    expect(html).toContain("No changes.");
    expect(html).not.toContain("<nav>");
    expect(html).not.toContain("<h2>");
  });

  it("localizes the copy", () => {
    const html = renderDiffHtml(FULL, "fr-FR", CTX);
    expect(html).toContain("Changements depuis la version 3");
    expect(html).toContain('<html lang="fr">');
  });
});

describe("renderDiffMarkdown", () => {
  it("mirrors the HTML content in Markdown", () => {
    const md = renderDiffMarkdown(FULL, "en-US", CTX);
    expect(md.startsWith("# Basile <Chrétien> — Changes since version 3")).toBe(true);
    expect(md).toContain(
      "[Frozen version](https://sigmacv.test/p/basile-x/v/tok) · [Live version](https://sigmacv.test/p/basile-x)",
    );
    expect(md).toContain("## Publications");
    expect(md).toContain("### Added");
    expect(md).toContain("- A new & shiny paper (2026)");
    expect(md).toContain("- W2 (2020)");
    expect(md).toContain("## Sections added\n\n- Languages");
    expect(md).toContain("## Sections removed\n\n- Skills");
    expect(md).toContain("- Knowledge: 3 → 5 words");
    expect(md).toContain("- `h_index`: 12 → 14");
    expect(md).toContain("- `i10_index`: — → 20");
    expect(md).toContain("`headline`");
    expect(md).toContain("`template`, `cslStyle`");
    expect(md.endsWith("\n")).toBe(true);
  });

  it("handles the empty diff and a context without links", () => {
    const md = renderDiffMarkdown(EMPTY, "en-US", {
      version: 1,
      frozenAt: CTX.frozenAt,
      ownerName: "A",
    });
    expect(md).toContain("No changes.");
    expect(md).not.toContain("](");
  });

  it("renders a link line with only one side present", () => {
    const md = renderDiffMarkdown(EMPTY, "en-US", { ...CTX, frozenHref: undefined });
    expect(md).toContain("[Live version](https://sigmacv.test/p/basile-x)");
    expect(md).not.toContain("Frozen version]");
  });
});

describe("snapshot page chrome", () => {
  const chrome = {
    version: 2,
    frozenAt: "2026-09-04T10:00:00.000Z",
    doi: "10.1234/abcd.5",
    liveUrl: "https://sigmacv.test/p/basile-x",
    diffUrl: "https://sigmacv.test/p/basile-x/v/tok/diff",
    locale: "en-US",
  };

  it("builds a banner with the version, date, DOI, live + diff links", () => {
    const banner = snapshotBannerHtml(chrome);
    expect(banner).toContain("Frozen version 2 · September 4, 2026");
    expect(banner).toContain('href="https://doi.org/10.1234/abcd.5"');
    expect(banner).toContain(">Live version</a>");
    expect(banner).toContain(">What changed since</a>");
    expect(banner).toContain('role="note"');
  });

  it("omits the DOI link when none is minted", () => {
    const banner = snapshotBannerHtml({ ...chrome, doi: null });
    expect(banner).not.toContain("doi.org");
  });

  it("injects canonical + noindex into <head> and the banner right after <body>", () => {
    const html =
      '<!doctype html><html><head><title>x</title></head><body class="cv"><main>hi</main></body></html>';
    const out = injectSnapshotChrome(html, chrome);
    expect(out).toContain(
      '<link rel="canonical" href="https://sigmacv.test/p/basile-x" /><meta name="robots" content="noindex" /></head>',
    );
    expect(out).toMatch(/<body class="cv"><p class="snapshot-banner"/);
    expect(out.indexOf("snapshot-banner")).toBeLessThan(out.indexOf("<main>"));
  });

  it("degrades gracefully on a fragment without head/body", () => {
    const out = injectSnapshotChrome("<main>only</main>", chrome);
    expect(out.startsWith('<p class="snapshot-banner"')).toBe(true);
    expect(out).toContain("<main>only</main>");
  });
});
