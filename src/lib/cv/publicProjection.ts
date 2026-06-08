import { isHidden, type CanonicalCv } from "@/lib/canonical/schema";

/**
 * Project a canonical CV for PUBLIC display (the `/p/[slug]` living page).
 *
 * ┌─ THE SOLE PUBLIC GATE ─────────────────────────────────────────────────────┐
 * │ This is the ONE chokepoint through which EVERY public serialization passes: │
 * │ the rendered HTML page AND all machine formats served from the same slug —  │
 * │ `json` (the RAW canonical object), `csljson`, `bibtex`, and `jsonld`.        │
 * │ `getPublicCvForPage` runs the stored document through here before any of     │
 * │ them touch it, so this projection is the last line of defence against an     │
 * │ owner-level field leaking publicly.                                          │
 * │                                                                              │
 * │ ⇒ Whenever a NEW field is added to the owner/CV that should NOT be public by │
 * │   default (anything personal, internal, or consent-gated), it MUST be        │
 * │   evaluated/stripped HERE. The raw `json` format echoes the projected object │
 * │   verbatim, so a field left in survives into a downloadable public file.     │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Data-minimization (GDPR/APPI): publishing shares the CV body, but personal
 * contact + identity fields are exposed publicly only when the owner explicitly
 * opts each one in. Pure + immutable — returns a new object, never mutates.
 *
 *  - `owner.personal` (rirekisho: address, date of birth, gender, nationality)
 *    is ALWAYS stripped: these never auto-publish and have no opt-in flag.
 *  - `owner.contact.{email, phone, location}` are dropped unless the matching
 *    `display.publicContact` flag is true. `website` is kept (a public link the
 *    user added on purpose).
 *
 * The owner's OWN data-export (`/api/account/export`) and editor preview keep the
 * full document — this projection applies only to the public page.
 */
export function projectCvForPublic(cv: CanonicalCv): CanonicalCv {
  const flags = cv.display.publicContact;
  const c = cv.owner.contact;

  let contact = c;
  if (c) {
    const projected = {
      ...c,
      email: flags.email ? c.email : undefined,
      phone: flags.phone ? c.phone : undefined,
      location: flags.location ? c.location : undefined,
    };
    // Drop the contact block entirely if nothing public-facing remains.
    contact =
      projected.email || projected.phone || projected.location || projected.website
        ? projected
        : undefined;
  }

  return {
    ...cv,
    // Personal (rirekisho) fields never auto-publish; contact is opt-in per field.
    owner: { ...cv.owner, contact, personal: undefined },
    // Hidden / "not mine" items are never rendered — drop them from the public
    // projection so a disavowed work (and its disambiguation reason + timestamp,
    // an internal research signal) can't leak into the downloadable machine
    // formats (json/csljson/bibtex), which serialize the projected object
    // directly. The stored canonical doc keeps them for the owner + research.
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items
        .filter((it) => !isHidden(it))
        .map((it) => ({ ...it, notMineReason: undefined, notMineAssertedAt: undefined })),
    })),
  };
}
