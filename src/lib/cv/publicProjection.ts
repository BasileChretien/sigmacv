import { isHidden, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

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
/** The public-facing contact block: keep only the opted-in email/phone/location
 *  (per `display.publicContact`) plus the always-public `website`, or `undefined`
 *  when nothing public-facing remains. Shared by the public projection AND the
 *  no-login preview projection so this per-field consent logic — a privacy
 *  chokepoint — lives in exactly one place. */
function projectPublicContact(cv: CanonicalCv): CanonicalCv["owner"]["contact"] {
  const flags = cv.display.publicContact;
  const c = cv.owner.contact;
  if (!c) return undefined;
  const projected = {
    ...c,
    email: flags.email ? c.email : undefined,
    phone: flags.phone ? c.phone : undefined,
    location: flags.location ? c.location : undefined,
  };
  // Drop the contact block entirely if nothing public-facing remains.
  return projected.email || projected.phone || projected.location || projected.website
    ? projected
    : undefined;
}

/**
 * Strip the per-item OWNER-ONLY signals off one item — everything the public
 * projection removes from an item it keeps. Shared by {@link projectCvForPublic}
 * and by the frozen-snapshot freeze (`cv/snapshots.ts`), so the two lists can
 * never drift: a signal stripped from the public page is also never stored in a
 * snapshot. Pure + immutable.
 *
 *  - notMineReason / notMineAssertedAt / reviewedAt: the disambiguation reason,
 *    its timestamp and WHEN the owner adjudicated the work — behavioural
 *    metadata about a private curation session (kept in the stored doc for the
 *    owner + consented research only);
 *  - meta.reviewFlag / duplicateOf / misattribution / topic / workInstitutions /
 *    matchBasis / claimed: internal disambiguation hints ("this may be
 *    mis-attributed / a duplicate", the score + which signals fired, HOW the
 *    work was matched) — advisory cues surfaced only in the editor;
 *  - meta.refCount / selfRefs: reference / self-reference counts feed an
 *    OWNER-ONLY figure (the self-referencing share in the editor's health
 *    panel, `cv/selfReference.ts`); no public surface renders them and the
 *    share must not be derivable from the machine downloads;
 *  - meta.coauthorOrcids: the raw co-author ORCID list, an internal JSON-LD
 *    resolution input (the public page surfaces only the resolved `knows`
 *    links, never this identifier set);
 *  - meta.funders: the per-work funder ids from OpenAlex `awards[]`. Source
 *    data about the work, arguably public — but it is stored for a LATER
 *    funder join, and until that join decides what is shown nothing that could
 *    read as a funder-compliance signal may leave the owner's document (panel
 *    veto: no compliance verdicts on any public surface). Stripping it here
 *    keeps it out of the page, the machine downloads, the OAI feed and every
 *    frozen snapshot at once.
 * The other meta fields (authorRole, peerReviewed, institution, …) ARE used by
 * the renderers, so the strip is surgical rather than dropping `meta`.
 *
 * `hideSuperviseeName` additionally strips `meta.superviseeName` — a
 * supervisee's NAME is third-party personal data, so when the owner chose to
 * hide names (`display.hideSuperviseeNames`) the raw json must not carry it
 * either (the renderers show a degree-level noun instead). Defaults to false
 * so the snapshot freeze (which keeps the frozen `display` block and re-runs
 * this at serve time via {@link projectCvForPublic}) doesn't strip it twice.
 */
export function stripInternalItemSignals(it: CvItem, hideSuperviseeName = false): CvItem {
  return {
    ...it,
    notMineReason: undefined,
    notMineAssertedAt: undefined,
    reviewedAt: undefined,
    meta: {
      ...it.meta,
      reviewFlag: undefined,
      duplicateOf: undefined,
      misattribution: undefined,
      topic: undefined,
      workInstitutions: undefined,
      matchBasis: undefined,
      claimed: undefined,
      refCount: undefined,
      selfRefs: undefined,
      coauthorOrcids: undefined,
      funders: undefined,
      ...(hideSuperviseeName ? { superviseeName: undefined } : {}),
    },
  };
}

export function projectCvForPublic(cv: CanonicalCv): CanonicalCv {
  const contact = projectPublicContact(cv);

  // ONE per-section pass for the public view:
  //  - drop hidden / "not mine" items (never rendered) and strip their
  //    disambiguation reason + timestamp (an internal research signal) so neither
  //    leaks into the machine downloads (json/csljson/bibtex serialize this object
  //    directly); the stored canonical doc keeps them for the owner + research;
  //    `reviewedAt` goes with them — WHEN the owner adjudicated each work is
  //    behavioural metadata about a private curation session, never something they
  //    chose to publish;
  //  - drop the items the PUBLISHED view hid ("hide from this view"), so every
  //    public format reflects what the owner published, not the full set.
  const excludedItems = cv.display.excludedItems;
  const hideNames = cv.display.hideSuperviseeNames === true;
  const sections = cv.sections.map((s) => {
    const ex = excludedItems?.[s.id];
    const exSet = ex?.length ? new Set(ex) : null;
    return {
      ...s,
      items: s.items
        .filter((it) => !isHidden(it) && !exSet?.has(it.id))
        .map((it) => stripInternalItemSignals(it, hideNames)),
    };
  });

  return {
    ...cv,
    sections,
    // Personal (rirekisho) fields never auto-publish; contact is opt-in per field.
    // Metrics + per-year chart data honour the SAME display opt-ins as the HTML
    // render, so a machine-format download (.json) can't leak figures the owner
    // chose not to show (metrics are "opt-in, default none").
    owner: {
      ...cv.owner,
      contact,
      personal: undefined,
      metrics: cv.display.showMetrics ? cv.owner.metrics : undefined,
      countsByYear: cv.display.showCharts ? cv.owner.countsByYear : [],
      // Owner-declared career context (breaks, part-time, caring…) is sensitive
      // personal data: it leaves the account only when the owner shows the block.
      careerContext: cv.display.showCareerContext ? cv.owner.careerContext : undefined,
    },
    // Saved editor presets (named layout intents + display snapshots, possibly a
    // custom CSL XML blob) are an internal editor concept — never publish them.
    presets: [],
    // Owner-only private notes (a scratchpad) are never rendered, exported, or
    // published by design — strip them so they can't leak into the public page or
    // any machine download (the raw `json` format echoes this object verbatim).
    notes: undefined,
    // Internal editor bookkeeping that has no place in the public json:
    //  - excludedItems: the per-view exclude-id deny-list (already applied above),
    //  - dismissedDuplicates: the pairs the owner marked "not a duplicate",
    //  - dismissedReviewCandidates: review candidates the owner kept hidden —
    //    all records of internal curation decisions, never public-facing.
    display: {
      ...cv.display,
      excludedItems: undefined,
      dismissedDuplicates: undefined,
      dismissedReviewCandidates: undefined,
    },
  };
}

/**
 * Project a canonical CV for the NO-LOGIN preview EDITOR (`/preview/[orcid]`).
 *
 * The anonymous preview is viewed by whoever pasted the iD — not necessarily the
 * owner — so it strips the same owner-private/contact fields the public page hides
 * (contact behind per-field consent, rirekisho `personal`, private `notes`, saved
 * presets). But UNLIKE {@link projectCvForPublic}, it KEEPS every item (including
 * hidden "not mine" / review CANDIDATES) and their per-item review metadata
 * (`reviewFlag`, `duplicateOf`, `misattribution`, …). That's the whole point: the
 * anonymous editor then surfaces the very same "probably not yours" / "probably a
 * duplicate" curation cues a signed-in editor gets. Safe because the renderers
 * never emit that metadata and only render INCLUDED items, so nothing extra leaks
 * on any HTML/machine render — the metadata lives only in the editor's UI.
 *
 * NO FIGURE ABOUT THE PERSON. The visitor may be anyone, and only the researcher
 * may put a number on their own record (they sign in to do so). So this strips
 * the author-level metrics and the per-year series, every per-work indicator
 * (citation counts, FWCI, top-decile flag, RCR, clinical citations, APT, the
 * OpenCitations count) and forces the corresponding display toggles off — so
 * neither the render nor the anonymous editor's controls can surface a figure,
 * whatever a visitor toggles. A citation sort is reset to newest-first for the
 * same reason. The privacy notice promises exactly this. Pure + immutable.
 */
export function projectCvForPreview(cv: CanonicalCv): CanonicalCv {
  return {
    ...cv,
    owner: {
      ...cv.owner,
      contact: projectPublicContact(cv),
      // Rirekisho personal fields never auto-surface (no opt-in); an anonymous
      // build never populates them, but strip defensively.
      personal: undefined,
      // Author-level figures and the per-year series: never for a non-owner.
      metrics: undefined,
      countsByYear: [],
    },
    // Keep every item + its review cues (reviewFlag/duplicateOf/misattribution),
    // but strip `meta.coauthorOrcids` — a raw list of THIRD-PARTY ORCID iDs used
    // only server-side (JSON-LD `knows` resolution on publish). The editor never
    // needs it, and this whole object is sent to the anonymous browser, so it must
    // not ship (the public projection drops it for the same reason). The
    // reference / self-reference counts go with it: they feed an owner-only
    // figure (`cv/selfReference.ts`) that an anonymous viewer must not see. The
    // per-work funder ids too: nothing in the preview editor reads them, and
    // they stay owner-only until the funder join decides what is shown.
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => ({
        ...it,
        meta: {
          ...it.meta,
          coauthorOrcids: undefined,
          refCount: undefined,
          selfRefs: undefined,
          funders: undefined,
          // Per-work figures (see the module note): none survive.
          citedByCount: undefined,
          fwci: undefined,
          topDecile: undefined,
          rcr: undefined,
          clinicalCitations: undefined,
          apt: undefined,
          citedByOpenCitations: undefined,
        },
      })),
    })),
    // Owner-only scratchpad + saved editor layouts: never for a non-owner viewer.
    notes: undefined,
    presets: [],
    display: {
      ...cv.display,
      showMetrics: false,
      metrics: [],
      showCharts: false,
      showCitationCounts: false,
      showWorkIndicators: false,
      showAuthorshipTable: false,
      authorshipRoles: [],
      publicationOrder:
        cv.display.publicationOrder === "citations" ? "year-desc" : cv.display.publicationOrder,
    },
  };
}
