import {
  degreeLabel,
  renderStrings,
  superviseeNoun,
  supervisionRoleLabel,
} from "@/lib/i18n/render";
import {
  PROSE_STARTER_STRINGS,
  proseStarterStrings,
  type ProseStarterStrings,
} from "@/lib/i18n/proseStarter";
import { evidenceRefLabel, evidenceToken } from "./evidenceRefs";
import { guidelineCitationLine, pubmedUrl } from "@/lib/pubmed/guidelineText";
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
  type CvSection,
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
 *  - `narrative-knowledge` (contributions): the prompts alone, ending on "pick
 *    your publications in the Content panel" — the numbered stubs come from the
 *    entries the owner PICKS with the picker under the section
 *    (`appendContributionStub`): each arrives with the period, an audience slot
 *    (A / B / C), a role slot, an impact slot, the clinical guidelines that cite
 *    it (`meta.guidelineCitations`, the owner sync's PubMed pass) with their
 *    PubMed links, and a plain-text reference, plus the entry's `[[id | label]]`
 *    token so every export links the stub to the entry;
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

/** How many stub lines name a guideline that cites the work. */
const STUB_MAX_GUIDELINES = 3;

/**
 * Section 2 (contributions): the prompts alone. The numbered stubs are not
 * guessed from the record any more — the owner picks the entries, one by one,
 * with the picker under the section (`appendContributionStub`), and until the
 * first pick the last prompt says where to do that. The editor's preview turns
 * that prompt into a link back to this section.
 */
function contributionsDraft(s: ProseStarterStrings): string {
  return paragraphs(s.draftNote, s.contribIntro, s.pickPrompt);
}

/** How many numbered stubs a contributions body holds ("1. ", "2. ", … lines). */
export function contributionStubCount(body: string): number {
  return body.split(/\r?\n/).filter((l) => /^\d+\. /.test(l)).length;
}

/**
 * One numbered contribution stub for a PICKED entry: the FRQ's slots (period,
 * audience A / B / C, role, impact), the clinical guidelines that cite the work
 * (impact a reviewer can check, with the PubMed record to follow), and a
 * plain-text reference. The head line ends with the entry's `[[id | label]]`
 * token, so every export links the stub to the entry (a DOI link when the list
 * is off the page, as under a narrative layout) and the editor counts it as cited.
 */
export function contributionStub(cv: CanonicalCv, item: CvItem, index: number): string {
  const s = proseStarterStrings(cv.display.locale);
  const year = itemYear(item);
  const title = itemTitle(item) ?? itemDisplayText(item)?.trim() ?? item.id;
  const head = `${index}. ${title} (${year ?? s.todo} · ${s.audience} : ${s.audienceKey}) ${evidenceToken(
    item.id,
    evidenceRefLabel(item),
  )}`;
  const guidelines = (item.meta.guidelineCitations ?? [])
    .slice(0, STUB_MAX_GUIDELINES)
    .map((g) => `${s.guidelineCited} : ${guidelineCitationLine(g)}. ${pubmedUrl(g.pmid)}`);
  const ref = starterReferenceLine(item);
  return [
    head,
    `${s.role} : ${s.todo}`,
    `${s.impact} : ${s.todo}`,
    ...guidelines,
    ref ? `${s.reference} : ${ref}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The "pick your publications" prompt in any locale — removed once a stub arrives. */
const PICK_PROMPTS = new Set(Object.values(PROSE_STARTER_STRINGS).map((x) => x.pickPrompt));

/**
 * The contributions body after the owner picks `item`: the "pick your
 * publications" prompt (in whatever language it was written) gives way, and the
 * entry's stub is appended with the next number. Returns the new body and the
 * range of the role slot's placeholder, so the editor can select it and the
 * owner's first keystroke replaces it. Pure; bounded by the prose cap.
 */
export function appendContributionStub(
  cv: CanonicalCv,
  section: CvSection,
  item: CvItem,
): { body: string; selectStart: number; selectEnd: number } {
  const s = proseStarterStrings(cv.display.locale);
  const kept = (section.body ?? "")
    .split(/\r?\n/)
    .filter((l) => !PICK_PROMPTS.has(l.trim()))
    .join("\n")
    .replace(/\s+$/, "");
  const stub = contributionStub(cv, item, contributionStubCount(kept) + 1);
  const body = (kept ? `${kept}\n\n${stub}` : stub).slice(0, PROSE_BODY_MAX);
  const roleLine = `${s.role} : ${s.todo}`;
  const at = body.lastIndexOf(roleLine);
  const selectEnd = at >= 0 ? at + roleLine.length : body.length;
  const selectStart = at >= 0 ? selectEnd - s.todo.length : body.length;
  return { body, selectStart, selectEnd };
}

/**
 * One supervision record as a bullet: "PhD, primary supervisor: Name (thesis;
 * institution; years)". The supervisee's name is third-party personal data: when
 * the owner has `display.hideSuperviseeNames` on, the degree-level noun stands in
 * for it, exactly as the supervision renderer does, so a draft the owner keeps
 * cannot leak a name the toggle hides everywhere else.
 */
function supervisionBullet(cv: CanonicalCv, item: CvItem, s: ProseStarterStrings): string {
  if (!hasStructuredSupervision(item)) return textBullet(item);
  const rs = renderStrings(cv.display.locale);
  const m = item.meta;
  const hideNames = cv.display.hideSuperviseeNames === true;
  const lead = [
    m.degreeLevel ? degreeLabel(rs, m.degreeLevel) : "",
    m.supervisionRole ? supervisionRoleLabel(rs, m.supervisionRole) : "",
  ]
    .filter(Boolean)
    .join(", ");
  const name = hideNames ? superviseeNoun(rs, m.degreeLevel) : m.superviseeName?.trim();
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

/** The heading the CV gives a list section (its current title). An item of `type`
 *  only ever lives in a section of that type, so the section always exists. */
function sectionHeading(cv: CanonicalCv, type: CvSectionType): string {
  /* v8 ignore next -- a section holding the items always exists */
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
      body = contributionsDraft(s);
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
