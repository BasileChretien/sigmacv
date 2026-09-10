import { expect, test } from "@playwright/test";

/**
 * The homepage's front door: one box that takes a name or an ORCID iD and
 * opens the matching no-login surface. No OAuth, no account.
 */
test.describe("see it first", () => {
  test("a name goes to the lookup with the query carried over", async ({ page }) => {
    await page.goto("/");
    const box = page.getByTestId("see-it-first");
    await expect(box).toBeVisible();
    await box.getByRole("textbox").fill("Basile Chrétien");
    await box.getByRole("button").click();
    await expect(page).toHaveURL(/\/search\?q=Basile%20Chr%C3%A9tien$/);
    // The URL carries the visitor's casing; the page shows the lookup's normalised query.
    await expect(page.getByTestId("search-input")).toHaveValue(/^basile chrétien$/i);
  });

  test("an ORCID iD goes straight to the preview", async ({ page }) => {
    await page.goto("/");
    const box = page.getByTestId("see-it-first");
    await box.getByRole("textbox").fill("https://orcid.org/0000-0002-1825-0097");
    await box.getByRole("button").click();
    await expect(page).toHaveURL(/\/preview\/0000-0002-1825-0097$/);
  });

  test("an unusable input explains itself and stays put", async ({ page }) => {
    await page.goto("/");
    const box = page.getByTestId("see-it-first");
    await box.getByRole("textbox").fill("ab");
    await box.getByRole("button").click();
    await expect(box.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
