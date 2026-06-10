import { asLocale, type Locale } from "./index";

/**
 * Localized label for the "Guides" navigation link (homepage footer → /guides).
 * The guides themselves are English-only for now, but the link label is localized
 * so the footer reads naturally in every UI language. Typed Record<Locale,…> so a
 * missing locale is a compile error.
 */
export const GUIDES_NAV_LABEL: Record<Locale, string> = {
  "en-US": "Guides",
  "zh-CN": "指南",
  "es-ES": "Guías",
  "fr-FR": "Guides",
  "de-DE": "Leitfäden",
  "ja-JP": "ガイド",
  "pt-BR": "Guias",
  "it-IT": "Guide",
  "ko-KR": "가이드",
  "ru-RU": "Руководства",
};

/** The "Guides" nav label for a locale (falls back to English). */
export function guidesNavLabel(locale: string): string {
  return GUIDES_NAV_LABEL[asLocale(locale)];
}

/** Localized label for the "Glossary" footer link (→ /glossary). */
export const GLOSSARY_NAV_LABEL: Record<Locale, string> = {
  "en-US": "Glossary",
  "zh-CN": "术语表",
  "es-ES": "Glosario",
  "fr-FR": "Glossaire",
  "de-DE": "Glossar",
  "ja-JP": "用語集",
  "pt-BR": "Glossário",
  "it-IT": "Glossario",
  "ko-KR": "용어집",
  "ru-RU": "Глоссарий",
};

/** The "Glossary" nav label for a locale (falls back to English). */
export function glossaryNavLabel(locale: string): string {
  return GLOSSARY_NAV_LABEL[asLocale(locale)];
}
