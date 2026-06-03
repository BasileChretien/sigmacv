import type { CvSectionType, NotMineReason } from "@/lib/canonical/schema";

/**
 * Lightweight, dependency-free internationalization.
 *
 * Two distinct concerns live here:
 *  1. The chrome dictionary (`t`) — the authenticated editor UI strings.
 *  2. CV-content localization — default section titles + not-mine reason labels
 *     that appear in the document the user builds.
 *
 * Everything is keyed off the user's chosen `display.locale`, which also drives
 * citeproc's citation language. English is the source of truth; every other
 * locale must define the SAME keys (enforced by a test), so a missing string is
 * impossible at runtime — `t` still falls back to English defensively.
 */

export const SUPPORTED_LOCALES = ["en-US", "fr-FR", "ja-JP"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_UI_LOCALE: Locale = "en-US";

/** Native language names for the locale picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  "en-US": "English",
  "fr-FR": "Français",
  "ja-JP": "日本語",
};

/** Narrow an arbitrary stored locale string to a supported UI locale. */
export function asLocale(value: string | undefined): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_UI_LOCALE;
}

// ─── CV content: default section titles ──────────────────────────────────────

const SECTION_TITLES: Record<Locale, Record<CvSectionType, string>> = {
  "en-US": {
    publications: "Publications",
    preprints: "Preprints",
    datasets: "Datasets & Software",
    positions: "Positions",
    education: "Education",
    awards: "Awards & Honors",
    service: "Service & Memberships",
    "peer-review": "Peer Review",
    editorial: "Editorial Roles",
    grants: "Grants & Funding",
    other: "Other",
  },
  "fr-FR": {
    publications: "Publications",
    preprints: "Prépublications",
    datasets: "Jeux de données et logiciels",
    positions: "Postes",
    education: "Formation",
    awards: "Distinctions et prix",
    service: "Engagements et adhésions",
    "peer-review": "Évaluation par les pairs",
    editorial: "Fonctions éditoriales",
    grants: "Financements et bourses",
    other: "Autres",
  },
  "ja-JP": {
    publications: "発表論文",
    preprints: "プレプリント",
    datasets: "データセット・ソフトウェア",
    positions: "職歴",
    education: "学歴",
    awards: "受賞・栄誉",
    service: "委員・所属",
    "peer-review": "査読",
    editorial: "編集委員",
    grants: "助成金・研究費",
    other: "その他",
  },
};

/** Localized default heading for a section type (user renames override this). */
export function sectionTitle(locale: string, type: CvSectionType): string {
  return SECTION_TITLES[asLocale(locale)][type];
}

/**
 * Is `title` the UNRENAMED default heading for this section type in ANY
 * supported locale? Used to safely re-localize default titles when the locale
 * changes, while never clobbering a heading the user deliberately renamed.
 */
export function isDefaultSectionTitle(
  type: CvSectionType,
  title: string,
): boolean {
  return SUPPORTED_LOCALES.some((loc) => SECTION_TITLES[loc][type] === title);
}

// ─── CV content: not-mine reason labels ──────────────────────────────────────

const REASON_LABELS: Record<Locale, Record<NotMineReason, string>> = {
  "en-US": {
    "different-person": "A different researcher (name or ID collision)",
    duplicate: "Duplicate of another listed work",
    "wrong-field": "Outside my field of research",
    other: "Other reason",
  },
  "fr-FR": {
    "different-person": "Un autre chercheur (homonymie ou collision d’identifiant)",
    duplicate: "Doublon d’une autre référence",
    "wrong-field": "Hors de mon domaine de recherche",
    other: "Autre raison",
  },
  "ja-JP": {
    "different-person": "別の研究者（同姓同名・ID の衝突）",
    duplicate: "他の項目との重複",
    "wrong-field": "自分の研究分野外",
    other: "その他の理由",
  },
};

export function reasonLabel(locale: string, reason: NotMineReason): string {
  return REASON_LABELS[asLocale(locale)][reason];
}

// ─── Chrome dictionary ───────────────────────────────────────────────────────

const EN = {
  // topbar
  appTagline: "open academic CVs",
  resync: "Re-sync",
  resyncing: "Syncing…",
  save: "Save",
  saving: "Saving…",
  saved: "Saved",
  savedStatus: "Saved.",
  syncedStatus: "Synced from OpenAlex.",
  saveFailed: "Save failed.",
  syncFailed: "Sync failed.",
  exportLabel: "Export",
  exportFormat: "Export format",
  signOut: "Sign out",
  language: "Language",
  // empty state
  emptyTitle: "No CV yet",
  emptyBody:
    "We couldn’t find publications for your ORCID iD on OpenAlex yet. Try syncing — new records can take time to appear, and sandbox ORCID iDs have no OpenAlex profile.",
  syncFromOpenAlex: "Sync from OpenAlex",
  // item row
  hide: "Hide",
  show: "Show",
  notMine: "Not mine",
  mine: "Mine",
  moveUp: "Move up",
  moveDown: "Move down",
  delete: "Delete",
  youBadge: "you",
  notMineBadge: "not mine",
  reviewBadge: "⚠ review",
  reviewHint:
    "This record lists a different ORCID for the matching author — check that it’s really yours.",
  hideHint: "Keep on file but leave it off this CV",
  notMineHint: "This work is wrongly attributed to me (corrects the record)",
  reasonPrompt: "Why? (optional)",
  reasonAria: "Why isn’t this yours?",
  // editor sections
  noItems: "No items in this section.",
  addEntryPlaceholder: "Add an entry…",
  add: "Add",
  sectionShow: "Show section",
  sectionHide: "Hide section",
} as const;

export type ChromeKey = keyof typeof EN;

const FR: Record<ChromeKey, string> = {
  appTagline: "CV académiques ouverts",
  resync: "Resynchroniser",
  resyncing: "Synchronisation…",
  save: "Enregistrer",
  saving: "Enregistrement…",
  saved: "Enregistré",
  savedStatus: "Enregistré.",
  syncedStatus: "Synchronisé depuis OpenAlex.",
  saveFailed: "Échec de l’enregistrement.",
  syncFailed: "Échec de la synchronisation.",
  exportLabel: "Exporter",
  exportFormat: "Format d’export",
  signOut: "Se déconnecter",
  language: "Langue",
  emptyTitle: "Pas encore de CV",
  emptyBody:
    "Nous n’avons pas encore trouvé de publications pour votre iD ORCID sur OpenAlex. Essayez de synchroniser — les nouveaux enregistrements peuvent mettre du temps à apparaître, et les iD ORCID de test n’ont pas de profil OpenAlex.",
  syncFromOpenAlex: "Synchroniser depuis OpenAlex",
  hide: "Masquer",
  show: "Afficher",
  notMine: "Pas de moi",
  mine: "De moi",
  moveUp: "Monter",
  moveDown: "Descendre",
  delete: "Supprimer",
  youBadge: "vous",
  notMineBadge: "pas de moi",
  reviewBadge: "⚠ à vérifier",
  reviewHint:
    "Cet enregistrement indique un ORCID différent pour l’auteur correspondant — vérifiez qu’il s’agit bien de vous.",
  hideHint: "Conserver mais ne pas afficher sur ce CV",
  notMineHint: "Ce travail m’est attribué à tort (corrige la notice)",
  reasonPrompt: "Pourquoi ? (facultatif)",
  reasonAria: "Pourquoi n’est-ce pas de vous ?",
  noItems: "Aucun élément dans cette section.",
  addEntryPlaceholder: "Ajouter une entrée…",
  add: "Ajouter",
  sectionShow: "Afficher la section",
  sectionHide: "Masquer la section",
};

const JA: Record<ChromeKey, string> = {
  appTagline: "オープンな学術 CV",
  resync: "再同期",
  resyncing: "同期中…",
  save: "保存",
  saving: "保存中…",
  saved: "保存済み",
  savedStatus: "保存しました。",
  syncedStatus: "OpenAlex から同期しました。",
  saveFailed: "保存に失敗しました。",
  syncFailed: "同期に失敗しました。",
  exportLabel: "エクスポート",
  exportFormat: "エクスポート形式",
  signOut: "サインアウト",
  language: "言語",
  emptyTitle: "CV がまだありません",
  emptyBody:
    "OpenAlex 上であなたの ORCID iD に紐づく論文がまだ見つかりません。同期をお試しください。新しい記録は反映に時間がかかることがあり、サンドボックスの ORCID iD には OpenAlex プロフィールがありません。",
  syncFromOpenAlex: "OpenAlex から同期",
  hide: "非表示",
  show: "表示",
  notMine: "自分のではない",
  mine: "自分の",
  moveUp: "上へ",
  moveDown: "下へ",
  delete: "削除",
  youBadge: "あなた",
  notMineBadge: "自分のではない",
  reviewBadge: "⚠ 要確認",
  reviewHint:
    "この記録では一致した著者に別の ORCID が登録されています。本当にあなたのものか確認してください。",
  hideHint: "保持したままこの CV には表示しない",
  notMineHint: "この業績は誤って自分に帰属されています（記録を修正します）",
  reasonPrompt: "理由は？（任意）",
  reasonAria: "なぜあなたのものではないのですか？",
  noItems: "このセクションに項目はありません。",
  addEntryPlaceholder: "項目を追加…",
  add: "追加",
  sectionShow: "セクションを表示",
  sectionHide: "セクションを非表示",
};

const DICTS: Record<Locale, Record<ChromeKey, string>> = {
  "en-US": EN,
  "fr-FR": FR,
  "ja-JP": JA,
};

/** Translate a chrome string for a locale (falls back to English). */
export function t(locale: string, key: ChromeKey): string {
  const dict = DICTS[asLocale(locale)];
  return dict[key] ?? EN[key];
}
