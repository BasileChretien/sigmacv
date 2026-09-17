"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  depositAction,
  depositActionVersion,
  depositNotes,
  FILE_TO_UPLOAD,
  depositReason,
  depositRoutes,
  shareYourPaperHref,
  type DepositBasis,
  type DepositRoute,
} from "@/lib/archiving/depositRoutes";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { isoToday, type DepositNow } from "@/lib/archiving/depositNow";
import type { FunderRow } from "@/lib/funders/join";
import type { Locale } from "@/lib/i18n";
import { fill } from "@/lib/i18n/fill";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

interface WorklistDepositProps {
  locale: Locale;
  cv: CanonicalCv;
  /** A closed journal article. */
  item: CvItem;
  /** Route by the affiliation on the paper, or the owner's current one. */
  basis: DepositBasis;
  /** ISO-3166 code of the owner's current affiliation, when known. */
  currentCountry?: string;
  /** The owner's funder crosswalk keyed by short OpenAlex funder id. */
  crosswalk: ReadonlyMap<string, FunderRow>;
  /** The ground the deposit rests on today; a statutory ground names the accepted manuscript. */
  now?: DepositNow;
  /** Today as an ISO date — the panel's one clock, so the notes and the rows agree. */
  today?: string;
  /** Whether a statutory rule is shown for this work (the "only if" wording names it). */
  hasStatutoryRight: boolean;
  /**
   * Which half to render. "action": the one line the owner sees at once — verb,
   * destination link, one-clause reason, Copy DOI. "details": what the record asks
   * of the form and the other places, behind the row's disclosure. The panel
   * renders both, around the rights lines; each half computes the routes itself
   * (pure and cheap) rather than passing them through.
   */
  part: "action" | "details";
  /** After the DOI is copied: the panel announces it once, in its single status
   *  region — not a live region per button. */
  onCopied?: (message: string) => void;
  /** id of the panel's hidden "opens in a new tab" note, described-by every link. */
  newTabDescribedBy?: string;
}

/**
 * The deposit action under one closed journal article: ONE place — verb,
 * destination link, one-clause reason — with a "Copy DOI" button (the "action"
 * half, always visible), and what the recorded policy asks of the form plus the
 * other places and ShareYourPaper (the "details" half, behind the row's
 * disclosure with the rights lines). Routes and wording come from
 * `lib/archiving/depositRoutes.ts` (the order is the rule; the words never go
 * beyond the publisher's record). A click sends one cookieless analytics event
 * carrying the route's kind only; Plausible's own outbound-link event for the
 * same click keeps the destination's origin alone, never a path that carries a
 * DOI (`lib/analytics/plausibleInit.ts`).
 */
export default function WorklistDeposit({
  locale,
  cv,
  item,
  basis,
  currentCountry,
  crosswalk,
  hasStatutoryRight,
  now,
  today = isoToday(),
  part,
  onCopied,
  newTabDescribedBy,
}: WorklistDepositProps) {
  const wu = workspaceUi(locale);
  const [copied, setCopied] = useState(false);
  const [primary, ...others] = depositRoutes(cv, item, { basis, currentCountry, crosswalk });
  if (!primary) return null;
  const doi = item.csl?.DOI?.trim() || undefined;
  const shareYourPaper = shareYourPaperHref(doi);
  const [before = "", after = ""] = wu.wlDepositLine.split("{action}");

  const link = (kind: string, href: string, text: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={newTabDescribedBy}
      onClick={() => trackEvent("Deposit route", { kind })}
    >
      {text}
    </a>
  );
  const line = (route: DepositRoute, text: string) => (
    <>
      {before}
      {link(route.kind, route.href, text)}
      {fill(after, { reason: depositReason(route, wu, locale) })}
    </>
  );

  if (part === "action") {
    const copyDoi = async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopied?.(wu.wlDepositDoiCopied);
        // Back to "Copy DOI", like the other copy buttons, so a later copy shows again.
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    };
    // Which file: the author's own manuscript or the publisher's PDF, in plain words.
    const version = depositActionVersion(item, primary, now);
    return (
      <div className="cv-worklist-deposit" data-worklist="deposit">
        <p className="cv-worklist-deposit-primary">
          {line(primary, depositAction(item, primary, wu, hasStatutoryRight, now))}
          {doi ? (
            <>
              {" "}
              <button
                type="button"
                className="cv-worklist-deposit-copy"
                onClick={() => void copyDoi(doi)}
              >
                {copied ? wu.wlDepositDoiCopied : wu.wlDepositCopyDoi}
              </button>
            </>
          ) : null}
        </p>
        {version ? (
          <p className="cv-worklist-file" data-worklist="file">
            <strong>{wu.wlFileLabel}</strong>
            {wu[FILE_TO_UPLOAD[version]]}
          </p>
        ) : null}
      </div>
    );
  }

  const notes = depositNotes(item, primary, wu, locale, today, now);
  if (!hasDepositDetails(item, [primary, ...others], locale, now, today)) return null;
  return (
    <div
      className="cv-worklist-deposit cv-worklist-deposit-details"
      data-worklist="deposit-details"
    >
      {notes.length > 0 ? (
        <p className="muted cv-worklist-deposit-notes">{notes.join(" ")}</p>
      ) : null}
      {others.length > 0 || shareYourPaper ? (
        <details className="cv-worklist-deposit-others">
          <summary>{wu.wlDepositOtherPlaces}</summary>
          <ul>
            {others.map((route) => (
              <li key={route.href}>{line(route, route.destination)}</li>
            ))}
            {shareYourPaper ? (
              <li>
                {before}
                {link("shareyourpaper", shareYourPaper, "ShareYourPaper")}
                {fill(after, { reason: wu.wlDepositShareYourPaper })}
              </li>
            ) : null}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/**
 * Whether the details half has anything to show for these routes — form notes,
 * other places, or ShareYourPaper. The panel asks before rendering a row's
 * disclosure, so the owner never opens an empty one.
 */
export function hasDepositDetails(
  item: CvItem,
  routes: readonly DepositRoute[],
  locale: Locale,
  now?: DepositNow,
  today: string = isoToday(),
): boolean {
  const [primary, ...others] = routes;
  if (!primary) return false;
  if (others.length > 0 || shareYourPaperHref(item.csl?.DOI?.trim() || undefined)) return true;
  return depositNotes(item, primary, workspaceUi(locale), locale, today, now).length > 0;
}
