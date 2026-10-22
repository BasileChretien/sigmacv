import type { InformationSheet as Sheet, SheetBlock } from "@/lib/research/consent";

interface InformationSheetProps {
  sheet: Sheet;
  /** Heading level of the sheet's title; sections sit one level below. */
  level: 1 | 2 | 3;
}

type Heading = "h1" | "h2" | "h3" | "h4";

function Block({ block }: { block: SheetBlock }) {
  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p className={block.kind === "sub" ? "info-sheet-sub" : undefined}>{block.text}</p>;
}

/**
 * The approved information sheet of study 2026-0310, section by section, word
 * for word. Presentational only, so the editor's research panel and the
 * printable /cv/research-sheet page render the same document.
 */
export default function InformationSheet({ sheet, level }: InformationSheetProps) {
  const Title = `h${level}` as Heading;
  const Section = `h${level + 1}` as Heading;
  return (
    <div className="info-sheet">
      <Title className="info-sheet-title">{sheet.title}</Title>
      {sheet.preamble.map((line, i) => (
        <p key={i} className="info-sheet-meta">
          {line}
        </p>
      ))}
      {sheet.sections.map((section, i) => (
        <section key={i}>
          <Section className="info-sheet-heading">{section.heading}</Section>
          {section.blocks.map((block, j) => (
            <Block key={j} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
