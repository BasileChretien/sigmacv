"use client";

import { snapshotStrings } from "@/lib/i18n/snapshots";
import Popover from "./Popover";
import VersionsControls from "./VersionsControls";

interface VersionsMenuProps {
  locale: string;
  published: boolean;
  slug: string | null;
}

/**
 * Versions entry-point: a top-bar trigger that opens a popover hosting the
 * frozen-version controls ("freeze & cite this version"). Shown whenever a CV
 * exists — freezing is useful before publishing too; only the SHARE links need
 * the page to be live, and the panel says so.
 */
export default function VersionsMenu({ locale, published, slug }: VersionsMenuProps) {
  const s = snapshotStrings(locale);
  return (
    <Popover
      locale={locale}
      triggerClassName="menu-trigger versions-trigger"
      panelLabel={s.tbVersions}
      panelClassName="versions-panel"
      trigger={
        <>
          <span className="menu-trigger-label">{s.tbVersions}</span>
          <span className="caret" aria-hidden="true">
            ▾
          </span>
        </>
      }
    >
      {() => <VersionsControls locale={locale} published={published} slug={slug} />}
    </Popover>
  );
}
