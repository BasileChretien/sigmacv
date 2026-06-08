import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique },
    researchEvent: { createMany: mocks.createMany },
  },
}));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, setItemNotMine } from "@/lib/canonical/curate";
import { logCvSave } from "@/lib/research/log";
import { isResearchLoggingEnabled } from "@/lib/research/enabled";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const base = () => buildCanonicalCv({ id: "cv", resolved, works, now: "2026-06-02T00:00:00.000Z" });

beforeEach(() => {
  mocks.findUnique.mockReset();
  mocks.createMany.mockReset().mockResolvedValue({ count: 0 });
  // The logging cases below assume the programme is ON; the default-off state is
  // covered by its own test.
  process.env.RESEARCH_LOGGING_ENABLED = "true";
});

afterEach(() => {
  delete process.env.RESEARCH_LOGGING_ENABLED;
});

describe("isResearchLoggingEnabled", () => {
  it("is off unless RESEARCH_LOGGING_ENABLED is exactly 'true'", () => {
    delete process.env.RESEARCH_LOGGING_ENABLED;
    expect(isResearchLoggingEnabled()).toBe(false);
    process.env.RESEARCH_LOGGING_ENABLED = "false";
    expect(isResearchLoggingEnabled()).toBe(false);
    process.env.RESEARCH_LOGGING_ENABLED = "1";
    expect(isResearchLoggingEnabled()).toBe(false);
    process.env.RESEARCH_LOGGING_ENABLED = "true";
    expect(isResearchLoggingEnabled()).toBe(true);
  });
});

describe("logCvSave", () => {
  it("writes nothing without consent", async () => {
    mocks.findUnique.mockResolvedValue({ researchConsent: false });
    await logCvSave("u1", base(), base());
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("writes nothing while the programme is paused, even with consent", async () => {
    delete process.env.RESEARCH_LOGGING_ENABLED; // default: paused (no IRB yet)
    mocks.findUnique.mockResolvedValue({ researchConsent: true });
    const prev = base();
    const next = setItemNotMine(prev, "publications", "W4300000003", true, {
      now: "2026-06-02T00:00:00.000Z",
    });
    await logCvSave("u1", prev, next);
    expect(mocks.createMany).not.toHaveBeenCalled();
    // short-circuits before it even reads the consent flag
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("logs a hide as curation_correction + a composition snapshot (with consent)", async () => {
    mocks.findUnique.mockResolvedValue({ researchConsent: true });
    const prev = base();
    const next = setItemIncluded(prev, "publications", "W4300000001", false);
    await logCvSave("u1", prev, next);
    const events = mocks.createMany.mock.calls[0]![0].data as Array<{ type: string }>;
    const types = events.map((e) => e.type);
    expect(types).toContain("curation_correction");
    expect(types).toContain("composition_snapshot");
    expect(types).not.toContain("disambiguation_assertion");
  });

  it("logs a 'not mine' flip as a distinct disambiguation_assertion", async () => {
    mocks.findUnique.mockResolvedValue({ researchConsent: true });
    const prev = base();
    const next = setItemNotMine(prev, "publications", "W4300000003", true, {
      now: "2026-06-02T00:00:00.000Z",
    });
    await logCvSave("u1", prev, next);
    const events = mocks.createMany.mock.calls[0]![0].data as Array<{ type: string }>;
    expect(events.map((e) => e.type)).toContain("disambiguation_assertion");
  });

  it("never throws even if the DB write fails", async () => {
    mocks.findUnique.mockResolvedValue({ researchConsent: true });
    mocks.createMany.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(logCvSave("u1", base(), base())).resolves.toBeUndefined();
  });
});
