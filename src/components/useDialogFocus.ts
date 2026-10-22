"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/**
 * Modal focus handling for a dialog that is mounted while open: move focus
 * into it once, keep Tab inside it (WCAG 2.1.2), call `onEscape` on Escape,
 * and give focus back to what had it when the dialog unmounts (WCAG 2.4.3).
 * The dialog element itself needs `tabIndex={-1}`.
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, onEscape: () => void): void {
  // The latest handler, read at key time: a new function on each render must
  // not re-run the effect (that would pull focus back to the dialog).
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      const dialog = ref.current;
      if (!dialog) return;
      if (e.key === "Escape") {
        e.preventDefault();
        escapeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first || !last) {
        e.preventDefault();
        dialog.focus();
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [ref]);
}
