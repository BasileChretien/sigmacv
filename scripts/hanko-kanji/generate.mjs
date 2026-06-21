/**
 * Provenance / regeneration script for the Hanko brush-kanji headings.
 *
 * Emits `src/lib/render/publicStyles/hankoKanji.ts`: one inline SVG per CV section
 * type, showing the section's concise Japanese name brushed in stroke by stroke.
 * Each glyph outline comes from the "Yuji Boku" brush font (via opentype.js) and is
 * revealed one stroke at a time by an SVG <mask> built from KanjiVG's stroke-order
 * paths. A single shared sumi ink-texture filter ("#hk-ink") is emitted via
 * HK_KANJI_FILTER. The mask stroke elements carry class "mk" + a cascading
 * animation-delay; hanko.ts supplies the .mk CSS that animates stroke-dashoffset.
 *
 * This is a one-off asset generator, NOT part of the build or test path — the
 * generated .ts is committed. To re-run it:
 *
 *     npm i --no-save opentype.js
 *     node scripts/hanko-kanji/generate.mjs
 *
 * It downloads its inputs at run time (no binaries are committed):
 *   • Brush font: Yuji Boku — SIL Open Font License 1.1 (Google Fonts).
 *   • Stroke order: KanjiVG (https://kanjivg.tagaini.net) — CC BY-SA 3.0.
 * Both licences are credited in the rendered public-page footer.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import opentype from "opentype.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".cache");
const DEST = resolve(HERE, "../../src/lib/render/publicStyles/hankoKanji.ts");
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/yujiboku/YujiBoku-Regular.ttf";

// Concise, accurate Japanese per section type (short + elegant beside the title).
const WORDS = {
  publications: "論文",
  preprints: "予稿",
  datasets: "資料",
  positions: "職歴",
  education: "学歴",
  awards: "受賞",
  talks: "講演",
  service: "委員",
  "peer-review": "査読",
  editorial: "編集",
  grants: "助成",
  "clinical-trials": "治験",
  patents: "特許",
  "narrative-knowledge": "知見",
  "narrative-individuals": "育成",
  "narrative-community": "共同",
  "narrative-society": "社会",
  statement: "声明",
  teaching: "教育",
  supervision: "指導",
  conference: "学会",
  skills: "技能",
  languages: "言語",
  references: "推薦",
  other: "雑記",
};

// Alignment / animation parameters (tuned so the brush glyph sits inside the mask).
const CELL = 109,
  GAP = 16,
  FS = 103,
  X = 3,
  Y = 95,
  DUR = 0.17,
  SGAP = 0.05,
  PREC = 1;
const code = (ch) => ch.codePointAt(0).toString(16).padStart(5, "0");

mkdirSync(CACHE, { recursive: true });

async function cached(name, url) {
  const f = resolve(CACHE, name);
  if (existsSync(f)) return f;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  return f;
}

const fontFile = await cached("YujiBoku-Regular.ttf", FONT_URL);
const font = opentype.parse(new Uint8Array(readFileSync(fontFile)).buffer);

const chars = [...new Set(Object.values(WORDS).join(""))];
for (const ch of chars) {
  await cached(
    `${code(ch)}.svg`,
    `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${code(ch)}.svg`,
  );
}
const kvg = (ch) => {
  const f = resolve(CACHE, `${code(ch)}.svg`);
  if (!existsSync(f)) return null;
  return [...readFileSync(f, "utf8").matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
};

function svgFor(type, phrase) {
  const ks = [...phrase];
  let si = 0,
    ok = true;
  const glyphs = [],
    maskGroups = [];
  ks.forEach((ch, k) => {
    const ox = k * (CELL + GAP);
    glyphs.push(`<path d="${font.getPath(ch, ox + X, Y, FS).toPathData(PREC)}" fill="#171310"/>`);
    const strokes = kvg(ch);
    if (!strokes) {
      ok = false;
      return;
    }
    maskGroups.push(
      `<g transform="translate(${ox},0)">` +
        strokes
          .map(
            (d) =>
              `<path d="${d}" pathLength="1" class="mk" style="animation-delay:${(si++ * (DUR + SGAP)).toFixed(2)}s"/>`,
          )
          .join("") +
        `</g>`,
    );
  });
  const w = ks.length * CELL + (ks.length - 1) * GAP;
  const mid = `km-${type}`;
  // If a kanji lacks KanjiVG data, fall back to a plain (always-shown) glyph.
  const inner = ok
    ? `<defs><mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${CELL}">${maskGroups.join("")}</mask></defs>` +
      `<g filter="url(#hk-ink)"><g mask="url(#${mid})">${glyphs.join("")}</g></g>`
    : `<g filter="url(#hk-ink)">${glyphs.join("")}</g>`;
  return `<svg class="hk-k-svg" viewBox="0 0 ${w} ${CELL}" xmlns="http://www.w3.org/2000/svg" aria-label="${phrase}">${inner}</svg>`;
}

const filter =
  `<svg class="hk-k-defs" width="0" height="0" aria-hidden="true" focusable="false">` +
  `<filter id="hk-ink" x="-7%" y="-12%" width="114%" height="124%">` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.82 0.66" numOctaves="2" seed="7" result="rough"/>` +
  `<feDisplacementMap in="SourceGraphic" in2="rough" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="disp"/>` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.45 0.95" numOctaves="2" seed="11" result="bristle"/>` +
  `<feColorMatrix in="bristle" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0 0 0 0.5" result="bmask"/>` +
  `<feComposite in="disp" in2="bmask" operator="in"/></filter></svg>`;

const entries = Object.entries(WORDS)
  .map(([type, w]) => `  ${JSON.stringify(type)}: ${JSON.stringify(svgFor(type, w))},`)
  .join("\n");

const out = `/**
 * GENERATED ASSET — do not hand-edit. Regenerate with scripts/hanko-kanji/generate.mjs.
 *
 * Per-section-type Japanese section labels, brushed in stroke by stroke. Each value is
 * an inline SVG: the kanji rendered from the "Yuji Boku" brush font (glyph outlines via
 * opentype.js) and revealed one stroke at a time by a mask built from KanjiVG's
 * stroke-order paths, with a shared sumi ink-texture filter ("#hk-ink", emitted once via
 * HK_KANJI_FILTER). The mask stroke elements carry class "mk" + per-stroke animation-delay.
 *
 * Credits (also surfaced in the page footer):
 *   • Stroke order: KanjiVG (https://kanjivg.tagaini.net) — CC BY-SA 3.0.
 *   • Brush font: Yuji Boku — SIL Open Font License 1.1.
 */
/* eslint-disable */
/* prettier-ignore */
export const HK_KANJI_FILTER = ${JSON.stringify(filter)};

/* prettier-ignore */
export const HK_KANJI: Record<string, string> = {
${entries}
};
`;
writeFileSync(DEST, out);
console.log(
  "wrote",
  DEST,
  "| types:",
  Object.keys(WORDS).length,
  "| chars:",
  chars.length,
  "| bytes:",
  out.length,
);
