import { readFileSync } from "node:fs";
import { expect, test, type Page, type Response } from "@playwright/test";
import { PLAUSIBLE_SRC } from "./env";

/**
 * Does a browser run each page's scripts under the Content-Security-Policy that
 * page is served with? Asked of a PRODUCTION build, because that is the only
 * place the answer means anything: `next dev` allows every script.
 *
 * Why this exists: from the first deploy until 2026-10 every prerendered page
 * (About, FAQ, the guides, the landing pages, their ten locales: 460 of them)
 * was served `'nonce-…' 'strict-dynamic'` with no nonce in its HTML. The browser
 * blocked all of its scripts: no hydration, no analytics. `tests/proxy.test.ts`
 * checked the header string and passed throughout.
 */

const PLAUSIBLE_ORIGIN = new URL(PLAUSIBLE_SRC).origin;
const FOREIGN_SCRIPT = "https://evil.e2e.test/x.js";

/** One page of each kind `next build` prerenders (○ static, ● generateStaticParams). */
const PRERENDERED = [
  "/about",
  "/fr/about",
  "/faq",
  "/orcid-to-cv",
  "/guides/how-to-write-an-academic-cv",
  "/ja/guides/how-to-write-an-academic-cv",
  "/glossary/orcid",
  "/examples/phd-cv-computer-science",
];

/** Rendered per request, and reachable without a database. */
const DYNAMIC = ["/", "/fr", "/search"];

interface Opened {
  response: Response;
  scriptSrc: string;
  /** What the policy refused: `securitypolicyviolation` events and console errors. */
  violations: () => Promise<string[]>;
  /** Pageviews the analytics script posted to its collector. */
  events: string[];
}

/** Open `path` with the analytics origin answered locally and violations recorded. */
async function open(page: Page, path: string): Promise<Opened> {
  const events: string[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const seen: string[] = [];
    Reflect.set(window, "__cspViolations", seen);
    document.addEventListener("securitypolicyviolation", (e) => {
      seen.push(`${e.violatedDirective} blocked ${e.blockedURI}`);
    });
  });
  // A stand-in for the tracker: it reports that it ran and posts one pageview,
  // which needs the origin in connect-src.
  await page.route(`${PLAUSIBLE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      events.push(request.postData() ?? "");
      await route.fulfill({ status: 202, headers: { "access-control-allow-origin": "*" } });
      return;
    }
    await route.fulfill({
      contentType: "application/javascript",
      body: `window.__trackerRan = true; fetch(${JSON.stringify(`${PLAUSIBLE_ORIGIN}/api/event`)}, { method: "POST", body: location.pathname });`,
    });
  });
  await page.route(FOREIGN_SCRIPT, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.__foreignRan = true;",
    }),
  );

  const response = await page.goto(path);
  if (!response) throw new Error(`no response for ${path}`);
  const csp = response.headers()["content-security-policy"] ?? "";
  const scriptSrc = /(?:^|; )script-src ([^;]*)/.exec(csp)?.[1] ?? "";
  if (!csp.includes(PLAUSIBLE_ORIGIN)) {
    throw new Error(
      `This build was made without NEXT_PUBLIC_PLAUSIBLE_SRC=${PLAUSIBLE_SRC}. ` +
        "Run `npm run e2e:prod` without E2E_PROD_REUSE_BUILD, or rebuild with that variable set.",
    );
  }
  return {
    response,
    scriptSrc,
    events,
    violations: async () => [
      ...(await page.evaluate(() => Reflect.get(window, "__cspViolations") as string[])),
      ...consoleErrors,
    ],
  };
}

/** React has hydrated when a control that only works with JavaScript works. */
async function expectHydrated(page: Page): Promise<void> {
  // The inline theme bootstrap ran (Playwright's default colour scheme is light)…
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  // …and the toggle, a client component, responds. Retried: a click that lands
  // before hydration does nothing.
  await expect(async () => {
    await page.locator(".theme-toggle-btn").nth(1).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark", { timeout: 500 });
  }).toPass();
}

async function expectAnalyticsRan(page: Page, events: string[]): Promise<void> {
  // The init stub (inline, inserted by next/script) ran…
  await expect
    .poll(() => page.evaluate(() => typeof Reflect.get(window, "plausible")?.o?.transformRequest))
    .toBe("function");
  // …the tracker script loaded, and its pageview got out.
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "__trackerRan"))).toBe(true);
  await expect.poll(() => events.length).toBeGreaterThan(0);
}

/**
 * Injected markup with an inline handler (what `<img onerror=…>` in an XSS
 * carries): say whether the handler ran. Refused by both policy shapes.
 */
async function injectedHandlerRuns(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<button id="injected" onclick="window.__handlerRan = true"></button>',
    );
    document.getElementById("injected")?.click();
    return Reflect.get(window, "__handlerRan") === true;
  });
}

/**
 * An inline script element the page did not ship: say whether it ran. Only the
 * prerendered shape refuses this. Under `'strict-dynamic'` a script that is
 * already running may add scripts, and `page.evaluate` is such a script.
 */
async function addedInlineScriptRuns(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "window.__inlineRan = true";
    document.body.appendChild(script);
    return Reflect.get(window, "__inlineRan") === true;
  });
}

/** Name `src` as a script on the page, and say whether the browser ran it. */
async function loadAsScript(page: Page, src: string): Promise<"loaded" | "blocked"> {
  return page.evaluate(
    (url) =>
      new Promise<"loaded" | "blocked">((resolve) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve("loaded");
        script.onerror = () => resolve("blocked");
        document.body.appendChild(script);
      }),
    src,
  );
}

/**
 * Say whether `eval` runs. From a timer: the debugging protocol exempts an
 * eval made directly inside `page.evaluate` from the policy.
 */
async function evalRuns(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          try {
            resolve((0, eval)("1 + 1") === 2);
          } catch {
            resolve(false);
          }
        }, 0);
      }),
  );
}

test.describe("a prerendered page", () => {
  for (const path of PRERENDERED) {
    test(`${path} runs its scripts under the policy it is served with`, async ({ page }) => {
      const { response, scriptSrc, violations, events } = await open(page, path);

      // Still the build-time file (not made dynamic to get a nonce)…
      expect(response.status()).toBe(200);
      expect(response.headers()["x-nextjs-prerender"]).toBeTruthy();
      // …under a policy with no blanket allowance.
      expect(scriptSrc).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);
      expect(scriptSrc).not.toContain("'strict-dynamic'");
      expect(scriptSrc).toMatch(/'sha256-/);

      // Next's inline flight payload ran, React hydrated, analytics ran.
      await expect
        .poll(() => page.evaluate(() => typeof Reflect.get(self, "__next_f")))
        .toBe("object");
      await expectHydrated(page);
      await expectAnalyticsRan(page, events);
      expect(await violations()).toEqual([]);
    });
  }

  test("still refuses a script the page did not ship", async ({ page }) => {
    const { violations } = await open(page, "/about");
    await expectHydrated(page);

    expect(await injectedHandlerRuns(page)).toBe(false);
    expect(await addedInlineScriptRuns(page)).toBe(false);
    expect(await evalRuns(page)).toBe(false);
    expect(await loadAsScript(page, FOREIGN_SCRIPT)).toBe("blocked");
    expect(await page.evaluate(() => Reflect.get(window, "__foreignRan"))).toBeUndefined();
    // The refusals are the policy's doing.
    expect((await violations()).join("\n")).toMatch(/script-src/);
  });

  // This policy allows 'self', so any script FILE on our own origin may load.
  // What keeps a page, a JSON file or an export from being run as one is that
  // the app marks every response `nosniff`. If that header goes, or a route ever
  // answers with a JavaScript type, this is where it shows.
  test("does not run a same-origin response that is not a script", async ({ page, request }) => {
    await open(page, "/about");
    await expectHydrated(page);

    for (const url of ["/privacy", "/schema/cv/v2.json", "/robots.txt"]) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(200);
      expect(response.headers()["x-content-type-options"], url).toBe("nosniff");
      expect(await loadAsScript(page, url), url).toBe("blocked");
    }
  });

  test("a percent-encoded spelling of the path gets the same policy", async ({ page }) => {
    // Next serves /about for it; a lookup that missed would leave it script-less.
    const { response, violations } = await open(page, "/%61bout");
    expect(response.headers()["x-nextjs-prerender"]).toBeTruthy();
    await expectHydrated(page);
    expect(await violations()).toEqual([]);
  });

  test("no prerendered page is revalidated at runtime", () => {
    // The hashes are read off the build. A page that is rebuilt while the server
    // runs (`revalidate`, a cached fetch) would be sent the nonce policy instead
    // and run no script. Nothing does that today; if a page needs to, the lookup
    // in src/lib/security/prerenderedScripts.ts has to learn about it first.
    const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8")) as {
      routes: Record<string, { initialRevalidateSeconds: number | false }>;
    };
    const revalidated = Object.entries(manifest.routes)
      .filter(([, route]) => route.initialRevalidateSeconds !== false)
      .map(([pathname]) => pathname);
    expect(Object.keys(manifest.routes).length).toBeGreaterThan(0);
    expect(revalidated).toEqual([]);
  });

  test("the guide's see-it-first box is handled by its script, not by a form GET", async ({
    page,
  }) => {
    const path = "/guides/how-to-write-an-academic-cv";
    const { violations } = await open(page, path);
    await expectHydrated(page);

    const box = page.getByTestId("see-it-first");
    await box.getByRole("textbox").fill("ab");
    await box.getByRole("button").click();
    // Too short to look up: the script says so. Without it the browser submits
    // the form and reloads the page with the typed value in the URL.
    await expect(box.getByRole("alert")).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
    expect(await violations()).toEqual([]);
  });

  test("navigates client-side to a page rendered per request", async ({ page }) => {
    const { violations, events } = await open(page, "/about");
    await expectHydrated(page);
    await expectAnalyticsRan(page, events);
    await page.evaluate(() => Reflect.set(window, "__sameDocument", true));

    // The language switcher is a client component; /fr is rendered per request.
    await page.locator("select.lang-switcher").selectOption("fr-FR");
    await expect(page).toHaveURL(/\/fr$/, { timeout: 15_000 });
    await expect(page.getByTestId("see-it-first")).toBeVisible();
    // No reload: the document, and so the policy, is still /about's.
    expect(await page.evaluate(() => Reflect.get(window, "__sameDocument"))).toBe(true);
    expect(await violations()).toEqual([]);
  });
});

test.describe("a page rendered per request", () => {
  for (const path of DYNAMIC) {
    test(`${path} gets a nonce on every script, and strict-dynamic`, async ({ page }) => {
      const { response, scriptSrc, violations, events } = await open(page, path);

      expect(response.status()).toBe(200);
      expect(response.headers()["x-nextjs-prerender"]).toBeUndefined();
      expect(scriptSrc).toContain("'strict-dynamic'");
      expect(scriptSrc).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);

      const nonce = /'nonce-([^']+)'/.exec(scriptSrc)?.[1];
      expect(nonce).toBeTruthy();
      const external = (await response.text()).match(/<script\b[^>]*\bsrc=[^>]*>/g) ?? [];
      expect(external.length).toBeGreaterThan(0);
      for (const tag of external) expect(tag).toContain(`nonce="${nonce}"`);

      await expectHydrated(page);
      await expectAnalyticsRan(page, events);
      expect(await violations()).toEqual([]);
    });
  }

  test("still refuses injected markup and eval", async ({ page }) => {
    const { violations } = await open(page, "/");
    await expectHydrated(page);
    expect(await injectedHandlerRuns(page)).toBe(false);
    expect(await evalRuns(page)).toBe(false);
    expect((await violations()).join("\n")).toMatch(/script-src/);
  });
});
