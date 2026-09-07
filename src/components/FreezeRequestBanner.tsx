"use client";

import { useEffect, useState } from "react";
import {
  freezeRequestModelName,
  parseFreezeRequest,
  type FreezeRequest,
} from "@/lib/cv/freezeRequest";
import type { SnapshotSummary } from "@/lib/cv/snapshotStore";
import { snapshotStrings } from "@/lib/i18n/snapshots";
import { formatSnapshotDate } from "@/lib/render/diff";

interface FreezeRequestBannerProps {
  locale: string;
  published: boolean;
  slug: string | null;
}

const REQUEST_PARAMS = ["freeze", "preset", "label", "by"] as const;

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), template);
}

/**
 * The researcher's side of a STATELESS freeze request (`/cv?freeze=<model>&…`,
 * see `cv/freezeRequest.ts`): says exactly what the link asks for (shape, preset,
 * requested-by date), that nothing has been sent to whoever made it, and offers
 * the one-click freeze — an ordinary owner call to `POST /api/cv/snapshots`.
 * The query is parsed in the browser only and is never sent anywhere; "Not now"
 * drops it from the URL. Renders nothing without a valid request.
 */
export default function FreezeRequestBanner({ locale, published, slug }: FreezeRequestBannerProps) {
  const s = snapshotStrings(locale);
  const [req, setReq] = useState<FreezeRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<SnapshotSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      setReq(parseFreezeRequest(new URLSearchParams(window.location.search)));
    } catch {
      // No window / malformed URL: no request.
    }
  }, []);

  if (!req) return null;

  const modelName = freezeRequestModelName(req);
  const shape = modelName ?? s.requestNoModel;
  const presetLabel =
    req.preset === "reader"
      ? s.presetReader
      : req.preset === "hiring"
        ? s.presetHiring
        : s.presetStandard;
  const hint =
    req.preset === "reader" ? s.readerOptionHint : req.preset === "hiring" ? s.hiringHint : null;

  async function freeze() {
    if (!req) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/cv/snapshots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: req.label ?? modelName ?? s.requestDefaultLabel,
          ...(req.modelId ? { modelId: req.modelId } : {}),
          ...(req.preset ? { preset: req.preset } : {}),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { snapshot } = (await res.json()) as { snapshot: SnapshotSummary };
      setDone(snapshot);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setReq(null);
    try {
      const url = new URL(window.location.href);
      for (const k of REQUEST_PARAMS) url.searchParams.delete(k);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Leaving the params in place is harmless.
    }
  }

  const link =
    done && published && slug ? `${window.location.origin}/p/${slug}/v/${done.token}` : null;

  return (
    <aside className="sync-report-banner freeze-request" role="status" data-testid="freeze-request">
      <div className="sync-report-head">
        <strong>{s.requestTitle}</strong>
        <button
          type="button"
          className="btn btn-sm btn-ghost sync-report-dismiss"
          onClick={dismiss}
        >
          {s.requestDismiss}
        </button>
      </div>
      <p>
        {fill(s.requestBody, { shape, preset: presetLabel })}
        {req.by
          ? ` ${fill(s.requestBy, { date: formatSnapshotDate(`${req.by}T00:00:00.000Z`, locale) })}`
          : ""}{" "}
        {s.requestNothingSent}
      </p>
      {hint ? <p className="versions-hint">{hint}</p> : null}
      {done ? (
        <p>
          {fill(s.requestDone, { n: done.version })}{" "}
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer">
              {link}
            </a>
          ) : (
            s.notPublishedHint
          )}
        </p>
      ) : (
        <p className="publish-nudge-actions">
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy}
            onClick={() => void freeze()}
          >
            {busy ? s.creating : s.requestFreeze}
          </button>
        </p>
      )}
      {failed ? <p className="versions-hint">{s.actionFailed}</p> : null}
    </aside>
  );
}
