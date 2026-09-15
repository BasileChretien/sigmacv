"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  depositAction,
  depositNotes,
  depositReason,
  depositRoutes,
  shareYourPaperHref,
  type DepositBasis,
  type DepositRoute,
} from "@/lib/archiving/depositRoutes";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
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
  /** Whether a statutory rule is shown above this work (the "only if" wording names it). */
  hasStatutoryRight: boolean;
}

/**
 * The deposit action under one closed journal article: ONE place — verb,
 * destination link, one-clause reason — with what the recorded policy asks of the
 * form (licence, a running embargo), then the other places and ShareYourPaper
 * behind a disclosure, and a "Copy DOI" button for the form. Routes and wording
 * come from `lib/archiving/depositRoutes.ts` (the order is the rule; the words
 * never go beyond the publisher's record). A click sends one cookieless analytics
 * event carrying the route's kind only — never the DOI, the destination or
 * anything about the person.
 */
export default function WorklistDeposit({
  locale,
  cv,
  item,
  basis,
  currentCountry,
  crosswalk,
  hasStatutoryRight,
}: WorklistDepositProps) {
  const wu = workspaceUi(locale);
  const [copied, setCopied] = useState(false);
  const [primary, ...others] = depositRoutes(cv, item, { basis, currentCountry, crosswalk });
  if (!primary) return null;
  const doi = item.csl?.DOI?.trim() || undefined;
  const shareYourPaper = shareYourPaperHref(doi);
  const notes = depositNotes(item, primary, wu, locale, new Date().toISOString().slice(0, 10));
  const [before = "", after = ""] = wu.wlDepositLine.split("{action}");

  const link = (kind: string, href: string, text: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
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
  const copyDoi = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Back to "Copy DOI", like the other copy buttons, so a later copy is announced.
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="cv-worklist-deposit" data-worklist="deposit">
      <p className="cv-worklist-deposit-primary">
        {line(primary, depositAction(item, primary, wu, hasStatutoryRight))}
        {doi ? (
          <>
            {" "}
            <button
              type="button"
              className="cv-worklist-deposit-copy"
              aria-live="polite"
              onClick={() => void copyDoi(doi)}
            >
              {copied ? wu.wlDepositDoiCopied : wu.wlDepositCopyDoi}
            </button>
          </>
        ) : null}
      </p>
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
