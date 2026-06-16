"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";
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
}: PublishControlsProps) {
  const u = ui(locale);
  const [published, setPublished] = useState(initialPublished);
  const [slug, setSlug] = useState(initialSlug);
  const [indexable, setIndexable] = useState(initialIndexable);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
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
