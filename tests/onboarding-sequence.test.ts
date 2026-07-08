import { describe, expect, it } from "vitest";
import { ONBOARDING_PRIORITY, selectOnboardingStep } from "@/lib/onboardingSequence";

describe("selectOnboardingStep", () => {
  it("returns null when no prompt is active", () => {
    expect(selectOnboardingStep({ syncReport: false, coachmark: false })).toBeNull();
  });

  it("shows the highest-priority active prompt (sync report wins)", () => {
    expect(selectOnboardingStep({ syncReport: true, coachmark: true })).toBe("syncReport");
  });

  it("falls through to the coachmark when the sync report is inactive", () => {
    expect(selectOnboardingStep({ syncReport: false, coachmark: true })).toBe("coachmark");
  });

  it("documents the priority order: sync report → coachmark", () => {
    expect([...ONBOARDING_PRIORITY]).toEqual(["syncReport", "coachmark"]);
  });
});
