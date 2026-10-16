import { cvModelSourceNote } from "@/lib/canonical/cvModelSources";
import { fill } from "@/lib/i18n/fill";
import type { EditorExtraStrings } from "@/lib/i18n/editorUi";

interface CvModelSourceLineProps {
  modelId: string;
  locale: string;
  strings: Pick<EditorExtraStrings, "modelSourceChecked" | "modelSourceDue">;
}

/**
 * Under a CV model's description: the funder documents the model was read
 * against, linked, the day they were read, and a word when that reading is due
 * again. Nothing for a model never read against a document — no date it never had.
 */
export default function CvModelSourceLine({ modelId, locale, strings }: CvModelSourceLineProps) {
  const note = cvModelSourceNote(modelId, new Date());
  if (!note) return null;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${note.lastVerified}T00:00:00Z`),
  );
  const [before, after = ""] = fill(strings.modelSourceChecked, { date }).split("{docs}");
  // The locale's own "A and B": each element part is one document, in order.
  const parts = new Intl.ListFormat(locale, { type: "conjunction" }).formatToParts(
    note.documents.map((d) => d.document),
  );
  let next = 0;
  return (
    <p className="muted metric-preset-note grant-presets-source">
      {before}
      {parts.map((part, i) => {
        if (part.type !== "element") return part.value;
        const doc = note.documents[next++];
        return (
          <a key={i} href={doc?.url} target="_blank" rel="noopener noreferrer">
            {part.value}
          </a>
        );
      })}
      {after}
      {note.due ? ` ${strings.modelSourceDue}` : null}
    </p>
  );
}
