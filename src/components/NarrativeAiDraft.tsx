"use client";

import { useState } from "react";
import type { CvSection } from "@/lib/canonical/schema";
import { narrativeAiStrings } from "@/lib/i18n/narrativeAi";

interface NarrativeAiDraftProps {
  section: CvSection;
  /** Interface language. */
  locale: string;
  /** Insert the accepted draft into the section body (parent owns the CV). */
  onInsert: (text: string) => void;
}

type Phase = "idle" | "consent" | "loading" | "result" | "error";

/**
 * Optional AI first-draft affordance for a narrative-CV module. Off unless the
 * deployment configured an (EU) provider — the parent renders this only then, and
 * only in the signed-in editor. Flow: button → point-of-use consent disclosure →
 * generate → labelled draft the user explicitly inserts (or discards). The draft
 * is never auto-inserted; it always carries the "verify and rewrite" label.
 */
export default function NarrativeAiDraft({ section, locale, onInsert }: NarrativeAiDraftProps) {
  const s = narrativeAiStrings(locale);
  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/cv/narrative-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType: section.type, consented: true }),
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
          onClick={() => setPhase("consent")}
        >
          ✦ {s.button}
        </button>
      </div>
    );
  }

  return (
    <div className="narrative-ai narrative-ai-panel">
      {phase === "consent" ? (
        <>
          <p className="muted narrative-ai-consent">{s.consent}</p>
          <div className="narrative-ai-actions">
            <button type="button" className="btn btn-small" onClick={generate}>
              {s.generate}
            </button>
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

      {phase === "error" ? (
        <>
          <p className="narrative-ai-error" role="alert">
            {error}
          </p>
          <div className="narrative-ai-actions">
            <button type="button" className="btn btn-small" onClick={generate}>
              {s.regenerate}
            </button>
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
