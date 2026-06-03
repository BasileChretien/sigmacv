"use client";

import { useCallback, useEffect, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { asLocale, t } from "@/lib/i18n";
import AccountControls from "./AccountControls";
import CvEditor from "./CvEditor";
import CvPreview from "./CvPreview";
import PublishControls from "./PublishControls";
import ResearchConsentPrompt from "./ResearchConsentPrompt";
import SupportLink from "./SupportLink";

type ExportFormat = "pdf" | "docx" | "latex" | "markdown" | "json";

interface CvWorkspaceProps {
  initialCv: CanonicalCv | null;
  availableStyles: string[];
  userName: string;
  researchConsent: boolean;
  published: boolean;
  publicSlug: string | null;
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

  // UI language follows the CV's chosen locale (en-US when there's no CV yet).
  const uiLocale = asLocale(cv?.display.locale);

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
    <div className="cv-page">
      <ResearchConsentPrompt initialConsent={researchConsent} />
      <header className="cv-topbar">
        <div className="cv-topbar-left">
          <strong>SigmaCV</strong>
          <span className="muted">·</span>
          <span className="muted">{userName}</span>
          <PublishControls initialPublished={published} initialSlug={publicSlug} />
          <AccountControls initialConsent={researchConsent} />
        </div>
        <div className="cv-topbar-actions">
          {status ? <span className="status muted">{status}</span> : null}
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
            disabled={!cv}
          >
            <option value="pdf">PDF</option>
            <option value="docx">Word (.docx)</option>
            <option value="latex">LaTeX (.tex)</option>
            <option value="markdown">Markdown (.md)</option>
            <option value="json">JSON (data)</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={!cv || saving || syncing}
          >
            {t(uiLocale, "exportLabel")}
          </button>
          <SupportLink />
          <form action={signOutAction}>
            <button type="submit" className="btn">
              {t(uiLocale, "signOut")}
            </button>
          </form>
        </div>
      </header>

      {cv ? (
        <div className="cv-workspace">
          <section className="cv-workspace-pane">
            <CvEditor
              cv={cv}
              availableStyles={availableStyles}
              onChange={update}
            />
          </section>
          <section className="cv-workspace-pane">
            <CvPreview html={previewHtml} loading={previewLoading} />
          </section>
        </div>
      ) : (
        <div className="cv-empty container">
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
