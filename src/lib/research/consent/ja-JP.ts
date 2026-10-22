import { SHEET_JA_JP } from "./sheet.ja-JP";
import type { ConsentText } from "./types";

/**
 * The Japanese consent screen of study 2026-0310. The full sheet is the
 * approved 説明書 (第1.1版, 2026-07-08); the title and summary are the agreed
 * short form of it; the checkboxes ① and ②, the full-sheet label and the
 * contact line are 別添1 §3's wording.
 */
export const CONSENT_JA_JP: ConsentText = {
  languageName: "日本語",
  documentVersion: "第1.1版, 2026-07-08",
  title: "名古屋大学の研究へのご協力のお願い（任意）",
  summary: [
    "名古屋大学大学院医学系研究科の研究者が行い、同研究科の生命倫理審査委員会の承認を受けた研究です（承認番号 2026-0310）。",
    "参加は任意です。参加しなくても SigmaCV の利用は何も変わりません。",
    "ご同意いただくと、「自分のもの／自分のものでない」の判定とCVの構成の選択が、あなた及び共著者の公開書誌情報とともに研究に用いられます。",
    "解析前に、氏名・メール・ORCID は研究番号に置き換えます。研究結果で個人が特定されることはありません。",
    "いつでも参加をやめることができ、その場合は研究用データを削除します（既に公表した結果を除く）。",
  ],
  readFullSheet: "説明文書（全文）を読む",
  sheet: SHEET_JA_JP,
  agreeRequired:
    "私は18歳以上であり、説明を読み理解しました。私の業績判定・CV作成の記録を本研究（研究A・研究B）に用いることに同意します。",
  agreeSecondary:
    "（任意）将来の関連研究（別途の倫理審査を条件とする）に私のデータを用いることにも同意します。",
  takePart: "参加する",
  notNow: "今はしない",
  contactLead: "ご質問は問い合わせ先へ（同意前に回答を得られます）",
  contacts: [
    {
      label: "研究分担者：Basile Chrétien",
      email: "chretien.basile.jean.bernard.u4@s.mail.nagoya-u.ac.jp",
    },
    { label: "研究責任者：Aleksic Branko", email: "branko@med.nagoya-u.ac.jp" },
  ],
};
