import {
  DEFAULT_SECTION_ORDER,
  isProseSectionType,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
  type DisplayChoices,
} from "./schema";
import { setSectionVisible, updateDisplay } from "./curate";
import { sectionTitle } from "@/lib/i18n";

/**
 * ───────────────────────────────────────────────────────────────────────────
 * CV-MODEL CATALOG — one-click "ready for this call/job" starting layouts.
 * ───────────────────────────────────────────────────────────────────────────
 * Generalizes the original grant-preset mechanism into a BROAD catalog that
 * spans three categories:
 *   • "grant"       — funder calls worldwide (ERC, NIH/NSF, DFG, JSPS, …);
 *   • "institution" — public-institution / job CVs (Europass, academic faculty
 *                     CVs, the Japanese rirekisho / shokumu-keirekisho, UN P.11);
 *   • "industry"    — industry / pharma / clinical CVs (ICH-GCP investigator,
 *                     biotech R&D résumé, physician CV, Medical Affairs).
 *
 * Each model configures the canonical CV to match the STRUCTURE that a call /
 * employer expects, reusing the existing section types + display fields. These
 * are structured STARTING POINTS, not pixel-exact official templates — a funder
 * mandates its own portal/template and the model's `description` says so.
 *
 * Applying a model:
 *  - ensures every section it wants EXISTS (creating any missing one as an empty
 *    section — including the `narrative-*` / `statement` prose sections);
 *  - sets exactly those sections VISIBLE and hides the rest;
 *  - orders the visible sections to the model's sequence;
 *  - applies the display overrides (publications limit / order / peer-reviewed);
 *  - applies `titleOverrides` so call-specific headings appear (e.g. NSF
 *    "Professional Preparation").
 * It never deletes curated item data, so it is fully reversible — the editor
 * snapshots the current view as a named preset first.
 *
 * ── i18n policy (deliberate) ───────────────────────────────────────────────
 * `name`, `description` and `titleOverrides` are PLAIN ENGLISH proper-noun
 * strings (funder names + the call's specific required headings). They are NOT
 * routed through the ten-locale i18n — a researcher applying to the NSF needs
 * "Professional Preparation" whatever their UI locale, exactly as the NIH/grant
 * renderers keep their fixed headings. Only the editor CHROME (the picker
 * labels) is localized.
 */

/** The category a CV model belongs to (drives the grouped picker's optgroups). */
export type CvModelCategory = "grant" | "institution" | "industry";

/** Display overrides a model applies via `updateDisplay`. All optional. */
export interface CvModelDisplay {
  publicationsLimit?: number;
  publicationOrder?: DisplayChoices["publicationOrder"];
  peerReviewedOnly?: boolean;
}

/**
 * One CV model: the target layout for a funder call / job / industry CV,
 * expressed purely in terms of existing section types + display fields.
 */
export interface CvModel {
  /** Stable, unique id (e.g. "erc", "nih", "europass", "gcp-investigator"). */
  id: string;
  /** Which optgroup it sits under in the picker. */
  category: CvModelCategory;
  /** Region / context tag (e.g. "EU", "US", "JP", "INT", "Pharma"). Display only. */
  region: string;
  /** Plain-English model name (proper noun — NOT i18n'd). */
  name: string;
  /** One-paragraph plain-English description (proper nouns — NOT i18n'd). */
  description: string;
  /**
   * The sections the model wants VISIBLE, in their ORDER. Each is created
   * (empty) if absent, set visible, and ordered by its position in this array;
   * every section NOT in this list is hidden. Omit a type to hide it entirely
   * (e.g. omit `publications` for a pure-narrative model).
   */
  sections: readonly CvSectionType[];
  /** Display overrides (publications limit / order / peer-reviewed-only). */
  display?: CvModelDisplay;
  /**
   * Call-specific section headings (plain English, NOT i18n'd). When a section
   * is created or shown by this model, its `title` is set to the override so
   * funder-specific wording appears (e.g. NSF `publications → "Products"`).
   */
  titleOverrides?: Partial<Record<CvSectionType, string>>;
}

/* ── Display shorthands (see the task brief) ──────────────────────────────── */
const TR10: CvModelDisplay = {
  publicationsLimit: 10,
  publicationOrder: "year-desc",
  peerReviewedOnly: true,
};
const BS5: CvModelDisplay = { publicationsLimit: 5, peerReviewedOnly: true };
const BS10: CvModelDisplay = { publicationsLimit: 10, peerReviewedOnly: true };
const NAR: CvModelDisplay = { publicationsLimit: 5, peerReviewedOnly: true };
const CONCISE5: CvModelDisplay = { publicationsLimit: 5 };
const CONCISE10: CvModelDisplay = { publicationsLimit: 10 };
const FULL: CvModelDisplay = {};

/**
 * The CV-model catalog. Ordered grant → institution → industry; within grant,
 * grouped by region (Europe, US, then Canada/Australia/Japan/China).
 */
export const CV_MODELS: readonly CvModel[] = [
  // ─── GRANT — Europe ───────────────────────────────────────────────────────
  {
    id: "erc",
    category: "grant",
    region: "EU",
    name: "ERC (Starting / Consolidator / Advanced)",
    description:
      "European Research Council CV + Track Record (career, funding, ~10 representative publications). Submitted via the EU Funding & Tenders portal.",
    sections: [
      "education",
      "positions",
      "awards",
      "grants",
      "supervision",
      "teaching",
      "service",
      "editorial",
      "peer-review",
      "talks",
      "publications",
    ],
    display: TR10,
    titleOverrides: {
      publications: "Track Record — selected publications",
      service: "Institutional responsibilities & commissions of trust",
      awards: "Fellowships & awards",
    },
  },
  {
    id: "msca-pf",
    category: "grant",
    region: "EU",
    name: "MSCA Postdoctoral Fellowship",
    description: "Marie Skłodowska-Curie Postdoctoral Fellowship CV (EU Funding & Tenders portal).",
    sections: [
      "positions",
      "education",
      "publications",
      "supervision",
      "teaching",
      "awards",
      "grants",
      "talks",
    ],
    display: BS10,
  },
  {
    id: "horizon",
    category: "grant",
    region: "EU",
    name: "Horizon Europe (generic)",
    description: "Generic Horizon Europe participant CV.",
    sections: [
      "positions",
      "education",
      "publications",
      "grants",
      "awards",
      "supervision",
      "teaching",
      "service",
    ],
    display: BS10,
  },
  {
    id: "embo",
    category: "grant",
    region: "EU",
    name: "EMBO Fellowship",
    description: "EMBO long-term / postdoctoral fellowship CV + publication list.",
    sections: ["education", "positions", "publications", "awards"],
    display: BS10,
  },
  {
    id: "dfg",
    category: "grant",
    region: "DE",
    name: "DFG (German Research Foundation)",
    description:
      "DFG uniform CV + publication list: Category A (peer-reviewed) is mandatory and capped at 10; up to 10 'most important' may be highlighted.",
    sections: [
      "education",
      "positions",
      "awards",
      "supervision",
      "service",
      "grants",
      "publications",
    ],
    display: TR10,
    titleOverrides: {
      publications: "Publication list (Category A — peer-reviewed, ≤10)",
    },
  },
  {
    id: "snsf",
    category: "grant",
    region: "CH",
    name: "SNSF SciCV (narrative)",
    description:
      "Swiss NSF SciCV narrative format: describe 1–3 major achievements with selected works. DORA-compliant — no metrics, no long publication list.",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
      "education",
      "positions",
      "awards",
    ],
    display: NAR,
  },
  {
    id: "nwo",
    category: "grant",
    region: "NL",
    name: "NWO (Dutch Research Council)",
    description: "Dutch Research Council CV with narrative evidence of esteem + academic profile.",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
      "positions",
      "education",
      "awards",
      "grants",
      "publications",
    ],
    display: NAR,
  },
  {
    id: "anr",
    category: "grant",
    region: "FR",
    name: "ANR (France)",
    description:
      "French National Research Agency CV: recent career, selected publications, funding.",
    sections: ["positions", "education", "supervision", "publications", "grants", "awards"],
    display: { publicationsLimit: 8, publicationOrder: "year-desc" },
  },
  {
    id: "fwf",
    category: "grant",
    region: "AT",
    name: "FWF (Austria)",
    description: "Austrian Science Fund CV + publication list.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: BS10,
  },
  {
    id: "wellcome",
    category: "grant",
    region: "UK",
    name: "Wellcome Trust",
    description: "Wellcome Trust CV emphasising contributions and key outputs (narrative-leaning).",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
      "positions",
      "education",
      "publications",
    ],
    display: NAR,
  },
  {
    id: "ukri-r4ri",
    category: "grant",
    region: "UK",
    name: "UKRI Résumé for Research & Innovation (R4RI)",
    description:
      "UKRI narrative CV (R4RI): four contribution modules; no traditional publication list.",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
    ],
    display: FULL,
  },
  {
    id: "royal-society",
    category: "grant",
    region: "UK",
    name: "Royal Society Résumé for Researchers",
    description: "Royal Society narrative CV: four contribution modules.",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
    ],
    display: FULL,
  },

  // ─── GRANT — US ───────────────────────────────────────────────────────────
  {
    id: "nih",
    category: "grant",
    region: "US",
    name: "NIH biosketch (SciENcv)",
    description:
      "NIH biosketch (≤5 pages): Personal Statement = your Summary; Positions & Honors; Contributions to Science. Generate/certify the official PDF via SciENcv (eRA/Research.gov).",
    sections: ["education", "positions", "awards", "service", "talks", "publications"],
    display: BS5,
    titleOverrides: {
      education: "Education / Training",
      positions: "Positions, Scientific Appointments & Honors",
      publications: "Contributions to Science",
      service: "Contributions (service)",
    },
  },
  {
    id: "nsf",
    category: "grant",
    region: "US",
    name: "NSF biographical sketch (SciENcv)",
    description:
      "NSF biosketch: Professional Preparation, Appointments, Products (≤10), Synergistic Activities. Use SciENcv on Research.gov.",
    sections: ["education", "positions", "publications", "service", "talks", "grants"],
    display: BS10,
    titleOverrides: {
      education: "Professional Preparation",
      positions: "Appointments",
      publications: "Products",
      service: "Synergistic Activities",
    },
  },
  {
    id: "doe-dod-nasa",
    category: "grant",
    region: "US",
    name: "DOE / DOD / NASA biosketch",
    description: "US federal agency biosketch (DOE/DOD/NASA), SciENcv-style.",
    sections: ["education", "positions", "publications", "service", "talks"],
    display: BS10,
  },

  // ─── GRANT — Canada / Australia / Japan / China ───────────────────────────
  {
    id: "ccv",
    category: "grant",
    region: "CA",
    name: "Canadian Tri-agency narrative CV (CCV)",
    description:
      "Canadian Common CV / Tri-agency narrative (CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Final submission via the CCV portal.",
    sections: [
      "statement",
      "narrative-knowledge",
      "supervision",
      "education",
      "positions",
      "grants",
      "publications",
    ],
    display: NAR,
    titleOverrides: {
      statement: "Personal statement",
      "narrative-knowledge": "Most significant contributions & experiences",
      supervision: "Supervisory & mentorship activities",
    },
  },
  {
    id: "arc",
    category: "grant",
    region: "AU",
    name: "ARC (ROPE)",
    description:
      "Australian Research Council CV with ROPE — outputs assessed relative to opportunity; note career interruptions in the ROPE statement.",
    sections: [
      "statement",
      "positions",
      "education",
      "awards",
      "grants",
      "publications",
      "supervision",
      "service",
    ],
    display: TR10,
    titleOverrides: {
      statement: "Research opportunity & performance evidence (ROPE)",
    },
  },
  {
    id: "nhmrc",
    category: "grant",
    region: "AU",
    name: "NHMRC",
    description: "NHMRC track record 'relative to opportunity'.",
    sections: [
      "statement",
      "positions",
      "education",
      "publications",
      "grants",
      "awards",
      "supervision",
    ],
    display: TR10,
    titleOverrides: {
      statement: "Research impact & track record relative to opportunity",
    },
  },
  {
    id: "jsps",
    category: "grant",
    region: "JP",
    name: "JSPS / KAKENHI",
    description:
      "JSPS / KAKENHI researcher profile (researchmap · e-Rad): research achievements, career, funding, awards.",
    sections: ["publications", "positions", "education", "grants", "awards"],
    display: BS10,
    titleOverrides: {
      publications: "研究業績 / Publications",
      positions: "経歴 / Career",
      grants: "研究費 / Research funding",
      awards: "受賞 / Awards",
    },
  },
  {
    id: "amed",
    category: "grant",
    region: "JP",
    name: "AMED (Japan medical research)",
    description:
      "AMED (Japan Agency for Medical Research & Development) CV — clinical/medical research emphasis.",
    sections: ["positions", "education", "publications", "grants", "awards", "service"],
    display: BS10,
  },
  {
    id: "nsfc",
    category: "grant",
    region: "CN",
    name: "NSFC (China)",
    description:
      "National Natural Science Foundation of China biosketch: representative publications.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: BS5,
    titleOverrides: {
      publications: "Representative publications (≤5)",
    },
  },

  // ─── GRANT — national funders (more) ──────────────────────────────────────
  {
    id: "aei",
    category: "grant",
    region: "ES",
    name: "AEI / Ramón y Cajal (Spain)",
    description: "Spanish State Research Agency (AEI) / Ramón y Cajal CV.",
    sections: [
      "education",
      "positions",
      "publications",
      "grants",
      "awards",
      "supervision",
      "teaching",
    ],
    display: TR10,
  },
  {
    id: "prin",
    category: "grant",
    region: "IT",
    name: "MUR / PRIN (Italy)",
    description: "Italian Ministry of University & Research (PRIN) CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },
  {
    id: "vr",
    category: "grant",
    region: "SE",
    name: "Vetenskapsrådet (Sweden)",
    description: "Swedish Research Council CV.",
    sections: ["education", "positions", "publications", "grants", "awards", "supervision"],
    display: TR10,
  },
  {
    id: "rcn",
    category: "grant",
    region: "NO",
    name: "Research Council of Norway",
    description: "Research Council of Norway CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },
  {
    id: "sfi",
    category: "grant",
    region: "IE",
    name: "Science Foundation Ireland",
    description: "Science Foundation Ireland CV.",
    sections: ["education", "positions", "publications", "grants", "awards", "supervision"],
    display: TR10,
  },
  {
    id: "fwo-fnrs",
    category: "grant",
    region: "BE",
    name: "FWO / F.R.S.-FNRS (Belgium)",
    description: "Research Foundation–Flanders (FWO) / FNRS CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },
  {
    id: "isf",
    category: "grant",
    region: "IL",
    name: "Israel Science Foundation",
    description: "Israel Science Foundation CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },
  {
    id: "nrf-kr",
    category: "grant",
    region: "KR",
    name: "NRF (Korea)",
    description: "National Research Foundation of Korea CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: BS10,
  },
  {
    id: "fapesp",
    category: "grant",
    region: "BR",
    name: "FAPESP / CNPq (Brazil)",
    description: "FAPESP Súmula Curricular / CNPq (Lattes) CV (Brazil).",
    sections: [
      "education",
      "positions",
      "publications",
      "grants",
      "awards",
      "supervision",
      "teaching",
    ],
    display: TR10,
  },
  {
    id: "serb",
    category: "grant",
    region: "IN",
    name: "SERB / DST (India)",
    description: "Science & Engineering Research Board (India) CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },
  {
    id: "nrf-sg",
    category: "grant",
    region: "SG",
    name: "NRF / A*STAR (Singapore)",
    description: "Singapore NRF / A*STAR CV.",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },

  // ─── GRANT — biomedical + philanthropic ───────────────────────────────────
  {
    id: "mrc-uk",
    category: "grant",
    region: "UK",
    name: "MRC (UK Medical Research Council)",
    description: "UK Medical Research Council CV (narrative, R4RI-aligned).",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
      "positions",
      "education",
      "publications",
    ],
    display: NAR,
  },
  {
    id: "cruk",
    category: "grant",
    region: "UK",
    name: "Cancer Research UK",
    description: "Cancer Research UK fellowship CV.",
    sections: ["positions", "education", "publications", "grants", "awards", "supervision"],
    display: TR10,
  },
  {
    id: "frm-arc",
    category: "grant",
    region: "FR",
    name: "FRM / Fondation ARC (France, biomedical)",
    description: "Fondation pour la Recherche Médicale / Fondation ARC (French biomedical) CV.",
    sections: ["positions", "education", "publications", "grants", "awards"],
    display: TR10,
  },
  {
    id: "hhmi",
    category: "grant",
    region: "US",
    name: "HHMI / Simons / CZI",
    description:
      "Private US biomedical funders (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    sections: ["education", "positions", "publications", "awards", "service"],
    display: BS10,
  },
  {
    id: "gates",
    category: "grant",
    region: "INT",
    name: "Gates Foundation",
    description: "Gates Foundation grant CV (impact / narrative-leaning).",
    sections: [
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
      "positions",
      "education",
      "publications",
    ],
    display: NAR,
  },
  {
    id: "leverhulme-vw",
    category: "grant",
    region: "EU",
    name: "Leverhulme / VolkswagenStiftung",
    description: "Private European foundations (Leverhulme Trust, Volkswagen Foundation).",
    sections: ["education", "positions", "publications", "grants", "awards"],
    display: TR10,
  },

  // ─── PUBLIC INSTITUTION / JOB ─────────────────────────────────────────────
  {
    id: "europass",
    category: "institution",
    region: "EU",
    name: "Europass CV",
    description: "EU-standard Europass CV (work experience, education, skills, languages).",
    sections: ["positions", "education", "skills", "languages", "publications", "awards"],
    display: FULL,
    titleOverrides: {
      positions: "Work experience",
    },
  },
  {
    id: "academic-us",
    category: "institution",
    region: "US",
    name: "US academic / faculty CV",
    description: "Comprehensive US academic / faculty CV (full publication list).",
    sections: [
      "education",
      "positions",
      "awards",
      "grants",
      "publications",
      "preprints",
      "teaching",
      "supervision",
      "service",
      "talks",
      "editorial",
      "peer-review",
      "references",
    ],
    display: FULL,
  },
  {
    id: "academic-uk",
    category: "institution",
    region: "UK",
    name: "UK academic CV",
    description: "Comprehensive UK academic CV.",
    sections: [
      "education",
      "positions",
      "awards",
      "grants",
      "publications",
      "teaching",
      "supervision",
      "service",
      "talks",
      "references",
    ],
    display: FULL,
  },
  {
    id: "academic-de",
    category: "institution",
    region: "DE",
    name: "German academic CV (Lebenslauf)",
    description: "German academic Lebenslauf + publication list.",
    sections: ["education", "positions", "awards", "publications", "teaching", "service"],
    display: FULL,
    titleOverrides: {
      positions: "Beruflicher Werdegang / Positions",
    },
  },
  {
    id: "rirekisho",
    category: "institution",
    region: "JP",
    name: "Japanese rirekisho (履歴書)",
    description: "Japanese 履歴書 (rirekisho) job CV — pairs with the rirekisho template.",
    sections: ["education", "positions", "awards", "skills", "languages", "references"],
    display: FULL,
  },
  {
    id: "shokumu",
    category: "institution",
    region: "JP",
    name: "Japanese shokumu-keirekisho (職務経歴書)",
    description: "Japanese 職務経歴書 career-history CV (JREC-IN academic/research jobs).",
    sections: ["positions", "education", "publications", "teaching", "grants", "skills"],
    display: FULL,
  },
  {
    id: "un-p11",
    category: "institution",
    region: "INT",
    name: "UN / WHO Personal History (P.11)",
    description:
      "United Nations P.11 Personal History Form structure (UN/WHO and international-organisation posts).",
    sections: ["education", "positions", "languages", "skills", "references"],
    display: FULL,
  },
  {
    id: "hdr",
    category: "institution",
    region: "FR/DE",
    name: "Habilitation (HDR / Habilitation)",
    description:
      "Habilitation dossier (French HDR / German Habilitation) — full record incl. supervision + teaching.",
    sections: [
      "education",
      "positions",
      "publications",
      "supervision",
      "teaching",
      "grants",
      "service",
      "talks",
    ],
    display: FULL,
  },
  {
    id: "nhs-consultant",
    category: "institution",
    region: "UK",
    name: "NHS consultant / clinical CV (UK)",
    description:
      "UK NHS consultant / clinical-academic CV (GMC registration, CCT, clinical + academic record).",
    sections: ["education", "positions", "awards", "service", "publications", "teaching", "talks"],
    display: FULL,
    titleOverrides: {
      education: "Qualifications, GMC registration & training",
    },
  },
  {
    id: "tenure-us",
    category: "institution",
    region: "US",
    name: "US tenure / promotion dossier",
    description: "US tenure & promotion dossier (comprehensive academic record).",
    sections: [
      "education",
      "positions",
      "awards",
      "grants",
      "publications",
      "teaching",
      "supervision",
      "service",
      "talks",
      "editorial",
      "peer-review",
    ],
    display: FULL,
  },

  // ─── INDUSTRY / PHARMA ────────────────────────────────────────────────────
  {
    id: "gcp-investigator",
    category: "industry",
    region: "Pharma/RCT",
    name: "ICH-GCP clinical-trial investigator CV (FDA 1572)",
    description:
      "ICH-GCP (E6) investigator CV for clinical trials / FDA Form 1572 (Statement of Investigator): current position, qualifications & licences, GCP training, relevant clinical-research / trial experience (use the Statement section), and relevant publications. Keep it current and dated; the 1572 is filed separately and the investigator's signature on it attests to the CV.",
    sections: [
      "education",
      "positions",
      "statement",
      "service",
      "publications",
      "awards",
      "skills",
    ],
    display: CONCISE10,
    titleOverrides: {
      education: "Education, training & qualifications (degrees, licences, GCP)",
      statement: "Relevant clinical-research experience",
      service: "Professional memberships & committees",
      skills: "GCP / certifications",
    },
  },
  {
    id: "pharma-rd",
    category: "industry",
    region: "Pharma/Biotech",
    name: "Industry / biotech R&D résumé",
    description:
      "Concise, skills-forward industry/biotech R&D résumé (experience and competencies foregrounded; selected outputs/patents).",
    sections: ["positions", "skills", "education", "publications", "awards"],
    display: CONCISE5,
    titleOverrides: {
      positions: "Experience",
      publications: "Selected publications & patents",
    },
  },
  {
    id: "medical",
    category: "industry",
    region: "Clinical",
    name: "Clinical / physician CV",
    description:
      "Clinical physician CV: qualifications, licences & board certifications, clinical appointments, then academic output.",
    sections: ["education", "positions", "awards", "service", "publications", "teaching", "talks"],
    display: FULL,
    titleOverrides: {
      education: "Qualifications, licences & certifications",
      positions: "Clinical & academic appointments",
    },
  },
  {
    id: "medical-affairs",
    category: "industry",
    region: "Pharma",
    name: "Medical Affairs / Regulatory CV",
    description: "Pharma Medical Affairs / regulatory CV.",
    sections: ["positions", "education", "skills", "publications", "service"],
    display: CONCISE10,
  },

  // ─── INDUSTRY — pharma & clinical (more) ──────────────────────────────────
  {
    id: "pharmacovigilance",
    category: "industry",
    region: "Pharma",
    name: "Pharmacovigilance / drug-safety CV",
    description:
      "Pharmacovigilance / drug-safety specialist CV (signal detection, PSUR/PBRER, ICSR processing, regulatory reporting).",
    sections: ["positions", "education", "skills", "publications", "service"],
    display: CONCISE10,
    titleOverrides: {
      skills: "Pharmacovigilance & regulatory competencies",
      publications: "Selected safety / PV publications",
    },
  },
  {
    id: "regulatory-affairs",
    category: "industry",
    region: "Pharma",
    name: "Regulatory Affairs CV",
    description:
      "Pharma / medtech regulatory affairs CV (submissions, agency interactions, lifecycle).",
    sections: ["positions", "education", "skills", "publications", "service"],
    display: CONCISE10,
  },
  {
    id: "cra",
    category: "industry",
    region: "Pharma/CRO",
    name: "Clinical Research Associate (CRA) / monitor CV",
    description:
      "CRA / clinical monitor CV (ICH-GCP, site monitoring experience across phases/therapeutic areas).",
    sections: ["positions", "education", "skills", "statement", "service"],
    display: CONCISE5,
    titleOverrides: {
      statement: "Monitoring & trial experience",
      skills: "ICH-GCP / monitoring competencies",
    },
  },
  {
    id: "ema-qp",
    category: "industry",
    region: "Pharma",
    name: "EU Qualified Person (QP) CV",
    description:
      "EU Qualified Person (QP) CV (Directive 2001/83/EC Art. 49 eligibility; GMP batch release).",
    sections: ["education", "positions", "skills", "statement", "service"],
    display: CONCISE5,
    titleOverrides: {
      education: "Qualifications & QP eligibility",
      statement: "GMP / batch-release experience",
    },
  },
  {
    id: "msl",
    category: "industry",
    region: "Pharma",
    name: "Medical Science Liaison (MSL) CV",
    description: "Medical Science Liaison / field Medical Affairs CV.",
    sections: ["positions", "education", "skills", "publications", "talks"],
    display: CONCISE10,
  },
  {
    id: "heor",
    category: "industry",
    region: "Pharma",
    name: "Health Economics / HEOR CV",
    description: "Health economics & outcomes research (HEOR) CV.",
    sections: ["positions", "education", "skills", "publications", "grants"],
    display: CONCISE10,
  },
];

/** Lookup by id (built once). */
const MODEL_BY_ID: ReadonlyMap<string, CvModel> = new Map(CV_MODELS.map((m) => [m.id, m]));

/** Whether `id` is a known CV-model id (runtime guard for untyped callers). */
export function isCvModelId(id: string): boolean {
  return MODEL_BY_ID.has(id);
}

/** The CV-model catalog, in catalog order. */
export function cvModelList(): readonly CvModel[] {
  return CV_MODELS;
}

/** Catalog order of the categories in the grouped picker. */
export const CV_MODEL_CATEGORY_ORDER: readonly CvModelCategory[] = [
  "grant",
  "institution",
  "industry",
];

/**
 * Group the catalog by category, preserving catalog order within each group and
 * the canonical category order across groups (only non-empty groups returned).
 */
export function cvModelsByCategory(): ReadonlyArray<{
  category: CvModelCategory;
  models: readonly CvModel[];
}> {
  return CV_MODEL_CATEGORY_ORDER.map((category) => ({
    category,
    models: CV_MODELS.filter((m) => m.category === category),
  })).filter((g) => g.models.length > 0);
}

/**
 * Create an empty section of `type` if the CV doesn't already have one, with a
 * localized title (or the model's `titleOverride` when provided). Prose types
 * (`narrative-*` / `statement`) get an empty `body`. Pure: returns a new CV (or
 * the same one when the section already exists). Used by `applyCvModel` to
 * materialize the model's funder-rubric sections.
 */
function ensureSection(cv: CanonicalCv, type: CvSectionType, titleOverride?: string): CanonicalCv {
  if (cv.sections.some((s) => s.type === type)) return cv;
  const newSection: CvSection = {
    id: type,
    type,
    title: titleOverride ?? sectionTitle(cv.display.locale, type),
    visible: true,
    order: DEFAULT_SECTION_ORDER[type],
    items: [],
    ...(isProseSectionType(type) ? { body: "" } : {}),
  };
  return { ...cv, sections: [...cv.sections, newSection] };
}

/**
 * Apply a CV model to a CV:
 *  - ensure every section the model wants exists (creating any missing one —
 *    including the `narrative-*` / `statement` prose sections — as empty);
 *  - set those sections VISIBLE and hide every other section;
 *  - order the visible sections in the model's sequence, with all other (hidden)
 *    sections kept after them in their existing relative order;
 *  - apply the display overrides (limit / order / peer-reviewed-only);
 *  - apply `titleOverrides` (call-specific headings) to the model's sections.
 *
 * PURE + IMMUTABLE — returns a new CV and never mutates the input. It only
 * touches DISPLAY, section visibility + order + title, and creates empty
 * sections; it NEVER deletes or reorders curated ITEM data, so the change is
 * fully reversible (the caller snapshots the prior view as a named preset first).
 *
 * Unknown ids are a no-op (identity preserved).
 */
export function applyCvModel(
  cv: CanonicalCv,
  id: string,
  /* locale kept in the signature for call-site compatibility; section titles are
     localized via `cv.display.locale` when created. */
  _locale: string = cv.display.locale,
): CanonicalCv {
  const model = MODEL_BY_ID.get(id);
  if (!model) return cv;
  void _locale;
  const wanted = model.sections;
  const wantedSet = new Set<CvSectionType>(wanted);
  const overrides = model.titleOverrides ?? {};

  // 1. Materialize every wanted section that's missing (empty), applying its
  //    title override at creation time so the heading is correct from the start.
  let next = cv;
  for (const type of wanted) next = ensureSection(next, type, overrides[type]);

  // 2. Visibility: show every wanted section, hide the rest. Apply the title
  //    override to a section the model shows (whether just created or already
  //    present), so a call-specific heading appears even on an existing section.
  for (const section of next.sections) {
    const show = wantedSet.has(section.type);
    next = setSectionVisible(next, section.id, show);
    const override = show ? overrides[section.type] : undefined;
    if (override !== undefined && override !== section.title) {
      next = {
        ...next,
        sections: next.sections.map((s) => (s.id === section.id ? { ...s, title: override } : s)),
      };
    }
  }

  // 3. Order: the wanted sections take the model's sequence (0..n-1); every
  //    other section keeps its relative order, appended after them. Operates on
  //    section TYPE → rank since a model is expressed in types.
  const rankByType = new Map<CvSectionType, number>(wanted.map((type, i) => [type, i]));
  const visibleCount = wanted.length;
  // Stable: hidden sections keep their existing relative order after the visible
  // block (sort by their current order, then assign sequential ranks).
  const hiddenSorted = [...next.sections]
    .filter((s) => !wantedSet.has(s.type))
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);
  const hiddenRank = new Map<string, number>(
    hiddenSorted.map((sectionId, i) => [sectionId, visibleCount + i]),
  );
  const ordered: CvSection[] = next.sections.map((s) => ({
    ...s,
    order: wantedSet.has(s.type) ? rankByType.get(s.type)! : hiddenRank.get(s.id)!,
  }));
  next = {
    ...next,
    sections: ordered,
    display: { ...next.display, sectionsCustomized: true },
  };

  // 4. Display overrides (publications limit / order / peer-reviewed-only).
  next = updateDisplay(next, { ...(model.display ?? {}) });

  return next;
}

/**
 * Reset the section layout back to the default — the INVERSE of {@link applyCvModel}.
 * Restores every section to its default order and default localized title
 * (clearing any funder `titleOverrides`); shows the standard sections and hides
 * the prose ones (`narrative-*` / `statement`, since a default data-driven CV
 * has none); and returns the publication-display fields a model sets
 * (limit / order / peer-reviewed-only) plus `sectionsCustomized` to their
 * schema defaults. PURE + IMMUTABLE — it never touches item data or prose
 * bodies, so re-applying a model (or re-showing a section) brings everything
 * back. Used by the "(none)" option in the editor's CV-model picker.
 */
export function resetCvSections(cv: CanonicalCv, locale: string = cv.display.locale): CanonicalCv {
  const sections = cv.sections.map((s) => ({
    ...s,
    visible: !isProseSectionType(s.type),
    order: DEFAULT_SECTION_ORDER[s.type],
    title: sectionTitle(locale, s.type),
  }));
  return updateDisplay(
    { ...cv, sections },
    {
      sectionsCustomized: false,
      peerReviewedOnly: false,
      publicationOrder: "custom",
      publicationsLimit: undefined,
    },
  );
}

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Back-compat: the original four grant presets.
 * ───────────────────────────────────────────────────────────────────────────
 * The grant-CV Markdown export (`render/grantCv.ts`) and its i18n captions are
 * keyed to the original four funder ids (erc / msca / nsf / jsps) with a shape
 * that always carries `visibleSections` + a full `display`. Those four still
 * live in the catalog above (msca is now `msca-pf`); here we re-expose them in
 * the legacy shape so the renderer keeps working unchanged.
 */
export const GRANT_PRESET_IDS = ["erc", "msca", "nsf", "jsps"] as const;
export type GrantPresetId = (typeof GRANT_PRESET_IDS)[number];

/** The legacy grant-preset config shape (always-present visibleSections + display). */
export interface GrantPresetConfig {
  visibleSections: readonly CvSectionType[];
  display: Pick<DisplayChoices, "publicationsLimit" | "publicationOrder" | "peerReviewedOnly">;
}

/**
 * Map a catalog model id → the legacy `GrantPresetConfig` shape. The legacy
 * grant-CV export expects a selected, peer-reviewed, newest-first track record
 * for all four funders, so the optional model fields default to that (matching
 * the original grant-preset behaviour exactly): `publicationOrder → "year-desc"`,
 * `peerReviewedOnly → true`.
 */
function toGrantPresetConfig(modelId: string): GrantPresetConfig {
  const model = MODEL_BY_ID.get(modelId)!;
  const d = model.display ?? {};
  return {
    visibleSections: model.sections,
    display: {
      publicationsLimit: d.publicationsLimit,
      publicationOrder: d.publicationOrder ?? "year-desc",
      peerReviewedOnly: d.peerReviewedOnly ?? true,
    },
  };
}

/**
 * The legacy grant-preset catalog (erc / msca / nsf / jsps), derived from the
 * CV-model catalog. `msca` maps to the `msca-pf` model. Consumed by the
 * grant-CV Markdown renderer + its i18n captions.
 */
export const GRANT_PRESETS: Record<GrantPresetId, GrantPresetConfig> = {
  erc: toGrantPresetConfig("erc"),
  msca: toGrantPresetConfig("msca-pf"),
  nsf: toGrantPresetConfig("nsf"),
  jsps: toGrantPresetConfig("jsps"),
};

/** Whether `id` is a known grant-preset id (runtime guard for untyped callers). */
export function isGrantPresetId(id: string): id is GrantPresetId {
  return (GRANT_PRESET_IDS as readonly string[]).includes(id);
}

/**
 * Back-compat alias for `applyCvModel`, accepting the legacy grant-preset ids
 * (`msca` is translated to the `msca-pf` catalog id). Kept so any importer of
 * the old API keeps working.
 */
export function applyGrantPreset(
  cv: CanonicalCv,
  id: string,
  locale: string = cv.display.locale,
): CanonicalCv {
  const modelId = id === "msca" ? "msca-pf" : id;
  // Only legacy grant ids are routed; an unknown id is a no-op (identity).
  if (!isGrantPresetId(id)) return cv;
  return applyCvModel(cv, modelId, locale);
}
