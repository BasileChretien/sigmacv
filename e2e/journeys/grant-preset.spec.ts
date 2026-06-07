import { safeParseCanonicalCv } from "../../src/lib/canonical/schema";
import { CV_MODELS } from "../../src/lib/canonical/cvModels";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

// The CV-model picker snapshots the current view under this exact name before
// mutating section selection/order/display (see CvEditor `eu.modelSnapshot`).
const SNAPSHOT_NAME = "Before CV model";
// The NSF model from the catalog (drives the expected section selection/order).
const NSF = CV_MODELS.find((m) => m.id === "nsf")!;

test("CV-model picker → apply NSF → reversible snapshot + section selection/order + persisted display", async ({
  page,
  authedUserId,
}) => {
  await page.goto("/cv");

  // Editor loaded: the CV-model picker (in the Style/Presets area) is present.
  const picker = page.getByRole("combobox", { name: "Choose a CV model" });
  await expect(picker).toBeVisible();

  // 1. Select the NSF model by its (English, un-localized) name, then Apply.
  await picker.selectOption({ label: NSF.name });
  await page.getByRole("button", { name: /^Apply$/ }).click();

  // 2. Reversible: the pre-apply view was snapshotted as a named preset chip
  //    ("Before CV model") so the user can switch back.
  await expect(page.getByText(SNAPSHOT_NAME)).toBeVisible();

  // 3. Save and wait for the save to settle.
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // 4. Reload the canonical CV from the DB and assert the NSF model took.
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const parsed = safeParseCanonicalCv(row?.document);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    const doc = parsed.data;
    // Display overrides match the model.
    expect(doc.display.publicationsLimit).toBe(NSF.display?.publicationsLimit);
    // publicationOrder is overridden only when the model specifies it; NSF does
    // not, so the CV keeps its existing default (not undefined).
    if (NSF.display?.publicationOrder !== undefined) {
      expect(doc.display.publicationOrder).toBe(NSF.display.publicationOrder);
    }
    expect(doc.display.peerReviewedOnly).toBe(NSF.display?.peerReviewedOnly);
    // Section ordering was customized to the funder rubric.
    expect(doc.display.sectionsCustomized).toBe(true);

    // The NSF title overrides took on the shown sections.
    expect(doc.sections.find((s) => s.type === "education")?.title).toBe(
      "Professional Preparation",
    );
    expect(doc.sections.find((s) => s.type === "publications")?.title).toBe(
      "Products",
    );

    // Exactly the model's wanted section types are visible.
    const want = new Set(NSF.sections);
    const visibleTypes = new Set(
      doc.sections.filter((s) => s.visible).map((s) => s.type),
    );
    for (const type of want) expect(visibleTypes.has(type)).toBe(true);
    for (const type of visibleTypes) expect(want.has(type as never)).toBe(true);

    // The visible sections are ordered in the model's sequence.
    const visibleOrdered = [...doc.sections]
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.type);
    expect(visibleOrdered).toEqual([...NSF.sections]);

    // The reversible snapshot is persisted as a named preset on the document.
    expect((doc.presets ?? []).some((p) => p.name === SNAPSHOT_NAME)).toBe(true);
  }
});
