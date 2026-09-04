"use client";

import { useMemo, useState } from "react";
import type { CanonicalCv, CvSectionType } from "@/lib/canonical/schema";
import { evidenceCandidates, resolveEvidenceRefs } from "@/lib/canonical/evidenceRefs";
import { editorUi } from "@/lib/i18n/editorUi";
import Popover from "./Popover";

interface EvidencePickerProps {
  cv: CanonicalCv;
  /** The prose section being written (decides which entries are offered). */
  sectionType: CvSectionType;
  /** Its current body — the linked / unresolved summary is derived from it. */
  body: string;
  locale: string;
  /** Insert a `[[id]]` token into the body (the parent owns the text box + caret). */
  onInsert: (token: string) => void;
}

/** How many candidates the list shows at once (search narrows it). */
const MAX_SHOWN = 50;

/**
 * The "Insert evidence" control under a prose section: a searchable popover of
 * the entries that support this module (publications / datasets for
 * "contributions to knowledge", supervision / teaching for "individuals", … —
 * every listed entry for a free statement), inserting the chosen entry's
 * `[[id]]` reference at the caret. Below it, what the body links to right now
 * (one chip per linked entry) and how many references no longer resolve — the
 * same resolution every export uses (`canonical/evidenceRefs.ts`), so the writer
 * sees exactly what a reviewer will get.
 */
export default function EvidencePicker({
  cv,
  sectionType,
  body,
  locale,
  onInsert,
}: EvidencePickerProps) {
  const eu = editorUi(locale);
  const [query, setQuery] = useState("");
  const candidates = useMemo(() => evidenceCandidates(cv, sectionType), [cv, sectionType]);
  const status = useMemo(() => {
    const linked = new Map<string, string>();
    let unresolved = 0;
    for (const seg of resolveEvidenceRefs(cv, body)) {
      if (seg.kind !== "ref") continue;
      if (seg.resolved) linked.set(seg.id, seg.label);
      else unresolved += 1;
    }
    return { chips: [...linked.values()], unresolved };
  }, [cv, body]);

  const q = query.trim().toLowerCase();
  const shown = (
    q
      ? candidates.filter(
          (c) => c.title.toLowerCase().includes(q) || c.label.toLowerCase().includes(q),
        )
      : candidates
  ).slice(0, MAX_SHOWN);

  return (
    <div className="evidence-tools">
      <Popover
        locale={locale}
        trigger={eu.evInsert}
        triggerClassName="btn btn-ghost"
        panelLabel={eu.evPanel}
        panelClassName="evidence-picker"
        align="start"
      >
        {(close) => (
          <>
            <input
              type="search"
              className="evidence-search"
              placeholder={eu.evSearch}
              aria-label={eu.evSearch}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {shown.length === 0 ? (
              <p className="muted evidence-empty">{eu.evNone}</p>
            ) : (
              <ul className="evidence-list">
                {shown.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="evidence-option"
                      onClick={() => {
                        onInsert(`[[${c.id}]]`);
                        close();
                      }}
                    >
                      <span className="evidence-option-title">{c.title}</span>
                      <span className="muted evidence-option-meta">
                        {c.label} · {c.sectionTitle}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Popover>
      <span className="field-hint muted">{eu.evHint}</span>
      {status.chips.length > 0 || status.unresolved > 0 ? (
        <p className="evidence-status">
          <span className="muted">{eu.evLinked.replace("{n}", String(status.chips.length))}</span>
          {status.chips.map((label, i) => (
            <span key={`${i}-${label}`} className="evidence-chip">
              {label}
            </span>
          ))}
          {status.unresolved > 0 ? (
            <span className="evidence-unresolved" role="status">
              {eu.evUnresolved.replace("{n}", String(status.unresolved))}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
