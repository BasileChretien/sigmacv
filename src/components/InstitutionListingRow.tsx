"use client";

import {
  canListNow,
  listedAffiliations,
  unlistedAffiliations,
  type PublishSnapshot,
} from "@/lib/cv/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
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
 * ROR-linked current affiliation → "You are not yet listed under …" with the
 * same one-request "List me under …" control as the prompt (same picker rule
 * with several; offered only while the page is published and indexable, else
 * the reason and a link to the Publish menu). Listed → "Listed under …" with a
 * "Change" link into the Publish menu's institution sub-section. A consent
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
  const listed = listedAffiliations(state);
  const unlisted = unlistedAffiliations(state);
  const lapsed = state.institutionPage.lapsedRorIds;
  if (listed.length === 0 && unlisted.length === 0 && lapsed.length === 0) return null;

  const names = (affs: { name: string }[]) => affs.map((a) => a.name).join(", ");
  const fill = (template: string, institution: string) =>
    template.replace("{institution}", () => institution);
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
      {lapsed.map((id) => (
        <p key={id} className="muted cv-worklist-listing-status">
          {u.institutionPageLapsedKept.replace("{rorId}", () => id)}
        </p>
      ))}
      {unlisted.length > 0 ? (
        <div className="cv-worklist-listing-status">
          <p>{fill(wu.wlListingUnlisted, names(unlisted))}</p>
          {canListNow(state) ? (
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
