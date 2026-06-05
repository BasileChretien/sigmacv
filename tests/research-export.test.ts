import { describe, expect, it } from "vitest";
import {
  MIN_SALT_LENGTH,
  PRE_REGISTERED_EVENT_TYPES,
  buildResearchExport,
  pseudonymise,
  researchExportGate,
  toJsonl,
  type ResearchSubjectInput,
} from "@/lib/research/export";

const SALT = "x".repeat(MIN_SALT_LENGTH); // a valid-length test salt

function subject(
  userId: string,
  events: ResearchSubjectInput["events"],
  consent = true,
  version: number | null = 1,
): ResearchSubjectInput {
  return { userId, researchConsent: consent, researchConsentVersion: version, events };
}

describe("pseudonymise", () => {
  it("is deterministic for the same (userId, salt)", () => {
    expect(pseudonymise("user_a", SALT)).toBe(pseudonymise("user_a", SALT));
  });
  it("differs by user and by salt, and never returns the raw id", () => {
    expect(pseudonymise("user_a", SALT)).not.toBe(pseudonymise("user_b", SALT));
    expect(pseudonymise("user_a", SALT)).not.toBe(pseudonymise("user_a", "y".repeat(20)));
    expect(pseudonymise("user_a", SALT)).not.toContain("user_a");
  });
  it("throws without a salt (never silently un-pseudonymises)", () => {
    expect(() => pseudonymise("user_a", "")).toThrow(/salt/i);
  });
});

describe("buildResearchExport", () => {
  const at = (iso: string) => new Date(iso);

  it("emits one pseudonymous row per pre-registered event, with no direct id", () => {
    const subjects = [
      subject("user_a", [
        { type: "curation_correction", payload: { itemId: "i1" }, createdAt: at("2026-01-01T00:00:00Z") },
        { type: "composition_snapshot", payload: { template: "modern" }, createdAt: at("2026-01-02T00:00:00Z") },
      ]),
    ];
    const rows = buildResearchExport(subjects, SALT);
    expect(rows).toHaveLength(2);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain("user_a"); // pseudonymised
    expect(rows[0]!.subject).toBe(pseudonymise("user_a", SALT));
    expect(rows[0]!.consentVersion).toBe(1);
    expect(rows.map((r) => r.eventType)).toEqual(["curation_correction", "composition_snapshot"]);
  });

  it("drops non-consenting subjects (defence in depth)", () => {
    const subjects = [
      subject("user_a", [
        { type: "curation_correction", payload: {}, createdAt: at("2026-01-01T00:00:00Z") },
      ], false),
    ];
    expect(buildResearchExport(subjects, SALT)).toEqual([]);
  });

  it("drops event types that are not pre-registered", () => {
    const subjects = [
      subject("user_a", [
        { type: "page_view", payload: {}, createdAt: at("2026-01-01T00:00:00Z") },
        { type: "disambiguation_assertion", payload: { asserted: true }, createdAt: at("2026-01-03T00:00:00Z") },
      ]),
    ];
    const rows = buildResearchExport(subjects, SALT);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.eventType).toBe("disambiguation_assertion");
  });

  it("sorts by subject then time for reproducible output", () => {
    // Two subjects whose pseudonyms order deterministically; assert global sort.
    const subjects = [
      subject("user_b", [
        { type: "composition_snapshot", payload: { n: 2 }, createdAt: at("2026-01-05T00:00:00Z") },
        { type: "composition_snapshot", payload: { n: 1 }, createdAt: at("2026-01-04T00:00:00Z") },
      ]),
      subject("user_a", [
        { type: "composition_snapshot", payload: { n: 3 }, createdAt: at("2026-01-01T00:00:00Z") },
      ]),
    ];
    const rows = buildResearchExport(subjects, SALT);
    // within a subject, ascending time
    const bySubject = new Map<string, string[]>();
    for (const r of rows) bySubject.set(r.subject, [...(bySubject.get(r.subject) ?? []), r.at]);
    for (const times of bySubject.values()) {
      expect(times).toEqual([...times].sort((a, b) => a.localeCompare(b)));
    }
    // globally, subjects are grouped (non-decreasing pseudonym)
    const subjects0 = rows.map((r) => r.subject);
    expect(subjects0).toEqual([...subjects0].sort((a, b) => a.localeCompare(b)));
  });

  it("handles an empty input", () => {
    expect(buildResearchExport([], SALT)).toEqual([]);
  });
});

describe("toJsonl", () => {
  it("returns empty string for no rows", () => {
    expect(toJsonl([])).toBe("");
  });
  it("emits one JSON object per line with a trailing newline", () => {
    const out = toJsonl([
      { subject: "p1", consentVersion: 1, eventType: "composition_snapshot", at: "2026-01-01T00:00:00.000Z", payload: { a: 1 } },
      { subject: "p2", consentVersion: 2, eventType: "curation_correction", at: "2026-01-02T00:00:00.000Z", payload: { b: 2 } },
    ]);
    const lines = out.split("\n");
    expect(lines).toHaveLength(3); // 2 rows + trailing ""
    expect(lines[2]).toBe("");
    expect(JSON.parse(lines[0]!).subject).toBe("p1");
    expect(JSON.parse(lines[1]!).eventType).toBe("curation_correction");
  });
});

describe("researchExportGate (hard, off by default)", () => {
  it("is disabled when the master flag is absent", () => {
    const g = researchExportGate({});
    expect(g.enabled).toBe(false);
    if (!g.enabled) expect(g.reason).toMatch(/RESEARCH_EXPORT_ENABLED/);
  });

  it("is disabled when the flag is set but the IRB ref is missing", () => {
    const g = researchExportGate({ RESEARCH_EXPORT_ENABLED: "true", RESEARCH_EXPORT_PSEUDONYM_SALT: SALT });
    expect(g.enabled).toBe(false);
    if (!g.enabled) expect(g.reason).toMatch(/IRB_REF/);
  });

  it("is disabled when the salt is too short", () => {
    const g = researchExportGate({
      RESEARCH_EXPORT_ENABLED: "true",
      RESEARCH_EXPORT_IRB_REF: "2026-OBS-001",
      RESEARCH_EXPORT_PSEUDONYM_SALT: "short",
    });
    expect(g.enabled).toBe(false);
    if (!g.enabled) expect(g.reason).toMatch(/SALT/);
  });

  it("is enabled only when all three are satisfied", () => {
    const g = researchExportGate({
      RESEARCH_EXPORT_ENABLED: "true",
      RESEARCH_EXPORT_IRB_REF: "  2026-OBS-001  ",
      RESEARCH_EXPORT_PSEUDONYM_SALT: SALT,
    });
    expect(g.enabled).toBe(true);
    if (g.enabled) {
      expect(g.irbRef).toBe("2026-OBS-001"); // trimmed
      expect(g.salt).toBe(SALT);
    }
  });

  it("keeps the pre-registered type list in a known, stable shape", () => {
    expect([...PRE_REGISTERED_EVENT_TYPES]).toEqual([
      "curation_correction",
      "disambiguation_assertion",
      "composition_snapshot",
    ]);
  });
});
