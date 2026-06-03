"use client";

import { useCallback, useEffect, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { LOCALE_LABELS, SUPPORTED_LOCALES, asLocale, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";

const UI_LOCALE_KEY = "sigmacv:uiLocale";
import AccountControls from "./AccountControls";
import CvEditor from "./CvEditor";
import CvPreview from "./CvPreview";
import PublishControls from "./PublishControls";
import ResearchConsentPrompt from "./ResearchConsentPrompt";
import SupportLink from "./SupportLink";

type ExportFormat =
  | "pdf"
  | "docx"
  | "latex"
  | "latex-classic"
  | "markdown"
  | "bibtex"
  | "json";

interface CvWorkspaceProps {
  initialCv: CanonicalCv | null;
  availableStyles: string[];
  userName: string;
  researchConsent: boolean;
  published: boolean;
  publicSlug: string | null;
  publicIndexable: boolean;
  signOutAction: () => Promise<void>;
}

async function apiFetch(
  url: string,
  method: "POST" | "PATCH",
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`,
    );
  }
  return data;
}

export default function CvWorkspace({
  initialCv,
  availableStyles,
  userName,
  researchConsent,
  published,
  publicSlug,
  publicIndexable,
  signOutAction,
}: CvWorkspaceProps) {
  const [cv, setCv] = useState<CanonicalCv | null>(initialCv);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");

  // INTERFACE language — independent of the CV's own (rendered) language. It's a
  // client preference (localStorage), not part of the CV document. Initial value
  // mirrors the CV's language so first paint is sensible; a saved choice (read
  // after mount to avoid hydration mismatch) overrides it.
  const [uiLocale, setUiLocale] = useState<Locale>(
    asLocale(initialCv?.display.locale),
  );
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(UI_LOCALE_KEY);
      if (saved) setUiLocale(asLocale(saved));
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);
  const changeUiLocale = useCallback((value: string) => {
    const next = asLocale(value);
    setUiLocale(next);
    try {
      window.localStorage.setItem(UI_LOCALE_KEY, next);
    } catch {
      /* non-fatal */
    }
  }, []);

  // Debounced live preview whenever the document changes.
  useEffect(() => {
    if (!cv) {
      setPreviewHtml("");
      return;
    }
    setPreviewLoading(true);
    const handle = setTimeout(async () => {
      try {
        const data = (await apiFetch("/api/cv/preview", "POST", {
          document: cv,
        })) as { html?: string };
        setPreviewHtml(data.html ?? "");
      } catch {
        // Preview is best-effort; leave the previous render in place.
      } finally {
        setPreviewLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [cv]);

  const update = useCallback((next: CanonicalCv) => {
    setCv(next);
    setDirty(true);
    setStatus("");
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!cv) return false;
    setSaving(true);
    setStatus("");
    try {
      await apiFetch("/api/cv", "PATCH", { document: cv });
      setDirty(false);
      setStatus(t(uiLocale, "savedStatus"));
      return true;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t(uiLocale, "saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [cv, uiLocale]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setStatus("");
    try {
      const data = (await apiFetch("/api/cv/sync", "POST")) as {
        cv: CanonicalCv;
      };
      setCv(data.cv);
      setDirty(false);
      setStatus(t(uiLocale, "syncedStatus"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t(uiLocale, "syncFailed"));
    } finally {
      setSyncing(false);
    }
  }, [uiLocale]);

  const handleExport = useCallback(async () => {
    // Export uses the SAVED document — don't download a stale file if the
    // save failed.
    if (dirty) {
      const ok = await handleSave();
      if (!ok) return;
    }
    window.location.href = `/api/cv/export/${exportFormat}`;
  }, [dirty, handleSave, exportFormat]);

  return (
    <div className="cv-page" lang={uiLocale}>
      <a href="#cv-main" className="skip-link">
        {t(uiLocale, "skipToContent")}
      </a>
      <ResearchConsentPrompt initialConsent={researchConsent} locale={uiLocale} />
      <header className="cv-topbar">
        <div className="cv-topbar-left">
          <strong>SigmaCV</strong>
          <span className="muted">·</span>
          <span className="muted">{userName}</span>
          <PublishControls
            initialPublished={published}
            initialSlug={publicSlug}
            initialIndexable={publicIndexable}
            locale={uiLocale}
          />
          <AccountControls researchConsent={researchConsent} locale={uiLocale} />
        </div>
        <div className="cv-topbar-actions">
          {/* Persistent polite live region so screen readers announce
              "Saved." / "Synced…" without a focus change. */}
          <span className="status muted" role="status" aria-live="polite">
            {status}
          </span>
          <button
            type="button"
            className="btn"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? t(uiLocale, "resyncing") : t(uiLocale, "resync")}
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSave}
            disabled={!cv || saving || !dirty}
          >
            {saving
              ? t(uiLocale, "saving")
              : dirty
                ? t(uiLocale, "save")
                : t(uiLocale, "saved")}
          </button>
          <select
            className="export-format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            aria-label={t(uiLocale, "exportFormat")}
            title={ui(uiLocale).exportFormatTitle}
            disabled={!cv}
          >
            <option value="pdf">{ui(uiLocale).exportPdf}</option>
            <option value="docx">{ui(uiLocale).exportDocx}</option>
            <option value="latex">{ui(uiLocale).exportLatexModern}</option>
            <option value="latex-classic">{ui(uiLocale).exportLatexClassic}</option>
            <option value="markdown">{ui(uiLocale).exportMarkdown}</option>
            <option value="bibtex">{ui(uiLocale).exportBibtex}</option>
            <option value="json">{ui(uiLocale).exportJson}</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={!cv || saving || syncing}
          >
            {t(uiLocale, "exportLabel")}
          </button>
          <select
            className="lang-switcher"
            value={uiLocale}
            onChange={(e) => changeUiLocale(e.target.value)}
            aria-label={t(uiLocale, "uiLanguage")}
            title={t(uiLocale, "uiLanguageHint")}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </option>
            ))}
          </select>
          <SupportLink locale={uiLocale} />
          <form action={signOutAction}>
            <button type="submit" className="btn">
              {t(uiLocale, "signOut")}
            </button>
          </form>
        </div>
      </header>

      {cv ? (
        <div className="cv-workspace" id="cv-main">
          <section className="cv-workspace-pane">
            <CvEditor
              cv={cv}
              availableStyles={availableStyles}
              uiLocale={uiLocale}
              onChange={update}
            />
          </section>
          <section className="cv-workspace-pane">
            <CvPreview html={previewHtml} loading={previewLoading} locale={uiLocale} />
          </section>
        </div>
      ) : (
        <div className="cv-empty container" id="cv-main">
          <h2>{t(uiLocale, "emptyTitle")}</h2>
          <p className="muted">{t(uiLocale, "emptyBody")}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? t(uiLocale, "resyncing") : t(uiLocale, "syncFromOpenAlex")}
          </button>
        </div>
      )}
    </div>
  );
}
