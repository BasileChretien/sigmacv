import { createRequire } from "node:module";
import type { CslItem } from "@/types/csl";
import { DEFAULT_LOCALE, getLocaleXml, getStyleXml } from "./assets";

// citeproc-js ships a CommonJS build. Load it via createRequire so it works
// under ESM ("type": "module") in both Next's Node runtime and Vitest.
const require = createRequire(import.meta.url);
/* eslint-disable @typescript-eslint/no-explicit-any */
const citeprocModule: any = require("citeproc");
const CSL: any = citeprocModule.CSL ?? citeprocModule;

export type CiteprocOutputFormat = "html" | "text";

export interface RenderedEntry {
  /** Matches the CslItem.id that produced this entry. */
  id: string;
  /** Bibliography entry in the requested output format (HTML or plain text). */
  content: string;
}

/**
 * Render a CSL bibliography for the given items in a given style + output
 * format. Returns one {id, content} per item, in the order citeproc emits them
 * (the style decides sort order). Pure with respect to the CSL assets on disk.
 *
 * Every output format (HTML preview/PDF, Markdown, LaTeX, DOCX) renders through
 * this one path, so citations are identical everywhere.
 */
export function renderBibliography(
  items: CslItem[],
  styleKey: string,
  locale: string = DEFAULT_LOCALE,
  outputFormat: CiteprocOutputFormat = "html",
): RenderedEntry[] {
  if (items.length === 0) return [];

  const itemMap = new Map<string, CslItem>();
  for (const it of items) itemMap.set(it.id, it);

  const sys = {
    retrieveLocale: (lang: string) => getLocaleXml(lang),
    retrieveItem: (id: string): CslItem => {
      const item = itemMap.get(id);
      // Defensive: citeproc only requests ids we registered, so this never fires
      // in practice — but surfaces a clear error instead of an opaque crash.
      /* v8 ignore next */
      if (!item) throw new Error(`[citeproc] unknown item id: ${id}`);
      return item;
    },
  };

  const engine = new CSL.Engine(sys, getStyleXml(styleKey), locale);
  if (outputFormat !== "html") engine.setOutputFormat(outputFormat);
  engine.updateItems(items.map((i) => i.id));

  const bib = engine.makeBibliography();
  // Styles without a bibliography section (e.g. note styles) return false. None
  // of the bundled styles do, so this guard is defensive.
  /* v8 ignore next */
  if (!bib) return [];

  const [params, entries] = bib as [
    { entry_ids?: Array<string[] | string> },
    string[],
  ];
  const entryIds = params.entry_ids ?? [];

  return entries.map((content, i) => {
    const idEntry = entryIds[i];
    const id = Array.isArray(idEntry) ? idEntry[0] : idEntry;
    return { id: String(id ?? items[i]?.id ?? i), content };
  });
}

/**
 * Validate that an XML string is a usable INDEPENDENT CSL style by actually
 * building an engine and rendering a one-item bibliography. This catches the
 * cases that matter for us: malformed XML, dependent styles (which need their
 * parent and throw here), and note-only styles (no `<bibliography>` →
 * `makeBibliography()` returns false). Returns a reason on failure.
 */
export function validateStyleXml(
  xml: string,
  locale: string = DEFAULT_LOCALE,
): { ok: true } | { ok: false; reason: string } {
  const probe: CslItem = {
    id: "__probe__",
    type: "article-journal",
    title: "Probe",
    author: [{ family: "Doe", given: "Jane" }],
    issued: { "date-parts": [[2020, 1, 1]] },
  };
  const sys = {
    retrieveLocale: (lang: string) => getLocaleXml(lang),
    retrieveItem: () => probe,
  };
  try {
    const engine = new CSL.Engine(sys, xml, locale);
    engine.updateItems([probe.id]);
    const bib = engine.makeBibliography();
    if (!bib || !Array.isArray((bib as [unknown, string[]])[1])) {
      return {
        ok: false,
        reason:
          "This style has no bibliography (note-only styles aren't supported).",
      };
    }
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return { ok: false, reason: `citeproc rejected the style: ${detail}` };
  }
}
