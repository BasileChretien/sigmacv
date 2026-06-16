"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { THEME_STORAGE_KEY, type ThemeChoice } from "@/lib/themeInit";

/** Resolve a choice to the concrete palette to paint ("system" → OS preference). */
function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice === "light" || choice === "dark") return choice;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Site-wide appearance control: System / Light / Dark. The no-flash init script
 * (themeInit.ts) has already set `data-theme` before paint; this just lets the
 * user override it. The choice persists in localStorage and is applied by setting
 * `data-theme` on <html>; "system" follows the OS (the init script's media-query
 * listener keeps it live). A compact segmented control — icons with localized
 * accessible names.
 */
export default function ThemeToggle({ locale }: { locale: string }) {
  // Start as "system" so SSR and first client render agree; the real stored
  // choice is read after mount (the painted theme is already correct via the
  // init script, so there's no flash regardless).
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") setChoice(stored);
    } catch {
      /* storage unavailable — keep system */
    }
  }, []);

  const choose = (next: ThemeChoice) => {
    setChoice(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* non-fatal — just won't persist */
    }
    document.documentElement.setAttribute("data-theme", resolve(next));
  };

  const options: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { value: "system", label: t(locale, "themeSystem"), icon: <SystemIcon /> },
    { value: "light", label: t(locale, "themeLight"), icon: <SunIcon /> },
    { value: "dark", label: t(locale, "themeDark"), icon: <MoonIcon /> },
  ];

  return (
    <div className="theme-toggle" role="group" aria-label={t(locale, "themeLabel")}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`theme-toggle-btn${choice === o.value ? " is-active" : ""}`}
          aria-pressed={choice === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => choose(o.value)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

function SystemIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
