import { FACE_CSS as sourceSerif4 } from "./fonts/sourceSerif4";
import { FACE_CSS as inter } from "./fonts/inter";
import { FACE_CSS as ebGaramond } from "./fonts/ebGaramond";

/**
 * The selectable CV body fonts (design panel → `fontPairing`). Each is EMBEDDED as
 * an `@font-face` data URI (see `scripts/fetch-fonts.mjs`) so the editor preview,
 * the server-rendered PDF and every visitor's view render the IDENTICAL typeface,
 * regardless of which fonts a device has installed. Keyed by the CSS font-family
 * name each `FONT_STACKS` entry leads with.
 */
const BUNDLED_FONTS: ReadonlyArray<{ family: string; faceCss: string }> = [
  { family: "Source Serif 4", faceCss: sourceSerif4 },
  { family: "Inter", faceCss: inter },
  { family: "EB Garamond", faceCss: ebGaramond },
];

/**
 * The embedded `@font-face` CSS for whichever bundled font the resolved stack leads
 * with — so a render carries ONLY the font it actually displays (each is ~110–135 KB).
 * Returns "" when the stack uses no bundled font.
 */
export function bundledFaceCss(fontFamily: string): string {
  return BUNDLED_FONTS.find((f) => fontFamily.includes(f.family))?.faceCss ?? "";
}
