import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { GRANT_PRESETS } from "../../src/lib/canonical/grantPresets";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

// The "Apply NSF layout" button snapshots the current view under this exact name
// before mutating section selection/order/display (see CvEditor `GRANT_SNAPSHOT_NAME`).
const SNAPSHOT_NAME = "Before grant layout";

test("grant preset → apply NSF layout → reversible snapshot + section selection/order + persisted display", async ({
  page,
  authedUserId,
}) => {
  await page.goto("/cv");
  // Editor loaded: the grant-CV button (now in the Style/Presets area) is present.
  const applyBtn = page.getByRole("button", { name: "Apply NSF layout" });
  await expect(applyBtn).toBeVisible();

  // 1. Apply the NSF grant layout. The button label is `grantApply` with the
  //    preset name substituted → "Apply NSF layout".
  await applyBtn.click();

  // 2. Reversible: the pre-apply view was snapshotted as a named preset chip
  //    ("Before grant layout") so the user can switch back.
  await expect(page.getByText(SNAPSHOT_NAME)).toBeVisible();

  // 3. Save and wait for the save to settle.
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // 4. Reload the canonical CV from the DB and assert the NSF preset took.
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    const doc = parsed.data;
    // Display overrides match the preset.
    expect(doc.display.publicationsLimit).toBe(
      GRANT_PRESETS.nsf.display.publicationsLimit,
    );
    expect(doc.display.publicationOrder).toBe(
      GRANT_PRESETS.nsf.display.publicationOrder,
    );
    expect(doc.display.peerReviewedOnly).toBe(
      GRANT_PRESETS.nsf.display.peerReviewedOnly,
    );
    // Section ordering was customized to the funder rubric.
    expect(doc.display.sectionsCustomized).toBe(true);

    // The funder's narrative contribution prose sections were created.
    const proseTypes = doc.sections
      .filter((s) =>
        ["narrative-knowledge", "narrative-individuals", "narrative-community", "narrative-society"].includes(
          s.type,
        ),
      )
      .map((s) => s.type);
    expect(proseTypes.length).toBeGreaterThan(0);

    // Exactly the preset's wanted section types are visible.
    const want = new Set(GRANT_PRESETS.nsf.visibleSections);
    const visibleTypes = new Set(
      doc.sections.filter((s) => s.visible).map((s) => s.type),
    );
    for (const type of want) expect(visibleTypes.has(type)).toBe(true);
    for (const type of visibleTypes) expect(want.has(type as never)).toBe(true);

    // The visible sections are ordered in the preset's sequence.
    const visibleOrdered = [...doc.sections]
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.type);
    expect(visibleOrdered).toEqual([...GRANT_PRESETS.nsf.visibleSections]);

    // The reversible snapshot is persisted as a named preset on the document.
    expect((doc.presets ?? []).some((p) => p.name === SNAPSHOT_NAME)).toBe(true);
  }
});
