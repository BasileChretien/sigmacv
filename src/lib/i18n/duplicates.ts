import { asLocale, type Locale } from "./index";
import type { DuplicateRelationship, DuplicateTier } from "@/lib/canonical/schema";

/**
 * Editor strings for the duplicate-detection feature (the per-row "possible
 * duplicate" badge + explainer + actions, and the per-section summary). Kept in
 * its own module — like `ui.ts`/`render.ts` — rather than the giant chrome
 * dictionary. Typed as `Record<Locale, DuplicateStrings>` so a missing
 * translation is a COMPILE error: the feature can't ship untranslated.
 *
 * The `relX`/`tierX` keys are the explanatory phrase for WHY a pair was flagged;
 * `dupReasonText` selects one from `(tier, relationship)`. The copy deliberately
 * NEVER implies an error for legitimate-both cases (preprint↔published, errata,
 * translations) — it leads with "keep both".
 */
export interface DuplicateStrings {
  badge: string;
  badgeHint: string;
  panelAria: string;
  looksLike: string;
  confirm: string;
  confirmHint: string;
  keepBoth: string;
  keepBothHint: string;
  hideThis: string;
  /** Section summary; `{n}` = count. */
  summary: string;
  review: string;
  relPreprintOf: string;
  relPublishedVersionOf: string;
  relVersionOf: string;
  relTranslationOf: string;
  relErratumOf: string;
  relSameWork: string;
  tierExact: string;
  tierStrong: string;
  tierWeak: string;
}

const EN: DuplicateStrings = {
  badge: "⚠ possible duplicate",
  badgeHint:
    "This might be the same work as another entry. Click to review — nothing is removed automatically.",
  panelAria: "Possible duplicate details",
  looksLike: "Looks like the same work as",
  confirm: "These are the same",
  confirmHint:
    "Marks this entry as a duplicate and removes it from the CV (kept on file). The other entry stays.",
  keepBoth: "Keep both",
  keepBothHint: "These are distinct — keep both on the CV and don’t flag this pair again.",
  hideThis: "Hide this one",
  summary: "{n} possible duplicates to review",
  review: "Review",
  relPreprintOf: "one is a preprint of the other — many researchers list both",
  relPublishedVersionOf: "the published version of a preprint you also list",
  relVersionOf: "another version of the same work",
  relTranslationOf: "a translation of another entry — keep both to reach both audiences",
  relErratumOf: "a correction/erratum to another entry — listing both documents the fix",
  relSameWork: "the same work as another entry",
  tierExact: "the same identifier (DOI) appears twice",
  tierStrong: "matching title, authors and year",
  tierWeak: "a similar title — lower confidence",
};

const ZH: DuplicateStrings = {
  badge: "⚠ 疑似重复",
  badgeHint: "这可能与另一条目是同一成果。点击核查——不会自动删除任何内容。",
  panelAria: "疑似重复详情",
  looksLike: "似乎与以下条目为同一成果：",
  confirm: "这是重复项",
  confirmHint: "将此条目标记为重复并从简历中移除（仍会留档）。另一条目保留。",
  keepBoth: "两者都保留",
  keepBothHint: "二者不同——在简历中都保留，且不再对此对进行标记。",
  hideThis: "隐藏此项",
  summary: "有 {n} 个疑似重复待核查",
  review: "核查",
  relPreprintOf: "其中之一是另一项的预印本——许多研究者会两者都列出",
  relPublishedVersionOf: "您同时列出的某预印本的正式发表版本",
  relVersionOf: "同一成果的另一版本",
  relTranslationOf: "另一条目的译文——两者都保留可面向不同读者",
  relErratumOf: "对另一条目的更正／勘误——两者并列可记录修订",
  relSameWork: "与另一条目为同一成果",
  tierExact: "同一标识符（DOI）出现了两次",
  tierStrong: "标题、作者与年份均匹配",
  tierWeak: "标题相似——置信度较低",
};

const ES: DuplicateStrings = {
  badge: "⚠ posible duplicado",
  badgeHint:
    "Podría ser el mismo trabajo que otra entrada. Haz clic para revisar — no se elimina nada automáticamente.",
  panelAria: "Detalles del posible duplicado",
  looksLike: "Parece el mismo trabajo que",
  confirm: "Son el mismo",
  confirmHint:
    "Marca esta entrada como duplicada y la quita del CV (se conserva archivada). La otra entrada permanece.",
  keepBoth: "Conservar ambos",
  keepBothHint: "Son distintos — consérvalos ambos en el CV y no vuelvas a marcar este par.",
  hideThis: "Ocultar este",
  summary: "{n} posibles duplicados para revisar",
  review: "Revisar",
  relPreprintOf: "uno es un preprint del otro — muchos investigadores listan ambos",
  relPublishedVersionOf: "la versión publicada de un preprint que también listas",
  relVersionOf: "otra versión del mismo trabajo",
  relTranslationOf: "una traducción de otra entrada — conserva ambas para llegar a ambos públicos",
  relErratumOf: "una corrección/erratum de otra entrada — listar ambas documenta la corrección",
  relSameWork: "el mismo trabajo que otra entrada",
  tierExact: "el mismo identificador (DOI) aparece dos veces",
  tierStrong: "coinciden título, autores y año",
  tierWeak: "un título parecido — menor confianza",
};

const FR: DuplicateStrings = {
  badge: "⚠ doublon possible",
  badgeHint:
    "Il pourrait s’agir du même travail qu’une autre entrée. Cliquez pour vérifier — rien n’est supprimé automatiquement.",
  panelAria: "Détails du doublon possible",
  looksLike: "Semble être le même travail que",
  confirm: "Ce sont les mêmes",
  confirmHint:
    "Marque cette entrée comme doublon et la retire du CV (conservée au dossier). L’autre entrée reste.",
  keepBoth: "Garder les deux",
  keepBothHint:
    "Ce sont des travaux distincts — gardez les deux au CV et ne signalez plus cette paire.",
  hideThis: "Masquer celle-ci",
  summary: "{n} doublons possibles à vérifier",
  review: "Vérifier",
  relPreprintOf:
    "l’une est une prépublication de l’autre — beaucoup de chercheurs listent les deux",
  relPublishedVersionOf: "la version publiée d’une prépublication que vous listez aussi",
  relVersionOf: "une autre version du même travail",
  relTranslationOf:
    "une traduction d’une autre entrée — gardez les deux pour toucher les deux publics",
  relErratumOf:
    "une correction/erratum d’une autre entrée — lister les deux documente la correction",
  relSameWork: "le même travail qu’une autre entrée",
  tierExact: "le même identifiant (DOI) apparaît deux fois",
  tierStrong: "titre, auteurs et année concordants",
  tierWeak: "un titre semblable — confiance plus faible",
};

const DE: DuplicateStrings = {
  badge: "⚠ mögliches Duplikat",
  badgeHint:
    "Dies könnte dieselbe Arbeit wie ein anderer Eintrag sein. Zum Prüfen klicken — es wird nichts automatisch entfernt.",
  panelAria: "Details zum möglichen Duplikat",
  looksLike: "Sieht aus wie dieselbe Arbeit wie",
  confirm: "Sind identisch",
  confirmHint:
    "Markiert diesen Eintrag als Duplikat und entfernt ihn aus dem Lebenslauf (bleibt gespeichert). Der andere Eintrag bleibt.",
  keepBoth: "Beide behalten",
  keepBothHint:
    "Sie sind verschieden — beide im Lebenslauf behalten und dieses Paar nicht erneut melden.",
  hideThis: "Diesen ausblenden",
  summary: "{n} mögliche Duplikate zu prüfen",
  review: "Prüfen",
  relPreprintOf: "eines ist ein Preprint des anderen — viele Forschende führen beide auf",
  relPublishedVersionOf: "die veröffentlichte Fassung eines ebenfalls aufgeführten Preprints",
  relVersionOf: "eine andere Fassung derselben Arbeit",
  relTranslationOf:
    "eine Übersetzung eines anderen Eintrags — beide behalten, um beide Zielgruppen zu erreichen",
  relErratumOf:
    "eine Korrektur/ein Erratum zu einem anderen Eintrag — beide aufzuführen dokumentiert die Korrektur",
  relSameWork: "dieselbe Arbeit wie ein anderer Eintrag",
  tierExact: "derselbe Identifikator (DOI) erscheint zweimal",
  tierStrong: "Titel, Autoren und Jahr stimmen überein",
  tierWeak: "ein ähnlicher Titel — geringere Sicherheit",
};

const JA: DuplicateStrings = {
  badge: "⚠ 重複の可能性",
  badgeHint:
    "別の項目と同一の成果かもしれません。クリックして確認してください。自動では削除されません。",
  panelAria: "重複の可能性の詳細",
  looksLike: "次と同一の成果のようです：",
  confirm: "同一です",
  confirmHint: "この項目を重複として CV から外します（記録は保持）。もう一方の項目は残ります。",
  keepBoth: "両方残す",
  keepBothHint: "これらは別物です——両方を CV に残し、この組み合わせを今後は表示しません。",
  hideThis: "これを非表示",
  summary: "確認が必要な重複候補が {n} 件",
  review: "確認",
  relPreprintOf: "一方が他方のプレプリントです——両方を記載する研究者も多くいます",
  relPublishedVersionOf: "あなたが併記しているプレプリントの正式版です",
  relVersionOf: "同一成果の別バージョンです",
  relTranslationOf: "別項目の翻訳です——双方の読者に届けるため両方残せます",
  relErratumOf: "別項目の訂正・正誤表です——両方を載せると修正を記録できます",
  relSameWork: "別の項目と同一の成果です",
  tierExact: "同一の識別子（DOI）が2回出現しています",
  tierStrong: "タイトル・著者・年が一致します",
  tierWeak: "タイトルが類似——確度は低めです",
};

const PT: DuplicateStrings = {
  badge: "⚠ possível duplicata",
  badgeHint:
    "Pode ser o mesmo trabalho que outra entrada. Clique para revisar — nada é removido automaticamente.",
  panelAria: "Detalhes da possível duplicata",
  looksLike: "Parece o mesmo trabalho que",
  confirm: "São o mesmo",
  confirmHint:
    "Marca esta entrada como duplicata e a remove do currículo (mantida em arquivo). A outra entrada permanece.",
  keepBoth: "Manter ambos",
  keepBothHint: "São distintos — mantenha ambos no currículo e não sinalize este par novamente.",
  hideThis: "Ocultar este",
  summary: "{n} possíveis duplicatas para revisar",
  review: "Revisar",
  relPreprintOf: "um é um preprint do outro — muitos pesquisadores listam ambos",
  relPublishedVersionOf: "a versão publicada de um preprint que você também lista",
  relVersionOf: "outra versão do mesmo trabalho",
  relTranslationOf: "uma tradução de outra entrada — mantenha ambas para alcançar os dois públicos",
  relErratumOf: "uma correção/erratum de outra entrada — listar ambas documenta a correção",
  relSameWork: "o mesmo trabalho que outra entrada",
  tierExact: "o mesmo identificador (DOI) aparece duas vezes",
  tierStrong: "título, autores e ano coincidem",
  tierWeak: "um título parecido — menor confiança",
};

const IT: DuplicateStrings = {
  badge: "⚠ possibile duplicato",
  badgeHint:
    "Potrebbe essere lo stesso lavoro di un’altra voce. Fai clic per verificare — non viene rimosso nulla automaticamente.",
  panelAria: "Dettagli del possibile duplicato",
  looksLike: "Sembra lo stesso lavoro di",
  confirm: "Sono lo stesso",
  confirmHint:
    "Contrassegna questa voce come duplicato e la rimuove dal CV (resta archiviata). L’altra voce rimane.",
  keepBoth: "Tieni entrambi",
  keepBothHint: "Sono distinti — tienili entrambi nel CV e non segnalare più questa coppia.",
  hideThis: "Nascondi questo",
  summary: "{n} possibili duplicati da verificare",
  review: "Verifica",
  relPreprintOf: "uno è un preprint dell’altro — molti ricercatori elencano entrambi",
  relPublishedVersionOf: "la versione pubblicata di un preprint che elenchi anche",
  relVersionOf: "un’altra versione dello stesso lavoro",
  relTranslationOf:
    "una traduzione di un’altra voce — tienile entrambe per raggiungere entrambi i pubblici",
  relErratumOf:
    "una correzione/erratum di un’altra voce — elencarle entrambe documenta la correzione",
  relSameWork: "lo stesso lavoro di un’altra voce",
  tierExact: "lo stesso identificativo (DOI) compare due volte",
  tierStrong: "titolo, autori e anno corrispondono",
  tierWeak: "un titolo simile — minore affidabilità",
};

const KO: DuplicateStrings = {
  badge: "⚠ 중복 가능성",
  badgeHint:
    "다른 항목과 동일한 업적일 수 있습니다. 클릭하여 검토하세요 — 자동으로 삭제되지 않습니다.",
  panelAria: "중복 가능성 세부정보",
  looksLike: "다음과 동일한 업적으로 보입니다:",
  confirm: "동일합니다",
  confirmHint:
    "이 항목을 중복으로 표시하고 CV에서 제외합니다(기록은 보관). 다른 항목은 유지됩니다.",
  keepBoth: "둘 다 유지",
  keepBothHint: "서로 다른 업적입니다 — 둘 다 CV에 유지하고 이 쌍을 다시 표시하지 않습니다.",
  hideThis: "이 항목 숨기기",
  summary: "검토할 중복 가능성 {n}건",
  review: "검토",
  relPreprintOf: "하나가 다른 하나의 프리프린트입니다 — 많은 연구자가 둘 다 기재합니다",
  relPublishedVersionOf: "함께 기재한 프리프린트의 정식 출판본입니다",
  relVersionOf: "같은 업적의 다른 버전입니다",
  relTranslationOf: "다른 항목의 번역본입니다 — 두 독자층을 위해 둘 다 유지할 수 있습니다",
  relErratumOf: "다른 항목의 정정/오류표입니다 — 둘 다 기재하면 수정 이력을 남깁니다",
  relSameWork: "다른 항목과 동일한 업적입니다",
  tierExact: "동일한 식별자(DOI)가 두 번 나타납니다",
  tierStrong: "제목·저자·연도가 일치합니다",
  tierWeak: "제목이 유사함 — 신뢰도 낮음",
};

const RU: DuplicateStrings = {
  badge: "⚠ возможный дубликат",
  badgeHint:
    "Возможно, это та же работа, что и другая запись. Нажмите для проверки — ничего не удаляется автоматически.",
  panelAria: "Сведения о возможном дубликате",
  looksLike: "Похоже на ту же работу, что и",
  confirm: "Это одно и то же",
  confirmHint:
    "Помечает запись как дубликат и убирает её из резюме (остаётся в архиве). Другая запись сохраняется.",
  keepBoth: "Оставить обе",
  keepBothHint: "Это разные работы — оставьте обе в резюме и больше не отмечайте эту пару.",
  hideThis: "Скрыть эту",
  summary: "Возможных дубликатов для проверки: {n}",
  review: "Проверить",
  relPreprintOf: "одна — препринт другой; многие исследователи указывают обе",
  relPublishedVersionOf: "опубликованная версия препринта, который вы также указываете",
  relVersionOf: "другая версия той же работы",
  relTranslationOf: "перевод другой записи — оставьте обе, чтобы охватить обе аудитории",
  relErratumOf: "поправка/опечатка к другой записи — наличие обеих документирует исправление",
  relSameWork: "та же работа, что и другая запись",
  tierExact: "один и тот же идентификатор (DOI) встречается дважды",
  tierStrong: "совпадают название, авторы и год",
  tierWeak: "похожее название — низкая уверенность",
};

const DICT: Record<Locale, DuplicateStrings> = {
  "en-US": EN,
  "zh-CN": ZH,
  "es-ES": ES,
  "fr-FR": FR,
  "de-DE": DE,
  "ja-JP": JA,
  "pt-BR": PT,
  "it-IT": IT,
  "ko-KR": KO,
  "ru-RU": RU,
};

/** Duplicate-feature strings for a locale (falls back to English defensively). */
export function dupStrings(locale: string): DuplicateStrings {
  return DICT[asLocale(locale)] ?? EN;
}

/**
 * The explanatory phrase for WHY a pair was flagged, from `(tier, relationship)`.
 * A typed relationship (preprint/translation/erratum/…) wins; otherwise the tier
 * decides. Keeps the legitimate-both framing for relationship cases.
 */
export function dupReasonText(
  locale: string,
  tier: DuplicateTier,
  relationship: DuplicateRelationship | undefined,
): string {
  const s = dupStrings(locale);
  switch (relationship) {
    case "preprint-of":
      return s.relPreprintOf;
    case "published-version-of":
      return s.relPublishedVersionOf;
    case "version-of":
      return s.relVersionOf;
    case "translation-of":
      return s.relTranslationOf;
    case "erratum-of":
      return s.relErratumOf;
    default:
      break;
  }
  // No typed relationship (the "same-work" cases): describe by tier instead — the
  // tier wording is more informative for an identifier/heuristic match than a bare
  // "same work". `related`-without-a-relationship is only reachable defensively.
  if (tier === "exact") return s.tierExact;
  if (tier === "strong") return s.tierStrong;
  if (tier === "related") return s.relSameWork;
  return s.tierWeak;
}
