import { degreeLabel, renderStrings, supervisionRoleLabel } from "@/lib/i18n/render";
import { proseStarterStrings, type ProseStarterStrings } from "@/lib/i18n/proseStarter";
import {
  PROSE_BODY_MAX,
  hasStructuredSupervision,
  isHidden,
  isProseSectionType,
  itemDateRange,
  itemDisplayText,
  itemEffectiveYear,
  itemInstitution,
  itemRoleTitle,
  itemVenue,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "./schema";

/**
 * Starter drafts for the prose sections.
 *
 * A funder narrative layout (the CV-FRQ, the Tri-agency CV, the R4RI) shows
 * three or four prose sections and hides every list. Applied to a CV whose prose
 * is still empty, it left the preview blank: a prose section with no body is
 * not rendered. So each empty prose section gets a SCAFFOLD written from the
 * owner's own entries, in the CV's language, with square-bracket prompts where
 * the owner has to write:
 *
 *  - `statement` (background): education, positions, recognitions and funding
 *    as bullet lists, between two prompts;
 *  - `narrative-knowledge` (contributions): up to ten numbered stubs, each with
 *    the period, an audience slot (A / B / C), a role slot, an impact slot and
 *    a plain-text reference, seeded from the most cited publications and the
 *    most recent datasets, software, patents and trials;
 *  - `narrative-individuals` (people): supervision and teaching records;
 *  - `narrative-community` / `narrative-society`: the relevant service records.
 *
 * Lists are hidden under such a layout, so the drafts carry plain text (a
 * reference line, not an `[[id]]` evidence token that would resolve to nothing).
 * Everything here is pure and reads only included, not-"not mine" items,
 * whatever section visibility says. The editor calls it when a layout is
 * applied and on demand for one section; the freeze / snapshot path never does,
 * so a frozen document cannot pick up a scaffold with prompts in it.
 */

/** Cap on the contribution stubs, the FRQ's own maximum. */
export const STARTER_MAX_CONTRIBUTIONS = 10;
/** How many of the stubs come from publications before other output types fill in. */
const STARTER_MAX_PUBLICATIONS = 6;
/** Author names printed before "et al." in a stub's reference line. */
const REFERENCE_MAX_AUTHORS = 7;

/** Included, not-"not mine" items of every section of `type`, in section order. */
function liveItems(cv: CanonicalCv, type: CvSectionType): CvItem[] {
  return cv.sections
    .filter((s) => s.type === type)
    .flatMap((s) => [...s.items].sort((a, b) => a.order - b.order))
    .filter((it) => !isHidden(it));
}

/** "Jean-Baptiste" → "J.-B.", "Marie Claire" → "M. C.", "" → "". */
function initials(given: string): string {
  return given
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .map((p) => (p ? `${p[0]!.toUpperCase()}.` : ""))
        .join("-"),
    )
    .join(" ");
}

/** One CSL name as "Family, G." (or the literal). */
function authorName(a: { family?: string; given?: string; literal?: string }): string {
  if (a.literal) return a.literal;
  const family = a.family?.trim() ?? "";
  const ini = initials(a.given ?? "");
  return ini ? `${family}, ${ini}` : family;
}

/** An APA-like author list: "A, B., C, D., & E, F." with "et al." past the cap. */
function authorList(
  authors: readonly { family?: string; given?: string; literal?: string }[],
): string {
  const names = authors.map(authorName).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length > REFERENCE_MAX_AUTHORS) {
    return `${names.slice(0, REFERENCE_MAX_AUTHORS).join(", ")}, et al.`;
  }
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

/** The year printed for a citation item (effective year, else CSL issued). */
function itemYear(item: CvItem): number | undefined {
  const eff = itemEffectiveYear(item);
  if (typeof eff === "number") return eff;
  const issued = item.csl?.issued?.["date-parts"]?.[0]?.[0];
  return typeof issued === "number" ? issued : undefined;
}

/** The title printed for an item (override → CSL → display text). */
function itemTitle(item: CvItem): string | undefined {
  const raw = item.displayTextOverride ?? item.csl?.title ?? item.displayText;
  const t = typeof raw === "string" ? raw.trim() : "";
  return t || undefined;
}

/**
 * A plain-text reference for a stub: "Authors (Year). Title. Venue. https://doi.org/…",
 * each piece only when known; the display text when the item has no CSL.
 */
export function starterReferenceLine(item: CvItem): string {
  if (!item.csl) return itemDisplayText(item)?.trim() ?? "";
  const parts: string[] = [];
  const authors = authorList(item.csl.author ?? []);
  const year = itemYear(item);
  const head = [authors, year ? `(${year})` : ""].filter(Boolean).join(" ");
  if (head) parts.push(`${head}.`);
  const title = typeof item.csl.title === "string" ? item.csl.title.trim() : "";
  if (title) parts.push(`${title}.`);
  const venue = itemVenue(item)?.trim();
  if (venue) parts.push(`${venue}.`);
  const doi = typeof item.csl.DOI === "string" ? item.csl.DOI.trim() : "";
  if (doi) parts.push(`https://doi.org/${doi}`);
  return parts.join(" ");
}

/** A year range for a dated entry: "2019 to 2023", "2021 to present", "2020" or "". */
function yearRange(
  range: { startYear?: number; endYear?: number },
  s: ProseStarterStrings,
): string {
  const { startYear, endYear } = range;
  if (startYear && endYear)
    return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;
  if (startYear) return `${startYear}–${s.present}`;
  if (endYear) return `${endYear}`;
  return "";
}

/** A positions/education entry as one bullet: "Role, Institution (2019–2023)". */
function historyBullet(item: CvItem, s: ProseStarterStrings): string {
  const role = itemRoleTitle(item)?.trim();
  const inst = itemInstitution(item)?.trim();
  const range = yearRange(itemDateRange(item), s);
  const lead = [role, inst].filter(Boolean).join(", ") || itemDisplayText(item)?.trim() || "";
  if (!lead) return "";
  return `- ${lead}${range ? ` (${range})` : ""}`;
}

/** A free-text entry (award, grant, teaching, service…) as one bullet. */
function textBullet(item: CvItem): string {
  const text = itemDisplayText(item)?.trim() ?? itemTitle(item) ?? "";
  return text ? `- ${text}` : "";
}

/** A titled list block ("Heading" + bullets) or "" when there is nothing to list. */
function block(heading: string, bullets: string[]): string {
  const lines = bullets.filter(Boolean);
  return lines.length ? `${heading}\n${lines.join("\n")}` : "";
}

/** Paragraphs joined with the blank line the prose renderer treats as a break. */
function paragraphs(...parts: string[]): string {
  return parts.filter((p) => p.trim().length > 0).join("\n\n");
}

/** Section 1: background from education, positions, recognitions and funding. */
function backgroundDraft(cv: CanonicalCv, s: ProseStarterStrings): string {
  return paragraphs(
    s.draftNote,
    s.bgIntro,
    block(
      s.education,
      liveItems(cv, "education").map((it) => historyBullet(it, s)),
    ),
    block(
      s.positions,
      liveItems(cv, "positions").map((it) => historyBullet(it, s)),
    ),
    block(s.awards, liveItems(cv, "awards").map(textBullet)),
    block(s.grants, liveItems(cv, "grants").map(textBullet)),
    s.skillsPrompt,
  );
}

/** Publications ranked by citations, then recency; other outputs by recency. */
function contributionCandidates(cv: CanonicalCv): CvItem[] {
  const byCitations = (a: CvItem, b: CvItem) =>
    (b.meta.citedByCount ?? 0) - (a.meta.citedByCount ?? 0) ||
    (itemYear(b) ?? 0) - (itemYear(a) ?? 0);
  const byRecency = (a: CvItem, b: CvItem) => (itemYear(b) ?? 0) - (itemYear(a) ?? 0);
  const pubs = liveItems(cv, "publications").filter(itemTitle).sort(byCitations);
  const others = (["datasets", "software", "patents", "clinical-trials"] as const)
    .flatMap((t) => liveItems(cv, t))
    .filter(itemTitle)
    .sort(byRecency);
  const picked = pubs.slice(0, STARTER_MAX_PUBLICATIONS);
  for (const it of others) {
    if (picked.length >= STARTER_MAX_CONTRIBUTIONS) break;
    picked.push(it);
  }
  // Publications beyond the first six fill any room the other types left.
  for (const it of pubs.slice(STARTER_MAX_PUBLICATIONS)) {
    if (picked.length >= STARTER_MAX_CONTRIBUTIONS) break;
    picked.push(it);
  }
  return picked;
}

/** Section 2: numbered contribution stubs with the FRQ's four slots. */
function contributionsDraft(cv: CanonicalCv, s: ProseStarterStrings): string {
  const stubs = contributionCandidates(cv).map((item, i) => {
    const year = itemYear(item);
    const head = `${i + 1}. ${itemTitle(item)} (${year ?? s.todo} · ${s.audience} : ${s.audienceKey})`;
    const ref = starterReferenceLine(item);
    return [
      head,
      `${s.role} : ${s.todo}`,
      `${s.impact} : ${s.todo}`,
      ref ? `${s.reference} : ${ref}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return paragraphs(s.draftNote, s.contribIntro, ...stubs);
}

/** One supervision record as a bullet: "PhD, primary supervisor: Name (thesis; institution; years)". */
function supervisionBullet(cv: CanonicalCv, item: CvItem, s: ProseStarterStrings): string {
  if (!hasStructuredSupervision(item)) return textBullet(item);
  const rs = renderStrings(cv.display.locale);
  const m = item.meta;
  const lead = [
    m.degreeLevel ? degreeLabel(rs, m.degreeLevel) : "",
    m.supervisionRole ? supervisionRoleLabel(rs, m.supervisionRole) : "",
  ]
    .filter(Boolean)
    .join(", ");
  const name = m.superviseeName?.trim();
  const tail = [
    m.thesisTitle?.trim(),
    itemInstitution(item)?.trim(),
    yearRange(itemDateRange(item), s),
  ]
    .filter(Boolean)
    .join("; ");
  const who = [lead, name].filter(Boolean).join(": ");
  return `- ${who || s.todo}${tail ? ` (${tail})` : ""}`;
}

/** Section 3: supervision and teaching records, then the mentoring prompt. */
function peopleDraft(cv: CanonicalCv, s: ProseStarterStrings): string {
  return paragraphs(
    s.draftNote,
    s.supervisionIntro,
    block(
      s.supervision,
      liveItems(cv, "supervision").map((it) => supervisionBullet(cv, it, s)),
    ),
    block(s.teaching, liveItems(cv, "teaching").map(textBullet)),
    s.mentoringPrompt,
  );
}

/** The community / society modules: their service records under one prompt. */
function recordsDraft(
  cv: CanonicalCv,
  s: ProseStarterStrings,
  intro: string,
  types: readonly CvSectionType[],
): string {
  return paragraphs(
    s.draftNote,
    intro,
    ...types.map((t) => block(sectionHeading(cv, t), liveItems(cv, t).map(textBullet))),
  );
}

/** The heading the CV gives a list section (its current title), else the type. */
function sectionHeading(cv: CanonicalCv, type: CvSectionType): string {
  return cv.sections.find((s) => s.type === type)?.title ?? type;
}

/**
 * The starter draft for a prose section type, in the CV's language ("" for a
 * non-prose type). Bounded by the prose cap.
 */
export function starterProseBody(cv: CanonicalCv, type: CvSectionType): string {
  if (!isProseSectionType(type)) return "";
  const s = proseStarterStrings(cv.display.locale);
  let body: string;
  switch (type) {
    case "statement":
      body = backgroundDraft(cv, s);
      break;
    case "narrative-knowledge":
      body = contributionsDraft(cv, s);
      break;
    case "narrative-individuals":
      body = peopleDraft(cv, s);
      break;
    case "narrative-community":
      body = recordsDraft(cv, s, s.communityIntro, ["peer-review", "editorial", "service"]);
      break;
    default:
      body = recordsDraft(cv, s, s.societyIntro, ["patents", "clinical-trials"]);
  }
  return body.slice(0, PROSE_BODY_MAX);
}

/**
 * Fill every VISIBLE prose section whose body is blank with its starter draft.
 * Pure and immutable; a section with any text is left alone, so calling it after
 * every layout change never overwrites what the owner wrote.
 */
export function prefillEmptyProse(cv: CanonicalCv): CanonicalCv {
  let changed = false;
  const sections = cv.sections.map((section) => {
    if (!section.visible || !isProseSectionType(section.type)) return section;
    if ((section.body ?? "").trim().length > 0) return section;
    const body = starterProseBody(cv, section.type);
    if (!body) return section;
    changed = true;
    return { ...section, body };
  });
  return changed ? { ...cv, sections } : cv;
}
