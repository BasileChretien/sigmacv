/**
 * Regenerate the Hanko style's Great Wave art:
 *   src/lib/render/publicStyles/hankoWaveArt.ts
 *
 * Source: The Metropolitan Museum of Art, Open Access object 45434 — Katsushika
 * Hokusai, "Under the Wave off Kanagawa" (The Great Wave), c. 1831. The original
 * woodblock print is public domain; the Met releases this scan under CC0. We fetch
 * the high-res scan, crop to the iconic crest band, quantise to a fixed Hokusai
 * palette, trace each colour with potrace, and group the paths into three CSS
 * background layers (back · blue body · foam) that the style animates independently.
 *
 * This is a one-off asset generator (not wired into CI). To run it:
 *   npm i -D sharp potrace
 *   node scripts/hanko-wave/trace.mjs
 *
 * The output module is committed; you only need to re-run this if you want to retune
 * the crop / palette / fidelity. No network or extra deps are needed at build time.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import potrace from "potrace";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../../src/lib/render/publicStyles/hankoWaveArt.ts");
const MET_OBJECT = 45434;

// Fixed, authentic Hokusai palette (sampled hues), each tied to an animation role.
const PAL = [
  { hex: "#e7d6ad", role: "sky", rgb: [231, 214, 173] }, // paper / sky (flat backdrop)
  { hex: "#9aa6a4", role: "fuji", rgb: [154, 166, 164] }, // cloud-bank / Fuji grey / distant sea
  { hex: "#21456b", role: "deep", rgb: [33, 69, 107] }, // deep Prussian blue masses
  { hex: "#3f6f9c", role: "mid", rgb: [63, 111, 156] }, // mid blue (troughs / inner wave)
  { hex: "#14314d", role: "ink", rgb: [20, 49, 77] }, // darkest outline ink
  { hex: "#f4ecd6", role: "foam", rgb: [244, 236, 214] }, // foam / spray cream-white
];

async function fetchSource() {
  const api = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${MET_OBJECT}`;
  const meta = await (await fetch(api)).json();
  if (!meta.isPublicDomain) throw new Error("Met object is not flagged public-domain/CC0");
  console.log(`source: ${meta.title} — ${meta.artistDisplayName} (CC0)`);
  const buf = Buffer.from(await (await fetch(meta.primaryImage)).arrayBuffer());
  return buf;
}

const traceOne = (maskBuf) =>
  new Promise((res, rej) => {
    const t = new potrace.Potrace({
      threshold: 128,
      turdSize: 22,
      optCurve: true,
      optTolerance: 1.5,
      alphaMax: 1.0,
    });
    t.loadImage(maskBuf, (err) => {
      if (err) return rej(err);
      res([...t.getSVG().matchAll(/ d="([^"]+)"/g)].map((m) => m[1]));
    });
  });

const roundInt = (d) => d.replace(/-?\d+\.\d+/g, (m) => String(Math.round(parseFloat(m))));
const enc = (s) =>
  "data:image/svg+xml," +
  s
    .replace(/"/g, "'")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s+/g, " ");

async function main() {
  const SRC = await fetchSource();
  const SRCMETA = await sharp(SRC).metadata();
  // crop to the iconic cinematic band: full width, rows 18%..80%
  const cropTop = Math.round(SRCMETA.height * 0.18);
  const cropH = Math.round(SRCMETA.height * 0.62);
  const W = 480;

  const { data, info } = await sharp(SRC)
    .extract({ left: 0, top: cropTop, width: SRCMETA.width, height: cropH })
    .resize({ width: W })
    .median(5)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W2, height: H2, channels: ch } = info;

  // nearest-palette assignment
  const idx = new Uint8Array(W2 * H2);
  const d2 = (a, r) => (a[0] - r[0]) ** 2 + (a[1] - r[1]) ** 2 + (a[2] - r[2]) ** 2;
  for (let p = 0, i = 0; i < data.length; i += ch, p++) {
    let best = 0,
      bd = Infinity;
    for (let k = 0; k < PAL.length; k++) {
      const dd = d2([data[i], data[i + 1], data[i + 2]], PAL[k].rgb);
      if (dd < bd) {
        bd = dd;
        best = k;
      }
    }
    idx[p] = best;
  }

  const SKY = PAL.find((p) => p.role === "sky").hex;
  const byRole = {};
  for (let k = 0; k < PAL.length; k++) {
    if (PAL[k].role === "sky") continue;
    const mask = Buffer.alloc(W2 * H2, 255);
    for (let p = 0; p < idx.length; p++) if (idx[p] === k) mask[p] = 0;
    const maskPng = await sharp(mask, { raw: { width: W2, height: H2, channels: 1 } })
      .png()
      .toBuffer();
    const ds = await traceOne(maskPng);
    byRole[PAL[k].role] = { hex: PAL[k].hex, d: roundInt(ds.join(" ")) };
    console.log(`  ${PAL[k].role}: ${ds.length} subpath(s)`);
  }

  const vb = `viewBox="0 0 ${W2} ${H2}"`;
  const P = (role) =>
    byRole[role]?.d ? `<path d="${byRole[role].d}" fill="${byRole[role].hex}"/>` : "";
  const groups = {
    back: `<svg xmlns="http://www.w3.org/2000/svg" ${vb}><rect width="${W2}" height="${H2}" fill="${SKY}"/>${P("fuji")}</svg>`,
    body: `<svg xmlns="http://www.w3.org/2000/svg" ${vb}>${P("deep")}${P("mid")}${P("ink")}</svg>`,
    foam: `<svg xmlns="http://www.w3.org/2000/svg" ${vb}>${P("foam")}</svg>`,
  };

  const head = `/**
 * GENERATED ASSET — do not hand-edit. Regenerate with scripts/hanko-wave/trace.mjs.
 *
 * Three stacked layers of Hokusai's "The Great Wave off Kanagawa" (神奈川沖浪裏,
 * c. 1831), vectorised from The Metropolitan Museum of Art's CC0 / public-domain
 * scan (Open Access object ${MET_OBJECT}, "Under the Wave off Kanagawa"). The original
 * woodblock print is public domain; the Met releases this reproduction under CC0.
 *
 *   • BACK — flat indigo-paper sky + the grey cloud-bank / Fuji shadow / distant sea
 *   • BODY — the Prussian-blue wave masses (heaves & swells)
 *   • FOAM — the cream foam & spray (curls, then bursts to deliver the title)
 *
 * Each value is a ready-to-use \`data:image/svg+xml\` URI (light-encoded for CSS
 * \`url("…")\`; allowed by the public-page CSP \`img-src data:\`).
 */
/* eslint-disable */
/* prettier-ignore */
export const HK_WAVE_W = ${W2};
/* prettier-ignore */
export const HK_WAVE_H = ${H2};
`;
  const body = ["back", "body", "foam"]
    .map(
      (k) =>
        `/* prettier-ignore */\nexport const HK_WAVE_${k.toUpperCase()} =\n  ${JSON.stringify(enc(groups[k]))};`,
    )
    .join("\n\n");

  fs.writeFileSync(OUT, head + "\n" + body + "\n");
  console.log("wrote", path.relative(path.resolve(HERE, "../.."), OUT));
}

main();
