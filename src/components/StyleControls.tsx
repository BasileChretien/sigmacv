"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ACCENT_PRESETS,
  AUTHORSHIP_ROLES,
  DENSITIES,
  FONT_PAIRINGS,
  HIGHLIGHT_STYLES,
  PUBLIC_STYLES,
  TEMPLATES,
  type CanonicalCv,
  type CustomStyle,
} from "@/lib/canonical/schema";
import {
  applyPreset,
  deletePreset,
  savePreset,
  setLocale,
  updateDisplay,
} from "@/lib/canonical/curate";
import {
  applyCvModel,
  cvModelsByCategory,
  resetCvSections,
  type CvModelCategory,
} from "@/lib/canonical/cvModels";
import { METRIC_DEFS, curatedMetrics, formatMetricValue } from "@/lib/render/metrics";
import { authorshipRoleLabel, metricLabel } from "@/lib/i18n/render";
import { FIELD_NORMALIZED_METRICS, metricHint } from "@/lib/i18n/metricHints";
import { ui } from "@/lib/i18n/ui";
import { editorUi } from "@/lib/i18n/editorUi";
import { trackEvent } from "@/lib/analytics/track";
import { CSL_STYLE_CATALOG } from "@/lib/citeproc/styleCatalog";
import { LOCALE_LABELS, SUPPORTED_LOCALES, asLocale, t, type Locale } from "@/lib/i18n";

interface StyleControlsProps {
  cv: CanonicalCv;
  availableStyles: string[];
  /** Interface language (independent of the CV's own rendered language). */
  locale: Locale;
  onChange: (next: CanonicalCv) => void;
  /**
   * When true, the panel's internal sub-headings (Presets / Template / Metrics /
   * Display) render as collapsible `<details>` groups in a single column —
   * used by the subdivided "regions" editor layout. Default `false` reproduces
   * the original flat two-column fieldset exactly (same DOM, same classes).
   */
  grouped?: boolean;
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
 * One sub-section of the style panel. In the default (flat) layout it renders a
 * `group-head` `<h3>` followed by its fields as direct grid children (a React
 * Fragment adds no DOM node, so the two-column grid is preserved exactly). In
 * `grouped` mode it becomes a collapsible `<details>` block — the building block
 * of the subdivided "Design" region.
 */
function StyleGroup({
  grouped,
  title,
  headInClassic = true,
  defaultOpen = true,
  onToggle,
  children,
}: {
  grouped: boolean;
  title: string;
  /** Suppress the flat `group-head` for a group that has none today (Presets). */
  headInClassic?: boolean;
  /** Initial open state in `grouped` mode (rarely-touched groups start closed). */
  defaultOpen?: boolean;
  /** Fired (grouped mode only) when the `<details>` opens/closes — lets a group
   *  lazily load heavy content (the public-style thumbnails) on first open. */
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  if (grouped) {
    return (
      <details
        className="cv-style-group"
        open={defaultOpen}
        onToggle={(e) => onToggle?.((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cv-style-group-head">{title}</summary>
        <div className="cv-style-group-body">{children}</div>
      </details>
    );
  }
  return (
    <>
      {headInClassic ? <h3 className="group-head">{title}</h3> : null}
      {children}
    </>
  );
}

export default function StyleControls({
  cv,
  availableStyles,
  locale,
  onChange,
  grouped = false,
}: StyleControlsProps) {
  const customStyle = cv.display.customStyle;
  const cvLocale = asLocale(cv.display.locale);
  const u = ui(locale);
  const eu = editorUi(locale);

  // Metric values for the picker's per-row preview. Use the SAME curated figures
  // the CV actually renders (curatedMetrics), not the raw owner.metrics: the
  // field-normalized means recomputed over the curated works — FWCI mean, top-10%
  // share and especially the NIH iCite RCR mean — are NOT stored on owner.metrics
  // (RCR has no author-level source at all), so reading owner.metrics directly
  // made RCR always read "(no data)" even when the rendered CV showed a value.
  const metricValues = curatedMetrics(cv) as Record<string, number | undefined>;

  // Locale-aware option labels (built from the chrome dictionary).
  const TEMPLATE_LABELS: Record<string, string> = {
    classic: u.tplClassic,
    modern: u.tplModern,
    sidebar: u.tplSidebar,
    ats: u.tplAts,
    rirekisho: "Japanese (履歴書)",
  };
  // Public-page showcase styles. "match" is localized ("Match my document"); the
  // animated styles are proper names, shown as-is (like the CV-model names).
  const PUBLIC_STYLE_LABELS: Record<string, string> = {
    match: eu.publicStyleMatch,
    prism: "Prism",
    pop: "Pop",
    neon: "Neon",
    synthwave: "Synthwave",
    terminal: "Terminal",
    riso: "Riso",
    aura: "Aura",
    mesh: "Mesh",
    marquee: "Marquee",
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

  // Real template thumbnails: render the user's own (trimmed) CV in every
  // template and show each scaled in the gallery. Fetched once and whenever the
  // *look* (accent/font/highlight/language) changes — not on every content edit,
  // so typing doesn't hammer the renderer.
  const [tplPreviews, setTplPreviews] = useState<Record<string, string>>({});
  // Public-page-style thumbnails — fetched lazily, only once the "Public page
  // style" group is opened (in classic/ungrouped mode it's always considered
  // open). Keyed on the same visual choices as the template gallery.
  const [stylePreviews, setStylePreviews] = useState<Record<string, string>>({});
  const [stylesOpen, setStylesOpen] = useState(!grouped);
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

  // Public-page-style thumbnails — fetched only after the group is opened, so a
  // user who never opens it pays nothing (each call renders 10 styles).
  useEffect(() => {
    if (!stylesOpen) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/cv/preview/styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document: cv }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { stylePreviews?: { style: string; html: string }[] };
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const p of data.stylePreviews ?? []) map[p.style] = p.html;
        setStylePreviews(map);
      } catch {
        /* thumbnails are best-effort — the in-pane "Public page" preview is the source of truth */
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylesOpen, accentColor, fontPairing, highlightStyle, styleLocale]);

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
    <fieldset className={`display-controls${grouped ? " display-controls--grouped" : ""}`}>
      <legend>{u.styleLegend}</legend>

      <StyleGroup grouped={grouped} title={eu.grpPresets} headInClassic={false}>
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
      </StyleGroup>

      <StyleGroup grouped={grouped} title={eu.grpTemplate}>
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
                  onClick={() => {
                    // Cookieless product signal: which template (only on change).
                    if (!selected) trackEvent("Template", { template: tpl });
                    onChange(
                      updateDisplay(cv, {
                        template: tpl as CanonicalCv["display"]["template"],
                      }),
                    );
                  }}
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
      </StyleGroup>

      <StyleGroup
        grouped={grouped}
        title={eu.grpPublicStyle}
        defaultOpen={false}
        onToggle={setStylesOpen}
      >
        <p className="muted metric-preset-note field-note">{eu.publicStyleNote}</p>
        <div className="field template-field">
          <div className="template-gallery" role="radiogroup" aria-label={eu.grpPublicStyle}>
            {PUBLIC_STYLES.map((style) => {
              const selected = (cv.display.publicStyle ?? "match") === style;
              const label = PUBLIC_STYLE_LABELS[style] ?? style;
              return (
                <button
                  key={style}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`tpl-card${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    if (!selected) trackEvent("PublicStyle", { style });
                    onChange(
                      updateDisplay(cv, {
                        publicStyle: style as CanonicalCv["display"]["publicStyle"],
                      }),
                    );
                  }}
                  title={style === "match" ? eu.publicStyleMatchHint : label}
                >
                  <span className="tpl-preview">
                    {stylePreviews[style] ? (
                      <iframe
                        className="tpl-frame"
                        srcDoc={stylePreviews[style]}
                        title={label}
                        sandbox=""
                        scrolling="no"
                        tabIndex={-1}
                        aria-hidden="true"
                        loading="lazy"
                      />
                    ) : (
                      <span className="tpl-skeleton" aria-hidden="true" />
                    )}
                    {style !== "match" ? (
                      <span className="tpl-badge">{eu.publicStyleAnimated}</span>
                    ) : null}
                  </span>
                  <span className="tpl-name">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </StyleGroup>

      <StyleGroup grouped={grouped} title={eu.grpMetrics} defaultOpen={false}>
        <div className="field metric-picker">
          <span>{u.metricsLabel}</span>
          <div className="metric-options">
            {METRIC_DEFS.map((m) => {
              const selected = cv.display.metrics.includes(m.key);
              const raw = metricValues[m.key];
              const value =
                typeof raw === "number" ? formatMetricValue(m.key, raw, cvLocale) : null;
              const note = value ? ` — ${value}` : ` ${u.metricNoData}`;
              return (
                <label key={m.key} className="field-inline" title={metricHint(locale, m.key)}>
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
                    // Exactly the field-normalized indicators (DORA / Leiden), in
                    // catalog order — derived from the single source of truth so it
                    // matches the note's "field-normalised only" promise and can't
                    // drift. Deliberately excludes raw / IF-like measures (e.g. the
                    // 2-year mean citedness). RCR only renders where there's data.
                    metrics: METRIC_DEFS.filter((d) => FIELD_NORMALIZED_METRICS.has(d.key)).map(
                      (d) => d.key,
                    ),
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
      </StyleGroup>

      <StyleGroup grouped={grouped} title={eu.grpDisplay} defaultOpen={false}>
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
            checked={cv.display.hideRetracted}
            onChange={(e) => onChange(updateDisplay(cv, { hideRetracted: e.target.checked }))}
          />
          <span>{u.hideRetracted}</span>
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
      </StyleGroup>
    </fieldset>
  );
}
