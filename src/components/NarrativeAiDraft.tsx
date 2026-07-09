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

// The user's own provider config — held ONLY in this browser (localStorage), never
// on our servers. Sent per-request to our stateless relay, which forwards it to
// the endpoint the user chose and keeps nothing.
const LS = {
  baseUrl: "sigmacv.ai.baseUrl",
  model: "sigmacv.ai.model",
  apiKey: "sigmacv.ai.apiKey",
} as const;

/**
 * Optional AI first-draft for a narrative-CV module — BRING-YOUR-OWN-KEY. The user
 * supplies their own OpenAI-compatible provider (base URL + model + key); it is
 * stored only in their browser and sent per draft request. SigmaCV holds no key,
 * presets no provider, and never auto-inserts — the draft is always labelled
 * "verify and rewrite" and inserted only on an explicit click.
 */
export default function NarrativeAiDraft({ section, locale, onInsert }: NarrativeAiDraftProps) {
  const s = narrativeAiStrings(locale);
  const [phase, setPhase] = useState<Phase>("idle");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  // Load any previously-entered config from the browser AFTER hydration (so the
  // server and first client render match).
  useEffect(() => {
    try {
      setBaseUrl(localStorage.getItem(LS.baseUrl) ?? "");
      setModel(localStorage.getItem(LS.model) ?? "");
      setApiKey(localStorage.getItem(LS.apiKey) ?? "");
    } catch {
      /* localStorage unavailable (private mode) — the fields just start empty. */
    }
  }, []);

  const ready = Boolean(baseUrl.trim() && model.trim() && apiKey.trim());

  function persist() {
    try {
      localStorage.setItem(LS.baseUrl, baseUrl.trim());
      localStorage.setItem(LS.model, model.trim());
      localStorage.setItem(LS.apiKey, apiKey.trim());
    } catch {
      /* ignore — a failed save just means the config isn't remembered. */
    }
  }

  function forget() {
    try {
      for (const k of Object.values(LS)) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    setBaseUrl("");
    setModel("");
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
              onChange={(e) => setModel(e.target.value)}
            />
          </label>
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
