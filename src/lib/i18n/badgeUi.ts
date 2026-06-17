import { asLocale, type Locale } from "./index";

/**
 * Copy for the "Get a badge" panel in the publish controls — the embeddable
 * "Living CV" badge a researcher pastes into a README, personal site, or email
 * signature to link back to their living public page (the organic growth loop).
 *
 * The badge itself is deliberately metric-free (DORA) and shows only already-
 * public data; this copy explains that. The badge LABEL on the image stays the
 * English brand term "Living CV" in v1 (like "SigmaCV"); only the panel chrome is
 * localized. Non-English strings are machine-drafted; flag for native review.
 *
 * Typed Record<Locale,…> so a missing locale is a compile error (all ten or bust).
 */
export interface BadgeUiStrings {
  /** Disclosure heading. */
  heading: string;
  /** One-paragraph explanation + the consent reassurance. */
  intro: string;
  styleLabel: string;
  themeLabel: string;
  /** Style option labels (pill / flat / card variants). */
  styleStandard: string;
  styleCompact: string;
  styleCard: string;
  /** Theme option labels. */
  themeAuto: string;
  themeLight: string;
  themeDark: string;
  copyMarkdown: string;
  copyHtml: string;
  copyLink: string;
  /** Alt text for the live preview image. */
  previewAlt: string;
  /** QR sub-section (posters / slides / business cards). */
  qrLabel: string;
  qrHint: string;
  qrAlt: string;
  downloadQr: string;
}

const BADGE_UI_I18N: Record<Locale, BadgeUiStrings> = {
  "en-US": {
    heading: "Get a badge",
    intro:
      "Add a small badge for your site, README, or email signature that links to your living CV. It shows only your public data and stops working if you unpublish.",
    styleLabel: "Style",
    themeLabel: "Theme",
    styleStandard: "Standard",
    styleCompact: "Compact",
    styleCard: "Card",
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",
    copyMarkdown: "Copy Markdown",
    copyHtml: "Copy HTML",
    copyLink: "Copy image URL",
    previewAlt: "Living CV badge preview",
    qrLabel: "QR code",
    qrHint: "For posters, slides, and business cards.",
    qrAlt: "QR code linking to your CV",
    downloadQr: "Download QR",
  },
  "zh-CN": {
    heading: "获取徽章",
    intro:
      "为你的网站、README 或邮件签名添加一个小徽章，链接到你的动态简历。它只显示你的公开数据，取消发布后即失效。",
    styleLabel: "样式",
    themeLabel: "主题",
    styleStandard: "标准",
    styleCompact: "紧凑",
    styleCard: "卡片",
    themeAuto: "自动",
    themeLight: "浅色",
    themeDark: "深色",
    copyMarkdown: "复制 Markdown",
    copyHtml: "复制 HTML",
    copyLink: "复制图片链接",
    previewAlt: "动态简历徽章预览",
    qrLabel: "二维码",
    qrHint: "适用于海报、幻灯片和名片。",
    qrAlt: "链接到你简历的二维码",
    downloadQr: "下载二维码",
  },
  "es-ES": {
    heading: "Obtén una insignia",
    intro:
      "Añade una pequeña insignia para tu sitio, README o firma de correo que enlace con tu CV vivo. Solo muestra tus datos públicos y deja de funcionar si dejas de publicar.",
    styleLabel: "Estilo",
    themeLabel: "Tema",
    styleStandard: "Estándar",
    styleCompact: "Compacta",
    styleCard: "Tarjeta",
    themeAuto: "Auto",
    themeLight: "Claro",
    themeDark: "Oscuro",
    copyMarkdown: "Copiar Markdown",
    copyHtml: "Copiar HTML",
    copyLink: "Copiar URL de imagen",
    previewAlt: "Vista previa de la insignia de CV vivo",
    qrLabel: "Código QR",
    qrHint: "Para pósters, diapositivas y tarjetas de visita.",
    qrAlt: "Código QR que enlaza con tu CV",
    downloadQr: "Descargar QR",
  },
  "fr-FR": {
    heading: "Obtenir un badge",
    intro:
      "Ajoutez un petit badge à votre site, votre README ou votre signature d'e-mail, qui renvoie vers votre CV vivant. Il n'affiche que vos données publiques et cesse de fonctionner si vous dépubliez.",
    styleLabel: "Style",
    themeLabel: "Thème",
    styleStandard: "Standard",
    styleCompact: "Compact",
    styleCard: "Carte",
    themeAuto: "Auto",
    themeLight: "Clair",
    themeDark: "Sombre",
    copyMarkdown: "Copier le Markdown",
    copyHtml: "Copier le HTML",
    copyLink: "Copier l'URL de l'image",
    previewAlt: "Aperçu du badge CV vivant",
    qrLabel: "QR code",
    qrHint: "Pour les posters, diapositives et cartes de visite.",
    qrAlt: "QR code menant à votre CV",
    downloadQr: "Télécharger le QR",
  },
  "de-DE": {
    heading: "Badge erhalten",
    intro:
      "Fügen Sie Ihrer Website, Ihrem README oder Ihrer E-Mail-Signatur ein kleines Badge hinzu, das auf Ihren lebenden Lebenslauf verweist. Es zeigt nur Ihre öffentlichen Daten und funktioniert nicht mehr, wenn Sie die Veröffentlichung zurücknehmen.",
    styleLabel: "Stil",
    themeLabel: "Design",
    styleStandard: "Standard",
    styleCompact: "Kompakt",
    styleCard: "Karte",
    themeAuto: "Auto",
    themeLight: "Hell",
    themeDark: "Dunkel",
    copyMarkdown: "Markdown kopieren",
    copyHtml: "HTML kopieren",
    copyLink: "Bild-URL kopieren",
    previewAlt: "Vorschau des Lebenslauf-Badges",
    qrLabel: "QR-Code",
    qrHint: "Für Poster, Folien und Visitenkarten.",
    qrAlt: "QR-Code, der zu Ihrem Lebenslauf führt",
    downloadQr: "QR herunterladen",
  },
  "ja-JP": {
    heading: "バッジを取得",
    intro:
      "あなたのサイト・README・メール署名に、動的 CV へのリンクになる小さなバッジを追加できます。公開データのみを表示し、公開を取り消すと無効になります。",
    styleLabel: "スタイル",
    themeLabel: "テーマ",
    styleStandard: "標準",
    styleCompact: "コンパクト",
    styleCard: "カード",
    themeAuto: "自動",
    themeLight: "ライト",
    themeDark: "ダーク",
    copyMarkdown: "Markdown をコピー",
    copyHtml: "HTML をコピー",
    copyLink: "画像 URL をコピー",
    previewAlt: "動的 CV バッジのプレビュー",
    qrLabel: "QR コード",
    qrHint: "ポスター・スライド・名刺向け。",
    qrAlt: "あなたの CV へのリンク QR コード",
    downloadQr: "QR をダウンロード",
  },
  "pt-BR": {
    heading: "Obter um selo",
    intro:
      "Adicione um pequeno selo ao seu site, README ou assinatura de e-mail que leva ao seu currículo vivo. Ele mostra apenas seus dados públicos e para de funcionar se você cancelar a publicação.",
    styleLabel: "Estilo",
    themeLabel: "Tema",
    styleStandard: "Padrão",
    styleCompact: "Compacto",
    styleCard: "Cartão",
    themeAuto: "Auto",
    themeLight: "Claro",
    themeDark: "Escuro",
    copyMarkdown: "Copiar Markdown",
    copyHtml: "Copiar HTML",
    copyLink: "Copiar URL da imagem",
    previewAlt: "Pré-visualização do selo de currículo vivo",
    qrLabel: "QR code",
    qrHint: "Para pôsteres, slides e cartões de visita.",
    qrAlt: "QR code que leva ao seu currículo",
    downloadQr: "Baixar QR",
  },
  "it-IT": {
    heading: "Ottieni un badge",
    intro:
      "Aggiungi un piccolo badge al tuo sito, README o firma email che rimanda al tuo CV vivo. Mostra solo i tuoi dati pubblici e smette di funzionare se annulli la pubblicazione.",
    styleLabel: "Stile",
    themeLabel: "Tema",
    styleStandard: "Standard",
    styleCompact: "Compatto",
    styleCard: "Scheda",
    themeAuto: "Auto",
    themeLight: "Chiaro",
    themeDark: "Scuro",
    copyMarkdown: "Copia Markdown",
    copyHtml: "Copia HTML",
    copyLink: "Copia URL immagine",
    previewAlt: "Anteprima del badge CV vivo",
    qrLabel: "Codice QR",
    qrHint: "Per poster, diapositive e biglietti da visita.",
    qrAlt: "Codice QR che rimanda al tuo CV",
    downloadQr: "Scarica QR",
  },
  "ko-KR": {
    heading: "배지 받기",
    intro:
      "웹사이트, README 또는 이메일 서명에 살아 있는 이력서로 연결되는 작은 배지를 추가하세요. 공개 데이터만 표시하며, 게시를 취소하면 작동하지 않습니다.",
    styleLabel: "스타일",
    themeLabel: "테마",
    styleStandard: "표준",
    styleCompact: "간략",
    styleCard: "카드",
    themeAuto: "자동",
    themeLight: "라이트",
    themeDark: "다크",
    copyMarkdown: "마크다운 복사",
    copyHtml: "HTML 복사",
    copyLink: "이미지 URL 복사",
    previewAlt: "살아 있는 이력서 배지 미리보기",
    qrLabel: "QR 코드",
    qrHint: "포스터, 슬라이드, 명함용.",
    qrAlt: "당신의 이력서로 연결되는 QR 코드",
    downloadQr: "QR 다운로드",
  },
  "ru-RU": {
    heading: "Получить значок",
    intro:
      "Добавьте небольшой значок на ваш сайт, README или в подпись e-mail со ссылкой на ваше «живое» резюме. Он показывает только ваши публичные данные и перестаёт работать, если вы отмените публикацию.",
    styleLabel: "Стиль",
    themeLabel: "Тема",
    styleStandard: "Стандарт",
    styleCompact: "Компактный",
    styleCard: "Карточка",
    themeAuto: "Авто",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    copyMarkdown: "Копировать Markdown",
    copyHtml: "Копировать HTML",
    copyLink: "Копировать URL изображения",
    previewAlt: "Предпросмотр значка живого резюме",
    qrLabel: "QR-код",
    qrHint: "Для постеров, слайдов и визиток.",
    qrAlt: "QR-код со ссылкой на ваше резюме",
    downloadQr: "Скачать QR",
  },
};

/** Badge-panel copy for a locale (falls back to English for unknown locales). */
export function badgeUi(locale: string): BadgeUiStrings {
  return BADGE_UI_I18N[asLocale(locale)];
}
