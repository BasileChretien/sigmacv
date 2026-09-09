"use client";

import { useEffect, useId, useState } from "react";
import type { VisibleAffiliation } from "@/lib/cv/institutionConsent";
import {
  affiliationSetKey,
  isPromptDismissed,
  rememberPromptDismissal,
  shouldOfferInstitutionPrompt,
  unlistedAffiliations,
  type PublishSnapshot,
} from "@/lib/cv/institutionPrompt";
import { institutionPromptStrings } from "@/lib/i18n/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { localePrivacyPath } from "@/lib/seo";
import InstitutionListingAction from "./InstitutionListingAction";
import {
  PUBLISH_INSTITUTION_ANCHOR,
  PUBLISH_TRIGGER,
  VERSIONS_TRIGGER,
  openTopBarMenu,
} from "./menuTriggers";

interface InstitutionListingPromptProps {
  locale: string;
  /** The publish state the host tracks (seeded server-side, refreshed after
   *  each publish change, save and sync). */
  state: PublishSnapshot;
  /** Held back while another one-time prompt is on screen (they never stack). */
  suppressed?: boolean;
  /** The server answered a "yes": keep the host's state in lockstep. */
  onPublishStateChange: (next: PublishSnapshot) => void;
}

/**
 * The one-time, inline "List yourself under {institution}?" card — an ASK, not
 * a default. OWNER ONLY (rendered by the editor workspace, never by the
 * anonymous preview). Shown when the page is live and indexable, a current
 * position is linked to a ROR record and the CV is not yet listed under it,
 * until the researcher answers: "Yes, list me under {institution}" (one
 * request, the full publish state plus the three listing fields; with several
 * institutions a picker, nothing pre-ticked, "Yes" disabled until a tick) or
 * "Not now" (sends nothing, remembered per set of ROR ids — a new affiliation
 * asks again). Two buttons of equal weight; a "What this means" link to the
 * privacy notice; one sentence on the SEPARATE reconciliation-rows choice with
 * a link to Versions — never a third box here. Not a dialog: a labelled
 * section that steals no focus; motion follows `prefers-reduced-motion`.
 */
export default function InstitutionListingPrompt({
  locale,
  state,
  suppressed = false,
  onPublishStateChange,
}: InstitutionListingPromptProps) {
  const s = institutionPromptStrings(locale);
  const u = ui(locale);
  const wu = workspaceUi(locale);
  const titleId = useId();
  const statusId = useId();
  const setIds = state.institutionPage.visibleCurrentRorIds;
  const setKey = affiliationSetKey(setIds);
  // Client-only gate so a remembered answer never flashes the card (and SSR
  // stays inert); re-read whenever the SET of current affiliations changes.
  const [checked, setChecked] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // The affiliations a "yes" just listed: the confirmation replaces the ask.
  const [listed, setListed] = useState<VisibleAffiliation[] | null>(null);

  useEffect(() => {
    setDismissed(isPromptDismissed(setIds));
    setChecked(setKey);
    // A confirmation belongs to the set it was given for: a NEW affiliation is a
    // new question, so the card must go back to asking instead of sitting on
    // "you are listed under …" for a set that has since changed.
    setListed(null);
    // The set key is what identifies the dismissal; the ids are its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setKey]);

  const asking =
    !suppressed && checked === setKey && shouldOfferInstitutionPrompt(state, dismissed);
  // The confirmation stays on screen once given, whatever suppresses the ask.
  if (!listed && !asking) return null;

  const unlisted = unlistedAffiliations(state);
  const several = unlisted.length > 1;
  const names = unlisted.map((a) => a.name).join(", ");
  // The OAI-PMH set is keyed by the FIRST visible current position (the
  // server's `affiliationRorId`), whatever is ticked — so with several
  // affiliations the disclosure names that one, not the whole list.
  const oaiName = state.institutionPage.currentAffiliations.find(
    (a) => a.rorId === state.affiliationRorId,
  )?.name;
  const fill = (template: string, institution = names) =>
    template.replace("{institution}", () => institution);
  const [reconBefore, reconAfter] = s.reconciliation.split("{versions}");

  const notNow = () => {
    rememberPromptDismissal(setIds);
    setDismissed(true);
  };
  const onListed = (next: PublishSnapshot, chosen: VisibleAffiliation[]) => {
    // Answered: never ask again for this set (a later withdrawal is recorded
    // by the Publish menu under the same key).
    rememberPromptDismissal(setIds);
    onPublishStateChange(next);
    setListed(chosen);
  };

  return (
    <section className="institution-prompt" aria-labelledby={listed ? statusId : titleId}>
      {/* The live region is rendered from the start and its CONTENT swapped, so
          a screen reader announces the confirmation when it arrives (a region
          that only appears with its text is often missed). */}
      <p id={statusId} className="institution-prompt-listed" role="status">
        {listed
          ? u.institutionPageListedUnder.replace("{institutions}", () =>
              listed.map((a) => a.name).join(", "),
            )
          : ""}
      </p>
      {listed ? (
        <div className="institution-prompt-actions">
          <button
            type="button"
            className="link-btn"
            onClick={() => openTopBarMenu(PUBLISH_TRIGGER, PUBLISH_INSTITUTION_ANCHOR)}
          >
            {wu.wlListingChange}
          </button>
        </div>
      ) : (
        <>
          <h2 id={titleId} className="institution-prompt-title">
            {several ? s.headingMany : fill(s.heading)}
          </h2>
          <p>{fill(s.what, several ? (oaiName ?? names) : names)}</p>
          <p>{s.nothingUntil}</p>
          <p>{s.withdraw}</p>
          <p className="muted">
            {reconBefore}
            <button
              type="button"
              className="link-btn"
              onClick={() => openTopBarMenu(VERSIONS_TRIGGER)}
            >
              {s.versions}
            </button>
            {reconAfter}
          </p>
          <div className="institution-prompt-actions">
            <InstitutionListingAction
              locale={locale}
              state={state}
              affiliations={unlisted}
              yesLabel={(institution) => s.yes.replace("{institution}", () => institution)}
              yesNoneLabel={s.yesNone}
              idPrefix={`${titleId}-pick`}
              onListed={onListed}
            />
            <button type="button" className="btn" onClick={notNow}>
              {s.notNow}
            </button>
            <a
              className="institution-prompt-more"
              href={localePrivacyPath(locale)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.learnMore}
            </a>
          </div>
        </>
      )}
    </section>
  );
}
