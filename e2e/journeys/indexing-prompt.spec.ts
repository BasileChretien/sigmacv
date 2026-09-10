import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";
import { togglePublish } from "../fixtures/editor";

/**
 * Indexing as an active choice: publishing puts ONE inline question in front
 * of the owner — nothing pre-ticked, "Not now" sends nothing and is remembered
 * for the page, "Yes" flips indexing on with one request.
 */
test.describe.configure({ timeout: 180_000 });

test("publish → the indexing question → Not now is remembered → Yes switches indexing on", async ({
  page,
  authedUserId,
}) => {
  await page.goto("/cv");
  await togglePublish(page, true);
  // Close the Publish popover so the inline card is reachable.
  await page.keyboard.press("Escape");

  const prompt = page.getByTestId("indexing-prompt");
  await expect(prompt).toBeVisible({ timeout: 15_000 });
  await expect(prompt).toContainText("Should search engines index your page?");
  await expect(prompt.locator("input[type=checkbox]")).toHaveCount(0);

  // "Not now": nothing posted, indexing stays off, and a reload does not re-ask.
  await prompt.getByTestId("indexing-prompt-not-now").click();
  await expect(prompt).toHaveCount(0);
  let row = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(row?.published).toBe(true);
  expect(row?.publicIndexable).toBe(false);
  await page.reload();
  await expect(page.getByTestId("indexing-prompt")).toHaveCount(0);
  // The worklist keeps the open choice visible.
  await expect(page.getByTestId("worklist-indexing")).toContainText(/Off/);

  // Forget the answer (a fresh page would): the question comes back, "Yes" works.
  await page.evaluate(() => {
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith("sigmacv:indexing-prompt-v1:")) window.localStorage.removeItem(k);
    }
  });
  await page.reload();
  const again = page.getByTestId("indexing-prompt");
  await expect(again).toBeVisible({ timeout: 15_000 });
  await again.getByTestId("indexing-prompt-yes").click();
  await expect(again.getByRole("status")).toContainText("may now index", { timeout: 15_000 });
  row = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(row?.publicIndexable).toBe(true);
  await expect(page.getByTestId("worklist-indexing")).toContainText(/On/);
});
