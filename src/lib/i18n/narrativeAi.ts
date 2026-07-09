import { asLocale, type Locale } from "./index";

/**
 * Editor copy for the optional AI first-draft assistant on the narrative-CV
 * modules. Shown ONLY in the signed-in editor when the deployment has an (EU) AI
 * provider configured. The `consent` string is the point-of-use disclosure —
 * what is sent, to which processor, and that the draft must be verified — so the
 * user gives informed consent before any request; the privacy notice carries the
 * durable disclosure. Typed as Record<Locale, …> so a missing translation is a
 * compile error.
 *
 * NOTE: non-English copy is an initial translation pending native review.
 */
export interface NarrativeAiStrings {
  /** Button that opens the AI-draft flow. */
  button: string;
  /** Point-of-use disclosure + consent (names the EU processor; what is sent). */
  consent: string;
  /** Confirm button that sends the request. */
  generate: string;
  cancel: string;
  /** In-flight label. */
  loading: string;
  /** Always-visible label on the returned draft. */
  disclaimer: string;
  /** Insert the draft into the section body. */
  insert: string;
  regenerate: string;
  discard: string;
  /** Friendly failure message. */
  error: string;
}

const NARRATIVE_AI_I18N: Record<Locale, NarrativeAiStrings> = {
  "en-US": {
    button: "Draft with AI",
    consent:
      "Optional: generate a first draft from your own visible research outputs. A short summary of them (the module, output counts, and a few titles) is sent to an EU AI provider (Mistral AI, France) to draft the text — no contact details or identifiers are sent, and nothing is stored. The draft is a starting point you must verify and rewrite.",
    generate: "Generate draft",
    cancel: "Cancel",
    loading: "Drafting…",
    disclaimer: "AI draft — verify and rewrite",
    insert: "Insert into section",
    regenerate: "Regenerate",
    discard: "Discard",
    error: "Couldn't generate a draft. Please try again.",
  },
  "zh-CN": {
    button: "用 AI 起草",
    consent:
      "可选：根据你自己可见的科研产出生成初稿。系统会将其简要摘要（模块、产出数量和少量标题）发送给欧盟 AI 提供商（法国 Mistral AI）来起草文本——不会发送任何联系方式或标识符，也不会存储。初稿仅供参考，你需要核对并改写。",
    generate: "生成初稿",
    cancel: "取消",
    loading: "正在起草……",
    disclaimer: "AI 初稿——请核对并改写",
    insert: "插入到该部分",
    regenerate: "重新生成",
    discard: "放弃",
    error: "无法生成初稿，请重试。",
  },
  "es-ES": {
    button: "Redactar con IA",
    consent:
      "Opcional: genera un primer borrador a partir de tus propios resultados de investigación visibles. Se envía un breve resumen (el módulo, los recuentos de resultados y algunos títulos) a un proveedor de IA de la UE (Mistral AI, Francia) para redactar el texto; no se envían datos de contacto ni identificadores, y no se almacena nada. El borrador es un punto de partida que debes verificar y reescribir.",
    generate: "Generar borrador",
    cancel: "Cancelar",
    loading: "Redactando…",
    disclaimer: "Borrador de IA: verifica y reescribe",
    insert: "Insertar en la sección",
    regenerate: "Regenerar",
    discard: "Descartar",
    error: "No se pudo generar el borrador. Inténtalo de nuevo.",
  },
  "fr-FR": {
    button: "Rédiger avec l’IA",
    consent:
      "Facultatif : générez un premier jet à partir de vos propres travaux de recherche visibles. Un bref résumé (le module, le nombre de productions et quelques titres) est envoyé à un prestataire d’IA de l’UE (Mistral AI, France) pour rédiger le texte — aucune coordonnée ni identifiant n’est transmis, et rien n’est conservé. Le brouillon est un point de départ que vous devez vérifier et réécrire.",
    generate: "Générer le brouillon",
    cancel: "Annuler",
    loading: "Rédaction…",
    disclaimer: "Brouillon IA — à vérifier et réécrire",
    insert: "Insérer dans la section",
    regenerate: "Régénérer",
    discard: "Ignorer",
    error: "Impossible de générer un brouillon. Veuillez réessayer.",
  },
  "de-DE": {
    button: "Mit KI entwerfen",
    consent:
      "Optional: Erzeugen Sie einen ersten Entwurf aus Ihren eigenen sichtbaren Forschungsleistungen. Eine kurze Zusammenfassung (das Modul, die Anzahl der Leistungen und einige Titel) wird an einen EU-KI-Anbieter (Mistral AI, Frankreich) gesendet, um den Text zu entwerfen – es werden keine Kontaktdaten oder Kennungen übermittelt und nichts gespeichert. Der Entwurf ist ein Ausgangspunkt, den Sie prüfen und umschreiben müssen.",
    generate: "Entwurf erzeugen",
    cancel: "Abbrechen",
    loading: "Entwurf wird erstellt…",
    disclaimer: "KI-Entwurf – prüfen und umschreiben",
    insert: "In den Abschnitt einfügen",
    regenerate: "Neu erzeugen",
    discard: "Verwerfen",
    error: "Entwurf konnte nicht erstellt werden. Bitte erneut versuchen.",
  },
  "ja-JP": {
    button: "AI で下書き",
    consent:
      "任意：あなた自身の表示中の研究業績から下書きを生成します。要約（モジュール、業績数、いくつかのタイトル）が EU の AI プロバイダー（フランスの Mistral AI）に送信され、文章が作成されます——連絡先や識別子は送信されず、保存もされません。下書きはあくまで出発点であり、必ず確認して書き直してください。",
    generate: "下書きを生成",
    cancel: "キャンセル",
    loading: "作成中…",
    disclaimer: "AI 下書き — 確認して書き直してください",
    insert: "セクションに挿入",
    regenerate: "再生成",
    discard: "破棄",
    error: "下書きを生成できませんでした。もう一度お試しください。",
  },
  "pt-BR": {
    button: "Rascunhar com IA",
    consent:
      "Opcional: gere um primeiro rascunho a partir dos seus próprios resultados de pesquisa visíveis. Um breve resumo (o módulo, as contagens de resultados e alguns títulos) é enviado a um provedor de IA da UE (Mistral AI, França) para redigir o texto — nenhum dado de contato ou identificador é enviado, e nada é armazenado. O rascunho é um ponto de partida que você deve verificar e reescrever.",
    generate: "Gerar rascunho",
    cancel: "Cancelar",
    loading: "Rascunhando…",
    disclaimer: "Rascunho de IA — verifique e reescreva",
    insert: "Inserir na seção",
    regenerate: "Regenerar",
    discard: "Descartar",
    error: "Não foi possível gerar um rascunho. Tente novamente.",
  },
  "it-IT": {
    button: "Bozza con l’IA",
    consent:
      "Facoltativo: genera una prima bozza dai tuoi risultati di ricerca visibili. Un breve riepilogo (il modulo, i conteggi dei risultati e alcuni titoli) viene inviato a un fornitore di IA dell’UE (Mistral AI, Francia) per redigere il testo — non vengono inviati recapiti o identificativi e nulla viene conservato. La bozza è un punto di partenza che devi verificare e riscrivere.",
    generate: "Genera bozza",
    cancel: "Annulla",
    loading: "Redazione…",
    disclaimer: "Bozza IA — verifica e riscrivi",
    insert: "Inserisci nella sezione",
    regenerate: "Rigenera",
    discard: "Scarta",
    error: "Impossibile generare una bozza. Riprova.",
  },
  "ko-KR": {
    button: "AI로 초안 작성",
    consent:
      "선택 사항: 표시된 본인의 연구 성과를 바탕으로 초안을 생성합니다. 요약(모듈, 성과 수, 일부 제목)이 EU AI 제공업체(프랑스 Mistral AI)로 전송되어 텍스트를 작성합니다 — 연락처나 식별자는 전송되지 않으며 저장되지 않습니다. 초안은 출발점일 뿐이며 반드시 확인하고 다시 작성해야 합니다.",
    generate: "초안 생성",
    cancel: "취소",
    loading: "작성 중…",
    disclaimer: "AI 초안 — 확인 후 다시 작성하세요",
    insert: "섹션에 삽입",
    regenerate: "다시 생성",
    discard: "버리기",
    error: "초안을 생성할 수 없습니다. 다시 시도해 주세요.",
  },
  "ru-RU": {
    button: "Черновик с ИИ",
    consent:
      "Необязательно: создайте первый черновик на основе ваших видимых научных результатов. Краткая сводка (модуль, число результатов и несколько названий) отправляется поставщику ИИ из ЕС (Mistral AI, Франция) для составления текста — контактные данные и идентификаторы не передаются и ничего не сохраняется. Черновик — это отправная точка, которую вы должны проверить и переписать.",
    generate: "Создать черновик",
    cancel: "Отмена",
    loading: "Создание…",
    disclaimer: "Черновик ИИ — проверьте и перепишите",
    insert: "Вставить в раздел",
    regenerate: "Создать заново",
    discard: "Отклонить",
    error: "Не удалось создать черновик. Повторите попытку.",
  },
};

/** Localized editor copy for the AI first-draft assistant (English fallback). */
export function narrativeAiStrings(locale: string): NarrativeAiStrings {
  return NARRATIVE_AI_I18N[asLocale(locale)];
}
