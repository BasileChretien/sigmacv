"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { asLocale } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import CvHealthPanel, { type CvHealthCategory } from "./CvHealthPanel";
import ProfilePanel from "./ProfilePanel";
import SectionsList, { type SectionsListHandle } from "./SectionsList";
import StyleControls from "./StyleControls";

/** The three task clusters of the subdivided ("regions") editor layout. */
type EditorPart = "content" | "design" | "profile";
const EDITOR_PARTS: readonly EditorPart[] = ["content", "design", "profile"];

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

export default function CvEditor({
  cv,
  availableStyles,
  uiLocale,
  onChange,
  onClaimAdded = () => {},
  variant = "classic",
}: CvEditorProps) {
  // Editor chrome follows the INTERFACE language; the CV's own language is
  // cv.display.locale, edited via the "CV language" picker inside StyleControls.
  const locale = asLocale(uiLocale);
  const eu = editorUi(locale);

  // The sections list owns the curation + duplicate-review state; the editor only
  // needs a handle to it so the (out-of-list) CV-health panel can jump to a
  // flagged item. In the regions layout that jump must first switch to the
  // Content part so the target row is mounted + laid out before it scrolls.
  const sectionsRef = useRef<SectionsListHandle>(null);

  const [activePart, setActivePart] = useState<EditorPart>("content");
  const tablistRef = useRef<HTMLDivElement>(null);

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
      <CvHealthPanel cv={cv} locale={locale} onResolve={jumpToHealth} />

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
}
