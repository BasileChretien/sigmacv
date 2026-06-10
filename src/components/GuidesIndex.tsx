import Link from "next/link";
import DocJsonLd from "@/components/DocJsonLd";
import { type Guide, guideReadingMinutes, listGuides } from "@/lib/guides/guides";
import { guidesIndexBreadcrumbJsonLd, guidesItemListJsonLd } from "@/lib/guides/jsonLd";

/**
 * The /guides index — an English-only hub listing the cornerstone guides. Emits
 * a WebPage (DocJsonLd) + BreadcrumbList + ItemList for discovery, and links to
 * each guide and back to the homepage.
 */
export const GUIDES_INDEX_TITLE = "Academic CV guides";
export const GUIDES_INDEX_DESCRIPTION =
  "Practical, up-to-date guides on writing, formatting, and automating your academic CV — what to include, how long it should be, how to list publications, and more.";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function GuidesIndex() {
  const guides: Guide[] = listGuides();
  return (
    <main className="doc-page" lang="en">
      <DocJsonLd
        path="guides"
        name={GUIDES_INDEX_TITLE}
        description={GUIDES_INDEX_DESCRIPTION}
        locale="en-US"
      />
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: guidesIndexBreadcrumbJsonLd() }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: guidesItemListJsonLd(guides) }}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span> Guides
      </nav>

      <h1>{GUIDES_INDEX_TITLE}</h1>
      <p className="doc-lede">{GUIDES_INDEX_DESCRIPTION}</p>

      <ul className="guide-list">
        {guides.map((g) => (
          <li key={g.slug} className="guide-list-item card">
            <h2 className="guide-list-title">
              <Link href={`/guides/${g.slug}`}>{g.title}</Link>
            </h2>
            <p className="guide-list-desc muted">{g.description}</p>
            <p className="guide-list-meta muted">
              <time dateTime={g.datePublished}>{formatDate(g.datePublished)}</time> ·{" "}
              {guideReadingMinutes(g)} min read
            </p>
          </li>
        ))}
      </ul>

      <p className="doc-back muted">
        <Link href="/">← Back to SigmaCV</Link>
      </p>
    </main>
  );
}
