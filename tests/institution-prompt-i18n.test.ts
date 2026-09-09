import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import {
  institutionPromptStrings,
  type InstitutionPromptStrings,
} from "@/lib/i18n/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";

/**
 * The institution prompt and the worklist's "Institution listing" line are an
 * ASK, not a default and not a judgement. The copy rules are test-enforced in
 * every locale: no compliance vocabulary, no mandate, no percentage, no ratio
 * or share-as-a-quantity, nothing that implies the institution asked for
 * anything; and the disclosure always says that absence means nothing and that
 * withdrawal is immediate.
 */

const PROMPT_KEYS = Object.keys(institutionPromptStrings("en-US")) as Array<
  keyof InstitutionPromptStrings
>;
const LISTING_KEYS = Object.keys(workspaceUi("en-US")).filter((k) =>
  k.startsWith("wlListing"),
) as Array<keyof WorkspaceUiStrings>;

/** Compliance / mandate / quantity vocabulary, per locale (lower-case
 *  substrings; the worklist test carries the compliance half — this list adds
 *  mandate, percentage and ratio words). */
const FORBIDDEN: Record<Locale, string[]> = {
  "en-US": ["compliant", "compliance", "overdue", "violation", "mandate", "percent", "%"],
  "zh-CN": ["合规", "违规", "逾期", "违反", "强制", "比例", "百分", "%"],
  "es-ES": ["conforme", "incumpl", "cumplimiento", "vencid", "mandato", "porcent", "proporci", "%"],
  "fr-FR": ["conforme", "en retard", "échu", "violation", "mandat", "pourcent", "proportion", "%"],
  "de-DE": ["konform", "überfällig", "verstoß", "mandat", "prozent", "anteil", "%"],
  "ja-JP": ["準拠", "遵守", "違反", "期限切れ", "義務", "割合", "パーセント", "%"],
  "pt-BR": ["conforme", "descumpr", "cumprimento", "atrasad", "mandato", "porcent", "proporç", "%"],
  "it-IT": ["conforme", "inadempien", "in ritardo", "scadut", "mandato", "percent", "quota", "%"],
  "ko-KR": ["준수", "위반", "기한 초과", "연체", "의무", "비율", "퍼센트", "%"],
  "ru-RU": ["соответств", "соблюден", "просрочен", "нарушени", "мандат", "процент", "доля", "%"],
};

function allStrings(loc: Locale): Array<[string, string]> {
  const p = institutionPromptStrings(loc);
  const w = workspaceUi(loc);
  return [
    ...PROMPT_KEYS.map((k): [string, string] => [`prompt.${k}`, p[k]]),
    ...LISTING_KEYS.map((k): [string, string] => [`worklist.${k}`, w[k]]),
    ["ui.publishInstitutionSection", ui(loc).publishInstitutionSection],
  ];
}

describe("institution prompt + listing strings", () => {
  it("exist, non-empty, in all ten locales, and fall back to English", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    expect(PROMPT_KEYS.length).toBeGreaterThanOrEqual(11);
    expect(LISTING_KEYS.length).toBeGreaterThanOrEqual(8);
    for (const loc of SUPPORTED_LOCALES) {
      for (const [key, value] of allStrings(loc)) {
        expect(typeof value, `${loc} ${key}`).toBe("string");
        expect(value.length, `${loc} ${key}`).toBeGreaterThan(0);
      }
    }
    expect(institutionPromptStrings("xx-XX")).toEqual(institutionPromptStrings("en-US"));
  });

  it("actually translates the non-English locales", () => {
    const en = institutionPromptStrings("en-US");
    const enWl = workspaceUi("en-US");
    for (const loc of SUPPORTED_LOCALES.filter((l) => l !== "en-US")) {
      const s = institutionPromptStrings(loc);
      expect(s.what, loc).not.toBe(en.what);
      expect(s.yes, loc).not.toBe(en.yes);
      expect(workspaceUi(loc).wlListingUnlisted, loc).not.toBe(enWl.wlListingUnlisted);
    }
  });

  it("keeps the placeholders every locale substitutes", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionPromptStrings(loc);
      const w = workspaceUi(loc);
      for (const key of ["heading", "what", "yes"] as const) {
        expect(s[key], `${loc} prompt.${key}`).toContain("{institution}");
      }
      expect(s.reconciliation, `${loc} prompt.reconciliation`).toContain("{versions}");
      expect(s.headingMany, `${loc} prompt.headingMany`).not.toContain("{institution}");
      expect(s.yesNone, `${loc} prompt.yesNone`).not.toContain("{institution}");
      for (const key of ["wlListingUnlisted", "wlListingListMe", "wlListingListed"] as const) {
        expect(w[key], `${loc} ${key}`).toContain("{institution}");
      }
      expect(w.wlListingListMeNone, `${loc} wlListingListMeNone`).not.toContain("{institution}");
    }
  });

  it("never uses compliance, mandate, percentage or ratio vocabulary, in any locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const [key, value] of allStrings(loc)) {
        const text = value.toLowerCase();
        for (const word of FORBIDDEN[loc]) {
          expect(text.includes(word), `${loc} ${key} contains "${word}": ${value}`).toBe(false);
        }
      }
    }
  });

  it("in English: no rate, ratio or share-as-a-quantity, and nothing that implies the institution asked", () => {
    for (const [key, value] of allStrings("en-US")) {
      expect(value, key).not.toMatch(/\b(rates?|ratios?)\b/i);
      // "share" as a noun (a quantity); "sharing rows" (the verb) is allowed.
      expect(value, key).not.toMatch(
        /\b(a|the|your|their|its|of) share\b|\bshare of\b|\bshares\b/i,
      );
      expect(value, key).not.toMatch(
        /\b(asked|asks|requested|requests|requires?|required|must)\b/i,
      );
    }
  });

  it("in English: the disclosure names both destinations, and always says absence means nothing and withdrawal is immediate", () => {
    const s = institutionPromptStrings("en-US");
    const w = workspaceUi("en-US");
    expect(s.what).toMatch(/OAI-PMH set/);
    expect(s.what).toMatch(/institution's public page/);
    expect(s.what).toMatch(/figures/);
    expect(s.nothingUntil).toMatch(/Nothing is listed until you choose/);
    expect(s.nothingUntil).toMatch(/absence means nothing/);
    expect(s.withdraw).toMatch(/withdraw at any time/);
    expect(s.withdraw).toMatch(/immediate/);
    expect(w.wlListingHelp).toMatch(/absence means nothing/);
    expect(w.wlListingHelp).toMatch(/immediate/);
    // The reconciliation rows are mentioned, once, as a separate choice made
    // after designating a frozen version — never a third box in the prompt.
    expect(s.reconciliation).toMatch(/separate choice/);
    expect(s.reconciliation).toMatch(/frozen version/);
    // The two buttons: the consent names the institution; the other is a plain "Not now".
    expect(s.yes).toBe("Yes, list me under {institution}");
    expect(s.notNow).toBe("Not now");
    expect(w.wlListingListMe).toBe("List me under {institution}");
  });
});
