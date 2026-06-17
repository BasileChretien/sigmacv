import { describe, expect, it } from "vitest";
import { stripInlineMarkup, stripUnsupportedMarkup } from "@/lib/text/markup";

describe("stripUnsupportedMarkup", () => {
  it("strips the <scp> small-caps tag scholarly metadata embeds (the VigiBase case)", () => {
    expect(
      stripUnsupportedMarkup(
        "Consciousness Disturbances Reported With Clindamycin Versus Cefazolin in Surgical Patients: A Global Pharmacovigilance Analysis Using <scp>VigiBase</scp>",
      ),
    ).toBe(
      "Consciousness Disturbances Reported With Clindamycin Versus Cefazolin in Surgical Patients: A Global Pharmacovigilance Analysis Using VigiBase",
    );
  });

  it("KEEPS the tags citeproc renders (<i>, <b>, <sup>, <sub>)", () => {
    expect(stripUnsupportedMarkup("Role of <i>TP53</i> in cancer")).toBe(
      "Role of <i>TP53</i> in cancer",
    );
    expect(stripUnsupportedMarkup("H<sub>2</sub>O and the n<sup>th</sup> term")).toBe(
      "H<sub>2</sub>O and the n<sup>th</sup> term",
    );
    expect(stripUnsupportedMarkup("A <b>bold</b> claim")).toBe("A <b>bold</b> claim");
  });

  it("normalizes kept tags to lower-case and drops their attributes", () => {
    expect(stripUnsupportedMarkup('Role of <I class="x">TP53</I>')).toBe("Role of <i>TP53</i>");
    expect(stripUnsupportedMarkup('<sub foo="bar">2</sub>')).toBe("<sub>2</sub>");
  });

  it("strips OTHER inline tags citeproc can't use, keeping inner text", () => {
    expect(stripUnsupportedMarkup('<italic toggle="yes">Escherichia coli</italic> growth')).toBe(
      "Escherichia coli growth",
    );
    expect(stripUnsupportedMarkup("Small <sc>caps</sc> and a <span>span</span>")).toBe(
      "Small caps and a span",
    );
    expect(stripUnsupportedMarkup("MathML <mml:math><mml:mi>x</mml:mi></mml:math> term")).toBe(
      "MathML x term",
    );
  });

  it("decodes the core HTML entities (named + numeric)", () => {
    expect(stripUnsupportedMarkup("Risk &amp; benefit")).toBe("Risk & benefit");
    expect(stripUnsupportedMarkup("&#945;-synuclein and &#x3b2;-amyloid")).toBe(
      "α-synuclein and β-amyloid",
    );
    expect(stripUnsupportedMarkup("a&nbsp;b")).toBe("a b");
  });

  it("does NOT eat a real less-than / inequality (no matching tag shape)", () => {
    // "< 0.05" is not a tag (a space, not a letter, follows "<"): must survive.
    expect(stripUnsupportedMarkup("Mortality at p < 0.05 in the cohort")).toBe(
      "Mortality at p < 0.05 in the cohort",
    );
    // Digit after "<" is not a tag either.
    expect(stripUnsupportedMarkup("Children aged <5 years")).toBe("Children aged <5 years");
  });

  it("collapses whitespace left by stripped tags and trims", () => {
    expect(stripUnsupportedMarkup("  The <scp>  loud</scp>   shout  ")).toBe("The loud shout");
  });

  it("leaves clean plain text unchanged", () => {
    expect(stripUnsupportedMarkup("A study of adverse drug reactions")).toBe(
      "A study of adverse drug reactions",
    );
  });

  it("leaves an unknown named entity as-is (no regression, just not decoded)", () => {
    expect(stripUnsupportedMarkup("Heart&dagger;failure")).toBe("Heart&dagger;failure");
  });

  it("leaves an out-of-range / control numeric entity literal", () => {
    // Code point 0 is below the printable guard (0x20) → left as written.
    expect(stripUnsupportedMarkup("null&#0;byte")).toBe("null&#0;byte");
  });

  it("handles empty / whitespace-only input", () => {
    expect(stripUnsupportedMarkup("")).toBe("");
    expect(stripUnsupportedMarkup("   ")).toBe("");
  });
});

describe("stripInlineMarkup", () => {
  it("flattens EVERY inline tag to plain text — even citeproc-renderable ones", () => {
    // Unlike stripUnsupportedMarkup, the renderable <i>/<sub>/… are dropped too,
    // for surfaces that can't render any tag (BibTeX, JSON Résumé, banners).
    expect(stripInlineMarkup("Role of <i>TP53</i> in <scp>NSCLC</scp>")).toBe(
      "Role of TP53 in NSCLC",
    );
    expect(stripInlineMarkup("H<sub>2</sub>O at p < 0.05")).toBe("H2O at p < 0.05");
  });

  it("still decodes entities, preserves inequalities, and trims", () => {
    expect(stripInlineMarkup("Risk &amp; benefit, n > 30")).toBe("Risk & benefit, n > 30");
    expect(stripInlineMarkup("  plain  text  ")).toBe("plain text");
  });
});
