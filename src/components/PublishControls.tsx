"use client";

import { useState } from "react";
import { ui } from "@/lib/i18n/ui";
import { editorUi } from "@/lib/i18n/editorUi";
import { transparencyStrings } from "@/lib/i18n/transparency";
import { localeTransparencyPath } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics/track";

interface PublicContactFlags {
  email: boolean;
  phone: boolean;
  location: boolean;
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
  locale: string;
  /** Per-field consent for contact details on the public page (default off). */
  publicContact: PublicContactFlags;
  onPublicContactChange: (next: PublicContactFlags) => void;
  /** Notifies the parent of publish/slug/indexing changes so a host indicator
      (e.g. the top-bar trigger + the Share menu's visibility) can reflect them
      without a reload. Optional so this control still works standalone. */
  onPublishStateChange?: (next: {
    published: boolean;
    slug: string | null;
    indexable: boolean;
    listUnderAffiliation: boolean;
    affiliationRorId: string | null;
  }) => void;
  /** Deep-link to the editor's public-page-style picker (the publish surface is
      where the "style my public page" job naturally begins). Optional so the
      control still works standalone. */
  onEditPublicStyle?: () => void;
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
  const [busy, setBusy] = useState(false);
  // A polite live-region message (publish error) for assistive tech.
  const [announce, setAnnounce] = useState("");

  async function update(next: boolean, nextIndexable: boolean, nextListed: boolean) {
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
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          published: boolean;
          publicSlug: string | null;
          indexable: boolean;
          listUnderAffiliation: boolean;
          affiliationRorId: string | null;
        };
        setPublished(data.published);
        setSlug(data.publicSlug);
        setIndexable(data.indexable);
        setListUnderAffiliation(data.listUnderAffiliation);
        setAffiliationRorId(data.affiliationRorId);
        // Keep the host (top-bar trigger + Share menu visibility) in lockstep.
        onPublishStateChange?.({
          published: data.published,
          slug: data.publicSlug,
          indexable: data.indexable,
          listUnderAffiliation: data.listUnderAffiliation,
          affiliationRorId: data.affiliationRorId,
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
  const setListing = (next: boolean) => update(true, true, next);
  // The opt-in is offered only while indexing is on AND a current position
  // resolves to a ROR record — otherwise there is no set to list under.
  const listingOffered = indexable && affiliationRorId !== null;

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
              disabled={busy || !listingOffered}
              onChange={(e) => setListing(e.target.checked)}
            />
            <span>{u.listUnderAffiliation}</span>
          </label>
          <p className="publish-summary muted">{u.listUnderAffiliationBody}</p>
          {indexable && affiliationRorId === null ? (
            <p className="publish-summary muted">{u.listUnderAffiliationNoRor}</p>
          ) : null}
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
