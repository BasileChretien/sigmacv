import { expect, test } from "../fixtures/auth";
import { TEST_ORCID } from "../fixtures/seed";

/**
 * The signed-in half of the objection route: an account holder hides the
 * no-login preview of their own ORCID iD from the account menu, and an
 * anonymous visitor then gets the "no public record" notice for that iD —
 * exactly what an unknown iD gets, nothing that says "objected". Switching it
 * back on restores the preview. (The non-user half needs a live ORCID round
 * trip through the objection provider and is covered by unit tests.)
 */
test.describe.configure({ timeout: 180_000 });

test("account toggle hides the anonymous preview and shows it again", async ({ page, context }) => {
  await page.goto("/cv");
  await page.locator("button.account-trigger").click();
  const toggle = page.getByTestId("preview-suppression-toggle");
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked({ timeout: 15_000 });

  const anon = await context.browser()!.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(`/preview/${TEST_ORCID}`);
  // The suppressed iD is answered as an unknown one: the empty notice, no build.
  await expect(anonPage.locator(".preview-empty h1")).toBeVisible({ timeout: 60_000 });
  await expect(anonPage.getByTestId("preview-banner")).toHaveCount(0);
  await anon.close();

  await toggle.click();
  await expect(toggle).not.toBeChecked({ timeout: 15_000 });
  const anon2 = await context.browser()!.newContext();
  const anonPage2 = await anon2.newPage();
  await anonPage2.goto(`/preview/${TEST_ORCID}`);
  await expect(anonPage2.getByTestId("preview-banner")).toBeVisible({ timeout: 150_000 });
  await anon2.close();
});
