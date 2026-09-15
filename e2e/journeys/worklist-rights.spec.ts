import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";
import { openEditorPart } from "../fixtures/editor";

/**
 * The rights lines under a closed work, in the owner's editor: the publisher's
 * policy as OA.Works recorded it (both dates, the statement quoted, the archived
 * policy linked) and the statutory rule that may also apply for the country on
 * the paper, under one disclaimer. The OA.Works lookup runs in the owner sync
 * and is unit-tested; this journey seeds what that sync stores and proves the
 * real editor renders it — facts beside the work, no figure.
 */
test.describe.configure({ timeout: 180_000 });

const OWN = "https://openalex.org/W4300000001";
const STATEMENT = "This is the peer reviewed version of the following article.";

interface StoredItem {
  sourceId: string;
  meta: Record<string, unknown>;
}
interface StoredDoc {
  sections: Array<{ items: StoredItem[] }>;
}

test("a closed work shows the publisher's recorded policy, the statutory rule and the disclaimer", async ({
  page,
  authedUserId,
}) => {
  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  const stored = row!.document as unknown as StoredDoc;
  const document = {
    ...stored,
    sections: stored.sections.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.sourceId === OWN
          ? {
              ...item,
              meta: {
                ...item.meta,
                oaIsOpen: false,
                workCountries: ["FR"],
                selfArchiving: {
                  source: "oa.works",
                  canArchive: true,
                  versions: ["acceptedVersion"],
                  locations: ["Institutional Repository"],
                  embargoMonths: 12,
                  embargoEnd: "2021-01-23",
                  licence: "cc-by-nc-nd",
                  depositStatement: STATEMENT,
                  recordUpdated: "2021-01-27",
                  policyUrl: "https://perma.cc/J5MA-H2EJ",
                  retrievedAt: "2026-09-15T08:00:00.000Z",
                },
              },
            }
          : item,
      ),
    })),
  };
  await db.cv.update({
    where: { userId: authedUserId },
    data: { document: document as never },
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("sigmacv:coachmarkDismissed", "1");
  });
  await page.goto("/cv");
  await openEditorPart(page, "content");

  const worklist = page.locator('details[data-owner-only="worklist"]');
  await expect(worklist).toBeVisible({ timeout: 15_000 });
  await worklist.locator("summary").click();
  const rights = worklist.locator('[data-worklist="rights"]');
  await expect(rights).toBeVisible();

  await expect(rights).toContainText(
    "Publisher policy recorded by OA.Works: self-archiving allowed — accepted manuscript.",
  );
  await expect(rights).toContainText("Embargo: 12 months, ending 2021-01-23.");
  await expect(rights).toContainText("OA.Works record updated 2021-01-27; retrieved 2026-09-15.");
  await expect(rights.locator("blockquote")).toHaveText(STATEMENT);
  await expect(
    rights.getByRole("link", { name: "archived copy of the publisher's policy" }),
  ).toHaveAttribute("href", "https://perma.cc/J5MA-H2EJ");
  await expect(rights).toContainText("May also apply — secondary-publication right (France)");
  await expect(rights.getByRole("link", { name: "legal text" })).toHaveAttribute(
    "href",
    /^https:\/\/www\.legifrance\.gouv\.fr\//,
  );
  await expect(worklist).toContainText("This is information, not legal advice");
  // Facts, never a figure.
  await expect(rights).not.toContainText("%");

  await rights.screenshot({ path: test.info().outputPath("worklist-rights.png") });

  // One deposit action under the same work: the national repository of the country
  // on the paper, with its reason, and the other places behind a disclosure.
  const row = worklist.locator("li").filter({ has: page.locator('[data-worklist="rights"]') });
  const deposit = row.locator('[data-worklist="deposit"]');
  await expect(deposit).toBeVisible();
  const primary = deposit.locator(".cv-worklist-deposit-primary");
  await expect(primary.getByRole("link")).toHaveAttribute("href", "https://hal.science/submit");
  await expect(primary).toContainText("HAL");
  await expect(primary).toContainText("France");
  await deposit.locator("summary").click();
  await expect(deposit.getByRole("link", { name: "Zenodo" })).toHaveAttribute(
    "href",
    "https://zenodo.org/uploads/new",
  );
  await expect(deposit).not.toContainText("%");

  await deposit.screenshot({ path: test.info().outputPath("worklist-deposit.png") });
});
