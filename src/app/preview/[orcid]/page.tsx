import type { Metadata } from "next";
import Link from "next/link";
import OrcidPreviewForm from "@/components/OrcidPreviewForm";
import PreviewBuilder from "@/components/PreviewBuilder";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { asLocale, DEFAULT_UI_LOCALE, type Locale } from "@/lib/i18n";
import { previewStrings } from "@/lib/i18n/preview";
import { normalizeOrcidForPreview } from "@/lib/cv/previewFromOrcid";
import { listAvailableStyles } from "@/lib/citeproc/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The preview builds live from ~20 upstream sources — never a static/cacheable
// route. en-US for now; a localized /[locale]/preview variant is a trivial later
// add (the copy already exists for all ten locales in i18n/preview.ts).
const LOCALE = DEFAULT_UI_LOCALE;

export function generateMetadata(): Metadata {
  return {
    title: previewStrings(LOCALE).metaTitle,
    // Ephemeral, generated on demand for ANY pasted ORCID: never index or follow.
    // Reinforced by the robots.txt `/preview` disallow.
    robots: { index: false, follow: false },
  };
}

interface PreviewPageProps {
  params: Promise<{ orcid: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const loc = asLocale(LOCALE);
  const s = previewStrings(loc);
  const { orcid: raw } = await params;

  // A malformed %-escape in the path segment makes decodeURIComponent throw; fall
  // back to the raw value so it flows into the invalid-iD notice, not a crash.
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  // Validate the iD shape + checksum here (cheap, DB-free); a malformed iD never
  // starts a build. The heavy work — the ~20-source build + citeproc render — is
  // driven client-side by <PreviewBuilder> against the rate-limited, same-origin
  // /api/preview/build stream, so it can show the sources resolving live.
  const orcid = normalizeOrcidForPreview(decoded);
  if (!orcid) {
    return <PreviewNotice locale={loc} heading={s.invalidHeading} body={s.invalidBody} />;
  }

  // `loading.tsx` covers the brief moment while this client component boots and
  // opens the stream; the builder then shows the live search and finally mounts
  // the interactive editor (whose editor pane carries the settled provenance panel).
  return <PreviewBuilder orcid={orcid} locale={loc} availableStyles={listAvailableStyles()} />;
}

/** Centred notice for a malformed iD — offers the paste-your-ORCID form again.
 *  The no-record / transient-error / rate-limited states are surfaced by
 *  {@link PreviewBuilder} instead (they're only known once the stream runs). */
function PreviewNotice({
  locale,
  heading,
  body,
}: {
  locale: Locale;
  heading: string;
  body: string;
}) {
  const s = previewStrings(locale);
  return (
    <div className="site-shell" lang={locale}>
      <SiteHeader locale={locale} />
      <main className="doc-page" id="site-main">
        <div className="preview-empty">
          <h1>{heading}</h1>
          <p>{body}</p>
          <OrcidPreviewForm locale={locale} />
          <p className="doc-back muted">
            <Link href="/">{s.back}</Link>
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
