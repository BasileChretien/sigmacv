import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  FIELD_NORMALIZED_METRICS,
  METRICS_CROWDING_THRESHOLD,
  metricHint,
  metricsCrowdingNote,
  metricsNudge,
} from "@/lib/i18n/metricHints";
import { METRIC_KEYS } from "@/lib/render/metrics";

describe("metricHint", () => {
  it("returns the field-normalised hint only for FWCI/RCR, the raw hint otherwise", () => {
    expect(metricHint("en-US", "fwci_mean")).toContain("Field-normalised");
    expect(metricHint("en-US", "rcr_mean")).toContain("Field-normalised");
    expect(metricHint("en-US", "h_index")).toContain("Not field-normalised");
    expect(metricHint("en-US", "cited_by_count")).toContain("Not field-normalised");
  });

  it("falls back to English for an unknown locale", () => {
    expect(metricHint("xx-XX", "fwci_mean")).toBe(metricHint("en-US", "fwci_mean"));
  });

  it("has a non-empty normalised + raw hint for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(metricHint(loc, "fwci_mean").length).toBeGreaterThan(0);
      expect(metricHint(loc, "h_index").length).toBeGreaterThan(0);
      // the two hints must differ (distinct guidance per category)
      expect(metricHint(loc, "fwci_mean")).not.toBe(metricHint(loc, "h_index"));
    }
  });

  it("covers every metric in the catalog (every key resolves to a hint)", () => {
    for (const key of METRIC_KEYS) {
      expect(metricHint("en-US", key).length).toBeGreaterThan(0);
    }
    // the field-normalised set is a subset of the catalog
    for (const key of FIELD_NORMALIZED_METRICS) {
      expect(METRIC_KEYS).toContain(key);
    }
  });
});

describe("metricsNudge / metricsCrowdingNote (metrics onboarding copy)", () => {
  it("gives a non-empty, DORA-referencing framing nudge for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const n = metricsNudge(loc);
      expect(n.length).toBeGreaterThan(0);
      // "DORA" must appear verbatim so the editor can linkify it (MetricsNoteText).
      expect(n).toContain("DORA");
    }
  });

  it("gives a non-empty crowding caution for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(metricsCrowdingNote(loc).length).toBeGreaterThan(0);
      // distinct guidance from the framing nudge
      expect(metricsCrowdingNote(loc)).not.toBe(metricsNudge(loc));
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(metricsNudge("xx-XX")).toBe(metricsNudge("en-US"));
    expect(metricsCrowdingNote("xx-XX")).toBe(metricsCrowdingNote("en-US"));
  });

  it("uses a metrics-heavy threshold above a sensible one-or-two-metric header", () => {
    expect(METRICS_CROWDING_THRESHOLD).toBeGreaterThanOrEqual(3);
  });
});
