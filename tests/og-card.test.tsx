import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The site social cards (`src/app/ogCard.tsx` and the two `opengraph-image`
 * routes) are prerendered by `next build`, and their fonts come from Google Fonts
 * at that moment. Three things are pinned here:
 *
 *  - a font request that stalls is given up after 5 s and counts as a failure like
 *    any other, so the card falls back to the default font instead of holding the
 *    page until Next stops the build;
 *  - those 5 s are not read off the clock: a build worker busy drawing other
 *    cards must not be taken for a stalled connection;
 *  - the fonts asked for cover every glyph the card draws. For a glyph they lack,
 *    next/og fetches a font from Google Fonts itself, with no time limit.
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

function stubFetch(impl: FetchStub) {
  const f = vi.fn(impl);
  vi.stubGlobal("fetch", f);
  return f;
}

const text = (data: ArrayBuffer): string => new TextDecoder().decode(data);
const signals = (f: ReturnType<typeof stubFetch>): AbortSignal[] =>
  f.mock.calls.map(([, init]) => init!.signal!);

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
    expect(vi.mocked(logger.warn).mock.calls).toEqual([
      ["og_card.font_timed_out", { family: "Inter", weight: 400, timeoutMs: 5_000 }],
      ["og_card.font_timed_out", { family: "Inter", weight: 800, timeoutMs: 5_000 }],
    ]);
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

/** The ten cards `next build` prerenders: the default one, then one per locale. */
const CARDS: [string, () => Promise<unknown>][] = [
  ["/", () => OpengraphImage()],
  ...generateStaticParams().map(({ locale }): [string, () => Promise<unknown>] => [
    `/${locale}`,
    () => LocaleOpengraphImage({ params: Promise.resolve({ locale }) }),
  ]),
];

describe("the social cards", () => {
  it("are ten", () => {
    expect(CARDS).toHaveLength(10);
  });

  it.each(CARDS)("%s is drawn in fonts that have every glyph it uses", async (_path, render) => {
    const f = stubFetch(answers);
    await render();

    const { element, options } = og.calls[0]!;
    const fonts = options.fonts as { name: string; weight: number }[];
    expect(fonts.map((font) => font.weight)).toEqual([400, 800]);
    expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe(fonts[0]!.name);

    const used = new Set(drawn(element as ReactNode).join(""));
    expect(used.has("Σ")).toBe(true);
    for (const [url] of f.mock.calls.filter(([url]) => isStyleSheet(url))) {
      const asked = new Set(new URL(url).searchParams.get("text")!);
      expect([...used].filter((glyph) => !asked.has(glyph))).toEqual([]);
    }
  });

  it("asks for the ellipsis of a shortened line (seven cards shorten their sub-heading)", async () => {
    const f = stubFetch(answers);
    await OpengraphImage();
    expect(drawn(og.calls[0]!.element as ReactNode).join("")).toContain("…");
    for (const [url] of f.mock.calls.filter(([url]) => isStyleSheet(url))) {
      expect(new URL(url).searchParams.get("text")).toContain("…");
    }
  });

  it.each(CARDS)(
    "%s stops waiting for its fonts after 5 s when Google Fonts stalls, and asks next/og for the default font",
    async (_path, render) => {
      vi.useFakeTimers();
      stubFetch(never);
      let done = false;
      void render().then(() => (done = true));

      await vi.advanceTimersByTimeAsync(4_999);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(done).toBe(true);

      const { element, options } = og.calls[0]!;
      expect((element as ReactElement<{ fontFamily: string }>).props.fontFamily).toBe("sans-serif");
      expect(options).toEqual({ width: 1200, height: 630 });
    },
  );
});
