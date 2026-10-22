import type { Locale } from "@/lib/i18n";
import { CONSENT_EN_US } from "./en-US";
import { CONSENT_JA_JP } from "./ja-JP";
import type { ConsentText } from "./types";

export type { ConsentText, InformationSheet, SheetBlock } from "./types";

/**
 * The consent texts of Nagoya University study 2026-0310, one per language
 * the Bioethics Review Committee approved. Client-safe (no server imports):
 * the editor's research panel and the API routes share it.
 *
 * The approved protocol admits only people who understand the consent
 * language, so a language joins this list only once the committee approves
 * its documents (an amendment). Adding one = its `sheet.<locale>.ts`
 * (scripts/consent-sheet-from-docx.py), its `<locale>.ts`, its entry in
 * CONSENT_DOCUMENT_VERSIONS and the locale here; the compiler asks for the
 * rest.
 */
export const APPROVED_CONSENT_LOCALES = ["en-US", "ja-JP"] as const satisfies readonly Locale[];
export type ConsentLocale = (typeof APPROVED_CONSENT_LOCALES)[number];

/** The language shown to a UI locale the committee has not approved. */
const FALLBACK_CONSENT_LOCALE: ConsentLocale = "en-US";

/**
 * Version of the research consent. Bump it when what participants agree to
 * materially changes: consent stored under an older version stops
 * authorising logging (`log.ts`) and the panel asks to agree again.
 *   1 — the notice shown before the study was approved.
 *   2 — study 2026-0310 as approved on 2026-10-21.
 */
export const RESEARCH_CONSENT_VERSION = 2;

/**
 * The approved document behind each consent version and language, as a
 * record names it. Past versions stay here so an old record keeps its name.
 */
export const CONSENT_DOCUMENT_VERSIONS: Readonly<
  Record<number, Readonly<Partial<Record<ConsentLocale, string>>>>
> = {
  2: { "en-US": "Version 1.0, 2026-06-05", "ja-JP": "第1.1版, 2026-07-08" },
};

/**
 * The same documents as the person sees them named on screen, in their own
 * language. The internal consent version (the integer) is never shown: it
 * stays in the record and the downloads.
 */
export const CONSENT_DOCUMENT_LABELS: Readonly<
  Record<number, Readonly<Partial<Record<ConsentLocale, string>>>>
> = {
  2: {
    "en-US": "Information sheet Version 1.0 (2026-06-05)",
    "ja-JP": "説明文書 第1.1版（2026-07-08）",
  },
};

/** The study, as the downloaded consent record names it. */
export const STUDY = {
  approvalNumber: "2026-0310",
  approvedOn: "2026-10-21",
  committee: "Bioethics Review Committee, Nagoya University Graduate School of Medicine",
  title:
    "Representation and self-presentation of researchers in open scholarly data: an observational study of author-name disambiguation error and academic-CV composition norms",
} as const;

const TEXTS: Readonly<Record<ConsentLocale, ConsentText>> = {
  "en-US": CONSENT_EN_US,
  "ja-JP": CONSENT_JA_JP,
};

export function isConsentLocale(value: unknown): value is ConsentLocale {
  return (APPROVED_CONSENT_LOCALES as readonly unknown[]).includes(value);
}

/** The consent language a UI locale starts on: its own if approved, else English. */
export function consentLocaleFor(uiLocale: string): ConsentLocale {
  return isConsentLocale(uiLocale) ? uiLocale : FALLBACK_CONSENT_LOCALE;
}

export function consentText(locale: ConsentLocale): ConsentText {
  return TEXTS[locale];
}

/** The approved document a record of (version, language) refers to, if known. */
export function documentVersionFor(version: number, locale: string | null): string | null {
  if (!isConsentLocale(locale)) return null;
  return CONSENT_DOCUMENT_VERSIONS[version]?.[locale] ?? null;
}

/** That document's on-screen name, if known. */
export function documentLabelFor(version: number, locale: string | null): string | null {
  if (!isConsentLocale(locale)) return null;
  return CONSENT_DOCUMENT_LABELS[version]?.[locale] ?? null;
}
