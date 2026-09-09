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

/**
 * Rate / ratio / share-as-a-quantity, per locale. Word-boundary patterns where
 * the language has word boundaries (bare substrings would fire on "sepa-rate",
 * "par-tager"), plain characters for zh/ja/ko. The English regexes below are
 * the originals; every other locale carries its own equivalents, so a
 * translation cannot smuggle in a quantity the English copy refuses.
 */
const FORBIDDEN_QUANTITY: Record<Locale, RegExp[]> = {
  "en-US": [
    /\brates?\b/i,
    /\bratios?\b/i,
    /\b(a|the|your|their|its|of) share\b|\bshare of\b|\bshares\b/i,
  ],
  "zh-CN": [/率/, /比例/, /占比/, /份额/],
  "es-ES": [/\btasas?\b/i, /\bproporci/i, /\bcuotas?\b/i, /índice/i],
  "fr-FR": [/\btaux\b/i, /\bproportion/i, /\bparts? des?\b/i],
  "de-DE": [/\bquote/i, /\braten?\b/i, /\banteil/i],
  "ja-JP": [/率/, /割合/, /比率/],
  "pt-BR": [/\btaxas?\b/i, /\bproporç/i, /\bcotas?\b/i, /índice/i],
  "it-IT": [/\btass[oi]\b/i, /\bquota/i, /\bpercentuale/i],
  "ko-KR": [/비율/, /점유율/, /퍼센트/],
  // JS word boundaries are ASCII-only, so Cyrillic patterns carry no \b.
  "ru-RU": [/дол[яию]/i, /ставк/i, /процент/i, /коэффициент/i],
};

/**
 * The two promises the disclosure must carry, in every locale: that absence
 * means nothing, and that withdrawal takes effect at once. Substrings taken
 * from the translations themselves — a rewrite that drops either promise fails
 * here rather than shipping a softer consent in nine languages.
 */
const PRESENCE: Record<Locale, { absence: string; immediate: string }> = {
  "en-US": { absence: "absence means nothing", immediate: "immediate" },
  "zh-CN": { absence: "不代表任何含义", immediate: "立即生效" },
  "es-ES": { absence: "no significa nada", immediate: "inmediato" },
  "fr-FR": { absence: "ne signifie rien", immediate: "immédiat" },
  "de-DE": { absence: "Fehlen bedeutet nichts", immediate: "sofortiger Wirkung" },
  "ja-JP": { absence: "何も意味しません", immediate: "即時" },
  "pt-BR": { absence: "não significa nada", immediate: "imediato" },
  "it-IT": { absence: "non significa nulla", immediate: "immediato" },
  "ko-KR": { absence: "아무 의미도 없습니다", immediate: "즉시" },
  "ru-RU": { absence: "ничего не значит", immediate: "немедленн" },
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
      for (const key of [
        "wlListingUnlisted",
        "wlListingListMe",
        "wlListingListed",
        "wlListingPageOnly",
        "wlListingSetOnly",
      ] as const) {
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

  it("never uses a rate, a ratio or a share-as-a-quantity, in ANY locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const [key, value] of allStrings(loc)) {
        for (const pattern of FORBIDDEN_QUANTITY[loc]) {
          expect(pattern.test(value), `${loc} ${key} matches ${pattern}: ${value}`).toBe(false);
        }
      }
    }
  });

  it("those per-locale patterns actually bite (a ban that matches nothing is not a ban)", () => {
    const violation: Record<Locale, string> = {
      "en-US": "the open-access rate of your works",
      "zh-CN": "开放获取率",
      "es-ES": "la tasa de acceso abierto",
      "fr-FR": "le taux d'accès ouvert",
      "de-DE": "die Open-Access-Quote",
      "ja-JP": "オープンアクセス率",
      "pt-BR": "a taxa de acesso aberto",
      "it-IT": "il tasso di accesso aperto",
      "ko-KR": "오픈액세스 비율",
      "ru-RU": "доля открытых работ",
    };
    for (const loc of SUPPORTED_LOCALES) {
      expect(
        FORBIDDEN_QUANTITY[loc].some((p) => p.test(violation[loc])),
        `${loc}: no pattern catches "${violation[loc]}"`,
      ).toBe(true);
      // …and the presence markers are really in the strings they check.
      expect(PRESENCE[loc].absence.length, loc).toBeGreaterThan(0);
    }
  });

  it("in English: nothing that implies the institution asked", () => {
    for (const [key, value] of allStrings("en-US")) {
      // "share" as a noun (a quantity); "sharing rows" (the verb) is allowed.
      expect(value, key).not.toMatch(
        /\b(asked|asks|requested|requests|requires?|required|must)\b/i,
      );
    }
  });

  it("says, in EVERY locale, that absence means nothing and that withdrawal is immediate", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const { absence, immediate } = PRESENCE[loc];
      const s = institutionPromptStrings(loc);
      const help = workspaceUi(loc).wlListingHelp;
      expect(s.nothingUntil, `${loc} prompt.nothingUntil`).toContain(absence);
      expect(s.withdraw, `${loc} prompt.withdraw`).toContain(immediate);
      // The worklist's status line repeats both — it is the surface someone
      // who dismissed the prompt still sees.
      expect(help, `${loc} wlListingHelp`).toContain(absence);
      expect(help, `${loc} wlListingHelp`).toContain(immediate);
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
