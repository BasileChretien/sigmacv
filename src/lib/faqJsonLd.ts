/**
 * FAQPage JSON-LD builder. Turns the FAQ question/answer pairs into a
 * schema.org FAQPage block so search engines can surface the answers directly.
 *
 * Returns the FULL `<script type="application/ld+json">…</script>` element as a
 * string, ready to drop into `dangerouslySetInnerHTML`. The JSON payload has
 * "<" escaped to "<" (see publicJsonLd.ts) so it is safe to embed even if a
 * question or answer contained "</script>".
 */
import { serializeJsonLd } from "@/lib/jsonLd";

export function faqPageJsonLd(items: { q: string; a: string }[]): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  return `<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`;
}
