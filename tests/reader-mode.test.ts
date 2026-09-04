import { describe, expect, it } from "vitest";
import { DisplayChoicesSchema, type DisplayChoices } from "@/lib/canonical/schema";
import {
  READER_MODE_KEYS,
  READER_MODE_OFF_KEYS,
  applyReaderMode,
  isReaderModeKey,
} from "@/lib/render/readerMode";

/** Owner defaults: every reader-mode key off, metrics off, nothing chosen. */
function defaults(over: Partial<DisplayChoices> = {}): DisplayChoices {
  return { ...DisplayChoicesSchema.parse({}), ...over };
}

describe("reader-mode preset (applyReaderMode)", () => {
  it("forces every READER_MODE_KEYS entry on and every READER_MODE_OFF_KEYS entry off", () => {
    const out = applyReaderMode(defaults({ hideRetracted: true }));
    for (const k of READER_MODE_KEYS) expect(out[k], k).toBe(true);
    for (const k of READER_MODE_OFF_KEYS) expect(out[k], k).toBe(false);
  });

  it("lists exactly the trust/context toggles (and hideRetracted as the one forced off)", () => {
    expect([...READER_MODE_KEYS]).toEqual([
      "showProvenance",
      "showVerifiedBadges",
      "showOpenAccess",
      "showCitationCounts",
      "showResearchAreas",
      "showAuthorRole",
    ]);
    expect([...READER_MODE_OFF_KEYS]).toEqual(["hideRetracted"]);
  });

  it("every forced-on key is an owner toggle that defaults OFF (reader mode only ever reveals)", () => {
    const d = DisplayChoicesSchema.parse({});
    for (const k of READER_MODE_KEYS) expect(d[k], k).toBe(false);
  });

  it("never mutates the input display (returns a new object)", () => {
    const input = defaults();
    const snapshot = structuredClone(input);
    const out = applyReaderMode(input);
    expect(out).not.toBe(input);
    expect(input).toEqual(snapshot);
  });

  it("leaves showMetrics and the metrics selection exactly as the owner set them", () => {
    const off = applyReaderMode(defaults({ showMetrics: false, metrics: [] }));
    expect(off.showMetrics).toBe(false);
    expect(off.metrics).toEqual([]);
    const on = applyReaderMode(defaults({ showMetrics: true, metrics: ["rcr_mean"] }));
    expect(on.showMetrics).toBe(true);
    expect(on.metrics).toEqual(["rcr_mean"]);
  });

  it("pins the profile OA share to the owner's effective choice before forcing the per-work badge", () => {
    // Unset share + badges off → the share stays OFF even though showOpenAccess
    // is now forced on (the render-time `??` fallback must not surface a figure).
    const inherited = applyReaderMode(defaults({ showOpenAccess: false }));
    expect(inherited.showOpenAccess).toBe(true);
    expect(inherited.showOpenAccessShare).toBe(false);
    // Owner already showed both → both stay on.
    const shown = applyReaderMode(defaults({ showOpenAccess: true }));
    expect(shown.showOpenAccessShare).toBe(true);
    // An explicit share choice is respected either way.
    expect(applyReaderMode(defaults({ showOpenAccessShare: true })).showOpenAccessShare).toBe(true);
    expect(
      applyReaderMode(defaults({ showOpenAccess: true, showOpenAccessShare: false }))
        .showOpenAccessShare,
    ).toBe(false);
  });

  it("passes every other choice through untouched (template, style, locale, exclusions, opt-in flag)", () => {
    const input = defaults({
      template: "sidebar",
      publicStyle: "folio",
      locale: "fr-FR",
      accentColor: "#0f766e",
      excludedItems: { publications: ["w1"] },
      allowReaderMode: true,
      showCharts: true,
    });
    const out = applyReaderMode(input);
    expect(out.template).toBe("sidebar");
    expect(out.publicStyle).toBe("folio");
    expect(out.locale).toBe("fr-FR");
    expect(out.accentColor).toBe("#0f766e");
    expect(out.excludedItems).toEqual({ publications: ["w1"] });
    expect(out.allowReaderMode).toBe(true);
    expect(out.showCharts).toBe(true);
    // Still a valid DisplayChoices document.
    expect(DisplayChoicesSchema.safeParse(out).success).toBe(true);
  });

  it("is idempotent", () => {
    const once = applyReaderMode(defaults());
    expect(applyReaderMode(once)).toEqual(once);
  });
});

describe("isReaderModeKey", () => {
  it("recognises the forced-on and forced-off keys and nothing else", () => {
    expect(isReaderModeKey("showProvenance")).toBe(true);
    expect(isReaderModeKey("showAuthorRole")).toBe(true);
    expect(isReaderModeKey("hideRetracted")).toBe(true);
    expect(isReaderModeKey("showMetrics")).toBe(false);
    expect(isReaderModeKey("allowReaderMode")).toBe(false);
    expect(isReaderModeKey("")).toBe(false);
  });
});
