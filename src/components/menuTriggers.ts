/**
 * Deep links into the top-bar popovers from elsewhere in the editor. A popover's
 * panel is unmounted while its menu is closed, so the always-present trigger is
 * clicked first, then the target is looked up across a few frames once the
 * panel has mounted. Used by the institution prompt and the worklist's
 * "Institution listing" line ("Change" → the Publish menu's institution
 * sub-section; "Versions" → the Versions menu).
 */

/** The Publish menu's trigger (see `PublishMenu`). */
export const PUBLISH_TRIGGER = ".publish-trigger";
/** The Versions menu's trigger (see `VersionsMenu`). */
export const VERSIONS_TRIGGER = ".versions-trigger";
/** The institution sub-section inside the Publish menu (see `PublishControls`). */
export const PUBLISH_INSTITUTION_ANCHOR = "#publish-institution";

const MAX_FRAMES = 5;

/**
 * Open the menu behind `triggerSelector` (if it is closed) and, when
 * `targetSelector` is given, scroll to and focus that element once it exists.
 * A missing trigger is a no-op (a test render, or a surface without the bar).
 */
export function openTopBarMenu(triggerSelector: string, targetSelector?: string): void {
  const trigger = document.querySelector<HTMLButtonElement>(triggerSelector);
  if (!trigger) return;
  if (trigger.getAttribute("aria-expanded") !== "true") trigger.click();
  if (!targetSelector) return;
  let tries = 0;
  const focusTarget = () => {
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (target) {
      // jsdom implements no layout: scrollIntoView may be absent there.
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      target.focus();
    } else if (tries++ < MAX_FRAMES) {
      window.requestAnimationFrame(focusTarget);
    }
  };
  window.requestAnimationFrame(focusTarget);
}
