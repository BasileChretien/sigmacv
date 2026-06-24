"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";
import { badgeUi } from "@/lib/i18n/badgeUi";
import {
  emailSignatureHtml,
  outlookSignatureDocument,
  BADGE_PNG_DISPLAY,
} from "@/lib/cv/emailSignature";
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
  const [signatureCopied, setSignatureCopied] = useState(false);
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
  // The email signature uses an Outlook-safe PNG (classic Outlook renders no SVG)
  // served from its own route; the preview uses a RELATIVE src, the copied snippet
  // an absolute URL (so it resolves from any mail client).
  const badgePngSrc = `/p/${slug}/badge.png`;
  const badgePngUrl = `${base}${badgePngSrc}`;

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

  /**
   * Copy the badge as RICH HTML so pasting into a signature editor (Outlook,
   * Gmail) inserts a rendered, clickable badge — not the raw markup the
   * plain-text snippets produce. Writes a `ClipboardItem` carrying both a
   * `text/html` flavor (the linked PNG + text fallback) and a `text/plain`
   * flavor (the link) so clients that take only plain text still get something
   * useful; degrades to `writeText` where `ClipboardItem` is unavailable.
   */
  async function copyEmailSignature() {
    const html = emailSignatureHtml({
      pageUrl,
      badgePngUrl,
      alt: b.previewAlt,
      linkText: b.emailLinkText,
    });
    const plain = `${b.emailLinkText}: ${pageUrl}`;
    try {
      const clip = navigator.clipboard;
      if (typeof ClipboardItem !== "undefined" && clip && "write" in clip) {
        try {
          await clip.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([plain], { type: "text/plain" }),
            }),
          ]);
        } catch {
          // Some browsers expose ClipboardItem but reject a text/html write at
          // runtime — fall back to the plain-text link instead of failing.
          await clip.writeText(plain);
        }
      } else {
        await clip.writeText(plain);
      }
      setSignatureCopied(true);
      setAnnounce(b.emailCopied);
      trackEvent("Badge snippet copied", { format: "email" });
      window.setTimeout(() => setSignatureCopied(false), 2500);
    } catch {
      // clipboard may be unavailable; ignore (non-critical)
    }
  }

  /**
   * Download the signature as a classic-Outlook signature FILE (`SigmaCV.htm`).
   * Outlook reads the file directly as the signature source — no clipboard paste,
   * so the hyperlink on the badge image survives (the paste path loses it: classic
   * Outlook strips links off pasted images). Dropping the file in the Signatures
   * folder makes the badge clickable with no manual linking.
   */
  function downloadOutlookSignature() {
    const doc = outlookSignatureDocument(
      emailSignatureHtml({ pageUrl, badgePngUrl, alt: b.previewAlt, linkText: b.emailLinkText }),
    );
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "SigmaCV.htm";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setAnnounce(b.downloadOutlook);
    trackEvent("Badge snippet copied", { format: "outlook-file" });
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
        {/* "Email signature" — one click copies a RICH badge (Outlook-safe PNG +
            text fallback) so pasting into a signature renders, instead of the raw
            code the plain-text snippets above produce. */}
        <details className="badge-email">
          <summary>{b.emailHeading}</summary>
          <p className="badge-email-intro muted">{b.emailIntro}</p>
          <div className="badge-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- an Outlook-safe
                raster badge, not a Next-optimized asset. */}
            <img src={badgePngSrc} alt={b.previewAlt} />
          </div>
          <div className="badge-actions">
            <button type="button" className="btn btn-sm btn-primary" onClick={copyEmailSignature}>
              {signatureCopied ? b.emailCopied : b.emailButton}
            </button>
          </div>
          <p className="badge-email-note muted">{b.emailImageNote}</p>
          <p className="badge-email-steps-heading">{b.emailStepsHeading}</p>
          <ol className="badge-email-steps">
            <li>{b.emailStep1}</li>
            <li>{b.emailStep2}</li>
            <li>{b.emailStep3}</li>
          </ol>
          {/* Classic Outlook strips the link off pasted images. A downloadable
              signature FILE is read by Outlook directly (no paste), so the badge
              stays clickable with no manual linking. */}
          <details className="badge-email-file">
            <summary>{b.outlookFileSummary}</summary>
            <p className="badge-email-note muted">{b.outlookFileNote}</p>
            <div className="badge-actions">
              <button type="button" className="btn btn-sm" onClick={downloadOutlookSignature}>
                {b.downloadOutlook}
              </button>
            </div>
            <ol className="badge-email-steps">
              <li>{b.outlookFileStep1}</li>
              <li>{b.outlookFileStep2}</li>
              <li>{b.outlookFileStep3}</li>
            </ol>
          </details>
        </details>
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
