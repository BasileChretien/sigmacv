import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Helpers for reaching controls in the `/cv` editor.
 *
 * Two restructures broke the assumptions the journeys were written against:
 *
 * 1. The editor's left panel is split into region tabs and **`profile` is the
 *    one active on load**, so anything in another region carries `hidden` until
 *    its tab is clicked — `.sections-list`, `.cv-item-row` and the add-section
 *    buttons live in `content`, and `StyleControls` (template, public style,
 *    CV-model picker) in `design`.
 * 2. The top bar moved to popovers. `publish-toggle` lives in the Publish
 *    popover and the `/p/<slug>` links in the *separate* Share popover, so
 *    neither is in the DOM until its own menu is opened.
 *
 * Anchor on ids and stable classes, never on the tab or menu labels: those are
 * localized across ten locales, while `#cv-part-tab-*`, `#cv-part-panel-*`,
 * `.publish-trigger` and `.share-trigger` are not.
 */
export type EditorPart = "profile" | "design" | "content";

/**
 * Click through until the assertion holds.
 *
 * `page.goto()` resolves on load, but these are client components: a click that
 * lands before hydration is simply dropped, with no error and nothing to wait
 * for — which is why the pre-fix runs failed *intermittently*, some retries
 * reaching several assertions further than others. Retrying the click is the
 * only reliable defence.
 */
async function clickUntil(target: Locator, settled: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await target.click();
    await settled();
  }).toPass({ timeout: 15_000, intervals: [250, 500, 1000] });
}

/** Activate an editor region and wait for its panel to be revealed. */
export async function openEditorPart(page: Page, part: EditorPart): Promise<void> {
  const tab = page.locator(`#cv-part-tab-${part}`);
  await expect(tab).toBeVisible();
  const panel = page.locator(`#cv-part-panel-${part}`);
  await clickUntil(tab, () => expect(panel).toBeVisible({ timeout: 1_000 }));
}

/** Open the top-bar Publish popover and reveal its controls. */
export async function openPublishMenu(page: Page): Promise<void> {
  const trigger = page.locator(".publish-trigger");
  await expect(trigger).toBeVisible();
  const toggle = page.getByTestId("publish-toggle");
  await clickUntil(trigger, () => expect(toggle).toBeVisible({ timeout: 1_000 }));
}

/**
 * Flip the publish/unpublish toggle and wait for the round trip to settle.
 *
 * The toggle only exists while the Publish popover is open, so the menu is
 * re-opened on every call — publishing and later unpublishing are two separate
 * interactions.
 */
export async function togglePublish(page: Page, expectPublished: boolean): Promise<void> {
  await openPublishMenu(page);
  const toggle = page.getByTestId("publish-toggle");
  await toggle.click();
  // The checkbox reflects server state, so this waits out /api/cv/publish.
  await expect(toggle).toBeChecked({ checked: expectPublished, timeout: 15_000 });
}

/**
 * Open the Share popover and return the link to the public page.
 *
 * `ShareControls` renders more than one `/p/<slug>` anchor (the URL itself and
 * an "open" button), so this is scoped to the first — the journeys only need one
 * to prove the page is reachable.
 */
export async function publicPageLink(page: Page): Promise<Locator> {
  const trigger = page.locator(".share-trigger");
  await expect(trigger).toBeVisible();
  const link = page.locator('.share-panel a[href^="/p/"]').first();
  await clickUntil(trigger, () => expect(link).toBeVisible({ timeout: 1_000 }));
  return link;
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
