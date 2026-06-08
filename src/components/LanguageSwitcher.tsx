"use client";

import { useRouter } from "next/navigation";
import {
  DEFAULT_UI_LOCALE,
  LOCALE_LABELS,
  LOCALE_SLUGS,
  SUPPORTED_LOCALES,
  asLocale,
} from "@/lib/i18n";

/**
 * Landing-page language picker. Navigates to the path-based locale variant
 * (`/` for the default locale, `/{slug}` otherwise) so each language is a real,
 * crawlable URL. Used only on the public homepage.
 */
interface LanguageSwitcherProps {
  current: string;
  label: string;
}

export default function LanguageSwitcher({ current, label }: LanguageSwitcherProps) {
  const router = useRouter();
  const value = asLocale(current);

  return (
    <select
      className="lang-switcher"
      value={value}
      aria-label={label}
      onChange={(e) => {
        const loc = asLocale(e.target.value);
        router.push(loc === DEFAULT_UI_LOCALE ? "/" : `/${LOCALE_SLUGS[loc]}`);
      }}
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_LABELS[loc]}
        </option>
      ))}
    </select>
  );
}
