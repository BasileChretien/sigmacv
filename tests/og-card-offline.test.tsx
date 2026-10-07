import { ImageResponse } from "next/og";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The site social cards drawn WITHOUT their fonts, through the real next/og.
 *
 * next/og draws in the font it ships with (Geist) and, for any glyph that font
 * lacks, fetches one from Google Fonts itself: plain `fetch`, no signal, no
 * option to turn it off. During `next build` a stall there holds the card until
 * Next stops the build, whatever limit our own requests carry. So a card whose
 * fonts did not load must draw nothing the bundled font lacks.
 *
 * Here the network refuses every request, each of the ten cards is drawn for
 * real, and the requests are counted. Ours are the two style sheets, one per
 * weight, each with its signal. Anything else is next/og's, and fails the test:
 * a character added to the copy that Geist has no glyph for, a locale wrongly
 * marked as drawable, or a Next upgrade that changes the bundled font.
 */

vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import LocaleOpengraphImage, { generateStaticParams } from "@/app/[locale]/opengraph-image";
import OpengraphImage from "@/app/opengraph-image";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

interface Asked {
  url: string;
  signal: boolean;
}

const realFetch = globalThis.fetch;

/** Refuse everything but the `data:` URL next/og loads its layout engine from. */
function refuseTheNetwork(): Asked[] {
  const asked: Asked[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("data:")) return realFetch(input, init);
    asked.push({ url, signal: Boolean(init?.signal) });
    return Promise.reject(new TypeError("fetch failed"));
  });
  return asked;
}

const CARDS: [string, () => Promise<Response>][] = [
  ["/", () => OpengraphImage()],
  ...generateStaticParams().map(({ locale }): [string, () => Promise<Response>] => [
    `/${locale}`,
    () => LocaleOpengraphImage({ params: Promise.resolve({ locale }) }),
  ]),
];

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("a social card whose fonts did not load", () => {
  it("is what this file guards against: next/og fetching a glyph its font lacks", async () => {
    // The control. Were next/og to stop going through `fetch`, or its font to
    // gain a Σ, the tests below would pass without proving anything.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const asked = refuseTheNetwork();

    const response = new ImageResponse(<div style={{ display: "flex" }}>Σ</div>, {
      width: 100,
      height: 100,
    });
    await response.arrayBuffer();

    expect(asked.length).toBeGreaterThan(0);
    for (const request of asked) {
      expect(new URL(request.url).hostname).toBe("fonts.googleapis.com");
      expect(request.signal).toBe(false);
    }
  });

  it.each(CARDS)("%s is drawn without next/og asking for anything", async (_path, render) => {
    const asked = refuseTheNetwork();

    const response = await render();
    const png = new Uint8Array(await response.arrayBuffer());

    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(asked.filter((request) => !request.signal).map((request) => request.url)).toEqual([]);
    expect(asked.map((request) => new URL(request.url).hostname)).toEqual([
      "fonts.googleapis.com",
      "fonts.googleapis.com",
    ]);
  });
});
