import { expect, type Page } from "@playwright/test";

/**
 * Helpers for reaching controls in the `/cv` editor.
 *
 * The editor's left panel is split into region tabs and **`profile` is the one
 * active on load**, so anything in another region carries `hidden` until its tab
 * is clicked — `.sections-list`, `.cv-item-row` and the add-section buttons live
 * in `content`, and `StyleControls` (template, public style, CV-model picker) in
 * `design`. Publishing moved into a top-bar popover, so its controls are not in
 * the DOM at all until the menu opens.
 *
 * Specs written before that restructure asserted on those controls straight
 * after `goto("/cv")` and failed with "element(s) not found" — the app was fine,
 * the journeys just described a flatter layout than the one that now exists.
 *
 * Anchor on ids and stable classes, never on the tab labels: those are localized
 * across ten locales, while `#cv-part-tab-*` / `#cv-part-panel-*` are not.
 */
export type EditorPart = "profile" | "design" | "content";

/** Activate an editor region and wait for its panel to be revealed. */
export async function openEditorPart(page: Page, part: EditorPart): Promise<void> {
  const tab = page.locator(`#cv-part-tab-${part}`);
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page.locator(`#cv-part-panel-${part}`)).toBeVisible();
}

/**
 * Open the top-bar Publish popover and click the publish/unpublish toggle.
 *
 * The toggle only exists while the popover is open, so this re-opens it on every
 * call — publishing and later unpublishing are two separate interactions.
 */
export async function togglePublish(page: Page): Promise<void> {
  const trigger = page.locator(".publish-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();
  const toggle = page.getByTestId("publish-toggle");
  await expect(toggle).toBeVisible();
  await toggle.click();
}

/**
 * The section titles currently rendered in the editor, top to bottom. Reads the
 * `.section-title` inputs, which is the only DOM-visible ordering key: the
 * `Reorder.Item` `value` is the section id and never reaches the markup.
 */
export async function sectionTitles(page: Page): Promise<string[]> {
  return page
    .locator(".section-card input.section-title")
    .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
}
