import type { PolicyRoute } from "@/lib/oaworks/client";

/**
 * Which of a journal's self-archiving routes (Open Policy Finder records them by
 * journal) an article is shown. The owner sync stores a default with the record;
 * the worklist row picks again once it knows where its action deposits
 * (`depositNow.ts` `withRouteFor`) — the destination depends on the owner's
 * choices on the page, which the sync does not see.
 */
export interface RouteJudge {
  /** Whether an embargo of this many months has run for the article today. */
  openToday(embargoMonths: number): boolean;
  /** How well the route's places suit where the deposit goes; higher is better. */
  fit(locations: readonly string[]): number;
}

const FINALITY = ["submittedVersion", "acceptedVersion", "publishedVersion"] as const;
const finality = (route: PolicyRoute) =>
  FINALITY.indexOf(route.versions[route.versions.length - 1]!);

/**
 * The route to show: one the article can take today first. Among those, the
 * one that best fits the place, then the most final version, then the shorter
 * embargo, then more places. Among routes not open yet, the one that opens
 * first. So a recent article is offered the accepted manuscript now rather than
 * the publisher's PDF next year, and a deposit bound for Zenodo is not shown a
 * route that allows only an institutional repository. Undefined for no route.
 */
export function chooseRoute<R extends PolicyRoute>(
  routes: readonly R[],
  judge: RouteJudge,
): R | undefined {
  const open = (route: R) => (judge.openToday(route.embargoMonths) ? 1 : 0);
  return [...routes].sort((a, b) => {
    const byOpen = open(b) - open(a);
    if (byOpen !== 0) return byOpen;
    const sooner = a.embargoMonths - b.embargoMonths;
    const fit = judge.fit(b.locations) - judge.fit(a.locations);
    const final = finality(b) - finality(a);
    const places = b.locations.length - a.locations.length;
    return open(a) ? fit || final || sooner || places : sooner || fit || final || places;
  })[0];
}
