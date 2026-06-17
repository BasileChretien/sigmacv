"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PopoverGroupValue {
  /** `panelId` of the single open popover, or null when all are closed. */
  openId: string | null;
  /** Open `id` (closing any sibling), or pass null to close everything. */
  setOpenId: (id: string | null) => void;
}

const PopoverGroupContext = createContext<PopoverGroupValue | null>(null);

/** Read the enclosing popover group, or null when a `Popover` is used standalone. */
export function usePopoverGroup(): PopoverGroupValue | null {
  return useContext(PopoverGroupContext);
}

/**
 * Coordinates a cluster of sibling `Popover`s (the top-bar Publish / Share /
 * Account menus) so that:
 *   1. at most ONE is open at a time — opening one closes the others, and
 *   2. a single transparent scrim catches outside clicks, *including clicks over
 *      the CV preview*. That preview is a sandboxed `<iframe>`; a pointer event
 *      inside it never crosses the frame boundary, so the per-popover
 *      document-level listener can't see it and the menu would otherwise stay
 *      open over the largest, most natural click target on screen.
 *
 * The scrim is rendered as a *sibling* of the top bar (not a portal) so the two
 * compare z-index in one stacking context: the bar sits ABOVE the scrim, which
 * keeps every trigger directly clickable (switching menus stays a single
 * gesture), while the scrim sits above the page + preview to absorb the dismiss
 * click. It mounts only while a menu is open, so the editor is untouched when
 * everything is closed. It is invisible by design — these are non-modal
 * popovers over a live document, so there is no dim or blur. Escape, the
 * explicit ✕, and the document outside-click listener all still apply.
 */
export default function PopoverGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <PopoverGroupContext.Provider value={{ openId, setOpenId }}>
      {children}
      {openId !== null ? (
        <div className="popover-scrim" aria-hidden="true" onPointerDown={() => setOpenId(null)} />
      ) : null}
    </PopoverGroupContext.Provider>
  );
}
