"use client";

import { useEffect, useState } from "react";
import type { CvSection } from "@/lib/canonical/schema";
import { narrativeAiStrings } from "@/lib/i18n/narrativeAi";

interface NarrativeAiDraftProps {
  section: CvSection;
  /** Interface language. */
  locale: string;
  /** Insert the accepted draft into the section body (parent owns the CV). */
  onInsert: (text: string) => void;
}

type Phase = "idle" | "config" | "loading" | "result" | "error";

// Only the NON-secret parts of the user's provider config are persisted (so they
// pre-fill next time). The API KEY is deliberately NOT stored — it lives in React
// state for this session only and is gone on reload, so there's no clear-text key
// at rest for XSS or a shared browser to lift. Everything is sent per-request to
// our stateless relay, which forwards it to the chosen endpoint and keeps nothing.
const LS = {
  baseUrl: "sigmacv.ai.baseUrl",
  model: "sigmacv.ai.model",
} as const;

// Editable starting defaults so a user only needs to paste a key for the common
// case — NOT a locked preset: both fields stay fully editable for any provider.
const DEFAULT_BASE_URL = "https://api.mistral.ai/v1";
const DEFAULT_MODEL = "open-mistral-nemo";

/**
 * Optional AI first-draft for a narrative-CV module — BRING-YOUR-OWN-KEY. The user
 * supplies their own OpenAI-compatible provider (base URL + model + key) and it is
 * sent per draft request. The base URL + model are remembered in the browser; the
 * KEY is held only in memory for the session (never written to storage). SigmaCV
 * holds no key, presets no provider, and never auto-inserts — the draft is always
 * labelled "verify and rewrite" and inserted only on an explicit click.
 */
export default function NarrativeAiDraft({ section, locale, onInsert }: NarrativeAiDraftProps) {
  const s = narrativeAiStrings(locale);
  const [phase, setPhase] = useState<Phase>("idle");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  // Load the remembered (non-secret) endpoint + model AFTER hydration (so the
  // server and first client render match). The key is never loaded — it starts
  // empty every session and the user re-enters it.
  useEffect(() => {
    try {
      setBaseUrl(localStorage.getItem(LS.baseUrl) || DEFAULT_BASE_URL);
      setModel(localStorage.getItem(LS.model) || DEFAULT_MODEL);
    } catch {
      // localStorage unavailable (private mode) — fall back to the editable defaults.
      setBaseUrl(DEFAULT_BASE_URL);
      setModel(DEFAULT_MODEL);
    }
  }, []);

  const ready = Boolean(baseUrl.trim() && model.trim() && apiKey.trim());

  // Persist only the non-secret endpoint + model. The key is intentionally omitted
  // — it stays in memory for this session and is never written to storage.
  function persist() {
    try {
      localStorage.setItem(LS.baseUrl, baseUrl.trim());
      localStorage.setItem(LS.model, model.trim());
    } catch {
      /* ignore — a failed save just means the config isn't remembered. */
    }
  }

  // Clear the in-memory key immediately (e.g. on a shared computer, without waiting
  // for the session to end). Nothing to remove from storage — it was never saved.
  function forget() {
    setApiKey("");
  }

  async function generate() {
    if (!ready) return;
    persist();
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/cv/narrative-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: section.type,
          consented: true,
          baseUrl: baseUrl.trim(),
          model: model.trim(),
          apiKey: apiKey.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { draft?: string; error?: string };
      if (!res.ok || typeof data.draft !== "string") {
        setError(data.error || s.error);
        setPhase("error");
        return;
      }
      setDraft(data.draft);
      setPhase("result");
    } catch {
      setError(s.error);
      setPhase("error");
    }
  }

  if (phase === "idle") {
    return (
      <div className="narrative-ai">
        <button
          type="button"
          className="btn btn-small narrative-ai-open"
          onClick={() => setPhase("config")}
        >
          ✦ {s.button}
        </button>
      </div>
    );
  }

  return (
    <div className="narrative-ai narrative-ai-panel">
      {phase === "config" || phase === "error" ? (
        <>
          <p className="muted narrative-ai-consent">{s.consent}</p>
          <label className="field narrative-ai-field">
            <span className="muted">{s.baseUrlLabel}</span>
            <input
              type="url"
              value={baseUrl}
              placeholder="https://api.mistral.ai/v1"
              autoComplete="off"
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </label>
          <label className="field narrative-ai-field">
            <span className="muted">{s.modelLabel}</span>
            <input
              type="text"
              value={model}
              placeholder="open-mistral-nemo"
              autoComplete="off"
              aria-describedby="narrative-ai-model-hint"
              onChange={(e) => setModel(e.target.value)}
            />
          </label>
          <p id="narrative-ai-model-hint" className="field-hint muted narrative-ai-model-hint">
            {s.modelHint}
          </p>
          <label className="field narrative-ai-field">
            <span className="muted">{s.apiKeyLabel}</span>
            <input
              type="password"
              value={apiKey}
              autoComplete="off"
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
          <p className="field-hint muted narrative-ai-stored">
            {s.storedNote} {s.keyHint}
          </p>
          {phase === "error" ? (
            <p className="narrative-ai-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="narrative-ai-actions">
            <button type="button" className="btn btn-small" disabled={!ready} onClick={generate}>
              {s.generate}
            </button>
            {ready ? (
              <button type="button" className="btn btn-small btn-ghost" onClick={forget}>
                {s.forgetKey}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-small btn-ghost narrative-ai-cancel"
              onClick={() => setPhase("idle")}
            >
              {s.cancel}
            </button>
          </div>
        </>
      ) : null}

      {phase === "loading" ? (
        <p className="muted narrative-ai-loading" aria-live="polite">
          {s.loading}
        </p>
      ) : null}

      {phase === "result" ? (
        <>
          <p className="narrative-ai-label">
            <span className="narrative-ai-badge" aria-hidden="true">
              ✦
            </span>{" "}
            {s.disclaimer}
          </p>
          <textarea
            className="narrative-ai-draft"
            readOnly
            rows={6}
            value={draft}
            aria-label={s.disclaimer}
          />
          <div className="narrative-ai-actions">
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                onInsert(draft);
                setPhase("idle");
              }}
            >
              {s.insert}
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={generate}>
              {s.regenerate}
            </button>
            <button
              type="button"
              className="btn btn-small btn-ghost narrative-ai-cancel"
              onClick={() => setPhase("idle")}
            >
              {s.discard}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
