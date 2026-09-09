import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";

/**
 * The owner worklist ("Affiliations & open access") is help, not judgement.
 * The panel vetoed compliance vocabulary — "compliant", "non-compliant",
 * "overdue", "violation" — everywhere, in every language. This test is the
 * veto: it fails the build if any worklist string in any of the ten locales
 * carries one of those words or its translation.
 */

const WORKLIST_KEYS = Object.keys(workspaceUi("en-US")).filter((k) => k.startsWith("wl")) as Array<
  keyof WorkspaceUiStrings
>;

/** Per-locale forbidden words (lower-case; matched as substrings of the
 *  lower-cased string, so inflections are caught too). */
const FORBIDDEN: Record<Locale, string[]> = {
  "en-US": ["compliant", "compliance", "non-compliant", "overdue", "violation", "violate"],
  "zh-CN": ["合规", "不合规", "违规", "逾期", "违反", "过期"],
  "es-ES": ["conforme", "conformidad", "incumpl", "cumplimiento", "vencid", "infracci", "violaci"],
  "fr-FR": ["conforme", "conformité", "en retard", "échu", "violation", "infraction", "manquement"],
  "de-DE": ["konform", "konformität", "überfällig", "verstoß", "verstoss", "verletzung"],
  "ja-JP": ["準拠", "非準拠", "遵守", "違反", "期限切れ", "遅延", "順守"],
  "pt-BR": [
    "conforme",
    "conformidade",
    "descumpr",
    "cumprimento",
    "atrasad",
    "vencid",
    "infraç",
    "violaç",
  ],
  "it-IT": [
    "conforme",
    "conformità",
    "inadempien",
    "in ritardo",
    "scadut",
    "violazion",
    "infrazion",
  ],
  "ko-KR": ["준수", "미준수", "위반", "기한 초과", "연체", "만료"],
  "ru-RU": ["соответств", "несоответств", "соблюден", "просрочен", "нарушени"],
};

describe("worklist strings (workspaceUi wl*)", () => {
  it("exist, and there are enough of them to be the feature", () => {
    expect(WORKLIST_KEYS.length).toBeGreaterThanOrEqual(15);
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of WORKLIST_KEYS) {
        expect(typeof s[key], `${loc} ${key}`).toBe("string");
        expect(s[key].length, `${loc} ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("never use compliance vocabulary, in any of the ten locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      const forbidden = FORBIDDEN[loc];
      expect(forbidden.length, `${loc} forbidden list`).toBeGreaterThan(0);
      for (const key of WORKLIST_KEYS) {
        const text = s[key].toLowerCase();
        for (const word of forbidden) {
          expect(text.includes(word), `${loc} ${key} contains "${word}": ${s[key]}`).toBe(false);
        }
      }
    }
  });

  it("keeps the placeholders every locale substitutes", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of [
        "wlPositionsHeading",
        "wlGapsHeading",
        "wlNoAffiliationHeading",
        "wlClosedHeading",
      ] as const) {
        expect(s[key], `${loc} ${key}`).toContain("{n}");
        expect(s[key], `${loc} ${key}`).toContain("{total}");
      }
      expect(s.wlGapsGroup, `${loc} wlGapsGroup`).toContain("{ror}");
      expect(s.wlGapsGroup, `${loc} wlGapsGroup`).toContain("{n}");
      expect(s.wlFunders, `${loc} wlFunders`).toContain("{names}");
      expect(s.wlOaSummary, `${loc} wlOaSummary`).toContain("{total}");
      expect(s.wlNotCheckedNote, `${loc} wlNotCheckedNote`).toContain("{n}");
    }
  });

  it("says, in English, that no open copy was found and a deposit may be possible — help, not a verdict", () => {
    const s = workspaceUi("en-US");
    expect(s.wlClosedHelp).toMatch(/No open copy was found by OpenAlex/);
    expect(s.wlClosedHelp).toMatch(/repository deposit may be possible/);
    expect(s.wlClosedHelp).toMatch(/check the journal.s policy/i);
  });

  it("says, in English, what the no-affiliation bucket holds and that other sources are counted, not checked", () => {
    const s = workspaceUi("en-US");
    expect(s.wlNoAffiliationHelp).toMatch(/OpenAlex recorded no institution/);
    expect(s.wlNoAffiliationHelp).toMatch(/none with a ROR id/);
    expect(s.wlNoAffiliationHelp).toMatch(/missing data, not a missing affiliation/);
    expect(s.wlNotCheckedNote).toMatch(/other sources/);
    expect(s.wlNotCheckedNote).toMatch(/not checked here/);
  });
});
