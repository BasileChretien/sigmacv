import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";

/**
 * The funding section of the owner worklist ("Your grants and their
 * open-access policies") in ten locales: every string present, every
 * placeholder kept, and — beside the compliance vocabulary the worklist test
 * already bans on every `wl*` key — never "mandate" or its translations
 * (the policy table says "asks for" / "requires").
 */

const FUNDING_KEYS = Object.keys(workspaceUi("en-US")).filter((k) =>
  k.startsWith("wlFunding"),
) as Array<keyof WorkspaceUiStrings>;
const ALL_WL_KEYS = Object.keys(workspaceUi("en-US")).filter((k) => k.startsWith("wl")) as Array<
  keyof WorkspaceUiStrings
>;

const MANDATE: Record<Locale, string[]> = {
  "en-US": ["mandate", "mandatory"],
  "zh-CN": ["强制", "授权令"],
  "es-ES": ["mandato", "obligatori"],
  "fr-FR": ["mandat", "obligatoire"],
  "de-DE": ["mandat", "verpflichtend", "pflicht"],
  "ja-JP": ["義務", "強制"],
  "pt-BR": ["mandato", "obrigatóri"],
  "it-IT": ["mandato", "obbligatori"],
  "ko-KR": ["의무", "강제"],
  "ru-RU": ["мандат", "обязательн"],
};

const PLACEHOLDERS: Partial<Record<keyof WorkspaceUiStrings, string[]>> = {
  wlFundingAward: ["{award}", "{funder}"],
  wlFundingFunderOnly: ["{funder}"],
  wlFundingPolicy: ["{funder}", "{date}", "{statements}"],
  wlFundingPolicyPending: ["{funder}", "{statements}"],
  wlFundingNoPolicy: ["{funder}"],
  wlFundingFound: ["{state}"],
};

describe("worklist funding strings (workspaceUi wlFunding*)", () => {
  it("exist in every locale", () => {
    expect(FUNDING_KEYS.length).toBeGreaterThanOrEqual(8);
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of FUNDING_KEYS) {
        expect(typeof s[key], `${loc} ${key}`).toBe("string");
        expect(s[key].trim().length, `${loc} ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keep every placeholder in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const [key, tokens] of Object.entries(PLACEHOLDERS)) {
        for (const token of tokens) {
          expect(s[key as keyof WorkspaceUiStrings], `${loc} ${key}`).toContain(token);
        }
      }
    }
  });

  it("never say mandate (or its translations) on any worklist key, in any locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of ALL_WL_KEYS) {
        const text = s[key].toLowerCase();
        for (const word of MANDATE[loc]) {
          expect(text.includes(word), `${loc} ${key} contains "${word}": ${s[key]}`).toBe(false);
        }
      }
    }
  });

  it("say, in English, that the sentences are facts side by side and the judgement is the owner's", () => {
    const s = workspaceUi("en-US");
    expect(s.wlFundingHelp).toMatch(/no verdict/i);
    expect(s.wlFundingHelp).toMatch(/for you to judge/);
    expect(s.wlFundingPolicy).toMatch(/as recorded on \{date\}/);
    expect(s.wlFundingHeading).not.toMatch(/\{n\}|\{total\}/);
  });

  it("word a pending entry as unconfirmed, never as recorded on a date, in every locale", () => {
    expect(workspaceUi("en-US").wlFundingPolicyPending).toBe(
      "{funder}'s open-access policy, drafted from memory and not yet confirmed against the funder's site: {statements}",
    );
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      expect(s.wlFundingPolicyPending, loc).not.toContain("{date}");
      expect(s.wlFundingPolicyPending.toLowerCase(), loc).not.toMatch(/as recorded on/);
      expect(s.wlFundingPolicyPending, loc).not.toBe(s.wlFundingPolicy);
    }
  });

  it("address the owner in the informal register in Spanish, like the rest of the worklist", () => {
    const s = workspaceUi("es-ES");
    // "sus políticas" (the grants' policies, third person) is fine; the
    // formal address forms are not.
    for (const key of FUNDING_KEYS) {
      expect(s[key], key).not.toMatch(/\busted\b|\bsus propias\b|\bsu financiador\b/i);
    }
    expect(s.wlFundingHeading).toMatch(/^Tus /);
    expect(s.wlFundingHelp).toMatch(/tus propias ayudas/);
  });
});
