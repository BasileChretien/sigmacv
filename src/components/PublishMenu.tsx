"use client";

import { ui } from "@/lib/i18n/ui";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import Popover from "./Popover";
import PublishControls from "./PublishControls";

interface PublicContactFlags {
  email: boolean;
  phone: boolean;
  location: boolean;
}

interface PublishMenuProps {
  locale: string;
  published: boolean;
  slug: string | null;
  indexable: boolean;
  publicContact: PublicContactFlags;
  onPublicContactChange: (next: PublicContactFlags) => void;
  /** Lifts publish/slug/indexing changes up so the bar's live-state indicator
      (dot + label) updates immediately, instead of going stale until reload. */
  onPublishStateChange: (next: {
    published: boolean;
    slug: string | null;
    indexable: boolean;
  }) => void;
  /** Deep-link to the editor's public-page-style picker (closes this menu first). */
  onEditPublicStyle?: () => void;
}

/**
 * Publish entry-point: one trigger (with a live-dot when the public page is on)
 * that opens a popover hosting the existing `PublishControls` UNCHANGED — the
 * toggle, the public URL with open/copy, indexing, and the per-field
 * contact-consent fieldset. Keeps the top bar from ballooning when published,
 * and the `onPublicContactChange → canonical document → autosave` wiring intact.
 */
export default function PublishMenu({
  locale,
  published,
  slug,
  indexable,
  publicContact,
  onPublicContactChange,
  onPublishStateChange,
  onEditPublicStyle,
}: PublishMenuProps) {
  const u = ui(locale);
  const wu = workspaceUi(locale);
  return (
    <Popover
      locale={locale}
      triggerClassName={`menu-trigger publish-trigger${published ? " is-published" : ""}`}
      panelLabel={u.publishPublic}
      panelClassName="publish-panel"
      trigger={
        <>
          <span className={`publish-dot${published ? " is-live" : ""}`} aria-hidden="true" />
          <span className="menu-trigger-label">{published ? wu.tbPublished : wu.tbPublish}</span>
          <span className="caret" aria-hidden="true">
            ▾
          </span>
        </>
      }
    >
      {(close) => (
        <PublishControls
          initialPublished={published}
          initialSlug={slug}
          initialIndexable={indexable}
          locale={locale}
          publicContact={publicContact}
          onPublicContactChange={onPublicContactChange}
          onPublishStateChange={onPublishStateChange}
          onEditPublicStyle={
            onEditPublicStyle
              ? () => {
                  close();
                  onEditPublicStyle();
                }
              : undefined
          }
        />
      )}
    </Popover>
  );
}
