import { describe, expect, it } from "vitest";
import { RESEARCH_CONSENT_VERSION } from "@/lib/research/consent";
import {
  MIN_SALT_LENGTH,
  PRE_REGISTERED_EVENT_TYPES,
  buildKeyTable,
  buildResearchExport,
  exportableSubjects,
  pseudonymise,
  researchExportGate,
  toJsonl,
  type ResearchSubjectInput,
} from "@/lib/research/export";

const SALT = "x".repeat(MIN_SALT_LENGTH); // a valid-length test salt
const V = RESEARCH_CONSENT_VERSION;

function subject(
  userId: string,
  events: ResearchSubjectInput["events"],
  consent = true,
  version: number | null = V,
  secondaryUse: boolean | null = false,
): ResearchSubjectInput {
  return {
    userId,
    researchConsent: consent,
    researchConsentVersion: version,
    secondaryUse,
    events,
  };
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
        {
          type: "curation_correction",
          payload: { itemId: "i1" },
          createdAt: at("2026-01-01T00:00:00Z"),
        },
        {
          type: "composition_snapshot",
          payload: { template: "modern" },
          createdAt: at("2026-01-02T00:00:00Z"),
        },
      ]),
    ];
    const rows = buildResearchExport(subjects, SALT);
    expect(rows).toHaveLength(2);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain("user_a"); // pseudonymised
    expect(rows[0]!.subject).toBe(pseudonymise("user_a", SALT));
    expect(rows[0]!.consentVersion).toBe(V);
    expect(rows.map((r) => r.eventType)).toEqual(["curation_correction", "composition_snapshot"]);
  });

  it("pseudonymises work identifiers (DOI / sourceId) so no raw value leaks", () => {
    const subjects = [
      subject("user_a", [
        {
          type: "curation_correction",
          payload: {
            itemId: "it_1",
            sourceId: "W4300000001",
            from: true,
            to: false,
            meta: { year: 2023, type: "article", doi: "10.1136/bmj.314.7079.497" },
          },
          createdAt: at("2026-01-01T00:00:00Z"),
        },
      ]),
    ];
    const rows = buildResearchExport(subjects, SALT);
    const serialized = JSON.stringify(rows);
    // No raw DOI / OpenAlex source id / item id reaches the analyst dataset…
    expect(serialized).not.toContain("10.1136/bmj.314.7079.497");
    expect(serialized).not.toContain("W4300000001");
    expect(serialized).not.toContain("it_1");
    // …but non-identifying signal is preserved, and the pseudonymised DOI is the
    // consistent keyed-HMAC token.
    const payload = rows[0]!.payload as { meta: { doi: string; year: number }; sourceId: string };
    expect(payload.meta.year).toBe(2023);
    expect(payload.meta.doi).toBe(pseudonymise("10.1136/bmj.314.7079.497", SALT));
    expect(payload.sourceId).toBe(pseudonymise("W4300000001", SALT));
  });

  it("passes a null / non-object payload through unchanged", () => {
    const subjects = [
      subject("user_a", [
        { type: "composition_snapshot", payload: null, createdAt: at("2026-01-01T00:00:00Z") },
      ]),
    ];
    expect(buildResearchExport(subjects, SALT)[0]!.payload).toBeNull();
  });

  it("drops non-consenting subjects (defence in depth)", () => {
    const subjects = [
      subject(
        "user_a",
        [{ type: "curation_correction", payload: {}, createdAt: at("2026-01-01T00:00:00Z") }],
        false,
      ),
    ];
    expect(buildResearchExport(subjects, SALT)).toEqual([]);
  });

  it("drops event types that are not pre-registered", () => {
    const subjects = [
      subject("user_a", [
        { type: "page_view", payload: {}, createdAt: at("2026-01-01T00:00:00Z") },
        {
          type: "disambiguation_assertion",
          payload: { asserted: true },
          createdAt: at("2026-01-03T00:00:00Z"),
        },
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

describe("buildKeyTable (対照表 — the personal-information manager's key)", () => {
  const at = (iso: string) => new Date(iso);
  const events = [
    { type: "curation_correction", payload: {}, createdAt: at("2026-01-01T00:00:00Z") },
  ];

  it("maps each consenting subject's pseudonym to its identity, joining the dataset on `subject`", () => {
    const subjects: ResearchSubjectInput[] = [
      {
        userId: "user_a",
        researchConsent: true,
        researchConsentVersion: V,
        secondaryUse: true,
        identity: {
          name: "Ada L",
          email: "ada@example.org",
          orcid: "0000-0002-7483-2489",
          consentAt: at("2026-01-01T09:00:00Z"),
        },
        events,
      },
    ];
    const key = buildKeyTable(subjects, SALT);
    expect(key).toHaveLength(1);
    // The key's `subject` equals the de-identified dataset's pseudonym — they join.
    expect(key[0]!.subject).toBe(pseudonymise("user_a", SALT));
    expect(buildResearchExport(subjects, SALT)[0]!.subject).toBe(key[0]!.subject);
    expect(key[0]!).toMatchObject({
      userId: "user_a",
      name: "Ada L",
      email: "ada@example.org",
      orcid: "0000-0002-7483-2489",
      consentVersion: V,
      consentAt: "2026-01-01T09:00:00.000Z",
      secondaryUse: true,
    });
  });

  it("drops non-consenting subjects (defence in depth)", () => {
    const subjects: ResearchSubjectInput[] = [
      {
        userId: "user_a",
        researchConsent: false,
        researchConsentVersion: V,
        secondaryUse: null,
        events,
      },
    ];
    expect(buildKeyTable(subjects, SALT)).toEqual([]);
  });

  it("tolerates missing identity fields and a missing grant record (nulls), never throwing", () => {
    const subjects: ResearchSubjectInput[] = [
      {
        userId: "user_a",
        researchConsent: true,
        researchConsentVersion: V,
        secondaryUse: null,
        events,
      },
    ];
    const key = buildKeyTable(subjects, SALT);
    expect(key[0]!).toMatchObject({
      name: null,
      email: null,
      orcid: null,
      consentVersion: V,
      consentAt: null,
      secondaryUse: null,
    });
  });

  it("sorts by subject for reproducible output, and handles empty input", () => {
    const mk = (id: string): ResearchSubjectInput => ({
      userId: id,
      researchConsent: true,
      researchConsentVersion: V,
      secondaryUse: false,
      identity: { name: id },
      events,
    });
    const key = buildKeyTable([mk("user_b"), mk("user_a")], SALT);
    const subjects0 = key.map((r) => r.subject);
    expect(subjects0).toEqual([...subjects0].sort((a, b) => a.localeCompare(b)));
    expect(buildKeyTable([], SALT)).toEqual([]);
  });
});

describe("approved consent only: the current RESEARCH_CONSENT_VERSION, with checkbox ②", () => {
  const at = (iso: string) => new Date(iso);
  const events = [
    { type: "curation_correction", payload: {}, createdAt: at("2026-01-01T00:00:00Z") },
  ];

  it.each([
    ["the notice shown before approval (version 1)", 1],
    ["a version newer than this code knows", V + 1],
    ["no version", null],
  ])("drops a subject who consented under %s, from both outputs", (_label, version) => {
    const subjects = [subject("user_old", events, true, version, true)];
    expect(exportableSubjects(subjects)).toEqual([]);
    expect(buildResearchExport(subjects, SALT)).toEqual([]);
    expect(buildKeyTable(subjects, SALT)).toEqual([]);
  });

  it("keeps only the current-version subjects of a mixed cohort, the same ones in both outputs", () => {
    const subjects = [
      subject("user_v1", events, true, 1),
      subject("user_now", events, true, V),
      subject("user_withdrawn", events, false, null),
    ];
    expect(exportableSubjects(subjects).map((s) => s.userId)).toEqual(["user_now"]);
    const only = pseudonymise("user_now", SALT);
    expect(buildResearchExport(subjects, SALT).map((r) => r.subject)).toEqual([only]);
    expect(buildKeyTable(subjects, SALT).map((r) => r.subject)).toEqual([only]);
  });

  it("carries checkbox ② on every row of a subject and in the key table, null when unknown", () => {
    const twoEvents = [
      ...events,
      { type: "composition_snapshot", payload: {}, createdAt: at("2026-01-02T00:00:00Z") },
    ];
    const subjects = [
      subject("user_yes", twoEvents, true, V, true),
      subject("user_no", events, true, V, false),
      subject("user_unknown", events, true, V, null),
    ];
    const rows = buildResearchExport(subjects, SALT);
    const rowsOf = (id: string) =>
      rows.filter((r) => r.subject === pseudonymise(id, SALT)).map((r) => r.secondaryUse);
    expect(rowsOf("user_yes")).toEqual([true, true]);
    expect(rowsOf("user_no")).toEqual([false]);
    expect(rowsOf("user_unknown")).toEqual([null]);

    const key = new Map(buildKeyTable(subjects, SALT).map((r) => [r.subject, r.secondaryUse]));
    expect(key.get(pseudonymise("user_yes", SALT))).toBe(true);
    expect(key.get(pseudonymise("user_no", SALT))).toBe(false);
    expect(key.get(pseudonymise("user_unknown", SALT))).toBeNull();
  });

  it("adds only consent fields to the de-identified rows, never the identity", () => {
    const subjects: ResearchSubjectInput[] = [
      {
        ...subject("user_a", events, true, V, true),
        identity: {
          name: "Ada Lovelace",
          email: "ada@example.org",
          orcid: "0000-0002-7483-2489",
          consentAt: at("2026-01-01T09:00:00Z"),
        },
      },
    ];
    const rows = buildResearchExport(subjects, SALT);
    expect(Object.keys(rows[0]!).sort()).toEqual([
      "at",
      "consentVersion",
      "eventType",
      "payload",
      "secondaryUse",
      "subject",
    ]);
    const serialized = JSON.stringify(rows);
    for (const identifying of [
      "Ada Lovelace",
      "ada@example.org",
      "0000-0002-7483-2489",
      "user_a",
      "2026-01-01T09:00:00",
    ]) {
      expect(serialized).not.toContain(identifying);
    }
  });
});

describe("toJsonl", () => {
  it("returns empty string for no rows", () => {
    expect(toJsonl([])).toBe("");
  });
  it("emits one JSON object per line with a trailing newline", () => {
    const out = toJsonl([
      {
        subject: "p1",
        consentVersion: 1,
        eventType: "composition_snapshot",
        at: "2026-01-01T00:00:00.000Z",
        payload: { a: 1 },
      },
      {
        subject: "p2",
        consentVersion: 2,
        eventType: "curation_correction",
        at: "2026-01-02T00:00:00.000Z",
        payload: { b: 2 },
      },
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
    const g = researchExportGate({
      RESEARCH_EXPORT_ENABLED: "true",
      RESEARCH_EXPORT_PSEUDONYM_SALT: SALT,
    });
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
      "duplicate_dismissal",
    ]);
  });
});
