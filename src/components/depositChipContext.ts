"use client";

import { createContext, useContext } from "react";
import type { DepositChip } from "@/lib/archiving/depositChips";

/**
 * What a publication row needs to show its deposit chip: the chips the editor
 * computed for the owner, and the reverse jump into the Open access tab. The
 * editor provides this for the OWNER only — with no provider (the anonymous
 * preview, a bare SectionsList) a row reads `null` and shows no chip, so the
 * owner-only invariant holds by construction rather than by a flag on each row.
 */
export interface DepositChips {
  chips: ReadonlyMap<string, DepositChip>;
  /** Switch to the Open access tab and bring this work's worklist row into view. */
  jumpToWorklist: (itemId: string) => void;
}

export const DepositChipsContext = createContext<DepositChips | null>(null);

export const useDepositChips = (): DepositChips | null => useContext(DepositChipsContext);
