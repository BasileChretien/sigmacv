import { stripInlineMarkup } from "@/lib/text/markup";
import { PROSE_STARTER_STRINGS } from "@/lib/i18n/proseStarter";
import { recordItemIndex } from "./evidenceRefs";
import {
  CONTRIBUTIONS_MAX,
  itemEffectiveYear,
  type CanonicalCv,
  type Contribution,
  type CvItem,
  type CvSection,
} from "./schema";

/**
 * STRUCTURED contributions of a contributions section (`narrative-knowledge`: the
 * FRQ's second section, the Tri-agency's "Most significant contributions", R4RI's
 * knowledge module).
 *
 * A funder asks for a short list of contributions, each with a period, an
 * audience, the applicant's role and the impact, backed by something a reviewer
 * can check. As free text that was a wall of numbered lines the owner could not
 * delete or reorder without retyping. So each contribution is an OBJECT on the
 * section (`section.contributions`): it links one entry of the record (`itemId`)
 * — whose title and reference are always derived live, never copied — and holds
 * what only the owner can write: the period, the audience, the role, the impact
 * and where the work is cited. The section's `body` stays free prose above the
 * list. Every renderer derives from the same prepared list (`render/prepare.ts`).
 *
 * Everything here is pure and immutable.
 */

/** How many "cited in" lines a picked entry starts with (its guideline citations). */
const PREFILL_MAX_CITED = 5;

/** The title an entry prints under: override → CSL → display text, markup stripped. */
function itemTitle(item: CvItem): string {
  const raw = item.displayTextOverride ?? item.csl?.title ?? item.displayText ?? "";
  return stripInlineMarkup(String(raw)).trim();
}

/** The linked entry, when it is still on the record (included, not "not mine",
 *  not excluded from the view) — a hidden LIST does not matter, see evidenceRefs. */
export function contributionItem(cv: CanonicalCv, c: Contribution): CvItem | undefined {
  return c.itemId ? recordItemIndex(cv).get(c.itemId)?.item : undefined;
}

/** The title a contribution prints: the owner's own wording, else the entry's. */
export function contributionTitle(cv: CanonicalCv, c: Contribution): string {
  const own = c.title?.trim();
  if (own) return own;
  const item = contributionItem(cv, c);
  return item ? itemTitle(item) : "";
}

/** A contribution that prints: it has a title of its own or an entry on the record. */
export function isPrintableContribution(cv: CanonicalCv, c: Contribution): boolean {
  return contributionTitle(cv, c).length > 0;
}

/** A fresh id not used by the section yet ("c1", "c2", …) — pure, no randomness. */
function nextId(existing: readonly Contribution[]): string {
  const taken = new Set(existing.map((c) => c.id));
  let n = existing.length + 1;
  while (taken.has(`c${n}`)) n += 1;
  return `c${n}`;
}

/**
 * The contribution a PICKED entry starts as: linked to the entry, its year as the
 * period, and the clinical guidelines that cite it (the owner sync's PubMed pass)
 * as its first "cited in" lines — text and PubMed link the owner can edit or drop.
 */
export function contributionFromItem(
  existing: readonly Contribution[],
  item: CvItem,
): Contribution {
  const year = itemEffectiveYear(item) ?? item.csl?.issued?.["date-parts"]?.[0]?.[0];
  const citedIn = (item.meta.guidelineCitations ?? []).slice(0, PREFILL_MAX_CITED).map((g) => {
    const tail = [g.source?.trim(), g.year !== undefined ? String(g.year) : ""]
      .filter(Boolean)
      .join(", ");
    const title = g.title.trim().replace(/\.$/, "");
    return {
      text: (tail ? `${title} (${tail})` : title).slice(0, 600),
      url: `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(g.pmid.trim())}/`,
    };
  });
  return {
    id: nextId(existing),
    itemId: item.id,
    ...(year !== undefined ? { period: String(year) } : {}),
    ...(citedIn.length > 0 ? { citedIn } : {}),
  };
}

/** A contribution that is not one of the record's entries (an experience, a role). */
export function blankContribution(existing: readonly Contribution[]): Contribution {
  return { id: nextId(existing) };
}

/** The "pick your publications" prompt, in any locale — it gives way to the first card. */
const PICK_PROMPTS = new Set(Object.values(PROSE_STARTER_STRINGS).map((s) => s.pickPrompt));

function withoutPickPrompt(body: string | undefined): string | undefined {
  if (body === undefined) return undefined;
  const kept = body
    .split(/\r?\n/)
    .filter((l) => !PICK_PROMPTS.has(l.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return kept;
}

function mapSection(
  cv: CanonicalCv,
  sectionId: string,
  fn: (section: CvSection) => CvSection,
): CanonicalCv {
  let changed = false;
  const sections = cv.sections.map((s) => {
    if (s.id !== sectionId) return s;
    const next = fn(s);
    if (next !== s) changed = true;
    return next;
  });
  return changed ? { ...cv, sections } : cv;
}

/** Append a contribution (bounded); the body's "pick your publications" prompt goes. */
export function addContribution(
  cv: CanonicalCv,
  sectionId: string,
  contribution: Contribution,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => {
    const list = s.contributions ?? [];
    if (list.length >= CONTRIBUTIONS_MAX) return s;
    return { ...s, body: withoutPickPrompt(s.body), contributions: [...list, contribution] };
  });
}

/** Merge `patch` into one contribution; blank strings and empty lists are dropped. */
export function updateContribution(
  cv: CanonicalCv,
  sectionId: string,
  id: string,
  patch: Partial<Omit<Contribution, "id">>,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => {
    const list = s.contributions ?? [];
    if (!list.some((c) => c.id === id)) return s;
    return {
      ...s,
      contributions: list.map((c) => (c.id === id ? tidy({ ...c, ...patch }) : c)),
    };
  });
}

/** Drop the keys that carry nothing, so an emptied field leaves no residue. */
function tidy(c: Contribution): Contribution {
  const out: Contribution = { id: c.id };
  if (c.itemId) out.itemId = c.itemId;
  if (c.title !== undefined && c.title !== "") out.title = c.title;
  if (c.period !== undefined && c.period !== "") out.period = c.period;
  if (c.audience && c.audience.length > 0) out.audience = [...new Set(c.audience)].sort();
  if (c.role !== undefined && c.role !== "") out.role = c.role;
  if (c.impact !== undefined && c.impact !== "") out.impact = c.impact;
  if (c.citedIn && c.citedIn.length > 0) out.citedIn = c.citedIn;
  return out;
}

export function removeContribution(cv: CanonicalCv, sectionId: string, id: string): CanonicalCv {
  return mapSection(cv, sectionId, (s) => {
    const list = s.contributions ?? [];
    if (!list.some((c) => c.id === id)) return s;
    const next = list.filter((c) => c.id !== id);
    return { ...s, contributions: next.length > 0 ? next : undefined };
  });
}

/** Move one contribution up (-1) or down (+1); a move past either end is a no-op. */
export function moveContribution(
  cv: CanonicalCv,
  sectionId: string,
  id: string,
  dir: -1 | 1,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => {
    const list = s.contributions ?? [];
    const at = list.findIndex((c) => c.id === id);
    const to = at + dir;
    if (at < 0 || to < 0 || to >= list.length) return s;
    const next = [...list];
    [next[at], next[to]] = [next[to]!, next[at]!];
    return { ...s, contributions: next };
  });
}
