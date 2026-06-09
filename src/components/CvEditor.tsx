"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Reorder, useDragControls, type DragControls } from "motion/react";
import {
  ACCENT_PRESETS,
  AUTHORSHIP_ROLES,
  DENSITIES,
  FONT_PAIRINGS,
  HIGHLIGHT_STYLES,
  PROSE_BODY_MAX,
  SECTION_TYPES,
  TEMPLATES,
  isProseSectionType,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
  type CustomStyle,
} from "@/lib/canonical/schema";
import { isHidden } from "@/lib/canonical/schema";
import {
  addManualEntry,
  addSection,
  addStructuredEntry,
  type ManualEntryFields,
  applyPreset,
  clearDuplicateFlag,
  clearViewExclusions,
  deletePreset,
  dismissDuplicateGroup,
  isItemShownInView,
  moveItem,
  moveItemTo,
  moveSection,
  orderedSections,
  reorderSections,
  removeItem,
  removeSection,
  renameSection,
  savePreset,
  setItemInView,
  setItemIncluded,
  setItemNotMine,
  setLocale,
  viewExcludedIds,
  setSectionBody,
  setSectionVisible,
  updateDisplay,
  updateItemText,
} from "@/lib/canonical/curate";
import {
  applyCvModel,
  cvModelsByCategory,
  resetCvSections,
  type CvModelCategory,
} from "@/lib/canonical/cvModels";
import { METRIC_DEFS, formatMetricValue } from "@/lib/render/metrics";
import { authorshipRoleLabel, metricLabel } from "@/lib/i18n/render";
import { ui } from "@/lib/i18n/ui";
import { editorUi } from "@/lib/i18n/editorUi";
import { dupStrings } from "@/lib/i18n/duplicates";
import { CSL_STYLE_CATALOG } from "@/lib/citeproc/styleCatalog";
import { LOCALE_LABELS, SUPPORTED_LOCALES, asLocale, sectionTitle, t } from "@/lib/i18n";
import ClaimByDoi from "./ClaimByDoi";
import ItemRow from "./ItemRow";
import ProfilePanel from "./ProfilePanel";

interface CvEditorProps {
  cv: CanonicalCv;
  availableStyles: string[];
  /** Interface language (independent of the CV's own rendered language). */
  uiLocale: string;
  onChange: (next: CanonicalCv) => void;
  /** A DOI-claimed work was added server-side; replace the CV with the saved one.
   *  Always supplied by CvWorkspace; optional so tests can omit it. */
  onClaimAdded?: (cv: CanonicalCv) => void;
}

const STYLE_LABELS: Record<string, string> = {
  apa: "APA",
  ieee: "IEEE",
  "chicago-author-date": "Chicago (author–date)",
  nature: "Nature",
  "modern-language-association": "MLA",
  "american-medical-association": "AMA",
};

/**
 * Section types offered in the "Add a section" menu — EVERY type, so any
 * section the user removed can be re-added. Source-driven types (publications,
 * preprints, peer-review) re-add as an empty section that the next re-sync
 * repopulates from the open record.
 */
const ADDABLE_SECTIONS: readonly CvSectionType[] = SECTION_TYPES;

/**
 * Citations behind the responsible-metrics note. These tokens appear verbatim
 * in every locale's `metricsPresetNote` (they're proper nouns / a fixed term),
 * so we can linkify them with a plain token split — no per-locale plumbing.
 *   • DORA / Leiden → the declarations the preset implements.
 *   • Impact Factor → the canonical peer-reviewed critique (Seglen, BMJ 1997)
 *     that *evidences* why journal-level proxies don't belong in evaluation.
 */
const RESPONSIBLE_METRIC_LINKS: ReadonlyArray<{
  token: string;
  href: string;
  title: string;
}> = [
  {
    token: "DORA",
    href: "https://sfdora.org/",
    title: "San Francisco Declaration on Research Assessment (DORA)",
  },
  {
    token: "Leiden",
    href: "https://www.leidenmanifesto.org/",
    title: "The Leiden Manifesto for research metrics (Hicks et al., Nature 2015)",
  },
  {
    token: "Impact Factor",
    href: "https://doi.org/10.1136/bmj.314.7079.497",
    title:
      "Seglen PO. Why the impact factor of journals should not be used for evaluating research. BMJ 1997;314:497.",
  },
];

// Longest token first so multi-word terms win over any future prefix overlap.
const METRIC_LINK_RE = new RegExp(
  `(${[...RESPONSIBLE_METRIC_LINKS]
    .sort((a, b) => b.token.length - a.token.length)
    .map((l) => l.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
);

/** The responsible-metrics note with DORA / Leiden / Impact-Factor references
 *  turned into links (the rest of the sentence stays plain, translatable text). */
function MetricsNoteText({ text }: { text: string }) {
  return (
    <>
      {text.split(METRIC_LINK_RE).map((part, i) => {
        const link = RESPONSIBLE_METRIC_LINKS.find((l) => l.token === part);
        return link ? (
          <a key={i} href={link.href} target="_blank" rel="noopener noreferrer" title={link.title}>
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

/**
 * One reorderable section. The card itself follows the pointer while dragging
 * (Motion `Reorder.Item`, so the held section glides and the rest spring out of
 * the way); `dragListener` is off so a drag only begins from the ⠿ handle — the
 * title input and buttons inside stay clickable. The handle gets `controls` via
 * the render-prop child and calls `controls.start(e)` on pointer-down.
 */
function SectionCard({
  value,
  children,
}: {
  value: string;
  children: (controls: DragControls) => ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={value}
      as="div"
      className="section-card"
      dragListener={false}
      dragControls={controls}
      style={{ position: "relative" }}
      whileDrag={{
        scale: 1.025,
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
        zIndex: 30,
      }}
      transition={{ type: "spring", stiffness: 550, damping: 38, mass: 0.6 }}
    >
      {children(controls)}
    </Reorder.Item>
  );
}

export default function CvEditor({
  cv,
  availableStyles,
  uiLocale,
  onChange,
  onClaimAdded = () => {},
}: CvEditorProps) {
  const sections = orderedSections(cv);
  const customStyle = cv.display.customStyle;
  // Editor chrome follows the INTERFACE language; the CV's own language is
  // cv.display.locale, edited via the "CV language" picker below.
  const locale = asLocale(uiLocale);
  const cvLocale = asLocale(cv.display.locale);
  const u = ui(locale);
  const eu = editorUi(locale);
  const ds = dupStrings(locale);

  // Index every item by id with its full data + section (the editor owns the
  // whole CV; ItemRow only knows its own item). Used to resolve a duplicate's
  // group members side-by-side and to act on them across sections.
  type Located = { item: CvItem; sectionId: string; sectionTitle: string };
  const itemIndex = useMemo(() => {
    const m = new Map<string, Located>();
    for (const s of cv.sections) {
      for (const it of s.items) m.set(it.id, { item: it, sectionId: s.id, sectionTitle: s.title });
    }
    return m;
  }, [cv.sections]);

  // Resolve each duplicate GROUP (keyed by `duplicateOf.groupId`, the
  // representative's id) → all its located members (the representative + every
  // flagged member). A cluster can be 2, 3 or more items across sections.
  const dupGroups = useMemo(() => {
    const groups = new Map<string, Located[]>();
    const push = (gid: string, entry: Located | undefined) => {
      if (!entry) return;
      const list = groups.get(gid) ?? [];
      if (!list.some((e) => e.item.id === entry.item.id)) list.push(entry);
      groups.set(gid, list);
    };
    for (const loc of itemIndex.values()) {
      const gid = loc.item.meta.duplicateOf?.groupId;
      if (!gid) continue;
      push(gid, loc); // the flagged member
      push(gid, itemIndex.get(gid)); // the representative (carries no flag itself)
    }
    return groups;
  }, [itemIndex]);

  // Locale-aware option labels (built from the chrome dictionary).
  const TEMPLATE_LABELS: Record<string, string> = {
    classic: u.tplClassic,
    modern: u.tplModern,
    sidebar: u.tplSidebar,
    ats: u.tplAts,
    rirekisho: "Japanese (履歴書)",
  };
  const HIGHLIGHT_STYLE_LABELS: Record<string, string> = {
    accent: u.hlAccent,
    bold: u.hlBold,
    underline: u.hlUnderline,
    "accent-underline": u.hlAccentUnderline,
  };
  const FONT_LABELS: Record<string, string> = {
    serif: u.fontSerif,
    sans: u.fontSans,
    palatino: u.fontPalatino,
  };
  const DENSITY_LABELS: Record<string, string> = {
    comfortable: u.densityComfortable,
    compact: u.densityCompact,
  };

  // The authorship table needs per-work author positions, which only exist on
  // freshly-synced data. If the table is on but any peer-reviewed own work lacks
  // a position, the counts will read 0 — prompt a re-sync rather than show zeros.
  const authorshipNeedsResync =
    cv.display.showAuthorshipTable &&
    cv.sections.some((s) =>
      s.items.some(
        (i) =>
          i.authoredBySelf &&
          i.included &&
          !i.notMine &&
          i.meta.peerReviewed !== false &&
          i.meta.authorPosition === undefined,
      ),
    );

  const [styleAdding, setStyleAdding] = useState(false);
  const [styleError, setStyleError] = useState("");
  // Draft text for the per-section "add entry" inputs, keyed by section type.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // Drag-and-drop reorder state (mouse only; the ↑/↓ buttons remain the
  // accessible fallback). Items reorder within their section via native DnD;
  // sections reorder via Motion `Reorder` (the held card tracks the pointer and
  // the rest spring out of the way) — that drag state lives inside Motion.
  const [dragItem, setDragItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  // Name buffer for saving the current view as a named preset.
  const [presetName, setPresetName] = useState("");
  // The CV-model the picker has selected (applied on the Apply button).
  const [modelId, setModelId] = useState("");
  // The CV-model catalog, grouped by category (Grant calls / Public
  // institutions / Industry & clinical). Static — memoized once. Localized
  // optgroup label per category (only the chrome is localized; model names +
  // descriptions render as-is in English).
  const modelGroups = useMemo(() => cvModelsByCategory(), []);
  const modelGroupLabel = (c: CvModelCategory): string =>
    c === "grant"
      ? eu.modelGrpGrant
      : c === "institution"
        ? eu.modelGrpInstitution
        : eu.modelGrpIndustry;
  const selectedModel = modelId
    ? modelGroups.flatMap((g) => g.models).find((m) => m.id === modelId)
    : undefined;
  // "(None)" is selected (no model) AND the layout is currently customized →
  // the Apply button resets the section layout back to the default.
  const canResetModel = !modelId && cv.display.sectionsCustomized;
  // Sections are COLLAPSED by default (compact list that's easy to scan +
  // reorder); the chevron expands one. Only ids in this set are expanded.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hasSection = (type: string): boolean => cv.sections.some((s) => s.type === type);

  // Which section types the "Add a section" menu offers. A type is addable when
  // it isn't already present — EXCEPT `statement`, a free-titled prose block the
  // user can add as many times as they like (so it's always offered).
  const isAddable = (type: CvSectionType): boolean => type === "statement" || !hasSection(type);

  function newId(type: string): string {
    const rand =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const prefix = type === "positions" ? "position" : type;
    return `${prefix}:manual:${rand}`;
  }

  // Sections where a free-text "Add an entry" makes sense. Without this, a
  // source-less section the user adds from the menu (talks/teaching/supervision/
  // skills) would render with NO input at all — silently un-fillable.
  const MANUAL_SECTIONS = new Set([
    "positions",
    "education",
    "awards",
    "service",
    "datasets",
    "editorial",
    "grants",
    "talks",
    "teaching",
    "supervision",
    "skills",
    "other",
  ]);

  // Citation-type sections where a STRUCTURED entry (title/authors/venue/…) is
  // useful — it renders through citeproc with the chosen style, like an import.
  const STRUCTURED_SECTIONS = new Set(["publications", "preprints", "conference", "other"]);

  function addEntry(type: CanonicalCv["sections"][number]["type"]) {
    const text = (drafts[type] ?? "").trim();
    if (!text) return;
    onChange(addManualEntry(cv, type, text, newId(type)));
    setDrafts((d) => ({ ...d, [type]: "" }));
  }

  // Structured (citation-style) manual entries: a small form whose fields build
  // a CSL item, so the entry renders through citeproc like an imported work.
  const [structDrafts, setStructDrafts] = useState<Record<string, ManualEntryFields>>({});
  const setStructField = (type: string, key: keyof ManualEntryFields, value: string) =>
    setStructDrafts((d) => ({
      ...d,
      [type]: { ...(d[type] ?? { title: "" }), [key]: value },
    }));
  function addStructured(type: CanonicalCv["sections"][number]["type"]) {
    const fields = structDrafts[type];
    if (!fields?.title?.trim()) return;
    onChange(addStructuredEntry(cv, type, fields, newId(type)));
    setStructDrafts((d) => ({ ...d, [type]: { title: "" } }));
  }

  // Languages: a language + a proficiency (CEFR level / native / a test+score),
  // composed into "French — C1 (CEFR)" and stored as a manual entry.
  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const [langDraft, setLangDraft] = useState({
    lang: "",
    level: "C2 (CEFR)",
    other: "",
  });
  function addLanguage() {
    const lang = langDraft.lang.trim();
    if (!lang) return;
    const level = langDraft.level === "__other__" ? langDraft.other.trim() : langDraft.level;
    const text = level ? `${lang} — ${level}` : lang;
    onChange(addManualEntry(cv, "languages", text, newId("languages")));
    setLangDraft({ lang: "", level: "C2 (CEFR)", other: "" });
  }

  // References: a referee + affiliation/email/phone, composed into
  // "Name, Affiliation · email · phone" and stored as a manual entry.
  const [refDraft, setRefDraft] = useState({
    name: "",
    affiliation: "",
    email: "",
    phone: "",
  });
  function addReference() {
    const name = refDraft.name.trim();
    if (!name) return;
    const head = refDraft.affiliation.trim() ? `${name}, ${refDraft.affiliation.trim()}` : name;
    const contact = [refDraft.email.trim(), refDraft.phone.trim()].filter(Boolean).join(" · ");
    const text = contact ? `${head} · ${contact}` : head;
    onChange(addManualEntry(cv, "references", text, newId("references")));
    setRefDraft({ name: "", affiliation: "", email: "", phone: "" });
  }

  // Real template thumbnails: render the user's own (trimmed) CV in every
  // template and show each scaled in the gallery. Fetched once and whenever the
  // *look* (accent/font/highlight/language) changes — not on every content edit,
  // so typing doesn't hammer the renderer.
  const [tplPreviews, setTplPreviews] = useState<Record<string, string>>({});
  const { accentColor, fontPairing, highlightStyle } = cv.display;
  const styleLocale = cv.display.locale;
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/cv/preview/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: cv }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          previews?: { template: string; html: string }[];
        };
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const p of data.previews ?? []) map[p.template] = p.html;
        setTplPreviews(map);
      } catch {
        /* thumbnails are best-effort — the big preview pane is the source of truth */
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // Intentionally not keyed on the whole document — only on the visual choices.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentColor, fontPairing, highlightStyle, styleLocale]);

  // Dropdown options = bundled styles + the current custom style (if any).
  const styleOptions = useMemo(() => {
    const base = availableStyles.length ? availableStyles : [cv.display.cslStyle];
    const withCustom =
      customStyle && !base.includes(customStyle.id) ? [...base, customStyle.id] : base;
    return withCustom;
  }, [availableStyles, customStyle, cv.display.cslStyle]);

  const styleLabel = (s: string): string =>
    customStyle && s === customStyle.id ? customStyle.title : (STYLE_LABELS[s] ?? s);

  // Resolve a style by id/name/URL (any Zotero/CSL style) and apply it.
  async function resolveAndApplyStyle(input: string) {
    const value = input.trim();
    if (!value || styleAdding) return;
    setStyleAdding(true);
    setStyleError("");
    try {
      const res = await fetch("/api/cv/style/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const data = (await res.json().catch(() => ({}))) as
        | (CustomStyle & { error?: string })
        | { error?: string };
      if (!res.ok || !("xml" in data)) {
        setStyleError(("error" in data && data.error) || u.styleLoadError);
        return;
      }
      onChange(
        updateDisplay(cv, {
          cslStyle: data.id,
          customStyle: { id: data.id, title: data.title, xml: data.xml },
        }),
      );
    } catch {
      setStyleError(u.styleNetworkError);
    } finally {
      setStyleAdding(false);
    }
  }

  return (
    <div className="cv-editor">
      <ProfilePanel cv={cv} locale={locale} onChange={onChange} />

      <fieldset className="display-controls">
        <legend>{u.styleLegend}</legend>

        <div className="presets-bar">
          <span className="presets-label">{t(locale, "presets")}</span>
          {(cv.presets ?? []).map((p) => (
            <span key={p.id} className="preset-chip">
              <button
                type="button"
                className="preset-apply"
                title={t(locale, "applyPreset")}
                onClick={() => onChange(applyPreset(cv, p.id))}
              >
                {p.name}
              </button>
              <button
                type="button"
                className="preset-del"
                aria-label={t(locale, "deletePreset")}
                title={t(locale, "deletePreset")}
                onClick={() => onChange(deletePreset(cv, p.id))}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            className="preset-name-input"
            value={presetName}
            placeholder={t(locale, "presetName")}
            onChange={(e) => setPresetName(e.target.value)}
            aria-label={t(locale, "presetName")}
          />
          <button
            type="button"
            className="btn btn-sm"
            disabled={!presetName.trim()}
            onClick={() => {
              onChange(savePreset(cv, presetName));
              setPresetName("");
            }}
          >
            {t(locale, "savePreset")}
          </button>
        </div>

        {/* CV-model catalog. Pick a model (grant call / public-institution job /
            industry CV) from the grouped picker, then Apply: snapshot the current
            view as a restorable preset first (reversible), then apply the model's
            section selection + order + display + funder-specific titles via the
            pure `applyCvModel`. Only the chrome is localized — model names and
            descriptions render as-is (English). */}
        <div className="grant-presets cv-models">
          <span className="grant-presets-label" id="cv-model-label">
            {eu.modelLegend}
          </span>
          <select
            className="cv-model-select"
            aria-labelledby="cv-model-label"
            value={modelId}
            title={selectedModel?.description}
            onChange={(e) => setModelId(e.target.value)}
          >
            <option value="">{eu.modelNone}</option>
            {modelGroups.map((group) => (
              <optgroup key={group.category} label={modelGroupLabel(group.category)}>
                {group.models.map((m) => (
                  <option key={m.id} value={m.id} title={m.description}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!selectedModel && !canResetModel}
            onClick={() => {
              if (selectedModel) {
                onChange(
                  applyCvModel(savePreset(cv, eu.modelSnapshot), selectedModel.id, cvLocale),
                );
              } else if (canResetModel) {
                // "(None)": revert the funder layout back to the default sections.
                onChange(resetCvSections(savePreset(cv, eu.modelSnapshot), cvLocale));
              }
            }}
          >
            {eu.modelApply}
          </button>
          <p className="muted metric-preset-note grant-presets-help">{eu.modelHelp}</p>
          <p className="muted metric-preset-note grant-presets-note">
            {selectedModel ? selectedModel.description : eu.grantIntro}
          </p>
        </div>

        <h3 className="group-head">{eu.grpTemplate}</h3>

        <div className="field template-field">
          <span id="tpl-label">{u.templateLabel}</span>
          <div className="template-gallery" role="radiogroup" aria-labelledby="tpl-label">
            {TEMPLATES.map((tpl) => {
              const selected = cv.display.template === tpl;
              return (
                <button
                  key={tpl}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`tpl-card${selected ? " is-selected" : ""}`}
                  onClick={() =>
                    onChange(
                      updateDisplay(cv, {
                        template: tpl as CanonicalCv["display"]["template"],
                      }),
                    )
                  }
                  title={TEMPLATE_LABELS[tpl] ?? tpl}
                >
                  <span className="tpl-preview">
                    {tplPreviews[tpl] ? (
                      <iframe
                        className="tpl-frame"
                        srcDoc={tplPreviews[tpl]}
                        title={TEMPLATE_LABELS[tpl] ?? tpl}
                        sandbox=""
                        scrolling="no"
                        tabIndex={-1}
                        aria-hidden="true"
                        loading="lazy"
                      />
                    ) : (
                      <span className="tpl-skeleton" aria-hidden="true" />
                    )}
                  </span>
                  <span className="tpl-name">{TEMPLATE_LABELS[tpl] ?? tpl}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="field">
          <span>{t(locale, "cvLanguage")}</span>
          <select
            value={cvLocale}
            onChange={(e) => onChange(setLocale(cv, e.target.value))}
            aria-label={t(locale, "cvLanguage")}
            title={t(locale, "cvLanguageHint")}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </option>
            ))}
          </select>
          <span className="field-hint muted">{t(locale, "cvLanguageHint")}</span>
        </label>

        <label className="field custom-style">
          <span>{u.citationLabel}</span>
          <select
            value={cv.display.cslStyle}
            disabled={styleAdding}
            aria-label={u.citationLabel}
            onChange={(e) => {
              const v = e.target.value;
              if (styleOptions.includes(v)) {
                onChange(updateDisplay(cv, { cslStyle: v }));
              } else {
                void resolveAndApplyStyle(v); // a catalog style → resolve + apply
              }
            }}
          >
            <optgroup label={u.yourStyles}>
              {styleOptions.map((s) => (
                <option key={s} value={s}>
                  {styleLabel(s)}
                </option>
              ))}
            </optgroup>
            <optgroup label={u.journalStyles}>
              {CSL_STYLE_CATALOG.filter((s) => !styleOptions.includes(s.id)).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </optgroup>
          </select>
          {styleAdding ? (
            <span className="muted custom-style-hint">{u.styleLoading}</span>
          ) : styleError ? (
            <span className="custom-style-error">{styleError}</span>
          ) : (
            <span className="muted custom-style-hint">{u.stylePickHint}</span>
          )}
        </label>

        <label className="field">
          <span>{t(locale, "sortPublications")}</span>
          <select
            value={cv.display.publicationOrder}
            onChange={(e) =>
              onChange(
                updateDisplay(cv, {
                  publicationOrder: e.target.value as CanonicalCv["display"]["publicationOrder"],
                }),
              )
            }
            aria-label={t(locale, "sortPublications")}
          >
            <option value="custom">{t(locale, "sortCustom")}</option>
            <option value="year-desc">{t(locale, "sortYearDesc")}</option>
            <option value="year-asc">{t(locale, "sortYearAsc")}</option>
            <option value="citations">{t(locale, "sortCitations")}</option>
          </select>
          {cv.display.publicationOrder === "citations" ? (
            <span className="field-hint muted">{t(locale, "sortCitationsNote")}</span>
          ) : null}
        </label>

        <label className="field">
          <span>{t(locale, "pubLimit")}</span>
          <input
            type="number"
            min={0}
            max={500}
            value={cv.display.publicationsLimit ?? 0}
            onChange={(e) => {
              const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
              onChange(
                updateDisplay(cv, {
                  publicationsLimit: n > 0 ? n : undefined,
                }),
              );
            }}
            aria-label={t(locale, "pubLimit")}
            title={t(locale, "pubLimitHint")}
          />
          <span className="field-hint muted">{t(locale, "pubLimitHint")}</span>
        </label>

        <label className="field">
          <span>{u.fontLabel}</span>
          <select
            value={cv.display.fontPairing}
            onChange={(e) =>
              onChange(
                updateDisplay(cv, {
                  fontPairing: e.target.value as CanonicalCv["display"]["fontPairing"],
                }),
              )
            }
          >
            {FONT_PAIRINGS.map((f) => (
              <option key={f} value={f}>
                {FONT_LABELS[f] ?? f}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{u.densityLabel}</span>
          <select
            value={cv.display.density}
            onChange={(e) =>
              onChange(
                updateDisplay(cv, {
                  density: e.target.value as CanonicalCv["display"]["density"],
                }),
              )
            }
          >
            {DENSITIES.map((d) => (
              <option key={d} value={d}>
                {DENSITY_LABELS[d] ?? d}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>{u.accentLabel}</span>
          <div className="accent-swatches">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${cv.display.accentColor === c ? " is-selected" : ""}`}
                style={{ background: c }}
                onClick={() => onChange(updateDisplay(cv, { accentColor: c }))}
                aria-label={`${u.accentLabel} ${c}`}
                title={c}
              />
            ))}
            <input
              type="color"
              className="swatch-custom"
              value={cv.display.accentColor}
              onChange={(e) => onChange(updateDisplay(cv, { accentColor: e.target.value }))}
              aria-label={u.customAccent}
              title={u.customAccent}
            />
          </div>
        </div>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.highlightSelf}
            onChange={(e) => onChange(updateDisplay(cv, { highlightSelf: e.target.checked }))}
          />
          <span>{u.highlightSelf}</span>
        </label>

        <label className="field">
          <span>{u.highlightStyleLabel}</span>
          <select
            value={cv.display.highlightStyle}
            disabled={!cv.display.highlightSelf}
            onChange={(e) =>
              onChange(
                updateDisplay(cv, {
                  highlightStyle: e.target.value as CanonicalCv["display"]["highlightStyle"],
                }),
              )
            }
          >
            {HIGHLIGHT_STYLES.map((h) => (
              <option key={h} value={h}>
                {HIGHLIGHT_STYLE_LABELS[h] ?? h}
              </option>
            ))}
          </select>
        </label>

        <h3 className="group-head">{eu.grpMetrics}</h3>

        <div className="field metric-picker">
          <span>{u.metricsLabel}</span>
          <div className="metric-options">
            {METRIC_DEFS.map((m) => {
              const selected = cv.display.metrics.includes(m.key);
              const values = (cv.owner.metrics ?? {}) as Record<string, number | undefined>;
              const raw = values[m.key];
              const value =
                typeof raw === "number" ? formatMetricValue(m.key, raw, cvLocale) : null;
              const note = value ? ` — ${value}` : ` ${u.metricNoData}`;
              return (
                <label key={m.key} className="field-inline">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const set = new Set(cv.display.metrics);
                      if (selected) set.delete(m.key);
                      else set.add(m.key);
                      const metrics = [...set];
                      onChange(
                        updateDisplay(cv, {
                          metrics,
                          showMetrics: metrics.length > 0,
                        }),
                      );
                    }}
                  />
                  <span>
                    {metricLabel(locale, m.key)}
                    {note}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="metric-preset">
            <button
              type="button"
              className="btn btn-small"
              onClick={() =>
                onChange(
                  updateDisplay(cv, {
                    metrics: ["2yr_mean_citedness", "fwci_mean"],
                    showMetrics: true,
                  }),
                )
              }
            >
              {u.metricsPreset}
            </button>
            <span className="muted metric-preset-note">
              <MetricsNoteText text={u.metricsPresetNote} />
            </span>
          </div>
        </div>

        <div className="field metric-picker">
          <span>{u.authorshipLabel}</span>
          <div className="metric-options">
            {AUTHORSHIP_ROLES.map((r) => {
              const selected = cv.display.authorshipRoles.includes(r);
              return (
                <label key={r} className="field-inline">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const set = new Set(cv.display.authorshipRoles);
                      if (selected) set.delete(r);
                      else set.add(r);
                      const roles = [...set];
                      onChange(
                        updateDisplay(cv, {
                          authorshipRoles: roles,
                          showAuthorshipTable: roles.length > 0,
                        }),
                      );
                    }}
                  />
                  <span>{authorshipRoleLabel(locale, r)}</span>
                </label>
              );
            })}
          </div>
          <span className="muted metric-preset-note">{u.authorshipNote}</span>
          {authorshipNeedsResync ? (
            <span className="metric-preset-note authorship-resync-note">
              {u.authorshipResyncNote}
            </span>
          ) : null}
        </div>

        <h3 className="group-head">{eu.grpDisplay}</h3>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showCharts}
            onChange={(e) => onChange(updateDisplay(cv, { showCharts: e.target.checked }))}
          />
          <span>{u.showCharts}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showOpenAccess}
            onChange={(e) => onChange(updateDisplay(cv, { showOpenAccess: e.target.checked }))}
          />
          <span>{u.showOpenAccess}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showAuthorRole}
            onChange={(e) => onChange(updateDisplay(cv, { showAuthorRole: e.target.checked }))}
          />
          <span>{u.showAuthorRole}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showCitationCounts}
            onChange={(e) => onChange(updateDisplay(cv, { showCitationCounts: e.target.checked }))}
          />
          <span>{u.showCitationCounts}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showProvenance}
            onChange={(e) => onChange(updateDisplay(cv, { showProvenance: e.target.checked }))}
          />
          <span>{u.showProvenance}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.peerReviewedOnly}
            onChange={(e) => onChange(updateDisplay(cv, { peerReviewedOnly: e.target.checked }))}
          />
          <span title={u.peerReviewedOnlyTitle}>{u.peerReviewedOnly}</span>
        </label>
        <p className="muted metric-preset-note field-note">{u.peerReviewedOnlyNote}</p>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.countLetters}
            onChange={(e) => onChange(updateDisplay(cv, { countLetters: e.target.checked }))}
          />
          <span title={u.countLettersTitle}>{u.countLetters}</span>
        </label>
        <p className="muted metric-preset-note field-note">{u.countLettersNote}</p>
      </fieldset>

      <p className="editor-hint">{t(locale, "editorHints")}</p>

      <Reorder.Group
        axis="y"
        as="div"
        className="sections-list"
        values={sections.map((s) => s.id)}
        onReorder={(ids) => onChange(reorderSections(cv, ids))}
      >
        {sections.map((section, si) => {
          const items = [...section.items].sort((a, b) => a.order - b.order);
          const shownCount = items.filter((i) => !isHidden(i)).length;
          // Pending (visible, unresolved) duplicate hints in this section.
          const dupCount = items.filter(
            (i) => i.meta.reviewFlag === "duplicate" && !isHidden(i),
          ).length;
          const isExpanded = expanded.has(section.id);
          return (
            <SectionCard key={section.id} value={section.id}>
              {(controls) => (
                <>
                  {/* The "add a publication by DOI" panel sits directly above the
                Publications section and moves with it when sections reorder. */}
                  {section.type === "publications" ? (
                    <ClaimByDoi locale={locale} onAdded={onClaimAdded} />
                  ) : null}
                  <div
                    className={`section-block${isExpanded ? " is-expanded" : " is-collapsed"}${
                      section.visible ? "" : " is-section-hidden"
                    }`}
                  >
                    <div className="section-head">
                      <span
                        className="drag-handle"
                        onPointerDown={(e) => controls.start(e)}
                        title={u.dragSection}
                        aria-hidden="true"
                      >
                        ⠿
                      </span>
                      <button
                        type="button"
                        className="section-toggle"
                        onClick={() => toggleExpanded(section.id)}
                        aria-expanded={isExpanded}
                        aria-label={t(locale, isExpanded ? "collapseSection" : "expandSection")}
                        title={t(locale, isExpanded ? "collapseSection" : "expandSection")}
                      >
                        {isExpanded ? "▾" : "▸"}
                      </button>
                      <input
                        className="section-title"
                        value={section.title}
                        onChange={(e) => onChange(renameSection(cv, section.id, e.target.value))}
                        aria-label={u.sectionTitleAria}
                      />
                      {isProseSectionType(section.type) ? null : (
                        <span className="section-count muted">
                          {shownCount}/{items.length} {u.shownSuffix}
                        </span>
                      )}
                      {dupCount > 0 ? (
                        <button
                          type="button"
                          className="section-dup-flag"
                          title={ds.summary.replace("{n}", String(dupCount))}
                          aria-label={ds.summary.replace("{n}", String(dupCount))}
                          onClick={() => {
                            if (!isExpanded) toggleExpanded(section.id);
                          }}
                        >
                          ⚠ {dupCount}
                        </button>
                      ) : null}
                      <label className="field-inline">
                        <input
                          type="checkbox"
                          checked={section.visible}
                          onChange={(e) =>
                            onChange(setSectionVisible(cv, section.id, e.target.checked))
                          }
                        />
                        <span>{t(locale, "show")}</span>
                      </label>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onChange(moveSection(cv, section.id, "up"))}
                        disabled={si === 0}
                        aria-label={u.moveSectionUp}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onChange(moveSection(cv, section.id, "down"))}
                        disabled={si === sections.length - 1}
                        aria-label={u.moveSectionDown}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onChange(removeSection(cv, section.id))}
                        aria-label={t(locale, "removeSection")}
                        title={t(locale, "removeSectionTitle")}
                      >
                        ×
                      </button>
                    </div>

                    {isExpanded && isProseSectionType(section.type) ? (
                      <label className="field prose-body-field">
                        <span className="muted">{eu.proseBody}</span>
                        <textarea
                          className="prose-body"
                          rows={6}
                          value={section.body ?? ""}
                          maxLength={PROSE_BODY_MAX}
                          aria-label={`${section.title} — ${eu.proseBody}`}
                          onChange={(e) =>
                            onChange(
                              setSectionBody(
                                cv,
                                section.id,
                                e.target.value.slice(0, PROSE_BODY_MAX),
                              ),
                            )
                          }
                        />
                        <span className="field-hint muted">
                          {eu.proseBodyHint} ·{" "}
                          {eu.proseCharsLeft.replace(
                            "{n}",
                            String(PROSE_BODY_MAX - (section.body ?? "").length),
                          )}
                        </span>
                      </label>
                    ) : isExpanded ? (
                      <>
                        {viewExcludedIds(cv.display, section.id).size > 0 ? (
                          <p className="view-selection-note muted">
                            {t(locale, "viewCount")
                              .replace(
                                "{n}",
                                String(
                                  items.filter(
                                    (it) =>
                                      it.included &&
                                      !it.notMine &&
                                      isItemShownInView(cv.display, section.id, it.id),
                                  ).length,
                                ),
                              )
                              .replace(
                                "{m}",
                                String(items.filter((it) => it.included && !it.notMine).length),
                              )}
                            {" · "}
                            <button
                              type="button"
                              className="linklike"
                              onClick={() => onChange(clearViewExclusions(cv, section.id))}
                            >
                              {t(locale, "viewShowAll")}
                            </button>
                          </p>
                        ) : null}
                        {items.length === 0 ? (
                          <p className="muted empty-note">{t(locale, "noItems")}</p>
                        ) : (
                          <ul className="cv-item-list">
                            {items.map((item, ii) => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                locale={locale}
                                sectionType={section.type}
                                isFirst={ii === 0}
                                isLast={ii === items.length - 1}
                                onToggleIncluded={() =>
                                  onChange(setItemIncluded(cv, section.id, item.id, !item.included))
                                }
                                onToggleNotMine={() =>
                                  onChange(
                                    setItemNotMine(cv, section.id, item.id, !item.notMine, {
                                      now: new Date().toISOString(),
                                    }),
                                  )
                                }
                                shownInView={isItemShownInView(cv.display, section.id, item.id)}
                                onToggleInView={() =>
                                  onChange(
                                    setItemInView(
                                      cv,
                                      section.id,
                                      item.id,
                                      !isItemShownInView(cv.display, section.id, item.id),
                                    ),
                                  )
                                }
                                onSetNotMineReason={(reason) =>
                                  onChange(
                                    setItemNotMine(cv, section.id, item.id, true, {
                                      reason,
                                      now: new Date().toISOString(),
                                    }),
                                  )
                                }
                                duplicateGroup={
                                  item.meta.duplicateOf
                                    ? dupGroups
                                        .get(item.meta.duplicateOf.groupId)
                                        ?.map((m) => ({
                                          item: m.item,
                                          sectionTitle: m.sectionTitle,
                                        }))
                                    : undefined
                                }
                                onKeepOnly={(keepId) => {
                                  const members = item.meta.duplicateOf
                                    ? (dupGroups.get(item.meta.duplicateOf.groupId) ?? [])
                                    : [];
                                  // Hide every OTHER member; clear the kept member's
                                  // badge so it resolves immediately. No dismissal:
                                  // the detector ignores the now-hidden members, so
                                  // the cluster won't re-form.
                                  let next = cv;
                                  for (const m of members) {
                                    if (m.item.id !== keepId) {
                                      next = setItemIncluded(next, m.sectionId, m.item.id, false);
                                    }
                                  }
                                  const keep = members.find((m) => m.item.id === keepId);
                                  if (keep) {
                                    next = clearDuplicateFlag(next, keep.sectionId, keep.item.id);
                                  }
                                  onChange(next);
                                }}
                                onKeepAll={() => {
                                  const members = item.meta.duplicateOf
                                    ? (dupGroups.get(item.meta.duplicateOf.groupId) ?? [])
                                    : [];
                                  onChange(
                                    dismissDuplicateGroup(
                                      cv,
                                      members.map((m) => m.item.id),
                                    ),
                                  );
                                }}
                                onMoveUp={() => onChange(moveItem(cv, section.id, item.id, "up"))}
                                onMoveDown={() =>
                                  onChange(moveItem(cv, section.id, item.id, "down"))
                                }
                                onDragStart={() =>
                                  setDragItem({ sectionId: section.id, itemId: item.id })
                                }
                                onDropOver={() => {
                                  if (dragItem && dragItem.sectionId === section.id) {
                                    onChange(moveItemTo(cv, section.id, dragItem.itemId, ii));
                                  }
                                  setDragItem(null);
                                }}
                                onUpdateText={(text) =>
                                  onChange(updateItemText(cv, section.id, item.id, text))
                                }
                                onRemove={() => onChange(removeItem(cv, section.id, item.id))}
                              />
                            ))}
                          </ul>
                        )}

                        {MANUAL_SECTIONS.has(section.type) ? (
                          <div className="add-entry-row">
                            <input
                              type="text"
                              value={drafts[section.type] ?? ""}
                              placeholder={
                                section.type === "grants"
                                  ? u.grantsPlaceholder
                                  : t(locale, "addEntryPlaceholder")
                              }
                              onChange={(e) =>
                                setDrafts((d) => ({ ...d, [section.type]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addEntry(section.type);
                                }
                              }}
                              aria-label={u.addEntryAria}
                            />
                            <button
                              type="button"
                              className="btn"
                              onClick={() => addEntry(section.type)}
                              disabled={!(drafts[section.type] ?? "").trim()}
                            >
                              {t(locale, "add")}
                            </button>
                          </div>
                        ) : null}

                        {STRUCTURED_SECTIONS.has(section.type) ? (
                          <details className="structured-entry">
                            <summary>{eu.structuredEntry}</summary>
                            <div className="structured-fields">
                              <label className="field">
                                <span>{eu.feTitle}</span>
                                <input
                                  type="text"
                                  value={structDrafts[section.type]?.title ?? ""}
                                  onChange={(e) =>
                                    setStructField(section.type, "title", e.target.value)
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>{eu.feAuthors}</span>
                                <textarea
                                  rows={2}
                                  value={structDrafts[section.type]?.authors ?? ""}
                                  placeholder={eu.feAuthorsHint}
                                  onChange={(e) =>
                                    setStructField(section.type, "authors", e.target.value)
                                  }
                                />
                                <span className="field-hint muted">{eu.feAuthorsHint}</span>
                              </label>
                              <div className="structured-row">
                                <label className="field">
                                  <span>{eu.feVenue}</span>
                                  <input
                                    type="text"
                                    value={structDrafts[section.type]?.venue ?? ""}
                                    onChange={(e) =>
                                      setStructField(section.type, "venue", e.target.value)
                                    }
                                  />
                                </label>
                                <label className="field structured-year">
                                  <span>{eu.feYear}</span>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={structDrafts[section.type]?.year ?? ""}
                                    onChange={(e) =>
                                      setStructField(section.type, "year", e.target.value)
                                    }
                                  />
                                </label>
                              </div>
                              <label className="field">
                                <span>{eu.feDoi}</span>
                                <input
                                  type="text"
                                  value={structDrafts[section.type]?.doi ?? ""}
                                  onChange={(e) =>
                                    setStructField(section.type, "doi", e.target.value)
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                className="btn"
                                onClick={() => addStructured(section.type)}
                                disabled={!structDrafts[section.type]?.title?.trim()}
                              >
                                {eu.feAdd}
                              </button>
                            </div>
                          </details>
                        ) : null}

                        {section.type === "languages" ? (
                          <div className="add-entry-row lang-row">
                            <input
                              type="text"
                              className="lang-name"
                              value={langDraft.lang}
                              placeholder={eu.langLabel}
                              aria-label={eu.langLabel}
                              onChange={(e) =>
                                setLangDraft((d) => ({ ...d, lang: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addLanguage();
                                }
                              }}
                            />
                            <select
                              value={langDraft.level}
                              aria-label={eu.langLevel}
                              onChange={(e) =>
                                setLangDraft((d) => ({ ...d, level: e.target.value }))
                              }
                            >
                              {CEFR_LEVELS.map((c) => (
                                <option key={c} value={`${c} (CEFR)`}>{`${c} (CEFR)`}</option>
                              ))}
                              <option value={eu.langNative}>{eu.langNative}</option>
                              <option value="__other__">{eu.langOther}</option>
                            </select>
                            {langDraft.level === "__other__" ? (
                              <input
                                type="text"
                                value={langDraft.other}
                                placeholder="TOEFL iBT 110"
                                aria-label={eu.langOther}
                                onChange={(e) =>
                                  setLangDraft((d) => ({ ...d, other: e.target.value }))
                                }
                              />
                            ) : null}
                            <button
                              type="button"
                              className="btn"
                              onClick={addLanguage}
                              disabled={!langDraft.lang.trim()}
                            >
                              {eu.feAdd}
                            </button>
                          </div>
                        ) : null}

                        {section.type === "references" ? (
                          <div className="structured-fields reference-fields">
                            <div className="structured-row">
                              <label className="field">
                                <span>{eu.refName}</span>
                                <input
                                  type="text"
                                  value={refDraft.name}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, name: e.target.value }))
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>{eu.refAffiliation}</span>
                                <input
                                  type="text"
                                  value={refDraft.affiliation}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, affiliation: e.target.value }))
                                  }
                                />
                              </label>
                            </div>
                            <div className="structured-row">
                              <label className="field">
                                <span>{eu.refEmail}</span>
                                <input
                                  type="email"
                                  value={refDraft.email}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, email: e.target.value }))
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>{eu.refPhone}</span>
                                <input
                                  type="tel"
                                  value={refDraft.phone}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, phone: e.target.value }))
                                  }
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              className="btn"
                              onClick={addReference}
                              disabled={!refDraft.name.trim()}
                            >
                              {eu.feAdd}
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </SectionCard>
          );
        })}
      </Reorder.Group>

      {ADDABLE_SECTIONS.some(isAddable) ? (
        <div className="add-section-row">
          <span className="muted add-section-label">{t(locale, "addSection")}:</span>
          {ADDABLE_SECTIONS.filter(isAddable).map((tp) => (
            <button
              key={tp}
              type="button"
              className="btn btn-sm"
              onClick={() => {
                onChange(addSection(cv, tp));
                // A single-instance type's id equals its type, so we can pre-
                // expand it; a recurring `statement` gets a generated id, so we
                // leave it collapsed (it appears at the bottom of the list).
                if (tp !== "statement") {
                  setExpanded((prev) => new Set(prev).add(tp));
                }
              }}
            >
              + {sectionTitle(locale, tp)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
