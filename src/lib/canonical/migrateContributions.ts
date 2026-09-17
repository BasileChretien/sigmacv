import { PROSE_STARTER_STRINGS } from "@/lib/i18n/proseStarter";

/**
 * Read-time migration: TEXT contribution stubs → structured contributions.
 *
 * Two generations of a contributions section's body held numbered text stubs:
 *  - the first starter draft GUESSED up to ten of them from the record
 *    ("1. Title (2020 · Audience : A / B / C)" + Role / Impact / Reference lines);
 *  - the second appended one per entry the owner PICKED, its head line ending on
 *    the entry's `[[id | label]]` token.
 * Contributions are objects on the section now (`section.contributions`, see
 * `contributions.ts`), so a stored body is cleaned once, on read:
 *  - a stub the owner picked (it carries a token) becomes a contribution linked
 *    to that entry, with whatever role / impact / "cited in" lines were written;
 *  - a guessed stub the owner WORKED ON (a role or an impact was written) becomes
 *    a contribution too, linked by its title when an entry of the record matches;
 *  - a guessed stub nobody touched is dropped — it was never the owner's choice;
 *  - citation markers at the start of a paragraph, alone or glued onto one of
 *    our bracketed prompts (what the picker left before #512: entries the owner
 *    chose, sitting at the top of the section), become one card per entry;
 *  - an entry that already has a card never gets a second one;
 *  - the stub text leaves the body, the stale intro prompt is reworded, and the
 *    "pick your publications" prompt goes once there is a contribution.
 * Works on the RAW stored JSON (before validation), defensively, and returns the
 * very same object when there is nothing to do — an already-clean document is
 * passed through untouched, like `migrateSoftwareSection`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const STRINGS = Object.values(PROSE_STARTER_STRINGS);
const TODOS = new Set(STRINGS.map((s) => s.todo));
const LABELS = {
  role: new Set(STRINGS.map((s) => s.role)),
  impact: new Set(STRINGS.map((s) => s.impact)),
  cited: new Set(STRINGS.map((s) => s.guidelineCited)),
  reference: new Set(STRINGS.map((s) => s.reference)),
};
const PICK_PROMPTS = new Set(STRINGS.map((s) => s.pickPrompt));
/** First sentence of each locale's contributions intro → that locale's current intro. */
const INTRO_BY_LEAD = new Map(
  STRINGS.map((s) => [s.contribIntro.slice(0, s.contribIntro.search(/[.。]/) + 1), s.contribIntro]),
);

/** "N. Title (year · Audience : A / B / C)" with an optional trailing `[[id | label]]`. */
const HEAD_RE =
  /^\d{1,3}\. (.+) \(([^()]*?) · [^()]*? : A \/ B \/ C\)(?: \[\[([^\]|]+?)(?:\s*\|[^\]]*)?\]\])?\s*$/;

interface ParsedStub {
  title: string;
  year?: string;
  itemId?: string;
  role?: string;
  impact?: string;
  citedIn: { text: string; url?: string }[];
}

function parseStub(paragraph: string): ParsedStub | null {
  const lines = paragraph.split("\n");
  const head = HEAD_RE.exec(lines[0]!.trim());
  if (!head) return null;
  const stub: ParsedStub = { title: head[1]!.trim(), citedIn: [] };
  if (/^\d{4}$/.test(head[2]!.trim())) stub.year = head[2]!.trim();
  if (head[3]) stub.itemId = head[3].trim().slice(0, 1024);
  for (const line of lines.slice(1)) {
    const m = /^(.+?) : (.*)$/.exec(line.trim());
    if (!m) continue;
    const label = m[1]!.trim();
    const value = m[2]!.trim();
    if (!value || TODOS.has(value)) continue;
    if (LABELS.role.has(label)) stub.role = value;
    else if (LABELS.impact.has(label)) stub.impact = value;
    else if (LABELS.cited.has(label)) {
      const link = /^(.*?)\.?\s+(https?:\/\/\S+)$/.exec(value);
      stub.citedIn.push(
        link
          ? { text: link[1]!.trim().slice(0, 600), url: link[2]!.slice(0, 2048) }
          : { text: value.slice(0, 600) },
      );
    }
  }
  return stub;
}

/**
 * `[[id]]` / `[[id | label]]` markers at the START of a paragraph, followed by
 * nothing or by one of our bracketed prompts. The old picker inserted at the
 * caret, which sat at the very start of the draft, so its markers landed glued
 * onto "[Starter draft …]". A sentence that merely begins with a marker ("[[W1]]
 * showed …") does not match: the lookahead wants the end or a single `[`.
 */
const LEADING_MARKERS_RE = /^\s*((?:\[\[[^[\]\n]{1,1100}\]\]\s*)+)(?=$|\[[^[])/;
/** One marker; group 1 is the id (before any `|`). */
const MARKER_RE = /\[\[([^[\]|\n]+?)(?:\s*\|[^[\]\n]*)?\]\]/g;
/** The cheap gate's test for such a paragraph (at any line start). */
const MARKER_LINE_RE = /(^|\n)[ \t]*(?:\[\[[^[\]\n]+\]\][ \t]*)+(?=\n|$|\[[^[])/;

/**
 * The entry ids of a paragraph's leading markers, in order, unique, capped, and
 * what is left of the paragraph after them; null when there are none.
 */
function leadingMarkers(text: string): { ids: string[]; rest: string } | null {
  const m = LEADING_MARKERS_RE.exec(text);
  if (!m) return null;
  const ids: string[] = [];
  for (const marker of m[1]!.matchAll(MARKER_RE)) {
    const id = marker[1]!.trim().slice(0, 1024);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.length > 0 ? { ids, rest: text.slice(m[0].length) } : null;
}

interface RawIndex {
  /** id by printed title (first wins). */
  byTitle: Map<string, string>;
  /** raw item by id. */
  byId: Map<string, any>;
}

/** The raw document's items, by printed title and by id. */
function rawIndex(sections: any[]): RawIndex {
  const byTitle = new Map<string, string>();
  const byId = new Map<string, any>();
  for (const section of sections) {
    for (const item of Array.isArray(section?.items) ? section.items : []) {
      if (typeof item?.id !== "string") continue;
      if (!byId.has(item.id)) byId.set(item.id, item);
      const raw = item?.displayTextOverride ?? item?.csl?.title ?? item?.displayText;
      const title = typeof raw === "string" ? raw.trim() : "";
      if (title && !byTitle.has(title)) byTitle.set(title, item.id);
    }
  }
  return { byTitle, byId };
}

/**
 * What a card made from a marker starts with, like a card made with the picker
 * (`contributions.ts` `contributionFromItem`): the entry's year as the period and
 * the clinical guidelines that cite it as "cited in" lines. Read defensively from
 * the raw item — anything not of the expected shape is simply left out.
 */
function prefillFromRaw(item: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const meta = item?.meta ?? {};
  const year = [meta.yearOverride, meta.year, item?.csl?.issued?.["date-parts"]?.[0]?.[0]].find(
    (y) => typeof y === "number" && Number.isInteger(y),
  );
  if (year !== undefined) out.period = String(year);
  const guidelines = Array.isArray(meta.guidelineCitations) ? meta.guidelineCitations : [];
  const citedIn = guidelines
    .filter((g: any) => typeof g?.pmid === "string" && typeof g?.title === "string")
    .slice(0, 5)
    .map((g: any) => {
      const tail = [
        typeof g.source === "string" ? g.source.trim() : "",
        typeof g.year === "number" ? String(g.year) : "",
      ]
        .filter(Boolean)
        .join(", ");
      const title = g.title.trim().replace(/\.$/, "");
      return {
        text: (tail ? `${title} (${tail})` : title).slice(0, 600),
        url: `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(g.pmid.trim())}/`,
      };
    });
  if (citedIn.length > 0) out.citedIn = citedIn;
  return out;
}

function migrateSection(section: any, raw: RawIndex): any {
  const titles = raw.byTitle;
  if (section?.type !== "narrative-knowledge" || typeof section.body !== "string") return section;
  const paragraphs = section.body.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n+/);
  const existing: any[] = Array.isArray(section.contributions) ? section.contributions : [];
  const added: any[] = [];
  const kept: string[] = [];
  let changed = false;
  // A paragraph may hold text before its first stub, or several stubs the owner
  // glued together without a blank line: cut it at every stub head.
  const chunks: { text: string; stub: boolean }[] = [];
  for (const para of paragraphs) {
    let current: string[] = [];
    let isStub = false;
    for (const line of para.split("\n")) {
      if (HEAD_RE.test(line.trim())) {
        if (current.length > 0) chunks.push({ text: current.join("\n"), stub: isStub });
        current = [line];
        isStub = true;
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) chunks.push({ text: current.join("\n"), stub: isStub });
  }
  // A new card takes the next free id; an entry that already has a card gets no second one.
  const push = (card: Record<string, unknown>) => {
    const all = [...existing, ...added];
    if (card.itemId && all.some((c) => c?.itemId === card.itemId)) return;
    const taken = new Set(all.map((c) => c?.id));
    let n = all.length + 1;
    while (taken.has(`c${n}`)) n += 1;
    added.push({ id: `c${n}`, ...card });
  };
  for (const chunk of chunks) {
    const stub = chunk.stub ? parseStub(chunk.text.trim()) : null;
    if (!stub) {
      // Citation markers at the start of a paragraph are what the picker left before
      // contributions were cards ("they appear only at the top"): each marked
      // entry becomes a card, in order, and the markers leave the text.
      const lead = chunk.stub ? null : leadingMarkers(chunk.text);
      if (lead) {
        changed = true;
        for (const itemId of lead.ids) push({ itemId, ...prefillFromRaw(raw.byId.get(itemId)) });
        if (lead.rest.trim()) kept.push(lead.rest);
        continue;
      }
      kept.push(chunk.text);
      continue;
    }
    changed = true;
    const worked = Boolean(stub.role || stub.impact);
    if (!stub.itemId && !worked) continue; // a guess nobody touched
    const itemId = stub.itemId ?? titles.get(stub.title);
    push({
      ...(itemId ? { itemId } : { title: stub.title.slice(0, 1000) }),
      ...(stub.year ? { period: stub.year } : {}),
      ...(stub.role ? { role: stub.role.slice(0, 3000) } : {}),
      ...(stub.impact ? { impact: stub.impact.slice(0, 3000) } : {}),
      ...(stub.citedIn.length > 0 ? { citedIn: stub.citedIn.slice(0, 20) } : {}),
    });
  }
  if (!changed) return section;
  const contributions = [...existing, ...added].slice(0, 30);
  const body = kept
    .map((para) => {
      const text = para.trim();
      for (const [lead, current] of INTRO_BY_LEAD) if (text.startsWith(lead)) return current;
      return para;
    })
    .filter((para) => !(contributions.length > 0 && PICK_PROMPTS.has(para.trim())))
    .join("\n\n")
    .trim();
  return {
    ...section,
    body,
    ...(contributions.length > 0 ? { contributions } : {}),
  };
}

export function migrateContributionStubs(doc: unknown): unknown {
  if (!doc || typeof doc !== "object") return doc;
  const sections = (doc as any).sections;
  if (!Array.isArray(sections)) return doc;
  // Cheap gate: nothing to do unless a contributions body holds a numbered head
  // or a line of nothing but citation markers.
  const candidate = sections.some(
    (s: any) =>
      s?.type === "narrative-knowledge" &&
      typeof s.body === "string" &&
      (/(^|\n)\d{1,3}\. .+ : A \/ B \/ C\)/.test(s.body) || MARKER_LINE_RE.test(s.body)),
  );
  if (!candidate) return doc;
  const raw = rawIndex(sections);
  let changed = false;
  const next = sections.map((s: any) => {
    const m = migrateSection(s, raw);
    if (m !== s) changed = true;
    return m;
  });
  return changed ? { ...(doc as any), sections: next } : doc;
}
