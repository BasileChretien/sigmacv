"use client";

import { useRef, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { asLocale } from "@/lib/i18n";
import { importBibStrings } from "@/lib/i18n/importBib";

/**
 * "Import a .bib file." The on-ramp for researchers who already keep a clean
 * bibliography (Zotero / Mendeley / JabRef). The file text is POSTed to
 * `/api/cv/import/bibtex`, which parses it, merges the new works (deduped by
 * DOI/id), saves, and returns the updated CV — handed back via `onImported`. A
 * short summary reports how many were added / already present / skipped.
 */
interface ImportBibProps {
  locale: string;
  onImported: (cv: CanonicalCv) => void;
}

interface ImportResult {
  cv: CanonicalCv;
  added: number;
  duplicates: number;
  skipped: number;
}

export default function ImportBib({ locale, onImported }: ImportBibProps) {
  const s = importBibStrings(asLocale(locale));
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");

  async function run() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setSummary("");
    try {
      const bibtex = await file.text();
      const res = await fetch("/api/cv/import/bibtex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibtex }),
      });
      if (!res.ok) {
        // Map the distinct server causes to a localized message rather than one
        // generic "invalid BibTeX" (misleading for a rate-limit / size / no-CV case).
        setError(
          res.status === 429
            ? s.errorTooMany
            : res.status === 413
              ? s.errorTooLarge
              : res.status === 409
                ? s.errorNotSynced
                : s.error,
        );
        return;
      }
      const data = (await res.json()) as ImportResult;
      setSummary(
        s.result
          .replace("{added}", String(data.added))
          .replace("{duplicates}", String(data.duplicates))
          .replace("{skipped}", String(data.skipped)),
      );
      if (data.added > 0) onImported(data.cv);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError(s.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="structured-entry import-bib">
      <summary>{s.label}</summary>
      <div className="claim-body">
        <div className="add-entry-row">
          <input
            ref={inputRef}
            type="file"
            accept=".bib,.bibtex,text/plain,application/x-bibtex"
            aria-label={s.ariaFile}
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setSummary("");
              setError("");
            }}
          />
          <button type="button" className="btn" onClick={() => void run()} disabled={busy || !file}>
            {s.button}
          </button>
        </div>
        <p className="field-hint muted">{s.note}</p>
        {error ? <p className="custom-style-error">{error}</p> : null}
        {summary ? <p className="muted claim-status">{summary}</p> : null}
      </div>
    </details>
  );
}
