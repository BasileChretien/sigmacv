"use client";

import { useEffect, useState } from "react";
import { snapshotStrings } from "@/lib/i18n/snapshots";
import { formatSnapshotDate } from "@/lib/render/diff";
import type { SnapshotSummary } from "@/lib/cv/snapshotStore";

interface VersionsControlsProps {
  locale: string;
  /** Live publish state from the host (the frozen links exist only when published). */
  published: boolean;
  slug: string | null;
}

interface Listing {
  snapshots: SnapshotSummary[];
  doiMintingEnabled: boolean;
  max: number;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), template);
}

/**
 * The "Versions" surface: freeze the CV as a new frozen version, and manage the
 * existing ones — public link on/off, copy/open the link, compare with the live
 * CV, mint a DOI (only when the server reports minting enabled AND the version
 * is public), delete (two-step). All state lives server-side; this panel
 * fetches on mount and patches its local copy after each action.
 */
export default function VersionsControls({ locale, published, slug }: VersionsControlsProps) {
  const s = snapshotStrings(locale);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [mintingId, setMintingId] = useState<string | null>(null);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cv/snapshots");
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Listing;
        if (!cancelled) setListing(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshots = listing?.snapshots ?? [];
  const atLimit = listing ? snapshots.length >= listing.max : false;

  function patchLocal(next: SnapshotSummary) {
    setListing((cur) =>
      cur ? { ...cur, snapshots: cur.snapshots.map((x) => (x.id === next.id ? next : x)) } : cur,
    );
  }

  async function create() {
    const trimmed = label.trim();
    if (!trimmed || busy) return;
    setBusy("create");
    setAnnounce("");
    try {
      const res = await fetch("/api/cv/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmed }),
      });
      if (res.ok) {
        const { snapshot } = (await res.json()) as { snapshot: SnapshotSummary };
        setListing((cur) => (cur ? { ...cur, snapshots: [snapshot, ...cur.snapshots] } : cur));
        setLabel("");
      } else if (res.status === 409) {
        setAnnounce(fill(s.limitReached, { n: listing?.max ?? 20 }));
      } else {
        setAnnounce(s.actionFailed);
      }
    } catch {
      setAnnounce(s.actionFailed);
    } finally {
      setBusy(null);
    }
  }

  async function setPublic(snap: SnapshotSummary, isPublic: boolean) {
    setBusy(snap.id);
    setAnnounce("");
    try {
      const res = await fetch(`/api/cv/snapshots/${encodeURIComponent(snap.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      if (res.ok) patchLocal(((await res.json()) as { snapshot: SnapshotSummary }).snapshot);
      else setAnnounce(s.actionFailed);
    } catch {
      setAnnounce(s.actionFailed);
    } finally {
      setBusy(null);
    }
  }

  async function remove(snap: SnapshotSummary) {
    if (confirmId !== snap.id) {
      setConfirmId(snap.id);
      return;
    }
    setBusy(snap.id);
    setAnnounce("");
    try {
      const res = await fetch(`/api/cv/snapshots/${encodeURIComponent(snap.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setListing((cur) =>
          cur ? { ...cur, snapshots: cur.snapshots.filter((x) => x.id !== snap.id) } : cur,
        );
      } else setAnnounce(s.actionFailed);
    } catch {
      setAnnounce(s.actionFailed);
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  }

  async function mint(snap: SnapshotSummary) {
    setBusy(snap.id);
    setMintingId(snap.id);
    setAnnounce("");
    try {
      const res = await fetch(`/api/cv/snapshots/${encodeURIComponent(snap.id)}/mint`, {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { doi: string };
        patchLocal({ ...snap, doi: data.doi, doiState: "minted" });
      } else {
        patchLocal({ ...snap, doiState: "failed" });
        setAnnounce(s.doiFailed);
      }
    } catch {
      setAnnounce(s.doiFailed);
    } finally {
      setBusy(null);
      setMintingId(null);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setAnnounce(s.linkCopied);
    } catch {
      // clipboard may be unavailable; ignore (non-critical)
    }
  }

  const canShare = published && !!slug;

  return (
    <div className="account-controls versions-controls">
      <p className="versions-intro">{s.panelIntro}</p>

      <form
        className="versions-create"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <input
          type="text"
          className="versions-label"
          value={label}
          maxLength={80}
          placeholder={s.labelPlaceholder}
          aria-label={s.labelPlaceholder}
          disabled={busy === "create" || atLimit}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-sm"
          disabled={!label.trim() || busy === "create" || atLimit}
        >
          {busy === "create" ? s.creating : s.createButton}
        </button>
      </form>
      {atLimit ? (
        <p className="versions-hint">{fill(s.limitReached, { n: listing?.max ?? 20 })}</p>
      ) : null}
      {!canShare ? <p className="versions-hint">{s.notPublishedHint}</p> : null}

      {loadError ? <p className="versions-hint">{s.loadFailed}</p> : null}
      {listing && snapshots.length === 0 ? <p className="versions-hint">{s.empty}</p> : null}

      <ul className="versions-list">
        {snapshots.map((snap) => {
          const url = canShare ? `${origin}/p/${slug}/v/${snap.token}` : null;
          const rowBusy = busy === snap.id;
          const canMint = !!listing?.doiMintingEnabled && snap.isPublic && canShare;
          const mintTitle = !listing?.doiMintingEnabled
            ? s.mintDisabledHint
            : !snap.isPublic
              ? s.mintNeedsPublic
              : undefined;
          return (
            <li key={snap.id} className="versions-row" data-testid="version-row">
              <div className="versions-row-head">
                <strong>{fill(s.versionTag, { n: snap.version })}</strong>{" "}
                <span className="versions-row-label">{snap.label}</span>
                <span className="versions-row-date">
                  {formatSnapshotDate(snap.createdAt, locale)}
                </span>
              </div>
              {snap.doi ? (
                <div className="versions-row-doi">
                  <a href={`https://doi.org/${snap.doi}`} target="_blank" rel="noopener noreferrer">
                    doi:{snap.doi}
                  </a>
                </div>
              ) : null}
              <label className="field-inline" title={s.publicHint}>
                <input
                  type="checkbox"
                  checked={snap.isPublic}
                  disabled={rowBusy || snap.doiState === "minted"}
                  onChange={(e) => void setPublic(snap, e.target.checked)}
                />
                {s.publicToggle}
              </label>
              <div className="versions-row-actions">
                {url && snap.isPublic ? (
                  <>
                    <button type="button" className="link-btn" onClick={() => void copyLink(url)}>
                      {s.copyLink}
                    </button>
                    <a className="link-btn" href={url} target="_blank" rel="noopener noreferrer">
                      {s.openLink}
                    </a>
                  </>
                ) : null}
                <a
                  className="link-btn"
                  href={`/api/cv/snapshots/${encodeURIComponent(snap.id)}/diff?locale=${encodeURIComponent(locale)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.compareLive}
                </a>
                {snap.doiState !== "minted" ? (
                  <button
                    type="button"
                    className="link-btn"
                    disabled={!canMint || rowBusy}
                    title={mintTitle}
                    onClick={() => void mint(snap)}
                  >
                    {mintingId === snap.id ? s.minting : s.mintDoi}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="link-btn danger"
                  disabled={rowBusy}
                  onClick={() => void remove(snap)}
                >
                  {confirmId === snap.id ? s.confirmDelete : s.delete}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <span className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
