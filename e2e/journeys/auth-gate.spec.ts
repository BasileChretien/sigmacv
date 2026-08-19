import { expect, test } from "@playwright/test";

test("unauthenticated /cv redirects to the landing page", async ({ page }) => {
  await page.goto("/cv");
  await expect(page).toHaveURL(/\/$/);
  // The landing page offers ORCID sign-in more than once (hero + the "Build your
  // CV from the open…" CTA section), so an unscoped locator is a strict-mode
  // violation. This gate only cares that the redirect lands somewhere offering it.
  await expect(page.getByRole("button", { name: /Sign in with ORCID/i }).first()).toBeVisible();
});

test("an unknown public slug returns 404", async ({ request }) => {
  const res = await request.get("/p/does-not-exist-slug");
  expect(res.status()).toBe(404);
});
