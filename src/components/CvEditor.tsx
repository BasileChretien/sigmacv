"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { confirmAllMisattributed } from "@/lib/canonical/curate";
import { asLocale } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import CvHealthPanel, { type CvHealthCategory } from "./CvHealthPanel";
import ProfilePanel from "./ProfilePanel";
import SectionsList, { type SectionsListHandle } from "./SectionsList";
import StyleControls from "./StyleControls";

/** The three task clusters of the subdivided ("regions") editor layout. */
type EditorPart = "content" | "design" | "profile";
const EDITOR_PARTS: readonly EditorPart[] = ["profile", "design", "content"];

interface CvEditorProps {
  cv: CanonicalCv;
  availableStyles: string[];
  /** Interface language (independent of the CV's own rendered language). */
  uiLocale: string;
  onChange: (next: CanonicalCv) => void;
  /** A DOI-claimed work was added server-side; replace the CV with the saved one.
   *  Always supplied by CvWorkspace; optional so tests can omit it. */
  onClaimAdded?: (cv: CanonicalCv) => void;
  /**
   * Panel layout. `"classic"` (default) is the original single-scroll stack —
   * unchanged behaviour and DOM. `"regions"` subdivides the panel into Content /
   * Design / Profile parts with a persistent "needs attention" strip; opt-in so
   * the live editor can adopt it by flipping this one prop.
   */
  variant?: "classic" | "regions";
}

/** Imperative surface CvWorkspace uses to drive the sync banner's "jump to item". */
export interface CvEditorHandle {
  jumpToItem: (itemId: string) => void;
  /** Deep-link from the Publish menu: switch to the Design part and reveal +
   *  scroll to the Public-page-style group. */
  jumpToPublicStyle: () => void;
}

const CvEditor = forwardRef<CvEditorHandle, CvEditorProps>(function CvEditor(
  { cv, availableStyles, uiLocale, onChange, onClaimAdded = () => {}, variant = "classic" },
  ref,
) {
  // Editor chrome follows the INTERFACE language; the CV's own language is
  // cv.display.locale, edited via the "CV language" picker inside StyleControls.
  const locale = asLocale(uiLocale);
  const eu = editorUi(locale);

  // The sections list owns the curation + duplicate-review state; the editor only
  // needs a handle to it so the (out-of-list) CV-health panel can jump to a
  // flagged item. In the regions layout that jump must first switch to the
  // Content part so the target row is mounted + laid out before it scrolls.
  const sectionsRef = useRef<SectionsListHandle>(null);

  // Open on the first part (Profile) so the segmented control opens on its
  // leading tab; a CV-health jump still routes to Content (where the rows live).
  const [activePart, setActivePart] = useState<EditorPart>("profile");
  const tablistRef = useRef<HTMLDivElement>(null);
  // Bumped by jumpToPublicStyle() to (re)trigger the reveal effect below.
  const [publicStyleFocusTick, setPublicStyleFocusTick] = useState(0);

  // The sync banner (in CvWorkspace) jumps to a specific item; route it through
  // the Content part first so the target row is mounted before it scrolls.
  useImperativeHandle(ref, () => ({
    jumpToItem: (itemId: string) => {
      setActivePart("content");
      sectionsRef.current?.jumpToItem(itemId);
    },
    // Deep-link from the Publish menu: open the Design part, then (in the effect
    // below, once that panel is visible) reveal + scroll to the public-style group.
    jumpToPublicStyle: () => {
      setActivePart("design");
      setPublicStyleFocusTick((n) => n + 1);
    },
  }));

  // Reveal + scroll to the public-page-style group after a jumpToPublicStyle().
  // The Design panel is always mounted (toggled via `hidden`), so we wait one
  // frame for it to become visible, then locate the public-style group by the one
  // radiogroup that uses `aria-label` (the document-template gallery uses
  // `aria-labelledby`), open its <details> — which lazy-loads its thumbnails via
  // the existing onToggle — and scroll it into view. Reset to 0 so a later manual
  // visit to Design doesn't re-trigger the scroll.
  useEffect(() => {
    if (publicStyleFocusTick === 0 || activePart !== "design") return;
    const raf = requestAnimationFrame(() => {
      const gallery = document.querySelector(".template-gallery[aria-label]");
      if (gallery) {
        const group = gallery.closest("details.cv-style-group");
        if (group instanceof HTMLDetailsElement) group.open = true;
        (group ?? gallery).scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setPublicStyleFocusTick(0);
    });
    return () => cancelAnimationFrame(raf);
  }, [publicStyleFocusTick, activePart]);

  const profilePanel = <ProfilePanel cv={cv} locale={locale} onChange={onChange} />;
  const sectionsList = (
    <SectionsList
      ref={sectionsRef}
      cv={cv}
      locale={locale}
      onChange={onChange}
      onClaimAdded={onClaimAdded}
    />
  );

  if (variant === "classic") {
    return (
      <div className="cv-editor">
        {profilePanel}
        <StyleControls
          cv={cv}
          availableStyles={availableStyles}
          locale={locale}
          onChange={onChange}
        />
        <CvHealthPanel
          cv={cv}
          locale={locale}
          onResolve={(cat) => sectionsRef.current?.resolveHealth(cat)}
          onConfirmAllMisattributed={() => onChange(confirmAllMisattributed(cv))}
        />
        {sectionsList}
      </div>
    );
  }

  // ── Regions layout ──────────────────────────────────────────────────────────
  const partLabel = (p: EditorPart): string =>
    p === "content" ? eu.regionContent : p === "design" ? eu.regionDesign : eu.regionProfile;

  /** A CV-health jump always lands in the Content part (where the rows live). */
  const jumpToHealth = (cat: CvHealthCategory) => {
    setActivePart("content");
    sectionsRef.current?.resolveHealth(cat);
  };

  // WAI-ARIA Tabs keyboard model: arrows move + activate (roving tabindex), with
  // Home/End to the ends. Focus follows selection so it's a single-tab-stop strip.
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = EDITOR_PARTS.indexOf(activePart);
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % EDITOR_PARTS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (idx - 1 + EDITOR_PARTS.length) % EDITOR_PARTS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = EDITOR_PARTS.length - 1;
    else return;
    e.preventDefault();
    const target = EDITOR_PARTS[next]!;
    setActivePart(target);
    tablistRef.current?.querySelector<HTMLButtonElement>(`#cv-part-tab-${target}`)?.focus();
  };

  return (
    <div className="cv-editor cv-editor--regions">
      {/* Persistent "needs your attention" strip — always visible, never trapped
          inside a part. Renders nothing when there is nothing to act on. */}
      <CvHealthPanel
        cv={cv}
        locale={locale}
        onResolve={jumpToHealth}
        onConfirmAllMisattributed={() => onChange(confirmAllMisattributed(cv))}
      />

      <div className="cv-part-tabs" role="tablist" aria-label={eu.regionsAria} ref={tablistRef}>
        {EDITOR_PARTS.map((p) => {
          const selected = activePart === p;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              id={`cv-part-tab-${p}`}
              aria-selected={selected}
              aria-controls={`cv-part-panel-${p}`}
              tabIndex={selected ? 0 : -1}
              className={`cv-part-tab${selected ? " is-active" : ""}`}
              onClick={() => setActivePart(p)}
              onKeyDown={onTabKeyDown}
            >
              {partLabel(p)}
            </button>
          );
        })}
      </div>

      <div
        className="cv-region"
        role="tabpanel"
        id="cv-part-panel-content"
        aria-labelledby="cv-part-tab-content"
        hidden={activePart !== "content"}
      >
        {sectionsList}
      </div>
      <div
        className="cv-region"
        role="tabpanel"
        id="cv-part-panel-design"
        aria-labelledby="cv-part-tab-design"
        hidden={activePart !== "design"}
      >
        <StyleControls
          cv={cv}
          availableStyles={availableStyles}
          locale={locale}
          onChange={onChange}
          grouped
        />
      </div>
      <div
        className="cv-region"
        role="tabpanel"
        id="cv-part-panel-profile"
        aria-labelledby="cv-part-tab-profile"
        hidden={activePart !== "profile"}
      >
        {profilePanel}
      </div>
    </div>
  );
});

export default CvEditor;
