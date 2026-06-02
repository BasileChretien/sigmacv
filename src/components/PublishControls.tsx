"use client";

import { useState } from "react";

interface PublishControlsProps {
  initialPublished: boolean;
  initialSlug: string | null;
}

/**
 * Publish toggle for the living public CV page. Publishing exposes the curated
 * CV (name, ORCID, and the public-research publications you've kept) — all
 * already-public data. Unpublish hides it again.
 */
export default function PublishControls({
  initialPublished,
  initialSlug,
}: PublishControlsProps) {
  const [published, setPublished] = useState(initialPublished);
  const [slug, setSlug] = useState(initialSlug);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/cv/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          published: boolean;
          publicSlug: string | null;
        };
        setPublished(data.published);
        setSlug(data.publicSlug);
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; ignore
    }
  }

  return (
    <div className="account-controls">
      <label className="field-inline" title="Publish a public, re-syncing CV page.">
        <input
          type="checkbox"
          checked={published}
          disabled={busy}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span>Public page</span>
      </label>
      {published && slug ? (
        <>
          <a className="link-btn" href={`/p/${slug}`} target="_blank" rel="noreferrer">
            View
          </a>
          <button type="button" className="link-btn" onClick={copyLink}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </>
      ) : null}
    </div>
  );
}
