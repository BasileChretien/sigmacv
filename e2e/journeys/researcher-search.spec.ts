import { expect, test } from "@playwright/test";
import { TEST_ORCID } from "../fixtures/seed";

/**
 * The public lookup: a name → a row (name, affiliation, ORCID mark, no figure)
 * → the automatic preview. The fixture OpenAlex server answers `/authors` with
 * the seeded author for any query, so the round trip is deterministic.
 */
test("search by name lists an ORCID-bearing researcher and links the preview, nofollow", async ({
  page,
}) => {
  await page.goto("/search");
  await expect(page.getByText("not how they score")).toBeVisible();
  await page.getByTestId("search-input").fill("Chrétien");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/search\?q=/);
  const result = page.getByTestId("search-result").first();
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute("href", `/preview/${TEST_ORCID}`);
  await expect(result).toHaveAttribute("rel", "nofollow");
  await expect(result).toContainText("Chrétien");
  await expect(result).toContainText("ORCID iD");
  // No figure on the row: the fixture author carries works/citation counts and
  // an h-index, none of which may appear.
  await expect(result).not.toContainText(/1500|h-index|works/);
  // A result page is never indexable.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await result.click();
  await expect(page).toHaveURL(new RegExp(`/preview/${TEST_ORCID}$`));
});

test("a malformed query is refused before any lookup, and the bare page stays indexable", async ({
  page,
}) => {
  await page.goto("/search?q=a,b");
  await expect(page.getByTestId("search-invalid")).toBeVisible();
  await expect(page.getByTestId("search-result")).toHaveCount(0);
  await page.goto("/search");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
