import type { CanonicalCv } from "@/lib/canonical/schema";
import { depositCandidate, depositReadyRows } from "./depositNow";
import { depositActionKind, type DepositActionKind, type DepositContext } from "./depositRoutes";

export { depositCandidate };

/**
 * The deposit chip on a publication row in the editor's Content tab: the one
 * deposit action's destination, and how far the ground lets the chip's verb go.
 * `kind` "conditional" = the record allows no deposit outright at that place,
 * so the chip says "if allowed" — the words never go beyond what the worklist
 * row says either. A statutory ground names the accepted manuscript outright.
 */
export interface DepositChip {
  destination: string;
  kind: DepositActionKind;
}

/**
 * One chip per journal article the owner can deposit today, keyed by item id —
 * the same rows, routes and ground the owner worklist shows, so a chip on a row
 * and the action in the Open access tab never disagree. Read by the editor for
 * the OWNER only: the anonymous preview computes none.
 */
export function depositChips(
  cv: CanonicalCv,
  ctx: DepositContext,
  today: string,
): ReadonlyMap<string, DepositChip> {
  const chips = new Map<string, DepositChip>();
  for (const { row, item, now, routes } of depositReadyRows(cv, today, ctx)) {
    const primary = routes[0]!;
    chips.set(row.itemId, {
      destination: primary.destination,
      kind: now.basis === "statute" ? "version" : depositActionKind(item, primary),
    });
  }
  return chips;
}
