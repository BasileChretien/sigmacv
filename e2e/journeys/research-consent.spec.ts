import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

/**
 * Study 2026-0310: the person opens the research panel themself, takes part
 * (checkbox ① alone enables the button), then stops. Each act leaves a
 * ResearchConsentRecord beside the User fields, and stopping deletes the
 * research events. Needs RESEARCH_LOGGING_ENABLED=true on the test server
 * (playwright.config.ts sets it there and nowhere else).
 */
test.describe.configure({ timeout: 180_000 });

test("open the research panel → take part → stop taking part", async ({ page, authedUserId }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("sigmacv:coachmarkDismissed", "1");
  });
  await page.goto("/cv");

  // Nothing about the study shows by itself.
  await expect(page.getByTestId("research-panel")).toHaveCount(0);

  // Opened from the account menu (the editor's foot link opens the same panel).
  await expect(page.locator(".research-entry")).toContainText("Research participation");
  await page.locator(".account-trigger").click();
  await page
    .locator(".account-panel")
    .getByRole("button", { name: "Research participation" })
    .click();
  const panel = page.getByTestId("research-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Take part in a Nagoya University research study? (optional)");

  const takePart = panel.getByRole("button", { name: "Take part" });
  await expect(takePart).toBeDisabled();
  await expect(panel.getByTestId("research-agree")).not.toBeChecked();
  await expect(panel.getByTestId("research-secondary")).not.toBeChecked();
  await panel.getByTestId("research-agree").check();
  await expect(takePart).toBeEnabled();
  await takePart.click();

  await expect(panel.getByTestId("research-status")).toContainText("You are taking part since", {
    timeout: 15_000,
  });
  let user = await db.user.findUnique({ where: { id: authedUserId } });
  expect(user?.researchConsent).toBe(true);
  expect(user?.researchConsentVersion).toBe(2);
  let records = await db.researchConsentRecord.findMany({
    where: { userId: authedUserId },
    orderBy: { at: "asc" },
  });
  expect(records.map((r) => [r.action, r.version, r.locale, r.secondaryUse])).toEqual([
    ["grant", 2, "en-US", false],
  ]);

  // A research event collected under the consent, which stopping must delete.
  await db.researchEvent.create({
    data: { userId: authedUserId, type: "composition_snapshot", payload: {} },
  });

  await panel.getByRole("button", { name: "Stop taking part" }).click();
  await panel
    .getByRole("group", { name: "Stop taking part?" })
    .getByRole("button", {
      name: "Stop taking part",
    })
    .click();
  await expect(panel).toContainText("You have stopped taking part.", { timeout: 15_000 });
  await expect(panel.getByTestId("research-agree")).not.toBeChecked();

  user = await db.user.findUnique({ where: { id: authedUserId } });
  expect(user?.researchConsent).toBe(false);
  expect(user?.researchConsentAt).toBeNull();
  expect(await db.researchEvent.count({ where: { userId: authedUserId } })).toBe(0);
  records = await db.researchConsentRecord.findMany({
    where: { userId: authedUserId },
    orderBy: { at: "asc" },
  });
  expect(records.map((r) => [r.action, r.version])).toEqual([
    ["grant", 2],
    ["withdraw", 2],
  ]);

  // "Not now" just closes.
  await panel.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByTestId("research-panel")).toHaveCount(0);
});
