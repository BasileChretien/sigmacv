import { asLocale, type Locale } from "./index";

/**
 * Copy for frozen CV snapshots ("freeze & cite this version"): the editor's
 * Versions popover, the banner on a public frozen-version page, and the
 * "what changed" diff page. Own dictionary (typed Record<Locale,…> so a missing
 * locale is a compile error) — kept apart from `render.ts` / `workspaceUi.ts` so
 * the feature is self-contained. `{n}` / `{date}` / `{before}` / `{after}`
 * placeholders are substituted at the call site. Non-English strings are
 * machine-drafted; flag for native review.
 */
export interface SnapshotStrings {
  // ── Editor: Versions popover ──────────────────────────────────────────────
  /** Top-bar trigger label. */
  tbVersions: string;
  panelIntro: string;
  labelPlaceholder: string;
  createButton: string;
  creating: string;
  /** {n} = the per-CV cap. */
  limitReached: string;
  empty: string;
  /** Row version tag; {n} = version number. */
  versionTag: string;
  publicToggle: string;
  publicHint: string;
  notPublishedHint: string;
  copyLink: string;
  linkCopied: string;
  openLink: string;
  compareLive: string;
  mintDoi: string;
  minting: string;
  mintDisabledHint: string;
  mintNeedsPublic: string;
  doiFailed: string;
  delete: string;
  confirmDelete: string;
  loadFailed: string;
  actionFailed: string;
  // ── Public frozen-version page banner ─────────────────────────────────────
  /** {n} = version, {date} = frozen date. */
  bannerFrozen: string;
  bannerLive: string;
  bannerCompare: string;
  // ── Freeze as reader view (assessment-grade freeze) ───────────────────────
  /** Hint for the reader-view preset / tooltip on the row tag. */
  readerOptionHint: string;
  /** Row tag on a version frozen as the reader view. */
  readerTag: string;
  // ── Freeze in this shape (model + preset) ─────────────────────────────────
  shapeLabel: string;
  shapeCurrent: string;
  shapeHint: string;
  presetLabel: string;
  presetStandard: string;
  presetReader: string;
  presetHiring: string;
  hiringHint: string;
  // ── Stateless freeze request banner (/cv?freeze=…) ────────────────────────
  requestTitle: string;
  /** {shape} = model name or requestNoModel; {preset} = the preset label. */
  requestBody: string;
  /** {date} = requested-by date. */
  requestBy: string;
  requestNoModel: string;
  requestNothingSent: string;
  requestDefaultLabel: string;
  /** Lead-in before the label the link suggests (rendered as a quotation). */
  requestLabel: string;
  requestFreeze: string;
  requestDismiss: string;
  /** {n} = the new version number. */
  requestDone: string;
  // ── Diff page ─────────────────────────────────────────────────────────────
  /** Page title; {n} = version. */
  diffTitle: string;
  /** {n} = version, {date} = frozen date. */
  diffIntro: string;
  diffNoChanges: string;
  diffAdded: string;
  diffRemoved: string;
  diffHidden: string;
  diffUnhidden: string;
  diffSectionsAdded: string;
  diffSectionsRemoved: string;
  diffDisplay: string;
  diffOwner: string;
  diffNarrative: string;
  /** {before} / {after} = word counts. */
  diffWords: string;
  diffMetrics: string;
  diffFrozenLink: string;
}

const SNAPSHOT_I18N: Record<Locale, SnapshotStrings> = {
  "en-US": {
    tbVersions: "Versions",
    panelIntro:
      "Freeze the CV exactly as it is now. A frozen version never changes, so a committee can read it, and you can later see what changed since.",
    labelPlaceholder: "Label (e.g. Tenure review 2026)",
    createButton: "Freeze this version",
    creating: "Freezing…",
    limitReached: "You have reached the limit of {n} versions. Delete one to freeze another.",
    empty: "No frozen versions yet.",
    versionTag: "v{n}",
    publicToggle: "Public link",
    publicHint:
      "A public version gets an unguessable link and is reachable only while your live page is published.",
    notPublishedHint: "Publish your live page to share frozen versions.",
    copyLink: "Copy link",
    linkCopied: "Link copied.",
    openLink: "Open",
    compareLive: "Compare with live",
    mintDoi: "Mint DOI",
    minting: "Minting…",
    mintDisabledHint: "DOI minting is not configured on this server.",
    mintNeedsPublic: "Make the version public first to mint a DOI.",
    doiFailed: "DOI minting failed. You can try again.",
    delete: "Delete",
    confirmDelete: "Confirm delete",
    loadFailed: "Could not load versions.",
    actionFailed: "Something went wrong. Please try again.",
    bannerFrozen: "Frozen version {n} · {date}",
    bannerLive: "Live version",
    bannerCompare: "What changed since",
    readerOptionHint:
      "The frozen page shows the provenance, verification and context marks an assessor needs, keeps retracted works visible, and has no standard view. Chosen now, fixed for this version.",
    readerTag: "Reader view",
    shapeLabel: "Shape",
    shapeCurrent: "Current layout",
    shapeHint:
      "Apply one of the CV models to this frozen version only — your live CV is not changed.",
    presetLabel: "Freeze as",
    presetStandard: "Standard page",
    presetReader: "Reader view (for assessors)",
    presetHiring: "Hiring panel",
    hiringHint:
      "Shows your contact details (email, phone, location) on this frozen page — even the ones you hid on your public page; only fields you have entered appear — and hides the academic evidence marks and metrics. The reader view is closed on this version. Chosen now, fixed for this version.",
    requestTitle: "A link asked for a frozen version of your CV",
    requestBody: "It asks for the shape “{shape}”, frozen as: {preset}.",
    requestBy: "Requested for {date}.",
    requestNoModel: "your current layout",
    requestNothingSent:
      "Nothing has been sent to whoever made the link — you decide whether to freeze, and you send the frozen link yourself.",
    requestDefaultLabel: "Requested version",
    requestLabel: "Suggested label:",
    requestFreeze: "Freeze this version",
    requestDismiss: "Not now",
    requestDone: "Frozen as version {n}.",
    diffTitle: "Changes since version {n}",
    diffIntro: "Comparing frozen version {n} ({date}) with the current live CV.",
    diffNoChanges: "No changes.",
    diffAdded: "Added",
    diffRemoved: "Removed",
    diffHidden: "Hidden",
    diffUnhidden: "Shown again",
    diffSectionsAdded: "Sections added",
    diffSectionsRemoved: "Sections removed",
    diffDisplay: "Display settings changed",
    diffOwner: "Profile fields changed",
    diffNarrative: "Narrative text changed",
    diffWords: "{before} → {after} words",
    diffMetrics: "Metrics changed",
    diffFrozenLink: "Frozen version",
  },
  "zh-CN": {
    tbVersions: "版本",
    panelIntro:
      "将简历按当前状态冻结。冻结版本永不改变，评审委员会可以阅读它，您之后也能查看自那时以来的变化。",
    labelPlaceholder: "标签（例如：2026 年终身教职评审）",
    createButton: "冻结此版本",
    creating: "正在冻结…",
    limitReached: "已达到 {n} 个版本的上限。请删除一个后再冻结新版本。",
    empty: "尚无冻结版本。",
    versionTag: "v{n}",
    publicToggle: "公开链接",
    publicHint: "公开版本会获得一个无法猜测的链接，且仅在您的实时页面已发布时可访问。",
    notPublishedHint: "发布您的实时页面后即可分享冻结版本。",
    copyLink: "复制链接",
    linkCopied: "链接已复制。",
    openLink: "打开",
    compareLive: "与实时版本比较",
    mintDoi: "注册 DOI",
    minting: "正在注册…",
    mintDisabledHint: "此服务器未配置 DOI 注册。",
    mintNeedsPublic: "请先将该版本设为公开，再注册 DOI。",
    doiFailed: "DOI 注册失败。您可以重试。",
    delete: "删除",
    confirmDelete: "确认删除",
    loadFailed: "无法加载版本。",
    actionFailed: "出了点问题，请重试。",
    bannerFrozen: "冻结版本 {n} · {date}",
    bannerLive: "实时版本",
    bannerCompare: "自那时以来的变化",
    readerOptionHint:
      "冻结页面会显示评估者所需的来源、核验与背景标记，让已撤稿作品保持可见，且没有标准视图。现在选择，此版本固定不变。",
    readerTag: "审阅视图",
    shapeLabel: "形态",
    shapeCurrent: "当前布局",
    shapeHint: "仅对此冻结版本应用某个简历模型，不会更改您的实时简历。",
    presetLabel: "冻结为",
    presetStandard: "标准页面",
    presetReader: "审阅视图（供评估者）",
    presetHiring: "招聘小组",
    hiringHint:
      "在此冻结页面上显示您的联系方式（邮箱、电话、所在地）——包括您在公开页面上隐藏的项目；仅显示您已填写的字段——并隐藏学术证据标记和指标。此版本不提供审阅视图。现在选择，此版本固定不变。",
    requestTitle: "有链接请求冻结您的简历版本",
    requestBody: "它请求的形态是“{shape}”，冻结为：{preset}。",
    requestBy: "请求截止 {date}。",
    requestNoModel: "您当前的布局",
    requestNothingSent:
      "没有任何内容发送给链接的制作者——是否冻结由您决定，冻结后的链接也由您自己发送。",
    requestDefaultLabel: "应请求的版本",
    requestLabel: "建议的标签：",
    requestFreeze: "冻结此版本",
    requestDismiss: "暂不",
    requestDone: "已冻结为版本 {n}。",
    diffTitle: "自版本 {n} 以来的变化",
    diffIntro: "正在将冻结版本 {n}（{date}）与当前实时简历进行比较。",
    diffNoChanges: "没有变化。",
    diffAdded: "新增",
    diffRemoved: "移除",
    diffHidden: "已隐藏",
    diffUnhidden: "重新显示",
    diffSectionsAdded: "新增的部分",
    diffSectionsRemoved: "移除的部分",
    diffDisplay: "显示设置已更改",
    diffOwner: "个人资料字段已更改",
    diffNarrative: "叙述文本已更改",
    diffWords: "{before} → {after} 词",
    diffMetrics: "指标已更改",
    diffFrozenLink: "冻结版本",
  },
  "es-ES": {
    tbVersions: "Versiones",
    panelIntro:
      "Congele el CV tal y como está ahora. Una versión congelada nunca cambia: un comité puede leerla y usted podrá ver más tarde qué ha cambiado desde entonces.",
    labelPlaceholder: "Etiqueta (p. ej., Evaluación de plaza 2026)",
    createButton: "Congelar esta versión",
    creating: "Congelando…",
    limitReached: "Ha alcanzado el límite de {n} versiones. Elimine una para congelar otra.",
    empty: "Todavía no hay versiones congeladas.",
    versionTag: "v{n}",
    publicToggle: "Enlace público",
    publicHint:
      "Una versión pública recibe un enlace imposible de adivinar y solo es accesible mientras su página en vivo esté publicada.",
    notPublishedHint: "Publique su página en vivo para compartir versiones congeladas.",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado.",
    openLink: "Abrir",
    compareLive: "Comparar con la versión en vivo",
    mintDoi: "Registrar DOI",
    minting: "Registrando…",
    mintDisabledHint: "El registro de DOI no está configurado en este servidor.",
    mintNeedsPublic: "Haga pública la versión antes de registrar un DOI.",
    doiFailed: "El registro del DOI ha fallado. Puede intentarlo de nuevo.",
    delete: "Eliminar",
    confirmDelete: "Confirmar eliminación",
    loadFailed: "No se pudieron cargar las versiones.",
    actionFailed: "Algo ha fallado. Inténtelo de nuevo.",
    bannerFrozen: "Versión congelada {n} · {date}",
    bannerLive: "Versión en vivo",
    bannerCompare: "Qué ha cambiado desde entonces",
    readerOptionHint:
      "La página congelada muestra las marcas de procedencia, verificación y contexto que necesita un evaluador, mantiene visibles los trabajos retractados y no tiene vista estándar. Se elige ahora y queda fija para esta versión.",
    readerTag: "Vista para evaluadores",
    shapeLabel: "Formato",
    shapeCurrent: "Diseño actual",
    shapeHint:
      "Aplica uno de los modelos de CV solo a esta versión congelada; tu CV en vivo no cambia.",
    presetLabel: "Congelar como",
    presetStandard: "Página estándar",
    presetReader: "Vista para evaluadores",
    presetHiring: "Comité de selección",
    hiringHint:
      "Muestra tus datos de contacto (correo, teléfono, ubicación) en esta página congelada —incluso los que ocultaste en tu página pública; solo aparecen los campos que has rellenado— y oculta las marcas de evidencia académica y las métricas. La vista para evaluadores queda cerrada en esta versión. Se elige ahora y queda fijo para esta versión.",
    requestTitle: "Un enlace ha pedido una versión congelada de tu CV",
    requestBody: "Pide el formato «{shape}», congelado como: {preset}.",
    requestBy: "Solicitado para el {date}.",
    requestNoModel: "tu diseño actual",
    requestNothingSent:
      "No se ha enviado nada a quien creó el enlace: tú decides si congelar, y el enlace congelado lo envías tú.",
    requestDefaultLabel: "Versión solicitada",
    requestLabel: "Etiqueta sugerida:",
    requestFreeze: "Congelar esta versión",
    requestDismiss: "Ahora no",
    requestDone: "Congelada como versión {n}.",
    diffTitle: "Cambios desde la versión {n}",
    diffIntro: "Comparación de la versión congelada {n} ({date}) con el CV en vivo actual.",
    diffNoChanges: "Sin cambios.",
    diffAdded: "Añadido",
    diffRemoved: "Eliminado",
    diffHidden: "Oculto",
    diffUnhidden: "Vuelto a mostrar",
    diffSectionsAdded: "Secciones añadidas",
    diffSectionsRemoved: "Secciones eliminadas",
    diffDisplay: "Ajustes de presentación modificados",
    diffOwner: "Campos del perfil modificados",
    diffNarrative: "Texto narrativo modificado",
    diffWords: "{before} → {after} palabras",
    diffMetrics: "Métricas modificadas",
    diffFrozenLink: "Versión congelada",
  },
  "fr-FR": {
    tbVersions: "Versions",
    panelIntro:
      "Figez le CV tel qu'il est maintenant. Une version figée ne change jamais : un comité peut la lire, et vous pourrez voir plus tard ce qui a changé depuis.",
    labelPlaceholder: "Libellé (p. ex. Évaluation 2026)",
    createButton: "Figer cette version",
    creating: "Figement…",
    limitReached:
      "Vous avez atteint la limite de {n} versions. Supprimez-en une pour en figer une autre.",
    empty: "Aucune version figée pour l'instant.",
    versionTag: "v{n}",
    publicToggle: "Lien public",
    publicHint:
      "Une version publique reçoit un lien impossible à deviner et n'est accessible que tant que votre page en direct est publiée.",
    notPublishedHint: "Publiez votre page en direct pour partager des versions figées.",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié.",
    openLink: "Ouvrir",
    compareLive: "Comparer avec la version en direct",
    mintDoi: "Attribuer un DOI",
    minting: "Attribution…",
    mintDisabledHint: "L'attribution de DOI n'est pas configurée sur ce serveur.",
    mintNeedsPublic: "Rendez d'abord la version publique pour attribuer un DOI.",
    doiFailed: "L'attribution du DOI a échoué. Vous pouvez réessayer.",
    delete: "Supprimer",
    confirmDelete: "Confirmer la suppression",
    loadFailed: "Impossible de charger les versions.",
    actionFailed: "Une erreur est survenue. Veuillez réessayer.",
    bannerFrozen: "Version figée {n} · {date}",
    bannerLive: "Version en direct",
    bannerCompare: "Ce qui a changé depuis",
    readerOptionHint:
      "La page figée affiche les repères de provenance, de vérification et de contexte dont un évaluateur a besoin, garde visibles les travaux rétractés et n’a pas de vue standard. Choisi maintenant, fixé pour cette version.",
    readerTag: "Vue évaluateur",
    shapeLabel: "Format",
    shapeCurrent: "Mise en page actuelle",
    shapeHint:
      "Applique un modèle de CV à cette seule version figée ; votre CV en direct n’est pas modifié.",
    presetLabel: "Figer en",
    presetStandard: "Page standard",
    presetReader: "Vue évaluateur",
    presetHiring: "Jury de recrutement",
    hiringHint:
      "Affiche vos coordonnées (e-mail, téléphone, localisation) sur cette page figée — même celles que vous avez masquées sur votre page publique ; seuls les champs renseignés apparaissent — et masque les repères de preuve académique et les indicateurs. La vue évaluateur est fermée sur cette version. Choisi maintenant, fixé pour cette version.",
    requestTitle: "Un lien demande une version figée de votre CV",
    requestBody: "Il demande le format « {shape} », figé en : {preset}.",
    requestBy: "Demandé pour le {date}.",
    requestNoModel: "votre mise en page actuelle",
    requestNothingSent:
      "Rien n’a été envoyé à l’auteur du lien : vous décidez de figer ou non, et c’est vous qui envoyez le lien figé.",
    requestDefaultLabel: "Version demandée",
    requestLabel: "Libellé suggéré :",
    requestFreeze: "Figer cette version",
    requestDismiss: "Pas maintenant",
    requestDone: "Figée en version {n}.",
    diffTitle: "Changements depuis la version {n}",
    diffIntro: "Comparaison de la version figée {n} ({date}) avec le CV en direct actuel.",
    diffNoChanges: "Aucun changement.",
    diffAdded: "Ajouté",
    diffRemoved: "Retiré",
    diffHidden: "Masqué",
    diffUnhidden: "Réaffiché",
    diffSectionsAdded: "Sections ajoutées",
    diffSectionsRemoved: "Sections retirées",
    diffDisplay: "Réglages d'affichage modifiés",
    diffOwner: "Champs du profil modifiés",
    diffNarrative: "Texte narratif modifié",
    diffWords: "{before} → {after} mots",
    diffMetrics: "Indicateurs modifiés",
    diffFrozenLink: "Version figée",
  },
  "de-DE": {
    tbVersions: "Versionen",
    panelIntro:
      "Frieren Sie den CV so ein, wie er jetzt ist. Eine eingefrorene Version ändert sich nie: Ein Gremium kann sie lesen, und Sie sehen später, was sich seitdem geändert hat.",
    labelPlaceholder: "Bezeichnung (z. B. Berufungsverfahren 2026)",
    createButton: "Diese Version einfrieren",
    creating: "Wird eingefroren…",
    limitReached:
      "Sie haben das Limit von {n} Versionen erreicht. Löschen Sie eine, um eine weitere einzufrieren.",
    empty: "Noch keine eingefrorenen Versionen.",
    versionTag: "v{n}",
    publicToggle: "Öffentlicher Link",
    publicHint:
      "Eine öffentliche Version erhält einen nicht erratbaren Link und ist nur erreichbar, solange Ihre Live-Seite veröffentlicht ist.",
    notPublishedHint: "Veröffentlichen Sie Ihre Live-Seite, um eingefrorene Versionen zu teilen.",
    copyLink: "Link kopieren",
    linkCopied: "Link kopiert.",
    openLink: "Öffnen",
    compareLive: "Mit Live-Version vergleichen",
    mintDoi: "DOI vergeben",
    minting: "Wird vergeben…",
    mintDisabledHint: "Die DOI-Vergabe ist auf diesem Server nicht konfiguriert.",
    mintNeedsPublic: "Machen Sie die Version zuerst öffentlich, um einen DOI zu vergeben.",
    doiFailed: "Die DOI-Vergabe ist fehlgeschlagen. Sie können es erneut versuchen.",
    delete: "Löschen",
    confirmDelete: "Löschen bestätigen",
    loadFailed: "Versionen konnten nicht geladen werden.",
    actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    bannerFrozen: "Eingefrorene Version {n} · {date}",
    bannerLive: "Live-Version",
    bannerCompare: "Was sich seitdem geändert hat",
    readerOptionHint:
      "Die eingefrorene Seite zeigt die Herkunfts-, Prüf- und Kontextmarkierungen, die Gutachtende brauchen, zeigt zurückgezogene Arbeiten weiterhin an und hat keine Standardansicht. Die Wahl gilt dauerhaft für diese Version.",
    readerTag: "Gutachteransicht",
    shapeLabel: "Format",
    shapeCurrent: "Aktuelles Layout",
    shapeHint:
      "Wendet ein CV-Modell nur auf diese eingefrorene Version an; Ihr Live-CV bleibt unverändert.",
    presetLabel: "Einfrieren als",
    presetStandard: "Standardseite",
    presetReader: "Gutachteransicht",
    presetHiring: "Auswahlkommission",
    hiringHint:
      "Zeigt Ihre Kontaktdaten (E-Mail, Telefon, Ort) auf dieser eingefrorenen Seite – auch die, die Sie auf Ihrer öffentlichen Seite ausgeblendet haben; nur ausgefüllte Felder erscheinen – und blendet die akademischen Nachweismarkierungen und Kennzahlen aus. Die Gutachteransicht ist für diese Version geschlossen. Jetzt gewählt, für diese Version fest.",
    requestTitle: "Ein Link hat eine eingefrorene Version Ihres CV angefragt",
    requestBody: "Er fragt nach dem Format „{shape}“, eingefroren als: {preset}.",
    requestBy: "Erbeten bis {date}.",
    requestNoModel: "Ihr aktuelles Layout",
    requestNothingSent:
      "An den Ersteller des Links wurde nichts gesendet: Sie entscheiden, ob Sie einfrieren, und Sie versenden den eingefrorenen Link selbst.",
    requestDefaultLabel: "Angefragte Version",
    requestLabel: "Vorgeschlagene Bezeichnung:",
    requestFreeze: "Diese Version einfrieren",
    requestDismiss: "Nicht jetzt",
    requestDone: "Als Version {n} eingefroren.",
    diffTitle: "Änderungen seit Version {n}",
    diffIntro: "Vergleich der eingefrorenen Version {n} ({date}) mit dem aktuellen Live-CV.",
    diffNoChanges: "Keine Änderungen.",
    diffAdded: "Hinzugefügt",
    diffRemoved: "Entfernt",
    diffHidden: "Ausgeblendet",
    diffUnhidden: "Wieder eingeblendet",
    diffSectionsAdded: "Abschnitte hinzugefügt",
    diffSectionsRemoved: "Abschnitte entfernt",
    diffDisplay: "Anzeigeeinstellungen geändert",
    diffOwner: "Profilfelder geändert",
    diffNarrative: "Narrativer Text geändert",
    diffWords: "{before} → {after} Wörter",
    diffMetrics: "Metriken geändert",
    diffFrozenLink: "Eingefrorene Version",
  },
  "ja-JP": {
    tbVersions: "バージョン",
    panelIntro:
      "現在の状態のまま CV を固定します。固定版は決して変わらないため、審査委員会がそのまま閲覧でき、後からその時点以降の変更を確認できます。",
    labelPlaceholder: "ラベル（例：2026 年昇進審査）",
    createButton: "このバージョンを固定",
    creating: "固定中…",
    limitReached:
      "バージョン数の上限（{n} 件）に達しました。新たに固定するには 1 件削除してください。",
    empty: "固定版はまだありません。",
    versionTag: "v{n}",
    publicToggle: "公開リンク",
    publicHint:
      "公開版には推測不可能なリンクが付与され、ライブページが公開されている間のみアクセスできます。",
    notPublishedHint: "固定版を共有するには、ライブページを公開してください。",
    copyLink: "リンクをコピー",
    linkCopied: "リンクをコピーしました。",
    openLink: "開く",
    compareLive: "ライブ版と比較",
    mintDoi: "DOI を発行",
    minting: "発行中…",
    mintDisabledHint: "このサーバーでは DOI の発行が設定されていません。",
    mintNeedsPublic: "DOI を発行するには、まずこのバージョンを公開してください。",
    doiFailed: "DOI の発行に失敗しました。再試行できます。",
    delete: "削除",
    confirmDelete: "削除を確定",
    loadFailed: "バージョンを読み込めませんでした。",
    actionFailed: "問題が発生しました。もう一度お試しください。",
    bannerFrozen: "固定版 {n} · {date}",
    bannerLive: "ライブ版",
    bannerCompare: "その後の変更",
    readerOptionHint:
      "固定したページには、審査者に必要な出所・検証・背景の表示が含まれ、撤回された論文も表示されたままになり、標準ビューはありません。今選ぶと、このバージョンでは変更できません。",
    readerTag: "審査者ビュー",
    shapeLabel: "形式",
    shapeCurrent: "現在のレイアウト",
    shapeHint: "この固定バージョンにのみ CV モデルを適用します。公開中の CV は変更されません。",
    presetLabel: "固定の種類",
    presetStandard: "標準ページ",
    presetReader: "審査者ビュー",
    presetHiring: "採用委員会向け",
    hiringHint:
      "この固定ページに連絡先（メール、電話、所在地）を表示します。公開ページで非表示にしたものも含まれますが、入力済みの項目のみ表示されます。学術的な根拠表示と指標は非表示になり、このバージョンでは審査者ビューは使えません。今選ぶと、このバージョンでは変更できません。",
    requestTitle: "リンクから CV の固定バージョンが求められています",
    requestBody: "求められている形式は「{shape}」、固定の種類は「{preset}」です。",
    requestBy: "期限：{date}。",
    requestNoModel: "現在のレイアウト",
    requestNothingSent:
      "リンクの作成者には何も送信されていません。固定するかどうかはあなたが決め、固定リンクもあなた自身が送ります。",
    requestDefaultLabel: "依頼されたバージョン",
    requestLabel: "提案されたラベル：",
    requestFreeze: "このバージョンを固定",
    requestDismiss: "今はしない",
    requestDone: "バージョン {n} として固定しました。",
    diffTitle: "バージョン {n} 以降の変更",
    diffIntro: "固定版 {n}（{date}）と現在のライブ CV を比較しています。",
    diffNoChanges: "変更はありません。",
    diffAdded: "追加",
    diffRemoved: "削除",
    diffHidden: "非表示",
    diffUnhidden: "再表示",
    diffSectionsAdded: "追加されたセクション",
    diffSectionsRemoved: "削除されたセクション",
    diffDisplay: "表示設定の変更",
    diffOwner: "プロフィール項目の変更",
    diffNarrative: "ナラティブ本文の変更",
    diffWords: "{before} → {after} 語",
    diffMetrics: "指標の変更",
    diffFrozenLink: "固定版",
  },
  "pt-BR": {
    tbVersions: "Versões",
    panelIntro:
      "Congele o CV exatamente como está agora. Uma versão congelada nunca muda: uma comissão pode lê-la, e você poderá ver depois o que mudou desde então.",
    labelPlaceholder: "Rótulo (ex.: Avaliação de progressão 2026)",
    createButton: "Congelar esta versão",
    creating: "Congelando…",
    limitReached: "Você atingiu o limite de {n} versões. Exclua uma para congelar outra.",
    empty: "Ainda não há versões congeladas.",
    versionTag: "v{n}",
    publicToggle: "Link público",
    publicHint:
      "Uma versão pública recebe um link impossível de adivinhar e só fica acessível enquanto sua página ao vivo estiver publicada.",
    notPublishedHint: "Publique sua página ao vivo para compartilhar versões congeladas.",
    copyLink: "Copiar link",
    linkCopied: "Link copiado.",
    openLink: "Abrir",
    compareLive: "Comparar com a versão ao vivo",
    mintDoi: "Registrar DOI",
    minting: "Registrando…",
    mintDisabledHint: "O registro de DOI não está configurado neste servidor.",
    mintNeedsPublic: "Torne a versão pública antes de registrar um DOI.",
    doiFailed: "O registro do DOI falhou. Você pode tentar novamente.",
    delete: "Excluir",
    confirmDelete: "Confirmar exclusão",
    loadFailed: "Não foi possível carregar as versões.",
    actionFailed: "Algo deu errado. Tente novamente.",
    bannerFrozen: "Versão congelada {n} · {date}",
    bannerLive: "Versão ao vivo",
    bannerCompare: "O que mudou desde então",
    readerOptionHint:
      "A página congelada mostra as marcas de proveniência, verificação e contexto de que um avaliador precisa, mantém visíveis os trabalhos retratados e não tem visão padrão. Escolhido agora, fixo para esta versão.",
    readerTag: "Visão para avaliadores",
    shapeLabel: "Formato",
    shapeCurrent: "Layout atual",
    shapeHint:
      "Aplica um dos modelos de CV apenas a esta versão congelada; seu CV ao vivo não muda.",
    presetLabel: "Congelar como",
    presetStandard: "Página padrão",
    presetReader: "Visão para avaliadores",
    presetHiring: "Banca de seleção",
    hiringHint:
      "Mostra seus dados de contato (e-mail, telefone, localização) nesta página congelada — mesmo os que você ocultou na sua página pública; só aparecem os campos preenchidos — e oculta as marcas de evidência acadêmica e as métricas. A visão para avaliadores fica fechada nesta versão. Escolhido agora, fixo para esta versão.",
    requestTitle: "Um link pediu uma versão congelada do seu CV",
    requestBody: "Ele pede o formato “{shape}”, congelado como: {preset}.",
    requestBy: "Solicitado até {date}.",
    requestNoModel: "seu layout atual",
    requestNothingSent:
      "Nada foi enviado a quem criou o link: você decide se congela, e é você quem envia o link congelado.",
    requestDefaultLabel: "Versão solicitada",
    requestLabel: "Rótulo sugerido:",
    requestFreeze: "Congelar esta versão",
    requestDismiss: "Agora não",
    requestDone: "Congelada como versão {n}.",
    diffTitle: "Mudanças desde a versão {n}",
    diffIntro: "Comparando a versão congelada {n} ({date}) com o CV ao vivo atual.",
    diffNoChanges: "Sem mudanças.",
    diffAdded: "Adicionado",
    diffRemoved: "Removido",
    diffHidden: "Ocultado",
    diffUnhidden: "Exibido novamente",
    diffSectionsAdded: "Seções adicionadas",
    diffSectionsRemoved: "Seções removidas",
    diffDisplay: "Configurações de exibição alteradas",
    diffOwner: "Campos do perfil alterados",
    diffNarrative: "Texto narrativo alterado",
    diffWords: "{before} → {after} palavras",
    diffMetrics: "Métricas alteradas",
    diffFrozenLink: "Versão congelada",
  },
  "it-IT": {
    tbVersions: "Versioni",
    panelIntro:
      "Congela il CV esattamente com'è adesso. Una versione congelata non cambia mai: una commissione può leggerla e in seguito potrai vedere cosa è cambiato da allora.",
    labelPlaceholder: "Etichetta (es. Valutazione 2026)",
    createButton: "Congela questa versione",
    creating: "Congelamento…",
    limitReached: "Hai raggiunto il limite di {n} versioni. Eliminane una per congelarne un'altra.",
    empty: "Nessuna versione congelata per ora.",
    versionTag: "v{n}",
    publicToggle: "Link pubblico",
    publicHint:
      "Una versione pubblica riceve un link impossibile da indovinare ed è raggiungibile solo finché la tua pagina live è pubblicata.",
    notPublishedHint: "Pubblica la tua pagina live per condividere le versioni congelate.",
    copyLink: "Copia link",
    linkCopied: "Link copiato.",
    openLink: "Apri",
    compareLive: "Confronta con la versione live",
    mintDoi: "Assegna DOI",
    minting: "Assegnazione…",
    mintDisabledHint: "L'assegnazione di DOI non è configurata su questo server.",
    mintNeedsPublic: "Rendi prima pubblica la versione per assegnare un DOI.",
    doiFailed: "L'assegnazione del DOI non è riuscita. Puoi riprovare.",
    delete: "Elimina",
    confirmDelete: "Conferma eliminazione",
    loadFailed: "Impossibile caricare le versioni.",
    actionFailed: "Qualcosa è andato storto. Riprova.",
    bannerFrozen: "Versione congelata {n} · {date}",
    bannerLive: "Versione live",
    bannerCompare: "Cosa è cambiato da allora",
    readerOptionHint:
      "La pagina congelata mostra i contrassegni di provenienza, verifica e contesto di cui ha bisogno un valutatore, mantiene visibili i lavori ritrattati e non ha una vista standard. Scelto ora, fisso per questa versione.",
    readerTag: "Vista per valutatori",
    shapeLabel: "Formato",
    shapeCurrent: "Layout attuale",
    shapeHint:
      "Applica uno dei modelli di CV solo a questa versione congelata; il tuo CV live non cambia.",
    presetLabel: "Congela come",
    presetStandard: "Pagina standard",
    presetReader: "Vista per valutatori",
    presetHiring: "Commissione di selezione",
    hiringHint:
      "Mostra i tuoi contatti (e-mail, telefono, località) su questa pagina congelata — anche quelli nascosti sulla tua pagina pubblica; compaiono solo i campi compilati — e nasconde i contrassegni di evidenza accademica e le metriche. La vista per valutatori è chiusa su questa versione. Scelto ora, fisso per questa versione.",
    requestTitle: "Un link ha chiesto una versione congelata del tuo CV",
    requestBody: "Chiede il formato «{shape}», congelato come: {preset}.",
    requestBy: "Richiesto entro il {date}.",
    requestNoModel: "il tuo layout attuale",
    requestNothingSent:
      "Nulla è stato inviato a chi ha creato il link: decidi tu se congelare, e sei tu a inviare il link congelato.",
    requestDefaultLabel: "Versione richiesta",
    requestLabel: "Etichetta suggerita:",
    requestFreeze: "Congela questa versione",
    requestDismiss: "Non ora",
    requestDone: "Congelata come versione {n}.",
    diffTitle: "Modifiche dalla versione {n}",
    diffIntro: "Confronto tra la versione congelata {n} ({date}) e il CV live attuale.",
    diffNoChanges: "Nessuna modifica.",
    diffAdded: "Aggiunto",
    diffRemoved: "Rimosso",
    diffHidden: "Nascosto",
    diffUnhidden: "Mostrato di nuovo",
    diffSectionsAdded: "Sezioni aggiunte",
    diffSectionsRemoved: "Sezioni rimosse",
    diffDisplay: "Impostazioni di visualizzazione modificate",
    diffOwner: "Campi del profilo modificati",
    diffNarrative: "Testo narrativo modificato",
    diffWords: "{before} → {after} parole",
    diffMetrics: "Metriche modificate",
    diffFrozenLink: "Versione congelata",
  },
  "ko-KR": {
    tbVersions: "버전",
    panelIntro:
      "현재 상태 그대로 CV를 고정합니다. 고정된 버전은 절대 바뀌지 않으므로 심사위원회가 그대로 읽을 수 있고, 이후 그 시점부터 무엇이 바뀌었는지 확인할 수 있습니다.",
    labelPlaceholder: "라벨 (예: 2026년 승진 심사)",
    createButton: "이 버전 고정",
    creating: "고정 중…",
    limitReached: "버전 한도({n}개)에 도달했습니다. 새로 고정하려면 하나를 삭제하세요.",
    empty: "아직 고정된 버전이 없습니다.",
    versionTag: "v{n}",
    publicToggle: "공개 링크",
    publicHint:
      "공개 버전에는 추측할 수 없는 링크가 부여되며, 라이브 페이지가 게시된 동안에만 접근할 수 있습니다.",
    notPublishedHint: "고정된 버전을 공유하려면 라이브 페이지를 게시하세요.",
    copyLink: "링크 복사",
    linkCopied: "링크가 복사되었습니다.",
    openLink: "열기",
    compareLive: "라이브 버전과 비교",
    mintDoi: "DOI 발급",
    minting: "발급 중…",
    mintDisabledHint: "이 서버에는 DOI 발급이 설정되어 있지 않습니다.",
    mintNeedsPublic: "DOI를 발급하려면 먼저 버전을 공개로 설정하세요.",
    doiFailed: "DOI 발급에 실패했습니다. 다시 시도할 수 있습니다.",
    delete: "삭제",
    confirmDelete: "삭제 확인",
    loadFailed: "버전을 불러올 수 없습니다.",
    actionFailed: "문제가 발생했습니다. 다시 시도하세요.",
    bannerFrozen: "고정 버전 {n} · {date}",
    bannerLive: "라이브 버전",
    bannerCompare: "이후 변경 사항",
    readerOptionHint:
      "고정된 페이지에는 심사자에게 필요한 출처·검증·맥락 표시가 포함되고 철회된 논문도 계속 표시되며 표준 보기는 없습니다. 지금 선택하면 이 버전에서는 변경되지 않습니다.",
    readerTag: "심사자 보기",
    shapeLabel: "형식",
    shapeCurrent: "현재 레이아웃",
    shapeHint: "이 고정 버전에만 CV 모델을 적용합니다. 공개 중인 CV는 변경되지 않습니다.",
    presetLabel: "고정 유형",
    presetStandard: "표준 페이지",
    presetReader: "심사자 보기",
    presetHiring: "채용 위원회용",
    hiringHint:
      "이 고정 페이지에 연락처(이메일, 전화, 위치)를 표시합니다. 공개 페이지에서 숨긴 항목도 포함되며, 입력한 항목만 표시됩니다. 학술 근거 표시와 지표는 숨겨지고, 이 버전에서는 심사자 보기를 사용할 수 없습니다. 지금 선택하면 이 버전에서는 변경되지 않습니다.",
    requestTitle: "링크에서 CV 고정 버전을 요청했습니다",
    requestBody: "요청된 형식은 “{shape}”, 고정 유형은 {preset}입니다.",
    requestBy: "요청 기한: {date}.",
    requestNoModel: "현재 레이아웃",
    requestNothingSent:
      "링크를 만든 사람에게는 아무것도 전송되지 않았습니다. 고정 여부는 본인이 결정하고, 고정된 링크도 본인이 직접 보냅니다.",
    requestDefaultLabel: "요청된 버전",
    requestLabel: "제안된 라벨:",
    requestFreeze: "이 버전 고정",
    requestDismiss: "나중에",
    requestDone: "버전 {n}(으)로 고정되었습니다.",
    diffTitle: "버전 {n} 이후의 변경 사항",
    diffIntro: "고정 버전 {n}({date})과 현재 라이브 CV를 비교합니다.",
    diffNoChanges: "변경 사항이 없습니다.",
    diffAdded: "추가됨",
    diffRemoved: "제거됨",
    diffHidden: "숨김",
    diffUnhidden: "다시 표시됨",
    diffSectionsAdded: "추가된 섹션",
    diffSectionsRemoved: "제거된 섹션",
    diffDisplay: "표시 설정 변경됨",
    diffOwner: "프로필 항목 변경됨",
    diffNarrative: "서술 본문 변경됨",
    diffWords: "{before} → {after} 단어",
    diffMetrics: "지표 변경됨",
    diffFrozenLink: "고정 버전",
  },
  "ru-RU": {
    tbVersions: "Версии",
    panelIntro:
      "Зафиксируйте CV в его нынешнем виде. Зафиксированная версия никогда не меняется: комиссия может её прочитать, а вы позже увидите, что изменилось с тех пор.",
    labelPlaceholder: "Метка (например, Аттестация 2026)",
    createButton: "Зафиксировать эту версию",
    creating: "Фиксация…",
    limitReached: "Достигнут предел в {n} версий. Удалите одну, чтобы зафиксировать другую.",
    empty: "Зафиксированных версий пока нет.",
    versionTag: "v{n}",
    publicToggle: "Публичная ссылка",
    publicHint:
      "Публичная версия получает ссылку, которую невозможно угадать, и доступна только пока опубликована ваша живая страница.",
    notPublishedHint: "Опубликуйте живую страницу, чтобы делиться зафиксированными версиями.",
    copyLink: "Копировать ссылку",
    linkCopied: "Ссылка скопирована.",
    openLink: "Открыть",
    compareLive: "Сравнить с живой версией",
    mintDoi: "Присвоить DOI",
    minting: "Присвоение…",
    mintDisabledHint: "Присвоение DOI не настроено на этом сервере.",
    mintNeedsPublic: "Сначала сделайте версию публичной, чтобы присвоить DOI.",
    doiFailed: "Не удалось присвоить DOI. Можно попробовать снова.",
    delete: "Удалить",
    confirmDelete: "Подтвердить удаление",
    loadFailed: "Не удалось загрузить версии.",
    actionFailed: "Что-то пошло не так. Попробуйте ещё раз.",
    bannerFrozen: "Зафиксированная версия {n} · {date}",
    bannerLive: "Живая версия",
    bannerCompare: "Что изменилось с тех пор",
    readerOptionHint:
      "Зафиксированная страница показывает отметки происхождения, проверки и контекста, нужные эксперту, оставляет отозванные работы видимыми и не имеет обычного вида. Выбирается сейчас и фиксируется для этой версии.",
    readerTag: "Режим эксперта",
    shapeLabel: "Формат",
    shapeCurrent: "Текущая раскладка",
    shapeHint:
      "Применяет одну из моделей CV только к этой замороженной версии; ваш живой CV не меняется.",
    presetLabel: "Заморозить как",
    presetStandard: "Обычная страница",
    presetReader: "Режим эксперта",
    presetHiring: "Для комиссии по найму",
    hiringHint:
      "Показывает ваши контакты (эл. почта, телефон, местоположение) на этой зафиксированной странице — даже те, что скрыты на вашей публичной странице; отображаются только заполненные поля — и скрывает отметки академических свидетельств и метрики. Режим эксперта для этой версии закрыт. Выбирается сейчас и фиксируется для этой версии.",
    requestTitle: "По ссылке запрошена замороженная версия вашего CV",
    requestBody: "Запрошен формат «{shape}», заморозить как: {preset}.",
    requestBy: "Срок: {date}.",
    requestNoModel: "ваша текущая раскладка",
    requestNothingSent:
      "Автору ссылки ничего не отправлено: вы сами решаете, замораживать ли версию, и сами отправляете замороженную ссылку.",
    requestDefaultLabel: "Запрошенная версия",
    requestLabel: "Предложенное название:",
    requestFreeze: "Заморозить эту версию",
    requestDismiss: "Не сейчас",
    requestDone: "Заморожено как версия {n}.",
    diffTitle: "Изменения с версии {n}",
    diffIntro: "Сравнение зафиксированной версии {n} ({date}) с текущим живым CV.",
    diffNoChanges: "Изменений нет.",
    diffAdded: "Добавлено",
    diffRemoved: "Удалено",
    diffHidden: "Скрыто",
    diffUnhidden: "Снова показано",
    diffSectionsAdded: "Добавленные разделы",
    diffSectionsRemoved: "Удалённые разделы",
    diffDisplay: "Изменены настройки отображения",
    diffOwner: "Изменены поля профиля",
    diffNarrative: "Изменён текст нарратива",
    diffWords: "{before} → {after} слов",
    diffMetrics: "Изменены метрики",
    diffFrozenLink: "Зафиксированная версия",
  },
};

/** Snapshot copy for a locale (falls back to en-US for an unknown locale). */
export function snapshotStrings(locale: string): SnapshotStrings {
  return SNAPSHOT_I18N[asLocale(locale)];
}
