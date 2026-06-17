"use client";

import { LOCALE_LABELS, SUPPORTED_LOCALES, t } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";
import AccountMenu from "./AccountMenu";
import PublishMenu from "./PublishMenu";
import ShareMenu from "./ShareMenu";
import SupportLink from "./SupportLink";
import ThemeToggle from "./ThemeToggle";

/** Exportable formats — mirrors the EXPORTABLE list the API route accepts. */
export type ExportFormat =
  | "pdf"
  | "docx"
  | "latex"
  | "markdown"
  | "bibtex"
  | "csljson"
  | "jsonresume"
  | "ro-crate"
  | "json"
  | "biosketch"
  | "erc"
  | "msca"
  | "nsf"
  | "jsps";

interface PublicContactFlags {
  email: boolean;
  phone: boolean;
  location: boolean;
}

export interface TopBarProps {
  brand?: string;
  userName: string;
  /** Interface language. */
  locale: string;
  // ── Document state ──
  /** Localized save/sync status text ("Saved." / "Saving…"); "" when idle. */
  status: string;
  /** Outcome of the status message — drives the dot colour (green/red). */
  statusKind?: "ok" | "error" | "";
  saving: boolean;
  syncing: boolean;
  dirty: boolean;
  /** Whether a CV exists (gates Save/Export). */
  hasCv: boolean;
  // ── Primary actions ──
  onSync: () => void;
  onSave: () => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  onExport: () => void;
  onChangeLocale: (locale: string) => void;
  // ── Publish (hosted in the Publish menu) ──
  published: boolean;
  publicSlug: string | null;
  publicIndexable: boolean;
  publicContact: PublicContactFlags;
  onPublicContactChange: (next: PublicContactFlags) => void;
  /** Live publish-state updates from the Publish menu, so the trigger's dot +
      label reflect the current state without waiting for a reload. */
  onPublishStateChange: (next: {
    published: boolean;
    slug: string | null;
    indexable: boolean;
  }) => void;
  /** Deep-link from the Publish menu to the editor's public-page-style picker. */
  onEditPublicStyle?: () => void;
  // ── Account (hosted in the Account menu) ──
  researchConsent: boolean;
  digestOptIn?: boolean;
  digestContactEmail?: string | null;
  digestContactEmailVerified?: boolean;
  accountEmail?: string | null;
  signOutAction: () => Promise<void>;
}

/**
 * Restructured editor top bar: one calm row with a single primary action (the
 * Export split control) and everything else de-escalated. Publish and the whole
 * account/GDPR cluster collapse into menus so the bar has stable, predictable
 * contents and the destructive Delete is no longer always-visible chrome.
 * `CvWorkspace` owns all the state; this is a presentational bar receiving it.
 */
export default function TopBar({
  brand = "SigmaCV",
  userName,
  locale,
  status,
  statusKind = "",
  saving,
  syncing,
  dirty,
  hasCv,
  onSync,
  onSave,
  exportFormat,
  onExportFormatChange,
  onExport,
  onChangeLocale,
  published,
  publicSlug,
  publicIndexable,
  publicContact,
  onPublicContactChange,
  onPublishStateChange,
  onEditPublicStyle,
  researchConsent,
  digestOptIn,
  digestContactEmail,
  digestContactEmailVerified,
  accountEmail,
  signOutAction,
}: TopBarProps) {
  const u = ui(locale);
  const saveLabel = saving ? t(locale, "saving") : dirty ? t(locale, "save") : t(locale, "saved");

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <strong>{brand}</strong>
      </div>

      <div className="topbar-actions">
        {/* Quiet, glanceable auto-save status. Persistent live region (never
            unmounted) so screen readers hear "Saved." / "Synced…" politely. */}
        <span
          className={`tb-status${statusKind ? ` tb-status--${statusKind}` : ""}`}
          role="status"
          aria-live="polite"
        >
          {status ? (
            <>
              <span className="tb-status-dot" aria-hidden="true" />
              {status}
            </>
          ) : null}
        </span>

        <button type="button" className="btn btn-ghost btn-sm" onClick={onSync} disabled={syncing}>
          {syncing ? t(locale, "resyncing") : t(locale, "resync")}
        </button>

        <button
          type="button"
          className="btn btn-sm"
          onClick={onSave}
          disabled={!hasCv || saving || !dirty}
        >
          {saveLabel}
        </button>

        {/* Primary action: the export-format select fused with the Export button
            into one segmented control — the single accent CTA in the bar. */}
        <div className="export-split">
          <select
            className="export-format"
            value={exportFormat}
            onChange={(e) => onExportFormatChange(e.target.value as ExportFormat)}
            aria-label={t(locale, "exportFormat")}
            title={u.exportFormatTitle}
            disabled={!hasCv}
          >
            <optgroup label={u.exportGroupDocuments}>
              <option value="pdf">{u.exportPdf}</option>
              <option value="docx">{u.exportDocx}</option>
              <option value="latex">{u.exportLatexModern}</option>
              <option value="markdown">{u.exportMarkdown}</option>
            </optgroup>
            <optgroup label={u.exportGroupData}>
              <option value="bibtex">{u.exportBibtex}</option>
              <option value="csljson">{u.exportCslJson}</option>
              <option value="jsonresume">{u.exportJsonResume}</option>
              <option value="ro-crate">{u.exportRoCrate}</option>
              <option value="json">{u.exportJson}</option>
            </optgroup>
            <optgroup label={u.exportGroupGrantCv}>
              <option value="biosketch">{u.exportBiosketch}</option>
              <option value="erc">{u.exportErc}</option>
              <option value="msca">{u.exportMsca}</option>
              <option value="nsf">{u.exportNsf}</option>
              <option value="jsps">{u.exportJsps}</option>
            </optgroup>
          </select>
          <button
            type="button"
            className="btn btn-primary export-btn"
            onClick={onExport}
            disabled={!hasCv || saving || syncing}
          >
            {t(locale, "exportLabel")}
          </button>
        </div>

        <span className="topbar-divider" aria-hidden="true" />

        <span className="ui-lang" title={t(locale, "uiLanguageHint")}>
          <span className="ui-lang-icon" aria-hidden="true">
            🌐
          </span>
          <select
            className="lang-switcher"
            value={locale}
            onChange={(e) => onChangeLocale(e.target.value)}
            aria-label={t(locale, "uiLanguage")}
            title={t(locale, "uiLanguageHint")}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </option>
            ))}
          </select>
        </span>

        <ThemeToggle locale={locale} />

        <PublishMenu
          locale={locale}
          published={published}
          slug={publicSlug}
          indexable={publicIndexable}
          publicContact={publicContact}
          onPublicContactChange={onPublicContactChange}
          onPublishStateChange={onPublishStateChange}
          onEditPublicStyle={onEditPublicStyle}
        />

        {/* Share/embed lives on its OWN trigger, shown only once the page is live —
            the public link + the "Living CV" badge + QR. Keeps the Publish popover
            a focused on/off decision instead of a share dashboard. */}
        {published && publicSlug ? <ShareMenu locale={locale} slug={publicSlug} /> : null}

        {/* Funding ask — kept visible in the bar (brand yellow) but de-escalated:
            small, and parked at the far end away from the Export CTA so the two
            don't compete. Renders nothing unless a support URL is configured. */}
        <SupportLink locale={locale} />

        <AccountMenu
          userName={userName}
          locale={locale}
          researchConsent={researchConsent}
          digestOptIn={digestOptIn}
          digestContactEmail={digestContactEmail}
          digestContactEmailVerified={digestContactEmailVerified}
          accountEmail={accountEmail}
          signOutAction={signOutAction}
        />
      </div>
    </header>
  );
}
