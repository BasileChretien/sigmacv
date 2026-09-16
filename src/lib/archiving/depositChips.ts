import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { openAccessStates } from "@/lib/cv/worklist";
import {
  depositActionKind,
  depositRoutes,
  type DepositActionKind,
  type DepositContext,
} from "./depositRoutes";

/**
 * The deposit chip on a publication row in the editor's Content tab: the one
 * deposit action's destination, and how far the record lets the chip's verb go.
 * `kind` "conditional" = the record allows no deposit outright, so the chip says
 * "if allowed" — the words never go beyond what the worklist row says either.
 */
export interface DepositChip {
  destination: string;
  kind: DepositActionKind;
}

/** A closed journal article gets a deposit chip; nothing else does. */
export function depositCandidate(item: CvItem | undefined): CvItem | undefined {
  return item?.csl?.type === "article-journal" ? item : undefined;
}

/**
 * One chip per countable journal article with no open copy found, keyed by
 * item id — the same rows, routes and rule the owner worklist shows, so a chip
 * on a row and the action in the Open access tab never disagree. Read by the
 * editor for the OWNER only: the anonymous preview computes none.
 */
export function depositChips(
  cv: CanonicalCv,
  ctx: DepositContext,
): ReadonlyMap<string, DepositChip> {
  const itemsById = new Map<string, CvItem>(
    cv.sections.flatMap((s) => s.items).map((it) => [it.id, it]),
  );
  const chips = new Map<string, DepositChip>();
  for (const row of openAccessStates(cv).rows) {
    if (row.state !== "no-open-copy-found") continue;
    const item = depositCandidate(itemsById.get(row.itemId));
    if (!item) continue;
    const [primary] = depositRoutes(cv, item, ctx);
    /* v8 ignore next -- Zenodo closes every route list; kept for the type. */
    if (!primary) continue;
    chips.set(row.itemId, {
      destination: primary.destination,
      kind: depositActionKind(item, primary),
    });
  }
  return chips;
}
