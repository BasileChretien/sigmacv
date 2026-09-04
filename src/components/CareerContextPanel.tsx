"use client";

import {
  CAREER_CONTEXT_KINDS,
  CAREER_CONTEXT_MAX_ENTRIES,
  CAREER_CONTEXT_NOTE_MAX,
  type CanonicalCv,
  type CareerContextEntry,
  type CareerContextKind,
} from "@/lib/canonical/schema";
import {
  addCareerContextEntry,
  removeCareerContextEntry,
  setFirstPublicationYear,
  setShowFirstPublicationYear,
  updateCareerContextEntry,
  updateDisplay,
} from "@/lib/canonical/curate";
import { t, type Locale } from "@/lib/i18n";
import { renderStrings, type RenderStrings } from "@/lib/i18n/render";

interface CareerContextPanelProps {
  cv: CanonicalCv;
  locale: Locale;
  onChange: (next: CanonicalCv) => void;
}

/** The render-side kind labels double as the editor's select options. */
const KIND_LABEL_KEY: Record<CareerContextKind, keyof RenderStrings> = {
  "career-break": "careerKindCareerBreak",
  "part-time": "careerKindPartTime",
  "clinical-duties": "careerKindClinicalDuties",
  caring: "careerKindCaring",
  military: "careerKindMilitary",
  other: "careerKindOther",
};

/** A year input value ("2019") → the schema's "YYYY" string, or undefined when blank / not a year. */
function yearString(raw: string): string | undefined {
  const v = raw.trim();
  return /^\d{4}$/.test(v) ? v : undefined;
}

/**
 * Owner-declared career context (career breaks, part-time periods, clinical or
 * caring duties, service, first-publication year). Self-declared, opt-in, shown
 * on the CV as plain context lines ONLY when "Show career context on the CV" is
 * on — and never used by SigmaCV to adjust or normalise any figure (the note
 * under the title says so to the owner; `render/careerContext.ts` enforces it).
 */
export default function CareerContextPanel({ cv, locale, onChange }: CareerContextPanelProps) {
  const ctx = cv.owner.careerContext;
  const entries = ctx?.entries ?? [];
  const rs = renderStrings(locale);
  const full = entries.length >= CAREER_CONTEXT_MAX_ENTRIES;
  const detected = ctx?.firstPublicationYear;

  const patch = (id: string, p: Partial<Omit<CareerContextEntry, "id">>) =>
    onChange(updateCareerContextEntry(cv, id, p));

  return (
    <div className="field career-context">
      <span>{t(locale, "careerContextTitle")}</span>
      <p className="field-hint">{t(locale, "careerContextHint")}</p>

      <label className="field-inline">
        <input
          type="checkbox"
          checked={cv.display.showCareerContext}
          onChange={(e) => onChange(updateDisplay(cv, { showCareerContext: e.target.checked }))}
        />
        <span>{t(locale, "careerContextShow")}</span>
      </label>

      {entries.length === 0 ? (
        <span className="muted career-context-empty">{t(locale, "careerContextEmpty")}</span>
      ) : null}
      {entries.map((e) => (
        <div key={e.id} className="career-context-row">
          <select
            value={e.kind}
            aria-label={t(locale, "careerContextKind")}
            onChange={(ev) => patch(e.id, { kind: ev.target.value as CareerContextKind })}
          >
            {CAREER_CONTEXT_KINDS.map((k) => (
              <option key={k} value={k}>
                {rs[KIND_LABEL_KEY[k]]}
              </option>
            ))}
          </select>
          {/* The year fields are UNCONTROLLED (defaultValue) so a year can be typed
              digit by digit: a partial value stays in the box and is committed the
              moment it is a 4-digit year (the schema requires a valid start). */}
          <input
            type="number"
            className="career-context-year"
            inputMode="numeric"
            min={1900}
            max={2100}
            defaultValue={e.start}
            placeholder={t(locale, "careerContextStart")}
            aria-label={t(locale, "careerContextStart")}
            onChange={(ev) => {
              const y = yearString(ev.target.value);
              if (y) patch(e.id, { start: y });
            }}
          />
          <input
            type="number"
            className="career-context-year"
            inputMode="numeric"
            min={1900}
            max={2100}
            defaultValue={e.end ?? ""}
            placeholder={t(locale, "careerContextEnd")}
            aria-label={t(locale, "careerContextEnd")}
            title={t(locale, "careerContextEndHint")}
            onChange={(ev) => {
              const raw = ev.target.value.trim();
              const y = yearString(raw);
              if (raw === "" || y) patch(e.id, { end: y });
            }}
          />
          {e.kind === "part-time" ? (
            <input
              type="number"
              className="career-context-year"
              inputMode="numeric"
              min={0}
              max={100}
              step={5}
              value={typeof e.fraction === "number" ? Math.round(e.fraction * 100) : ""}
              placeholder={t(locale, "careerContextFraction")}
              aria-label={t(locale, "careerContextFraction")}
              onChange={(ev) => {
                const pct = Number(ev.target.value);
                patch(e.id, {
                  fraction: ev.target.value === "" || !Number.isFinite(pct) ? undefined : pct / 100,
                });
              }}
            />
          ) : null}
          <input
            type="text"
            className="career-context-note"
            maxLength={CAREER_CONTEXT_NOTE_MAX}
            value={e.note ?? ""}
            placeholder={t(locale, "careerContextNote")}
            aria-label={t(locale, "careerContextNote")}
            onChange={(ev) => patch(e.id, { note: ev.target.value })}
          />
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onChange(removeCareerContextEntry(cv, e.id))}
            aria-label={t(locale, "careerContextRemove")}
          >
            {t(locale, "careerContextRemove")}
          </button>
        </div>
      ))}
      <div className="career-context-actions">
        <button
          type="button"
          className="btn btn-sm"
          disabled={full}
          onClick={() =>
            onChange(
              addCareerContextEntry(cv, {
                kind: "career-break",
                start: String(new Date().getUTCFullYear()),
              }),
            )
          }
        >
          {t(locale, "careerContextAdd")}
        </button>
        {full ? (
          <span className="muted">
            {t(locale, "careerContextFull").replace("{n}", String(CAREER_CONTEXT_MAX_ENTRIES))}
          </span>
        ) : null}
      </div>

      <div className="career-context-firstpub">
        <label className="field">
          <span>{t(locale, "careerContextFirstPub")}</span>
          <input
            type="number"
            className="career-context-year"
            inputMode="numeric"
            min={1000}
            max={3000}
            defaultValue={ctx?.firstPublicationYearOverride ?? ""}
            placeholder={detected !== undefined ? String(detected) : ""}
            aria-label={t(locale, "careerContextFirstPub")}
            onChange={(ev) => {
              const raw = ev.target.value.trim();
              const y = yearString(raw);
              // Blank clears the override; a partial year waits until it is one.
              if (raw === "" || y) onChange(setFirstPublicationYear(cv, y ? Number(y) : undefined));
            }}
          />
          <span className="muted">
            {detected !== undefined
              ? t(locale, "careerContextFirstPubDetected").replace("{year}", String(detected))
              : t(locale, "careerContextFirstPubNone")}
          </span>
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={ctx?.showFirstPublicationYear ?? false}
            onChange={(e) => onChange(setShowFirstPublicationYear(cv, e.target.checked))}
          />
          <span>{t(locale, "careerContextShowFirstPub")}</span>
        </label>
      </div>
    </div>
  );
}
