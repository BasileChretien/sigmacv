import { readFileSync } from "node:fs";
import { expect, test, type Page, type Response } from "@playwright/test";
import { BASE_URL, PLAUSIBLE_SRC } from "./env";

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

interface UnknownPath {
  path: string;
  /** Its 404's language: the first segment's when that is a locale slug, English otherwise. */
  lang: string;
  heading: string;
  /** The home page its link leads to. */
  home: string;
  /**
   * Whether the HTML the server sends holds the page. It does not when a page
   * calls `notFound()` itself: Next then sends an empty body and the browser
   * draws the 404.
   */
  inHtml: boolean;
}

/**
 * Paths with no page behind them. The first three are of the kinds Next
 * answered with a 404 built ahead of time: no route at all, and a route that
 * lists its pages (`dynamicParams = false`) and does not list this one. `/foo`
 * matches `/[locale]`, which calls `notFound()`: it was always rendered per
 * request, and shows the same page.
 *
 * The last two are a prerendered page's address with a FIXED segment written
 * percent-encoded (`%61` is `a`). Neither is the page. `/%61bout` goes to
 * `/[locale]` like `/foo`; Next 16.3.6 answered it with /about's prerender all
 * the same, and 16.3.8 no longer does. `/fr/%61bout` matches no route. Both must
 * get the nonce policy like any other 404, not the hashes of the page they
 * resemble, which a lookup that decodes the whole path would hand them.
 */
const UNKNOWN: UnknownPath[] = [
  { path: "/a/b", lang: "en-US", heading: "Page not found", home: "/", inHtml: true },
  {
    path: "/guides/no-such-guide",
    lang: "en-US",
    heading: "Page not found",
    home: "/",
    inHtml: true,
  },
  {
    path: "/fr/guides/no-such-guide",
    lang: "fr-FR",
    heading: "Page introuvable",
    home: "/fr",
    inHtml: true,
  },
  { path: "/foo", lang: "en-US", heading: "Page not found", home: "/", inHtml: false },
  { path: "/%61bout", lang: "en-US", heading: "Page not found", home: "/", inHtml: false },
  { path: "/fr/%61bout", lang: "fr-FR", heading: "Page introuvable", home: "/fr", inHtml: true },
];

/** A prerendered page's address with a PARAMETER segment written percent-encoded. */
const ENCODED_PARAMETER = ["/%66r/about", "/guides/how%2Dto-write-an-academic-cv"];

/**
 * A page that reads the database. Nothing answers at the address this server
 * was given for it (`env.ts`), so its render fails on every request.
 *
 * The test that opens it needs a render that FAILS. Making `/i` fail soft (a
 * page that shows without its database) means choosing another failing page
 * here, not loosening that test.
 */
const FAILING = "/i";

/** The page `next build` writes for a server failure. Its route, and its file. */
const BUILT_ERROR_ROUTE = "/_global-error";
const BUILT_ERROR_FILE = ".next/server/app/_global-error.html";

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

/** The page was rendered for this request: the nonce policy, and the nonce on every script. */
async function expectRenderedWithNonce(response: Response, scriptSrc: string): Promise<void> {
  expect(response.headers()["x-nextjs-prerender"]).toBeUndefined();
  expect(scriptSrc).toContain("'strict-dynamic'");
  expect(scriptSrc).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);

  const nonce = /'nonce-([^']+)'/.exec(scriptSrc)?.[1];
  expect(nonce).toBeTruthy();
  const external = (await response.text()).match(/<script\b[^>]*\bsrc=[^>]*>/g) ?? [];
  expect(external.length).toBeGreaterThan(0);
  for (const tag of external) expect(tag).toContain(`nonce="${nonce}"`);
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
  // the app marks every response `nosniff`. If that header goes, this is where
  // it shows. It tries three fixed URLs: a route added later that answers with a
  // JavaScript type is not caught here but in tests/no-javascript-responses.test.ts,
  // which reads the source.
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

  // Next percent-decodes what it reads as a route parameter (`[locale]`, `[slug]`)
  // before it looks the page up, so these are answered from the prerender, with
  // no nonce. A lookup that took only the path as written would send them the
  // nonce policy and they would run no script. A FIXED segment written encoded is
  // another matter: Next answers a 404 (see UNKNOWN below).
  for (const path of ENCODED_PARAMETER) {
    test(`${path}, a parameter written percent-encoded, is still the prerendered page`, async ({
      page,
    }) => {
      const { response, scriptSrc, violations } = await open(page, path);
      expect(response.status()).toBe(200);
      expect(response.headers()["x-nextjs-prerender"]).toBeTruthy();
      expect(scriptSrc).not.toContain("'strict-dynamic'");
      expect(scriptSrc).toMatch(/'sha256-/);
      await expectHydrated(page);
      expect(await violations()).toEqual([]);
    });
  }

  // Since 16.3.8 Next answers a prerendered page from a copy it keeps on disk
  // (`server/route-cache`), in a file named after the address. An address that
  // differs from a page's only by case is no page: `/Fr/about` is a 404.
  //
  // On Linux, where the production image and CI run, that is all: the 404 is
  // rendered for the request and nothing is filed. This checks that it stays so.
  //
  // On a case-insensitive filesystem the mis-cased name is the page's own file
  // (seen on Windows; the defect is Next's). The first such request finds the
  // page's copy there and is answered 200 with it. The re-render that follows
  // stores the 404 over that copy. The running server goes on answering the real
  // address from memory; once restarted it answers the stored 404, until the
  // cache is deleted or the app rebuilt.
  //
  // So the proof is the loop: where the defect is present, its first request
  // fails with "expected 404, received 200". The lines after the loop cannot see
  // a replaced copy, since the server they ask is still the running one. They
  // show that the page is still served, unchanged, and still runs its scripts
  // once the mis-cased requests have been made, and no more.
  //
  // Skipped off Linux: it would fail, and leave the page's stored copy replaced
  // (`scripts/start-standalone.mjs` deletes that cache before it serves a build,
  // so that one such request does not outlive the server that got it).
  test("an address that differs from a page's only by case does not replace the page", async ({
    page,
    request,
  }) => {
    test.skip(
      process.platform !== "linux",
      "on a case-insensitive filesystem Next 16.3.8 overwrites the page's stored copy",
    );
    const real = "/fr/about";
    const before = await request.get(real);
    expect(before.status()).toBe(200);
    expect(before.headers()["x-nextjs-prerender"]).toBeTruthy();

    // The first one twice: a 404 kept from the first request would show here.
    for (const wrong of ["/Fr/about", "/FR/about", "/fr/About", "/Fr/about"]) {
      const response = await request.get(wrong);
      expect(response.status(), wrong).toBe(404);
      expect(response.headers()["x-nextjs-prerender"], wrong).toBeUndefined();
    }

    // Not the proof (see above): this server answers these from memory, whatever
    // the stored copy has become.
    const after = await request.get(real);
    expect(after.status()).toBe(200);
    expect(await after.text()).toBe(await before.text());
    const { response, violations } = await open(page, real);
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

  test("no prerendered page is built from a catch-all route", () => {
    // The lookup sets a page's address against its route segment by segment, and
    // `[...path]` is one segment that stands for several. Such a page would be
    // matched only as written: asked for with a segment percent-encoded, it
    // would be sent the nonce policy and run no script. No page is built from
    // one today; if one needs to be, `prerenderedRouteFor` in
    // src/lib/security/prerenderedScripts.ts has to learn about catch-all routes
    // first (tests/prerendered-scripts.test.ts pins what it answers until then).
    const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8")) as {
      routes: Record<string, { srcRoute?: string | null }>;
    };
    // `[...` is in the optional form too, `[[...path]]`.
    const catchAll = Object.entries(manifest.routes)
      .filter(([, route]) => route.srcRoute?.includes("[..."))
      .map(([pathname]) => pathname);
    expect(Object.keys(manifest.routes).length).toBeGreaterThan(0);
    expect(catchAll).toEqual([]);
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
      await expectRenderedWithNonce(response, scriptSrc);

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

// The proxy cannot tell that a path will be a 404, so it sends the nonce shape.
// The not-found page therefore has to be rendered per request, or it is a file
// without a nonce and the browser refuses its scripts: the 404 is not counted.
test.describe("a path with no page behind it", () => {
  for (const { path, lang, heading, home, inHtml } of UNKNOWN) {
    test(`${path} is a 404 that runs its scripts`, async ({ page }) => {
      const { response, scriptSrc, violations, events } = await open(page, path);

      expect(response.status()).toBe(404);
      await expectRenderedWithNonce(response, scriptSrc);

      // The site's own 404, in the language the address is written under. In
      // the HTML the server sent first: read off the page alone, an English 404
      // that the browser then corrected would pass.
      if (inHtml) {
        const html = await response.text();
        // On the page's own element: the head's `hrefLang` links name languages too.
        expect(html).toContain(`class="site-shell" lang="${lang}"`);
        expect(html).toContain(`<h1>${heading}</h1>`);
      }
      await expect(page.locator(".site-shell")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page).toHaveTitle("404 — SigmaCV");
      // Counted. The analytics scripts are inserted once React has hydrated.
      await expectAnalyticsRan(page, events);

      // Its one job is to lead home, and it does so in the same document: the
      // link is React's, and the next page's scripts load under this policy.
      await page.evaluate(() => Reflect.set(window, "__sameDocument", true));
      await page.getByRole("main").getByRole("link").click();
      await expect(page).toHaveURL(new URL(home, BASE_URL).href);
      await expect(page.getByTestId("see-it-first")).toBeVisible();
      expect(await page.evaluate(() => Reflect.get(window, "__sameDocument"))).toBe(true);
      expect(await violations()).toEqual([]);
    });
  }

  test("only the 404 was taken out of the prerender to get its nonce", () => {
    // Next renders the not-found page into the tree of every other page too. If
    // it read the request (`connection()`, `headers()`), they would all become
    // dynamic; the build says nothing, and 460 pages are rendered on each visit.
    const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8")) as {
      routes: Record<string, unknown>;
    };
    expect(manifest.routes["/_not-found"]).toBeUndefined();
    for (const path of PRERENDERED) expect(manifest.routes[path], path).toBeDefined();
  });

  test("an iD in the address of a 404 is cut from what the tracker is handed to send", async ({
    page,
  }) => {
    // Another case than the preview's: a 404, and an address the `/preview/` rule
    // does not know. A 404 is a pageview now, and Plausible stores the pathname.
    const { response, events } = await open(page, "/Preview/0000-0002-1825-0097");
    expect(response.status()).toBe(404);
    await expectAnalyticsRan(page, events);

    // The stand-in tracker posts the bare pathname. The real one passes its
    // payload through the function the init stub registered, so ask that.
    const sent = await page.evaluate(() => {
      const transform = Reflect.get(window, "plausible").o.transformRequest;
      return transform({ n: "pageview", u: location.href }).u as string;
    });
    expect(sent).toBe(new URL("/Preview/_", BASE_URL).href);
  });
});

// Next builds its page for a server failure ahead of time, so without a nonce.
// Were that file the answer to a failing request, it would arrive under the
// nonce shape (the proxy sees the failing path, not a prerendered route) and the
// browser would refuse every script in it. It is not the answer: SECURITY.md,
// "App-shell Content-Security-Policy", says what each kind of failure gets. These
// tests hold the parts of that account a browser can see on this server.
test.describe("a server failure", () => {
  test(`${FAILING}, whose render fails, is an error page rendered for the request`, async ({
    page,
  }) => {
    // (The server logs the database error: that is this test at work.)
    const { response, scriptSrc, violations } = await open(page, FAILING);

    // The core: a failure, answered with Next's error document rendered for
    // this request, whose scripts carry the nonce, run, and are not refused.
    expect(response.status()).toBe(500);
    await expectRenderedWithNonce(response, scriptSrc);
    expect(await response.text()).toContain('id="__next_error__"');
    await expect(page.locator("html#__next_error__")).toBeAttached();
    await expect
      .poll(() => page.evaluate(() => typeof Reflect.get(self, "__next_f")))
      .toBe("object");
    expect(await violations()).toEqual([]);

    // The rest reads Next's own wording and markup: "couldn't load", a heading
    // drawn by script, a button named "Reload". It is the part to revisit on a
    // Next upgrade: when it fails and the lines above pass, look at Next's copy
    // before the policy.
    //
    // The message is not in the HTML that was served: the page's scripts drew it.
    expect(await response.text()).not.toContain("load</h1>");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/couldn.t load/);
    expect(await violations()).toEqual([]);

    // Its one control asks the server for the page again.
    const [again] = await Promise.all([
      page.waitForRequest((request) => request.isNavigationRequest()),
      page.getByRole("button", { name: "Reload" }).click(),
    ]);
    expect(new URL(again.url()).pathname).toBe(FAILING);
  });

  test("the error page built ahead of time is served at its own address, with its hashes", async ({
    page,
  }) => {
    const { response, scriptSrc, violations } = await open(page, BUILT_ERROR_ROUTE);

    // The file itself, and a prerendered route to the proxy like any other.
    expect(response.status()).toBe(500);
    expect(await response.text()).toBe(readFileSync(BUILT_ERROR_FILE, "utf8"));
    expect(scriptSrc).not.toContain("'strict-dynamic'");
    expect(scriptSrc).toMatch(/'sha256-/);

    await expect
      .poll(() => page.evaluate(() => typeof Reflect.get(self, "__next_f")))
      .toBe("object");
    expect(await violations()).toEqual([]);
  });

  // What would be left of that page under the nonce shape, where none of its
  // scripts run: everything, as long as the button stays a form's submit button.
  test.describe("with JavaScript turned off", () => {
    test.use({ javaScriptEnabled: false });

    test("the built error page still reloads", async ({ page }) => {
      await page.goto(BUILT_ERROR_ROUTE);
      await expect(page.locator("html#__next_error__")).toBeAttached();
      // Next's wording, here and in the button's name: revisit on a Next upgrade.
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(/couldn.t load/);

      const [again] = await Promise.all([
        page.waitForRequest((request) => request.isNavigationRequest()),
        page.getByRole("button", { name: "Reload" }).click(),
      ]);
      expect(new URL(again.url()).pathname).toBe(BUILT_ERROR_ROUTE);
    });
  });
});
