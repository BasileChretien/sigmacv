import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";
import { openEditorPart } from "../fixtures/editor";

test("curate → save → persist → export", async ({ page, authedUserId }) => {
  await page.goto("/cv");
  await openEditorPart(page, "content");

  // Expand the Publications section if collapsed, then hide its first item.
  const expand = page.getByRole("button", { name: "Expand section" }).first();
  if (await expand.isVisible().catch(() => false)) await expand.click();
  const firstRow = page.locator(".cv-item-row").first();
  // Two controls in a row carry a "Hide" accessible name, so scope to the first.
  await firstRow.getByRole("button", { name: "Hide" }).first().click();

  // Save and confirm.
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // The change is persisted to the canonical document.
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    const anyHidden = parsed.data.sections.some((s) => s.items.some((i) => i.included === false));
    expect(anyHidden).toBe(true);
  }

  // Export Markdown and check the downloaded file.
  await page.locator(".export-format").selectOption("markdown");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Export$/ }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
});

test("PDF export returns a real PDF", async ({ page, authedUserId }) => {
  expect(authedUserId).toBeTruthy(); // activates the authed-session fixture
  await page.goto("/cv");
  // Editor loaded. The export controls live in the top bar, outside the region
  // tabs, so they are the readiness gate for a journey that only needs the API.
  await expect(page.locator(".export-format")).toBeVisible();
  await page.locator(".export-format").selectOption("pdf");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Export$/ }).click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  const head = Buffer.concat(chunks).subarray(0, 5).toString("latin1");
  expect(head).toBe("%PDF-");
});
