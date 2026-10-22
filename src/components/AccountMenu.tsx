"use client";

import { t } from "@/lib/i18n";
import { researchPanelStrings } from "@/lib/i18n/researchPanel";
import Popover from "./Popover";
import AccountControls from "./AccountControls";

interface AccountMenuProps {
  userName: string;
  locale: string;
  /** Opens the research panel; absent (no item) while the study is closed and
   *  the account holds no consent to stop. */
  onOpenResearch?: () => void;
  digestOptIn?: boolean;
  digestContactEmail?: string | null;
  digestContactEmailVerified?: boolean;
  accountEmail?: string | null;
  signOutAction: () => Promise<void>;
}

/** Two-letter initials from a display name (falls back to "?"). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Account/avatar menu: collapses everything account-related — sign out, the
 * research panel's entry, the re-sync digest settings, data export, and the
 * destructive Delete account — out of the always-visible top bar and behind one
 * trigger. Hosts the existing `AccountControls` UNCHANGED (its own accessible
 * delete `alertdialog` keeps working); only the mounting location changes.
 */
export default function AccountMenu({
  userName,
  locale,
  signOutAction,
  onOpenResearch,
  ...account
}: AccountMenuProps) {
  return (
    <Popover
      locale={locale}
      triggerClassName="menu-trigger account-trigger"
      triggerAriaLabel={userName}
      trigger={
        <>
          <span className="avatar" aria-hidden="true">
            {initials(userName)}
          </span>
          <span className="caret" aria-hidden="true">
            ▾
          </span>
        </>
      }
      panelLabel={userName}
      panelClassName="account-panel"
    >
      {(close) => (
        <>
          <div className="menu-header">
            <span className="avatar avatar-lg" aria-hidden="true">
              {initials(userName)}
            </span>
            <span className="menu-header-name">{userName}</span>
          </div>
          <div className="menu-section">
            <form action={signOutAction}>
              <button type="submit" className="menu-item">
                {t(locale, "signOut")}
              </button>
            </form>
          </div>
          <div className="menu-divider" role="separator" />
          {/* The research study's entry besides the editor's link: a plain item,
              no badge, shown while the study takes participants or while the
              account holds a consent it may withdraw. */}
          {onOpenResearch ? (
            <div className="menu-section">
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  close();
                  onOpenResearch();
                }}
              >
                {researchPanelStrings(locale).entry}
              </button>
            </div>
          ) : null}
          {/* The whole account/GDPR cluster, hosted unchanged. Delete account
              lives here (danger-styled, with its existing confirm dialog) —
              discoverable, but no longer one mis-click away in the toolbar. */}
          <div className="menu-section">
            <AccountControls locale={locale} {...account} />
          </div>
        </>
      )}
    </Popover>
  );
}
