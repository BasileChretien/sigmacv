"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  indexingWorklistState,
  isIndexingPromptDismissed,
  postIndexing,
  rememberIndexingPromptDismissal,
} from "@/lib/cv/indexingPrompt";
import type { PublishSnapshot } from "@/lib/cv/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { indexingPromptStrings } from "@/lib/i18n/indexingPrompt";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { localePrivacyPath } from "@/lib/seo";
import { PUBLISH_TRIGGER, openTopBarMenu } from "./menuTriggers";

interface IndexingRowProps {
  locale: string;
  state: PublishSnapshot;
  onPublishStateChange: (next: PublishSnapshot) => void;
}

/**
 * The worklist's "Search indexing" row — a STATUS line, never a gap: counted
 * in no figure, it reads as no task. Hidden while the page is not published.
 * Not decided / off → the state, the prompt's own disclosure, its "What this
 * means" link and the same one-request "Yes" control. On → "On …" with a
 * "Change" link into the Publish menu. The choice stays visible here after a
 * "Not now" so silence never becomes the answer by default.
 */
export default function IndexingRow({ locale, state, onPublishStateChange }: IndexingRowProps) {
  const s = indexingPromptStrings(locale);
  const u = ui(locale);
  const wu = workspaceUi(locale);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setDismissed(isIndexingPromptDismissed(state.slug));
  }, [state.slug, state.indexable]);

  const kind = indexingWorklistState(state, dismissed);
  if (kind === "unpublished") return null;

  const yes = async () => {
    setBusy(true);
    setError("");
    const next = await postIndexing(state);
    setBusy(false);
    if (!next) {
      setError(u.publishError);
      return;
    }
    rememberIndexingPromptDismissal(state.slug);
    onPublishStateChange(next);
    trackEvent("Publish", { indexable: true });
  };

  const status =
    kind === "on" ? wu.wlIndexingOn : kind === "off" ? wu.wlIndexingOff : wu.wlIndexingUndecided;

  return (
    <section
      className="cv-worklist-group cv-worklist-listing"
      data-worklist="indexing"
      data-testid="worklist-indexing"
      data-state={kind}
    >
      <h4>{wu.wlIndexingHeading}</h4>
      <p className="muted">{wu.wlIndexingHelp}</p>
      <p className="cv-worklist-listing-status">
        {status}{" "}
        <button
          type="button"
          className="link-btn"
          onClick={() => openTopBarMenu(PUBLISH_TRIGGER)}
          aria-label={`${wu.wlListingChange}: ${wu.wlIndexingHeading}`}
        >
          {wu.wlListingChange}
        </button>
      </p>
      {kind !== "on" ? (
        <div className="cv-worklist-listing-status">
          <p className="muted">
            {s.what}{" "}
            <a href={localePrivacyPath(locale)} target="_blank" rel="noopener noreferrer">
              {s.learnMore}
            </a>
          </p>
          {error ? (
            <p className="consent-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="btn btn-sm"
            onClick={yes}
            disabled={busy}
            data-testid="worklist-indexing-yes"
          >
            {s.yes}
          </button>
        </div>
      ) : null}
    </section>
  );
}
