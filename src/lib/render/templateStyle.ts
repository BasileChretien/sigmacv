import type { CanonicalCv } from "@/lib/canonical/schema";

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * The character of the chosen template, distilled to the few dimensions DOCX and
 * LaTeX can actually express (colour, font class, heading + name treatment,
 * centering). This lets those exports RESEMBLE the selected template instead of
 * being template-blind. Markdown has no styling, so it ignores this.
 */
export interface DocStyle {
  /** Validated accent hex WITH leading "#". */
  accent: string;
  /** Validated accent hex WITHOUT "#" (LaTeX \definecolor / docx colour). */
  accentHex: string;
  /** Serif (Classic/serif fonts) vs sans body. */
  serif: boolean;
  /** Section headings in the accent colour (false ⇒ ink / plain). */
  accentHeadings: boolean;
  /** The name rendered in the accent colour (Modern). */
  accentName: boolean;
  /** Name + contact centred (Classic). */
  centeredHeader: boolean;
  /** Uppercase section headings. */
  uppercaseHeadings: boolean;
  /** Monochrome, no accent anywhere (ATS — parser-safe). */
  plain: boolean;
}

/** Map the CV's template + display choices to a portable style profile. */
export function docStyle(cv: CanonicalCv): DocStyle {
  const accent = HEX.test(cv.display.accentColor) ? cv.display.accentColor : "#1f4fd8";
  const accentHex = accent.slice(1).toUpperCase();
  const serif = cv.display.fontPairing !== "sans";
  const base: DocStyle = {
    accent,
    accentHex,
    serif,
    accentHeadings: true,
    accentName: false,
    centeredHeader: false,
    uppercaseHeadings: true,
    plain: false,
  };
  switch (cv.display.template) {
    case "classic":
      return { ...base, centeredHeader: true };
    case "modern":
      return { ...base, accentName: true };
    case "sidebar":
      return base;
    case "ats":
      return {
        ...base,
        serif: false,
        plain: true,
        accentHeadings: false,
        uppercaseHeadings: false,
      };
    case "rirekisho":
      return { ...base, accentHeadings: false, uppercaseHeadings: false };
    default:
      return base;
  }
}
