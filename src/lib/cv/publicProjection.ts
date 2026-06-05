import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * Project a canonical CV for PUBLIC display (the `/p/[slug]` living page).
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
  };
}
