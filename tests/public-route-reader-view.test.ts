import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { __resetPublicPageCache } from "@/lib/cv/publicPageCache";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  getPublicCvForPage: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/lib/cv/sync", () => ({ getPublicCvForPage: mocks.getPublicCvForPage }));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { GET } from "@/app/p/[slug]/route";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");
const SLUG = "basile-chretien-ab12";

function makeCv(allow: boolean): CanonicalCv {
  const cv = buildCanonicalCv({ id: "cv_rr", resolved, works, now: "2026-06-02T00:00:00.000Z" });
  return projectCvForPublic({ ...cv, display: { ...cv.display, allowReaderMode: allow } });
}

function serve(cv: CanonicalCv, indexable = true) {
  mocks.getPublicCvForPage.mockResolvedValue({ cv, indexable, coauthorCvs: [], recentlyAdded: [] });
}

async function get(query = "", slug = SLUG) {
  const res = await GET(new Request(`https://sigmacv.test/p/${slug}${query}`), {
    params: Promise.resolve({ slug }),
  });
  return { res, html: await res.text() };
}

const jsonLd = (html: string) =>
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
const canonical = (html: string) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
const ogImage = (html: string) => html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  __resetPublicPageCache();
});

describe.skipIf(!hasApa)("/p/[slug]?view=reader (needs vendored CSL assets)", () => {
  it("ignores the param when the owner has not opted in: the standard page, no link, no banner", async () => {
    serve(makeCv(false));
    const plain = await get();
    const asked = await get("?view=reader");
    expect(asked.res.status).toBe(200);
    for (const { res, html } of [plain, asked]) {
      expect(html).not.toContain('<aside class="cv-readerbanner"');
      expect(html).not.toContain('<nav class="cv-readerbar"');
      expect(html).not.toContain('class="cv-prov"');
      expect(html).not.toContain('name="robots"');
      expect(res.headers.get("X-Robots-Tag")).toBe("index, follow");
    }
    // Byte-identical: the opt-out page does not change with the param.
    expect(asked.html).toBe(plain.html);
  });

  it("offers the quiet Reader-view link on the standard page once the owner opted in", async () => {
    serve(makeCv(true));
    const { res, html } = await get();
    expect(res.headers.get("X-Robots-Tag")).toBe("index, follow");
    expect(html).toContain('<nav class="cv-readerbar"');
    expect(html).toContain('href="?view=reader"');
    // …but the standard page itself is untouched otherwise: no banner, no marks,
    // owner toggles still off (no provenance footer, no OA badges).
    expect(html).not.toContain('<aside class="cv-readerbanner"');
    expect(html).not.toContain('class="cv-prov"');
    expect(html).not.toContain('class="cv-provenance"');
    expect(html).not.toContain('name="robots"');
  });

  it("serves the reader view when allowed: preset applied, marks, banner, noindex, plain canonical", async () => {
    serve(makeCv(true));
    const plain = await get();
    const { res, html } = await get("?view=reader");
    expect(res.status).toBe(200);
    // The forced-on toggles show: provenance footer + per-entry marks.
    expect(html).toContain('class="cv-provenance"');
    expect(html).toContain('class="cv-prov"');
    // On the public projection the match basis is stripped, so the mark names the
    // record's source — never the owner's attribution doubt.
    expect(html).toContain(">OpenAlex</span>");
    expect(html).not.toContain("Matched to the owner");
    // Banner with the disclaimer + back link; no second Reader-view link.
    expect(html).toContain('<aside class="cv-readerbanner"');
    expect(html).toContain("Nothing here is a score.");
    expect(html).toContain('<a href="?">Back to the standard page</a>');
    expect(html).not.toContain('<nav class="cv-readerbar"');
    // Kept out of search: header + meta; the canonical is the PLAIN page URL.
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(canonical(html)).toMatch(new RegExp(`^https://[^/]+/p/${SLUG}$`));
    expect(canonical(html)).toBe(canonical(plain.html));
    // OG card + JSON-LD are unchanged by the param.
    expect(ogImage(html)).toBe(ogImage(plain.html));
    expect(jsonLd(html)).toBeTruthy();
    expect(jsonLd(html)).toBe(jsonLd(plain.html));
    // Reader-view content never enters the standard-page cache.
    const again = await get();
    expect(again.html).not.toContain('<aside class="cv-readerbanner"');
    expect(again.html).toBe(plain.html);
  });

  it("does not add metrics the owner did not choose", async () => {
    serve(makeCv(true));
    const { html } = await get("?view=reader");
    expect(html).not.toContain('class="cv-metrics"');
    expect(html).not.toContain('class="cv-summary-block"');
    expect(html).not.toContain("h-index");
  });

  it("carries the recipient notice + print legend only in the reader view", async () => {
    serve(makeCv(true));
    const plain = await get();
    const { html } = await get("?view=reader");
    const banner = html.match(/<aside class="cv-readerbanner"[\s\S]*?<\/aside>/)?.[0] ?? "";
    expect(banner).toContain('<p class="cv-readernotice">');
    expect(banner).toContain("rests on the reader&#39;s own lawful basis");
    expect(banner).toContain('<div class="cv-readerlegend">');
    // The legend is built from what THIS page shows: the fixture's works all come
    // from OpenAlex, none is retracted, none carries an OA status or an indicator
    // — so the mark line names OpenAlex, and no other line is emitted.
    expect(banner).toContain(
      "<li>Grey mark after an entry: the source its record came from (OpenAlex).</li>",
    );
    expect(banner).not.toContain("<li><b>Retracted</b>");
    expect(banner).not.toContain("<li><b>OA</b>");
    expect(banner).not.toContain("<li><b>Claimed</b>");
    expect(banner).not.toContain("<li><b>Manual</b>");
    expect(banner).not.toContain("Matched to the owner");
    // The standard page carries neither block (the shared stylesheet may still
    // name the classes — assert on the markup, not the selector).
    expect(plain.html).not.toContain('<p class="cv-readernotice">');
    expect(plain.html).not.toContain('<div class="cv-readerlegend">');
    expect(plain.html).not.toContain("lawful basis");
  });

  it("keeps the reader view across facet filters and the filters in the back link", async () => {
    serve(makeCv(true));
    const { html } = await get("?since=2020&view=reader");
    expect(html).toContain('<aside class="cv-readerbanner"');
    expect(html).toContain('<a href="?since=2020">Back to the standard page</a>');
    // Every filter chip keeps the view param.
    const bar = html.match(/<nav class="cv-filterbar"[\s\S]*?<\/nav>/)?.[0] ?? "";
    const hrefs = [...bar.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h).toContain("view=reader");
  });

  it("is ignored by the machine formats", async () => {
    serve(makeCv(true));
    const { res, html } = await get("?view=reader", `${SLUG}.json`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("json");
    expect(html).not.toContain('<aside class="cv-readerbanner"');
    const doc = JSON.parse(html) as CanonicalCv;
    expect(doc.display.showProvenance).toBe(false);
  });
});

describe.skipIf(!hasApa)("/p/[slug] public chrome placement (needs vendored CSL assets)", () => {
  const MAIN = '<main class="cv-main">';
  const sidebar = (allow: boolean): CanonicalCv => {
    const cv = makeCv(allow);
    return { ...cv, display: { ...cv.display, template: "sidebar" } };
  };

  it("keeps the Sidebar two-column grid intact: <main> is the direct second child, the filter bar inside it", async () => {
    serve(sidebar(false));
    const { html } = await get();
    // The grid expects exactly two children: <aside class="cv-sidebar"> then <main>.
    // Anything injected BETWEEN them takes the main cell and pushes the whole CV
    // into the narrow rail column on row 2 — the collapse seen on a real page.
    expect(html).toContain('<div class="cv-sidebar-layout"><aside class="cv-sidebar">');
    expect(html).toContain(`</aside>${MAIN}`);
    // The filter bar is a descendant of <main>, ahead of the first section.
    const nav = html.indexOf('<nav class="cv-filterbar"');
    expect(nav).toBeGreaterThan(-1);
    expect(html.indexOf(MAIN)).toBeLessThan(nav);
    expect(nav).toBeLessThan(html.indexOf("</main>"));
    expect(nav).toBeLessThan(html.indexOf('<section class="cv-section"'));
    expect(html).toContain(`${MAIN}<nav class="cv-filterbar"`);
  });

  it("places the reader-view chrome inside <main> too (link on the standard page, banner in the reader view)", async () => {
    serve(sidebar(true));
    const { html } = await get();
    expect(html).toContain(`</aside>${MAIN}<nav class="cv-readerbar"`);

    const reader = await get("?view=reader");
    expect(reader.html).toContain(`</aside>${MAIN}<aside class="cv-readerbanner"`);
    // Banner first, then the filter bar, then the sections — all inside <main>.
    const banner = reader.html.indexOf('<aside class="cv-readerbanner"');
    const bar = reader.html.indexOf('<nav class="cv-filterbar"');
    expect(banner).toBeLessThan(bar);
    expect(bar).toBeLessThan(reader.html.indexOf('<section class="cv-section"'));
  });

  it("uses the same anchor on the single-column templates", async () => {
    const cv = makeCv(false);
    serve({ ...cv, display: { ...cv.display, template: "classic" } });
    const { html } = await get();
    expect(html).toContain(`${MAIN}<nav class="cv-filterbar"`);
    expect(html).not.toContain(`</nav>${MAIN}`);
  });
});
