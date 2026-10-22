/**
 * Shapes of the participant-facing consent text of study 2026-0310. Every
 * string of a `ConsentText` comes from the documents the Nagoya University
 * Bioethics Review Committee approved for that language (the information
 * sheet, the consent form and 別添1, the consent-screen specification), or was
 * agreed as a summary of them; the panel around it (status, errors, the
 * withdrawal confirmation) is ordinary UI text in `i18n/researchPanel.ts`.
 */

/** One block of an information-sheet section. */
export type SheetBlock =
  | { kind: "p"; text: string }
  /** A numbered or marked sub-heading inside a section ("（１）…", "○…"). */
  | { kind: "sub"; text: string }
  | { kind: "list"; items: readonly string[] };

export interface SheetSection {
  heading: string;
  blocks: readonly SheetBlock[];
}

/** The full information sheet of one language, section by section. */
export interface InformationSheet {
  title: string;
  /** The lines above section 1: study title, investigator, version. */
  preamble: readonly string[];
  sections: readonly SheetSection[];
}

/** A study contact named on the consent screen. */
export interface ConsentContact {
  /** Role and name, punctuated for the language ("Co-investigator: …"). */
  label: string;
  email: string;
}

/** Everything the consent screen shows in one approved language. */
export interface ConsentText {
  /** The language's own name, for the language switch ("English", "日本語"). */
  languageName: string;
  /** The approved document version this text belongs to. */
  documentVersion: string;
  title: string;
  /** The points shown above the full sheet. */
  summary: readonly string[];
  /** The label of the collapsed full information sheet. */
  readFullSheet: string;
  sheet: InformationSheet;
  /** Checkbox ①: required, never pre-ticked; alone enables the button. */
  agreeRequired: string;
  /** Checkbox ②: optional secondary use, never pre-ticked. */
  agreeSecondary: string;
  takePart: string;
  notNow: string;
  /** The line introducing the study contacts. */
  contactLead: string;
  contacts: readonly ConsentContact[];
}
