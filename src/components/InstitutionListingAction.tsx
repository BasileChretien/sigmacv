"use client";

import { useState } from "react";
import type { VisibleAffiliation } from "@/lib/cv/institutionConsent";
import { postInstitutionListing, type PublishSnapshot } from "@/lib/cv/institutionPrompt";
import { ui } from "@/lib/i18n/ui";

interface InstitutionListingActionProps {
  locale: string;
  /** The current publish state — posted in FULL with the listing fields. */
  state: PublishSnapshot;
  /** The current affiliations the CV is NOT yet listed under, offered here. */
  affiliations: readonly VisibleAffiliation[];
  /** The consent button's label, naming the institution(s) it lists under. */
  yesLabel: (institution: string) => string;
  /** Its label while several are offered and none is ticked yet (disabled). */
  yesNoneLabel: string;
  /** Prefix for the picker's element ids (two instances may share a page). */
  idPrefix: string;
  /** Same visual weight as the caller's "Not now" — never a primary button. */
  buttonClassName?: string;
  /** The server answered: the new state and the affiliations just listed. */
  onListed: (next: PublishSnapshot, listed: VisibleAffiliation[]) => void;
}

/**
 * The one consent control shared by the inline prompt and the worklist's
 * "Institution listing" line. With ONE affiliation offered, the button names
 * it and one click lists the CV under it. With several, a picker appears —
 * nothing pre-ticked — and the button stays disabled until at least one is
 * ticked, its label naming exactly the ticked ones: never a consent to two
 * institutions without a tick for each. One request, the full publish state
 * plus the three listing fields; on failure the generic publish error shows
 * and nothing changes.
 */
export default function InstitutionListingAction({
  locale,
  state,
  affiliations,
  yesLabel,
  yesNoneLabel,
  idPrefix,
  buttonClassName = "btn",
  onListed,
}: InstitutionListingActionProps) {
  const u = ui(locale);
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const several = affiliations.length > 1;
  const chosen = several ? affiliations.filter((a) => ticked.includes(a.rorId)) : [...affiliations];
  const names = chosen.map((a) => a.name).join(", ");
  const disabled = busy || chosen.length === 0;

  const tick = (rorId: string, on: boolean) =>
    setTicked((prev) => (on ? [...prev, rorId] : prev.filter((id) => id !== rorId)));

  async function list() {
    if (chosen.length === 0) return;
    setBusy(true);
    setError("");
    const next = await postInstitutionListing(
      state,
      chosen.map((a) => a.rorId),
    );
    setBusy(false);
    if (!next) {
      setError(u.publishError);
      return;
    }
    onListed(next, chosen);
  }

  return (
    <div className="institution-listing-action">
      {several ? (
        <fieldset className="institution-picker">
          <legend>{u.institutionPagePick}</legend>
          {affiliations.map((a) => (
            <label key={a.rorId} className="field-inline" htmlFor={`${idPrefix}-${a.rorId}`}>
              <input
                id={`${idPrefix}-${a.rorId}`}
                type="checkbox"
                checked={ticked.includes(a.rorId)}
                disabled={busy}
                onChange={(e) => tick(a.rorId, e.target.checked)}
              />
              <span>
                {a.name} <span className="muted">(ROR {a.rorId})</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {error ? (
        <p className="consent-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled}
        onClick={() => void list()}
      >
        {chosen.length > 0 ? yesLabel(names) : yesNoneLabel}
      </button>
    </div>
  );
}
