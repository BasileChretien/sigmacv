"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";

interface PublishControlsProps {
  initialPublished: boolean;
  initialSlug: string | null;
  initialIndexable: boolean;
  locale: string;
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
}: PublishControlsProps) {
  const u = ui(locale);
  const [published, setPublished] = useState(initialPublished);
  const [slug, setSlug] = useState(initialSlug);
  const [indexable, setIndexable] = useState(initialIndexable);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function update(next: boolean, nextIndexable: boolean) {
    setBusy(true);
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
      }
    } finally {
      setBusy(false);
    }
  }

  // Unpublishing always clears indexing; publishing keeps the prior choice.
  const toggle = (next: boolean) => update(next, next ? indexable : false);

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
      <label className="field-inline" title={u.publishTitle}>
        <input
          type="checkbox"
          checked={published}
          disabled={busy}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span>{published ? u.publicLive : u.publishPublic}</span>
      </label>
      {published && slug ? (
        <>
          <a className="link-btn" href={`/p/${slug}`} target="_blank" rel="noreferrer">
            {u.openPage}
          </a>
          <button type="button" className="link-btn" onClick={copyLink}>
            {copied ? u.linkCopied : u.copyLink}
          </button>
          <label className="field-inline" title={u.allowIndexingTitle}>
            <input
              type="checkbox"
              checked={indexable}
              disabled={busy}
              onChange={(e) => update(true, e.target.checked)}
            />
            <span>{u.allowIndexing}</span>
          </label>
        </>
      ) : null}
    </div>
  );
}
