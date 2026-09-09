import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { objectionStrings } from "@/lib/i18n/objection";
import type { ObjectionOutcome } from "@/lib/auth/objection";
import { localeHomePath, localeObjectPath } from "@/lib/seo";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/** Landing page of the objection round trip: the outcome, nothing about the iD. */
export default function ObjectionDone({
  locale,
  outcome,
}: {
  locale: string;
  outcome: ObjectionOutcome;
}) {
  const loc = asLocale(locale);
  const s = objectionStrings(loc);
  const heading =
    outcome === "suppressed"
      ? s.doneSuppressedHeading
      : outcome === "unavailable"
        ? s.doneUnavailableHeading
        : s.doneFailedHeading;
  const body =
    outcome === "suppressed"
      ? s.doneSuppressedBody
      : outcome === "unavailable"
        ? s.doneUnavailableBody
        : s.doneFailedBody;
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <h1 data-testid="objection-outcome" data-outcome={outcome}>
          {heading}
        </h1>
        <p>{body}</p>
        {outcome === "failed" ? (
          <p>
            <Link className="hp2-btn" href={localeObjectPath(loc)}>
              {s.tryAgain}
            </Link>
          </p>
        ) : null}
        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.back}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
