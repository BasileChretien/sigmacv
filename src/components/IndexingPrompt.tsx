"use client";

import { useEffect, useId, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  isIndexingPromptDismissed,
  postIndexing,
  rememberIndexingPromptDismissal,
  shouldOfferIndexingPrompt,
} from "@/lib/cv/indexingPrompt";
import type { PublishSnapshot } from "@/lib/cv/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { indexingPromptStrings } from "@/lib/i18n/indexingPrompt";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { localePrivacyPath } from "@/lib/seo";
import { PUBLISH_TRIGGER, openTopBarMenu } from "./menuTriggers";

interface IndexingPromptProps {
  locale: string;
  /** The publish state the host tracks (seeded server-side, refreshed after
   *  each publish change, save and sync). */
  state: PublishSnapshot;
  /** Held back while another one-time prompt is on screen (they never stack). */
  suppressed?: boolean;
  /** The server answered a "yes": keep the host's state in lockstep. */
  onPublishStateChange: (next: PublishSnapshot) => void;
  /** Answered either way: let the onboarding queue move on. */
  onDismissed?: () => void;
}

/**
 * The one-time, inline "Should search engines index your page?" card — an
 * ASK, not a default. OWNER ONLY. Shown when the page is live and not yet
 * indexable, until the researcher answers: "Yes" (one request, the full
 * request that turns indexing on and touches nothing else) or "Not now" (sends
 * nothing, remembered per page for as long as it exists). Two buttons of equal weight; a
 * "What this means" link to the privacy notice; one sentence saying the
 * institution listing is a SEPARATE choice, asked next — never folded in here.
 * Not a dialog: a labelled section that steals no focus.
 */
export default function IndexingPrompt({
  locale,
  state,
  suppressed = false,
  onPublishStateChange,
  onDismissed,
}: IndexingPromptProps) {
  const s = indexingPromptStrings(locale);
  const u = ui(locale);
  const wu = workspaceUi(locale);
  const titleId = useId();
  const statusId = useId();
  const slug = state.slug;
  // Client-only gate so a remembered answer never flashes the card (and SSR
  // stays inert); re-read whenever the PAGE (its slug) changes.
  const [checked, setChecked] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setDismissed(isIndexingPromptDismissed(slug));
    setChecked(slug);
    setDone(false);
  }, [slug]);

  const asking = !suppressed && checked === slug && shouldOfferIndexingPrompt(state, dismissed);
  // Unlike the institution card (the LAST onboarding step), this one has a
  // successor: a "yes" can make the institution ask active at once. So the
  // confirmation yields to whatever prompt the queue shows next — nothing ever
  // stacks — and stays only while no other prompt is up.
  if (suppressed || (!done && !asking)) return null;

  const notNow = () => {
    rememberIndexingPromptDismissal(slug);
    setDismissed(true);
    onDismissed?.();
  };
  const yes = async () => {
    setBusy(true);
    setError("");
    const next = await postIndexing(state);
    setBusy(false);
    if (!next) {
      setError(u.publishError);
      return;
    }
    // Answered: never ask again for this page (a later "off" is set in the
    // Publish menu, and this page is not asked again).
    rememberIndexingPromptDismissal(slug);
    onPublishStateChange(next);
    // Cookieless product signal, the same one the Publish menu sends. No identifiers.
    trackEvent("Publish", { indexable: true });
    setDone(true);
    onDismissed?.();
  };

  return (
    <section
      className="institution-prompt indexing-prompt"
      aria-labelledby={done ? statusId : titleId}
      data-testid="indexing-prompt"
    >
      {/* The live region is rendered from the start and its CONTENT swapped, so
          a screen reader announces the confirmation when it arrives. */}
      <p id={statusId} className="institution-prompt-listed" role="status">
        {done ? s.done : ""}
      </p>
      {done ? (
        <div className="institution-prompt-actions">
          <button
            type="button"
            className="link-btn"
            onClick={() => openTopBarMenu(PUBLISH_TRIGGER)}
          >
            {wu.wlListingChange}
          </button>
        </div>
      ) : (
        <>
          <h2 id={titleId} className="institution-prompt-title">
            {s.heading}
          </h2>
          <p>{s.what}</p>
          <p>{s.nothingUntil}</p>
          <p>{s.withdraw}</p>
          <p className="muted">{s.separate}</p>
          {error ? (
            <p className="consent-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="institution-prompt-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={yes}
              disabled={busy}
              data-testid="indexing-prompt-yes"
            >
              {s.yes}
            </button>
            <button
              type="button"
              className="btn"
              onClick={notNow}
              disabled={busy}
              data-testid="indexing-prompt-not-now"
            >
              {s.notNow}
            </button>
            <a
              className="institution-prompt-more"
              href={localePrivacyPath(locale)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.learnMore}
            </a>
          </div>
        </>
      )}
    </section>
  );
}
