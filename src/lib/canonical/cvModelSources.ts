import type { CvModelId } from "./cvModels";

/**
 * The funder's own documents each CV model was read against, and when.
 *
 * A model is a starting point shaped like a funder's CV (`cvModels.ts`); this
 * table is what makes that claim checkable. Each entry names the document a
 * maintainer read the model against and the day they did it, and the editor
 * prints both under the model's description, so a researcher can open the
 * funder's text and see how old the reading is.
 *
 * Funders reissue their rules with each call, so a reading goes stale by
 * itself. Each entry says when it is due again (`recheckBy`: when the funder's
 * next rules are expected, twelve months after the reading unless set), and the
 * editor says so under a due model. The monthly `CV model sources` workflow
 * (`cvModelSourceCheck.ts`, run by `npm run models:sources`) turns red for a due
 * reading, for a document that is gone or now redirects elsewhere, and for one
 * the funder's own page (`listedOn`) stopped linking to. How to re-read a
 * model: `docs/CV-MODELS.md`.
 *
 * A model with no entry has not been read against a funder document, and the
 * editor prints nothing for it rather than a date it never had.
 */

/** One funder document a model was read against. */
export interface CvModelSource {
  /** The document as the funder names it, untranslated (e.g. "Guide de l'AAPG 2027"). */
  document: string;
  /** Where to read it (https). */
  url: string;
  /**
   * The funder's page that links to the document (https), when there is one:
   * once it stops linking to `url`, a revised version or a new edition has
   * probably replaced it there. A page for one year's call only catches a
   * revision within that year; `recheckBy` catches the next year's call.
   */
  listedOn?: string;
  /** The day a maintainer last read the model against `url` (YYYY-MM-DD). */
  lastVerified: string;
  /**
   * The day the reading is due again (YYYY-MM-DD): when the funder's next rules
   * are expected. Absent, twelve months after `lastVerified`.
   */
  recheckBy?: string;
}

const CV_MODEL_SOURCES: Partial<Record<CvModelId, readonly CvModelSource[]>> = {
  // The ANR publishes each AAPG in July, on a call page of its own: this year's
  // page catches a revised version (the 2026 guide went to v2.0); the due date
  // catches the 2028 call.
  anr: [
    {
      document: "AAPG 2027 — CV completion guide (v1.0)",
      url: "https://anr.fr/fileadmin/aap/2027/anr-aapg-2027-completion-CV-V1.0-en.pdf",
      listedOn:
        "https://anr.fr/en/call-for-proposals-details/call/aapg-2027-generic-call-for-proposals-1/",
      lastVerified: "2026-10-16",
      recheckBy: "2027-07-15",
    },
    {
      document: "Guide de l'AAPG 2027 (v1.0)",
      url: "https://anr.fr/fileadmin/aap/2027/anr-aapg-2027-guide-v1.0.pdf",
      listedOn:
        "https://anr.fr/en/call-for-proposals-details/call/aapg-2027-generic-call-for-proposals-1/",
      lastVerified: "2026-10-16",
      recheckBy: "2027-07-15",
    },
  ],
  // The CV form itself is behind the Synto login; the Équipes notice shows it and
  // its metrics rule, a thematic call's notice the publications-and-patents list.
  frm: [
    {
      document: "Équipes FRM 2027 — notice explicative pré-demande",
      url: "https://www.frm.org/uploads/2027_Equipes_FRM_Notice_1518785290.pdf",
      lastVerified: "2026-10-16",
    },
    {
      document: "Environnement et Santé 2026 — notice de demande",
      url: "https://www.frm.org/uploads/frm_notice_demande_ENV_2026_0ddd18f359.pdf",
      lastVerified: "2026-10-16",
    },
  ],
  // Fondation ARC publishes its calls' notices in June.
  "fondation-arc": [
    {
      document: "Projets Fondation ARC 2026 — notice",
      url: "https://www.fondation-arc.org/wp-content/uploads/2026/06/notice-aap-projets-arc-2026.pdf",
      listedOn: "https://www.fondation-arc.org/appels-a-projets/projets-fondation-arc/",
      lastVerified: "2026-10-16",
      recheckBy: "2027-07-01",
    },
    {
      document: "Post-doctorants en France 2026 — notice",
      url: "https://www.fondation-arc.org/wp-content/uploads/2026/06/notice-aap-pdf-a2026_fr.pdf",
      listedOn: "https://www.fondation-arc.org/appels-a-projets/post-doctorants-en-france/",
      lastVerified: "2026-10-16",
      recheckBy: "2027-07-01",
    },
  ],
  // Atip-Avenir opens each September (the 2027 call on 15 September 2026).
  "atip-avenir": [
    {
      document: "Atip-Avenir Program 2027 — Guide for applicants",
      url: "https://www.insb.cnrs.fr/sites/institut_insb/files/page/2026-09/Guide%20for%20applicants%202027_0.pdf",
      listedOn: "https://www.insb.cnrs.fr/fr/atip-avenir",
      lastVerified: "2026-10-16",
      recheckBy: "2027-09-15",
    },
    {
      document: "Atip-Avenir Call 2027 — Curriculum Vitae template",
      url: "https://www.insb.cnrs.fr/sites/institut_insb/files/page/2026-09/Atip-Avenir%20Curriculum%20Vitae%20Template%202027%20VF.docx",
      listedOn: "https://www.insb.cnrs.fr/fr/atip-avenir",
      lastVerified: "2026-10-16",
      recheckBy: "2027-09-15",
    },
  ],
};

/** Keyed by any string, so an id the editor holds (or "constructor") reads nothing inherited. */
const SOURCES_BY_ID = new Map(Object.entries(CV_MODEL_SOURCES));

/** The documents model `id` was read against; empty for an unread model or an unknown id. */
export function cvModelSources(id: string): readonly CvModelSource[] {
  return SOURCES_BY_ID.get(id) ?? [];
}

/** What the editor prints under a model's description. */
export interface CvModelSourceNote {
  documents: ReadonlyArray<Pick<CvModelSource, "document" | "url">>;
  /** The earliest day its documents were read (YYYY-MM-DD). */
  lastVerified: string;
  /** Whether any of those readings is due again at the time asked. */
  due: boolean;
}

/** The note for model `id` at `now`; undefined for a model never read against a document. */
export function cvModelSourceNote(id: string, now: Date): CvModelSourceNote | undefined {
  const sources = cvModelSources(id);
  if (sources.length === 0) return undefined;
  const earliest = Math.min(...sources.map((s) => Date.parse(`${s.lastVerified}T00:00:00Z`)));
  return {
    documents: sources.map(({ document, url }) => ({ document, url })),
    lastVerified: new Date(earliest).toISOString().slice(0, 10),
    due: sources.some((s) => isCvModelSourceDue(s, now)),
  };
}

/** Every model that has been read against a funder document, with its documents. */
export function verifiedCvModelSources(): ReadonlyArray<
  readonly [CvModelId, readonly CvModelSource[]]
> {
  return Object.entries(CV_MODEL_SOURCES) as Array<[CvModelId, readonly CvModelSource[]]>;
}

/** The day `source` is due to be read again (YYYY-MM-DD). */
export function cvModelSourceDueOn(source: CvModelSource): string {
  if (source.recheckBy) return source.recheckBy;
  const read = new Date(`${source.lastVerified}T00:00:00Z`);
  const year = read.getUTCFullYear() + 1;
  const month = read.getUTCMonth();
  // 29 February has no anniversary in a common year: the reading is due on the 28th.
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(read.getUTCDate(), lastDay)))
    .toISOString()
    .slice(0, 10);
}

/** Whether `source` is due to be read again at `now` (from the start of its due day, UTC). */
export function isCvModelSourceDue(source: CvModelSource, now: Date): boolean {
  return now.getTime() >= Date.parse(`${cvModelSourceDueOn(source)}T00:00:00Z`);
}
