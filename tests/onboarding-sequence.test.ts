import { describe, expect, it } from "vitest";
import { ONBOARDING_PRIORITY, selectOnboardingStep } from "@/lib/onboardingSequence";

describe("selectOnboardingStep", () => {
  it("returns null when no prompt is active", () => {
    expect(
      selectOnboardingStep({ syncReport: false, coachmark: false, publishNudge: false }),
    ).toBeNull();
  });

  it("shows the highest-priority active prompt (sync report wins)", () => {
    expect(selectOnboardingStep({ syncReport: true, coachmark: true, publishNudge: true })).toBe(
      "syncReport",
    );
  });

  it("falls through to the coachmark when the sync report is inactive", () => {
    expect(selectOnboardingStep({ syncReport: false, coachmark: true, publishNudge: true })).toBe(
      "coachmark",
    );
  });

  it("falls through to the publish nudge last", () => {
    expect(selectOnboardingStep({ syncReport: false, coachmark: false, publishNudge: true })).toBe(
      "publishNudge",
    );
  });

  it("documents the priority order: sync report → coachmark → publish nudge", () => {
    expect([...ONBOARDING_PRIORITY]).toEqual(["syncReport", "coachmark", "publishNudge"]);
  });
});
