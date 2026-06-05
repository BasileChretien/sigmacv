"use client";

import {
  type CanonicalCv,
  type CvNarrativeModule,
  type NarrativeModuleKey,
} from "@/lib/canonical/schema";
import {
  removeNarrativeModule,
  reorderNarrative,
  savePreset,
  setNarrativeModuleIncluded,
  updateDisplay,
  upsertNarrativeModule,
} from "@/lib/canonical/curate";
import { defaultNarrativeModules, narrativeModuleStrings } from "@/lib/i18n/narrative";
import { asLocale, t } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";

/** Mirror of the schema cap on a narrative body (CvNarrativeModuleSchema.body). */
const NARRATIVE_BODY_MAX = 8000;

/** Name of the one-click starter preset; reused so re-applying upserts (no dupes). */
const NARRATIVE_PRESET_NAME = "Narrative CV";

/** "Selected publications" cap the starter layout applies (a few representative works). */
const NARRATIVE_PUB_LIMIT = 5;

interface NarrativeEditorProps {
  cv: CanonicalCv;
  /** Interface language (independent of the CV's own rendered language). */
  uiLocale: string;
  onChange: (next: CanonicalCv) => void;
}

/**
 * Seed every standard narrative module that's missing, preserving canonical order
 * (`upsertNarrativeModule` appends absent modules in call order, so iterating
 * `defaultNarrativeModules` keeps the funder-résumé sequence). Already-present
 * modules — including any the user edited — are untouched.
 */
function seedMissingModules(cv: CanonicalCv, locale: string): CanonicalCv {
  const present = new Set((cv.narrative ?? []).map((m) => m.key));
  return defaultNarrativeModules(locale).reduce(
    (acc, mod) => (present.has(mod.key) ? acc : upsertNarrativeModule(acc, mod.key)),
    cv,
  );
}

/**
 * The narrative-CV editor panel: write/curate funder-style résumé prose (the
 * `cv.narrative` modules) and a one-click "Narrative CV" starter layout.
 *
 * Mirrors the CvEditor section-panel pattern exactly: every mutation goes through
 * the pure, immutable `curate.ts` ops and is handed up via `onChange` (the parent
 * marks the doc dirty + re-renders the live preview, then the existing Save flow
 * persists the whole canonical object — narrative included — through `/api/cv`).
 */
export default function NarrativeEditor({ cv, uiLocale, onChange }: NarrativeEditorProps) {
  const locale = asLocale(uiLocale);
  const cvLocale = cv.display.locale;
  const eu = editorUi(locale);
  const modules: CvNarrativeModule[] = cv.narrative ?? [];

  // Apply the one-click "Narrative CV" starter layout: seed any missing modules,
  // save the *current* view as a restorable preset (so the user can switch back),
  // then set a narrative-first display — classic template, a trimmed "selected
  // publications" list, charts off. Reversible: it's only a preset + display change.
  function applyStarterLayout() {
    const withPreset = savePreset(cv, NARRATIVE_PRESET_NAME);
    const seeded = seedMissingModules(withPreset, cvLocale);
    onChange(
      updateDisplay(seeded, {
        template: "classic",
        publicationsLimit: NARRATIVE_PUB_LIMIT,
        showCharts: false,
      }),
    );
  }

  return (
    <fieldset className="display-controls narrative-editor">
      <legend>{eu.narrativeLegend}</legend>
      <p className="muted narrative-intro">{eu.narrativeIntro}</p>

      <div className="narrative-actions">
        {modules.length === 0 ? (
          <button
            type="button"
            className="btn"
            onClick={() => onChange(seedMissingModules(cv, cvLocale))}
          >
            {eu.narrativeAdd}
          </button>
        ) : null}
        <button type="button" className="btn btn-sm" onClick={applyStarterLayout}>
          {eu.narrativeStarter}
        </button>
        <span className="muted narrative-starter-note">{eu.narrativeStarterNote}</span>
      </div>

      {modules.map((mod, i) => {
        const guide = narrativeModuleStrings(cvLocale, mod.key as NarrativeModuleKey);
        const left = NARRATIVE_BODY_MAX - mod.body.length;
        return (
          <div
            key={mod.key}
            className={`section-block is-expanded narrative-module${
              mod.included ? "" : " is-section-hidden"
            }`}
          >
            <div className="section-head">
              <input
                className="section-title"
                value={mod.heading}
                placeholder={guide.heading}
                aria-label={eu.narrativeHeading}
                onChange={(e) =>
                  onChange(upsertNarrativeModule(cv, mod.key, { heading: e.target.value }))
                }
              />
              <label className="field-inline">
                <input
                  type="checkbox"
                  checked={mod.included}
                  onChange={(e) =>
                    onChange(setNarrativeModuleIncluded(cv, mod.key, e.target.checked))
                  }
                />
                <span>{t(locale, "show")}</span>
              </label>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange(reorderNarrative(cv, i, i - 1))}
                disabled={i === 0}
                aria-label={eu.narrativeMoveUp}
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onChange(reorderNarrative(cv, i, i + 1))}
                disabled={i === modules.length - 1}
                aria-label={eu.narrativeMoveDown}
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => onChange(removeNarrativeModule(cv, mod.key))}
                aria-label={eu.narrativeRemove}
                title={eu.narrativeRemove}
              >
                ×
              </button>
            </div>

            <label className="field narrative-body-field">
              <span className="muted">{eu.narrativeBody}</span>
              <textarea
                className="narrative-body"
                rows={5}
                value={mod.body}
                maxLength={NARRATIVE_BODY_MAX}
                placeholder={guide.prompt}
                aria-label={`${mod.heading || guide.heading} — ${eu.narrativeBody}`}
                onChange={(e) =>
                  onChange(
                    upsertNarrativeModule(cv, mod.key, {
                      body: e.target.value.slice(0, NARRATIVE_BODY_MAX),
                    }),
                  )
                }
              />
              <span className="field-hint muted">
                {eu.narrativeBodyHint} · {eu.narrativeCharsLeft.replace("{n}", String(left))}
              </span>
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
