"use client";

import { useMemo, useState } from "react";
import {
  ACCENT_PRESETS,
  AUTHORSHIP_ROLES,
  DENSITIES,
  FONT_PAIRINGS,
  HIGHLIGHT_STYLES,
  TEMPLATES,
  type CanonicalCv,
  type CvSectionType,
  type CustomStyle,
} from "@/lib/canonical/schema";
import { isHidden } from "@/lib/canonical/schema";
import {
  addManualEntry,
  addSection,
  applyPreset,
  deletePreset,
  moveItem,
  moveItemTo,
  moveSection,
  moveSectionTo,
  orderedSections,
  removeItem,
  renameSection,
  savePreset,
  setItemIncluded,
  setItemNotMine,
  setLocale,
  setSectionVisible,
  updateDisplay,
  updateItemText,
} from "@/lib/canonical/curate";
import { METRIC_DEFS, formatMetricValue } from "@/lib/render/metrics";
import { authorshipRoleLabel, metricLabel } from "@/lib/i18n/render";
import { ui } from "@/lib/i18n/ui";
import { CSL_STYLE_CATALOG } from "@/lib/citeproc/styleCatalog";
import { LOCALE_LABELS, SUPPORTED_LOCALES, asLocale, sectionTitle, t } from "@/lib/i18n";
import ItemRow from "./ItemRow";
import ProfilePanel from "./ProfilePanel";

interface CvEditorProps {
  cv: CanonicalCv;
  availableStyles: string[];
  /** Interface language (independent of the CV's own rendered language). */
  uiLocale: string;
  onChange: (next: CanonicalCv) => void;
}

const STYLE_LABELS: Record<string, string> = {
  apa: "APA",
  ieee: "IEEE",
  "chicago-author-date": "Chicago (author–date)",
  nature: "Nature",
  "modern-language-association": "MLA",
  "american-medical-association": "AMA",
};

/** Section types a user can add manually (the rest are source-driven). */
const ADDABLE_SECTIONS: CvSectionType[] = [
  "positions",
  "education",
  "teaching",
  "supervision",
  "conference",
  "awards",
  "talks",
  "service",
  "skills",
  "datasets",
  "editorial",
  "grants",
  "other",
];

export default function CvEditor({
  cv,
  availableStyles,
  uiLocale,
  onChange,
}: CvEditorProps) {
  const sections = orderedSections(cv);
  const customStyle = cv.display.customStyle;
  // Editor chrome follows the INTERFACE language; the CV's own language is
  // cv.display.locale, edited via the "CV language" picker below.
  const locale = asLocale(uiLocale);
  const cvLocale = asLocale(cv.display.locale);
  const u = ui(locale);

  // Locale-aware option labels (built from the chrome dictionary).
  const TEMPLATE_LABELS: Record<string, string> = {
    classic: u.tplClassic,
    modern: u.tplModern,
    minimal: u.tplMinimal,
    compact: u.tplCompact,
    sidebar: u.tplSidebar,
    editorial: u.tplEditorial,
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
  // accessible fallback). Items reorder within their section; sections reorder
  // by dropping onto another section's header.
  const [dragSection, setDragSection] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  // Name buffer for saving the current view as a named preset.
  const [presetName, setPresetName] = useState("");
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

  const hasSection = (type: string): boolean =>
    cv.sections.some((s) => s.type === type);

  function newId(type: string): string {
    const rand =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const prefix = type === "positions" ? "position" : type;
    return `${prefix}:manual:${rand}`;
  }

  // Sections where a free-text "Add an entry" makes sense.
  const MANUAL_SECTIONS = new Set([
    "positions",
    "education",
    "awards",
    "service",
    "datasets",
    "editorial",
    "grants",
    "other",
  ]);

  function addEntry(type: CanonicalCv["sections"][number]["type"]) {
    const text = (drafts[type] ?? "").trim();
    if (!text) return;
    onChange(addManualEntry(cv, type, text, newId(type)));
    setDrafts((d) => ({ ...d, [type]: "" }));
  }

  // Dropdown options = bundled styles + the current custom style (if any).
  const styleOptions = useMemo(() => {
    const base = availableStyles.length ? availableStyles : [cv.display.cslStyle];
    const withCustom =
      customStyle && !base.includes(customStyle.id)
        ? [...base, customStyle.id]
        : base;
    return withCustom;
  }, [availableStyles, customStyle, cv.display.cslStyle]);

  const styleLabel = (s: string): string =>
    customStyle && s === customStyle.id
      ? customStyle.title
      : (STYLE_LABELS[s] ?? s);

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

        <label className="field">
          <span>{u.templateLabel}</span>
          <select
            value={cv.display.template}
            onChange={(e) =>
              onChange(
                updateDisplay(cv, {
                  template: e.target.value as CanonicalCv["display"]["template"],
                }),
              )
            }
          >
            {TEMPLATES.map((tpl) => (
              <option key={tpl} value={tpl}>
                {TEMPLATE_LABELS[tpl] ?? tpl}
              </option>
            ))}
          </select>
        </label>

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
              {CSL_STYLE_CATALOG.filter((s) => !styleOptions.includes(s.id)).map(
                (s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ),
              )}
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
                  publicationOrder: e.target
                    .value as CanonicalCv["display"]["publicationOrder"],
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
                  fontPairing:
                    e.target.value as CanonicalCv["display"]["fontPairing"],
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
                  density:
                    e.target.value as CanonicalCv["display"]["density"],
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
              onChange={(e) =>
                onChange(updateDisplay(cv, { accentColor: e.target.value }))
              }
              aria-label={u.customAccent}
              title={u.customAccent}
            />
          </div>
        </div>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.highlightSelf}
            onChange={(e) =>
              onChange(updateDisplay(cv, { highlightSelf: e.target.checked }))
            }
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
                  highlightStyle:
                    e.target.value as CanonicalCv["display"]["highlightStyle"],
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

        <div className="field metric-picker">
          <span>{u.metricsLabel}</span>
          <div className="metric-options">
            {METRIC_DEFS.map((m) => {
              const selected = cv.display.metrics.includes(m.key);
              const values = (cv.owner.metrics ?? {}) as Record<
                string,
                number | undefined
              >;
              const raw = values[m.key];
              const value =
                typeof raw === "number"
                  ? formatMetricValue(m.key, raw, cvLocale)
                  : null;
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
              {u.metricsPresetNote}
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

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showCharts}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showCharts: e.target.checked }))
            }
          />
          <span>{u.showCharts}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showOpenAccess}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showOpenAccess: e.target.checked }))
            }
          />
          <span>{u.showOpenAccess}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showAuthorRole}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showAuthorRole: e.target.checked }))
            }
          />
          <span>{u.showAuthorRole}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showProvenance}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showProvenance: e.target.checked }))
            }
          />
          <span>{u.showProvenance}</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.peerReviewedOnly}
            onChange={(e) =>
              onChange(updateDisplay(cv, { peerReviewedOnly: e.target.checked }))
            }
          />
          <span title={u.peerReviewedOnlyTitle}>{u.peerReviewedOnly}</span>
        </label>
        <p className="muted metric-preset-note">{u.peerReviewedOnlyNote}</p>
      </fieldset>

      <p className="editor-hint">{t(locale, "editorHints")}</p>

      {sections.map((section, si) => {
        const items = [...section.items].sort((a, b) => a.order - b.order);
        const shownCount = items.filter((i) => !isHidden(i)).length;
        const isExpanded = expanded.has(section.id);
        return (
          <div
            key={section.id}
            className={`section-block${isExpanded ? " is-expanded" : " is-collapsed"}${
              section.visible ? "" : " is-section-hidden"
            }`}
          >
            <div
              className="section-head"
              onDragOver={
                dragSection && dragSection !== section.id
                  ? (e) => e.preventDefault()
                  : undefined
              }
              onDrop={(e) => {
                if (dragSection && dragSection !== section.id) {
                  e.preventDefault();
                  onChange(moveSectionTo(cv, dragSection, si));
                }
                setDragSection(null);
              }}
            >
              <span
                className="drag-handle"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragSection(section.id);
                }}
                onDragEnd={() => setDragSection(null)}
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
                onChange={(e) =>
                  onChange(renameSection(cv, section.id, e.target.value))
                }
                aria-label={u.sectionTitleAria}
              />
              <span className="section-count muted">
                {shownCount}/{items.length} {u.shownSuffix}
              </span>
              <label className="field-inline">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) =>
                    onChange(
                      setSectionVisible(cv, section.id, e.target.checked),
                    )
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
            </div>

            {isExpanded ? (
              <>
            {items.length === 0 ? (
              <p className="muted empty-note">{t(locale, "noItems")}</p>
            ) : (
              <ul className="cv-item-list">
                {items.map((item, ii) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    locale={locale}
                    isFirst={ii === 0}
                    isLast={ii === items.length - 1}
                    onToggleIncluded={() =>
                      onChange(
                        setItemIncluded(
                          cv,
                          section.id,
                          item.id,
                          !item.included,
                        ),
                      )
                    }
                    onToggleNotMine={() =>
                      onChange(
                        setItemNotMine(cv, section.id, item.id, !item.notMine, {
                          now: new Date().toISOString(),
                        }),
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
                    onMoveUp={() =>
                      onChange(moveItem(cv, section.id, item.id, "up"))
                    }
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
                    onRemove={() =>
                      onChange(removeItem(cv, section.id, item.id))
                    }
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
              </>
            ) : null}
          </div>
        );
      })}

      {ADDABLE_SECTIONS.some((tp) => !hasSection(tp)) ? (
        <div className="add-section-row">
          <span className="muted add-section-label">{t(locale, "addSection")}:</span>
          {ADDABLE_SECTIONS.filter((tp) => !hasSection(tp)).map((tp) => (
            <button
              key={tp}
              type="button"
              className="btn btn-sm"
              onClick={() => {
                onChange(addSection(cv, tp));
                setExpanded((prev) => new Set(prev).add(tp));
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
