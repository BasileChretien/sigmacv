import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemEntryUrl, updateDisplay } from "@/lib/canonical/curate";
import { itemEntryUrl, type CanonicalCv, type CvSection } from "@/lib/canonical/schema";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { entryLink } from "@/lib/render/entryLink";
import { buildRenderedSections } from "@/lib/render/html";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

/**
 * The ENTRY's own link — ORCID records one per activity (`url` on an
 * employment / education / distinction / membership / service / invited
 * position). It is loaded into `meta.entryUrl`, editable as
 * `meta.entryUrlOverride`, and shown beside the entry in every output format.
 */

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};

const MEMBERSHIP: OrcidPosition = {
  putCode: "svc1",
  organization: "Physiopathology and Imaging of Neurological Disorders",
  roleTitle: "Affiliated researcher",
  department: "Neuropresage",
  url: "https://neuropresage.fr/team/basile-chretien/",
};

const EMPLOYMENT: OrcidPosition = {
  putCode: "emp1",
  organization: "Nagoya University",
  roleTitle: "PhD candidate",
  department: "International Medical Education",
  startYear: 2024,
  rorId: "https://ror.org/04chrp450",
  url: "https://med.nagoya-u.ac.jp/people/chretien",
};

interface CvArgs {
  service?: OrcidPosition[];
  employments?: OrcidPosition[];
  education?: OrcidPosition[];
  distinctions?: OrcidPosition[];
  invitedPositions?: OrcidPosition[];
  previous?: CanonicalCv | null;
}

function makeCv(args: CvArgs = {}): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "cv_link",
    resolved,
    works: [],
    now: "2026-09-16T00:00:00.000Z",
    service: args.service ?? [MEMBERSHIP],
    employments: args.employments,
    education: args.education,
    distinctions: args.distinctions,
    invitedPositions: args.invitedPositions,
    previous: args.previous,
  });
  return updateDisplay(cv, { template: "classic" });
}

function sectionOf(cv: CanonicalCv, type: CvSection["type"]): CvSection {
  return cv.sections.find((s) => s.type === type)!;
}

/** Joined item HTML of a section, from the shared render assembly. */
function sectionHtml(cv: CanonicalCv, type: CvSection["type"]): string {
  const rs = buildRenderedSections(cv).find((s) => s.section.type === type)!;
  return rs.items.map((i) => i.html).join("");
}

// ── build: the source URL reaches every ORCID-sourced entry section ───────────

describe("entry url from ORCID", () => {
  it("stores a membership's url on the Service item", () => {
    const item = sectionOf(makeCv(), "service").items[0]!;
    expect(item.meta.entryUrl).toBe("https://neuropresage.fr/team/basile-chretien/");
    expect(itemEntryUrl(item)).toBe("https://neuropresage.fr/team/basile-chretien/");
  });

  it("stores it on every other ORCID-sourced entry section too", () => {
    const cv = makeCv({
      employments: [EMPLOYMENT],
      education: [{ putCode: "e1", organization: "UNICAEN", url: "https://unicaen.fr/x" }],
      distinctions: [{ putCode: "d1", organization: "Society", url: "https://society.org/prize" }],
      invitedPositions: [{ putCode: "t1", organization: "Institute", url: "https://inst.org/t" }],
    });
    expect(sectionOf(cv, "positions").items[0]!.meta.entryUrl).toBe(
      "https://med.nagoya-u.ac.jp/people/chretien",
    );
    expect(sectionOf(cv, "education").items[0]!.meta.entryUrl).toBe("https://unicaen.fr/x");
    // Awards take the points-in-time branch of the entry builder, which carries
    // no structured role/dates — the link still has to come through.
    expect(sectionOf(cv, "awards").items[0]!.meta.entryUrl).toBe("https://society.org/prize");
    expect(sectionOf(cv, "talks").items[0]!.meta.entryUrl).toBe("https://inst.org/t");
  });

  it("leaves entryUrl undefined when ORCID carries no url for the activity", () => {
    const cv = makeCv({ service: [{ ...MEMBERSHIP, url: undefined }] });
    expect(sectionOf(cv, "service").items[0]!.meta.entryUrl).toBeUndefined();
  });

  it("refreshes the source url on re-sync while keeping the owner's override", () => {
    let cv = makeCv();
    const section = sectionOf(cv, "service");
    cv = setItemEntryUrl(cv, section.id, section.items[0]!.id, "https://example.org/mine");
    const resynced = makeCv({
      service: [{ ...MEMBERSHIP, url: "https://neuropresage.fr/equipe/" }],
      previous: cv,
    });
    const item = sectionOf(resynced, "service").items[0]!;
    expect(item.meta.entryUrl).toBe("https://neuropresage.fr/equipe/");
    expect(item.meta.entryUrlOverride).toBe("https://example.org/mine");
    expect(itemEntryUrl(item)).toBe("https://example.org/mine");
  });
});

// ── curate: the editor's "Link" field ────────────────────────────────────────

describe("setItemEntryUrl", () => {
  const edit = (url: string, cv = makeCv()) => {
    const section = sectionOf(cv, "service");
    const next = setItemEntryUrl(cv, section.id, section.items[0]!.id, url);
    return sectionOf(next, "service").items[0]!;
  };

  it("stores the value as an override, leaving the source url intact", () => {
    const item = edit("https://example.org/mine");
    expect(item.meta.entryUrlOverride).toBe("https://example.org/mine");
    expect(item.meta.entryUrl).toBe("https://neuropresage.fr/team/basile-chretien/");
  });

  it("stores the raw value so a trailing space survives mid-typing", () => {
    expect(edit("https://example.org/mine ").meta.entryUrlOverride).toBe(
      "https://example.org/mine ",
    );
  });

  it("clears the override on a blank value (revert to the source url)", () => {
    let cv = makeCv();
    const section = sectionOf(cv, "service");
    cv = setItemEntryUrl(cv, section.id, section.items[0]!.id, "https://example.org/mine");
    cv = setItemEntryUrl(cv, section.id, section.items[0]!.id, "  ");
    const item = sectionOf(cv, "service").items[0]!;
    expect(item.meta.entryUrlOverride).toBeUndefined();
    expect(itemEntryUrl(item)).toBe("https://neuropresage.fr/team/basile-chretien/");
  });

  it("clears the override when the value equals the source url", () => {
    expect(
      edit("https://neuropresage.fr/team/basile-chretien/").meta.entryUrlOverride,
    ).toBeUndefined();
  });

  it("is a no-op above the schema's 2048-char cap (it would fail the save)", () => {
    const cv = makeCv();
    const section = sectionOf(cv, "service");
    const long = `https://example.org/${"a".repeat(2048)}`;
    expect(setItemEntryUrl(cv, section.id, section.items[0]!.id, long)).toBe(cv);
  });

  it("is a no-op for an unknown item id", () => {
    const cv = makeCv();
    const section = sectionOf(cv, "service");
    const next = setItemEntryUrl(cv, section.id, "nope", "https://example.org/");
    expect(sectionOf(next, "service").items[0]!.meta.entryUrlOverride).toBeUndefined();
  });
});

// ── the prepared link ────────────────────────────────────────────────────────

describe("entryLink", () => {
  const link = (entryUrl: string | undefined) => entryLink({ meta: { entryUrl } });

  it("labels the link with its host", () => {
    expect(link("https://neuropresage.fr/team/basile-chretien/")).toEqual({
      href: "https://neuropresage.fr/team/basile-chretien/",
      label: "neuropresage.fr",
    });
  });

  it("drops a leading www. from the label", () => {
    expect(link("https://www.example.org/a")?.label).toBe("example.org");
  });

  it("is null when the entry carries no link", () => {
    expect(link(undefined)).toBeNull();
  });

  it("is null for a value that is not a usable http(s) link", () => {
    // Defence in depth: the ORCID reader already gates the scheme, but an owner
    // override reaches the renderer unvalidated.
    expect(link("javascript:alert(1)")).toBeNull();
  });

  it("falls back to the href itself when it carries no parseable host", () => {
    // `safeHref` passes a bare scheme through; `new URL` cannot parse it, and the
    // link must still carry visible text.
    expect(link("https://")).toEqual({ href: "https://", label: "https://" });
    expect(link("mailto:jane@example.org")?.label).toBe("mailto:jane@example.org");
  });
});

// ── HTML: the link sits beside the entry, never inside the institution link ───

describe("entry link in HTML", () => {
  it("appends the host to a flat entry line (Service), marked nofollow ugc", () => {
    // The destination is chosen by whoever wrote the ORCID record (or by the
    // owner's override), so it carries the same rel as the free-text profile
    // links — a spam CV must not pass link equity from our domain.
    expect(sectionHtml(makeCv(), "service")).toContain(
      ' · <a class="cv-entry-url" href="https://neuropresage.fr/team/basile-chretien/"' +
        ' rel="nofollow ugc noopener noreferrer">neuropresage.fr</a>',
    );
  });

  it("puts it on the sub-line of a structured Positions record, after the institution", () => {
    const html = sectionHtml(makeCv({ employments: [EMPLOYMENT] }), "positions");
    expect(html).toContain(
      '<div class="cv-entry-sub">International Medical Education · ' +
        '<a class="cv-ror-link" href="https://ror.org/04chrp450" title="ROR organization record">' +
        "Nagoya University</a> · " +
        '<a class="cv-entry-url" href="https://med.nagoya-u.ac.jp/people/chretien"' +
        ' rel="nofollow ugc noopener noreferrer">med.nagoya-u.ac.jp</a></div>',
    );
  });

  it("still shows the link when the entry has no role to lead with", () => {
    const html = sectionHtml(
      makeCv({ employments: [{ ...EMPLOYMENT, roleTitle: undefined, department: undefined }] }),
      "positions",
    );
    // The institution is promoted to the lead line; the sub-line carries the link
    // alone rather than disappearing with the department.
    expect(html).toContain(
      '<div class="cv-entry-sub"><a class="cv-entry-url" ' +
        'href="https://med.nagoya-u.ac.jp/people/chretien"' +
        ' rel="nofollow ugc noopener noreferrer">med.nagoya-u.ac.jp</a></div>',
    );
  });

  it("adds nothing when the entry carries no link", () => {
    const html = sectionHtml(makeCv({ service: [{ ...MEMBERSHIP, url: undefined }] }), "service");
    expect(html).not.toContain("cv-entry-url");
  });

  it("never emits an owner override that is not an http(s) link", () => {
    let cv = makeCv();
    const section = sectionOf(cv, "service");
    cv = setItemEntryUrl(cv, section.id, section.items[0]!.id, "javascript:alert(1)");
    const html = sectionHtml(cv, "service");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("cv-entry-url");
  });
});

// ── the published document says what the page says ───────────────────────────

describe("entry link in the public projection", () => {
  const publicItem = (cv: CanonicalCv) =>
    sectionOf(projectCvForPublic(cv), "service").items.find((i) => i.meta.entryUrl !== undefined) ??
    sectionOf(projectCvForPublic(cv), "service").items[0]!;

  it("keeps a usable link on the published document", () => {
    expect(publicItem(makeCv()).meta.entryUrl).toBe(
      "https://neuropresage.fr/team/basile-chretien/",
    );
  });

  it("drops an owner override the renderers would refuse, rather than publishing it raw", () => {
    // The editor stores the field raw (a URL is typed a character at a time), and
    // every renderer gates on `safeHref` — so the raw `.json`, which echoes the
    // projected object, must not be the one surface that carries the raw string.
    let cv = makeCv();
    const section = sectionOf(cv, "service");
    cv = setItemEntryUrl(cv, section.id, section.items[0]!.id, "javascript:alert(1)");
    const item = sectionOf(projectCvForPublic(cv), "service").items[0]!;
    expect(item.meta.entryUrlOverride).toBeUndefined();
    expect(JSON.stringify(projectCvForPublic(cv))).not.toContain("javascript:");
  });

  it("strips a credential an owner pasted into the link", () => {
    let cv = makeCv();
    const section = sectionOf(cv, "service");
    cv = setItemEntryUrl(cv, section.id, section.items[0]!.id, "https://a:secret@example.org/x");
    const item = sectionOf(projectCvForPublic(cv), "service").items[0]!;
    expect(item.meta.entryUrlOverride).toBe("https://example.org/x");
    expect(JSON.stringify(projectCvForPublic(cv))).not.toContain("secret");
  });
});

// ── text formats: the whole URL, since a printed CV cannot be clicked ────────

describe("entry link in the text formats", () => {
  it("prints the full URL after a Markdown entry", () => {
    expect(renderCvMarkdown(makeCv())).toContain("(https://neuropresage.fr/team/basile-chretien/)");
  });

  it("hands LaTeX a bare URL, which it wraps in \\url{}", () => {
    expect(renderCvLatex(makeCv())).toContain(
      "\\url{https://neuropresage.fr/team/basile-chretien/}",
    );
  });
});

// ── the public machine graph ─────────────────────────────────────────────────

describe("entry link in the public JSON-LD", () => {
  it("carries the entry's url on the schema.org occupation", () => {
    const parsed = JSON.parse(profilePageJsonLd(makeCv({ employments: [EMPLOYMENT] }), "slug"));
    expect(parsed.mainEntity.hasOccupation[0]).toMatchObject({
      "@type": "Occupation",
      url: "https://med.nagoya-u.ac.jp/people/chretien",
    });
  });

  it("omits url for an entry with none", () => {
    const cv = makeCv({ employments: [{ ...EMPLOYMENT, url: undefined }] });
    const parsed = JSON.parse(profilePageJsonLd(cv, "slug"));
    expect(parsed.mainEntity.hasOccupation[0].url).toBeUndefined();
  });
});
