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

/** id by printed title over every item of the raw document (first wins). */
function titleIndex(sections: any[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const section of sections) {
    for (const item of Array.isArray(section?.items) ? section.items : []) {
      const raw = item?.displayTextOverride ?? item?.csl?.title ?? item?.displayText;
      const title = typeof raw === "string" ? raw.trim() : "";
      if (title && typeof item?.id === "string" && !index.has(title)) index.set(title, item.id);
    }
  }
  return index;
}

function migrateSection(section: any, titles: Map<string, string>): any {
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
  for (const chunk of chunks) {
    const stub = chunk.stub ? parseStub(chunk.text.trim()) : null;
    if (!stub) {
      kept.push(chunk.text);
      continue;
    }
    changed = true;
    const worked = Boolean(stub.role || stub.impact);
    if (!stub.itemId && !worked) continue; // a guess nobody touched
    const itemId = stub.itemId ?? titles.get(stub.title);
    const taken = new Set([...existing, ...added].map((c) => c?.id));
    let n = existing.length + added.length + 1;
    while (taken.has(`c${n}`)) n += 1;
    added.push({
      id: `c${n}`,
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
  // Cheap gate: nothing to do unless a contributions body holds a numbered head.
  const candidate = sections.some(
    (s: any) =>
      s?.type === "narrative-knowledge" &&
      typeof s.body === "string" &&
      /(^|\n)\d{1,3}\. .+ : A \/ B \/ C\)/.test(s.body),
  );
  if (!candidate) return doc;
  const titles = titleIndex(sections);
  let changed = false;
  const next = sections.map((s: any) => {
    const m = migrateSection(s, titles);
    if (m !== s) changed = true;
    return m;
  });
  return changed ? { ...(doc as any), sections: next } : doc;
}
