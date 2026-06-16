"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { THEME_STORAGE_KEY } from "@/lib/themeInit";

/**
 * Light / Dark appearance toggle. The system preference is auto-detected and
 * applied on first visit by the no-flash init script (themeInit.ts) — there's no
 * explicit "System" control; the toggle simply shows the sun (light) and moon
 * (dark), with the currently-applied one highlighted. Picking one stores an
 * explicit choice; until then the page keeps following the OS (and the highlight
 * tracks it if the OS flips).
 */
export default function ThemeToggle({ locale }: { locale: string }) {
  // The applied palette. SSR renders "light"; the real value is read after mount
  // from data-theme (already set before paint by the init script), so no flash.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const fromAttr = document.documentElement.getAttribute("data-theme");
    setTheme(fromAttr === "dark" ? "dark" : "light");
    // While the user hasn't chosen explicitly, keep the highlight in sync with the
    // OS (the init script already updates the actual theme on this same event).
    if (typeof window.matchMedia !== "function") return; // e.g. jsdom / old browsers
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOsChange = () => {
      try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== "light" && stored !== "dark") setTheme(mq.matches ? "dark" : "light");
      } catch {
        /* storage unavailable — leave as-is */
      }
    };
    mq.addEventListener("change", onOsChange);
    return () => mq.removeEventListener("change", onOsChange);
  }, []);

  const choose = (next: "light" | "dark") => {
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* non-fatal — just won't persist */
    }
    document.documentElement.setAttribute("data-theme", next);
  };

  const options: { value: "light" | "dark"; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t(locale, "themeLight"), icon: <SunIcon /> },
    { value: "dark", label: t(locale, "themeDark"), icon: <MoonIcon /> },
  ];

  return (
    <div className="theme-toggle" role="group" aria-label={t(locale, "themeLabel")}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`theme-toggle-btn${theme === o.value ? " is-active" : ""}`}
          aria-pressed={theme === o.value}
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
