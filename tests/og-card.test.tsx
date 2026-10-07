import { readFileSync } from "node:fs";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The site social cards (`src/app/ogCard.tsx` and the two `opengraph-image`
 * routes) are prerendered by `next build`, and their fonts come from Google Fonts
 * at that moment. Five things are pinned here:
 *
 *  - a font request that stalls is given up after 5 s and counts as a failure like
 *    any other, instead of holding the page until Next stops the build;
 *  - those 5 s are not read off the clock: a build worker busy drawing other
 *    cards must not be taken for a stalled connection;
 *  - the fonts asked for cover every glyph the card draws. For a glyph they lack,
 *    next/og fetches a font from Google Fonts itself, with no time limit;
 *  - each card asks for the family it is designed in, checked against a table
 *    written out here and not against the one the card is drawn from;
 *  - a card whose fonts did not load asks next/og for nothing a font would have
 *    to be fetched for: the Σ is a drawing, and Chinese, Japanese and Korean give
 *    way to English. (`og-card-offline.test.tsx` draws those cards through the
 *    real next/og and counts its requests.)
 *
 * No network: `fetch` is stubbed, and next/og is replaced by a recorder.
 */

const og = vi.hoisted(() => ({
  calls: [] as { element: unknown; options: Record<string, unknown> }[],
}));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: unknown, options: Record<string, unknown>) {
      og.calls.push({ element, options });
    }
  },
}));

vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import LocaleOpengraphImage, { generateStaticParams } from "@/app/[locale]/opengraph-image";
import OpengraphImage from "@/app/opengraph-image";
import { loadOgFonts } from "@/app/ogCard";
import { localeForSlug, type Locale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { logger } from "@/lib/log";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  og.calls.length = 0;
});

interface FetchInit {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
type FetchStub = (url: string, init?: FetchInit) => Promise<Response>;

const body = (text: string, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  }) as unknown as Response;

const weightOf = (url: string): string =>
  /wght@(\d+)/.exec(new URL(url).searchParams.get("family") ?? "")?.[1] ?? "";

/** Google's style sheet for one weight: it names the font file to fetch next. */
const styleSheet = (url: string): Response =>
  body(
    `@font-face { font-family: 'X'; src: url(https://fonts.gstatic.com/l/font?kit=w${weightOf(url)}) format('truetype'); }`,
  );
/** The font file: bytes that say which weight they are. */
const fontFile = (url: string): Response => body(`ttf-${new URL(url).searchParams.get("kit")}`);

const isStyleSheet = (url: string): boolean => new URL(url).hostname === "fonts.googleapis.com";

/** Google Fonts answering at once. */
const answers: FetchStub = async (url) => (isStyleSheet(url) ? styleSheet(url) : fontFile(url));
/** A request that is accepted and then never answered, whatever its signal does. */
const never = (): Promise<Response> => new Promise<Response>(() => {});
/** A response whose headers came and whose body never does. */
const headersOnly = (): Response =>
  ({
    ok: true,
    status: 200,
    text: () => new Promise<string>(() => {}),
    arrayBuffer: () => new Promise<ArrayBuffer>(() => {}),
  }) as unknown as Response;

function stubFetch(impl: FetchStub) {
  const f = vi.fn(impl);
  vi.stubGlobal("fetch", f);
  return f;
}

const text = (data: ArrayBuffer): string => new TextDecoder().decode(data);
const signals = (f: ReturnType<typeof stubFetch>): AbortSignal[] =>
  f.mock.calls.map(([, init]) => init!.signal!);
/** The `family` parameter of each style sheet asked for, in the order asked. */
const familiesAsked = (f: ReturnType<typeof stubFetch>): (string | null)[] =>
  f.mock.calls
    .filter(([url]) => isStyleSheet(url))
    .map(([url]) => new URL(url).searchParams.get("family"));

describe("loadOgFonts", () => {
  it("returns the regular and the extra-bold subset, each from its style sheet", async () => {
    const f = stubFetch(answers);
    const fonts = await loadOgFonts("Noto Sans JP", "学術 CV");

    expect(fonts.map((font) => ({ ...font, data: text(font.data) }))).toEqual([
      { name: "Noto Sans JP", weight: 400, style: "normal", data: "ttf-w400" },
      { name: "Noto Sans JP", weight: 800, style: "normal", data: "ttf-w800" },
    ]);

    const sheets = f.mock.calls.filter(([url]) => isStyleSheet(url));
    expect(sheets.map(([url]) => new URL(url).searchParams.get("family"))).toEqual([
      "Noto Sans JP:wght@400",
      "Noto Sans JP:wght@800",
    ]);
    for (const [url, init] of sheets) {
      // The subset: the copy, its uppercase, and the card's own glyphs.
      const asked = new URL(url).searchParams.get("text")!;
      expect(asked).toContain("学術 CV");
      expect(asked).toContain("SigmaCV Σ sigmacv.org");
      // An old browser's UA, so that Google names a truetype file.
      expect(init!.headers!["User-Agent"]).toContain("MSIE 9.0");
    }
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("leaves no timer running, and aborts nothing, once the fonts are in", async () => {
    vi.useFakeTimers();
    const f = stubFetch(answers);
    expect(await loadOgFonts("Inter", "Hello")).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(signals(f).some((signal) => signal.aborted)).toBe(false);
  });

  it("returns nothing when Google Fonts cannot be reached", async () => {
    const f = stubFetch(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await loadOgFonts("Inter", "Hello")).toEqual([]);
    expect(f).toHaveBeenCalledTimes(2);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("returns nothing when the style sheet names no font file", async () => {
    const f = stubFetch(async () => body("/* no such family */"));
    expect(await loadOgFonts("Inter", "Hello")).toEqual([]);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("does not follow a style sheet answered with an error, whatever its body says", async () => {
    const f = stubFetch(async (url) => body(await styleSheet(url).text(), 503));
    expect(await loadOgFonts("Inter", "Hello")).toEqual([]);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("drops a weight whose font file is answered with an error page", async () => {
    // Passed on as font data, the page makes next/og throw ("Unsupported OpenType
    // signature <htm"), and the build fails on the card instead of falling back.
    stubFetch(async (url) => {
      if (isStyleSheet(url)) return styleSheet(url);
      return url.includes("kit=w800") ? body("<html>503</html>", 503) : fontFile(url);
    });
    expect((await loadOgFonts("Inter", "Hello")).map((font) => font.weight)).toEqual([400]);
  });

  it("keeps the weight that loaded when the other fails", async () => {
    stubFetch(async (url) => {
      if (isStyleSheet(url)) return styleSheet(url);
      if (url.includes("kit=w800")) throw new TypeError("fetch failed");
      return fontFile(url);
    });
    expect((await loadOgFonts("Inter", "Hello")).map((font) => font.weight)).toEqual([400]);
  });

  it("gives up after 5 s on a style sheet that never answers, and drops the requests", async () => {
    vi.useFakeTimers();
    const f = stubFetch(never);
    let fonts: unknown;
    void loadOgFonts("Inter", "Hello").then((loaded) => (fonts = loaded));

    await vi.advanceTimersByTimeAsync(4_999);
    expect(fonts).toBeUndefined();
    expect(f).toHaveBeenCalledTimes(2);
    expect(signals(f).some((signal) => signal.aborted)).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(fonts).toEqual([]);
    expect(signals(f).every((signal) => signal.aborted)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    // Said in the build log, once per weight: nothing else shows the card changed.
    const said = { timeoutMs: 5_000, waitedMs: 5_000 };
    expect(vi.mocked(logger.warn).mock.calls).toEqual([
      ["og_card.font_timed_out", { family: "Inter", weight: 400, ...said }],
      ["og_card.font_timed_out", { family: "Inter", weight: 800, ...said }],
    ]);
  });

  it("logs how long it really waited, which a busy process makes longer than the limit", async () => {
    vi.useFakeTimers();
    stubFetch(never);
    void loadOgFonts("Inter", "Hello");

    await vi.advanceTimersByTimeAsync(4_980);
    // Six seconds in which the event loop never came round: no turn is counted.
    vi.setSystemTime(Date.now() + 6_000);
    expect(logger.warn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(20);
    expect(logger.warn).toHaveBeenCalledWith("og_card.font_timed_out", {
      family: "Inter",
      weight: 400,
      timeoutMs: 5_000,
      waitedMs: 11_000,
    });
  });

  it.each([
    ["the style sheet", isStyleSheet, 2],
    ["the font file", (url: string) => !isStyleSheet(url), 4],
  ])(
    "gives up after 5 s when %s answers and its body never comes",
    async (_what, stalls, requests) => {
      vi.useFakeTimers();
      // Headers at once, then nothing: the second 300 s Node's fetch would wait.
      const f = stubFetch(async (url) => (stalls(url) ? headersOnly() : answers(url)));
      let fonts: unknown;
      void loadOgFonts("Inter", "Hello").then((loaded) => (fonts = loaded));

      await vi.advanceTimersByTimeAsync(4_999);
      expect(fonts).toBeUndefined();
      expect(f).toHaveBeenCalledTimes(requests);

      await vi.advanceTimersByTimeAsync(1);
      expect(fonts).toEqual([]);
      expect(signals(f).every((signal) => signal.aborted)).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("gives up after 5 s on requests that fail when aborted, as fetch does, and says so once", async () => {
    vi.useFakeTimers();
    // Node's fetch with a silent peer: nothing, until its signal fires, and then
    // a rejection with the signal's reason. The limit and the rejection arrive
    // together.
    let rejected = 0;
    stubFetch(
      (_url, init) =>
        new Promise<Response>((_, reject) => {
          init!.signal!.addEventListener("abort", () => {
            rejected += 1;
            reject(init!.signal!.reason);
          });
        }),
    );
    let fonts: unknown;
    void loadOgFonts("Inter", "Hello").then((loaded) => (fonts = loaded));

    await vi.advanceTimersByTimeAsync(4_999);
    expect(fonts).toBeUndefined();
    expect(rejected).toBe(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(fonts).toEqual([]);
    expect(rejected).toBe(2);
    // One line per weight, not two; and no rejection is left without a handler,
    // which would fail the run.
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it("counts the 5 s from the start, not from each request: a font file that stalls", async () => {
    vi.useFakeTimers();
    // The style sheets take 3 s; the files they name never come.
    const f = stubFetch((url) =>
      isStyleSheet(url)
        ? new Promise((resolve) => setTimeout(() => resolve(styleSheet(url)), 3_000))
        : never(),
    );
    let fonts: unknown;
    void loadOgFonts("Inter", "Hello").then((loaded) => (fonts = loaded));

    await vi.advanceTimersByTimeAsync(3_000);
    expect(f).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(1_999);
    expect(fonts).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    expect(fonts).toEqual([]);
    expect(signals(f).every((signal) => signal.aborted)).toBe(true);
  });

  it("keeps the weight that loaded when the other stalls", async () => {
    vi.useFakeTimers();
    stubFetch((url) => (url.includes("800") ? never() : answers(url)));
    let fonts: { weight: number }[] | undefined;
    void loadOgFonts("Inter", "Hello").then((loaded) => (fonts = loaded));

    await vi.advanceTimersByTimeAsync(4_999);
    expect(fonts).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(fonts?.map((font) => font.weight)).toEqual([400]);
  });

  it("does not take a busy process for a stall: fonts that arrived meanwhile are kept", async () => {
    // Real timers. Google answers every request within 20 ms...
    stubFetch((url) => new Promise((resolve) => setTimeout(() => resolve(answers(url)), 20)));
    const loading = loadOgFonts("Inter", "Hello");
    // ...and the process cannot read the answers for longer than the whole limit,
    // as when `next build` draws other cards in the same worker. Seen in a real
    // build: a 5 s limit read off the clock dropped the fonts of four to six cards
    // out of ten, with Google answering in under a second.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5_500);
    expect((await loading).map((font) => font.weight)).toEqual([400, 800]);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

/**
 * Every string an element tree hands to satori, uppercased where the element's
 * own style says so (the eyebrow). Components are called, as satori calls them.
 */
function drawn(node: ReactNode, out: string[] = []): string[] {
  if (typeof node === "string" || typeof node === "number") return [...out, String(node)];
  if (Array.isArray(node)) return node.reduce<string[]>((acc, child) => drawn(child, acc), out);
  if (!isValidElement(node)) return out;
  if (typeof node.type === "function") {
    return drawn((node.type as (props: unknown) => ReactNode)(node.props), out);
  }
  const { children, style } = node.props as {
    children?: ReactNode;
    style?: { textTransform?: string };
  };
  const own = drawn(children);
  return [
    ...out,
    ...(style?.textTransform === "uppercase" ? own.map((s) => s.toUpperCase()) : own),
  ];
}

/** The host elements of a tree, in order; components are called, as above. */
function hosts(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    return node.reduce<ReactElement[]>((acc, child) => hosts(child, acc), out);
  }
  if (!isValidElement(node)) return out;
  if (typeof node.type === "function") {
    return hosts((node.type as (props: unknown) => ReactNode)(node.props), out);
  }
  return hosts((node.props as { children?: ReactNode }).children, [...out, node]);
}

/** A drawn Σ: the shape of its `<svg>` and `<path>`, and how the path is painted. */
interface SigmaDrawing {
  viewBox: string;
  d: string;
  strokeWidth: number;
  strokeLinejoin: string;
  strokeLinecap: string;
  fill: string;
  stroke: string;
}

const ICON = readFileSync("public/icon.svg", "utf8");
const iconPath = (attribute: string): string =>
  new RegExp(`<path[^>]* ${attribute}="([^"]+)"`).exec(ICON)![1]!;

/** The Σ of the favicon: the shape a card without fonts draws in place of the glyph. */
const ICON_SIGMA: Omit<SigmaDrawing, "fill" | "stroke"> = {
  viewBox: /viewBox="([^"]+)"/.exec(ICON)![1]!,
  d: iconPath("d"),
  strokeWidth: Number(iconPath("stroke-width")),
  strokeLinejoin: iconPath("stroke-linejoin"),
  strokeLinecap: iconPath("stroke-linecap"),
};

/**
 * The two such a card draws, with their paint written out. The path is open: it
 * is a line, and takes no fill (SVG fills in black unless told otherwise). Each
 * is the colour the glyph has on the designed card: white on the medallion,
 * `ACCENT_600` on the CV mock.
 */
const DRAWN_SIGMAS: SigmaDrawing[] = [
  { ...ICON_SIGMA, fill: "none", stroke: "#ffffff" },
  { ...ICON_SIGMA, fill: "none", stroke: "#2b4fd6" },
];

/** Every Σ a tree draws: an `<svg>` and the one `<path>` in it. */
function sigmaDrawings(element: unknown): SigmaDrawing[] {
  const all = hosts(element as ReactNode);
  return all.flatMap((host, i) => {
    if (host.type !== "svg") return [];
    const { viewBox } = host.props as { viewBox: string };
    const { d, strokeWidth, strokeLinejoin, strokeLinecap, fill, stroke } = all[i + 1]!
      .props as SigmaDrawing;
    return [{ viewBox, d, strokeWidth, strokeLinejoin, strokeLinecap, fill, stroke }];
  });
}

type Card = [path: string, locale: Locale, render: () => Promise<unknown>];

/** The ten cards `next build` prerenders: the default one, then one per locale. */
const CARDS: Card[] = [
  ["/", "en-US", () => OpengraphImage()],
  ...generateStaticParams().map(({ locale }): Card => [
    `/${locale}`,
    localeForSlug(locale)!,
    () => LocaleOpengraphImage({ params: Promise.resolve({ locale }) }),
  ]),
];

/**
 * The Google Fonts family each card is designed in, written out: read off
 * `OG_TYPE`, that table would be compared with itself, and a wrong family for a
 * locale would pass.
 */
const DESIGNED_IN: Record<Locale, string> = {
  "en-US": "Inter",
  "zh-CN": "Noto Sans SC",
  "es-ES": "Noto Sans",
  "fr-FR": "Noto Sans",
  "de-DE": "Noto Sans",
  "ja-JP": "Noto Sans JP",
  "pt-BR": "Noto Sans",
  "it-IT": "Noto Sans",
  "ko-KR": "Noto Sans KR",
  "ru-RU": "Noto Sans",
};

/** Scripts the font bundled with next/og has no glyphs for. */
const NOT_IN_BUNDLED_FONT: Locale[] = ["zh-CN", "ja-JP", "ko-KR"];

/** What a card must be when none of its fonts loaded: nothing left to fetch. */
function expectCardFromDisk(locale: Locale): void {
  expect(og.calls).toHaveLength(1);
  const { element, options } = og.calls[0]!;
  // No fonts handed over: next/og draws in the one it ships with.
  expect(options).toEqual({ width: 1200, height: 630 });
  expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe("sans-serif");

  // That font has no Σ. It is drawn instead, on the medallion and on the CV
  // mock, in the shape `public/icon.svg` gives it: a line, in each one's colour.
  const words = drawn(element as ReactNode).join(" ");
  expect(words).not.toContain("Σ");
  expect(sigmaDrawings(element)).toEqual(DRAWN_SIGMAS);

  // Nor has it Chinese, Japanese or Korean: those cards say it in English.
  const own = landingStrings(locale);
  const english = landingStrings("en-US");
  if (NOT_IN_BUNDLED_FONT.includes(locale)) {
    expect(words).toContain(english.heroTitle);
    expect(words).not.toContain(own.heroTitle);
  } else {
    expect(words).toContain(own.heroTitle);
  }

  // A green build shows nothing of this; the log does.
  expect(logger.warn).toHaveBeenCalledWith("og_card.drawn_without_fonts", { locale });
}

describe("the social cards", () => {
  it("are ten", () => {
    expect(CARDS).toHaveLength(10);
  });

  it.each(CARDS)(
    "%s is drawn in fonts that have every glyph it uses",
    async (_path, locale, render) => {
      const f = stubFetch(answers);
      await render();

      const { element, options } = og.calls[0]!;
      const fonts = options.fonts as { name: string; weight: number }[];
      expect(fonts.map((font) => font.weight)).toEqual([400, 800]);
      expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe(
        fonts[0]!.name,
      );

      // As designed: its own copy, and the Σ as a glyph of its font.
      const words = drawn(element as ReactNode).join(" ");
      expect(words).toContain(landingStrings(locale).heroTitle);
      expect(sigmaDrawings(element)).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();

      const used = new Set(words);
      expect(used.has("Σ")).toBe(true);
      for (const [url] of f.mock.calls.filter(([url]) => isStyleSheet(url))) {
        const asked = new Set(new URL(url).searchParams.get("text")!);
        expect([...used].filter((glyph) => !asked.has(glyph))).toEqual([]);
      }
    },
  );

  it.each(CARDS)(
    "%s asks Google Fonts for the family it is designed in",
    async (_path, locale, render) => {
      const f = stubFetch(answers);
      await render();

      // The test above holds the card to the fonts it was handed, whatever their
      // family. This one holds the family, in both weights' requests.
      const family = DESIGNED_IN[locale];
      expect(familiesAsked(f)).toEqual([`${family}:wght@400`, `${family}:wght@800`]);
      const { element } = og.calls[0]!;
      expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe(family);
    },
  );

  it.each(["en", "xx"])(
    "/%s, a slug that is not prerendered, is drawn in English, in Inter",
    async (slug) => {
      // `generateStaticParams` names neither: `en` is the default locale's own
      // slug, and `xx` is no locale's. Handed either, the route draws the default
      // locale's card, as `/` does.
      expect(generateStaticParams()).not.toContainEqual({ locale: slug });
      const f = stubFetch(answers);
      await LocaleOpengraphImage({ params: Promise.resolve({ locale: slug }) });

      expect(familiesAsked(f)).toEqual(["Inter:wght@400", "Inter:wght@800"]);
      const { element } = og.calls[0]!;
      expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe("Inter");
      expect(drawn(element as ReactNode).join(" ")).toContain(landingStrings("en-US").heroTitle);
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it("asks for the ellipsis of a shortened line (seven cards shorten their sub-heading)", async () => {
    const f = stubFetch(answers);
    await OpengraphImage();
    expect(drawn(og.calls[0]!.element as ReactNode).join("")).toContain("…");
    for (const [url] of f.mock.calls.filter(([url]) => isStyleSheet(url))) {
      expect(new URL(url).searchParams.get("text")).toContain("…");
    }
  });

  it("stays as designed, in the one weight that loaded, when the other does not", async () => {
    stubFetch(async (url) => {
      if (url.includes("800")) throw new TypeError("fetch failed");
      return answers(url);
    });
    await LocaleOpengraphImage({ params: Promise.resolve({ locale: "ja" }) });

    const { element, options } = og.calls[0]!;
    expect((options.fonts as { weight: number }[]).map((font) => font.weight)).toEqual([400]);
    expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe("Noto Sans JP");
    // Each weight is asked for every glyph of the card (the test above), so one
    // is enough to draw it, Σ included, in its own copy.
    const words = drawn(element as ReactNode).join(" ");
    expect(words).toContain(landingStrings("ja-JP").heroTitle);
    expect(words).toContain("Σ");
    expect(sigmaDrawings(element)).toEqual([]);
    // Not as designed all the same, and said so.
    expect(vi.mocked(logger.warn).mock.calls).toEqual([
      ["og_card.drawn_in_one_weight", { locale: "ja-JP", weight: 400 }],
    ]);
  });

  it.each(CARDS)(
    "%s is drawn from what is on disk when Google Fonts cannot be reached",
    async (_path, locale, render) => {
      stubFetch(async () => {
        throw new TypeError("fetch failed");
      });
      await render();
      expectCardFromDisk(locale);
    },
  );

  it.each(CARDS)(
    "%s is drawn from what is on disk once Google Fonts has stalled for 5 s",
    async (_path, locale, render) => {
      vi.useFakeTimers();
      stubFetch(never);
      let done = false;
      void render().then(() => (done = true));

      await vi.advanceTimersByTimeAsync(4_999);
      expect(done).toBe(false);
      expect(og.calls).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(1);
      expect(done).toBe(true);

      expectCardFromDisk(locale);
    },
  );
});
