import { toCslName } from "@/lib/openalex/toCsl";
import { nameVariants } from "./nameVariants";
import { isHidden, type CanonicalCv, type DisplayChoices } from "./schema";

/**
 * The people the owner supervised, as printed-name variants, for the FRQ rule
 * "add an asterisk after the name of each person you supervise (Nom, Prénom*)".
 *
 * A DELIBERATE exception to the identifier-only matching rule. The account
 * holder is matched by identifier because the data comes from external sources
 * and a name string would misattribute. A supervisee has no identifier anywhere
 * in our data: the only thing we know is the name the OWNER typed into their own
 * supervision record, and the only place it is looked for is the author list of
 * the owner's own works. The mark is opt-in (`display.markSupervisees`), the
 * layouts that require it set it, and a namesake co-author would be marked too:
 * the editor says so beside the switch.
 *
 * citeproc prints names style-specifically ("Kaur, P.", "P. Kaur", "Kaur P",
 * "Priya Kaur"), so every form is offered, longest first, and the family name
 * alone last, so "Kaur, P." is marked as a whole ("Kaur, P.*") when the style
 * prints initials.
 */

/** "Jean-Baptiste" → "J.-B.", "Marie Claire" → "M. C.". */
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

/** Every printed form of one supervisee's name a citation style might use. */
export function superviseePrintedForms(rawName: string): string[] {
  const raw = rawName.trim();
  if (!raw) return [];
  const out = new Set<string>(nameVariants(raw));
  const name = toCslName(raw);
  const family = typeof name.family === "string" ? name.family.trim() : "";
  const given = typeof name.given === "string" ? name.given.trim() : "";
  if (family && given) {
    const ini = initials(given);
    const bare = ini.replace(/\./g, "");
    out.add(`${family}, ${ini}`); // APA: Kaur, P.
    out.add(`${ini} ${family}`); // Chicago-like: P. Kaur
    out.add(`${family} ${bare}`); // Vancouver / AMA: Kaur P
    out.add(`${family}, ${bare}`); // Kaur, P
  }
  return [...out].filter((v) => v.length >= 2).sort((a, b) => b.length - a.length);
}

/**
 * The printed-name variants of every supervisee on the CV (included, not
 * "not mine" supervision records that carry a name), longest first, deduplicated.
 */
export function superviseeNameVariants(cv: CanonicalCv): string[] {
  const out = new Set<string>();
  for (const section of cv.sections) {
    if (section.type !== "supervision") continue;
    for (const item of section.items) {
      if (isHidden(item)) continue;
      const name = item.meta.superviseeName?.trim();
      if (!name) continue;
      for (const v of superviseePrintedForms(name)) out.add(v);
    }
  }
  return [...out].sort((a, b) => b.length - a.length);
}

/**
 * Whether supervisee names are marked on this document: the owner (or the
 * layout) asked for it, and the owner is not hiding supervisee names, because an
 * asterisk on a co-author says "this person was my student", which is the very
 * relationship that toggle keeps off the page.
 */
export function shouldMarkSupervisees(display: DisplayChoices): boolean {
  return display.markSupervisees === true && display.hideSuperviseeNames !== true;
}
