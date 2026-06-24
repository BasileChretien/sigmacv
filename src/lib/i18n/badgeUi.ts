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
  // ── Email-signature sub-panel ──
  /** Sub-section heading. */
  emailHeading: string;
  /** One-line explainer for the email-signature badge. */
  emailIntro: string;
  /** Primary action: copy the rich badge for an email signature. */
  emailButton: string;
  /** Confirmation shown after the rich copy succeeds. */
  emailCopied: string;
  /** Heading above the Outlook paste steps. */
  emailStepsHeading: string;
  /** Outlook paste steps. */
  emailStep1: string;
  emailStep2: string;
  emailStep3: string;
  /** Extra paste step: link the image (Ctrl+K) so the badge itself is clickable
   *  — classic Outlook strips the link off pasted images. The reliable fix. */
  emailStep4: string;
}

const BADGE_UI_I18N: Record<Locale, BadgeUiStrings> = {
  "en-US": {
    heading: "Get a badge",
    intro:
      "A small badge for your README, site, or email signature. Shows only public data; stops if you unpublish.",
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
    emailHeading: "Email signature",
    emailIntro:
      "Add a clickable badge to your email signature. It links to your living page and shows only public data.",
    emailButton: "Add to my email signature",
    emailCopied: "Copied — paste it into your signature",
    emailStepsHeading: "How to paste it into Outlook",
    emailStep1:
      "Open your signature settings — new Outlook & web: Settings ▸ Mail ▸ Compose and reply; classic Outlook: File ▸ Options ▸ Mail ▸ Signatures.",
    emailStep2: "Click inside the signature box where you want the badge.",
    emailStep3: "Paste with Ctrl+V (⌘V on Mac), then save.",
    emailStep4:
      "Make the badge clickable: click the image, press Ctrl+K, paste your living-CV link, then OK.",
  },
  "zh-CN": {
    heading: "获取徽章",
    intro: "适用于 README、网站或邮件签名的小徽章。仅显示公开数据，取消发布后失效。",
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
    emailHeading: "邮件签名",
    emailIntro: "在邮件签名中添加可点击的徽章。它链接到你的动态主页，仅显示公开数据。",
    emailButton: "添加到我的邮件签名",
    emailCopied: "已复制——粘贴到你的签名中",
    emailStepsHeading: "如何粘贴到 Outlook",
    emailStep1:
      "打开签名设置——新版 Outlook 和网页版：设置 ▸ 邮件 ▸ 撰写和回复；经典版 Outlook：文件 ▸ 选项 ▸ 邮件 ▸ 签名。",
    emailStep2: "在签名框中点击你想放置徽章的位置。",
    emailStep3: "按 Ctrl+V（Mac 上为 ⌘V）粘贴，然后保存。",
    emailStep4: "让徽章可点击：点击图片，按 Ctrl+K，粘贴你的动态简历链接，然后确定。",
  },
  "es-ES": {
    heading: "Obtén una insignia",
    intro:
      "Una pequeña insignia para tu README, sitio o firma de correo. Solo muestra datos públicos; deja de funcionar si dejas de publicar.",
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
    emailHeading: "Firma de correo",
    emailIntro:
      "Añade una insignia con enlace a tu firma de correo. Enlaza con tu página viva y solo muestra datos públicos.",
    emailButton: "Añadir a mi firma de correo",
    emailCopied: "Copiado: pégalo en tu firma",
    emailStepsHeading: "Cómo pegarlo en Outlook",
    emailStep1:
      "Abre la configuración de firma — Outlook nuevo y web: Configuración ▸ Correo ▸ Redactar y responder; Outlook clásico: Archivo ▸ Opciones ▸ Correo ▸ Firmas.",
    emailStep2: "Haz clic dentro del cuadro de firma donde quieras la insignia.",
    emailStep3: "Pega con Ctrl+V (⌘V en Mac) y guarda.",
    emailStep4:
      "Haz la insignia clicable: haz clic en la imagen, pulsa Ctrl+K, pega el enlace de tu CV vivo y Aceptar.",
  },
  "fr-FR": {
    heading: "Obtenir un badge",
    intro:
      "Un petit badge pour votre README, site ou signature d'e-mail. N'affiche que des données publiques ; cesse de fonctionner si vous dépubliez.",
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
    emailHeading: "Signature d'e-mail",
    emailIntro:
      "Ajoutez un badge cliquable à votre signature d'e-mail. Il renvoie vers votre page vivante et n'affiche que des données publiques.",
    emailButton: "Ajouter à ma signature d'e-mail",
    emailCopied: "Copié — collez-le dans votre signature",
    emailStepsHeading: "Comment le coller dans Outlook",
    emailStep1:
      "Ouvrez les paramètres de signature — nouveau Outlook et web : Paramètres ▸ Courrier ▸ Composer et répondre ; Outlook classique : Fichier ▸ Options ▸ Courrier ▸ Signatures.",
    emailStep2: "Cliquez dans le cadre de signature à l'endroit voulu pour le badge.",
    emailStep3: "Collez avec Ctrl+V (⌘V sur Mac), puis enregistrez.",
    emailStep4:
      "Rendre le badge cliquable : cliquez sur l'image, appuyez sur Ctrl+K, collez le lien de votre CV vivant, puis OK.",
  },
  "de-DE": {
    heading: "Badge erhalten",
    intro:
      "Ein kleines Badge für README, Website oder E-Mail-Signatur. Zeigt nur öffentliche Daten; funktioniert nicht mehr, wenn Sie die Veröffentlichung zurücknehmen.",
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
    emailHeading: "E-Mail-Signatur",
    emailIntro:
      "Fügen Sie Ihrer E-Mail-Signatur ein anklickbares Badge hinzu. Es verlinkt auf Ihre lebende Seite und zeigt nur öffentliche Daten.",
    emailButton: "Zu meiner E-Mail-Signatur hinzufügen",
    emailCopied: "Kopiert – fügen Sie es in Ihre Signatur ein",
    emailStepsHeading: "So fügen Sie es in Outlook ein",
    emailStep1:
      "Öffnen Sie die Signatureinstellungen – neues Outlook & Web: Einstellungen ▸ E-Mail ▸ Verfassen und antworten; klassisches Outlook: Datei ▸ Optionen ▸ E-Mail ▸ Signaturen.",
    emailStep2: "Klicken Sie an die Stelle im Signaturfeld, an der das Badge erscheinen soll.",
    emailStep3: "Mit Strg+V (⌘V auf dem Mac) einfügen und speichern.",
    emailStep4:
      "Badge anklickbar machen: Bild anklicken, Strg+K drücken, den Link zu Ihrem lebenden Lebenslauf einfügen, dann OK.",
  },
  "ja-JP": {
    heading: "バッジを取得",
    intro:
      "README・サイト・メール署名向けの小さなバッジ。公開データのみを表示し、公開を取り消すと無効になります。",
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
    emailHeading: "メール署名",
    emailIntro:
      "メール署名にクリック可能なバッジを追加します。あなたのライブページにリンクし、公開データのみを表示します。",
    emailButton: "メール署名に追加",
    emailCopied: "コピーしました — 署名に貼り付けてください",
    emailStepsHeading: "Outlook への貼り付け方",
    emailStep1:
      "署名設定を開きます — 新しい Outlook・Web 版：設定 ▸ メール ▸ 作成と返信；従来の Outlook：ファイル ▸ オプション ▸ メール ▸ 署名。",
    emailStep2: "署名ボックス内のバッジを配置したい位置をクリックします。",
    emailStep3: "Ctrl+V（Mac は ⌘V）で貼り付け、保存します。",
    emailStep4:
      "バッジをクリック可能にする：画像をクリックし、Ctrl+K を押して、ライブ CV のリンクを貼り付け、OK を押します。",
  },
  "pt-BR": {
    heading: "Obter um selo",
    intro:
      "Um pequeno selo para seu README, site ou assinatura de e-mail. Mostra apenas dados públicos; para de funcionar se você cancelar a publicação.",
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
    emailHeading: "Assinatura de e-mail",
    emailIntro:
      "Adicione um selo clicável à sua assinatura de e-mail. Ele leva à sua página viva e mostra apenas dados públicos.",
    emailButton: "Adicionar à minha assinatura de e-mail",
    emailCopied: "Copiado — cole na sua assinatura",
    emailStepsHeading: "Como colar no Outlook",
    emailStep1:
      "Abra as configurações de assinatura — Outlook novo e web: Configurações ▸ Email ▸ Escrever e responder; Outlook clássico: Arquivo ▸ Opções ▸ Email ▸ Assinaturas.",
    emailStep2: "Clique dentro da caixa de assinatura onde quer o selo.",
    emailStep3: "Cole com Ctrl+V (⌘V no Mac) e salve.",
    emailStep4:
      "Torne o selo clicável: clique na imagem, pressione Ctrl+K, cole o link do seu currículo vivo e OK.",
  },
  "it-IT": {
    heading: "Ottieni un badge",
    intro:
      "Un piccolo badge per il tuo README, sito o firma email. Mostra solo dati pubblici; smette di funzionare se annulli la pubblicazione.",
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
    emailHeading: "Firma email",
    emailIntro:
      "Aggiungi un badge cliccabile alla tua firma email. Rimanda alla tua pagina viva e mostra solo dati pubblici.",
    emailButton: "Aggiungi alla mia firma email",
    emailCopied: "Copiato — incollalo nella tua firma",
    emailStepsHeading: "Come incollarlo in Outlook",
    emailStep1:
      "Apri le impostazioni della firma — nuovo Outlook e web: Impostazioni ▸ Posta ▸ Scrivi e rispondi; Outlook classico: File ▸ Opzioni ▸ Posta ▸ Firme.",
    emailStep2: "Fai clic nel riquadro della firma dove vuoi il badge.",
    emailStep3: "Incolla con Ctrl+V (⌘V su Mac), poi salva.",
    emailStep4:
      "Rendi il badge cliccabile: clicca sull'immagine, premi Ctrl+K, incolla il link del tuo CV vivo, poi OK.",
  },
  "ko-KR": {
    heading: "배지 받기",
    intro:
      "README, 웹사이트, 이메일 서명용 작은 배지. 공개 데이터만 표시하며, 게시를 취소하면 작동하지 않습니다.",
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
    emailHeading: "이메일 서명",
    emailIntro:
      "이메일 서명에 클릭 가능한 배지를 추가하세요. 당신의 라이브 페이지로 연결되며 공개 데이터만 표시합니다.",
    emailButton: "내 이메일 서명에 추가",
    emailCopied: "복사됨 — 서명에 붙여넣으세요",
    emailStepsHeading: "Outlook에 붙여넣는 방법",
    emailStep1:
      "서명 설정을 엽니다 — 새 Outlook 및 웹: 설정 ▸ 메일 ▸ 작성 및 회신; 클래식 Outlook: 파일 ▸ 옵션 ▸ 메일 ▸ 서명.",
    emailStep2: "서명 상자에서 배지를 넣을 위치를 클릭합니다.",
    emailStep3: "Ctrl+V(Mac은 ⌘V)로 붙여넣은 다음 저장합니다.",
    emailStep4:
      "배지를 클릭 가능하게: 이미지를 클릭하고 Ctrl+K를 눌러 라이브 CV 링크를 붙여넣은 다음 확인을 누릅니다.",
  },
  "ru-RU": {
    heading: "Получить значок",
    intro:
      "Небольшой значок для README, сайта или подписи e-mail. Показывает только публичные данные; перестаёт работать при отмене публикации.",
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
    emailHeading: "Подпись электронной почты",
    emailIntro:
      "Добавьте кликабельный значок в подпись электронной почты. Он ведёт на вашу живую страницу и показывает только публичные данные.",
    emailButton: "Добавить в мою подпись",
    emailCopied: "Скопировано — вставьте в свою подпись",
    emailStepsHeading: "Как вставить это в Outlook",
    emailStep1:
      "Откройте настройки подписи — новый Outlook и веб: Параметры ▸ Почта ▸ Создание и ответ; классический Outlook: Файл ▸ Параметры ▸ Почта ▸ Подписи.",
    emailStep2: "Щёлкните в поле подписи там, где нужен значок.",
    emailStep3: "Вставьте с помощью Ctrl+V (⌘V на Mac) и сохраните.",
    emailStep4:
      "Сделайте значок кликабельным: щёлкните изображение, нажмите Ctrl+K, вставьте ссылку на ваше живое резюме и нажмите OK.",
  },
};

/** Badge-panel copy for a locale (falls back to English for unknown locales). */
export function badgeUi(locale: string): BadgeUiStrings {
  return BADGE_UI_I18N[asLocale(locale)];
}
