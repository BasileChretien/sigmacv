"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { t } from "@/lib/i18n";
import { usePopoverGroup } from "./PopoverGroup";

interface PopoverProps {
  /** Locale for the built-in close button's accessible label. */
  locale: string;
  /** Trigger button content (icon / avatar / label). */
  trigger: ReactNode;
  /** Trigger button class (defaults to a ghost button). */
  triggerClassName?: string;
  /** Accessible name for the trigger (use when the trigger is icon-only). */
  triggerAriaLabel?: string;
  triggerTitle?: string;
  /** Accessible name for the dialog panel. */
  panelLabel: string;
  panelClassName?: string;
  /** Which edge of the panel aligns to the trigger. */
  align?: "start" | "end";
  /** Panel content; receives a `close()` it can call (e.g. after an action). */
  children: (close: () => void) => ReactNode;
}

/**
 * Accessible disclosure popover. The trigger is a `aria-haspopup="dialog"`
 * button; the panel is a non-modal `role="dialog"` (NOT a `role="menu"` — these
 * panels hold form fields like checkboxes and inputs, which a menu's roving
 * focus model would break). Closes on outside pointer-down and on Escape, and
 * restores focus to the trigger on Escape. An open modal (e.g. the delete
 * `alertdialog` nested inside) takes Escape precedence and suppresses the
 * outside-click dismissal automatically (it lives inside the panel subtree).
 * The open/close transition is gated behind `prefers-reduced-motion`.
 *
 * Inside a `PopoverGroup` the open state is hoisted to the group so only one
 * sibling is open at a time and a shared scrim dismisses clicks the document
 * listener can't see (over the preview `<iframe>`); used standalone it falls
 * back to its own local open state. The document outside-click listener is kept
 * regardless — it covers clicks on the top bar itself, which sits above the
 * scrim.
 */
export default function Popover({
  locale,
  trigger,
  triggerClassName,
  triggerAriaLabel,
  triggerTitle,
  panelLabel,
  panelClassName,
  align = "end",
  children,
}: PopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduce = useReducedMotion();

  // Open state lives in the enclosing PopoverGroup when present (one-open
  // invariant + shared scrim); otherwise it's local to this instance.
  const group = usePopoverGroup();
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === panelId : localOpen;
  const setOpen = (next: boolean) => {
    if (group) group.setOpenId(next ? panelId : null);
    else setLocalOpen(next);
  };

  const close = () => setOpen(false);
  // Close and hand focus back to the trigger — used by the explicit ✕ so a
  // keyboard user lands back on a sensible control instead of `document.body`.
  const closeAndFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      // Let a nested modal (the delete-account alertdialog) own Escape first.
      if (e.key === "Escape" && !document.querySelector('[role="alertdialog"]')) {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="popover" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={triggerClassName ?? "btn btn-ghost"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label={panelLabel}
            className={`popover-panel popover-${align}${panelClassName ? ` ${panelClassName}` : ""}`}
            initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            // Exit is quicker than enter and eased simply: the user already
            // decided to leave, so the panel retracts toward its trigger (see
            // `transform-origin` on .popover-end/.popover-start) without lingering.
            exit={
              reduce
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: -4,
                    scale: 0.98,
                    transition: { duration: 0.11, ease: "easeOut" },
                  }
            }
            transition={{ duration: reduce ? 0 : 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Explicit, always-visible dismiss. Outside-click and Escape still
                work, but a discoverable ✕ means the panel is never a trap —
                notably for the Publish panel, whose most prominent row is the
                (un)publish toggle, not a way out. */}
            <button
              type="button"
              className="popover-close"
              aria-label={t(locale, "close")}
              onClick={closeAndFocus}
            >
              <span aria-hidden="true">✕</span>
            </button>
            {children(close)}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
