"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { safeParseSyncReport, type SyncReport } from "@/lib/cv/syncReport";
import { updateDisplay } from "@/lib/canonical/curate";
import { asLocale, t, type Locale } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import { trackEvent } from "@/lib/analytics/track";

const UI_LOCALE_KEY = "sigmacv:uiLocale";
// Persist the working document this long after edits settle. Longer than the
// live-preview debounce (350 ms) so a burst of edits coalesces into one write,
// keeping us well under the save rate limit (120/hour). The manual Save button
// stays as an immediate-save fallback.
const AUTOSAVE_DELAY_MS = 1500;
import CvEditor from "./CvEditor";
import CvPreview from "./CvPreview";
import DisambiguationCoachmark from "./DisambiguationCoachmark";
import PublishNudge from "./PublishNudge";
import ResearchConsentPrompt from "./ResearchConsentPrompt";
import SyncReportBanner from "./SyncReportBanner";
import TopBar, { type ExportFormat } from "./TopBar";

interface CvWorkspaceProps {
  initialCv: CanonicalCv | null;
  /** The persisted "what changed" report of the last sync (null = none yet). */
  initialSyncReport?: SyncReport | null;
  availableStyles: string[];
  userName: string;
  researchConsent: boolean;
  /** Re-sync digest email opt-in (account toggle). */
  digestOptIn?: boolean;
  /** User-set digest notification address (pending or confirmed), if any. */
  digestContactEmail?: string | null;
  /** Whether that address was confirmed via the emailed link. */
  digestContactEmailVerified?: boolean;
  /** Auth.js login email (fallback digest delivery; often null for ORCID). */
  accountEmail?: string | null;
  /** Whether the research-logging programme is active (off until IRB approval). */
  researchEnabled: boolean;
  published: boolean;
  publicSlug: string | null;
  publicIndexable: boolean;
  signOutAction: () => Promise<void>;
}

async function apiFetch(url: string, method: "POST" | "PATCH", body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data;
}

export default function CvWorkspace({
  initialCv,
  initialSyncReport = null,
  availableStyles,
  userName,
  researchConsent,
  digestOptIn = false,
  digestContactEmail = null,
  digestContactEmailVerified = false,
  accountEmail = null,
  researchEnabled,
  published,
  publicSlug,
  publicIndexable,
  signOutAction,
}: CvWorkspaceProps) {
  const [cv, setCv] = useState<CanonicalCv | null>(initialCv);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(initialSyncReport);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  // Which pane is visible on narrow screens (both show side-by-side on desktop).
  const [pane, setPane] = useState<"editor" | "preview">("editor");

  // Refs let the debounced auto-save read the latest document and avoid
  // overlapping writes without re-creating the debounce timer on every keystroke.
  const cvRef = useRef(cv);
  cvRef.current = cv;
  const savingRef = useRef(false);

  // INTERFACE language — independent of the CV's own (rendered) language. It's a
  // client preference (localStorage), not part of the CV document. Initial value
  // mirrors the CV's language so first paint is sensible; a saved choice (read
  // after mount to avoid hydration mismatch) overrides it.
  const [uiLocale, setUiLocale] = useState<Locale>(asLocale(initialCv?.display.locale));
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

  // A DOI-claimed work is appended + SAVED server-side, so adopt the returned CV
  // and stay clean (no pending save) rather than marking the doc dirty.
  const handleClaimAdded = useCallback(
    (next: CanonicalCv) => {
      setCv(next);
      setDirty(false);
      setStatus(t(uiLocale, "savedStatus"));
    },
    [uiLocale],
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!cv || savingRef.current) return false;
    const snapshot = cv;
    savingRef.current = true;
    setSaving(true);
    setStatus("");
    try {
      await apiFetch("/api/cv", "PATCH", { document: snapshot });
      // Only clear the dirty flag if nothing was edited while the save was in
      // flight; otherwise the pending auto-save persists the newer document.
      if (cvRef.current === snapshot) setDirty(false);
      setStatus(t(uiLocale, "savedStatus"));
      return true;
    } catch (err) {
      // Leave the document dirty so the Save button + navigate-away guard still
      // protect the edit; do not auto-retry in a loop.
      setStatus(err instanceof Error ? err.message : t(uiLocale, "saveFailed"));
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [cv, uiLocale]);

  // Keep a stable handle to the latest save callback so the debounce effect
  // below doesn't reset its timer every time `cv`/`uiLocale` change.
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Auto-save: persist a short while after edits settle. Re-scheduled on every
  // edit (debounce). A successful save clears `dirty` (which short-circuits this
  // effect); a failed save leaves it dirty without auto-retrying in a loop — the
  // next edit, or the Save button, re-triggers it.
  useEffect(() => {
    if (!cv || !dirty) return;
    const handle = setTimeout(() => {
      void handleSaveRef.current();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(handle);
  }, [cv, dirty]);

  // Guard against losing unsaved edits (or an in-flight save) on navigate-away.
  useEffect(() => {
    if (!dirty && !saving) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, saving]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setStatus("");
    try {
      const data = (await apiFetch("/api/cv/sync", "POST")) as {
        cv: CanonicalCv;
        report?: unknown;
      };
      setCv(data.cv);
      // Shape-validated: a report the client can't parse degrades to "none".
      setSyncReport(safeParseSyncReport(data.report));
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
    // Cookieless product signal: which export format. No personal/CV data.
    trackEvent("Export", { format: exportFormat });
    window.location.href = `/api/cv/export/${exportFormat}`;
  }, [dirty, handleSave, exportFormat]);

  return (
    <div className="cv-page" lang={uiLocale}>
      <a href="#cv-main" className="skip-link">
        {t(uiLocale, "skipToContent")}
      </a>
      {researchEnabled ? (
        <ResearchConsentPrompt initialConsent={researchConsent} locale={uiLocale} />
      ) : null}
      <TopBar
        userName={userName}
        locale={uiLocale}
        status={status}
        saving={saving}
        syncing={syncing}
        dirty={dirty}
        hasCv={!!cv}
        onSync={handleSync}
        onSave={handleSave}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onExport={handleExport}
        onChangeLocale={changeUiLocale}
        published={published}
        publicSlug={publicSlug}
        publicIndexable={publicIndexable}
        publicContact={cv?.display.publicContact ?? { email: false, phone: false, location: false }}
        onPublicContactChange={(next) => {
          if (cv) update(updateDisplay(cv, { publicContact: next }));
        }}
        researchConsent={researchConsent}
        digestOptIn={digestOptIn}
        digestContactEmail={digestContactEmail}
        digestContactEmailVerified={digestContactEmailVerified}
        accountEmail={accountEmail}
        signOutAction={signOutAction}
      />

      {cv ? (
        <>
          <DisambiguationCoachmark
            locale={uiLocale}
            show={cv.sections.some(
              (s) => (s.type === "publications" || s.type === "preprints") && s.items.length > 0,
            )}
          />
          <PublishNudge published={published} locale={uiLocale} />
          <SyncReportBanner report={syncReport} locale={uiLocale} />
          {/* Mobile-only pane switch: on a phone the two panes stack and only
              the active one shows, so you don't scroll past the whole editor to
              reach the preview. On desktop both panes show and these hide. */}
          <div
            className="pane-tabs"
            aria-label={`${editorUi(uiLocale).tabEditor} / ${editorUi(uiLocale).tabPreview}`}
          >
            <button
              type="button"
              className={`pane-tab${pane === "editor" ? " is-active" : ""}`}
              aria-pressed={pane === "editor"}
              onClick={() => setPane("editor")}
            >
              {editorUi(uiLocale).tabEditor}
            </button>
            <button
              type="button"
              className={`pane-tab${pane === "preview" ? " is-active" : ""}`}
              aria-pressed={pane === "preview"}
              onClick={() => setPane("preview")}
            >
              {editorUi(uiLocale).tabPreview}
            </button>
          </div>
          <div className="cv-workspace" id="cv-main" data-active-pane={pane}>
            <section className="cv-workspace-pane" data-pane="editor">
              <CvEditor
                cv={cv}
                availableStyles={availableStyles}
                uiLocale={uiLocale}
                onChange={update}
                onClaimAdded={handleClaimAdded}
                variant="regions"
              />
            </section>
            <section className="cv-workspace-pane" data-pane="preview">
              <CvPreview html={previewHtml} loading={previewLoading} locale={uiLocale} />
            </section>
          </div>
        </>
      ) : (
        <div className="cv-empty container" id="cv-main">
          <h2>{t(uiLocale, "emptyTitle")}</h2>
          <p className="muted">{t(uiLocale, "emptyBody")}</p>
          <button type="button" className="btn btn-primary" onClick={handleSync} disabled={syncing}>
            {syncing ? t(uiLocale, "resyncing") : t(uiLocale, "syncFromOpenAlex")}
          </button>
        </div>
      )}
    </div>
  );
}
