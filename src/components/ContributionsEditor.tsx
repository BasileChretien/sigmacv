"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CONTRIBUTIONS_MAX,
  type CanonicalCv,
  type Contribution,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import {
  addContribution,
  blankContribution,
  contributionFromItem,
  contributionItem,
  contributionTitle,
  moveContribution,
  removeContribution,
  updateContribution,
} from "@/lib/canonical/contributions";
import { starterReferenceLine } from "@/lib/canonical/proseStarter";
import { editorUi } from "@/lib/i18n/editorUi";
import { proseStarterStrings } from "@/lib/i18n/proseStarter";
import { fill } from "@/lib/i18n/fill";
import EvidencePicker from "./EvidencePicker";

interface ContributionsEditorProps {
  cv: CanonicalCv;
  /** A contributions section (`narrative-knowledge`). */
  section: CvSection;
  /** Interface language (the field labels). */
  locale: string;
  onChange: (next: CanonicalCv) => void;
}

const AUDIENCES = ["A", "B", "C"] as const;
const CITED_MAX = 20;

/**
 * The structured contributions of a contributions section, as cards under its
 * prose box: each one shows the entry it stands for (title and reference, live
 * from the record) and lets the owner write the period, the audience, the role,
 * the impact and where the work is cited — and move or delete it. New cards come
 * from the picker ("Add one of my entries as a contribution"), prefilled with the
 * entry's year and the clinical guidelines that cite it, or blank for an
 * experience that is not an entry. The document operations are the pure ones in
 * `canonical/contributions.ts`; every export prints the same list.
 */
export default function ContributionsEditor({
  cv,
  section,
  locale,
  onChange,
}: ContributionsEditorProps) {
  const eu = editorUi(locale);
  const list = section.contributions ?? [];
  const rootRef = useRef<HTMLDivElement>(null);
  // After a card is added, its first field takes focus (role for an entry,
  // title for a blank contribution), so the owner types straight away.
  const [focusId, setFocusId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusId) return;
    const card = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>("[data-contribution]") ?? []),
    ].find((el) => el.dataset.contribution === focusId);
    const field = card?.querySelector<HTMLElement>("[data-focus-first]");
    field?.focus();
    field?.scrollIntoView?.({ block: "nearest" });
    setFocusId(null);
  }, [focusId, list.length]);

  const add = (c: Contribution) => {
    const next = addContribution(cv, section.id, c);
    if (next === cv) return;
    onChange(next);
    setFocusId(c.id);
  };
  const addItem = (itemId: string) => {
    const item = cv.sections.flatMap((x) => x.items).find((it) => it.id === itemId);
    if (item) add(contributionFromItem(list, item));
  };
  const patch = (id: string, p: Partial<Omit<Contribution, "id">>) =>
    onChange(updateContribution(cv, section.id, id, p));
  const full = list.length >= CONTRIBUTIONS_MAX;
  const picked = useMemo(
    () => new Set(list.map((c) => c.itemId).filter((x): x is string => Boolean(x))),
    [list],
  );

  return (
    <div className="contrib-editor" ref={rootRef}>
      {list.length > 0 ? (
        <ol className="contrib-list">
          {list.map((c, i) => (
            <ContributionCard
              key={c.id}
              cv={cv}
              contribution={c}
              index={i}
              count={list.length}
              locale={locale}
              onPatch={(p) => patch(c.id, p)}
              onMove={(dir) => onChange(moveContribution(cv, section.id, c.id, dir))}
              onRemove={() => onChange(removeContribution(cv, section.id, c.id))}
            />
          ))}
        </ol>
      ) : null}
      {full ? null : (
        <div className="contrib-add">
          <EvidencePicker
            cv={cv}
            sectionType={section.type}
            body=""
            locale={locale}
            variant="contribution"
            excludeIds={picked}
            onInsert={(_token, itemId) => addItem(itemId)}
          />
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => add(blankContribution(list))}
          >
            + {eu.contribAddBlank}
          </button>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  cv: CanonicalCv;
  contribution: Contribution;
  index: number;
  count: number;
  locale: string;
  onPatch: (p: Partial<Omit<Contribution, "id">>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function ContributionCard({
  cv,
  contribution: c,
  index,
  count,
  locale,
  onPatch,
  onMove,
  onRemove,
}: CardProps) {
  const eu = editorUi(locale);
  const s = proseStarterStrings(locale);
  const item: CvItem | undefined = contributionItem(cv, c);
  const missing = Boolean(c.itemId && !item);
  const title = contributionTitle(cv, c);
  const entryTitle = item ? contributionTitle(cv, { id: c.id, itemId: c.itemId }) : "";
  const reference = item ? starterReferenceLine(item) : "";
  const heading = fill(eu.contribCard, { n: String(index + 1) });
  const cited = c.citedIn ?? [];
  const audience = new Set(c.audience ?? []);
  const names = { A: s.audienceA, B: s.audienceB, C: s.audienceC } as const;
  const titleHintId = useId();

  return (
    <li
      className={`contrib-card${missing ? " is-missing" : ""}`}
      data-contribution={c.id}
      aria-label={title ? `${heading}: ${title}` : heading}
    >
      <div className="contrib-card-head">
        <span className="contrib-num" aria-hidden="true">
          {index + 1}
        </span>
        <div className="contrib-card-title">
          <span>{title || <span className="muted">{eu.contribTitleRequired}</span>}</span>
          {reference ? <span className="contrib-card-ref">{reference}</span> : null}
          {missing ? (
            <p className="contrib-warning" role="status">
              {eu.contribMissing}
            </p>
          ) : null}
        </div>
        <div className="contrib-card-actions">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            aria-label={`${eu.contribUp} — ${heading}`}
            title={eu.contribUp}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            aria-label={`${eu.contribDown} — ${heading}`}
            title={eu.contribDown}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-danger"
            aria-label={`${eu.contribRemove} — ${heading}`}
            title={eu.contribRemove}
            onClick={onRemove}
          >
            ✕
          </button>
        </div>
      </div>

      <label className="contrib-field">
        <span>{eu.contribTitle}</span>
        <input
          type="text"
          value={c.title ?? ""}
          maxLength={1000}
          placeholder={entryTitle || eu.contribTitleRequired}
          aria-describedby={item ? titleHintId : undefined}
          {...(item ? {} : { "data-focus-first": "" })}
          onChange={(e) => onPatch({ title: e.target.value })}
        />
        {item ? (
          <span id={titleHintId} className="field-hint muted">
            {eu.contribTitleHint}
          </span>
        ) : null}
      </label>

      <div className="contrib-grid">
        <label className="contrib-field">
          <span>{eu.contribPeriod}</span>
          <input
            type="text"
            value={c.period ?? ""}
            maxLength={100}
            placeholder={eu.contribPeriodPlaceholder}
            onChange={(e) => onPatch({ period: e.target.value })}
          />
        </label>
        <fieldset className="contrib-fieldset">
          <legend>{s.audience}</legend>
          <div className="contrib-audience">
            {AUDIENCES.map((a) => (
              <label key={a}>
                <input
                  type="checkbox"
                  checked={audience.has(a)}
                  onChange={(e) => {
                    const next = new Set(audience);
                    if (e.target.checked) next.add(a);
                    else next.delete(a);
                    onPatch({ audience: [...next] });
                  }}
                />
                <span>
                  <strong>{a}</strong> {names[a]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="contrib-field">
        <span>{s.role}</span>
        <textarea
          rows={2}
          value={c.role ?? ""}
          maxLength={3000}
          {...(item ? { "data-focus-first": "" } : {})}
          onChange={(e) => onPatch({ role: e.target.value })}
        />
      </label>
      <label className="contrib-field">
        <span>{s.impact}</span>
        <textarea
          rows={3}
          value={c.impact ?? ""}
          maxLength={3000}
          onChange={(e) => onPatch({ impact: e.target.value })}
        />
      </label>

      <fieldset className="contrib-fieldset">
        <legend>{s.citedIn}</legend>
        {cited.map((line, j) => (
          <div className="contrib-cited-row" key={j}>
            <input
              type="text"
              value={line.text}
              maxLength={600}
              aria-label={`${eu.contribCitedText} ${j + 1}`}
              placeholder={eu.contribCitedText}
              onChange={(e) =>
                onPatch({
                  citedIn: cited.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)),
                })
              }
            />
            <input
              type="url"
              value={line.url ?? ""}
              maxLength={2048}
              aria-label={`${eu.contribCitedUrl} ${j + 1}`}
              placeholder={eu.contribCitedUrl}
              onChange={(e) =>
                onPatch({
                  citedIn: cited.map((x, k) =>
                    k === j
                      ? e.target.value
                        ? { ...x, url: e.target.value }
                        : { text: x.text }
                      : x,
                  ),
                })
              }
            />
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              aria-label={`${eu.contribRemoveCited} ${j + 1}`}
              title={eu.contribRemoveCited}
              onClick={() => onPatch({ citedIn: cited.filter((_, k) => k !== j) })}
            >
              ✕
            </button>
          </div>
        ))}
        {cited.length < CITED_MAX ? (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => onPatch({ citedIn: [...cited, { text: "" }] })}
          >
            + {eu.contribAddCited}
          </button>
        ) : null}
      </fieldset>
    </li>
  );
}
