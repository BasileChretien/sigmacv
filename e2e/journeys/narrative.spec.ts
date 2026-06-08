import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

// A recognizable, unique body string we can grep for in the rendered preview,
// the persisted canonical document, and the published public page.
const MARKER = "NARRATIVE_E2E_MARKER";
// The en-US default title of the `narrative-knowledge` prose section, which is
// also the label of its "Add a section" button (prefixed with "+ ").
const SECTION_TITLE = "Contributions to the generation of knowledge";

test("prose section → add from menu → type body → save → preview → publish", async ({
  page,
  context,
  authedUserId,
}) => {
  await page.goto("/cv");
  // Editor loaded: the "Add a section" menu offers the prose-section button.
  const addBtn = page.getByRole("button", { name: `+ ${SECTION_TITLE}` });
  await expect(addBtn).toBeVisible();

  // 1. Add the "Contributions to the generation of knowledge" prose section from
  //    the "Add a section" menu. Adding a single-instance section auto-expands it.
  await addBtn.click();

  // The section card appears, expanded, with its prose textarea.
  const proseBody = page.locator("textarea.prose-body").first();
  await expect(proseBody).toBeVisible();

  // 2. Type a recognizable body into the prose textarea.
  await proseBody.fill(MARKER);

  // 3. Save and wait for the save to settle (the polite status region shows
  //    "Saved." once `/api/cv` PATCH resolves).
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // The prose section is persisted to the canonical document with the marker body.
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    const sec = parsed.data.sections.find((s) => s.type === "narrative-knowledge");
    expect(sec?.body).toBe(MARKER);
  }

  // 4. The rendered preview (sandboxed srcDoc iframe) shows the prose section:
  //    its heading and the marker body.
  const preview = page.frameLocator("iframe.cv-preview-frame");
  await expect(preview.locator(".cv-prose")).toContainText(SECTION_TITLE);
  await expect(preview.locator(".cv-prose")).toContainText(MARKER);

  // 5. Publish, then assert the marker appears on the public page WITHOUT auth
  //    (the public page renders the same canonical prose section).
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
  await expect(anonPage.locator("body")).toContainText(SECTION_TITLE);
  await expect(anonPage.locator("body")).toContainText(MARKER);
  await anon.close();
});
