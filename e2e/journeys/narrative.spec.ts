import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

// A recognizable, unique body string we can grep for in the rendered preview,
// the persisted canonical document, and the published public page.
const MARKER = "NARRATIVE_E2E_MARKER";
// A custom heading we type over the seeded default ("Personal statement").
const HEADING = "About my research (E2E)";

test("narrative editor → seed → edit → save → preview → publish", async ({
  page,
  context,
  authedUserId,
}) => {
  await page.goto("/cv");
  // Editor loaded (unambiguous: the Narrative CV panel this spec drives —
  // plain getByText("Publications") matches several control labels).
  await expect(page.getByRole("group", { name: "Narrative CV" })).toBeVisible();

  // 1. Open the Narrative panel and seed the standard modules. With no modules
  //    yet, the "Add narrative section" control (en-US `narrativeAdd`) is shown;
  //    clicking it seeds the six funder-résumé modules (heading + empty body).
  const panel = page.locator(".narrative-editor");
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Add narrative section" }).click();

  // The modules appear; the first is the "Personal statement" module.
  const firstModule = page.locator(".narrative-module").first();
  await expect(firstModule).toBeVisible();

  // 2. Edit the first module's heading (aria-label "Heading") and type a
  //    recognizable body into its textarea (`.narrative-body`).
  const headingInput = firstModule.getByRole("textbox", { name: "Heading" });
  await headingInput.fill(HEADING);
  await firstModule.locator("textarea.narrative-body").fill(MARKER);

  // 3. Save and wait for the save to settle (the polite status region shows
  //    "Saved." once `/api/cv` PATCH resolves).
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // The narrative is persisted to the canonical document with the edited
  // heading + marker body.
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    const mod = (parsed.data.narrative ?? []).find((m) => m.heading === HEADING);
    expect(mod?.body).toBe(MARKER);
  }

  // 4. The rendered preview (sandboxed srcDoc iframe) shows the narrative block
  //    above the sections: the edited heading and the marker body.
  const preview = page.frameLocator("iframe.cv-preview-frame");
  await expect(preview.locator(".cv-narrative")).toContainText(HEADING);
  await expect(preview.locator(".cv-narrative")).toContainText(MARKER);

  // 5. Publish, then assert the marker appears on the public page WITHOUT auth
  //    (the public page renders the same canonical narrative block).
  // Publish is async (the checkbox reflects server state after /api/cv/publish),
  // so click + wait for the resulting "View" link rather than asserting the
  // checkbox flips synchronously.
  await page.getByRole("checkbox", { name: /Public page/i }).click();
  // After publish the "open page" link (href /p/<slug>) appears — match by href
  // so the assertion is locale-independent.
  await expect(page.locator('a[href^="/p/"]')).toBeVisible();

  const published = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(published?.published).toBe(true);
  const slug = published?.publicSlug;
  expect(slug).toBeTruthy();

  const anon = await context.browser()!.newContext();
  const anonPage = await anon.newPage();
  const res = await anonPage.goto(`/p/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(anonPage.locator("body")).toContainText(HEADING);
  await expect(anonPage.locator("body")).toContainText(MARKER);
  await anon.close();
});
