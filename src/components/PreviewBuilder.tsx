"use client";

import { useEffect, useRef, useState } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { displaySource, type SourceGroup } from "@/lib/cv/sourceSummary";
import { signInWithOrcid } from "@/app/auth-actions";
import { asLocale, t } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { previewStrings } from "@/lib/i18n/preview";
import { sourceProvenanceStrings } from "@/lib/i18n/sourceProvenance";
import PreviewWorkspace from "./PreviewWorkspace";
import SignInButton from "./SignInButton";

interface PreviewBuilderProps {
  orcid: string;
  locale: string;
  availableStyles: string[];
}

/** One display source resolving live (counts fold in as ticks arrive). */
interface LiveRow {
  label: string;
  count: number;
  group: SourceGroup;
}

interface OkResult {
  name: string;
  html: string;
  cv: CanonicalCv;
  sourceCounts?: Record<string, number>;
}

type Phase = "searching" | "ready" | "empty" | "error" | "rate";

/**
 * The no-login preview's LIVE builder. Opens the `/api/preview/build` NDJSON
 * stream and shows each of the ~20 open sources resolving one-by-one (fastest
 * first) — the branded Σ keeps spinning while slower sources are still out — then
 * hands the finished CV to the interactive {@link PreviewWorkspace}, whose editor
 * pane carries the settled provenance panel. All client-side: no data is
 * persisted, and the underlying build is cached + rate-limited server-side.
 */
export default function PreviewBuilder({ orcid, locale, availableStyles }: PreviewBuilderProps) {
  const loc = asLocale(locale);
  const s = previewStrings(loc);
  const sp = sourceProvenanceStrings(loc);
  const [phase, setPhase] = useState<Phase>("searching");
  const [rows, setRows] = useState<LiveRow[]>([]);
  const [result, setResult] = useState<OkResult | null>(null);
  // Bumped by "Try again" to re-run the stream after a transient failure.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setPhase("searching");
    setRows([]);
    setResult(null);

    const addSource = (source: string, count: number) => {
      const d = displaySource(source);
      if (!d) return; // prerequisites / owner-identity / unknown keys aren't sources
      setRows((prev) => {
        const i = prev.findIndex((r) => r.label === d.label);
        if (i < 0) return [...prev, { label: d.label, count, group: d.group }];
        const next = prev.slice();
        next[i] = { ...next[i]!, count: next[i]!.count + count };
        return next;
      });
    };

    (async () => {
      try {
        const res = await fetch("/api/preview/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orcid }),
          signal: controller.signal,
        });
        if (res.status === 429) return void (!cancelled && setPhase("rate"));
        if (!res.ok || !res.body) return void (!cancelled && setPhase("error"));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line || cancelled) continue;
            let evt: {
              type?: string;
              source?: string;
              count?: number;
              status?: string;
            } & Partial<OkResult>;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            if (evt.type === "source" && typeof evt.source === "string") {
              addSource(evt.source, typeof evt.count === "number" ? evt.count : 0);
            } else if (evt.type === "done") {
              if (evt.status === "ok" && evt.cv && typeof evt.html === "string") {
                setResult({
                  name: evt.name ?? "",
                  html: evt.html,
                  cv: evt.cv,
                  sourceCounts: evt.sourceCounts,
                });
                setPhase("ready");
              } else {
                setPhase(evt.status === "empty" ? "empty" : "error");
              }
            }
          }
        }
        // Stream closed without an ok/empty/error verdict → treat as retryable.
        if (!cancelled) setPhase((p) => (p === "searching" ? "error" : p));
      } catch {
        // AbortError on unmount is expected; any other failure is retryable.
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [orcid, attempt]);

  if (phase === "ready" && result) {
    return (
      <PreviewWorkspace
        initialCv={result.cv}
        initialHtml={result.html}
        name={result.name}
        locale={loc}
        availableStyles={availableStyles}
        sourceCounts={result.sourceCounts}
      />
    );
  }

  if (phase === "empty" || phase === "error" || phase === "rate") {
    const heading =
      phase === "empty" ? s.emptyHeading : phase === "rate" ? s.rateLimitedHeading : s.errorHeading;
    const body =
      phase === "empty" ? s.emptyBody : phase === "rate" ? s.rateLimitedBody : s.errorBody;
    return (
      <div className="preview-builder-notice" lang={loc}>
        <div className="preview-empty">
          <h1>{heading}</h1>
          <p>{body}</p>
          {phase === "empty" ? (
            <form action={signInWithOrcid}>
              <SignInButton
                method="orcid"
                className="hp2-btn hp2-btn-primary"
                pendingLabel={landingStrings(loc).signingIn}
              >
                {s.ctaSignIn}
              </SignInButton>
            </form>
          ) : (
            <button type="button" className="hp2-btn" onClick={() => setAttempt((a) => a + 1)}>
              {t(loc, "syncRetry")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const total = rows.reduce((n, r) => n + r.count, 0);
  return (
    <div className="src-search" lang={loc} role="status" aria-live="polite">
      <div className="src-search-card">
        <div className="src-search-head">
          <span className="src-search-badge" aria-hidden="true">
            <span className="src-search-ring" />
            <span className="src-search-mark">Σ</span>
          </span>
          <div className="src-search-htext">
            <div className="src-search-title">{sp.searching}</div>
            <div className="src-search-sub">{s.builtFromPublic}</div>
          </div>
          <div className="src-search-tally">
            <div className="src-search-tallynum">{total}</div>
            <div className="src-search-tallylbl">{sp.title}</div>
          </div>
        </div>
        <ul className="src-search-list">
          {rows.map((r) => (
            <li key={r.label} className="src-search-row">
              <span
                className={`src-search-dot${r.count > 0 ? " is-found" : ""}`}
                aria-hidden="true"
              />
              <span className="src-search-name">{r.label}</span>
              {r.group === "review" ? (
                <span className="src-search-tag">{t(loc, "reviewBadge")}</span>
              ) : null}
              <span className="src-search-right">
                {r.count > 0 ? (
                  <span className="src-search-count">{r.count}</span>
                ) : (
                  <span className="src-search-none">{sp.noMatches}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
