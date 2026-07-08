import { asLocale, DEFAULT_UI_LOCALE } from "@/lib/i18n";
import { previewStrings } from "@/lib/i18n/preview";

/**
 * Instant loading UI for /preview/[orcid]. Building a preview fetches ~20 upstream
 * sources and runs a CPU-heavy citeproc render, which can take a few seconds — so
 * Next renders this Suspense fallback the moment a visitor navigates from the
 * "Preview my CV" form (a client `router.push`), acknowledging the click instead
 * of leaving the previous page frozen with no feedback. A branded spinner + a
 * "this takes a few seconds" line set the expectation. en-US for now, matching the
 * page itself (the copy already exists for all ten locales in i18n/preview.ts).
 */
export default function PreviewLoading() {
  const loc = asLocale(DEFAULT_UI_LOCALE);
  const s = previewStrings(loc);
  return (
    <div className="preview-loading" lang={loc} role="status" aria-live="polite">
      <div className="preview-loading-card">
        <span className="preview-loading-badge" aria-hidden="true">
          <span className="preview-loading-mark">Σ</span>
        </span>
        <h1 className="preview-loading-title">{s.loadingTitle}</h1>
        <p className="preview-loading-body">{s.loadingBody}</p>
      </div>
    </div>
  );
}
