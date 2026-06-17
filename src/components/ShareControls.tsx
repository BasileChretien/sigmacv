"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";
import { badgeUi } from "@/lib/i18n/badgeUi";
import { trackEvent } from "@/lib/analytics/track";

/** Launder a `<select>` value into a known badge style/theme by returning LITERAL
 *  constants (never the raw DOM string), so the value that reaches the badge URL is
 *  provably one of the allowed tokens — mirrors the server's `parseBadgeOptions`. */
function asBadgeStyle(v: string): string {
  if (v === "flat") return "flat";
  if (v === "card") return "card";
  return "pill";
}
function asBadgeTheme(v: string): string {
  if (v === "light") return "light";
  if (v === "dark") return "dark";
  return "auto";
}

interface ShareControlsProps {
  locale: string;
  /** The public slug — only mounted when the CV is published, so always present. */
  slug: string;
}

/**
 * The "Share" surface for a published living CV: the public link (open/copy) plus
 * the embeddable "Living CV" badge + QR. Split out of `PublishControls` so the
 * publish popover stays a focused on/off decision — sharing/embedding is a
 * distinct, post-publish job and belongs on its own surface (the top-bar Share
 * menu, shown only once the page is live).
 */
export default function ShareControls({ locale, slug }: ShareControlsProps) {
  const u = ui(locale);
  const b = badgeUi(locale);
  const [badgeStyle, setBadgeStyle] = useState("pill");
  const [badgeTheme, setBadgeTheme] = useState("auto");
  const [copied, setCopied] = useState(false);
  // Polite live region for copy confirmations (announced to assistive tech).
  const [announce, setAnnounce] = useState("");
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const pageUrl = `${base}/p/${slug}`;
  // Preview/download use a RELATIVE src (no window.location → not a location→DOM
  // flow); the copyable Markdown/HTML/URL snippets use the absolute URL but only
  // ever reach the clipboard, never the DOM.
  const badgeQuery = `style=${badgeStyle}&theme=${badgeTheme}`;
  const badgeSrc = `/p/${slug}/badge.svg?${badgeQuery}`;
  const badgeUrl = `${base}${badgeSrc}`;
  const badgeAlt = "Living CV";
  const badgeMarkdown = `[![${badgeAlt}](${badgeUrl})](${pageUrl})`;
  const badgeHtml = `<a href="${pageUrl}"><img src="${badgeUrl}" alt="${badgeAlt}" /></a>`;
  const qrSrc = `/p/${slug}/qr.svg`;
  const qrUrl = `${base}${qrSrc}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setAnnounce(u.linkCopied);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; ignore (non-critical)
    }
  }

  /** Copy an embed snippet (markdown / html / image url) + a cookieless signal. */
  async function copySnippet(text: string, format: string) {
    try {
      await navigator.clipboard.writeText(text);
      setAnnounce(u.linkCopied);
      // Neutral product signal only — which snippet format, never identifiers.
      trackEvent("Badge snippet copied", { format });
    } catch {
      // clipboard may be unavailable; ignore (non-critical)
    }
  }

  return (
    <div className="account-controls">
      {/* Polite live region (always mounted): copy confirmations. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
      {/* The live link — the payoff of publishing, primary on this surface. */}
      <div className="publish-live">
        <a
          className="publish-live-url"
          href={`/p/${slug}`}
          target="_blank"
          rel="noreferrer"
          title={u.openPage}
        >
          {origin ? `${origin.replace(/^https?:\/\//, "")}/p/${slug}` : `/p/${slug}`}
        </a>
        <div className="publish-live-actions">
          <a className="btn btn-sm" href={`/p/${slug}`} target="_blank" rel="noreferrer">
            {u.openPage}
          </a>
          <button type="button" className="btn btn-sm" onClick={copyLink}>
            {copied ? u.linkCopied : u.copyLink}
          </button>
        </div>
        <p className="publish-live-hint muted">{u.shareHint}</p>
      </div>
      {/* "Get a badge" — the embeddable Living-CV badge (README / site / email
          signature) + a nested QR. Collapsed by default. */}
      <details className="badge-panel">
        <summary>{b.heading}</summary>
        <p className="badge-panel-intro muted">{b.intro}</p>
        <div className="badge-controls">
          <label>
            {b.styleLabel}
            <select
              value={badgeStyle}
              onChange={(e) => setBadgeStyle(asBadgeStyle(e.target.value))}
            >
              <option value="pill">{b.styleStandard}</option>
              <option value="flat">{b.styleCompact}</option>
              <option value="card">{b.styleCard}</option>
            </select>
          </label>
          <label>
            {b.themeLabel}
            <select
              value={badgeTheme}
              onChange={(e) => setBadgeTheme(asBadgeTheme(e.target.value))}
            >
              <option value="auto">{b.themeAuto}</option>
              <option value="light">{b.themeLight}</option>
              <option value="dark">{b.themeDark}</option>
            </select>
          </label>
        </div>
        <div className="badge-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- a third-party-
              cacheable SVG badge, not a Next-optimized asset. */}
          <img src={badgeSrc} alt={b.previewAlt} />
        </div>
        <div className="badge-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => copySnippet(badgeMarkdown, "markdown")}
          >
            {b.copyMarkdown}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => copySnippet(badgeHtml, "html")}
          >
            {b.copyHtml}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => copySnippet(badgeUrl, "url")}>
            {b.copyLink}
          </button>
        </div>
        <details className="badge-qr">
          <summary>{b.qrLabel}</summary>
          <p className="badge-qr-hint muted">{b.qrHint}</p>
          <div className="badge-qr-row">
            {/* eslint-disable-next-line @next/next/no-img-element -- a printable
                QR image, not a Next-optimized asset. */}
            <img className="badge-qr-img" src={qrSrc} alt={b.qrAlt} width={84} height={84} />
            <div className="badge-actions">
              <a className="btn btn-sm" href={qrSrc} download="sigmacv-qr.svg">
                {b.downloadQr}
              </a>
              <button type="button" className="btn btn-sm" onClick={() => copySnippet(qrUrl, "qr")}>
                {b.copyLink}
              </button>
            </div>
          </div>
        </details>
      </details>
    </div>
  );
}
