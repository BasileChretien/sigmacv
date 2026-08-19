import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";
import { openEditorPart, sectionTitles } from "../fixtures/editor";

/**
 * Drag-to-reorder is the CV editor's only interaction with NO other coverage:
 * unit tests can't reach it (jsdom has neither real pointer events nor layout),
 * and `curate.test.ts` exercises the pure `reorderSections()` function, not the
 * drag. So a Motion upgrade could silently break section reordering — which is
 * exactly the exposure left open when motion went 12.x -> 13.x.
 *
 * Two properties are worth pinning, because they are what the implementation
 * deliberately arranges (`SectionsList.tsx`):
 *   1. dragging the ⠿ handle reorders, and the new order PERSISTS through save;
 *   2. dragging the card body does NOT — `dragListener={false}` exists so the
 *      title input and the buttons inside each card stay clickable.
 */

/**
 * Drag vertically from `from` to `toY` in small steps.
 *
 * Motion's `Reorder` tracks a pointer gesture: it needs a sequence of
 * `pointermove` events to register a drag at all, so a single jump to the
 * destination usually does nothing. The short waits keep each step in its own
 * frame, which is what the animation loop samples.
 */
async function dragVertically(
  page: import("@playwright/test").Page,
  from: { x: number; y: number },
  toY: number,
  steps = 14,
): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x, from.y + ((toY - from.y) * i) / steps);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

async function centreOf(locator: import("@playwright/test").Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("element has no bounding box (is it visible?)");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

/**
 * The seeded CV renders a single section (only the sections that actually have
 * items are built), and reordering needs two. Add a prose section through the
 * same "Add a section" button the narrative journey uses — a supported user
 * action, so the test sets up its own state rather than depending on seed shape.
 */
const EXTRA_SECTION = "Contributions to the generation of knowledge";

async function ensureTwoSections(page: import("@playwright/test").Page): Promise<string[]> {
  if ((await sectionTitles(page)).length < 2) {
    await page.getByRole("button", { name: `+ ${EXTRA_SECTION}` }).click();
    await expect.poll(async () => (await sectionTitles(page)).length).toBeGreaterThan(1);
  }
  return sectionTitles(page);
}

test("drag a section by its handle → order changes and persists", async ({
  page,
  authedUserId,
}) => {
  await page.goto("/cv");
  await openEditorPart(page, "content");
  await expect(page.locator(".sections-list")).toBeVisible();

  const before = await ensureTwoSections(page);
  expect(before.length, "need at least two sections to reorder").toBeGreaterThan(1);

  // Drag the first card's handle down past the second card. `dragListener` is
  // off, so the gesture MUST start on the handle; the handle is aria-hidden, so
  // it is only reachable by class.
  const firstCard = page.locator(".section-card").first();
  const secondCard = page.locator(".section-card").nth(1);
  const handle = await centreOf(firstCard.locator(".drag-handle"));
  const target = await centreOf(secondCard);
  await dragVertically(page, { x: handle.x, y: handle.y }, target.box.y + target.box.height * 0.8);

  // The spring settles asynchronously, so poll rather than assert immediately.
  await expect
    .poll(async () => (await sectionTitles(page))[0], {
      message: "first section should no longer be the one we dragged away",
    })
    .not.toBe(before[0]);

  const after = await sectionTitles(page);
  expect(after).toEqual([before[1], before[0], ...before.slice(2)]);

  // Persist, then prove it survived a round trip rather than only moving in the
  // DOM — this is what exercises reorderSections() plus the save path.
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    // Compare RELATIVE order, not absolute positions: the document may carry
    // sections the editor doesn't render (an empty one has no card), so a
    // slice(0, 2) would be asserting about the rendering, not the reorder.
    const persisted = parsed.data.sections.map((s) => s.title);
    expect(persisted.indexOf(before[1])).toBeLessThan(persisted.indexOf(before[0]));
  }

  await page.reload();
  await openEditorPart(page, "content");
  await expect(page.locator(".sections-list")).toBeVisible();
  expect(await sectionTitles(page)).toEqual(after);
});

test("dragging a section's body does not reorder (handle-only drags)", async ({
  page,
  authedUserId,
}) => {
  expect(authedUserId).toBeTruthy(); // activates the authed-session fixture
  await page.goto("/cv");
  await openEditorPart(page, "content");
  await expect(page.locator(".sections-list")).toBeVisible();

  const before = await ensureTwoSections(page);
  expect(before.length).toBeGreaterThan(1);

  // Same gesture, started on the card's title input instead of the handle.
  // `dragListener={false}` means this must not move anything — if it ever does,
  // the inputs and buttons inside a card have stopped being usable.
  const firstCard = page.locator(".section-card").first();
  const secondCard = page.locator(".section-card").nth(1);
  const body = await centreOf(firstCard.locator("input.section-title"));
  const target = await centreOf(secondCard);
  await dragVertically(page, { x: body.x, y: body.y }, target.box.y + target.box.height * 0.8);

  expect(await sectionTitles(page)).toEqual(before);
});
