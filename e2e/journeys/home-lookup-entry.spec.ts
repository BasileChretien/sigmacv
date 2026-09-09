import { expect, test } from "@playwright/test";

/** The homepage's quiet entry to the lookup leads to /search. */
test("the homepage links the researcher lookup under the preview form", async ({ page }) => {
  await page.goto("/");
  const link = page.getByTestId("home-lookup-link");
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/search");
  await link.click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByText("not how they score")).toBeVisible();
});
