import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { GRANT_PRESETS } from "../../src/lib/canonical/grantPresets";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

// The "Apply NSF layout" button snapshots the current view under this exact name
// before mutating display/visibility (see NarrativeEditor `GRANT_SNAPSHOT_NAME`).
const SNAPSHOT_NAME = "Before grant layout";

test("grant preset → apply NSF layout → reversible snapshot + seeded narrative + persisted display", async ({
  page,
  authedUserId,
}) => {
  await page.goto("/cv");
  // Editor loaded (unambiguous: the Narrative CV panel that hosts the grant
  // presets — plain getByText("Publications") matches several control labels).
  await expect(page.getByRole("group", { name: "Narrative CV" })).toBeVisible();
  const panel = page.locator(".narrative-editor");
  await expect(panel).toBeVisible();

  // 1. Apply the NSF grant layout. The button label is `grantApply` with the
  //    preset name substituted → "Apply NSF layout".
  await page.getByRole("button", { name: "Apply NSF layout" }).click();

  // 2a. Reversible: the pre-apply view was snapshotted as a named preset chip
  //     ("Before grant layout") so the user can switch back.
  await expect(page.getByText(SNAPSHOT_NAME)).toBeVisible();

  // 2b. The narrative modules are seeded — the `.narrative-module` rows appear.
  await expect(page.locator(".narrative-module").first()).toBeVisible();
  expect(await page.locator(".narrative-module").count()).toBeGreaterThan(0);

  // 3. Save and wait for the save to settle.
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // 4. Reload the canonical CV from the DB and assert the NSF preset took:
  //    the publications limit matches the preset and the narrative is non-empty.
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    expect(parsed.data.display.publicationsLimit).toBe(
      GRANT_PRESETS.nsf.display.publicationsLimit,
    );
    expect(parsed.data.display.publicationOrder).toBe(
      GRANT_PRESETS.nsf.display.publicationOrder,
    );
    expect(parsed.data.display.peerReviewedOnly).toBe(
      GRANT_PRESETS.nsf.display.peerReviewedOnly,
    );
    expect((parsed.data.narrative ?? []).length).toBeGreaterThan(0);
    // The reversible snapshot is persisted as a named preset on the document.
    expect((parsed.data.presets ?? []).some((p) => p.name === SNAPSHOT_NAME)).toBe(
      true,
    );
  }
});
