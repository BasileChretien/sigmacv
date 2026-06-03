"use client";

import { useMemo, useState } from "react";
import {
  ACCENT_PRESETS,
  AUTHORSHIP_ROLE_LABELS,
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
  moveItem,
  moveItemTo,
  moveSection,
  moveSectionTo,
  orderedSections,
  removeItem,
  renameSection,
  setItemIncluded,
  setItemNotMine,
  setLocale,
  setSectionVisible,
  updateDisplay,
  updateItemText,
} from "@/lib/canonical/curate";
import { METRIC_DEFS, formatMetricValue } from "@/lib/render/metrics";
import { CSL_STYLE_CATALOG } from "@/lib/citeproc/styleCatalog";
import { LOCALE_LABELS, SUPPORTED_LOCALES, asLocale, sectionTitle, t } from "@/lib/i18n";
import ItemRow from "./ItemRow";
import ProfilePanel from "./ProfilePanel";

interface CvEditorProps {
  cv: CanonicalCv;
  availableStyles: string[];
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

const HIGHLIGHT_STYLE_LABELS: Record<string, string> = {
  accent: "Accent colour",
  bold: "Bold",
  underline: "Underline",
  "accent-underline": "Accent + underline",
};

const TEMPLATE_LABELS: Record<string, string> = {
  classic: "Classic",
  modern: "Modern",
  minimal: "Minimal",
  compact: "Compact",
  sidebar: "Sidebar (photo)",
  editorial: "Editorial",
  ats: "ATS-friendly",
  rirekisho: "Japanese (履歴書)",
};
const FONT_LABELS: Record<string, string> = {
  serif: "Serif",
  sans: "Sans",
  palatino: "Palatino",
};
const DENSITY_LABELS: Record<string, string> = {
  comfortable: "Comfortable",
  compact: "Compact",
};

/** Section types a user can add manually (the rest are source-driven). */
const ADDABLE_SECTIONS: CvSectionType[] = [
  "positions",
  "education",
  "awards",
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
  onChange,
}: CvEditorProps) {
  const sections = orderedSections(cv);
  const customStyle = cv.display.customStyle;
  const locale = asLocale(cv.display.locale);

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
        setStyleError(("error" in data && data.error) || "Could not load that style.");
        return;
      }
      onChange(
        updateDisplay(cv, {
          cslStyle: data.id,
          customStyle: { id: data.id, title: data.title, xml: data.xml },
        }),
      );
    } catch {
      setStyleError("Network error — please try again.");
    } finally {
      setStyleAdding(false);
    }
  }

  return (
    <div className="cv-editor">
      <ProfilePanel cv={cv} locale={locale} onChange={onChange} />

      <fieldset className="display-controls">
        <legend>Style</legend>
        <label className="field">
          <span>Template</span>
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
          <span>{t(locale, "language")}</span>
          <select
            value={locale}
            onChange={(e) => onChange(setLocale(cv, e.target.value))}
            aria-label={t(locale, "language")}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </option>
            ))}
          </select>
        </label>

        <label className="field custom-style">
          <span>Citation style</span>
          <select
            value={cv.display.cslStyle}
            disabled={styleAdding}
            aria-label="Citation style"
            onChange={(e) => {
              const v = e.target.value;
              if (styleOptions.includes(v)) {
                onChange(updateDisplay(cv, { cslStyle: v }));
              } else {
                void resolveAndApplyStyle(v); // a catalog style → resolve + apply
              }
            }}
          >
            <optgroup label="Your styles">
              {styleOptions.map((s) => (
                <option key={s} value={s}>
                  {styleLabel(s)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Journal & society styles">
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
            <span className="muted custom-style-hint">Loading style…</span>
          ) : styleError ? (
            <span className="custom-style-error">{styleError}</span>
          ) : (
            <span className="muted custom-style-hint">
              Pick any journal style — applied to every citation.
            </span>
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
          <span>Font</span>
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
          <span>Density</span>
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
          <span>Accent</span>
          <div className="accent-swatches">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${cv.display.accentColor === c ? " is-selected" : ""}`}
                style={{ background: c }}
                onClick={() => onChange(updateDisplay(cv, { accentColor: c }))}
                aria-label={`Accent ${c}`}
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
              aria-label="Custom accent colour"
              title="Custom accent colour"
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
          <span>Highlight my name</span>
        </label>

        <label className="field">
          <span>Highlight style</span>
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
          <span>Metrics (optional — none by default)</span>
          <div className="metric-options">
            {METRIC_DEFS.map((m) => {
              const selected = cv.display.metrics.includes(m.key);
              const values = (cv.owner.metrics ?? {}) as Record<
                string,
                number | undefined
              >;
              const raw = values[m.key];
              const value =
                typeof raw === "number" ? formatMetricValue(m.key, raw) : null;
              const note = value ? ` — ${value}` : " (no data)";
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
                    {m.label}
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
                    metrics: ["2yr_mean_citedness", "fwci_mean", "top10pct_share"],
                    showMetrics: true,
                  }),
                )
              }
            >
              Responsible-metrics preset
            </button>
            <span className="muted metric-preset-note">
              Field-normalised indicators only (DORA / Leiden) — avoids
              journal-level proxies like the Impact Factor.
            </span>
          </div>
        </div>

        <div className="field metric-picker">
          <span>Authorship summary table (peer-reviewed only)</span>
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
                  <span>{AUTHORSHIP_ROLE_LABELS[r]}</span>
                </label>
              );
            })}
          </div>
          <span className="muted metric-preset-note">
            Adds a table counting how often you are first / last /
            corresponding author, etc. Pre-prints are not counted.
          </span>
          {authorshipNeedsResync ? (
            <span className="metric-preset-note authorship-resync-note">
              ⚠ These counts are empty for your existing publications. Click{" "}
              <strong>Re-sync</strong> (top right) to pull author positions from
              OpenAlex.
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
          <span>Show charts (publications &amp; citations / year)</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showOpenAccess}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showOpenAccess: e.target.checked }))
            }
          />
          <span>Open-access badges</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showAuthorRole}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showAuthorRole: e.target.checked }))
            }
          />
          <span>Show my author role (first / last / corresponding)</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.showProvenance}
            onChange={(e) =>
              onChange(updateDisplay(cv, { showProvenance: e.target.checked }))
            }
          />
          <span>Data-provenance footer</span>
        </label>

        <label className="field-inline">
          <input
            type="checkbox"
            checked={cv.display.peerReviewedOnly}
            onChange={(e) =>
              onChange(updateDisplay(cv, { peerReviewedOnly: e.target.checked }))
            }
          />
          <span title="Removes ALL non-peer-reviewed works from the CV, including your entire Preprints section. Leave this OFF to keep preprints listed (in their own section).">
            Hide preprints &amp; non-peer-reviewed work
          </span>
        </label>
        <p className="muted metric-preset-note">
          By default, preprints are kept but listed in a separate “Preprints”
          section. Turn this on only if you want them gone entirely.
        </p>
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
                title="Drag to reorder section"
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
                aria-label="Section title"
              />
              <span className="section-count muted">
                {shownCount}/{items.length} shown
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
                <span>Show</span>
              </label>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange(moveSection(cv, section.id, "up"))}
                disabled={si === 0}
                aria-label="Move section up"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange(moveSection(cv, section.id, "down"))}
                disabled={si === sections.length - 1}
                aria-label="Move section down"
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
                      ? "Add a grant, e.g. ANR JCJC, €250k (2024–2027)"
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
                  aria-label={`Add a ${section.type} entry`}
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
