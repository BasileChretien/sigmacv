import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";
import { togglePublish } from "../fixtures/editor";
import { TEST_ORCID } from "../fixtures/seed";

/**
 * The no-login preview as a THIRD PARTY sees it.
 *
 * The preview builds from the fixture OpenAlex server (the same ~20-source
 * build the signed-in sync runs; the other sources fail soft), so the journey
 * gives it the sync's generous budget. What it pins:
 *  - the page tells the visitor it is an automatic, unreviewed build and shows
 *    no figure about the person: no metrics group, no chart / citation-count /
 *    indicator toggles, no "most cited" sort;
 *  - the two calls to action are split: "this is my record" (sign in) versus
 *    "know this researcher?" (copy the link);
 *  - once the researcher has published an INDEXABLE page, the preview points at
 *    it — and not before (a published-but-unindexed page is never linked).
 */
test.describe.configure({ timeout: 180_000 });

test("anonymous preview: automatic-build banner, split CTAs, no figures", async ({ context }) => {
  const anon = await context.browser()!.newContext();
  const page = await anon.newPage();
  await page.goto(`/preview/${TEST_ORCID}`);

  // The live build settles into the interactive workspace.
  const banner = page.getByTestId("preview-banner");
  await expect(banner).toBeVisible({ timeout: 150_000 });
  await expect(banner).toContainText("Automatic preview");
  await expect(banner).toContainText("not how they score");
  await expect(page.getByTestId("preview-published-link")).toHaveCount(0);

  // Split CTAs: owner path and third-party path.
  await expect(page.getByRole("button", { name: /This is my record/ })).toBeVisible();
  await expect(page.getByTestId("preview-copy-link")).toBeVisible();

  // No figure about the person anywhere in the editor.
  await expect(page.getByText("Metrics & authorship")).toHaveCount(0);
  await expect(page.getByLabel(/citation counts/i)).toHaveCount(0);
  await expect(page.locator('option[value="citations"]')).toHaveCount(0);

  await anon.close();
});

test("preview links the researcher's published page only once it is indexable", async ({
  page,
  context,
  authedUserId,
}) => {
  await page.goto("/cv");
  await togglePublish(page, true);
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(row?.published).toBe(true);
  expect(row?.publicSlug).toBeTruthy();

  // Published but NOT indexable: the preview must not reveal the page.
  await db.cv.update({ where: { userId: authedUserId }, data: { publicIndexable: false } });
  const anon = await context.browser()!.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(`/preview/${TEST_ORCID}`);
  await expect(anonPage.getByTestId("preview-banner")).toBeVisible({ timeout: 150_000 });
  await expect(anonPage.getByTestId("preview-published-link")).toHaveCount(0);

  // Indexable: the preview points at the published page.
  await db.cv.update({ where: { userId: authedUserId }, data: { publicIndexable: true } });
  await anonPage.goto(`/preview/${TEST_ORCID}`);
  const link = anonPage.getByTestId("preview-published-link");
  await expect(link).toBeVisible({ timeout: 150_000 });
  await expect(link).toHaveAttribute("href", `/p/${row!.publicSlug}`);
  await expect(anonPage.getByTestId("preview-banner")).toContainText("Curated by the researcher");
  await anon.close();
});
