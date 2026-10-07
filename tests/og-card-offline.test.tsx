import { ImageResponse } from "next/og";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The site social cards drawn WITHOUT their fonts, through the real next/og.
 *
 * next/og draws in the font it ships with (Geist) and, for a glyph that font
 * lacks, asks a third party itself: Google Fonts for a font, or jsDelivr for a
 * picture when the glyph is an emoji. Plain `fetch`, no signal, no option to
 * turn it off. During `next build` a stall there holds the card until
 * Next stops the build, whatever limit our own requests carry. So a card whose
 * fonts did not load must draw nothing the bundled font lacks.
 *
 * Here the network refuses every request, each of the ten cards is drawn for
 * real, and the requests are counted. Ours are the two style sheets, one per
 * weight, each with its signal. Anything else is next/og's, and fails the test:
 * a character added to the copy that Geist has no glyph for, a locale wrongly
 * marked as drawable, or a Next upgrade that changes the bundled font.
 *
 * Last comes the per-CV card (`src/app/p/[slug]/og/card.tsx`), which passes no
 * font and takes no such care. What it asks for is written down as it is today:
 * a known gap, held here so that the card's comments stay true and so that
 * closing it starts from a red test. It is not a requirement.
 */

vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import LocaleOpengraphImage, { generateStaticParams } from "@/app/[locale]/opengraph-image";
import OpengraphImage from "@/app/opengraph-image";
import { renderCvOgImage } from "@/app/p/[slug]/og/card";
import type { OgImageProps } from "@/lib/cv/ogImage";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

interface Asked {
  url: string;
  signal: boolean;
}

const realFetch = globalThis.fetch;

/**
 * Refuse everything but the `data:` URL next/og loads its layout engine from,
 * and the request `answer` has a response for, if one is given.
 */
function refuseTheNetwork(answer?: (url: URL) => Response | undefined): Asked[] {
  const asked: Asked[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("data:")) return realFetch(input, init);
    asked.push({ url, signal: Boolean(init?.signal) });
    const answered = answer?.(new URL(url));
    return answered ? Promise.resolve(answered) : Promise.reject(new TypeError("fetch failed"));
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

/** A request as the tests below read it: where it went, and what it carried. */
const requests = (asked: Asked[]) =>
  asked.map(({ url, signal }) => {
    const { hostname, pathname, searchParams } = new URL(url);
    return {
      host: hostname,
      path: pathname,
      family: searchParams.getAll("family"),
      text: searchParams.get("text"),
      signal,
    };
  });

/** What the route hands the card for a published CV. Geist has all of it. */
const PUBLISHED: OgImageProps = {
  name: "Ada Lovelace",
  initials: "AL",
  headline: "Mathematician",
  affiliation: "Analytical Engine Laboratory",
  accentColor: "#1f4fd8",
};

/**
 * The first request for the card's own Σ, which Geist lacks: the style sheet of
 * the family next/og looks for it in, read for its unicode ranges. No `text` yet.
 */
const SIGMA_RANGES = {
  host: "fonts.googleapis.com",
  path: "/css2",
  family: ["Noto Sans"],
  text: null,
  signal: false,
};

/** An emoji, as a headline may carry one: U+1F9EC. */
const DNA = "\u{1F9EC}";

describe("the per-CV card, which passes no font (as it is today: a known gap, not a requirement)", () => {
  it("asks Google Fonts for its Σ, is drawn without it when refused, and asks again at the next render", async () => {
    const said = vi.spyOn(console, "error").mockImplementation(() => {});
    const asked = refuseTheNetwork();

    const png = new Uint8Array(await renderCvOgImage(PUBLISHED).arrayBuffer());

    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(requests(asked)).toEqual([SIGMA_RANGES]);
    // next/og catches the refusal and prints it, with the characters.
    expect(said.mock.calls).toEqual([
      ["Failed to load dynamic font for", "Σ", ". Error:", expect.any(TypeError)],
    ]);

    // It keeps nothing of a failure: the same request goes out again.
    await renderCvOgImage(PUBLISHED).arrayBuffer();
    expect(requests(asked)).toEqual([SIGMA_RANGES, SIGMA_RANGES]);
  });

  it("asks jsDelivr for an emoji's picture, and is not drawn at all when that request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const asked = refuseTheNetwork();

    const image = renderCvOgImage({ ...PUBLISHED, headline: `Geneticist ${DNA}` });
    // The font's failure is caught inside next/og; the picture's is not, and the
    // route's handler has no catch of its own.
    await expect(image.arrayBuffer()).rejects.toThrow("fetch failed");

    // Two third parties in one render: Google Fonts for the Σ, as above, and
    // jsDelivr for the emoji, named by its code point. Neither with a signal.
    const [picture, ...others] = requests(asked).filter(({ host }) => host !== SIGMA_RANGES.host);
    expect(requests(asked)).toContainEqual(SIGMA_RANGES);
    expect(others).toEqual([]);
    expect(picture).toMatchObject({ host: "cdn.jsdelivr.net", signal: false });
    expect(picture!.path).toMatch(/\/1f9ec\.svg$/);
  });

  it("sends Google Fonts the characters Geist lacks, as a request's `text`", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // The style sheet read for unicode ranges is answered, giving the family
    // every character, so that the next request is made; that one is refused.
    // next/og keeps such an answer while the process lives: this is the Japanese
    // family's, which no other test of this file has it ask for.
    const asked = refuseTheNetwork((url) =>
      url.searchParams.has("display") && url.searchParams.get("family") === "Noto Sans JP"
        ? new Response("@font-face { font-family: 'Noto Sans JP'; unicode-range: U+0000-FFFF; }")
        : undefined,
    );

    const image = renderCvOgImage({ ...PUBLISHED, headline: "薬理学者" });
    const png = new Uint8Array(await image.arrayBuffer());

    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(requests(asked)).toContainEqual({
      host: "fonts.googleapis.com",
      path: "/css2",
      family: ["Noto Sans JP"],
      text: "薬理学者",
      signal: false,
    });
  });
});
