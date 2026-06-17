"use client";

import { workspaceUi } from "@/lib/i18n/workspaceUi";
import Popover from "./Popover";
import ShareControls from "./ShareControls";

interface ShareMenuProps {
  locale: string;
  slug: string;
}

/**
 * Share entry-point: a top-bar trigger that opens a popover hosting the public
 * link (open/copy) + the embeddable "Living CV" badge and QR. Rendered ONLY when
 * the CV is published (the host gates it on `published && slug`), so the promote/
 * share job has its own surface and the Publish popover stays a focused on/off
 * decision.
 */
export default function ShareMenu({ locale, slug }: ShareMenuProps) {
  const wu = workspaceUi(locale);
  return (
    <Popover
      locale={locale}
      triggerClassName="menu-trigger share-trigger"
      panelLabel={wu.tbShare}
      panelClassName="share-panel"
      trigger={
        <>
          <span className="menu-trigger-label">{wu.tbShare}</span>
          <span className="caret" aria-hidden="true">
            ▾
          </span>
        </>
      }
    >
      {() => <ShareControls locale={locale} slug={slug} />}
    </Popover>
  );
}
