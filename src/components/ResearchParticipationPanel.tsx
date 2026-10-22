"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { researchPanelStrings, type ResearchPanelStrings } from "@/lib/i18n/researchPanel";
import { ui } from "@/lib/i18n/ui";
import {
  APPROVED_CONSENT_LOCALES,
  consentLocaleFor,
  consentText,
  isConsentLocale,
  RESEARCH_CONSENT_VERSION,
  type ConsentLocale,
  type ConsentText,
} from "@/lib/research/consent";
import type { ConsentStatus } from "@/lib/research/consent/status";
import InformationSheet from "./InformationSheet";
import { useDialogFocus } from "./useDialogFocus";

const CONSENT_API = "/api/account/consent";
const RECORD_URL = "/api/account/consent/record";
const EXPORT_URL = "/api/account/export";

interface ResearchParticipationPanelProps {
  uiLocale: string;
  onClose: () => void;
}

type Load = "loading" | "error" | "ready";

/**
 * The one place to take part in, or stop taking part in, Nagoya University
 * study 2026-0310. Opened only by the person (the account menu, a link in the
 * editor): nothing here ever opens, nags or badges on its own, as the
 * protocol forbids soliciting. Nothing is pre-ticked; checkbox ① alone enables
 * the button. The consent text shows in an approved language (the UI's own,
 * else English, with a switch); the panel's own text follows the UI locale.
 * While the study is closed only the consent form goes: a person holding a
 * consent still sees it and can stop (GDPR Art. 7(3)).
 */
export default function ResearchParticipationPanel({
  uiLocale,
  onClose,
}: ResearchParticipationPanelProps) {
  const s = researchPanelStrings(uiLocale);
  const [load, setLoad] = useState<Load>("loading");
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [textLocale, setTextLocale] = useState<ConsentLocale>(consentLocaleFor(uiLocale));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmStop, setConfirmStop] = useState(false);
  const [stopped, setStopped] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, () => {
    if (!busy) onClose();
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(CONSENT_API, { cache: "no-store" });
      if (!res.ok) throw new Error(`consent status ${res.status}`);
      const next = (await res.json()) as ConsentStatus;
      setStatus(next);
      if (next.state === "current" && next.locale) setTextLocale(next.locale);
      setLoad("ready");
    } catch {
      setLoad("error");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function send(body: object): Promise<string | null> {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(CONSENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await refresh();
        return null;
      }
      const data = (await res.json().catch(() => ({}))) as { code?: string };
      return data.code === "stale_version"
        ? s.staleText
        : data.code === "closed"
          ? s.closed
          : s.saveError;
    } catch {
      return s.saveError;
    } finally {
      setBusy(false);
    }
  }

  async function grant(secondaryUse: boolean) {
    const failed = await send({
      consent: true,
      version: RESEARCH_CONSENT_VERSION,
      locale: textLocale,
      agreeRequired: true,
      secondaryUse,
    });
    if (failed) setError(failed);
    else setStopped(false);
  }

  async function withdraw() {
    const failed = await send({ consent: false, locale: textLocale });
    setConfirmStop(false);
    if (failed) setError(failed);
    else setStopped(true);
  }

  const text = consentText(textLocale);
  const current = status?.state === "current";
  const title = current || confirmStop ? s.heading : text.title;
  return (
    <div className="consent-overlay" role="presentation">
      <div
        className="research-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-panel-title"
        ref={dialogRef}
        tabIndex={-1}
        data-testid="research-panel"
      >
        <div className="research-panel-head">
          <h2 id="research-panel-title" lang={current || confirmStop ? uiLocale : textLocale}>
            {title}
          </h2>
          <button type="button" className="research-panel-close" onClick={onClose} disabled={busy}>
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">{s.close}</span>
          </button>
        </div>
        <LanguageSwitch s={s} value={textLocale} onChange={setTextLocale} uiLocale={uiLocale} />
        {load === "loading" ? <p className="muted">{s.loading}</p> : null}
        {load === "error" ? (
          <p className="consent-error" role="alert">
            {s.loadError}{" "}
            <button type="button" className="link-btn" onClick={() => void refresh()}>
              {s.retry}
            </button>
          </p>
        ) : null}
        {load === "ready" && status ? (
          confirmStop ? (
            <StopConfirm
              s={s}
              busy={busy}
              onStop={withdraw}
              onCancel={() => setConfirmStop(false)}
            />
          ) : current ? (
            <ParticipationStatus
              s={s}
              status={status}
              uiLocale={uiLocale}
              textLocale={textLocale}
              busy={busy}
              onStop={() => setConfirmStop(true)}
              onClose={onClose}
            />
          ) : !status.open ? (
            <ClosedStudy
              s={s}
              status={status}
              stopped={stopped}
              onStopStale={() => setConfirmStop(true)}
            />
          ) : (
            <ConsentForm
              key={textLocale}
              s={s}
              text={text}
              textLocale={textLocale}
              status={status}
              stopped={stopped}
              busy={busy}
              onTakePart={grant}
              onNotNow={onClose}
              onStopStale={() => setConfirmStop(true)}
            />
          )
        ) : null}
        {error ? (
          <p className="consent-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LanguageSwitch({
  s,
  value,
  onChange,
  uiLocale,
}: {
  s: ResearchPanelStrings;
  value: ConsentLocale;
  onChange: (next: ConsentLocale) => void;
  uiLocale: string;
}) {
  return (
    <div className="research-panel-lang">
      <div role="group" aria-label={s.languageLabel} className="research-panel-lang-switch">
        {APPROVED_CONSENT_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            lang={locale}
            className={`research-panel-lang-btn${locale === value ? " is-active" : ""}`}
            aria-pressed={locale === value}
            onClick={() => onChange(locale)}
          >
            {consentText(locale).languageName}
          </button>
        ))}
      </div>
      {isConsentLocale(uiLocale) ? null : <p className="muted">{s.languageNote}</p>}
    </div>
  );
}

interface ConsentFormProps {
  s: ResearchPanelStrings;
  text: ConsentText;
  textLocale: ConsentLocale;
  status: ConsentStatus;
  stopped: boolean;
  busy: boolean;
  onTakePart: (secondaryUse: boolean) => void;
  onNotNow: () => void;
  onStopStale: () => void;
}

function ConsentForm(props: ConsentFormProps) {
  const { s, text, textLocale, status, stopped, busy } = props;
  // Both unticked on every showing (never pre-ticked, never remembered).
  const [agree, setAgree] = useState(false);
  const [secondary, setSecondary] = useState(false);
  const stale = status.state === "stale";
  return (
    <>
      {stopped ? (
        <p className="research-panel-notice" role="status">
          {s.stopped}
        </p>
      ) : null}
      {stale ? (
        <p className="research-panel-notice">
          <span>{s.staleConsent}</span> <span>{s.agreeAgain}</span>
        </p>
      ) : null}
      <div lang={textLocale} className="research-panel-consent">
        <ul className="research-panel-summary">
          {text.summary.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <details className="research-panel-sheet">
          <summary>{text.readFullSheet}</summary>
          <InformationSheet sheet={text.sheet} level={3} />
        </details>
        <label className="research-panel-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            data-testid="research-agree"
          />
          <span>{text.agreeRequired}</span>
        </label>
        <label className="research-panel-check research-panel-check-optional">
          <input
            type="checkbox"
            checked={secondary}
            onChange={(e) => setSecondary(e.target.checked)}
            data-testid="research-secondary"
          />
          <span>{text.agreeSecondary}</span>
        </label>
        <ContactLine text={text} />
        <div className="consent-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!agree || busy}
            onClick={() => props.onTakePart(secondary)}
          >
            {text.takePart}
          </button>
          <button type="button" className="btn" onClick={props.onNotNow} disabled={busy}>
            {text.notNow}
          </button>
        </div>
      </div>
      <AfterLinks s={s} status={status} onStopStale={props.onStopStale} />
    </>
  );
}

/** Withdrawing an earlier consent, and the record, under the form or alone. */
function AfterLinks({
  s,
  status,
  onStopStale,
}: {
  s: ResearchPanelStrings;
  status: ConsentStatus;
  onStopStale: () => void;
}) {
  return (
    <p className="research-panel-links">
      {status.state === "stale" ? (
        <button type="button" className="link-btn" onClick={onStopStale}>
          {s.stopStale}
        </button>
      ) : null}
      {status.hasRecords ? (
        <a className="link-btn" href={RECORD_URL}>
          {s.recordLink}
        </a>
      ) : null}
    </p>
  );
}

/**
 * The study takes no participants: no consent form, nothing to tick. Someone
 * holding an earlier consent can still withdraw it, and read their record.
 */
function ClosedStudy({
  s,
  status,
  stopped,
  onStopStale,
}: {
  s: ResearchPanelStrings;
  status: ConsentStatus;
  stopped: boolean;
  onStopStale: () => void;
}) {
  return (
    <>
      {stopped ? (
        <p className="research-panel-notice" role="status">
          {s.stopped}
        </p>
      ) : null}
      <p className="research-panel-notice">{s.closed}</p>
      {status.state === "stale" ? <p>{s.staleConsent}</p> : null}
      <AfterLinks s={s} status={status} onStopStale={onStopStale} />
    </>
  );
}

function ContactLine({ text }: { text: ConsentText }) {
  return (
    <p className="research-panel-contact">
      {text.contactLead}
      {text.contacts.map((c) => (
        <span key={c.email} className="research-panel-contact-person">
          {c.label} <a href={`mailto:${c.email}`}>{c.email}</a>
        </span>
      ))}
    </p>
  );
}

interface ParticipationStatusProps {
  s: ResearchPanelStrings;
  status: ConsentStatus;
  uiLocale: string;
  textLocale: ConsentLocale;
  busy: boolean;
  onStop: () => void;
  onClose: () => void;
}

function ParticipationStatus({
  s,
  status,
  uiLocale,
  textLocale,
  busy,
  onStop,
  onClose,
}: ParticipationStatusProps) {
  const since = status.since
    ? new Intl.DateTimeFormat(uiLocale, { dateStyle: "long" }).format(new Date(status.since))
    : "";
  // The document as its own language names it (kept on one line: its date has
  // hyphens); the version integer stays in the record. With no document known,
  // the line without it, so no separator or particle is left hanging.
  const label = status.documentLabel;
  const [before, after = ""] = (label ? s.since : s.sinceOnly)
    .replace("{date}", since)
    .split("{document}");
  const sheetUrl = `/cv/research-sheet?lang=${encodeURIComponent(textLocale)}&ui=${encodeURIComponent(uiLocale)}`;
  return (
    <>
      <p className="research-panel-status" data-testid="research-status">
        {before}
        {label ? <span className="research-panel-doc">{label}</span> : null}
        {after}
      </p>
      <p className="muted">{status.secondaryUse ? s.secondaryYes : s.secondaryNo}</p>
      <ul className="research-panel-links research-panel-link-list">
        <li>
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
            {s.sheetLink}
          </a>
        </li>
        <li>
          <a href={RECORD_URL}>{s.recordLink}</a>
        </li>
        <li>
          <a href={EXPORT_URL}>{ui(uiLocale).exportData}</a>
        </li>
      </ul>
      <div className="consent-actions">
        <button type="button" className="btn" onClick={onStop} disabled={busy}>
          {s.stop}
        </button>
        <button type="button" className="btn" onClick={onClose} disabled={busy}>
          {s.close}
        </button>
      </div>
    </>
  );
}

function StopConfirm({
  s,
  busy,
  onStop,
  onCancel,
}: {
  s: ResearchPanelStrings;
  busy: boolean;
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="group" aria-labelledby="research-stop-title">
      <h3 id="research-stop-title">{s.stopTitle}</h3>
      <p>{s.stopBody}</p>
      <div className="consent-actions">
        <button type="button" className="btn btn-danger" onClick={onStop} disabled={busy}>
          {s.stop}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>
          {s.cancel}
        </button>
      </div>
    </div>
  );
}
