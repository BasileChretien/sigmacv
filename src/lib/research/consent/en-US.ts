import { SHEET_EN_US } from "./sheet.en-US";
import type { ConsentText } from "./types";

/**
 * The English consent screen of study 2026-0310. The full sheet is the
 * approved Information Sheet (Version 1.0, 2026-06-05); the title and summary
 * are the agreed short form of it; the checkboxes follow 別添1 §3.
 */
export const CONSENT_EN_US: ConsentText = {
  languageName: "English",
  documentVersion: "Version 1.0, 2026-06-05",
  title: "Take part in a Nagoya University research study? (optional)",
  summary: [
    "This study is run by researchers at Nagoya University Graduate School of Medicine and approved by its Bioethics Review Committee (No. 2026-0310).",
    "Taking part is voluntary. If you say no, nothing changes in SigmaCV.",
    "If you agree, your “mine / not mine” decisions and your CV choices are used for research, together with the public publication data of you and your co-authors.",
    "Before analysis, your name, email and ORCID iD are replaced with a research number. Results never identify anyone.",
    "You can stop at any time; your research data is then deleted (except results already published).",
  ],
  readFullSheet: "Read the full information sheet",
  sheet: SHEET_EN_US,
  agreeRequired:
    "I am 18 or older, I have read and understood the information, and I agree to take part.",
  agreeSecondary:
    "(Optional) I also agree to future related research, subject to separate ethics approval.",
  takePart: "Take part",
  notNow: "Not now",
  contactLead: "Questions? You can email the study contacts before you decide:",
  contacts: [
    {
      label: "Co-investigator: Basile Chrétien",
      email: "chretien.basile.jean.bernard.u4@s.mail.nagoya-u.ac.jp",
    },
    { label: "Research director: Dr Branko Aleksic", email: "branko@med.nagoya-u.ac.jp" },
  ],
};
