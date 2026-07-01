import { asLocale, type Locale } from "./index";

/**
 * Copy for the no-login ORCID preview: the "paste your ORCID" affordance shown on
 * the landing pages (components/OrcidPreviewForm.tsx) AND the standalone
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
  /** Sign-in-card prompt above the ORCID input. */
  formPrompt: string;
  /** aria-label for the ORCID input. */
  formAria: string;
  /** Submit button that opens the preview. */
  formCta: string;
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
}

const PREVIEW_I18N: Record<Locale, PreviewStrings> = {
  "en-US": {
    formPrompt: "Just want to see it first?",
    formAria: "Your ORCID iD",
    formCta: "Preview my CV",
    metaTitle: "CV preview",
    builtFromPublic:
      "This preview is built live from public data (OpenAlex and ORCID). Sign in to curate it, pick a citation style, and make it yours.",
    ctaSignIn: "Sign in with ORCID to save, edit & publish",
    emptyHeading: "No public record found yet",
    emptyBody:
      "We couldn't find a public research record for this ORCID iD. Sign in and SigmaCV will help you build your CV anyway.",
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
    loadingTitle: "Building your CV preview",
    loadingBody:
      "Gathering your work from public sources (OpenAlex, ORCID) and formatting it. This usually takes a few seconds.",
    ctaKeep: "Sign in to save & publish",
    editNote: "Live preview — curate and restyle freely. Sign in to save, publish, or export.",
    back: "Back to SigmaCV",
  },
  "zh-CN": {
    formPrompt: "想先看看效果？",
    formAria: "您的 ORCID iD",
    formCta: "预览我的简历",
    metaTitle: "简历预览",
    builtFromPublic:
      "此预览根据公开数据（OpenAlex 和 ORCID）实时生成。登录后即可整理内容、选择引用样式，并将其打造成您自己的简历。",
    ctaSignIn: "使用 ORCID 登录以保存、编辑和发布",
    emptyHeading: "暂未找到公开记录",
    emptyBody: "我们没有找到与此 ORCID iD 对应的公开研究记录。登录后，SigmaCV 仍会帮助您创建简历。",
    invalidHeading: "这看起来不是 ORCID iD",
    invalidBody: "ORCID iD 的格式类似 0000-0000-0000-0000。请检查后重试。",
    rateLimitedHeading: "预览次数过多",
    rateLimitedBody: "您的网络在短时间内发起了大量预览请求。请稍候片刻后重试。",
    errorHeading: "出了点问题",
    errorBody: "我们暂时无法生成此预览——某个数据源可能暂时不可用。请稍后再试。",
    refreshPaused: "预览更新已暂停片刻（刷新过于频繁）。您的编辑已安全保留——稍后会自动更新。",
    refreshFailed: "暂时无法刷新预览。您的编辑已安全保留——下次修改时会自动重试。",
    loadingTitle: "正在生成您的简历预览",
    loadingBody: "正在从公开数据源（OpenAlex、ORCID）收集并整理您的成果。通常需要几秒钟。",
    ctaKeep: "登录以保存和发布",
    editNote: "实时预览——可自由整理和调整样式。登录后即可保存、发布或导出。",
    back: "返回 SigmaCV",
  },
  "es-ES": {
    formPrompt: "¿Prefieres verlo primero?",
    formAria: "Tu iD ORCID",
    formCta: "Ver la vista previa de mi CV",
    metaTitle: "Vista previa del CV",
    builtFromPublic:
      "Esta vista previa se genera en directo a partir de datos públicos (OpenAlex y ORCID). Inicia sesión para personalizarlo, elegir un estilo de cita y hacerlo tuyo.",
    ctaSignIn: "Inicia sesión con ORCID para guardar, editar y publicar",
    emptyHeading: "Aún no se ha encontrado ningún registro público",
    emptyBody:
      "No hemos encontrado ningún registro de investigación público para este iD ORCID. Inicia sesión y SigmaCV te ayudará a crear tu CV de todos modos.",
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
    loadingTitle: "Generando la vista previa de tu CV",
    loadingBody:
      "Reuniendo tu trabajo de fuentes públicas (OpenAlex, ORCID) y dándole formato. Esto suele tardar unos segundos.",
    ctaKeep: "Inicia sesión para guardar y publicar",
    editNote:
      "Vista previa en vivo: organiza y personaliza libremente. Inicia sesión para guardar, publicar o exportar.",
    back: "Volver a SigmaCV",
  },
  "fr-FR": {
    formPrompt: "Envie de voir le résultat d'abord ?",
    formAria: "Votre iD ORCID",
    formCta: "Prévisualiser mon CV",
    metaTitle: "Aperçu du CV",
    builtFromPublic:
      "Cet aperçu est généré en direct à partir de données publiques (OpenAlex et ORCID). Connectez-vous pour le personnaliser, choisir un style de citation et le faire vôtre.",
    ctaSignIn: "Se connecter avec ORCID pour enregistrer, modifier et publier",
    emptyHeading: "Aucune trace publique trouvée pour l'instant",
    emptyBody:
      "Nous n'avons trouvé aucun dossier de recherche public pour cet iD ORCID. Connectez-vous et SigmaCV vous aidera à construire votre CV malgré tout.",
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
    loadingTitle: "Construction de l’aperçu de votre CV",
    loadingBody:
      "Nous rassemblons vos travaux depuis des sources publiques (OpenAlex, ORCID) et les mettons en forme. Cela prend généralement quelques secondes.",
    ctaKeep: "Se connecter pour enregistrer et publier",
    editNote:
      "Aperçu en direct — organisez et personnalisez librement. Connectez-vous pour enregistrer, publier ou exporter.",
    back: "Retour à SigmaCV",
  },
  "de-DE": {
    formPrompt: "Möchten Sie es erst einmal sehen?",
    formAria: "Ihre ORCID iD",
    formCta: "Lebenslauf-Vorschau ansehen",
    metaTitle: "Lebenslauf-Vorschau",
    builtFromPublic:
      "Diese Vorschau wird live aus öffentlichen Daten (OpenAlex und ORCID) erstellt. Melden Sie sich an, um ihn anzupassen, einen Zitationsstil zu wählen und ihn zu Ihrem eigenen zu machen.",
    ctaSignIn: "Mit ORCID anmelden, um zu speichern, zu bearbeiten und zu veröffentlichen",
    emptyHeading: "Noch kein öffentlicher Eintrag gefunden",
    emptyBody:
      "Wir konnten für diese ORCID iD keinen öffentlichen Forschungsdatensatz finden. Melden Sie sich an, und SigmaCV hilft Ihnen trotzdem beim Aufbau Ihres Lebenslaufs.",
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
    loadingTitle: "Ihre Lebenslauf-Vorschau wird erstellt",
    loadingBody:
      "Wir sammeln Ihre Arbeiten aus öffentlichen Quellen (OpenAlex, ORCID) und formatieren sie. Das dauert in der Regel einige Sekunden.",
    ctaKeep: "Anmelden zum Speichern und Veröffentlichen",
    editNote:
      "Live-Vorschau – frei kuratieren und umgestalten. Melden Sie sich an, um zu speichern, zu veröffentlichen oder zu exportieren.",
    back: "Zurück zu SigmaCV",
  },
  "ja-JP": {
    formPrompt: "まず結果を見てみますか？",
    formAria: "あなたの ORCID iD",
    formCta: "CV をプレビュー",
    metaTitle: "CV プレビュー",
    builtFromPublic:
      "このプレビューは公開データ（OpenAlex と ORCID）からリアルタイムで生成されています。ログインすると、内容を整え、引用スタイルを選び、あなた自身の CV に仕上げられます。",
    ctaSignIn: "ORCID でログインして保存・編集・公開",
    emptyHeading: "公開記録はまだ見つかりません",
    emptyBody:
      "この ORCID iD に対応する公開された研究記録は見つかりませんでした。ログインすれば、SigmaCV がそれでも CV の作成をお手伝いします。",
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
    loadingTitle: "CV プレビューを生成しています",
    loadingBody:
      "公開データソース（OpenAlex、ORCID）からあなたの業績を集めて整えています。通常は数秒で完了します。",
    ctaKeep: "ログインして保存・公開",
    editNote:
      "ライブプレビュー——自由に整理・スタイル変更できます。保存・公開・書き出しはログイン後に。",
    back: "SigmaCV に戻る",
  },
  "pt-BR": {
    formPrompt: "Quer ver primeiro?",
    formAria: "Seu iD ORCID",
    formCta: "Pré-visualizar meu CV",
    metaTitle: "Pré-visualização do CV",
    builtFromPublic:
      "Esta pré-visualização é gerada ao vivo a partir de dados públicos (OpenAlex e ORCID). Entre para organizá-lo, escolher um estilo de citação e torná-lo seu.",
    ctaSignIn: "Entrar com ORCID para salvar, editar e publicar",
    emptyHeading: "Nenhum registro público encontrado ainda",
    emptyBody:
      "Não encontramos um registro de pesquisa público para este iD ORCID. Entre e o SigmaCV ajudará você a montar seu CV mesmo assim.",
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
    loadingTitle: "Gerando a pré-visualização do seu CV",
    loadingBody:
      "Reunindo seu trabalho de fontes públicas (OpenAlex, ORCID) e formatando-o. Isso geralmente leva alguns segundos.",
    ctaKeep: "Entrar para salvar e publicar",
    editNote:
      "Pré-visualização ao vivo — organize e personalize à vontade. Entre para salvar, publicar ou exportar.",
    back: "Voltar ao SigmaCV",
  },
  "it-IT": {
    formPrompt: "Vuoi prima dare un'occhiata?",
    formAria: "Il tuo iD ORCID",
    formCta: "Anteprima del mio CV",
    metaTitle: "Anteprima del CV",
    builtFromPublic:
      "Questa anteprima è generata in tempo reale da dati pubblici (OpenAlex e ORCID). Accedi per personalizzarlo, scegliere uno stile di citazione e renderlo tuo.",
    ctaSignIn: "Accedi con ORCID per salvare, modificare e pubblicare",
    emptyHeading: "Nessun record pubblico trovato per ora",
    emptyBody:
      "Non abbiamo trovato un record di ricerca pubblico per questo iD ORCID. Accedi e SigmaCV ti aiuterà comunque a creare il tuo CV.",
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
    loadingTitle: "Creazione dell’anteprima del tuo CV",
    loadingBody:
      "Stiamo raccogliendo i tuoi lavori da fonti pubbliche (OpenAlex, ORCID) e li stiamo formattando. Di solito richiede qualche secondo.",
    ctaKeep: "Accedi per salvare e pubblicare",
    editNote:
      "Anteprima dal vivo — organizza e personalizza liberamente. Accedi per salvare, pubblicare o esportare.",
    back: "Torna a SigmaCV",
  },
  "ko-KR": {
    formPrompt: "먼저 확인해 보시겠어요?",
    formAria: "회원님의 ORCID iD",
    formCta: "내 CV 미리보기",
    metaTitle: "CV 미리보기",
    builtFromPublic:
      "이 미리보기는 공개 데이터(OpenAlex 및 ORCID)를 바탕으로 실시간으로 생성됩니다. 로그인하면 내용을 정리하고 인용 스타일을 선택해 나만의 CV로 완성할 수 있습니다.",
    ctaSignIn: "ORCID로 로그인하여 저장, 편집 및 게시",
    emptyHeading: "아직 공개 기록을 찾지 못했습니다",
    emptyBody:
      "이 ORCID iD에 대한 공개 연구 기록을 찾지 못했습니다. 로그인하시면 SigmaCV가 그래도 CV 작성을 도와드립니다.",
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
      "공개 데이터 출처(OpenAlex, ORCID)에서 연구 성과를 수집하고 서식을 적용하고 있습니다. 보통 몇 초 정도 걸립니다.",
    ctaKeep: "로그인하여 저장 및 게시",
    editNote:
      "실시간 미리보기 — 자유롭게 정리하고 스타일을 바꿔 보세요. 저장, 게시, 내보내기는 로그인 후 가능합니다.",
    back: "SigmaCV로 돌아가기",
  },
  "ru-RU": {
    formPrompt: "Хотите сначала посмотреть?",
    formAria: "Ваш ORCID iD",
    formCta: "Предпросмотр моего CV",
    metaTitle: "Предпросмотр CV",
    builtFromPublic:
      "Этот предпросмотр создаётся в реальном времени из открытых данных (OpenAlex и ORCID). Войдите, чтобы отредактировать его, выбрать стиль цитирования и сделать его своим.",
    ctaSignIn: "Войдите через ORCID, чтобы сохранять, редактировать и публиковать",
    emptyHeading: "Публичных записей пока не найдено",
    emptyBody:
      "Мы не нашли публичных научных записей для этого ORCID iD. Войдите, и SigmaCV всё равно поможет вам составить CV.",
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
    loadingTitle: "Создаём предпросмотр вашего CV",
    loadingBody:
      "Собираем ваши работы из открытых источников (OpenAlex, ORCID) и форматируем их. Обычно это занимает несколько секунд.",
    ctaKeep: "Войти, чтобы сохранить и опубликовать",
    editNote:
      "Живой предпросмотр — свободно редактируйте и меняйте стиль. Войдите, чтобы сохранить, опубликовать или экспортировать.",
    back: "Назад в SigmaCV",
  },
};

/** No-login preview copy for a locale (falls back to English). */
export function previewStrings(locale: string): PreviewStrings {
  return PREVIEW_I18N[asLocale(locale)];
}
