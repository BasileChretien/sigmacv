import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { dataLinkText, dataLinksHtml } from "@/lib/render/dataLinksHtml";
import { renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv, CvItem, DataLink } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

const GEO: DataLink = {
  id: "GSE12345",
  scheme: "geo",
  url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE12345",
  title: 'Expression "data" <b>',
  kind: "dataset",
};
const ZENODO: DataLink = {
  id: "10.5281/zenodo.42",
  scheme: "doi",
  url: "https://doi.org/10.5281/zenodo.42",
  kind: "dataset",
};
const GITHUB: DataLink = {
  id: "https://github.com/org/repo",
  scheme: "url",
  url: "https://github.com/org/repo/",
  kind: "software",
};
const OTHER: DataLink = {
  id: "P1",
  scheme: "protocols.io",
  url: "https://www.protocols.io/view/p1",
  kind: "other",
};

function item(links: DataLink[] | undefined): CvItem {
  return {
    id: "W1",
    source: "openalex",
    sourceId: "W1",
    csl: { id: "W1", type: "article-journal", title: "T" },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: links ? { dataLinks: links } : {},
  };
}

/** The CV from the fixture with `links` attached to its first publication. */
function cvWithLinks(links: DataLink[], showDataLinks: boolean): CanonicalCv {
  const built = buildCanonicalCv({ id: "cv", resolved, works, now: "2026-06-02T00:00:00.000Z" });
  const cv = {
    ...built,
    sections: built.sections.map((s) =>
      s.type !== "publications"
        ? s
        : {
            ...s,
            items: s.items.map((it, i) =>
              i === 0 ? { ...it, meta: { ...it.meta, dataLinks: links } } : it,
            ),
          },
    ),
  };
  return updateDisplay(cv, { showDataLinks });
}

describe("dataLinkText", () => {
  it("labels DOIs by repository, URLs by host+path, accessions by scheme", () => {
    expect(dataLinkText(ZENODO)).toBe("Zenodo 10.5281/zenodo.42");
    expect(dataLinkText({ ...ZENODO, id: "10.5061/dryad.1" })).toBe("Dryad 10.5061/dryad.1");
    expect(dataLinkText({ ...ZENODO, id: "10.1000/x" })).toBe("DOI 10.1000/x");
    expect(dataLinkText(GITHUB)).toBe("github.com/org/repo");
    expect(dataLinkText(GEO)).toBe("GEO GSE12345");
  });
});

describe("dataLinksHtml", () => {
  it("renders a Data group and a Code group with nofollow-ugc anchors", () => {
    const html = dataLinksHtml(item([GEO, ZENODO, GITHUB, OTHER]), "en-US");
    expect(html).toContain('<div class="cv-datalinks">');
    expect(html).toContain('<span class="cv-datalinks-label">Data:</span>');
    expect(html).toContain('<span class="cv-datalinks-label">Code:</span>');
    expect(html).toContain(
      '<a href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE12345" rel="nofollow ugc noopener noreferrer" title="Expression &quot;data&quot; &lt;b&gt;">GEO GSE12345</a>',
    );
    expect(html).toContain(
      '<a href="https://doi.org/10.5281/zenodo.42" rel="nofollow ugc noopener noreferrer">Zenodo 10.5281/zenodo.42</a>',
    );
    expect(html).toContain(">github.com/org/repo</a>");
    // "other" links sit in the Data group; groups are joined by an em dash.
    expect(html).toContain("PROTOCOLS.IO P1</a></span> — <span");
    expect(html).toContain(" · ");
  });

  it("localizes the labels", () => {
    expect(dataLinksHtml(item([GEO]), "fr-FR")).toContain("Données:");
    expect(dataLinksHtml(item([GITHUB]), "ja-JP")).toContain("コード:");
  });

  it("renders only the group that has links, and nothing without links", () => {
    expect(dataLinksHtml(item([GITHUB]), "en-US")).not.toContain("Data:");
    expect(dataLinksHtml(item(undefined), "en-US")).toBe("");
    expect(dataLinksHtml(item([]), "en-US")).toBe("");
  });

  it("degrades a link with an unsafe URL to plain text (defence in depth)", () => {
    const html = dataLinksHtml(item([{ ...GEO, url: "javascript:alert(1)" }]), "en-US");
    expect(html).toContain("GEO GSE12345");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("javascript:");
  });
});

describe.skipIf(!hasApa)("renderCvHtml data links (needs vendored CSL assets)", () => {
  it("shows the line only when display.showDataLinks is on", () => {
    const on = renderCvHtml(cvWithLinks([GEO, GITHUB], true));
    expect(on).toContain('class="cv-datalinks"');
    expect(on).toContain("GEO GSE12345");
    expect(on).toContain("github.com/org/repo");
    expect(on).toContain(".cv-datalinks {");

    const off = renderCvHtml(cvWithLinks([GEO, GITHUB], false));
    expect(off).not.toContain('class="cv-datalinks"');
    expect(off).not.toContain("GSE12345");
  });
});

describe("profilePageJsonLd data links", () => {
  function articleNodes(cv: CanonicalCv): Record<string, unknown>[] {
    const parsed = JSON.parse(profilePageJsonLd(cv, "slug"));
    return parsed.mainEntity["@reverse"].author as Record<string, unknown>[];
  }

  it("emits Dataset / SoftwareSourceCode nodes the article isBasedOn", () => {
    const nodes = articleNodes(cvWithLinks([GEO, ZENODO, GITHUB, OTHER], false));
    const withData = nodes.find((n) => Array.isArray(n.isBasedOn))!;
    expect(withData["@type"]).toBe("ScholarlyArticle");
    expect(withData.isBasedOn).toEqual([
      {
        "@type": "Dataset",
        "@id": "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE12345",
        name: 'Expression "data" <b>',
        identifier: "GSE12345",
        url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE12345",
      },
      {
        "@type": "Dataset",
        "@id": "https://doi.org/10.5281/zenodo.42",
        name: "DOI 10.5281/zenodo.42",
        identifier: "https://doi.org/10.5281/zenodo.42",
        url: "https://doi.org/10.5281/zenodo.42",
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": "https://github.com/org/repo/",
        name: "URL https://github.com/org/repo",
        identifier: "https://github.com/org/repo",
        url: "https://github.com/org/repo/",
      },
    ]);
    // Every other article carries no isBasedOn.
    expect(nodes.filter((n) => n.isBasedOn).length).toBe(1);
  });

  it("drops unsafe URLs and omits isBasedOn when nothing survives", () => {
    const nodes = articleNodes(cvWithLinks([{ ...GEO, url: "javascript:x" }, OTHER], false));
    expect(nodes.some((n) => n.isBasedOn)).toBe(false);
    const text = JSON.stringify(nodes);
    expect(text).not.toContain("javascript:");
  });
});
