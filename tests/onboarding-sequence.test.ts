import { describe, expect, it } from "vitest";
import {
  ONBOARDING_PRIORITY,
  selectOnboardingStep,
  type OnboardingActivity,
} from "@/lib/onboardingSequence";

const activity = (over: Partial<OnboardingActivity> = {}): OnboardingActivity => ({
  syncReport: false,
  coachmark: false,
  institution: false,
  ...over,
});

describe("selectOnboardingStep", () => {
  it("returns null when no prompt is active", () => {
    expect(selectOnboardingStep(activity())).toBeNull();
  });

  it("shows the highest-priority active prompt (sync report wins)", () => {
    expect(
      selectOnboardingStep(activity({ syncReport: true, coachmark: true, institution: true })),
    ).toBe("syncReport");
  });

  it("falls through to the coachmark when the sync report is inactive", () => {
    expect(selectOnboardingStep(activity({ coachmark: true, institution: true }))).toBe(
      "coachmark",
    );
  });

  it("the institution ask is last: it shows only when nothing else is on screen", () => {
    expect(selectOnboardingStep(activity({ institution: true }))).toBe("institution");
    expect(selectOnboardingStep(activity({ coachmark: true }))).toBe("coachmark");
  });

  it("documents the priority order: sync report → coachmark → institution", () => {
    expect([...ONBOARDING_PRIORITY]).toEqual(["syncReport", "coachmark", "institution"]);
  });
});
