"use client";

import {
  canListNow,
  listedAffiliations,
  pageOnlyAffiliations,
  setOnlyAffiliations,
  unlistedAffiliations,
  type PublishSnapshot,
} from "@/lib/cv/institutionPrompt";
import { institutionPromptStrings } from "@/lib/i18n/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { localePrivacyPath } from "@/lib/seo";
import InstitutionListingAction from "./InstitutionListingAction";
import { PUBLISH_INSTITUTION_ANCHOR, PUBLISH_TRIGGER, openTopBarMenu } from "./menuTriggers";

/** What the worklist needs to show — and change — the listing status. */
export interface InstitutionListing {
  state: PublishSnapshot;
  onPublishStateChange: (next: PublishSnapshot) => void;
}

interface InstitutionListingRowProps extends InstitutionListing {
  locale: string;
}

/**
 * The worklist's first row, "Institution listing" — a STATUS line, never a
 * gap: it is counted in no figure and reads as no task. Not yet listed under a
 * ROR-linked current affiliation (on NEITHER surface) → "You are not yet listed
 * under …" with the prompt's own disclosure, its "What this means" link and the
 * same one-request "List me under …" control (same picker rule with several;
 * offered only while the page is published and indexable, else the reason and a
 * link to the Publish menu). On BOTH surfaces → "Listed under …" with a
 * "Change" link into the Publish menu's institution sub-section. On exactly ONE
 * of them → the third wording, which says which surface is missing, with the
 * same "Change" link and no ask. A consent
 * that LAPSED (an id kept from a former affiliation) keeps the Publish menu's
 * own wording. Renders nothing with no ROR-linked current affiliation and no
 * lapsed id.
 */
export default function InstitutionListingRow({
  locale,
  state,
  onPublishStateChange,
}: InstitutionListingRowProps) {
  const u = ui(locale);
  const wu = workspaceUi(locale);
  const s = institutionPromptStrings(locale);
  const listed = listedAffiliations(state);
  const unlisted = unlistedAffiliations(state);
  const pageOnly = pageOnlyAffiliations(state);
  const setOnly = setOnlyAffiliations(state);
  const lapsed = state.institutionPage.lapsedRorIds;
  if (
    listed.length === 0 &&
    unlisted.length === 0 &&
    pageOnly.length === 0 &&
    setOnly.length === 0 &&
    lapsed.length === 0
  ) {
    return null;
  }

  const names = (affs: { name: string }[]) => affs.map((a) => a.name).join(", ");
  const fill = (template: string, institution: string) =>
    template.replace("{institution}", () => institution);
  // The OAI-PMH set is keyed by the ONE position the server picked, whatever is
  // ticked — the disclosure names that one, as the prompt's body does.
  const oaiName = state.institutionPage.currentAffiliations.find(
    (a) => a.rorId === state.affiliationRorId,
  )?.name;
  const change = (
    <button
      type="button"
      className="link-btn"
      onClick={() => openTopBarMenu(PUBLISH_TRIGGER, PUBLISH_INSTITUTION_ANCHOR)}
    >
      {wu.wlListingChange}
    </button>
  );

  return (
    <section className="cv-worklist-group cv-worklist-listing" data-worklist="listing">
      <h4>{wu.wlListingHeading}</h4>
      <p className="muted">{wu.wlListingHelp}</p>
      {listed.length > 0 ? (
        <p className="cv-worklist-listing-status">
          {fill(wu.wlListingListed, names(listed))} {change}
        </p>
      ) : null}
      {/* On ONE of the two surfaces: a status, not an ask — the prompt stays
          away and the Change link leads to the choice. */}
      {pageOnly.map((a) => (
        <p key={a.rorId} className="cv-worklist-listing-status">
          {fill(wu.wlListingPageOnly, a.name)} {change}
        </p>
      ))}
      {setOnly.map((a) => (
        <p key={a.rorId} className="cv-worklist-listing-status">
          {fill(wu.wlListingSetOnly, a.name)} {change}
        </p>
      ))}
      {lapsed.map((id) => (
        <p key={id} className="muted cv-worklist-listing-status">
          {u.institutionPageLapsedKept.replace("{rorId}", () => id)}
        </p>
      ))}
      {unlisted.length > 0 ? (
        <div className="cv-worklist-listing-status">
          <p>{fill(wu.wlListingUnlisted, names(unlisted))}</p>
          {canListNow(state) ? (
            <>
              {/* The consent is given HERE, so what it does is said here too —
                  the prompt's own disclosure, naming (with several ticked
                  boxes) the institution whose OAI-PMH set is keyed to the
                  position the server picked, exactly as the prompt does. */}
              <p className="muted">
                {fill(s.what, unlisted.length > 1 ? (oaiName ?? names(unlisted)) : names(unlisted))}{" "}
                <a href={localePrivacyPath(locale)} target="_blank" rel="noopener noreferrer">
                  {s.learnMore}
                </a>
              </p>
              <InstitutionListingAction
                locale={locale}
                state={state}
                affiliations={unlisted}
                yesLabel={(institution) => fill(wu.wlListingListMe, institution)}
                yesNoneLabel={wu.wlListingListMeNone}
                idPrefix="worklist-listing"
                buttonClassName="btn btn-sm"
                onListed={(next) => onPublishStateChange(next)}
              />
            </>
          ) : (
            <p className="muted">
              {wu.wlListingNeedsPage} {change}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
