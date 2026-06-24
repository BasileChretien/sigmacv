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
  /** Visible fallback link words embedded in the signature itself. */
  emailLinkText: string;
  /** Heading above the Outlook paste steps. */
  emailStepsHeading: string;
  /** Outlook paste steps. */
  emailStep1: string;
  emailStep2: string;
  emailStep3: string;
  /** Reassurance that the text link still shows when images are blocked. */
  emailImageNote: string;
  // ── Classic-Outlook "download a file" sub-panel ──
  /** Disclosure summary for the downloadable-signature-file option. */
  outlookFileSummary: string;
  /** Why a file beats pasting in classic Outlook. */
  outlookFileNote: string;
  /** Download-the-file button. */
  downloadOutlook: string;
  /** Install steps for the downloaded .htm. */
  outlookFileStep1: string;
  outlookFileStep2: string;
  outlookFileStep3: string;
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
    emailLinkText: "View my living CV",
    emailStepsHeading: "How to paste it into Outlook",
    emailStep1:
      "Open your signature settings — new Outlook & web: Settings ▸ Mail ▸ Compose and reply; classic Outlook: File ▸ Options ▸ Mail ▸ Signatures.",
    emailStep2: "Click inside the signature box where you want the badge.",
    emailStep3: "Paste with Ctrl+V (⌘V on Mac), then save.",
    emailImageNote:
      "If your mail app blocks images, recipients still see the text link below the badge.",
    outlookFileSummary: "Classic Outlook (Windows): download a file instead",
    outlookFileNote:
      "Classic Outlook drops the link from pasted images. Installing this file keeps the badge clickable — no pasting, no manual linking.",
    downloadOutlook: "Download for Outlook (.htm)",
    outlookFileStep1:
      "Press Win+R, type %APPDATA% and press Enter, then open Microsoft ▸ Signatures.",
    outlookFileStep2: "Move the downloaded SigmaCV.htm into that folder, then restart Outlook.",
    outlookFileStep3:
      "In Outlook: File ▸ Options ▸ Mail ▸ Signatures, then pick SigmaCV. If it's missing, click New, name it SigmaCV, OK, close Outlook, then replace the new SigmaCV.htm with the downloaded file.",
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
    emailLinkText: "查看我的动态简历",
    emailStepsHeading: "如何粘贴到 Outlook",
    emailStep1:
      "打开签名设置——新版 Outlook 和网页版：设置 ▸ 邮件 ▸ 撰写和回复；经典版 Outlook：文件 ▸ 选项 ▸ 邮件 ▸ 签名。",
    emailStep2: "在签名框中点击你想放置徽章的位置。",
    emailStep3: "按 Ctrl+V（Mac 上为 ⌘V）粘贴，然后保存。",
    emailImageNote: "如果你的邮件应用屏蔽图片，收件人仍可看到徽章下方的文字链接。",
    outlookFileSummary: "经典版 Outlook（Windows）：改为下载文件",
    outlookFileNote:
      "经典版 Outlook 会丢弃粘贴图片的链接。安装此文件可让徽章保持可点击——无需粘贴，也无需手动加链接。",
    downloadOutlook: "下载 Outlook 版（.htm）",
    outlookFileStep1: "按 Win+R，输入 %APPDATA% 并回车，然后打开 Microsoft ▸ Signatures 文件夹。",
    outlookFileStep2: "将下载的 SigmaCV.htm 移动到该文件夹，然后重启 Outlook。",
    outlookFileStep3:
      "在 Outlook 中：文件 ▸ 选项 ▸ 邮件 ▸ 签名，然后选择 SigmaCV。若未出现，点击“新建”，命名为 SigmaCV，确定，关闭 Outlook，再用下载的文件替换新建的 SigmaCV.htm。",
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
    emailLinkText: "Ver mi CV vivo",
    emailStepsHeading: "Cómo pegarlo en Outlook",
    emailStep1:
      "Abre la configuración de firma — Outlook nuevo y web: Configuración ▸ Correo ▸ Redactar y responder; Outlook clásico: Archivo ▸ Opciones ▸ Correo ▸ Firmas.",
    emailStep2: "Haz clic dentro del cuadro de firma donde quieras la insignia.",
    emailStep3: "Pega con Ctrl+V (⌘V en Mac) y guarda.",
    emailImageNote:
      "Si tu aplicación de correo bloquea las imágenes, los destinatarios aún verán el enlace de texto bajo la insignia.",
    outlookFileSummary: "Outlook clásico (Windows): descarga un archivo",
    outlookFileNote:
      "Outlook clásico elimina el enlace de las imágenes pegadas. Instalar este archivo mantiene la insignia clicable, sin pegar ni enlazar a mano.",
    downloadOutlook: "Descargar para Outlook (.htm)",
    outlookFileStep1:
      "Pulsa Win+R, escribe %APPDATA% y pulsa Intro; luego abre la carpeta Microsoft ▸ Signatures.",
    outlookFileStep2: "Mueve el SigmaCV.htm descargado a esa carpeta y reinicia Outlook.",
    outlookFileStep3:
      "En Outlook: Archivo ▸ Opciones ▸ Correo ▸ Firmas, y elige SigmaCV. Si no aparece, pulsa Nueva, nómbrala SigmaCV, Aceptar, cierra Outlook y reemplaza el nuevo SigmaCV.htm por el archivo descargado.",
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
    emailLinkText: "Voir mon CV vivant",
    emailStepsHeading: "Comment le coller dans Outlook",
    emailStep1:
      "Ouvrez les paramètres de signature — nouveau Outlook et web : Paramètres ▸ Courrier ▸ Composer et répondre ; Outlook classique : Fichier ▸ Options ▸ Courrier ▸ Signatures.",
    emailStep2: "Cliquez dans le cadre de signature à l'endroit voulu pour le badge.",
    emailStep3: "Collez avec Ctrl+V (⌘V sur Mac), puis enregistrez.",
    emailImageNote:
      "Si votre messagerie bloque les images, les destinataires voient quand même le lien texte sous le badge.",
    outlookFileSummary: "Outlook classique (Windows) : télécharger un fichier",
    outlookFileNote:
      "Outlook classique supprime le lien des images collées. Installer ce fichier garde le badge cliquable — sans coller ni ajouter le lien à la main.",
    downloadOutlook: "Télécharger pour Outlook (.htm)",
    outlookFileStep1:
      "Appuyez sur Win+R, tapez %APPDATA% puis Entrée, et ouvrez le dossier Microsoft ▸ Signatures.",
    outlookFileStep2:
      "Déplacez le SigmaCV.htm téléchargé dans ce dossier, puis redémarrez Outlook.",
    outlookFileStep3:
      "Dans Outlook : Fichier ▸ Options ▸ Courrier ▸ Signatures, puis choisissez SigmaCV. S'il manque, cliquez sur Nouveau, nommez-le SigmaCV, OK, fermez Outlook, puis remplacez le nouveau SigmaCV.htm par le fichier téléchargé.",
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
    emailLinkText: "Meinen lebenden Lebenslauf ansehen",
    emailStepsHeading: "So fügen Sie es in Outlook ein",
    emailStep1:
      "Öffnen Sie die Signatureinstellungen – neues Outlook & Web: Einstellungen ▸ E-Mail ▸ Verfassen und antworten; klassisches Outlook: Datei ▸ Optionen ▸ E-Mail ▸ Signaturen.",
    emailStep2: "Klicken Sie an die Stelle im Signaturfeld, an der das Badge erscheinen soll.",
    emailStep3: "Mit Strg+V (⌘V auf dem Mac) einfügen und speichern.",
    emailImageNote:
      "Wenn Ihre E-Mail-App Bilder blockiert, sehen Empfänger weiterhin den Textlink unter dem Badge.",
    outlookFileSummary: "Klassisches Outlook (Windows): Datei herunterladen",
    outlookFileNote:
      "Klassisches Outlook entfernt den Link aus eingefügten Bildern. Diese Datei hält das Badge anklickbar – ohne Einfügen, ohne manuelles Verlinken.",
    downloadOutlook: "Für Outlook herunterladen (.htm)",
    outlookFileStep1:
      "Drücken Sie Win+R, geben Sie %APPDATA% ein und drücken Sie Enter; öffnen Sie dann den Ordner Microsoft ▸ Signatures.",
    outlookFileStep2:
      "Verschieben Sie die heruntergeladene SigmaCV.htm in diesen Ordner und starten Sie Outlook neu.",
    outlookFileStep3:
      "In Outlook: Datei ▸ Optionen ▸ E-Mail ▸ Signaturen, dann SigmaCV auswählen. Fehlt sie, auf Neu klicken, SigmaCV nennen, OK, Outlook schließen und die neue SigmaCV.htm durch die heruntergeladene Datei ersetzen.",
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
    emailLinkText: "私のライブ CV を見る",
    emailStepsHeading: "Outlook への貼り付け方",
    emailStep1:
      "署名設定を開きます — 新しい Outlook・Web 版：設定 ▸ メール ▸ 作成と返信；従来の Outlook：ファイル ▸ オプション ▸ メール ▸ 署名。",
    emailStep2: "署名ボックス内のバッジを配置したい位置をクリックします。",
    emailStep3: "Ctrl+V（Mac は ⌘V）で貼り付け、保存します。",
    emailImageNote:
      "メールアプリが画像をブロックしても、受信者にはバッジ下のテキストリンクが表示されます。",
    outlookFileSummary: "従来の Outlook（Windows）：ファイルをダウンロード",
    outlookFileNote:
      "従来の Outlook は貼り付けた画像のリンクを削除します。このファイルを入れると、貼り付けや手動リンクなしでバッジがクリック可能なままになります。",
    downloadOutlook: "Outlook 用をダウンロード（.htm）",
    outlookFileStep1:
      "Win+R を押し、%APPDATA% と入力して Enter を押し、Microsoft ▸ Signatures フォルダーを開きます。",
    outlookFileStep2:
      "ダウンロードした SigmaCV.htm をそのフォルダーに移動し、Outlook を再起動します。",
    outlookFileStep3:
      "Outlook で：ファイル ▸ オプション ▸ メール ▸ 署名 を開き、SigmaCV を選びます。ない場合は「新規作成」をクリックして SigmaCV と名付けて OK、Outlook を閉じ、新しい SigmaCV.htm をダウンロードしたファイルで置き換えます。",
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
    emailLinkText: "Ver meu currículo vivo",
    emailStepsHeading: "Como colar no Outlook",
    emailStep1:
      "Abra as configurações de assinatura — Outlook novo e web: Configurações ▸ Email ▸ Escrever e responder; Outlook clássico: Arquivo ▸ Opções ▸ Email ▸ Assinaturas.",
    emailStep2: "Clique dentro da caixa de assinatura onde quer o selo.",
    emailStep3: "Cole com Ctrl+V (⌘V no Mac) e salve.",
    emailImageNote:
      "Se seu aplicativo de e-mail bloquear imagens, os destinatários ainda verão o link de texto abaixo do selo.",
    outlookFileSummary: "Outlook clássico (Windows): baixe um arquivo",
    outlookFileNote:
      "O Outlook clássico remove o link de imagens coladas. Instalar este arquivo mantém o selo clicável — sem colar nem vincular manualmente.",
    downloadOutlook: "Baixar para Outlook (.htm)",
    outlookFileStep1:
      "Pressione Win+R, digite %APPDATA% e pressione Enter; depois abra a pasta Microsoft ▸ Signatures.",
    outlookFileStep2: "Mova o SigmaCV.htm baixado para essa pasta e reinicie o Outlook.",
    outlookFileStep3:
      "No Outlook: Arquivo ▸ Opções ▸ Email ▸ Assinaturas e escolha SigmaCV. Se não aparecer, clique em Novo, nomeie SigmaCV, OK, feche o Outlook e substitua o novo SigmaCV.htm pelo arquivo baixado.",
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
    emailLinkText: "Vedi il mio CV vivo",
    emailStepsHeading: "Come incollarlo in Outlook",
    emailStep1:
      "Apri le impostazioni della firma — nuovo Outlook e web: Impostazioni ▸ Posta ▸ Scrivi e rispondi; Outlook classico: File ▸ Opzioni ▸ Posta ▸ Firme.",
    emailStep2: "Fai clic nel riquadro della firma dove vuoi il badge.",
    emailStep3: "Incolla con Ctrl+V (⌘V su Mac), poi salva.",
    emailImageNote:
      "Se la tua app di posta blocca le immagini, i destinatari vedono comunque il link testuale sotto il badge.",
    outlookFileSummary: "Outlook classico (Windows): scarica un file",
    outlookFileNote:
      "Outlook classico rimuove il link dalle immagini incollate. Installare questo file mantiene il badge cliccabile — senza incollare né collegare a mano.",
    downloadOutlook: "Scarica per Outlook (.htm)",
    outlookFileStep1:
      "Premi Win+R, digita %APPDATA% e premi Invio; poi apri la cartella Microsoft ▸ Signatures.",
    outlookFileStep2: "Sposta il SigmaCV.htm scaricato in quella cartella e riavvia Outlook.",
    outlookFileStep3:
      "In Outlook: File ▸ Opzioni ▸ Posta ▸ Firme e scegli SigmaCV. Se manca, clicca Nuova, chiamala SigmaCV, OK, chiudi Outlook e sostituisci la nuova SigmaCV.htm con il file scaricato.",
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
    emailLinkText: "내 라이브 CV 보기",
    emailStepsHeading: "Outlook에 붙여넣는 방법",
    emailStep1:
      "서명 설정을 엽니다 — 새 Outlook 및 웹: 설정 ▸ 메일 ▸ 작성 및 회신; 클래식 Outlook: 파일 ▸ 옵션 ▸ 메일 ▸ 서명.",
    emailStep2: "서명 상자에서 배지를 넣을 위치를 클릭합니다.",
    emailStep3: "Ctrl+V(Mac은 ⌘V)로 붙여넣은 다음 저장합니다.",
    emailImageNote:
      "메일 앱이 이미지를 차단해도 수신자는 배지 아래의 텍스트 링크를 볼 수 있습니다.",
    outlookFileSummary: "클래식 Outlook(Windows): 파일 다운로드",
    outlookFileNote:
      "클래식 Outlook은 붙여넣은 이미지의 링크를 제거합니다. 이 파일을 설치하면 붙여넣기나 수동 링크 없이 배지가 클릭 가능하게 유지됩니다.",
    downloadOutlook: "Outlook용 다운로드(.htm)",
    outlookFileStep1:
      "Win+R를 누르고 %APPDATA%를 입력해 Enter를 누른 다음 Microsoft ▸ Signatures 폴더를 엽니다.",
    outlookFileStep2: "다운로드한 SigmaCV.htm을 그 폴더로 옮긴 후 Outlook을 다시 시작합니다.",
    outlookFileStep3:
      "Outlook에서: 파일 ▸ 옵션 ▸ 메일 ▸ 서명 에서 SigmaCV를 선택합니다. 없으면 새로 만들기를 클릭해 SigmaCV로 이름 지정, 확인, Outlook 닫기, 새 SigmaCV.htm을 다운로드한 파일로 교체합니다.",
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
    emailLinkText: "Посмотреть моё живое резюме",
    emailStepsHeading: "Как вставить это в Outlook",
    emailStep1:
      "Откройте настройки подписи — новый Outlook и веб: Параметры ▸ Почта ▸ Создание и ответ; классический Outlook: Файл ▸ Параметры ▸ Почта ▸ Подписи.",
    emailStep2: "Щёлкните в поле подписи там, где нужен значок.",
    emailStep3: "Вставьте с помощью Ctrl+V (⌘V на Mac) и сохраните.",
    emailImageNote:
      "Если ваше почтовое приложение блокирует изображения, получатели всё равно увидят текстовую ссылку под значком.",
    outlookFileSummary: "Классический Outlook (Windows): скачать файл",
    outlookFileNote:
      "Классический Outlook удаляет ссылку у вставленных изображений. Этот файл сохраняет значок кликабельным — без вставки и ручной привязки ссылки.",
    downloadOutlook: "Скачать для Outlook (.htm)",
    outlookFileStep1:
      "Нажмите Win+R, введите %APPDATA% и нажмите Enter, затем откройте папку Microsoft ▸ Signatures.",
    outlookFileStep2: "Переместите скачанный SigmaCV.htm в эту папку и перезапустите Outlook.",
    outlookFileStep3:
      "В Outlook: Файл ▸ Параметры ▸ Почта ▸ Подписи и выберите SigmaCV. Если её нет, нажмите «Создать», назовите SigmaCV, OK, закройте Outlook и замените новый SigmaCV.htm скачанным файлом.",
  },
};

/** Badge-panel copy for a locale (falls back to English for unknown locales). */
export function badgeUi(locale: string): BadgeUiStrings {
  return BADGE_UI_I18N[asLocale(locale)];
}
