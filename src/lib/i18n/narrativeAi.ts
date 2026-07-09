import { asLocale, type Locale } from "./index";

/**
 * Editor copy for the optional AI first-draft assistant on the narrative-CV
 * modules. BRING-YOUR-OWN-KEY: SigmaCV holds no key and presets no provider — the
 * user enters their own OpenAI-compatible endpoint, model and API key, held only
 * in their browser. The `consent` string is the point-of-use disclosure (what is
 * sent, to which provider, stored where) so the user gives informed consent before
 * any request; the privacy notice carries the durable disclosure. Typed as
 * Record<Locale, …> so a missing translation is a compile error.
 *
 * NOTE: non-English copy is an initial translation pending native review.
 */
export interface NarrativeAiStrings {
  /** Button that opens the AI-draft flow. */
  button: string;
  /** Point-of-use disclosure + consent (BYOK: your provider, your key, browser-only). */
  consent: string;
  /** Label for the OpenAI-compatible base URL field. */
  baseUrlLabel: string;
  /** Label for the model field. */
  modelLabel: string;
  /** Label for the API-key field. */
  apiKeyLabel: string;
  /** Reassurance under the fields: key is browser-only, never on our servers. */
  storedNote: string;
  /** Hint listing example compatible providers. */
  keyHint: string;
  /** Clear the stored key/config from this browser. */
  forgetKey: string;
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
      "Optional: draft this module from your own visible research outputs using YOUR OWN AI provider. Enter an OpenAI-compatible endpoint, model and API key below — they're kept only in this browser and sent to the provider you choose. A short, public-only summary (the module, output counts and a few titles) is sent to draft the text — no contact details or identifiers. SigmaCV stores no key and keeps nothing. The draft is a starting point you must verify and rewrite.",
    baseUrlLabel: "API base URL (OpenAI-compatible)",
    modelLabel: "Model",
    apiKeyLabel: "API key",
    storedNote:
      "Kept only in this browser and sent to the provider you pick — never saved on our servers. Clear it on a shared computer.",
    keyHint:
      "Works with Mistral, OpenAI, OpenRouter, a self-hosted server, or any OpenAI-compatible endpoint.",
    forgetKey: "Forget key",
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
      "可选：使用你自己的 AI 提供商，根据你可见的科研产出起草本模块。请在下方填写兼容 OpenAI 的接口地址、模型和 API 密钥——它们仅保存在本浏览器中，并发送给你选择的提供商。系统只会发送简要的公开信息摘要（模块、产出数量和少量标题）用于起草，不含任何联系方式或标识符。SigmaCV 不保存任何密钥，也不留存任何内容。初稿仅供参考，你需要核对并改写。",
    baseUrlLabel: "API 接口地址（兼容 OpenAI）",
    modelLabel: "模型",
    apiKeyLabel: "API 密钥",
    storedNote:
      "仅保存在本浏览器，并发送给你选择的提供商——绝不会保存到我们的服务器。在公用电脑上请清除。",
    keyHint: "支持 Mistral、OpenAI、OpenRouter、自建服务器或任何兼容 OpenAI 的接口。",
    forgetKey: "清除密钥",
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
      "Opcional: redacta este módulo a partir de tus resultados de investigación visibles usando TU PROPIO proveedor de IA. Introduce abajo un endpoint compatible con OpenAI, un modelo y una clave API; se guardan solo en este navegador y se envían al proveedor que elijas. Se envía un breve resumen público (el módulo, los recuentos y algunos títulos) para redactar el texto, sin datos de contacto ni identificadores. SigmaCV no guarda ninguna clave ni conserva nada. El borrador es un punto de partida que debes verificar y reescribir.",
    baseUrlLabel: "URL base de la API (compatible con OpenAI)",
    modelLabel: "Modelo",
    apiKeyLabel: "Clave API",
    storedNote:
      "Se guarda solo en este navegador y se envía al proveedor que elijas; nunca en nuestros servidores. Bórrala en un equipo compartido.",
    keyHint:
      "Funciona con Mistral, OpenAI, OpenRouter, un servidor propio o cualquier endpoint compatible con OpenAI.",
    forgetKey: "Olvidar clave",
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
      "Facultatif : rédigez ce module à partir de vos travaux de recherche visibles en utilisant VOTRE PROPRE fournisseur d’IA. Saisissez ci-dessous un point d’accès compatible OpenAI, un modèle et une clé API — ils ne sont conservés que dans ce navigateur et envoyés au fournisseur que vous choisissez. Un bref résumé public (le module, le nombre de productions et quelques titres) est envoyé pour rédiger le texte, sans coordonnée ni identifiant. SigmaCV ne conserve aucune clé et ne garde rien. Le brouillon est un point de départ que vous devez vérifier et réécrire.",
    baseUrlLabel: "URL de base de l’API (compatible OpenAI)",
    modelLabel: "Modèle",
    apiKeyLabel: "Clé API",
    storedNote:
      "Conservée uniquement dans ce navigateur et envoyée au fournisseur choisi — jamais sur nos serveurs. Effacez-la sur un ordinateur partagé.",
    keyHint:
      "Fonctionne avec Mistral, OpenAI, OpenRouter, un serveur auto-hébergé ou tout point d’accès compatible OpenAI.",
    forgetKey: "Oublier la clé",
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
      "Optional: Entwerfen Sie dieses Modul aus Ihren sichtbaren Forschungsleistungen mit IHREM EIGENEN KI-Anbieter. Geben Sie unten einen OpenAI-kompatiblen Endpunkt, ein Modell und einen API-Schlüssel ein – sie bleiben nur in diesem Browser und gehen an den von Ihnen gewählten Anbieter. Eine kurze, ausschließlich öffentliche Zusammenfassung (das Modul, die Anzahl der Leistungen und einige Titel) wird zum Entwerfen gesendet – ohne Kontaktdaten oder Kennungen. SigmaCV speichert keinen Schlüssel und behält nichts. Der Entwurf ist ein Ausgangspunkt, den Sie prüfen und umschreiben müssen.",
    baseUrlLabel: "API-Basis-URL (OpenAI-kompatibel)",
    modelLabel: "Modell",
    apiKeyLabel: "API-Schlüssel",
    storedNote:
      "Nur in diesem Browser gespeichert und an den gewählten Anbieter gesendet – niemals auf unseren Servern. An einem gemeinsam genutzten Rechner löschen.",
    keyHint:
      "Funktioniert mit Mistral, OpenAI, OpenRouter, einem selbst gehosteten Server oder jedem OpenAI-kompatiblen Endpunkt.",
    forgetKey: "Schlüssel vergessen",
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
      "任意：あなた自身の AI プロバイダーを使い、表示中の研究業績からこのモジュールを起草します。下に OpenAI 互換のエンドポイント、モデル、API キーを入力してください——これらはこのブラウザーにのみ保存され、あなたが選んだプロバイダーに送信されます。文章の作成のために、短い公開情報のみの要約（モジュール、業績数、いくつかのタイトル）が送信されます——連絡先や識別子は含みません。SigmaCV はキーを保存せず、何も残しません。下書きはあくまで出発点であり、必ず確認して書き直してください。",
    baseUrlLabel: "API ベース URL（OpenAI 互換）",
    modelLabel: "モデル",
    apiKeyLabel: "API キー",
    storedNote:
      "このブラウザーにのみ保存され、選んだプロバイダーに送信されます——当方のサーバーには保存されません。共有 PC では削除してください。",
    keyHint:
      "Mistral、OpenAI、OpenRouter、自己ホストのサーバー、その他 OpenAI 互換のエンドポイントで利用できます。",
    forgetKey: "キーを削除",
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
      "Opcional: rascunhe este módulo a partir dos seus resultados de pesquisa visíveis usando SEU PRÓPRIO provedor de IA. Informe abaixo um endpoint compatível com OpenAI, um modelo e uma chave de API — eles ficam apenas neste navegador e são enviados ao provedor que você escolher. Um breve resumo, apenas público (o módulo, as contagens e alguns títulos), é enviado para redigir o texto, sem dados de contato ou identificadores. A SigmaCV não guarda nenhuma chave nem retém nada. O rascunho é um ponto de partida que você deve verificar e reescrever.",
    baseUrlLabel: "URL base da API (compatível com OpenAI)",
    modelLabel: "Modelo",
    apiKeyLabel: "Chave de API",
    storedNote:
      "Guardada apenas neste navegador e enviada ao provedor escolhido — nunca em nossos servidores. Apague-a em um computador compartilhado.",
    keyHint:
      "Funciona com Mistral, OpenAI, OpenRouter, um servidor próprio ou qualquer endpoint compatível com OpenAI.",
    forgetKey: "Esquecer chave",
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
      "Facoltativo: redigi questo modulo dai tuoi risultati di ricerca visibili usando il TUO fornitore di IA. Inserisci sotto un endpoint compatibile con OpenAI, un modello e una chiave API — restano solo in questo browser e vengono inviati al fornitore che scegli. Viene inviato un breve riepilogo, solo pubblico (il modulo, i conteggi e alcuni titoli), per redigere il testo, senza recapiti o identificativi. SigmaCV non conserva alcuna chiave e non trattiene nulla. La bozza è un punto di partenza che devi verificare e riscrivere.",
    baseUrlLabel: "URL base dell’API (compatibile con OpenAI)",
    modelLabel: "Modello",
    apiKeyLabel: "Chiave API",
    storedNote:
      "Conservata solo in questo browser e inviata al fornitore scelto — mai sui nostri server. Cancellala su un computer condiviso.",
    keyHint:
      "Funziona con Mistral, OpenAI, OpenRouter, un server self-hosted o qualsiasi endpoint compatibile con OpenAI.",
    forgetKey: "Dimentica chiave",
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
      "선택 사항: 본인의 AI 제공자를 사용해 표시된 연구 성과로 이 모듈의 초안을 작성합니다. 아래에 OpenAI 호환 엔드포인트, 모델, API 키를 입력하세요 — 이 브라우저에만 보관되며 선택한 제공자에게 전송됩니다. 텍스트 작성을 위해 짧은 공개 정보 요약(모듈, 성과 수, 일부 제목)만 전송되며 연락처나 식별자는 포함되지 않습니다. SigmaCV는 어떤 키도 저장하지 않고 아무것도 보관하지 않습니다. 초안은 출발점일 뿐이며 반드시 확인하고 다시 작성해야 합니다.",
    baseUrlLabel: "API 기본 URL(OpenAI 호환)",
    modelLabel: "모델",
    apiKeyLabel: "API 키",
    storedNote:
      "이 브라우저에만 보관되고 선택한 제공자에게 전송되며, 당사 서버에는 저장되지 않습니다. 공용 컴퓨터에서는 삭제하세요.",
    keyHint:
      "Mistral, OpenAI, OpenRouter, 자체 호스팅 서버 또는 OpenAI 호환 엔드포인트에서 작동합니다.",
    forgetKey: "키 삭제",
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
      "Необязательно: составьте этот модуль из ваших видимых научных результатов, используя ВАШЕГО СОБСТВЕННОГО поставщика ИИ. Укажите ниже OpenAI-совместимый эндпоинт, модель и API-ключ — они хранятся только в этом браузере и отправляются выбранному вами поставщику. Для составления текста отправляется краткая сводка только из общедоступной информации (модуль, число результатов и несколько названий) — без контактных данных и идентификаторов. SigmaCV не хранит ключ и ничего не сохраняет. Черновик — это отправная точка, которую вы должны проверить и переписать.",
    baseUrlLabel: "Базовый URL API (совместимый с OpenAI)",
    modelLabel: "Модель",
    apiKeyLabel: "API-ключ",
    storedNote:
      "Хранится только в этом браузере и отправляется выбранному поставщику — никогда на наших серверах. На общем компьютере удалите его.",
    keyHint:
      "Работает с Mistral, OpenAI, OpenRouter, собственным сервером или любым OpenAI-совместимым эндпоинтом.",
    forgetKey: "Забыть ключ",
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
