import { asLocale, type Locale } from "./index";

/**
 * Copy for the no-login preview: the "see it first" box shown on the landing
 * pages (components/SeeItFirstForm.tsx — a name or an iD) AND the standalone
 * /preview/[orcid] page's states (rendered CV, valid-but-unknown iD, malformed
 * input, rate-limited).
 *
 * Own module (high cohesion, same convention as orcidHelp.ts / landingAudience.ts).
 * Typed Record<Locale, PreviewStrings> so a missing locale/field is a compile
 * error. Non-English copy was machine-drafted and is flagged for native review.
 *
 * "ORCID", "SigmaCV" and "OpenAlex" are brand proper nouns — never translated
 * (pinned by the i18n brand-noun test).
 */
export interface PreviewStrings {
  /** Heading of the "see it first" box at the top of the sign-in card. */
  formPrompt: string;
  /** aria-label + placeholder of its one input: a name or an ORCID iD. */
  formAria: string;
  /** Submit button: opens the preview (iD) or the name lookup (name). */
  formCta: string;
  /** Line under the input: what to type, and that no account is needed. */
  formHint: string;
  /** Shown instead of the hint when the input is neither a name nor an iD. */
  formInvalid: string;
  /** The box's heading under the preview page's malformed-iD notice: a retry,
   *  not the owner-voiced homepage prompt (that page is a third-party surface). */
  formRetryPrompt: string;
  /** <title> for the preview page (the layout appends " — SigmaCV"). */
  metaTitle: string;
  /** Disclaimer under a rendered preview: built live from public data. */
  builtFromPublic: string;
  /** Primary CTA on the preview page → the ORCID sign-in. */
  ctaSignIn: string;
  /** Heading when the ORCID is well-formed but resolves to no public record. */
  emptyHeading: string;
  emptyBody: string;
  /** Heading when the path segment isn't a well-formed ORCID iD. */
  invalidHeading: string;
  invalidBody: string;
  /** Heading + body for the 429 (too many preview builds). */
  rateLimitedHeading: string;
  rateLimitedBody: string;
  /** Heading + body for a transient build failure (retryable). */
  errorHeading: string;
  errorBody: string;
  /** Inline notice when the live re-render is rate-limited (429): stale preview, edits safe. */
  refreshPaused: string;
  /** Inline notice when the live re-render fails (network/5xx): stale preview, retries next edit. */
  refreshFailed: string;
  /** Instant loading screen shown while /preview/[orcid] builds (route loading.tsx). */
  loadingTitle: string;
  loadingBody: string;
  /** Interactive-editor top-bar CTA (save/publish/export are account-gated). */
  ctaKeep: string;
  /** Note beside that CTA explaining what's free vs. gated. */
  editNote: string;
  /** Link back to the home page. */
  back: string;
  /** Third-party framing (the visitor may not be the owner). `bannerAutomatic`: the
   *  record is a raw machine build, unreviewed, figure-free; `bannerPublished`: the
   *  researcher has a published, indexable page — read that instead. */
  bannerAutomatic: string;
  bannerPublished: string;
  /** Link text to the researcher's published page (only when indexable). */
  ctaPublishedPage: string;
  /** The one-sentence promise of the lookup: what it is for, and what it is not. */
  promise: string;
  /** Link to the privacy notice's objection route for non-users. */
  objectLink: string;
  /** Third-party CTA: copy the preview link to send to the researcher. */
  ctaCopyLink: string;
  /** Transient confirmation after copying. */
  copied: string;
}

const PREVIEW_I18N: Record<Locale, PreviewStrings> = {
  "en-US": {
    formPrompt: "See what SigmaCV finds — before you sign in",
    formAria: "Your name or ORCID iD",
    formCta: "Show me",
    formHint: "Your name as on your papers, or your ORCID iD — no account needed.",
    formInvalid:
      "Type at least three characters of a name, or an ORCID iD like 0000-0000-0000-0000.",
    formRetryPrompt: "Try again with a name or an ORCID iD",
    metaTitle: "CV preview",
    builtFromPublic:
      "This preview is built live from public data (OpenAlex, ORCID and other open sources). If it is your record, sign in to curate it, pick a citation style and make it yours.",
    ctaSignIn: "This is my record — sign in with ORCID",
    emptyHeading: "No public record found yet",
    emptyBody:
      "We couldn't find a public research record for this ORCID iD. If it is yours, sign in and SigmaCV will help you build your CV anyway.",
    invalidHeading: "That doesn't look like an ORCID iD",
    invalidBody: "An ORCID iD looks like 0000-0000-0000-0000. Check it and try again.",
    rateLimitedHeading: "Too many previews",
    rateLimitedBody:
      "There have been a lot of preview requests from your network. Please wait a moment and try again.",
    errorHeading: "Something went wrong",
    errorBody:
      "We couldn't build this preview just now — a data source may be temporarily unavailable. Please try again in a moment.",
    refreshPaused:
      "Preview updates paused briefly (too many refreshes). Your edits are safe — it'll catch up in a moment.",
    refreshFailed:
      "Couldn't refresh the preview just now. Your edits are safe — it'll retry on your next change.",
    loadingTitle: "Building the CV preview",
    loadingBody:
      "Gathering this researcher's public work from open sources (OpenAlex, ORCID) and formatting it. This usually takes a few seconds.",
    ctaKeep: "This is my record — sign in to save & publish",
    editNote:
      "Live preview — curate and restyle freely; nothing is saved. Sign in as the owner to save, publish or export.",
    back: "Back to SigmaCV",
    bannerAutomatic:
      "Automatic preview — assembled from open sources, not published or reviewed on SigmaCV. It may include work by others with the same name, and it shows no citation figures or indices.",
    bannerPublished:
      "Curated by the researcher — this record has a published SigmaCV page. Read that page for what the researcher chose to show; this preview is the raw machine build.",
    ctaPublishedPage: "Open the published page",
    promise: "Look up what a researcher has published — not how they score.",
    objectLink: "Don't want your record previewed? How to object",
    ctaCopyLink: "Know this researcher? Copy the link",
    copied: "Link copied",
  },
  "zh-CN": {
    formPrompt: "登录前先看看 SigmaCV 能找到什么",
    formAria: "您的姓名或 ORCID iD",
    formCta: "看看",
    formHint: "论文上署名的姓名，或您的 ORCID iD——无需账户。",
    formInvalid: "请输入至少三个字符的姓名，或形如 0000-0000-0000-0000 的 ORCID iD。",
    formRetryPrompt: "请用姓名或 ORCID iD 重试",
    metaTitle: "简历预览",
    builtFromPublic:
      "此预览根据公开数据（OpenAlex、ORCID 及其他开放数据源）实时生成。如果这是您的记录，请登录以整理内容、选择引用样式，并将其打造成您自己的简历。",
    ctaSignIn: "这是我的记录——使用 ORCID 登录",
    emptyHeading: "暂未找到公开记录",
    emptyBody:
      "我们没有找到与此 ORCID iD 对应的公开研究记录。如果这是您的 iD，请登录，SigmaCV 仍会帮助您创建简历。",
    invalidHeading: "这看起来不是 ORCID iD",
    invalidBody: "ORCID iD 的格式类似 0000-0000-0000-0000。请检查后重试。",
    rateLimitedHeading: "预览次数过多",
    rateLimitedBody: "您的网络在短时间内发起了大量预览请求。请稍候片刻后重试。",
    errorHeading: "出了点问题",
    errorBody: "我们暂时无法生成此预览——某个数据源可能暂时不可用。请稍后再试。",
    refreshPaused: "预览更新已暂停片刻（刷新过于频繁）。您的编辑已安全保留——稍后会自动更新。",
    refreshFailed: "暂时无法刷新预览。您的编辑已安全保留——下次修改时会自动重试。",
    loadingTitle: "正在生成简历预览",
    loadingBody:
      "正在从公开数据源（OpenAlex、ORCID）收集并整理这位研究者的公开成果。通常需要几秒钟。",
    ctaKeep: "这是我的记录——登录以保存和发布",
    editNote:
      "实时预览——可自由整理和调整样式；不会保存任何内容。以本人身份登录后即可保存、发布或导出。",
    back: "返回 SigmaCV",
    bannerAutomatic:
      "自动预览——依据公开数据源生成，未在 SigmaCV 上发布，也未经本人审核。其中可能包含同名他人的成果，并且不显示任何引用数字或指数。",
    bannerPublished:
      "由研究者本人整理——该记录已有一个发布的 SigmaCV 页面。请阅读该页面了解研究者选择展示的内容；此预览只是原始的机器生成版本。",
    ctaPublishedPage: "打开已发布的页面",
    promise: "查看研究者发表了什么——而不是给他们打分。",
    objectLink: "不希望您的记录被预览？了解如何提出反对",
    ctaCopyLink: "认识这位研究者？复制链接",
    copied: "链接已复制",
  },
  "es-ES": {
    formPrompt: "Mira lo que SigmaCV encuentra, antes de iniciar sesión",
    formAria: "Tu nombre o tu iD ORCID",
    formCta: "Ver",
    formHint: "Tu nombre tal como aparece en tus artículos, o tu iD ORCID — sin cuenta.",
    formInvalid:
      "Escribe al menos tres caracteres de un nombre, o un iD ORCID como 0000-0000-0000-0000.",
    formRetryPrompt: "Inténtalo de nuevo con un nombre o un iD ORCID",
    metaTitle: "Vista previa del CV",
    builtFromPublic:
      "Esta vista previa se genera en directo a partir de datos públicos (OpenAlex, ORCID y otras fuentes abiertas). Si es tu registro, inicia sesión para personalizarlo, elegir un estilo de cita y hacerlo tuyo.",
    ctaSignIn: "Este es mi registro: iniciar sesión con ORCID",
    emptyHeading: "Aún no se ha encontrado ningún registro público",
    emptyBody:
      "No hemos encontrado ningún registro de investigación público para este iD ORCID. Si es tuyo, inicia sesión y SigmaCV te ayudará a crear tu CV de todos modos.",
    invalidHeading: "Esto no parece un iD ORCID",
    invalidBody:
      "Un iD ORCID tiene el formato 0000-0000-0000-0000. Compruébalo e inténtalo de nuevo.",
    rateLimitedHeading: "Demasiadas vistas previas",
    rateLimitedBody:
      "Se han recibido muchas solicitudes de vista previa desde tu red. Espera un momento e inténtalo de nuevo.",
    errorHeading: "Algo ha salido mal",
    errorBody:
      "No hemos podido generar esta vista previa ahora mismo: puede que una fuente de datos no esté disponible temporalmente. Inténtalo de nuevo en un momento.",
    refreshPaused:
      "La actualización de la vista previa se ha pausado un momento (demasiados refrescos). Tus cambios están a salvo y se pondrá al día enseguida.",
    refreshFailed:
      "No se pudo actualizar la vista previa ahora mismo. Tus cambios están a salvo: se reintentará con tu próxima edición.",
    loadingTitle: "Generando la vista previa del CV",
    loadingBody:
      "Recopilando las obras públicas de este investigador desde fuentes abiertas (OpenAlex, ORCID) y dándoles formato. Suele tardar unos segundos.",
    ctaKeep: "Este es mi registro: iniciar sesión para guardar y publicar",
    editNote:
      "Vista previa en directo: personaliza y cambia el estilo libremente; no se guarda nada. Inicia sesión como titular para guardar, publicar o exportar.",
    back: "Volver a SigmaCV",
    bannerAutomatic:
      "Vista previa automática: generada a partir de fuentes abiertas, no publicada ni revisada en SigmaCV. Puede incluir obras de otras personas con el mismo nombre y no muestra cifras de citas ni índices.",
    bannerPublished:
      "Curada por el investigador: este registro tiene una página SigmaCV publicada. Consulta esa página para ver lo que el investigador decidió mostrar; esta vista previa es la construcción automática en bruto.",
    ctaPublishedPage: "Abrir la página publicada",
    promise: "Consulta qué ha publicado un investigador, no cómo puntúa.",
    objectLink: "¿No quieres que se muestre tu registro? Cómo oponerte",
    ctaCopyLink: "¿Conoces a este investigador? Copia el enlace",
    copied: "Enlace copiado",
  },
  "fr-FR": {
    formPrompt: "Voyez ce que SigmaCV trouve, avant de vous connecter",
    formAria: "Votre nom ou votre iD ORCID",
    formCta: "Voir",
    formHint: "Votre nom tel qu'il figure sur vos articles, ou votre iD ORCID — sans compte.",
    formInvalid:
      "Saisissez au moins trois caractères d'un nom, ou un iD ORCID de la forme 0000-0000-0000-0000.",
    formRetryPrompt: "Réessayez avec un nom ou un iD ORCID",
    metaTitle: "Aperçu du CV",
    builtFromPublic:
      "Cet aperçu est construit en direct à partir de données publiques (OpenAlex, ORCID et d'autres sources ouvertes). Si c'est votre notice, connectez-vous pour la trier, choisir un style de citation et vous l'approprier.",
    ctaSignIn: "C'est ma notice — se connecter avec ORCID",
    emptyHeading: "Aucune trace publique trouvée pour l'instant",
    emptyBody:
      "Nous n'avons trouvé aucune notice de recherche publique pour cet ORCID iD. Si c'est le vôtre, connectez-vous et SigmaCV vous aidera quand même à construire votre CV.",
    invalidHeading: "Cela ne ressemble pas à un iD ORCID",
    invalidBody: "Un iD ORCID ressemble à 0000-0000-0000-0000. Vérifiez-le et réessayez.",
    rateLimitedHeading: "Trop d'aperçus",
    rateLimitedBody:
      "De nombreuses demandes d'aperçu proviennent de votre réseau. Veuillez patienter un instant, puis réessayer.",
    errorHeading: "Une erreur s'est produite",
    errorBody:
      "Nous n'avons pas pu générer cet aperçu pour le moment — une source de données est peut-être temporairement indisponible. Veuillez réessayer dans un instant.",
    refreshPaused:
      "La mise à jour de l'aperçu est suspendue un instant (trop de rafraîchissements). Vos modifications sont conservées et l'aperçu se mettra à jour sous peu.",
    refreshFailed:
      "Impossible d'actualiser l'aperçu pour le moment. Vos modifications sont conservées — une nouvelle tentative aura lieu à votre prochaine modification.",
    loadingTitle: "Construction de l'aperçu du CV",
    loadingBody:
      "Collecte des travaux publics de ce chercheur depuis les sources ouvertes (OpenAlex, ORCID) et mise en forme. Cela prend généralement quelques secondes.",
    ctaKeep: "C'est ma notice — se connecter pour enregistrer et publier",
    editNote:
      "Aperçu en direct — triez et restylez librement ; rien n'est enregistré. Connectez-vous en tant que titulaire pour enregistrer, publier ou exporter.",
    back: "Retour à SigmaCV",
    bannerAutomatic:
      "Aperçu automatique — assemblé à partir de sources ouvertes, ni publié ni vérifié sur SigmaCV. Il peut inclure des travaux d'homonymes et n'affiche aucun chiffre de citations ni indice.",
    bannerPublished:
      "Établi par le chercheur — cette notice dispose d'une page SigmaCV publiée. Consultez cette page pour ce que le chercheur a choisi de montrer ; cet aperçu est la construction automatique brute.",
    ctaPublishedPage: "Ouvrir la page publiée",
    promise: "Voir ce qu'un chercheur a publié — pas comment il est noté.",
    objectLink: "Vous ne souhaitez pas que votre notice soit affichée ? Comment vous y opposer",
    ctaCopyLink: "Vous connaissez ce chercheur ? Copier le lien",
    copied: "Lien copié",
  },
  "de-DE": {
    formPrompt: "Sehen Sie, was SigmaCV findet – vor der Anmeldung",
    formAria: "Ihr Name oder Ihre ORCID iD",
    formCta: "Anzeigen",
    formHint: "Ihr Name wie auf Ihren Publikationen oder Ihre ORCID iD – kein Konto nötig.",
    formInvalid:
      "Geben Sie mindestens drei Zeichen eines Namens ein oder eine ORCID iD wie 0000-0000-0000-0000.",
    formRetryPrompt: "Versuchen Sie es erneut mit einem Namen oder einer ORCID iD",
    metaTitle: "Lebenslauf-Vorschau",
    builtFromPublic:
      "Diese Vorschau wird live aus öffentlichen Daten erstellt (OpenAlex, ORCID und weitere offene Quellen). Ist es Ihr Nachweis, melden Sie sich an, um ihn zu kuratieren, einen Zitierstil zu wählen und ihn zu Ihrem zu machen.",
    ctaSignIn: "Das ist mein Nachweis – mit ORCID anmelden",
    emptyHeading: "Noch kein öffentlicher Eintrag gefunden",
    emptyBody:
      "Wir haben für diese ORCID iD keinen öffentlichen Forschungsnachweis gefunden. Ist es Ihre iD, melden Sie sich an – SigmaCV hilft Ihnen trotzdem beim Aufbau Ihres Lebenslaufs.",
    invalidHeading: "Das sieht nicht nach einer ORCID iD aus",
    invalidBody:
      "Eine ORCID iD sieht so aus: 0000-0000-0000-0000. Bitte prüfen Sie sie und versuchen Sie es erneut.",
    rateLimitedHeading: "Zu viele Vorschauen",
    rateLimitedBody:
      "Aus Ihrem Netzwerk kamen sehr viele Vorschau-Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    errorHeading: "Etwas ist schiefgelaufen",
    errorBody:
      "Diese Vorschau konnte gerade nicht erstellt werden — eine Datenquelle ist möglicherweise vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich noch einmal.",
    refreshPaused:
      "Die Vorschau-Aktualisierung ist kurz pausiert (zu viele Aktualisierungen). Ihre Änderungen sind sicher und die Vorschau zieht gleich nach.",
    refreshFailed:
      "Die Vorschau konnte gerade nicht aktualisiert werden. Ihre Änderungen sind sicher — bei Ihrer nächsten Bearbeitung wird es erneut versucht.",
    loadingTitle: "Die Lebenslauf-Vorschau wird erstellt",
    loadingBody:
      "Die öffentlichen Werke dieser Person werden aus offenen Quellen (OpenAlex, ORCID) gesammelt und formatiert. Das dauert meist nur wenige Sekunden.",
    ctaKeep: "Das ist mein Nachweis – anmelden, um zu speichern und zu veröffentlichen",
    editNote:
      "Live-Vorschau – frei kuratieren und umgestalten; nichts wird gespeichert. Als Inhaber anmelden, um zu speichern, zu veröffentlichen oder zu exportieren.",
    back: "Zurück zu SigmaCV",
    bannerAutomatic:
      "Automatische Vorschau – aus offenen Quellen zusammengestellt, auf SigmaCV weder veröffentlicht noch geprüft. Sie kann Werke von Namensvettern enthalten und zeigt keine Zitationszahlen oder Indizes.",
    bannerPublished:
      "Von der forschenden Person kuratiert – zu diesem Nachweis gibt es eine veröffentlichte SigmaCV-Seite. Dort steht, was die Person zeigen möchte; diese Vorschau ist die rohe maschinelle Zusammenstellung.",
    ctaPublishedPage: "Veröffentlichte Seite öffnen",
    promise:
      "Nachschlagen, was eine forschende Person veröffentlicht hat – nicht, wie sie abschneidet.",
    objectLink: "Sie möchten keine Vorschau Ihres Nachweises? So widersprechen Sie",
    ctaCopyLink: "Sie kennen diese Person? Link kopieren",
    copied: "Link kopiert",
  },
  "ja-JP": {
    formPrompt: "ログイン前に SigmaCV が見つける内容を確認",
    formAria: "氏名または ORCID iD",
    formCta: "表示",
    formHint: "論文に記載の氏名、または ORCID iD — アカウント不要。",
    formInvalid:
      "氏名を 3 文字以上、または 0000-0000-0000-0000 形式の ORCID iD を入力してください。",
    formRetryPrompt: "氏名または ORCID iD でもう一度お試しください",
    metaTitle: "CV プレビュー",
    builtFromPublic:
      "このプレビューは公開データ（OpenAlex、ORCID、その他の公開ソース）からリアルタイムで構築されています。ご自身の記録であれば、ログインして整理し、引用スタイルを選び、自分のものにしてください。",
    ctaSignIn: "これは私の記録です — ORCID でログイン",
    emptyHeading: "公開記録はまだ見つかりません",
    emptyBody:
      "この ORCID iD に対応する公開研究記録は見つかりませんでした。ご自身の iD であれば、ログインしてください。SigmaCV が CV 作成をお手伝いします。",
    invalidHeading: "ORCID iD ではないようです",
    invalidBody:
      "ORCID iD は 0000-0000-0000-0000 のような形式です。ご確認のうえ、もう一度お試しください。",
    rateLimitedHeading: "プレビューが多すぎます",
    rateLimitedBody:
      "お使いのネットワークから短時間に多数のプレビュー要求がありました。少し待ってからもう一度お試しください。",
    errorHeading: "問題が発生しました",
    errorBody:
      "現在このプレビューを生成できませんでした。データソースが一時的に利用できない可能性があります。しばらくしてからもう一度お試しください。",
    refreshPaused:
      "プレビューの更新を少し停止しました（更新が多すぎます）。編集内容は保持されています。まもなく反映されます。",
    refreshFailed:
      "現在プレビューを更新できませんでした。編集内容は保持されています。次の編集時に再試行します。",
    loadingTitle: "CV プレビューを作成しています",
    loadingBody:
      "公開ソース（OpenAlex、ORCID）からこの研究者の公開業績を集めて整形しています。通常は数秒で完了します。",
    ctaKeep: "これは私の記録です — ログインして保存・公開",
    editNote:
      "ライブプレビュー — 自由に整理・スタイル変更できますが、何も保存されません。保存・公開・エクスポートは本人としてログインしてください。",
    back: "SigmaCV に戻る",
    bannerAutomatic:
      "自動プレビュー — 公開ソースから組み立てたもので、SigmaCV 上で公開も本人確認もされていません。同姓同名の他者の業績が含まれることがあり、引用数や指数は一切表示しません。",
    bannerPublished:
      "研究者本人が整理 — この記録には公開済みの SigmaCV ページがあります。研究者が示すと決めた内容はそのページをご覧ください。このプレビューは機械的に組み立てた素の版です。",
    ctaPublishedPage: "公開ページを開く",
    promise: "研究者が何を発表したかを調べる — 点数ではなく。",
    objectLink: "自分の記録をプレビューされたくない場合は？ 異議の申し立て方法",
    ctaCopyLink: "この研究者をご存じですか？ リンクをコピー",
    copied: "リンクをコピーしました",
  },
  "pt-BR": {
    formPrompt: "Veja o que o SigmaCV encontra, antes de entrar",
    formAria: "Seu nome ou seu iD ORCID",
    formCta: "Ver",
    formHint: "Seu nome como nos seus artigos, ou seu iD ORCID — sem conta.",
    formInvalid:
      "Digite pelo menos três caracteres de um nome, ou um iD ORCID como 0000-0000-0000-0000.",
    formRetryPrompt: "Tente novamente com um nome ou um iD ORCID",
    metaTitle: "Pré-visualização do CV",
    builtFromPublic:
      "Esta prévia é construída ao vivo a partir de dados públicos (OpenAlex, ORCID e outras fontes abertas). Se for o seu registro, faça login para curá-lo, escolher um estilo de citação e torná-lo seu.",
    ctaSignIn: "Este é o meu registro — entrar com ORCID",
    emptyHeading: "Nenhum registro público encontrado ainda",
    emptyBody:
      "Não encontramos um registro público de pesquisa para este ORCID iD. Se for o seu, faça login e o SigmaCV ajudará você a montar o seu CV mesmo assim.",
    invalidHeading: "Isso não parece um iD ORCID",
    invalidBody: "Um iD ORCID tem o formato 0000-0000-0000-0000. Verifique e tente novamente.",
    rateLimitedHeading: "Muitas pré-visualizações",
    rateLimitedBody:
      "Houve muitas solicitações de pré-visualização da sua rede. Aguarde um momento e tente novamente.",
    errorHeading: "Algo deu errado",
    errorBody:
      "Não conseguimos gerar esta pré-visualização agora — uma fonte de dados pode estar temporariamente indisponível. Tente novamente em instantes.",
    refreshPaused:
      "A atualização da pré-visualização foi pausada por um momento (muitas atualizações). Suas edições estão seguras e ela se atualizará em breve.",
    refreshFailed:
      "Não foi possível atualizar a pré-visualização agora. Suas edições estão seguras — tentaremos novamente na sua próxima alteração.",
    loadingTitle: "Montando a prévia do CV",
    loadingBody:
      "Reunindo os trabalhos públicos deste pesquisador em fontes abertas (OpenAlex, ORCID) e formatando-os. Normalmente leva alguns segundos.",
    ctaKeep: "Este é o meu registro — entrar para salvar e publicar",
    editNote:
      "Prévia ao vivo — cure e reestilize à vontade; nada é salvo. Entre como titular para salvar, publicar ou exportar.",
    back: "Voltar ao SigmaCV",
    bannerAutomatic:
      "Prévia automática — montada a partir de fontes abertas, não publicada nem revisada no SigmaCV. Pode incluir trabalhos de homônimos e não mostra números de citações nem índices.",
    bannerPublished:
      "Curada pelo pesquisador — este registro tem uma página SigmaCV publicada. Consulte essa página para ver o que o pesquisador escolheu mostrar; esta prévia é a montagem automática bruta.",
    ctaPublishedPage: "Abrir a página publicada",
    promise: "Consulte o que um pesquisador publicou — não a pontuação dele.",
    objectLink: "Não quer que seu registro seja exibido? Como se opor",
    ctaCopyLink: "Conhece este pesquisador? Copiar o link",
    copied: "Link copiado",
  },
  "it-IT": {
    formPrompt: "Guarda cosa trova SigmaCV, prima di accedere",
    formAria: "Il tuo nome o il tuo ORCID iD",
    formCta: "Mostra",
    formHint: "Il tuo nome come nei tuoi articoli, o il tuo ORCID iD — senza account.",
    formInvalid:
      "Scrivi almeno tre caratteri di un nome, oppure un ORCID iD come 0000-0000-0000-0000.",
    formRetryPrompt: "Riprova con un nome o un ORCID iD",
    metaTitle: "Anteprima del CV",
    builtFromPublic:
      "Questa anteprima è costruita in tempo reale da dati pubblici (OpenAlex, ORCID e altre fonti aperte). Se è la tua registrazione, accedi per curarla, scegliere uno stile di citazione e farla tua.",
    ctaSignIn: "È la mia registrazione — accedi con ORCID",
    emptyHeading: "Nessun record pubblico trovato per ora",
    emptyBody:
      "Non abbiamo trovato alcuna registrazione pubblica della ricerca per questo ORCID iD. Se è il tuo, accedi e SigmaCV ti aiuterà comunque a costruire il tuo CV.",
    invalidHeading: "Questo non sembra un iD ORCID",
    invalidBody: "Un iD ORCID ha il formato 0000-0000-0000-0000. Controllalo e riprova.",
    rateLimitedHeading: "Troppe anteprime",
    rateLimitedBody:
      "Sono arrivate molte richieste di anteprima dalla tua rete. Attendi un momento e riprova.",
    errorHeading: "Qualcosa è andato storto",
    errorBody:
      "Non siamo riusciti a generare questa anteprima al momento — una fonte di dati potrebbe essere temporaneamente non disponibile. Riprova tra un istante.",
    refreshPaused:
      "L'aggiornamento dell'anteprima è in pausa per un momento (troppi aggiornamenti). Le tue modifiche sono al sicuro e l'anteprima si aggiornerà a breve.",
    refreshFailed:
      "Non è stato possibile aggiornare l'anteprima al momento. Le tue modifiche sono al sicuro — verrà riprovato alla prossima modifica.",
    loadingTitle: "Costruzione dell'anteprima del CV",
    loadingBody:
      "Raccolta dei lavori pubblici di questo ricercatore da fonti aperte (OpenAlex, ORCID) e formattazione. Di solito richiede pochi secondi.",
    ctaKeep: "È la mia registrazione — accedi per salvare e pubblicare",
    editNote:
      "Anteprima in tempo reale — cura e ristilizza liberamente; nulla viene salvato. Accedi come titolare per salvare, pubblicare o esportare.",
    back: "Torna a SigmaCV",
    bannerAutomatic:
      "Anteprima automatica — assemblata da fonti aperte, non pubblicata né verificata su SigmaCV. Può includere lavori di omonimi e non mostra alcun numero di citazioni né indice.",
    bannerPublished:
      "Curata dal ricercatore — questa registrazione ha una pagina SigmaCV pubblicata. Consulta quella pagina per ciò che il ricercatore ha scelto di mostrare; questa anteprima è la costruzione automatica grezza.",
    ctaPublishedPage: "Apri la pagina pubblicata",
    promise: "Scopri cosa ha pubblicato un ricercatore — non il suo punteggio.",
    objectLink: "Non vuoi che la tua registrazione venga mostrata? Come opporsi",
    ctaCopyLink: "Conosci questo ricercatore? Copia il link",
    copied: "Link copiato",
  },
  "ko-KR": {
    formPrompt: "로그인 전에 SigmaCV가 찾은 내용 보기",
    formAria: "이름 또는 ORCID iD",
    formCta: "보기",
    formHint: "논문에 표기된 이름 또는 ORCID iD — 계정 불필요.",
    formInvalid: "이름을 세 글자 이상 입력하거나 0000-0000-0000-0000 형식의 ORCID iD를 입력하세요.",
    formRetryPrompt: "이름 또는 ORCID iD로 다시 시도하세요",
    metaTitle: "CV 미리보기",
    builtFromPublic:
      "이 미리보기는 공개 데이터(OpenAlex, ORCID 및 기타 공개 소스)로 실시간 구성됩니다. 본인의 기록이라면 로그인하여 정리하고, 인용 스타일을 선택해 자신의 것으로 만드십시오.",
    ctaSignIn: "이것은 내 기록입니다 — ORCID로 로그인",
    emptyHeading: "아직 공개 기록을 찾지 못했습니다",
    emptyBody:
      "이 ORCID iD에 대한 공개 연구 기록을 찾지 못했습니다. 본인의 iD라면 로그인하십시오. SigmaCV가 CV 작성을 도와드립니다.",
    invalidHeading: "ORCID iD가 아닌 것 같습니다",
    invalidBody: "ORCID iD는 0000-0000-0000-0000 형식입니다. 확인 후 다시 시도해 주세요.",
    rateLimitedHeading: "미리보기 요청이 너무 많습니다",
    rateLimitedBody:
      "회원님의 네트워크에서 짧은 시간에 많은 미리보기 요청이 있었습니다. 잠시 후 다시 시도해 주세요.",
    errorHeading: "문제가 발생했습니다",
    errorBody:
      "지금은 이 미리보기를 생성하지 못했습니다. 데이터 원본이 일시적으로 사용할 수 없을 수 있습니다. 잠시 후 다시 시도해 주세요.",
    refreshPaused:
      "미리보기 업데이트가 잠시 중지되었습니다(새로 고침이 너무 많습니다). 편집 내용은 안전하며 곧 반영됩니다.",
    refreshFailed:
      "지금은 미리보기를 새로 고치지 못했습니다. 편집 내용은 안전하며 다음 편집 시 다시 시도합니다.",
    loadingTitle: "CV 미리보기를 생성하는 중",
    loadingBody:
      "공개 소스(OpenAlex, ORCID)에서 이 연구자의 공개 성과를 수집하여 정리하고 있습니다. 보통 몇 초 걸립니다.",
    ctaKeep: "이것은 내 기록입니다 — 로그인하여 저장 및 게시",
    editNote:
      "실시간 미리보기 — 자유롭게 정리하고 스타일을 바꿀 수 있지만 아무것도 저장되지 않습니다. 저장·게시·내보내기는 본인으로 로그인하십시오.",
    back: "SigmaCV로 돌아가기",
    bannerAutomatic:
      "자동 미리보기 — 공개 소스로 구성되었으며 SigmaCV에 게시되지도, 본인이 검토하지도 않았습니다. 동명이인의 성과가 포함될 수 있으며 인용 수치나 지수는 표시하지 않습니다.",
    bannerPublished:
      "연구자 본인이 정리 — 이 기록에는 게시된 SigmaCV 페이지가 있습니다. 연구자가 보여주기로 선택한 내용은 그 페이지에서 확인하십시오. 이 미리보기는 기계가 구성한 원본입니다.",
    ctaPublishedPage: "게시된 페이지 열기",
    promise: "연구자가 무엇을 발표했는지 조회하십시오 — 점수가 아니라.",
    objectLink: "본인 기록이 미리보기되는 것을 원하지 않으십니까? 이의 제기 방법",
    ctaCopyLink: "이 연구자를 아십니까? 링크 복사",
    copied: "링크가 복사되었습니다",
  },
  "ru-RU": {
    formPrompt: "Посмотрите, что находит SigmaCV, до входа",
    formAria: "Ваше имя или ORCID iD",
    formCta: "Показать",
    formHint: "Имя как в ваших статьях или ORCID iD — без аккаунта.",
    formInvalid: "Введите не менее трёх символов имени или ORCID iD вида 0000-0000-0000-0000.",
    formRetryPrompt: "Попробуйте снова, указав имя или ORCID iD",
    metaTitle: "Предпросмотр CV",
    builtFromPublic:
      "Этот предпросмотр собирается в реальном времени из открытых данных (OpenAlex, ORCID и другие открытые источники). Если это ваша запись, войдите, чтобы отредактировать её, выбрать стиль цитирования и сделать своей.",
    ctaSignIn: "Это моя запись — войти через ORCID",
    emptyHeading: "Публичных записей пока не найдено",
    emptyBody:
      "Мы не нашли открытой научной записи для этого ORCID iD. Если он ваш, войдите — SigmaCV всё равно поможет вам составить CV.",
    invalidHeading: "Это не похоже на ORCID iD",
    invalidBody: "ORCID iD выглядит так: 0000-0000-0000-0000. Проверьте его и попробуйте снова.",
    rateLimitedHeading: "Слишком много запросов предпросмотра",
    rateLimitedBody:
      "С вашей сети поступило много запросов предпросмотра. Пожалуйста, подождите немного и попробуйте снова.",
    errorHeading: "Что-то пошло не так",
    errorBody:
      "Сейчас не удалось создать этот предпросмотр — источник данных может быть временно недоступен. Пожалуйста, повторите попытку через минуту.",
    refreshPaused:
      "Обновление предпросмотра приостановлено на мгновение (слишком много обновлений). Ваши изменения сохранены, предпросмотр скоро обновится.",
    refreshFailed:
      "Не удалось обновить предпросмотр сейчас. Ваши изменения сохранены — повторим при следующем редактировании.",
    loadingTitle: "Формируется предпросмотр CV",
    loadingBody:
      "Собираем открытые работы этого исследователя из открытых источников (OpenAlex, ORCID) и оформляем их. Обычно это занимает несколько секунд.",
    ctaKeep: "Это моя запись — войти, чтобы сохранить и опубликовать",
    editNote:
      "Предпросмотр в реальном времени — редактируйте и меняйте стиль свободно; ничего не сохраняется. Войдите как владелец, чтобы сохранить, опубликовать или экспортировать.",
    back: "Назад в SigmaCV",
    bannerAutomatic:
      "Автоматический предпросмотр — собран из открытых источников, не опубликован и не проверен на SigmaCV. Может содержать работы однофамильцев и не показывает ни показателей цитирования, ни индексов.",
    bannerPublished:
      "Составлено самим исследователем — у этой записи есть опубликованная страница SigmaCV. То, что исследователь решил показать, смотрите на ней; этот предпросмотр — необработанная машинная сборка.",
    ctaPublishedPage: "Открыть опубликованную страницу",
    promise: "Узнайте, что опубликовал исследователь, — а не сколько у него баллов.",
    objectLink: "Не хотите, чтобы вашу запись показывали? Как возразить",
    ctaCopyLink: "Знаете этого исследователя? Скопировать ссылку",
    copied: "Ссылка скопирована",
  },
};

/** No-login preview copy for a locale (falls back to English). */
export function previewStrings(locale: string): PreviewStrings {
  return PREVIEW_I18N[asLocale(locale)];
}
