import { describe, expect, it, vi } from "vitest";

// log.ts (imported for its re-export of the version) opens the database.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { researchPanelStrings } from "@/lib/i18n/researchPanel";
import {
  APPROVED_CONSENT_LOCALES,
  CONSENT_DOCUMENT_LABELS,
  CONSENT_DOCUMENT_VERSIONS,
  consentLocaleFor,
  consentText,
  documentLabelFor,
  documentVersionFor,
  isConsentLocale,
  RESEARCH_CONSENT_VERSION,
  type InformationSheet,
} from "@/lib/research/consent";
import { ConsentRequestSchema } from "@/lib/research/consent/request";
import { sheetPageModel } from "@/lib/research/consent/sheetPage";
import { consentRecordDocument, consentStatus } from "@/lib/research/consent/status";
import { RESEARCH_CONSENT_VERSION as LOG_VERSION } from "@/lib/research/log";

/** The research data is pseudonymised, NOT anonymised (the approved sheet, §9). */
const ANONYMOUS = /anonym|anónim|anonim|анони|匿名|익명/i;

function sheetStrings(sheet: InformationSheet): string[] {
  return [
    sheet.title,
    ...sheet.preamble,
    ...sheet.sections.flatMap((s) => [
      s.heading,
      ...s.blocks.flatMap((b) => (b.kind === "list" ? b.items : [b.text])),
    ]),
  ];
}

describe("consent languages and versions", () => {
  it("admits only the languages the committee approved, English for every other UI locale", () => {
    expect(APPROVED_CONSENT_LOCALES).toEqual(["en-US", "ja-JP"]);
    expect(consentLocaleFor("ja-JP")).toBe("ja-JP");
    expect(consentLocaleFor("en-US")).toBe("en-US");
    for (const ui of ["fr-FR", "zh-CN", "de-DE", "ko-KR", "xx-XX", ""]) {
      expect(consentLocaleFor(ui)).toBe("en-US");
    }
    expect(isConsentLocale("fr-FR")).toBe(false);
    expect(isConsentLocale(null)).toBe(false);
  });

  it("is version 2, mapped to the approved documents, the same in log.ts", () => {
    expect(RESEARCH_CONSENT_VERSION).toBe(2);
    expect(LOG_VERSION).toBe(RESEARCH_CONSENT_VERSION);
    expect(CONSENT_DOCUMENT_VERSIONS[2]).toEqual({
      "en-US": "Version 1.0, 2026-06-05",
      "ja-JP": "第1.1版, 2026-07-08",
    });
    for (const locale of APPROVED_CONSENT_LOCALES) {
      expect(consentText(locale).documentVersion).toBe(
        CONSENT_DOCUMENT_VERSIONS[RESEARCH_CONSENT_VERSION]![locale],
      );
    }
  });

  it("labels each document for the screen, without the internal version number", () => {
    expect(CONSENT_DOCUMENT_LABELS[2]).toEqual({
      "en-US": "Information sheet Version 1.0 (2026-06-05)",
      "ja-JP": "説明文書 第1.1版（2026-07-08）",
    });
    expect(Object.keys(CONSENT_DOCUMENT_LABELS)).toEqual(Object.keys(CONSENT_DOCUMENT_VERSIONS));
    expect(documentLabelFor(2, "en-US")).toBe("Information sheet Version 1.0 (2026-06-05)");
    expect(documentLabelFor(1, "en-US")).toBeNull();
    expect(documentLabelFor(2, null)).toBeNull();
  });

  it("names the document of a record, or nothing for an unknown version or language", () => {
    expect(documentVersionFor(2, "ja-JP")).toBe("第1.1版, 2026-07-08");
    expect(documentVersionFor(1, "en-US")).toBeNull();
    expect(documentVersionFor(2, "fr-FR")).toBeNull();
    expect(documentVersionFor(2, null)).toBeNull();
  });
});

describe("the consent text", () => {
  it("shows the agreed English summary, word for word", () => {
    const en = consentText("en-US");
    expect(en.title).toBe("Take part in a Nagoya University research study? (optional)");
    expect(en.summary).toEqual([
      "This study is run by researchers at Nagoya University Graduate School of Medicine and approved by its Bioethics Review Committee (No. 2026-0310).",
      "Taking part is voluntary. If you say no, nothing changes in SigmaCV.",
      "If you agree, your “mine / not mine” decisions and your CV choices are used for research, together with the public publication data of you and your co-authors.",
      "Before analysis, your name, email and ORCID iD are replaced with a research number. Results never identify anyone.",
      "You can stop at any time; your research data is then deleted (except results already published).",
    ]);
    expect(en.agreeSecondary).toBe(
      "(Optional) I also agree to future related research, subject to separate ethics approval.",
    );
    expect(en.takePart).toBe("Take part");
    expect(en.notNow).toBe("Not now");
  });

  it("shows the agreed Japanese summary and 別添1 §3's checkboxes, word for word", () => {
    const ja = consentText("ja-JP");
    expect(ja.title).toBe("名古屋大学の研究へのご協力のお願い（任意）");
    expect(ja.summary).toEqual([
      "名古屋大学大学院医学系研究科の研究者が行い、同研究科の生命倫理審査委員会の承認を受けた研究です（承認番号 2026-0310）。",
      "参加は任意です。参加しなくても SigmaCV の利用は何も変わりません。",
      "ご同意いただくと、「自分のもの／自分のものでない」の判定とCVの構成の選択が、あなた及び共著者の公開書誌情報とともに研究に用いられます。",
      "解析前に、氏名・メール・ORCID は研究番号に置き換えます。研究結果で個人が特定されることはありません。",
      "いつでも参加をやめることができ、その場合は研究用データを削除します（既に公表した結果を除く）。",
    ]);
    expect(ja.agreeRequired).toBe(
      "私は18歳以上であり、説明を読み理解しました。私の業績判定・CV作成の記録を本研究（研究A・研究B）に用いることに同意します。",
    );
    expect(ja.agreeSecondary).toBe(
      "（任意）将来の関連研究（別途の倫理審査を条件とする）に私のデータを用いることにも同意します。",
    );
    expect([ja.takePart, ja.notNow]).toEqual(["参加する", "今はしない"]);
  });

  it("asks the age, reading AND understanding in checkbox ①, in both languages", () => {
    expect(consentText("en-US").agreeRequired).toMatch(/18 or older.*read and understood/);
    expect(consentText("ja-JP").agreeRequired).toMatch(/18歳以上.*読み理解/);
  });

  it("carries each approved sheet whole: 19 sections, its version in the preamble", () => {
    const en = consentText("en-US").sheet;
    const ja = consentText("ja-JP").sheet;
    expect(en.sections).toHaveLength(19);
    expect(ja.sections).toHaveLength(19);
    expect(en.preamble.join(" ")).toMatch(/Version 1\.0 — 5 June 2026/);
    expect(ja.preamble.join(" ")).toMatch(/第1\.1版/);
    expect(en.sections[18]!.heading).toBe("19. Contact and complaints");
    expect(ja.sections[18]!.heading).toBe("１９．問合せ・苦情の受付先");
  });

  it("never calls the research data anonymous; the sheet only ever says it is NOT", () => {
    for (const locale of APPROVED_CONSENT_LOCALES) {
      const text = consentText(locale);
      const { sheet, contacts, ...rest } = text;
      const short = [...Object.values(rest).flat(), ...contacts.flatMap((c) => [c.label, c.email])];
      for (const value of short) expect(value, locale).not.toMatch(ANONYMOUS);
      for (const value of sheetStrings(sheet)) {
        for (const m of value.matchAll(new RegExp(ANONYMOUS, "gi"))) {
          expect(value.slice(Math.max(0, m.index - 4), m.index), value).toBe("not ");
        }
      }
    }
    for (const locale of SUPPORTED_LOCALES) {
      for (const value of Object.values(researchPanelStrings(locale))) {
        expect(value, locale).not.toMatch(ANONYMOUS);
      }
    }
  });

  it("has every panel string in every UI locale, falling back to English", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const value of Object.values(researchPanelStrings(locale))) {
        expect(value.length).toBeGreaterThan(0);
      }
      // The person sees the document they read, never the internal version integer.
      for (const slot of ["{date}", "{document}"]) {
        expect(researchPanelStrings(locale).since).toContain(slot);
      }
      expect(researchPanelStrings(locale).since).not.toContain("{version}");
      expect(researchPanelStrings(locale).sinceOnly).toContain("{date}");
      expect(researchPanelStrings(locale).sinceOnly).not.toContain("{document}");
      expect(researchPanelStrings(locale).recordEarlier).toContain("{version}");
    }
    expect(researchPanelStrings("xx-XX")).toBe(researchPanelStrings("en-US"));
    expect(researchPanelStrings("en-US").since).toBe(
      "You have been taking part since {date} · {document}",
    );
  });
});

describe("consentStatus", () => {
  const AT = new Date("2026-10-22T07:31:00Z");
  const user = (version: number | null) => ({
    researchConsent: true,
    researchConsentAt: AT,
    researchConsentVersion: version,
  });
  const grant = {
    action: "grant",
    at: AT,
    version: 2,
    locale: "en-US",
    agreeRequired: true,
    secondaryUse: false,
  };

  it("none: no consent (or no user), whatever the records say", () => {
    for (const u of [null, { ...user(2), researchConsent: false }]) {
      expect(consentStatus({ open: true, user: u, latestGrant: grant, recordCount: 2 })).toEqual({
        open: true,
        state: "none",
        since: null,
        version: null,
        locale: null,
        documentVersion: null,
        documentLabel: null,
        secondaryUse: null,
        hasRecords: true,
      });
    }
  });

  it("current: the grant's language, document and checkbox ②", () => {
    expect(
      consentStatus({ open: true, user: user(2), latestGrant: grant, recordCount: 1 }),
    ).toMatchObject({
      state: "current",
      since: AT.toISOString(),
      locale: "en-US",
      documentVersion: "Version 1.0, 2026-06-05",
      documentLabel: "Information sheet Version 1.0 (2026-06-05)",
      secondaryUse: false,
    });
  });

  it("stale: consent under an older or unknown version; no grant record leaves nulls", () => {
    for (const version of [1, null]) {
      expect(
        consentStatus({
          open: false,
          user: { ...user(version), researchConsentAt: null },
          latestGrant: null,
          recordCount: 0,
        }),
      ).toEqual({
        open: false,
        state: "stale",
        since: null,
        version,
        locale: null,
        documentVersion: null,
        documentLabel: null,
        secondaryUse: null,
        hasRecords: false,
      });
    }
  });

  it("ignores a grant record in a language that is not an approved one", () => {
    const odd = { ...grant, locale: "fr-FR" };
    expect(
      consentStatus({ open: true, user: user(2), latestGrant: odd, recordCount: 1 }),
    ).toMatchObject({ locale: null, documentVersion: null, documentLabel: null });
  });
});

describe("consentRecordDocument", () => {
  it("lists every act with its document, and names the study", () => {
    const doc = consentRecordDocument(
      [
        {
          action: "grant",
          at: new Date("2026-10-22T07:31:00Z"),
          version: 2,
          locale: "ja-JP",
          agreeRequired: true,
          secondaryUse: true,
        },
      ],
      new Date("2026-10-24T00:00:00Z"),
    );
    expect(doc).toEqual({
      study: expect.objectContaining({ approvalNumber: "2026-0310", approvedOn: "2026-10-21" }),
      exportedAt: "2026-10-24T00:00:00.000Z",
      currentConsentVersion: 2,
      records: [
        {
          action: "grant",
          at: "2026-10-22T07:31:00.000Z",
          consentVersion: 2,
          language: "ja-JP",
          document: "第1.1版, 2026-07-08",
          agreeRequired: true,
          secondaryUse: true,
        },
      ],
    });
  });
});

describe("sheetPageModel", () => {
  const records = [
    {
      action: "grant",
      at: new Date("2026-10-22T07:31:59Z"),
      version: 2,
      locale: "ja-JP",
      agreeRequired: true,
      secondaryUse: true,
    },
    {
      action: "grant",
      at: new Date("2026-10-22T08:00:00Z"),
      version: 2,
      locale: "en-US",
      agreeRequired: true,
      secondaryUse: false,
    },
    {
      action: "withdraw",
      at: new Date("2026-10-23T09:05:00Z"),
      version: 1,
      locale: null,
      agreeRequired: null,
      secondaryUse: null,
    },
  ];

  it("shows the sheet in the language asked for, the record labelled in the UI locale", () => {
    const model = sheetPageModel({ lang: "ja-JP", ui: "fr-FR" }, records);
    expect(model.textLocale).toBe("ja-JP");
    expect(model.uiLocale).toBe("fr-FR");
    expect(model.rows).toEqual([
      {
        at: "2026-10-22 07:31 UTC",
        action: "Accepté",
        document: "説明文書 第1.1版（2026-07-08）",
        language: "日本語",
        secondaryUse: "Oui",
      },
      {
        at: "2026-10-22 08:00 UTC",
        action: "Accepté",
        document: "Information sheet Version 1.0 (2026-06-05)",
        language: "English",
        secondaryUse: "Non",
      },
      {
        at: "2026-10-23 09:05 UTC",
        action: "Retiré",
        // Version 1 had no approved document: its rows still say what they were.
        document: "Notice antérieure (version du consentement 1)",
        language: "",
        secondaryUse: "",
      },
    ]);
  });

  it("names a current-version row that records no language in the reader's approved language", () => {
    const row = {
      action: "withdraw",
      at: new Date("2026-10-23T09:05:00Z"),
      version: 2,
      locale: null,
      agreeRequired: null,
      secondaryUse: null,
    };
    expect(sheetPageModel({ ui: "ja-JP" }, [row]).rows[0]!.document).toBe(
      "説明文書 第1.1版（2026-07-08）",
    );
    expect(sheetPageModel({ ui: "fr-FR" }, [row]).rows[0]!.document).toBe(
      "Information sheet Version 1.0 (2026-06-05)",
    );
  });

  it("falls back to the UI's own approved language, else English; takes the first of repeated params", () => {
    expect(sheetPageModel({ ui: "ja-JP" }, []).textLocale).toBe("ja-JP");
    expect(sheetPageModel({ lang: "fr-FR", ui: "fr-FR" }, []).textLocale).toBe("en-US");
    const model = sheetPageModel({ lang: ["ja-JP", "en-US"], ui: ["xx", "ja-JP"] }, []);
    expect(model).toEqual({ uiLocale: "en-US", textLocale: "ja-JP", rows: [] });
  });
});

describe("ConsentRequestSchema", () => {
  it("accepts a grant and a withdrawal, nothing else", () => {
    expect(
      ConsentRequestSchema.safeParse({
        consent: true,
        version: 2,
        locale: "ja-JP",
        agreeRequired: true,
      }).success,
    ).toBe(true);
    expect(ConsentRequestSchema.safeParse({ consent: false }).success).toBe(true);
    const grant = { consent: true, version: 2, locale: "en-US", agreeRequired: true };
    for (const bad of [
      { ...grant, version: 0 },
      { ...grant, version: 2.5 },
      // Checkbox ① is part of the grant itself, not only of the page.
      { consent: true, version: 2, locale: "en-US" },
      { ...grant, agreeRequired: false },
    ]) {
      expect(ConsentRequestSchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});
