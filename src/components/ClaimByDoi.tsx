"use client";

import { useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { asLocale, t } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";

/**
 * "Add a publication by DOI." The work is fetched from OpenAlex server-side, so
 * all its metadata (year, citations, FWCI, author order, peer-reviewed status)
 * is source-driven — only OWNERSHIP is user-asserted. If OpenAlex already links
 * the work to the user's identifier we attribute automatically; otherwise the
 * user picks which author is them. On add, the server appends + saves and returns
 * the updated CV, which we hand back via `onAdded`.
 */

interface PreviewAuthor {
  position: number;
  name: string;
  isSelfById: boolean;
}
interface ClaimPreview {
  found: boolean;
  alreadyInCv: boolean;
  title?: string;
  year?: number;
  venue?: string;
  authors: PreviewAuthor[];
  idMatchedIndex: number;
}

interface ClaimByDoiProps {
  locale: string;
  onAdded: (cv: CanonicalCv) => void;
}

export default function ClaimByDoi({ locale, onAdded }: ClaimByDoiProps) {
  const loc = asLocale(locale);
  const eu = editorUi(loc);
  const [doi, setDoi] = useState("");
  const [preview, setPreview] = useState<ClaimPreview | null>(null);
  // Selected self-author index (0-based) when there's no identifier match.
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function find() {
    const value = doi.trim();
    if (!value || busy) return;
    setBusy(true);
    setError("");
    setPreview(null);
    setSelected(null);
    try {
      const res = await fetch("/api/cv/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: value }),
      });
      if (!res.ok) throw new Error("lookup failed");
      const data = (await res.json()) as ClaimPreview;
      setPreview(data);
      if (data.found && data.idMatchedIndex >= 0) setSelected(data.idMatchedIndex);
    } catch {
      setError(eu.claimError);
    } finally {
      setBusy(false);
    }
  }

  const needsPick = !!preview?.found && preview.idMatchedIndex < 0;

  async function add() {
    if (busy || !preview?.found || preview.alreadyInCv) return;
    if (needsPick && selected === null) return;
    setBusy(true);
    setError("");
    try {
      const body: { doi: string; confirm: true; selfAuthorIndex?: number } = {
        doi: doi.trim(),
        confirm: true,
      };
      if (needsPick && selected !== null) body.selfAuthorIndex = selected;
      const res = await fetch("/api/cv/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("add failed");
      const data = (await res.json()) as {
        added: boolean;
        alreadyInCv: boolean;
        cv: CanonicalCv | null;
      };
      if (data.added && data.cv) {
        onAdded(data.cv);
        setDoi("");
        setPreview(null);
        setSelected(null);
      } else if (data.alreadyInCv) {
        setPreview({ ...preview, alreadyInCv: true });
      }
    } catch {
      setError(eu.claimError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="structured-entry claim-by-doi">
      <summary>{eu.claimLabel}</summary>
      <div className="claim-body">
        <div className="add-entry-row">
          <input
            type="text"
            value={doi}
            placeholder={eu.claimPlaceholder}
            aria-label={eu.claimLabel}
            disabled={busy}
            onChange={(e) => setDoi(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void find();
              }
            }}
          />
          <button
            type="button"
            className="btn"
            onClick={() => void find()}
            disabled={busy || !doi.trim()}
          >
            {eu.claimFind}
          </button>
        </div>
        <p className="field-hint muted">{eu.claimNote}</p>
        {error ? <p className="custom-style-error">{error}</p> : null}
        {preview && !preview.found ? (
          <p className="muted claim-status">{eu.claimNotFound}</p>
        ) : null}
        {preview?.found ? (
          <div className="claim-preview">
            <p className="claim-title">
              <strong>{preview.title}</strong>
              {preview.year ? ` (${preview.year})` : ""}
              {preview.venue ? ` · ${preview.venue}` : ""}
            </p>
            {preview.alreadyInCv ? (
              <p className="muted claim-status">{eu.claimAlready}</p>
            ) : (
              <>
                {needsPick ? (
                  <fieldset className="claim-authors">
                    <legend>{eu.claimWhichAuthor}</legend>
                    {preview.authors.map((a) => (
                      <label key={a.position} className="field-inline">
                        <input
                          type="radio"
                          name="claim-author"
                          checked={selected === a.position - 1}
                          onChange={() => setSelected(a.position - 1)}
                        />
                        <span>{a.name}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : null}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void add()}
                  disabled={busy || (needsPick && selected === null)}
                >
                  {t(loc, "add")}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </details>
  );
}
