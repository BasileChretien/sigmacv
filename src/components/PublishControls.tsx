"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";
import { editorUi } from "@/lib/i18n/editorUi";
import { transparencyStrings } from "@/lib/i18n/transparency";
import { localeTransparencyPath } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics/track";
import { NO_INSTITUTION_PAGE, type InstitutionPageState } from "@/lib/cv/institutionConsent";
import { rememberPromptDismissal } from "@/lib/cv/institutionPrompt";

interface PublicContactFlags {
  email: boolean;
  phone: boolean;
  location: boolean;
}

/** The publish state as the API answers it and the host tracks it. */
export interface PublishStateChange {
  published: boolean;
  slug: string | null;
  indexable: boolean;
  listUnderAffiliation: boolean;
  affiliationRorId: string | null;
  /** The institution-page consent (pinned ids, the picker and the re-ask). */
  institutionPage: InstitutionPageState;
}

interface PublishControlsProps {
  initialPublished: boolean;
  initialSlug: string | null;
  initialIndexable: boolean;
  /** "List under my current affiliation": the OAI-PMH `ror:<id>` set opt-in — a
      consent SEPARATE from indexing (which it requires). */
  initialListUnderAffiliation?: boolean;
  /** The bare ROR id of the visible current position the CV would be listed
      under; null when none resolves, in which case the opt-in is disabled with
      a hint (there is no set to list under). */
  initialAffiliationRorId?: string | null;
  /** "Show me on my institution's page": a FOURTH consent, pinned to the ROR
      ids ticked among the visible current affiliations (the picker). */
  initialInstitutionPage?: InstitutionPageState;
  locale: string;
  /** Per-field consent for contact details on the public page (default off). */
  publicContact: PublicContactFlags;
  onPublicContactChange: (next: PublicContactFlags) => void;
  /** Notifies the parent of publish/slug/indexing changes so a host indicator
      (e.g. the top-bar trigger + the Share menu's visibility) can reflect them
      without a reload. Optional so this control still works standalone. */
  onPublishStateChange?: (next: PublishStateChange) => void;
  /** Deep-link to the editor's public-page-style picker (the publish surface is
      where the "style my public page" job naturally begins). Optional so the
      control still works standalone. */
  onEditPublicStyle?: () => void;
}

/** What the request may say about the institution-page consent: omitted = the
 *  stored choice stays as it is (the server still clears it with indexing). */
interface InstitutionRequest {
  showOnInstitutionPage: boolean;
  consentedRorIds: string[];
}

/**
 * Publish control for the living public CV page: the on/off decision plus the
 * visibility/privacy settings (search indexing + per-field contact consent).
 *
 * The share/embed job — the public link, the "Living CV" badge and the QR — lives
 * on its OWN surface (`ShareMenu` → `ShareControls`), shown in the top bar once the
 * page is live. Keeping it out of here is deliberate: this popover is a focused,
 * short publish decision, not a share dashboard.
 */
export default function PublishControls({
  initialPublished,
  initialSlug,
  initialIndexable,
  initialListUnderAffiliation = false,
  initialAffiliationRorId = null,
  initialInstitutionPage = NO_INSTITUTION_PAGE,
  locale,
  publicContact,
  onPublicContactChange,
  onPublishStateChange,
  onEditPublicStyle,
}: PublishControlsProps) {
  const u = ui(locale);
  const eu = editorUi(locale);
  const ts = transparencyStrings(locale);
  const [published, setPublished] = useState(initialPublished);
  const [slug, setSlug] = useState(initialSlug);
  const [indexable, setIndexable] = useState(initialIndexable);
  const [listUnderAffiliation, setListUnderAffiliation] = useState(initialListUnderAffiliation);
  const [affiliationRorId, setAffiliationRorId] = useState(initialAffiliationRorId);
  const [institutionPage, setInstitutionPage] = useState(initialInstitutionPage);
  // The institution toggle is ticked but no institution is ticked yet: LOCAL only —
  // nothing is posted until a row is ticked (see setInstitutionToggle).
  const [institutionArmed, setInstitutionArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  // A polite live-region message (publish error) for assistive tech.
  const [announce, setAnnounce] = useState("");

  async function update(
    next: boolean,
    nextIndexable: boolean,
    nextListed: boolean,
    institution?: InstitutionRequest,
    shareRows?: boolean,
  ) {
    setBusy(true);
    setAnnounce("");
    try {
      const res = await fetch("/api/cv/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published: next,
          indexable: nextIndexable,
          listUnderAffiliation: nextListed,
          ...institution,
          ...(shareRows === undefined ? {} : { shareReconciliationRows: shareRows }),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          published: boolean;
          publicSlug: string | null;
          indexable: boolean;
          listUnderAffiliation: boolean;
          affiliationRorId: string | null;
        } & InstitutionPageState;
        const nextInstitutionPage: InstitutionPageState = {
          showOnInstitutionPage: data.showOnInstitutionPage,
          consentedRorIds: data.consentedRorIds,
          currentAffiliations: data.currentAffiliations,
          visibleCurrentRorIds: data.visibleCurrentRorIds,
          lapsedRorIds: data.lapsedRorIds,
          shareReconciliationRows: data.shareReconciliationRows,
        };
        setPublished(data.published);
        setSlug(data.publicSlug);
        setIndexable(data.indexable);
        setListUnderAffiliation(data.listUnderAffiliation);
        setAffiliationRorId(data.affiliationRorId);
        setInstitutionPage(nextInstitutionPage);
        // The server's answer is the truth now; a merely-armed picker is over
        // (a failed post leaves it armed so the tick can be retried).
        setInstitutionArmed(false);
        // Keep the host (top-bar trigger + Share menu visibility) in lockstep.
        onPublishStateChange?.({
          published: data.published,
          slug: data.publicSlug,
          indexable: data.indexable,
          listUnderAffiliation: data.listUnderAffiliation,
          affiliationRorId: data.affiliationRorId,
          institutionPage: nextInstitutionPage,
        });
        if (data.published) {
          // Cookieless product signal: a public page was published. No identifiers.
          trackEvent("Publish", { indexable: data.indexable });
        }
      } else {
        // Surface the failure so the user isn't left believing it succeeded.
        setAnnounce(u.publishError);
      }
    } catch {
      setAnnounce(u.publishError);
    } finally {
      setBusy(false);
    }
  }

  // Unpublishing always clears indexing (and with it the affiliation listing);
  // publishing keeps the prior choices.
  const toggle = (next: boolean) =>
    update(next, next ? indexable : false, next ? listUnderAffiliation : false);
  // Indexing off → the affiliation listing goes with it (it requires indexing).
  const setIndexing = (next: boolean) => update(true, next, next ? listUnderAffiliation : false);
  // An explicit withdrawal of either institution consent is an ANSWER: the
  // one-time institution prompt must not ask again for this set of current
  // affiliations (it keys its memory by the same set; see cv/institutionPrompt).
  const rememberWithdrawal = () => rememberPromptDismissal(institutionPage.visibleCurrentRorIds);
  const setListing = (next: boolean) => {
    if (!next) rememberWithdrawal();
    return update(true, true, next);
  };
  // The opt-in is offered only while indexing is on AND a current position
  // resolves to a ROR record — otherwise there is no set to list under.
  const listingOffered = indexable && affiliationRorId !== null;

  // ── Institution page: a consent pinned to ticked ROR ids ──
  const {
    showOnInstitutionPage,
    consentedRorIds,
    currentAffiliations,
    lapsedRorIds,
    shareReconciliationRows,
  } = institutionPage;
  const consented = new Set(consentedRorIds);
  const active = currentAffiliations.filter((a) => consented.has(a.rorId));
  const institutionOffered = indexable && currentAffiliations.length > 0;
  // Posting the ids explicitly, every time: the server never guesses a consent.
  // The ids are validated against the STORED document, so an affiliation edited
  // moments ago is offered (and accepted) only once the debounced auto-save has
  // landed and the host refreshed the publish state (CvWorkspace does so after
  // each save); a tick inside that window is refused (422) and the error line
  // says so — re-open the menu and retry.
  const setInstitution = (show: boolean, rorIds: string[]) => {
    const on = show && rorIds.length > 0;
    // A resulting consent of NOTHING is a withdrawal, whichever path got here:
    // the toggle, unticking the last institution in the picker, or removing the
    // last lapsed id. Each is an ANSWER — remembered under the same key, or the
    // one-time prompt asks again on the next render.
    if (!on) rememberWithdrawal();
    return update(true, true, listUnderAffiliation, {
      showOnInstitutionPage: on,
      consentedRorIds: show ? rorIds : [],
    });
  };
  // With exactly ONE current affiliation the toggle consents to it in one click
  // (the copy names it). With several, ticking the toggle only ARMS the picker
  // (local state, nothing posted) until at least one institution is ticked —
  // never a consent to every affiliation at once. Unticking a merely-armed
  // toggle posts nothing; unticking a stored consent is a withdrawal.
  const institutionOn = showOnInstitutionPage || institutionArmed;
  const setInstitutionToggle = (next: boolean) => {
    if (!next) {
      setInstitutionArmed(false);
      // setInstitution remembers the withdrawal (its result is no consent).
      if (showOnInstitutionPage) void setInstitution(false, []);
      return;
    }
    if (currentAffiliations.length === 1) {
      void setInstitution(true, [...consentedRorIds, currentAffiliations[0]!.rorId]);
      return;
    }
    setInstitutionArmed(true);
  };
  // A pick posts the whole stored list — lapsed ids KEPT (they resume if that
  // affiliation becomes current again) — plus or minus the ticked one.
  const setInstitutionPick = (rorId: string, on: boolean) => {
    const kept = consentedRorIds.filter((id) => id !== rorId);
    void setInstitution(true, on ? [...kept, rorId] : kept);
  };
  // Removing a lapsed id posts the remaining list; the last one out is a withdrawal.
  const removeLapsed = (rorId: string) =>
    setInstitution(
      true,
      consentedRorIds.filter((id) => id !== rorId),
    );
  // ── The SECOND institution opt-in: per-work reconciliation rows ──
  // Offered only while the page consent is STORED (not merely armed): the
  // server refuses it without that consent and clears it with it. Posts only
  // the flag — the stored institution choice is left as it is.
  const setShareRows = (next: boolean) => update(true, true, listUnderAffiliation, undefined, next);
  const names = (affs: { name: string }[]) => affs.map((a) => a.name).join(", ");
  // The re-ask: a consented affiliation lapsed and there is a current one not
  // yet confirmed — name it; with no ROR-linked current position, say it is paused.
  const reask = currentAffiliations.filter((a) => !consented.has(a.rorId));

  return (
    <div className="account-controls">
      {/* The (un)publish decision is the most consequential, privacy-significant
          control in this panel — give it emphasis distinct from the secondary
          visibility checkboxes below, instead of an identical bare field row. */}
      <label className="field-inline publish-main-toggle" title={u.publishTitle}>
        <input
          type="checkbox"
          data-testid="publish-toggle"
          checked={published}
          disabled={busy}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span>{published ? u.publicLive : u.publishPublic}</span>
      </label>
      {/* What publishing exposes — shown BEFORE the toggle is flipped, so the
          (irreversible-feeling) public exposure is a fully-informed choice. */}
      <p className="publish-summary muted">{u.publicSummary}</p>
      {/* A quiet trust reassurance at the moment of the public-data decision, with a
          link to the full "Our promises" / transparency page (opens in a new tab so
          the editor state is preserved). */}
      <p className="publish-summary muted">
        {ts.publishNote}{" "}
        <a href={localeTransparencyPath(locale)} target="_blank" rel="noreferrer">
          {ts.promisesHeading}
        </a>
      </p>
      {/* Publish failure: a VISIBLE assertive alert (was a visually-hidden polite
          region — a sighted user only saw the checkbox snap back, with no message,
          and an error the user must act on shouldn't queue behind other speech). */}
      {announce ? (
        <p className="consent-error" role="alert">
          {announce}
        </p>
      ) : null}
      {published && slug ? (
        <>
          {/* Indexing is what actually makes the page discoverable in search —
              the growth point of the public-page flywheel. Give it emphasis and
              a benefit line (not a bare checkbox lost among contact fields), but
              keep it opt-in / default-off: we make the choice informed, not
              automatic, for GDPR/APPI. */}
          <label className="field-inline publish-index-toggle" title={u.allowIndexingTitle}>
            <input
              type="checkbox"
              checked={indexable}
              disabled={busy}
              onChange={(e) => setIndexing(e.target.checked)}
            />
            <span>{u.allowIndexing}</span>
          </label>
          <p className="publish-summary muted">{u.allowIndexingBody}</p>
          {/* "Your institution": the three institution consents, in one titled
              sub-section (same order, same copy, no behavioural change) so the
              institution prompt's and the worklist's "Change" links can deep-link
              here by id (focusable, not in the tab order). */}
          <div
            id="publish-institution"
            className="publish-institution-section"
            tabIndex={-1}
            aria-labelledby="publish-institution-heading"
          >
            <h3 id="publish-institution-heading" className="publish-subheading">
              {u.publishInstitutionSection}
            </h3>
            {/* A SEPARATE consent from indexing: listing the CV under the owner's
              self-declared current affiliation in the OAI-PMH `ror:<id>` set
              (an institution-keyed harvest the indexing consent never covered).
              Disabled, with the reason, when it cannot apply. */}
            <label
              className="field-inline publish-affiliation-toggle"
              title={u.listUnderAffiliationTitle}
            >
              <input
                type="checkbox"
                checked={listUnderAffiliation}
                // Withdrawing must always be possible: a standing opt-in stays
                // uncheckable-off even when no ROR key currently resolves.
                disabled={busy || (!listingOffered && !listUnderAffiliation)}
                onChange={(e) => setListing(e.target.checked)}
              />
              <span>{u.listUnderAffiliation}</span>
            </label>
            <p className="publish-summary muted">{u.listUnderAffiliationBody}</p>
            {indexable && affiliationRorId === null ? (
              <p className="publish-summary muted">{u.listUnderAffiliationNoRor}</p>
            ) : null}
            {/* A FOURTH consent: the public institution page. PINNED to the ROR
              ids ticked below — the server validates them against the stored
              CV and never moves a consent when the affiliation changes; the
              editor re-asks instead. Withdrawal stays possible in every state. */}
            <label
              className="field-inline publish-affiliation-toggle"
              title={u.showOnInstitutionPageTitle}
            >
              <input
                type="checkbox"
                checked={institutionOn}
                disabled={busy || (!institutionOffered && !showOnInstitutionPage)}
                onChange={(e) => setInstitutionToggle(e.target.checked)}
              />
              <span>{u.showOnInstitutionPage}</span>
            </label>
            <p className="publish-summary muted">{u.showOnInstitutionPageBody}</p>
            {!institutionOffered && !showOnInstitutionPage ? (
              <p className="publish-summary muted">{u.institutionPageUnavailable}</p>
            ) : null}
            {/* One affiliation: say which institution a single click consents to. */}
            {institutionOffered && currentAffiliations.length === 1 && !showOnInstitutionPage ? (
              <p className="publish-summary muted">
                {u.institutionPageSingle.replace("{institution}", currentAffiliations[0]!.name)}
              </p>
            ) : null}
            {currentAffiliations.length > 0 && (institutionOffered || showOnInstitutionPage) ? (
              <fieldset className="publish-institution-picker">
                <legend>{u.institutionPagePick}</legend>
                {currentAffiliations.map((a) => (
                  <label key={a.rorId} className="field-inline">
                    <input
                      type="checkbox"
                      checked={consented.has(a.rorId)}
                      disabled={busy || !institutionOn}
                      onChange={(e) => setInstitutionPick(a.rorId, e.target.checked)}
                    />
                    <span>
                      {a.name} <span className="muted">(ROR {a.rorId})</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            {institutionArmed && !showOnInstitutionPage ? (
              <p className="publish-summary consent-reask" role="status">
                {u.institutionPageArmedHint}
              </p>
            ) : null}
            {showOnInstitutionPage && active.length > 0 ? (
              <p className="publish-summary">
                {u.institutionPageListedUnder.replace("{institutions}", names(active))}
              </p>
            ) : null}
            {/* Lapsed ids are ALWAYS shown, each with its own Remove — even while
              another consent is active — so a kept listing is never invisible. */}
            {lapsedRorIds.length > 0 ? (
              <ul className="publish-institution-lapsed">
                {lapsedRorIds.map((id) => (
                  <li key={id} className="field-inline">
                    <span className="muted">
                      {u.institutionPageLapsedKept.replace("{rorId}", id)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busy}
                      aria-label={`${u.institutionPageRemove} — ROR ${id}`}
                      onClick={() => void removeLapsed(id)}
                    >
                      {u.institutionPageRemove}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {showOnInstitutionPage ? (
              <>
                <label
                  className="field-inline publish-affiliation-toggle"
                  title={u.shareReconciliationRowsTitle}
                >
                  <input
                    type="checkbox"
                    checked={shareReconciliationRows}
                    disabled={busy}
                    onChange={(e) => void setShareRows(e.target.checked)}
                  />
                  <span>{u.shareReconciliationRows}</span>
                </label>
                <p className="publish-summary muted">{u.shareReconciliationRowsBody}</p>
              </>
            ) : null}
            {showOnInstitutionPage && lapsedRorIds.length > 0 ? (
              reask.length > 0 ? (
                <p className="publish-summary consent-reask" role="status">
                  {u.institutionPageLapsed.replace("{institutions}", names(reask))}
                </p>
              ) : currentAffiliations.length === 0 ? (
                <p className="publish-summary consent-reask" role="status">
                  {u.institutionPageLapsedNone}
                </p>
              ) : null
            ) : null}
          </div>
          <fieldset className="public-contact-consent">
            <legend>{u.publicContactLegend}</legend>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={publicContact.email}
                onChange={(e) =>
                  onPublicContactChange({ ...publicContact, email: e.target.checked })
                }
              />
              <span>{u.publicShowEmail}</span>
            </label>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={publicContact.phone}
                onChange={(e) =>
                  onPublicContactChange({ ...publicContact, phone: e.target.checked })
                }
              />
              <span>{u.publicShowPhone}</span>
            </label>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={publicContact.location}
                onChange={(e) =>
                  onPublicContactChange({ ...publicContact, location: e.target.checked })
                }
              />
              <span>{u.publicShowLocation}</span>
            </label>
          </fieldset>
          {/* Deep-link to the editor's public-page-style picker — styling the
              living page is a publish-side job, so offer the jump right here once
              the page is live (closes this menu, opens + scrolls to that group). */}
          {onEditPublicStyle ? (
            <button
              type="button"
              className="btn btn-sm publish-style-cta"
              onClick={onEditPublicStyle}
            >
              {eu.publishStyleTip} <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
