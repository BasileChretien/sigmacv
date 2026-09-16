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

/** A percentage never appears on a worklist key either (the panel's veto on
 *  shares and coverage figures): the sign, full-width or not, and the word. */
const PERCENT: Record<Locale, string[]> = {
  "en-US": ["percent", "%"],
  "zh-CN": ["百分", "%", "％"],
  "es-ES": ["porcent", "%"],
  "fr-FR": ["pourcent", "%"],
  "de-DE": ["prozent", "%"],
  "ja-JP": ["パーセント", "%", "％"],
  "pt-BR": ["porcent", "%"],
  "it-IT": ["percent", "%"],
  "ko-KR": ["퍼센트", "%", "％"],
  "ru-RU": ["процент", "%"],
};

const PLACEHOLDERS: Partial<Record<keyof WorkspaceUiStrings, string[]>> = {
  wlFundingAward: ["{award}", "{funder}"],
  wlFundingFunderOnly: ["{funder}"],
  wlFundingPolicy: ["{funder}", "{date}", "{statements}"],
  wlFundingPolicyPending: ["{funder}", "{statements}"],
  wlFundingNoPolicy: ["{funder}"],
  wlFundingFound: ["{state}"],
  wlArchivingAllowed: ["{versions}"],
  wlArchivingWhere: ["{locations}"],
  wlArchivingEmbargo: ["{duration}", "{date}"],
  wlArchivingEmbargoDuration: ["{duration}"],
  wlArchivingLicence: ["{licence}"],
  wlArchivingDates: ["{updated}", "{retrieved}"],
  wlArchivingRetrieved: ["{retrieved}"],
  wlStatutoryAuthorRight: ["{country}", "{instrument}", "{statements}"],
  wlStatutoryDepositRequirement: ["{country}", "{instrument}", "{statements}"],
  wlStatutoryFundingPolicy: ["{country}", "{instrument}", "{statements}"],
  wlStatutoryRecorded: ["{date}"],
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

  it("never say mandate or percent (or their translations) on any worklist key, in any locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of ALL_WL_KEYS) {
        const text = s[key].toLowerCase();
        for (const word of [...MANDATE[loc], ...PERCENT[loc]]) {
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

const RIGHTS_KEYS = Object.keys(workspaceUi("en-US")).filter(
  (k) => k.startsWith("wlArchiving") || k.startsWith("wlStatutory"),
) as Array<keyof WorkspaceUiStrings>;

/**
 * The rights lines under a closed work (publisher policy as OA.Works recorded it,
 * statutory rules that may also apply). The compliance, mandate and percent bans
 * above already cover them as `wl*` keys; these add what is specific to them:
 * no count anywhere, "may also apply" rather than "applies", and no date on a
 * statutory entry nobody has confirmed.
 */
describe("worklist self-archiving strings (workspaceUi wlArchiving*, wlStatutory*)", () => {
  it("exist, and are translated, in every locale", () => {
    expect(RIGHTS_KEYS.length).toBeGreaterThanOrEqual(20);
    const en = workspaceUi("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of RIGHTS_KEYS) {
        expect(s[key].trim().length, `${loc} ${key}`).toBeGreaterThan(0);
      }
      if (loc === "en-US") continue;
      for (const key of [
        "wlArchivingAllowed",
        "wlArchivingNotAllowed",
        "wlArchivingDisclaimer",
        "wlStatutoryAuthorRight",
        "wlStatutoryPending",
      ] as const) {
        expect(s[key], `${loc} ${key}`).not.toBe(en[key]);
      }
    }
  });

  it("never carry a count, in any locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of RIGHTS_KEYS) {
        expect(s[key], `${loc} ${key}`).not.toMatch(/\{n\}|\{total\}/);
      }
    }
  });

  it("never date a pending statutory entry, in any locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      expect(s.wlStatutoryPending, loc).not.toContain("{date}");
      expect(s.wlStatutoryPending, loc).not.toBe(s.wlStatutoryRecorded);
    }
  });

  it("say, in English, that a statutory rule may also apply — never that it applies", () => {
    const s = workspaceUi("en-US");
    for (const key of [
      "wlStatutoryAuthorRight",
      "wlStatutoryDepositRequirement",
      "wlStatutoryFundingPolicy",
    ] as const) {
      expect(s[key], key).toMatch(/^May also apply — /);
    }
    for (const key of RIGHTS_KEYS) {
      expect(s[key], key).not.toMatch(/\bapplies\b|\bexpire|\byou must\b|\beligible\b/i);
    }
  });

  it("say, in English, that records are dated, the conditions unverifiable and this is not legal advice", () => {
    const s = workspaceUi("en-US");
    expect(s.wlArchivingDisclaimer).toMatch(/several years old — check its date/);
    expect(s.wlArchivingDisclaimer).toMatch(/conditions SigmaCV cannot see/);
    expect(s.wlArchivingDisclaimer).toMatch(/not legal advice/);
    expect(s.wlArchivingDates).toBe("OA.Works record updated {updated}; retrieved {retrieved}.");
  });

  it("address the owner informally in Spanish, like the rest of the worklist", () => {
    const s = workspaceUi("es-ES");
    for (const key of RIGHTS_KEYS) {
      expect(s[key], key).not.toMatch(/\busted\b|\bsu biblioteca\b|\bsus coautores\b/i);
    }
    expect(s.wlArchivingDisclaimer).toMatch(/tu biblioteca/);
  });
});

const DEPOSIT_KEYS = Object.keys(workspaceUi("en-US")).filter((k) =>
  k.startsWith("wlDeposit"),
) as Array<keyof WorkspaceUiStrings>;

/** Every placeholder a deposit string carries — no more, no fewer. */
const DEPOSIT_PLACEHOLDERS: Partial<Record<keyof WorkspaceUiStrings, string[]>> = {
  wlDepositAccepted: ["{destination}"],
  wlDepositPublished: ["{destination}"],
  wlDepositSubmitted: ["{destination}"],
  wlDepositUnrecorded: ["{destination}"],
  wlDepositIfAgreement: ["{destination}"],
  wlDepositIfRightOrAgreement: ["{destination}"],
  wlDepositFormLicence: ["{licence}"],
  wlDepositFormEmbargoDate: ["{date}"],
  wlDepositFormEmbargoDuration: ["{duration}"],
  wlDepositLine: ["{action}", "{reason}"],
  wlDepositBecauseFunder: ["{funder}"],
  wlDepositBecauseOwn: ["{repository}"],
  wlDepositBecausePaperCountry: ["{country}"],
  wlDepositBecauseCurrentCountry: ["{country}"],
  wlDepositBecauseNoRepositoryPaper: ["{country}"],
  wlDepositBecauseNoRepositoryCurrent: ["{country}"],
  wlDepositBasisCurrent: ["{country}"],
};

/**
 * The deposit action under a closed work (verb + destination + one-clause reason)
 * and its other places. The compliance, mandate and percent bans above already
 * cover them as `wl*` keys; these add what is specific to them: every placeholder
 * kept (the line is split on `{action}`, so it occurs exactly once), no count or
 * figure, and nothing that reads as a duty or a deadline.
 */
describe("worklist deposit strings (workspaceUi wlDeposit*)", () => {
  it("exist, are translated and keep exactly their placeholders, in every locale", () => {
    expect(DEPOSIT_KEYS).toHaveLength(27);
    const en = workspaceUi("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of DEPOSIT_KEYS) {
        expect(s[key].trim().length, `${loc} ${key}`).toBeGreaterThan(0);
        const found = (s[key].match(/\{[a-z]+\}/g) ?? []).sort();
        expect(found, `${loc} ${key}`).toEqual([...(DEPOSIT_PLACEHOLDERS[key] ?? [])].sort());
      }
      expect(s.wlDepositLine.split("{action}"), loc).toHaveLength(2);
      if (loc === "en-US") continue;
      for (const key of [
        "wlDepositAccepted",
        "wlDepositUnrecorded",
        "wlDepositIfAgreement",
        "wlDepositBecauseOwn",
        "wlDepositZenodoAny",
      ] as const) {
        expect(s[key], `${loc} ${key}`).not.toBe(en[key]);
      }
    }
  });

  it("never carry a count or a figure, in any locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of DEPOSIT_KEYS) {
        expect(s[key], `${loc} ${key}`).not.toMatch(/\{n\}|\{total\}|\d/);
      }
    }
  });

  it("say, in English, what to do and why — never that it is due", () => {
    const s = workspaceUi("en-US");
    for (const key of DEPOSIT_KEYS) {
      expect(s[key], key).not.toMatch(/\byou must\b|\brequired?\b|\bdue\b|\blate\b|\bdeadline\b/i);
    }
    for (const key of DEPOSIT_KEYS.filter((k) => k.startsWith("wlDepositBecause"))) {
      expect(s[key], key).toMatch(/^because /);
    }
  });

  it("address the owner informally in Spanish, like the rest of the worklist", () => {
    const s = workspaceUi("es-ES");
    for (const key of DEPOSIT_KEYS) {
      expect(s[key], key).not.toMatch(
        /\busted\b|\bsu manuscrito\b|\bsus otros trabajos\b|\bsu afiliación\b/i,
      );
    }
    expect(s.wlDepositBecauseOwn).toMatch(/\btus trabajos\b/);
  });
});
