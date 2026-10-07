import { ImageResponse } from "next/og";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The site social cards drawn WITHOUT their fonts, through the real next/og.
 *
 * next/og draws in the font it ships with (Geist) and, for a glyph that font
 * lacks, can go to a third party itself: Google Fonts for a font, or jsDelivr
 * for a picture when the glyph is an emoji. Plain `fetch`, no signal, and (read
 * in the loader, not held by a test) no option to turn it off. During
 * `next build` a stall there holds the card until
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
 * font and takes no such care. What it asks for, and what a refusal or an error
 * answer then does, is written down as it is today: a known gap, held here so
 * that the card's comments stay true and so that closing it starts from a red
 * test. It is not a requirement. Two of those tests answer a request where the
 * others refuse them all, and what next/og keeps of the answer (ranges in one,
 * an empty result in the other) it keeps for as long as the process lives: read
 * in the loader, the last test holding it from one render to the next. So those
 * two ask for characters no other test asks for.
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
 * The first request for the card's own Σ, which Geist lacks: a style sheet of
 * Google Fonts, for a family and with no `text` yet.
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

/**
 * Greek letters Geist lacks, another at each run of the last test below. What
 * next/og keeps there, it keeps under the characters it asked for (read in the
 * loader: `assetCache`). The same letter at a second run in one process (a
 * retry, a repeat) would find the first run's, and the bare Σ would leave one
 * where the other tests look.
 */
const NOT_IN_GEIST = [..."ξζψφχθδβγα"];
let lettersUsed = 0;

describe("the per-CV card, which passes no font (as it is today: a known gap, not a requirement)", () => {
  it("asks Google Fonts for its Σ; refused, that is printed, the card is still drawn, and the next render asks again", async () => {
    const said = vi.spyOn(console, "error").mockImplementation(() => {});
    const asked = refuseTheNetwork();

    const png = new Uint8Array(await renderCvOgImage(PUBLISHED).arrayBuffer());

    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(requests(asked)).toEqual([SIGMA_RANGES]);
    // next/og catches the refusal and prints it, with the characters.
    expect(said.mock.calls).toEqual([
      ["Failed to load dynamic font for", "Σ", ". Error:", expect.any(TypeError)],
    ]);

    // It keeps nothing of a refusal: the same request goes out again.
    await renderCvOgImage(PUBLISHED).arrayBuffer();
    expect(requests(asked)).toEqual([SIGMA_RANGES, SIGMA_RANGES]);
  });

  it("asks jsDelivr for an emoji's picture, and is not drawn at all when that request is refused", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const asked = refuseTheNetwork();

    const image = renderCvOgImage({ ...PUBLISHED, headline: `Geneticist ${DNA}` });
    // A refused font request is caught inside next/og, as above. A refused
    // picture request is not.
    await expect(image.arrayBuffer()).rejects.toThrow("fetch failed");

    // Two third parties in one render: Google Fonts for the Σ, as above, and
    // jsDelivr for the emoji, named by its code point. Neither with a signal.
    const toGoogle = requests(asked).filter(({ host }) => host === SIGMA_RANGES.host);
    const [picture, ...others] = requests(asked).filter(({ host }) => host !== SIGMA_RANGES.host);
    expect(toGoogle).toEqual([SIGMA_RANGES]);
    expect(others).toEqual([]);
    expect(picture).toMatchObject({ host: "cdn.jsdelivr.net", signal: false });
    expect(picture!.path).toMatch(/\/1f9ec\.svg$/);
  });

  it("sends Google Fonts the characters Geist lacks, as a request's `text`", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // The first style sheet is answered, giving one family every character, so
    // that the next request is made; that one is refused. The first names the
    // families next/og has no ranges for yet (read in the loader:
    // `FontDetector.load`): four at a first run, three at a second in the same
    // process, so one naming any of the four is answered.
    const asked = refuseTheNetwork((url) =>
      url.searchParams.has("display") &&
      url.searchParams.getAll("family").some((f) => /^Noto Sans (JP|SC|TC|HK)$/.test(f))
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
    expect(requests(asked).filter(({ signal }) => signal)).toEqual([]);
  });

  it("is not asked again once Google Fonts has answered its first style sheet with an error", async () => {
    const said = vi.spyOn(console, "error").mockImplementation(() => {});
    const letter = NOT_IN_GEIST[lettersUsed++ % NOT_IN_GEIST.length]!;
    const card = { ...PUBLISHED, headline: `${letter}-calculus` };

    // Refused first, which keeps nothing: next/og prints the characters it
    // lacks, the Σ and the letter. Were the letter in Geist, this would stop
    // here, before anything is kept for the Σ alone.
    const refused = refuseTheNetwork();
    await renderCvOgImage(card).arrayBuffer();
    expect(requests(refused)).toEqual([SIGMA_RANGES]);
    expect(said.mock.calls).toEqual([
      ["Failed to load dynamic font for", `Σ${letter}`, ". Error:", expect.any(TypeError)],
    ]);
    said.mockClear();

    // Then answered, with an error: one request for two renders, nothing
    // printed, and a card all the same.
    const asked = refuseTheNetwork((url) =>
      url.hostname === "fonts.googleapis.com" ? new Response("", { status: 503 }) : undefined,
    );
    const png = new Uint8Array(await renderCvOgImage(card).arrayBuffer());
    await renderCvOgImage(card).arrayBuffer();

    expect(requests(asked)).toEqual([SIGMA_RANGES]);
    expect(said).not.toHaveBeenCalled();
    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
  });
});
