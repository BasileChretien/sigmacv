import Link from "next/link";
import type { ReactNode } from "react";
import type { GuideBlock } from "@/lib/guides/guides";
import { localizeContentHref } from "@/lib/seo";

/**
 * Renders one structured content block — the shared body renderer used by both
 * the guides (`GuidePage`) and the glossary (`GlossaryTermPage`). The block model
 * lives in `lib/guides/guides.ts` (`GuideBlock`); keeping the renderer here means
 * one safe, typed mapping from data to markup (no raw HTML / markdown).
 *
 * `locale` localizes internal CTA links (homepage / landing / guide / glossary);
 * it defaults to en-US, where every link is the bare path (no behaviour change).
 */
export function renderContentBlock(block: GuideBlock, locale: string = "en-US"): ReactNode {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={block.id} id={block.id}>
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 key={block.text}>{block.text}</h3>;
    case "p":
      return <p key={block.text}>{block.text}</p>;
    case "ul":
      return (
        <ul key={block.items[0]}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={block.items[0]}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "cta":
      return (
        <p key={block.label}>
          <Link className="btn btn-primary" href={localizeContentHref(block.href, locale)}>
            {block.label}
          </Link>
        </p>
      );
  }
}
