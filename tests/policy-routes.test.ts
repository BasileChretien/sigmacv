import { describe, expect, it } from "vitest";
import { chooseRoute, type RouteJudge } from "@/lib/archiving/policyRoutes";
import type { PolicyRoute } from "@/lib/oaworks/client";

/** Which of a journal's routes an article is shown (Open Policy Finder records several). */
describe("chooseRoute", () => {
  const PUBLISHED_12: PolicyRoute = {
    versions: ["publishedVersion"],
    embargoMonths: 12,
    locations: ["Institutional Repository"],
  };
  const ACCEPTED_0: PolicyRoute = {
    versions: ["acceptedVersion"],
    embargoMonths: 0,
    locations: ["Any Repository"],
  };
  const judge = (openMonths: number, fit: RouteJudge["fit"] = () => 1): RouteJudge => ({
    openToday: (months) => months <= openMonths,
    fit,
  });

  it("offers a recent article the route open today, and an older one the most final version", () => {
    expect(chooseRoute([PUBLISHED_12, ACCEPTED_0], judge(0))).toBe(ACCEPTED_0);
    expect(chooseRoute([PUBLISHED_12, ACCEPTED_0], judge(24))).toBe(PUBLISHED_12);
  });

  it("puts where the deposit goes before the version: a Zenodo deposit is not shown an institutional-only route", () => {
    const zenodo = (locations: readonly string[]) =>
      locations.some((l) => /any repository/i.test(l)) ? 1 : 0;
    expect(chooseRoute([PUBLISHED_12, ACCEPTED_0], judge(24, zenodo))).toBe(ACCEPTED_0);
  });

  it("with no route open yet, shows the one that opens first", () => {
    const published24: PolicyRoute = { ...PUBLISHED_12, embargoMonths: 24 };
    const accepted6: PolicyRoute = { ...ACCEPTED_0, embargoMonths: 6 };
    expect(chooseRoute([published24, accepted6], judge(2))).toBe(accepted6);
  });

  it("breaks the remaining ties by the shorter embargo, then more places", () => {
    const a: PolicyRoute = { versions: ["acceptedVersion"], embargoMonths: 6, locations: ["X"] };
    const b: PolicyRoute = { ...a, embargoMonths: 0 };
    const c: PolicyRoute = { ...b, locations: ["X", "Y"] };
    expect(chooseRoute([a, b], judge(12))).toBe(b);
    expect(chooseRoute([b, c], judge(12))).toBe(c);
  });

  it("has nothing to choose from no route", () => {
    expect(chooseRoute([], judge(0))).toBeUndefined();
  });
});
