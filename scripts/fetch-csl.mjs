// Download CSL citation styles + the en-US locale into the vendored assets dir.
// Sources: github.com/citation-style-language/{styles,locales} (CC BY-SA 3.0).
// Run with: npm run fetch-csl
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, "..", "src", "lib", "citeproc", "assets");
const STYLES_DIR = join(ASSETS, "styles");
const LOCALES_DIR = join(ASSETS, "locales");

const STYLES_BASE =
  "https://raw.githubusercontent.com/citation-style-language/styles/master";
const LOCALES_BASE =
  "https://raw.githubusercontent.com/citation-style-language/locales/master";

// The starter set offered in the UI. Add more keys here as needed.
// Use only INDEPENDENT styles (dependent styles need parent resolution, which
// the MVP citeproc engine does not do).
const STYLES = [
  "apa",
  "ieee",
  "chicago-author-date",
  "nature",
  "modern-language-association",
  "american-medical-association",
];
const LOCALES = ["en-US"];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const text = await res.text();
  await writeFile(dest, text, "utf8");
  console.log("  ✓", dest.replace(process.cwd(), "."));
}

async function main() {
  await mkdir(STYLES_DIR, { recursive: true });
  await mkdir(LOCALES_DIR, { recursive: true });

  console.log("Fetching CSL styles…");
  for (const s of STYLES) {
    await download(`${STYLES_BASE}/${s}.csl`, join(STYLES_DIR, `${s}.csl`));
  }

  console.log("Fetching CSL locales…");
  for (const l of LOCALES) {
    await download(
      `${LOCALES_BASE}/locales-${l}.xml`,
      join(LOCALES_DIR, `locales-${l}.xml`),
    );
  }

  console.log("Done. CSL assets are in src/lib/citeproc/assets/.");
}

main().catch((err) => {
  console.error("fetch-csl failed:", err.message);
  process.exit(1);
});
