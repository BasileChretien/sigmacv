"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { safeParseSyncReport, type SyncReport } from "@/lib/cv/syncReport";
import { updateDisplay } from "@/lib/canonical/curate";
import { asLocale, t, type Locale } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import { trackEvent } from "@/lib/analytics/track";

const UI_LOCALE_KEY = "sigmacv:uiLocale";
const PREVIEW_LAYOUT_KEY = "sigmacv:previewLayout";
type PreviewLayout = "split" | "stacked";
// Persist the working document this long after edits settle. Longer than the
// live-preview debounce (350 ms) so a burst of edits coalesces into one write,
// keeping us well under the save rate limit (120/hour). The manual Save button
// stays as an immediate-save fallback.
const AUTOSAVE_DELAY_MS = 1500;
import { selectOnboardingStep, type OnboardingStep } from "@/lib/onboardingSequence";
import CvEditor, { type CvEditorHandle } from "./CvEditor";
import CvPreview from "./CvPreview";
import DisambiguationCoachmark, { COACHMARK_DISMISS_KEY } from "./DisambiguationCoachmark";
import PublishNudge, { PUBLISH_NUDGE_DISMISS_KEY } from "./PublishNudge";
import PopoverGroup from "./PopoverGroup";
import ResearchConsentPrompt from "./ResearchConsentPrompt";
import SyncReportBanner, { SYNC_REPORT_DISMISS_KEY } from "./SyncReportBanner";
import TopBar, { type ExportFormat } from "./TopBar";

interface CvWorkspaceProps {
  initialCv: CanonicalCv | null;
  /** The persisted "what changed" report of the last sync (null = none yet). */
  initialSyncReport?: SyncReport | null;
  /** True when the server's first auto-sync threw — show a retryable error
   *  state instead of the "no CV yet" empty state. */
  initialSyncFailed?: boolean;
  /** Freshness-gated "sync on connect": when the server flags the CV as stale
   *  on this open (> ~12h since the last sync), refresh in the background once
   *  after mount. The cached CV renders immediately; the banner updates after. */
  autoSyncOnLoad?: boolean;
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
  initialSyncFailed = false,
  autoSyncOnLoad = false,
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
  // True when a sync (the server's first auto-sync, or a manual retry) failed and
  // we have no CV to show — drives the distinct, retryable error state.
  const [syncError, setSyncError] = useState(initialSyncFailed);
  const [status, setStatus] = useState("");
  // Outcome of the current status message, so the top bar can show a green/red
  // dot instead of the same neutral one for both "Saved." and "Sync failed."
  const [statusKind, setStatusKind] = useState<"ok" | "error" | "">("");
  const showStatus = useCallback((message: string, kind: "ok" | "error" | "" = "") => {
    setStatus(message);
    setStatusKind(message ? kind : "");
  }, []);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  // True while an export is being produced + downloaded (the PDF render is the
  // slow one) so the Export button can disable + show progress instead of looking
  // frozen and inviting re-clicks.
  const [exporting, setExporting] = useState(false);
  // Which pane is visible on narrow screens (both show side-by-side on desktop).
  const [pane, setPane] = useState<"editor" | "preview">("editor");
  // Which surface the preview renders: the document (export) render, or the
  // living public page (which applies the chosen animated publicStyle).
  const [previewSurface, setPreviewSurface] = useState<"document" | "public">("document");
  // Desktop-only: editor and preview side-by-side (default) or stacked
  // (editor above preview). A client preference (localStorage), not part of the
  // CV; ignored on mobile, where the pane tabs take over.
  const [previewLayout, setPreviewLayout] = useState<PreviewLayout>("split");
  // Publish state is owned here (seeded from the server props) so toggling it in
  // the Publish menu updates the top-bar indicator and the publish nudge live,
  // rather than going stale until the next page load.
  const [publishState, setPublishState] = useState({
    published,
    slug: publicSlug,
    indexable: publicIndexable,
  });

  // Refs let the debounced auto-save read the latest document and avoid
  // overlapping writes without re-creating the debounce timer on every keystroke.
  const cvRef = useRef(cv);
  cvRef.current = cv;
  const savingRef = useRef(false);
  // Lets the sync banner jump the editor to a "to review" item across components.
  const editorRef = useRef<CvEditorHandle>(null);

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

  // Restore the saved preview layout after mount (avoids a hydration mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PREVIEW_LAYOUT_KEY);
      if (saved === "split" || saved === "stacked") setPreviewLayout(saved);
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);
  const changePreviewLayout = useCallback((next: PreviewLayout) => {
    setPreviewLayout(next);
    try {
      window.localStorage.setItem(PREVIEW_LAYOUT_KEY, next);
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
          surface: previewSurface,
        })) as { html?: string };
        setPreviewHtml(data.html ?? "");
      } catch {
        // Preview is best-effort; leave the previous render in place.
      } finally {
        setPreviewLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [cv, previewSurface]);

  const update = useCallback(
    (next: CanonicalCv) => {
      // Picking an animated public style flips the preview to the public page so
      // the choice is visible (it never shows on the document/export render).
      const prev = cvRef.current;
      if (
        prev &&
        next.display.publicStyle !== prev.display.publicStyle &&
        next.display.publicStyle !== "match"
      ) {
        setPreviewSurface("public");
      }
      setCv(next);
      setDirty(true);
      showStatus("");
    },
    [showStatus],
  );

  // A DOI-claimed work is appended + SAVED server-side, so adopt the returned CV
  // and stay clean (no pending save) rather than marking the doc dirty.
  const handleClaimAdded = useCallback(
    (next: CanonicalCv) => {
      setCv(next);
      setDirty(false);
      showStatus(t(uiLocale, "savedStatus"), "ok");
    },
    [uiLocale, showStatus],
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!cv || savingRef.current) return false;
    const snapshot = cv;
    savingRef.current = true;
    setSaving(true);
    showStatus("");
    try {
      await apiFetch("/api/cv", "PATCH", { document: snapshot });
      // Only clear the dirty flag if nothing was edited while the save was in
      // flight; otherwise the pending auto-save persists the newer document.
      if (cvRef.current === snapshot) setDirty(false);
      showStatus(t(uiLocale, "savedStatus"), "ok");
      return true;
    } catch (err) {
      // Leave the document dirty so the Save button + navigate-away guard still
      // protect the edit; do not auto-retry in a loop.
      showStatus(err instanceof Error ? err.message : t(uiLocale, "saveFailed"), "error");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [cv, uiLocale, showStatus]);

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
    showStatus("");
    try {
      const data = (await apiFetch("/api/cv/sync", "POST")) as {
        cv: CanonicalCv;
        report?: unknown;
      };
      setCv(data.cv);
      // Shape-validated: a report the client can't parse degrades to "none".
      setSyncReport(safeParseSyncReport(data.report));
      setDirty(false);
      setSyncError(false);
      showStatus(t(uiLocale, "syncedStatus"), "ok");
    } catch (err) {
      showStatus(err instanceof Error ? err.message : t(uiLocale, "syncFailed"), "error");
      // With no CV on screen, a transient status line is easy to miss and looks
      // like "you have no works" — surface a distinct, retryable error instead.
      if (!cvRef.current) setSyncError(true);
    } finally {
      setSyncing(false);
    }
  }, [uiLocale, showStatus]);

  // Freshness-gated background "sync on connect": when the server flags the CV as
  // stale on this open (> ~12h), refresh from the sources once after mount. The
  // cached CV is already on screen; the "what's new" banner appears when it lands.
  // The ref guards against React's dev double-invoke.
  const autoSyncRan = useRef(false);
  useEffect(() => {
    if (autoSyncRan.current || !autoSyncOnLoad || !initialCv) return;
    autoSyncRan.current = true;
    void handleSync();
  }, [autoSyncOnLoad, initialCv, handleSync]);

  // ── Onboarding sequencer ────────────────────────────────────────────────
  // The first-run prompts (the "what changed" sync banner, the disambiguation
  // coachmark, the publish nudge) used to stack and overwhelm. Show ONE at a
  // time, highest-priority first; dismissing the active one reveals the next.
  const hasPublications = !!cv?.sections.some(
    (s) => (s.type === "publications" || s.type === "preprints") && s.items.length > 0,
  );
  const [onboardingTick, setOnboardingTick] = useState(0);
  const [activeOnboarding, setActiveOnboarding] = useState<OnboardingStep | null>(null);
  const advanceOnboarding = useCallback(() => setOnboardingTick((n) => n + 1), []);
  useEffect(() => {
    const read = (key: string): string | null => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    };
    setActiveOnboarding(
      selectOnboardingStep({
        syncReport:
          !!syncReport &&
          (syncReport.addedTotal > 0 || syncReport.removedTotal > 0) &&
          read(SYNC_REPORT_DISMISS_KEY) !== syncReport.syncedAt,
        coachmark: hasPublications && read(COACHMARK_DISMISS_KEY) !== "1",
        publishNudge: !publishState.published && read(PUBLISH_NUDGE_DISMISS_KEY) !== "1",
      }),
    );
    // onboardingTick re-reads localStorage after a dismissal advances the queue.
  }, [syncReport, publishState.published, hasPublications, onboardingTick]);

  const handleExport = useCallback(async () => {
    // Export uses the SAVED document — don't download a stale file if the
    // save failed.
    if (dirty) {
      const ok = await handleSave();
      if (!ok) return;
    }
    // Cookieless product signal: which export format. No personal/CV data.
    trackEvent("Export", { format: exportFormat });
    // Fetch the file as a blob (rather than navigating to it) so the button can
    // show progress during the slow PDF render AND a failure surfaces in-app
    // instead of dumping a raw API error page in the tab.
    setExporting(true);
    showStatus("");
    try {
      const res = await fetch(`/api/cv/export/${exportFormat}`);
      if (!res.ok) throw new Error(`export failed: ${res.status}`);
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const named = /filename="?([^";]+)"?/.exec(disposition);
      const filename = named?.[1]?.trim() || `cv.${exportFormat}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showStatus(t(uiLocale, "exportFailed"), "error");
    } finally {
      setExporting(false);
    }
  }, [dirty, handleSave, exportFormat, showStatus, uiLocale]);

  // Deep-link from the Publish menu to the public-page-style picker: on a phone,
  // make sure the editor pane (not the preview) is showing, then jump the editor
  // to the Design part and reveal that group.
  const handleEditPublicStyle = useCallback(() => {
    setPane("editor");
    editorRef.current?.jumpToPublicStyle();
  }, []);

  return (
    <div className="cv-page" lang={uiLocale}>
      <a href="#cv-main" className="skip-link">
        {t(uiLocale, "skipToContent")}
      </a>
      {researchEnabled ? (
        <ResearchConsentPrompt initialConsent={researchConsent} locale={uiLocale} />
      ) : null}
      {/* PopoverGroup keeps one menu open at a time and renders the shared
          dismiss scrim as a sibling of the bar (so the bar stays clickable
          above it, the preview iframe is covered below it). */}
      <PopoverGroup>
        <TopBar
          userName={userName}
          locale={uiLocale}
          status={status}
          statusKind={statusKind}
          saving={saving}
          syncing={syncing}
          dirty={dirty}
          hasCv={!!cv}
          onSync={handleSync}
          onSave={handleSave}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          onExport={handleExport}
          exporting={exporting}
          onChangeLocale={changeUiLocale}
          published={publishState.published}
          publicSlug={publishState.slug}
          publicIndexable={publishState.indexable}
          publicContact={
            cv?.display.publicContact ?? { email: false, phone: false, location: false }
          }
          onPublicContactChange={(next) => {
            if (cv) update(updateDisplay(cv, { publicContact: next }));
          }}
          onPublishStateChange={setPublishState}
          onEditPublicStyle={handleEditPublicStyle}
          researchConsent={researchConsent}
          digestOptIn={digestOptIn}
          digestContactEmail={digestContactEmail}
          digestContactEmailVerified={digestContactEmailVerified}
          accountEmail={accountEmail}
          signOutAction={signOutAction}
        />
      </PopoverGroup>

      {cv ? (
        <>
          <SyncReportBanner
            report={syncReport}
            locale={uiLocale}
            suppressed={activeOnboarding !== "syncReport"}
            onDismissed={advanceOnboarding}
            onFocusItem={(id) => editorRef.current?.jumpToItem(id)}
          />
          <DisambiguationCoachmark
            locale={uiLocale}
            show={hasPublications}
            suppressed={activeOnboarding !== "coachmark"}
            onDismissed={advanceOnboarding}
          />
          <PublishNudge
            published={publishState.published}
            locale={uiLocale}
            suppressed={activeOnboarding !== "publishNudge"}
            onDismissed={advanceOnboarding}
          />
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
          {/* Desktop-only: choose whether the editor and preview sit side by side
              or stacked (editor above preview). Hidden on mobile, where the pane
              tabs above govern the single-pane view. */}
          <div className="layout-toggle" role="group" aria-label={editorUi(uiLocale).layoutLabel}>
            <button
              type="button"
              className={`layout-toggle-btn${previewLayout === "split" ? " is-active" : ""}`}
              aria-pressed={previewLayout === "split"}
              onClick={() => changePreviewLayout("split")}
            >
              {editorUi(uiLocale).layoutSideBySide}
            </button>
            <button
              type="button"
              className={`layout-toggle-btn${previewLayout === "stacked" ? " is-active" : ""}`}
              aria-pressed={previewLayout === "stacked"}
              onClick={() => changePreviewLayout("stacked")}
            >
              {editorUi(uiLocale).layoutStacked}
            </button>
          </div>
          <div
            className="cv-workspace"
            id="cv-main"
            data-active-pane={pane}
            data-layout={previewLayout}
          >
            <section className="cv-workspace-pane" data-pane="editor">
              <CvEditor
                ref={editorRef}
                cv={cv}
                availableStyles={availableStyles}
                uiLocale={uiLocale}
                onChange={update}
                onClaimAdded={handleClaimAdded}
                variant="regions"
              />
            </section>
            <section className="cv-workspace-pane" data-pane="preview">
              {/* Toggle the preview between the document (export) render and the
                  living public page (which applies the chosen animated style). */}
              <div
                className="preview-surface"
                role="group"
                aria-label={editorUi(uiLocale).previewSurfaceLabel}
              >
                <span className="preview-surface-label">
                  {editorUi(uiLocale).previewSurfaceLabel}
                </span>
                <button
                  type="button"
                  className={`preview-surface-btn${previewSurface === "document" ? " is-active" : ""}`}
                  aria-pressed={previewSurface === "document"}
                  onClick={() => setPreviewSurface("document")}
                >
                  {editorUi(uiLocale).previewSurfaceDocument}
                </button>
                <button
                  type="button"
                  className={`preview-surface-btn${previewSurface === "public" ? " is-active" : ""}`}
                  aria-pressed={previewSurface === "public"}
                  onClick={() => setPreviewSurface("public")}
                >
                  {editorUi(uiLocale).previewSurfacePublic}
                </button>
              </div>
              <CvPreview
                html={previewHtml}
                loading={previewLoading}
                locale={uiLocale}
                pageFormat={cv.display.pageFormat}
              />
            </section>
          </div>
        </>
      ) : syncError ? (
        <div className="cv-empty cv-empty-error container" id="cv-main" role="alert">
          <h2>{t(uiLocale, "syncErrorTitle")}</h2>
          <p className="muted">{t(uiLocale, "syncErrorBody")}</p>
          <button type="button" className="btn btn-primary" onClick={handleSync} disabled={syncing}>
            {syncing ? t(uiLocale, "resyncing") : t(uiLocale, "syncRetry")}
          </button>
        </div>
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
