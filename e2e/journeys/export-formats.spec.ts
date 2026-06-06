import { expect, test } from "../fixtures/auth";

/**
 * The newer export formats (csljson / jsonresume / biosketch / erc) are reachable
 * at GET /api/cv/export/<format> for an authenticated owner, even though the UI
 * export dropdown does not list them yet. We drive them through the authed page's
 * request context (which carries the seeded session cookie) and assert status,
 * Content-Type, and a basic body shape per format.
 *
 * NOTE: the route is GET (see src/app/api/cv/export/[format]/route.ts), not POST.
 */

interface FormatCase {
  format: string;
  /** A substring the Content-Type header must contain. */
  contentType: string;
  /** Validate the response body shape. */
  assertBody: (body: string) => void;
}

const CASES: FormatCase[] = [
  {
    format: "csljson",
    contentType: "application/vnd.citationstyles.csl+json",
    assertBody: (body) => {
      const parsed = JSON.parse(body) as unknown;
      expect(Array.isArray(parsed)).toBe(true);
    },
  },
  {
    format: "jsonresume",
    contentType: "application/json",
    assertBody: (body) => {
      const parsed = JSON.parse(body) as { basics?: unknown };
      expect(parsed).toHaveProperty("basics");
      expect(typeof parsed.basics).toBe("object");
      expect(parsed.basics).not.toBeNull();
    },
  },
  {
    format: "biosketch",
    contentType: "text/markdown",
    assertBody: (body) => {
      // NIH-style biosketch heading is a fixed string.
      expect(body).toContain("## A. Personal Statement");
    },
  },
  {
    format: "erc",
    contentType: "text/markdown",
    assertBody: (body) => {
      // ERC funder draft: the track-record heading is a fixed proper-noun string.
      expect(body).toContain("## Track Record");
    },
  },
];

test("authenticated export API serves the newer formats", async ({
  page,
  authedUserId,
}) => {
  expect(authedUserId).toBeTruthy(); // activates the authed-session fixture
  // Ensure the seeded CV is in place (the editor load also confirms auth works).
  await page.goto("/cv");
  await expect(page.getByRole("group", { name: "Narrative CV" })).toBeVisible();

  for (const c of CASES) {
    const res = await page.request.get(`/api/cv/export/${c.format}`);
    expect(res.status(), `${c.format} status`).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct, `${c.format} content-type`).toContain(c.contentType);
    const body = await res.text();
    c.assertBody(body);
  }
});

test("export API rejects an unauthenticated request", async ({ browser }) => {
  // A fresh context with NO session cookie must be turned away (401).
  const anon = await browser.newContext();
  const res = await anon.request.get("/api/cv/export/csljson");
  expect(res.status()).toBe(401);
  await anon.close();
});
