"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { signInWithOrcid } from "@/app/auth-actions";
import { asLocale } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import { landingStrings } from "@/lib/i18n/landing";
import { previewStrings } from "@/lib/i18n/preview";
import CvEditor from "./CvEditor";
import CvPreview from "./CvPreview";
import SignInButton from "./SignInButton";

interface PreviewWorkspaceProps {
  initialCv: CanonicalCv;
  /** Server-rendered first paint of the preview pane (avoids a blank flash). */
  initialHtml: string;
  /** The subject's display name, for the top-bar heading. */
  name: string;
  locale: string;
  availableStyles: string[];
}

/**
 * The no-login INTERACTIVE preview: the REAL editor (curate + restyle) beside the
 * live preview, seeded from a CV built off a public ORCID iD. Everything visual
 * works anonymously — reorder, remove "not mine", show/hide sections, pick the
 * template / citation style / metrics — and the preview re-renders as you edit.
 * Saving, publishing and exporting are the only account-gated actions, surfaced
 * as a single "sign in" call to action. Nothing is persisted.
 */
export default function PreviewWorkspace({
  initialCv,
  initialHtml,
  name,
  locale,
  availableStyles,
}: PreviewWorkspaceProps) {
  const loc = asLocale(locale);
  const s = previewStrings(loc);
  const eu = editorUi(loc);
  const signingIn = landingStrings(loc).signingIn;
  const [cv, setCv] = useState<CanonicalCv>(initialCv);
  const [previewHtml, setPreviewHtml] = useState(initialHtml);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pane, setPane] = useState<"editor" | "preview">("editor");
  // Which surface the preview renders: the document (export) render, or the living
  // public page — which applies the chosen animated publicStyle.
  const [previewSurface, setPreviewSurface] = useState<"document" | "public">("document");
  // We already have a server-rendered first paint (initialHtml); skip the first
  // client render so we don't immediately refetch what we already have.
  const seeded = useRef(true);
  // Latest cv for the (deps-stable) update callback's public-style comparison.
  const cvRef = useRef(cv);
  cvRef.current = cv;

  // Debounced live re-render on every edit or surface switch, via the anon endpoint.
  useEffect(() => {
    if (seeded.current) {
      seeded.current = false;
      return;
    }
    // Guard against a stale response: if a newer edit supersedes this render
    // before it resolves, `cancelled` stops the late reply from clobbering the
    // newer preview (a failed/rate-limited render just leaves the last one — the
    // same best-effort behaviour as the signed-in editor's preview).
    let cancelled = false;
    setPreviewLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/preview/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: cv, surface: previewSurface }),
        });
        const data = (await res.json().catch(() => ({}))) as { html?: string };
        if (!cancelled && res.ok && typeof data.html === "string") setPreviewHtml(data.html);
      } catch {
        /* best-effort — keep the previous render in place */
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [cv, previewSurface]);

  const update = useCallback((next: CanonicalCv) => {
    // Picking an animated public style flips the preview to the public page so the
    // choice is visible (it never shows on the document/export render).
    const prev = cvRef.current;
    if (
      next.display.publicStyle !== prev.display.publicStyle &&
      next.display.publicStyle !== "match"
    ) {
      setPreviewSurface("public");
    }
    setCv(next);
  }, []);

  return (
    <div className="preview-app" lang={loc}>
      <header className="preview-app-bar">
        <span className="preview-app-brand">
          <span className="preview-app-mark" aria-hidden="true">
            Σ
          </span>
          <span className="preview-app-name">{name || "SigmaCV"}</span>
        </span>
        <div className="preview-app-cta">
          <span className="preview-app-note">{s.editNote}</span>
          <form action={signInWithOrcid}>
            <SignInButton
              method="orcid"
              className="hp2-btn hp2-btn-primary preview-app-signin"
              pendingLabel={signingIn}
            >
              {s.ctaKeep}
            </SignInButton>
          </form>
        </div>
      </header>

      {/* Mobile pane switch — both panes sit side-by-side on desktop. */}
      <div className="pane-tabs" aria-label={`${eu.tabEditor} / ${eu.tabPreview}`}>
        <button
          type="button"
          className={`pane-tab${pane === "editor" ? " is-active" : ""}`}
          aria-pressed={pane === "editor"}
          onClick={() => setPane("editor")}
        >
          {eu.tabEditor}
        </button>
        <button
          type="button"
          className={`pane-tab${pane === "preview" ? " is-active" : ""}`}
          aria-pressed={pane === "preview"}
          onClick={() => setPane("preview")}
        >
          {eu.tabPreview}
        </button>
      </div>

      <div className="cv-workspace" id="cv-main" data-active-pane={pane} data-layout="split">
        <section className="cv-workspace-pane" data-pane="editor">
          <CvEditor
            cv={cv}
            availableStyles={availableStyles}
            uiLocale={loc}
            onChange={update}
            variant="regions"
            anonymous
          />
        </section>
        <section className="cv-workspace-pane" data-pane="preview">
          {/* Toggle between the document (export) render and the living public
              page (which applies the chosen animated style). */}
          <div className="preview-surface" role="group" aria-label={eu.previewSurfaceLabel}>
            <span className="preview-surface-label">{eu.previewSurfaceLabel}</span>
            <button
              type="button"
              className={`preview-surface-btn${previewSurface === "document" ? " is-active" : ""}`}
              aria-pressed={previewSurface === "document"}
              onClick={() => setPreviewSurface("document")}
            >
              {eu.previewSurfaceDocument}
            </button>
            <button
              type="button"
              className={`preview-surface-btn${previewSurface === "public" ? " is-active" : ""}`}
              aria-pressed={previewSurface === "public"}
              onClick={() => setPreviewSurface("public")}
            >
              {eu.previewSurfacePublic}
            </button>
          </div>
          <CvPreview
            html={previewHtml}
            loading={previewLoading}
            locale={loc}
            pageFormat={cv.display.pageFormat}
          />
        </section>
      </div>
    </div>
  );
}
