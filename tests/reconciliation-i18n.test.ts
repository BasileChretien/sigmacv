import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { institutionStrings } from "@/lib/i18n/institutions";
import { privacyStrings } from "@/lib/i18n/privacy";
import { snapshotStrings } from "@/lib/i18n/snapshots";
import { ui } from "@/lib/i18n/ui";

/**
 * The reconciliation export's copy, in ten locales: the second opt-in in the
 * Publish panel (what is shared, where, from which version, how to stop), the
 * designation actions in the Versions panel, the institution page's line and
 * About sentence, and the privacy notice's sentence.
 *
 * Every one of those strings is read by, or about, an institution, so the
 * plan's vetoes apply to the copy as much as to the rows: no compliance
 * verdict, no percentage, no share (the noun), rate, ratio or mandate — in
 * any of the ten languages, not just the English tokens. The lists below are
 * the institution page's (`institutions-i18n.test.ts`), plus each locale's
 * word for a mandate.
 */

const UI_KEYS = [
  "shareReconciliationRows",
  "shareReconciliationRowsTitle",
  "shareReconciliationRowsBody",
] as const;
const SNAPSHOT_KEYS = [
  "reconciliationUse",
  "reconciliationStop",
  "reconciliationTag",
  "reconciliationNeedsPublic",
] as const;
const INSTITUTION_KEYS = [
  "reconciliationOne",
  "reconciliationMany",
  "reconciliationCsv",
  "reconciliationJson",
  "aboutReconciliation",
] as const;

/** The privacy notice's NEW sentence(s): everything from the sentence that
 *  names the export path to the end of the `sharing` paragraph. */
function privacySentence(loc: Locale): string {
  const sharing = privacyStrings(loc).sharing;
  const at = sharing.indexOf("/i/<ror>/reconciliation");
  expect(at, loc).toBeGreaterThan(0);
  const start = Math.max(sharing.lastIndexOf(". ", at), sharing.lastIndexOf("。", at)) + 1;
  return sharing.slice(start).trim();
}

/** Every new string, keyed for the failure message. */
function allNewStrings(loc: Locale): Array<[string, string]> {
  const u = ui(loc);
  const s = snapshotStrings(loc);
  const i = institutionStrings(loc);
  return [
    ...UI_KEYS.map((k): [string, string] => [`ui.${k}`, u[k]]),
    ...SNAPSHOT_KEYS.map((k): [string, string] => [`snapshots.${k}`, s[k]]),
    ...INSTITUTION_KEYS.map((k): [string, string] => [`institutions.${k}`, i[k]]),
    ["privacy.sharing (new sentence)", privacySentence(loc)],
  ];
}

/**
 * Per-locale substrings (matched lower-cased): the compliance verdicts, the
 * overdue state, the percent sign and its word, share-as-a-noun, rate, ratio
 * and mandate. English "share" is the verb throughout this copy ("share my
 * rows", "researchers share their rows", "chose to share them"), so for
 * English only the NOUN is banned by regex below; the other languages use a
 * verb that never contains their noun ("partager" / "la part", "teilen" /
 * "Anteil", "compartir" / "cuota", …), so plain substrings suffice.
 */
const BANNED: Record<Locale, string[]> = {
  "en-US": [
    "compliant",
    "compliance",
    "non-compliant",
    "overdue",
    "%",
    "percent",
    "proportion",
    "mandate",
  ],
  "zh-CN": ["合规", "遵守", "逾期", "比例", "百分比", "占比", "份额", "比率", "强制", "义务", "%"],
  "es-ES": [
    "conforme",
    "cumplimiento",
    "vencid",
    "%",
    "porcentaje",
    "proporci",
    "tasa",
    "cuota",
    "mandato",
    "obligaci",
  ],
  "fr-FR": [
    "conforme",
    "conformité",
    "en retard",
    "%",
    "pourcentage",
    "proportion",
    "taux",
    "la part",
    "mandat",
    "obligation",
  ],
  "de-DE": [
    "konform",
    "überfällig",
    "%",
    "prozent",
    "anteil",
    "quote",
    "verhältnis",
    "mandat",
    "pflicht",
  ],
  "ja-JP": ["準拠", "遵守", "違反", "期限", "%", "割合", "比率", "シェア", "義務", "強制"],
  "pt-BR": [
    "conforme",
    "cumprimento",
    "atrasad",
    "vencid",
    "%",
    "porcentagem",
    "percentual",
    "proporç",
    "taxa",
    "parcela",
    "fatia",
    "mandato",
    "obrigaç",
  ],
  "it-IT": [
    "conforme",
    "conformità",
    "in ritardo",
    "scadut",
    "%",
    "percentuale",
    "proporzion",
    "tasso",
    "quota",
    "mandato",
    "obblig",
  ],
  "ko-KR": ["준수", "위반", "연체", "%", "비율", "백분율", "점유", "의무", "강제"],
  "ru-RU": [
    "соответств",
    "просрочен",
    "%",
    "процент",
    "доля",
    "доли",
    "долю",
    "соотношени",
    "коэффициент",
    "мандат",
    "обязательн",
  ],
};

/** English whole words banned outright: "rate", "ratio" and "mandate" in
 *  any number — "generated" and "moderate" are not the word. */
const EN_WORDS = /\b(rates?|ratios?|mandates?)\b/i;
/** English "share" as a NOUN: preceded by a determiner, a possessive or "of"
 *  / "OA", or followed by "of" — "share my rows" and "researchers share their
 *  rows" (verb) pass, "the share of", "an OA share", "its share" do not. */
const EN_SHARE_NOUN =
  /\b(?:a|an|the|its|their|our|your|his|her|this|that|of|oa|open-access|access)\s+shares?\b|\bshares?\s+of\b/i;

describe("no verdict, percentage, share, rate, ratio or mandate vocabulary in any locale", () => {
  it.each(SUPPORTED_LOCALES)("%s", (loc) => {
    for (const [key, value] of allNewStrings(loc)) {
      const lower = value.toLowerCase();
      for (const word of BANNED[loc]) expect(lower, `${loc} ${key}: ${word}`).not.toContain(word);
      if (loc === "en-US") {
        expect(value, `${key}`).not.toMatch(EN_WORDS);
        expect(value, `${key}`).not.toMatch(EN_SHARE_NOUN);
      }
    }
  });

  it("the English noun regex catches the noun and lets the verb through (the test tests itself)", () => {
    for (const noun of ["the share of works", "an OA share", "its share", "share of 40"]) {
      expect(noun).toMatch(EN_SHARE_NOUN);
    }
    for (const verb of [
      "Share my reconciliation rows with my institution",
      "1 researcher shares their reconciliation rows:",
      "because each one chose to share them",
      "If you also choose to share your reconciliation rows",
    ]) {
      expect(verb).not.toMatch(EN_SHARE_NOUN);
      expect(verb).not.toMatch(EN_WORDS);
    }
    expect("generated and moderate").not.toMatch(EN_WORDS);
    expect("the rate").toMatch(EN_WORDS);
  });
});

describe("the second opt-in (ui.shareReconciliationRows*)", () => {
  it("is translated and says what, where (the export path), from which version, and how to stop — in every locale", () => {
    const en = ui("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const u = ui(loc);
      for (const key of UI_KEYS) {
        expect(u[key].length, `${loc}.${key}`).toBeGreaterThan(0);
        if (loc !== "en-US") expect(u[key], `${loc}.${key}`).not.toBe(en[key]);
      }
      // What: the identifier and the fields; where: the path; the frozen version.
      expect(u.shareReconciliationRowsBody, loc).toContain("ORCID iD");
      expect(u.shareReconciliationRowsBody, loc).toContain("DOI");
      expect(u.shareReconciliationRowsBody, loc).toContain("/i/<ROR id>/reconciliation");
      expect(u.shareReconciliationRowsBody, loc).toContain("SigmaCV");
      expect(u.shareReconciliationRowsTitle, loc).toContain("/i/<ROR id>/reconciliation");
    }
  });
});

describe("designating a frozen version (snapshots.reconciliation*)", () => {
  it("has the four keys translated in every locale", () => {
    const en = snapshotStrings("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = snapshotStrings(loc);
      for (const key of SNAPSHOT_KEYS) {
        expect(s[key].length, `${loc}.${key}`).toBeGreaterThan(0);
        if (loc !== "en-US") expect(s[key], `${loc}.${key}`).not.toBe(en[key]);
      }
      expect(s.reconciliationUse, loc).not.toBe(s.reconciliationStop);
    }
  });
});

describe("the institution page's line (institutions.reconciliation* + aboutReconciliation)", () => {
  it("is translated, keeps {count} and names ORCID iD in the About sentence", () => {
    const en = institutionStrings("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionStrings(loc);
      for (const key of INSTITUTION_KEYS) {
        expect(s[key].length, `${loc}.${key}`).toBeGreaterThan(0);
      }
      if (loc !== "en-US") {
        expect(s.reconciliationMany, loc).not.toBe(en.reconciliationMany);
        expect(s.aboutReconciliation, loc).not.toBe(en.aboutReconciliation);
      }
      expect(s.reconciliationMany, loc).toContain("{count}");
      expect(s.reconciliationOne, loc).toContain("1");
      expect(s.reconciliationCsv, loc).toContain("CSV");
      expect(s.reconciliationJson, loc).toBe("JSON");
      expect(s.aboutReconciliation, loc).toContain("ORCID iD");
    }
  });
});

describe("the privacy notice's sentence", () => {
  it("names the export path after the institution-page sentence, in every locale, and never puts an ASCII space after a CJK full stop", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const sharing = privacyStrings(loc).sharing;
      expect(sharing, loc).toContain("/i/<ror>/reconciliation");
      expect(sharing.indexOf("/i/<ror>)"), loc).toBeLessThan(
        sharing.indexOf("/i/<ror>/reconciliation"),
      );
      expect(sharing, loc).toContain("ORCID iD");
      expect(privacySentence(loc), loc).toContain("ORCID iD");
      if (loc === "zh-CN" || loc === "ja-JP") expect(sharing, loc).not.toMatch(/。 /);
    }
  });
});
