"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";
import { editorUi } from "@/lib/i18n/editorUi";
import { badgeUi } from "@/lib/i18n/badgeUi";
import { trackEvent } from "@/lib/analytics/track";

interface PublicContactFlags {
  email: boolean;
  phone: boolean;
  location: boolean;
}

interface PublishControlsProps {
  initialPublished: boolean;
  initialSlug: string | null;
  initialIndexable: boolean;
  locale: string;
  /** Per-field consent for contact details on the public page (default off). */
  publicContact: PublicContactFlags;
  onPublicContactChange: (next: PublicContactFlags) => void;
  /** Notifies the parent of publish/slug/indexing changes so a host indicator
      (e.g. the top-bar trigger) can reflect them without a reload. Optional so
      this control still works standalone. */
  onPublishStateChange?: (next: {
    published: boolean;
    slug: string | null;
    indexable: boolean;
  }) => void;
}

/**
 * Publish toggle for the living public CV page. Publishing exposes the curated
 * CV (name, ORCID, and the public-research publications you've kept) — all
 * already-public data. Unpublish hides it again.
 */
export default function PublishControls({
  initialPublished,
  initialSlug,
  initialIndexable,
  locale,
  publicContact,
  onPublicContactChange,
  onPublishStateChange,
}: PublishControlsProps) {
  const u = ui(locale);
  const eu = editorUi(locale);
  const b = badgeUi(locale);
  const [published, setPublished] = useState(initialPublished);
  const [slug, setSlug] = useState(initialSlug);
  const [indexable, setIndexable] = useState(initialIndexable);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // "Get a badge" embed-panel choices (the rendered badge label stays the brand
  // term "Living CV"; only the panel chrome is localized).
  const [badgeStyle, setBadgeStyle] = useState("pill");
  const [badgeTheme, setBadgeTheme] = useState("auto");
  // A polite live-region message (copy confirmation / publish error) so the
  // outcome is announced to assistive tech, not conveyed only visually.
  const [announce, setAnnounce] = useState("");
  // Site origin for the shareable absolute URL. Lazy-initialised on the client
  // (this control only ever mounts inside the already-open Publish popover).
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  async function update(next: boolean, nextIndexable: boolean) {
    setBusy(true);
    setAnnounce("");
    try {
      const res = await fetch("/api/cv/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next, indexable: nextIndexable }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          published: boolean;
          publicSlug: string | null;
          indexable: boolean;
        };
        setPublished(data.published);
        setSlug(data.publicSlug);
        setIndexable(data.indexable);
        // Keep the host (top-bar trigger) in lockstep with the panel's state.
        onPublishStateChange?.({
          published: data.published,
          slug: data.publicSlug,
          indexable: data.indexable,
        });
        if (data.published) {
          // Cookieless product signal: a public page was published. No identifiers.
          trackEvent("Publish", { indexable: data.indexable });
        }
      } else {
        // Surface the failure (previously swallowed) so the user isn't left
        // believing a publish/unpublish succeeded when it didn't.
        setAnnounce(u.publishError);
      }
    } catch {
      setAnnounce(u.publishError);
    } finally {
      setBusy(false);
    }
  }

  // Unpublishing always clears indexing; publishing keeps the prior choice.
  const toggle = (next: boolean) => update(next, next ? indexable : false);

  async function copyLink() {
    if (!slug) return;
    const url = `${origin || window.location.origin}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
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

  // Absolute URLs for the badge image + the page it links to, plus ready-to-paste
  // Markdown/HTML snippets. Only meaningful inside the published-and-slugged block.
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const pageUrl = slug ? `${base}/p/${slug}` : "";
  const badgeUrl = slug
    ? `${base}/p/${slug}/badge.svg?style=${badgeStyle}&theme=${badgeTheme}`
    : "";
  const badgeAlt = "Living CV";
  const badgeMarkdown = `[![${badgeAlt}](${badgeUrl})](${pageUrl})`;
  const badgeHtml = `<a href="${pageUrl}"><img src="${badgeUrl}" alt="${badgeAlt}" /></a>`;

  return (
    <div className="account-controls">
      <label className="field-inline" title={u.publishTitle}>
        <input
          type="checkbox"
          data-testid="publish-toggle"
          checked={published}
          disabled={busy}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span>{published ? u.publicLive : u.publishPublic}</span>
      </label>
      {/* What publishing exposes — shown BEFORE the toggle is flipped, so the
          (irreversible-feeling) public exposure is a fully-informed choice. */}
      <p className="publish-summary muted">{u.publicSummary}</p>
      {/* Pointer to the public-page-only animated showcase styles (Design tab). */}
      <p className="publish-style-tip muted">{eu.publishStyleTip}</p>
      {/* Polite live region (always mounted): copy confirmation / publish error. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
      {published && slug ? (
        <>
          {/* "Your page is live" share card — the link, prominent + copyable, with
              a nudge to share it. The retention hook made tangible at the moment
              of publishing. */}
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
              signature) that drives organic, peer-to-peer distribution. Collapsed
              by default to keep the publish panel calm. */}
          <details className="badge-panel">
            <summary>{b.heading}</summary>
            <p className="badge-panel-intro muted">{b.intro}</p>
            <div className="badge-controls">
              <label>
                {b.styleLabel}
                <select value={badgeStyle} onChange={(e) => setBadgeStyle(e.target.value)}>
                  <option value="pill">{b.styleStandard}</option>
                  <option value="flat">{b.styleCompact}</option>
                  <option value="card">{b.styleCard}</option>
                </select>
              </label>
              <label>
                {b.themeLabel}
                <select value={badgeTheme} onChange={(e) => setBadgeTheme(e.target.value)}>
                  <option value="auto">{b.themeAuto}</option>
                  <option value="light">{b.themeLight}</option>
                  <option value="dark">{b.themeDark}</option>
                </select>
              </label>
            </div>
            <div className="badge-preview">
              {/* eslint-disable-next-line @next/next/no-img-element -- a third-party-
                  cacheable SVG badge, not a Next-optimized asset. */}
              <img src={badgeUrl} alt={b.previewAlt} />
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
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => copySnippet(badgeUrl, "url")}
              >
                {b.copyLink}
              </button>
            </div>
          </details>
          <label className="field-inline" title={u.allowIndexingTitle}>
            <input
              type="checkbox"
              checked={indexable}
              disabled={busy}
              onChange={(e) => update(true, e.target.checked)}
            />
            <span>{u.allowIndexing}</span>
          </label>
          <fieldset className="public-contact-consent">
            <legend>{u.publicContactLegend}</legend>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={publicContact.email}
                onChange={(e) =>
                  onPublicContactChange({ ...publicContact, email: e.target.checked })
                }
              />
              <span>{u.publicShowEmail}</span>
            </label>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={publicContact.phone}
                onChange={(e) =>
                  onPublicContactChange({ ...publicContact, phone: e.target.checked })
                }
              />
              <span>{u.publicShowPhone}</span>
            </label>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={publicContact.location}
                onChange={(e) =>
                  onPublicContactChange({ ...publicContact, location: e.target.checked })
                }
              />
              <span>{u.publicShowLocation}</span>
            </label>
          </fieldset>
        </>
      ) : null}
    </div>
  );
}
