import { asLocale, type Locale } from "./index";

/**
 * Marketing/landing-page copy, localized for the public homepage. Kept separate
 * from the editor "chrome" dictionary (high cohesion): this is the only
 * crawlable, user-facing-before-login surface, so its strings double as the
 * localized SEO title/description for each `/[locale]` variant.
 */
/**
 * Copy for the sign-in error page (`/auth/error`, wired via Auth.js
 * `pages.error`). `messages` is keyed by Auth.js error code; unknown codes fall
 * back to `messages.Default`. Kept friendly and non-leaky — never echoes the raw
 * provider error or any token.
 */
export interface AuthErrorStrings {
  /** SEO/page <title> and the single visible <h1>. */
  metaTitle: string;
  /** One-line lead under the heading. */
  intro: string;
  /** Human-readable message per Auth.js error code (Default is the fallback). */
  messages: {
    Configuration: string;
    AccessDenied: string;
    Verification: string;
    OAuthSignin: string;
    OAuthCallback: string;
    Default: string;
  };
  /** "Try again" primary action (returns to the homepage sign-in). */
  tryAgain: string;
  /** Hint suggesting the ORCID sign-in as the reliable path. */
  useOrcidHint: string;
  /** Secondary "Back to home" link label. */
  backHome: string;
}

export interface LandingStrings {
  /** <title> for this locale's homepage (SEO). */
  metaTitle: string;
  /** <meta name="description"> for this locale's homepage (SEO). */
  metaDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroSub: string;
  step1: string;
  step2: string;
  step3: string;
  signInTitle: string;
  signInSub: string;
  signInOrcid: string;
  /** Trust line shown directly under the ORCID sign-in button. */
  orcidTrust: string;
  orDivider: string;
  continueGoogle: string;
  emailPlaceholder: string;
  emailButton: string;
  /** Accessible name for the email sign-in input (placeholder is not a label). */
  emailLabel: string;
  /** Visible field label shown above the email input. */
  emailFieldLabel: string;
  /** Persistent helper under the email input explaining the magic-link flow. */
  emailHelper: string;
  /** Busy label while a sign-in is redirecting (button "Signing in…" state). */
  signingIn: string;
  /** Email magic-link "check your inbox" confirmation: heading + body. */
  checkInboxTitle: string;
  checkInboxBody: string;
  /** Localized sign-in error page (Auth.js `pages.error`). */
  authError: AuthErrorStrings;
  fineprint: string;
  about: string;
  footer: string;
  languageLabel: string;
  /** Header CTA button → sign-in (e.g. "Build my CV"). */
  ctaBuild: string;
  /** Features-showcase section heading. */
  featuresTitle: string;
  /** Concise feature cards (title + one-line body). Same count in every locale. */
  features: { title: string; body: string }[];
  /** Trust / "why SigmaCV" section heading. */
  trustTitle: string;
  /** Trust cards (Free / Private / Open source / Responsible) — minimal copy;
   *  an icon is added per card by position. Same count (4) in every locale. */
  trust: { title: string; body: string }[];
  /** "Built by a researcher" heading + body (creator linked to ORCID). */
  creatorTitle: string;
  creatorBody: string;
  /** Internal-link section: heading + the two SEO landing-page link labels. */
  exploreTitle: string;
  exploreOrcid: string;
  exploreNih: string;
}

const LANDING_I18N: Record<Locale, LandingStrings> = {
  "en-US": {
    metaTitle: "SigmaCV — Free academic CV builder from ORCID & OpenAlex",
    metaDescription:
      "Free, open-source academic CV builder. Auto-build your researcher CV from ORCID and OpenAlex, generate a formatted publication list, pick a citation style, and export to PDF, DOCX, LaTeX, Markdown or BibTeX.",
    eyebrow: "Open infrastructure for responsible research assessment",
    heroTitle: "Your academic CV, auto-built from the open research record.",
    heroSub:
      "Clean, customizable academic CVs generated from OpenAlex, ORCID, Crossref, DataCite and more — curate what’s yours, pick a citation style, and export to PDF, DOCX, LaTeX, Markdown or BibTeX.",
    step1: "Sign in with your ORCID iD.",
    step2: "Publications populate automatically from OpenAlex.",
    step3: "Curate, style, and export — or publish a living page.",
    signInTitle: "Sign in",
    signInSub: "Free for individuals · open source",
    signInOrcid: "Sign in with ORCID",
    orcidTrust: "We only read your public ORCID record — never post, never write anything back.",
    orDivider: "or",
    continueGoogle: "Continue with Google",
    emailPlaceholder: "you@university.edu",
    emailButton: "Email link",
    emailLabel: "Email address",
    emailFieldLabel: "Email address",
    emailHelper: "We’ll email you a one-time sign-in link — no password needed.",
    signingIn: "Signing in…",
    checkInboxTitle: "Check your inbox",
    checkInboxBody:
      "We’ve sent a one-time sign-in link to your email. Open it on this device to finish signing in. The link expires shortly; you can close this tab.",
    authError: {
      metaTitle: "Sign-in problem",
      intro: "We couldn’t finish signing you in.",
      messages: {
        Configuration:
          "Sign-in is temporarily misconfigured on our side. Please try again in a moment.",
        AccessDenied:
          "Sign-in was cancelled or access wasn’t granted. You can try again whenever you’re ready.",
        Verification:
          "That sign-in link has expired or was already used. Request a fresh link and try again.",
        OAuthSignin:
          "We couldn’t reach the sign-in provider. This is usually temporary — please try again.",
        OAuthCallback:
          "Something went wrong while completing sign-in (often an expired or interrupted request). Please try again.",
        Default: "Something went wrong while signing in. Please try again.",
      },
      tryAgain: "Try again",
      useOrcidHint: "Signing in with your ORCID iD is the most reliable option.",
      backHome: "Back to home",
    },
    fineprint:
      "Open source · Apache-2.0. SigmaCV reads only public research metadata and never logs your choices without explicit consent.",
    about: "About",
    footer: "© SigmaCV · open source",
    languageLabel: "Language",
    ctaBuild: "Build my CV",
    featuresTitle: "Everything in one canonical CV",
    features: [
      {
        title: "Auto-pulled from ORCID & OpenAlex",
        body: "Publications, metrics and grants imported from OpenAlex and ORCID — no copy-paste.",
      },
      {
        title: "One object, every format",
        body: "A single canonical CV renders to identical citations everywhere via CSL.",
      },
      {
        title: "Highlighted by identifier",
        body: "Your name is highlighted by ORCID / OpenAlex ID — never by a name string.",
      },
      {
        title: "58 one-click layouts",
        body: "Funder, institution and industry CV layouts — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC and an ICH-GCP investigator CV.",
      },
      {
        title: "Export to PDF, DOCX, LaTeX & more",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé and an NIH biosketch.",
      },
      {
        title: "Living public page",
        body: "Publish a machine-readable page that re-syncs from the open record. Ten languages.",
      },
      {
        title: "Metrics, done responsibly",
        body: "Opt-in, field-normalized metrics — default none, DORA-aligned.",
      },
    ],
    trustTitle: "Why SigmaCV",
    trust: [
      { title: "Free", body: "For individuals, always." },
      { title: "Private", body: "Your data, your control." },
      { title: "Open source", body: "Apache-2.0, auditable." },
      { title: "Responsible", body: "Opt-in, DORA-aligned metrics." },
    ],
    creatorTitle: "Built by a researcher, for researchers",
    creatorBody:
      "Created by Basile Chrétien (PharmD, MSc, MPH) as not-for-profit open infrastructure for responsible research assessment.",
    exploreTitle: "Explore",
    exploreOrcid: "Turn your ORCID iD into a CV",
    exploreNih: "Generate an NIH biosketch",
  },
  "zh-CN": {
    metaTitle: "SigmaCV — 基于 ORCID 和 OpenAlex 的免费学术简历生成器",
    metaDescription:
      "根据 ORCID 和 OpenAlex 自动生成简洁、可定制的学术简历：汇总您的论文、按标识符高亮您的署名、选择引用样式、整理属于您的成果，并导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX，或发布一个始终保持最新的公开主页。可选的负责任指标，免费、开源且尊重隐私。",
    eyebrow: "面向负责任研究评价的开放基础设施",
    heroTitle: "您的学术简历，依据公开学术记录自动生成。",
    heroSub:
      "依据 OpenAlex、ORCID、Crossref、DataCite 等多个开放数据源生成简洁、可定制的简历——整理属于您的成果，选择引用样式，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
    step1: "使用您的 ORCID iD 登录。",
    step2: "论文将自动从 OpenAlex 填充。",
    step3: "整理、设置样式并导出——或发布一个持续更新的页面。",
    signInTitle: "登录",
    signInSub: "个人免费 · 开源",
    signInOrcid: "使用 ORCID 登录",
    orcidTrust: "我们仅读取您公开的 ORCID 记录——绝不发布、绝不写入任何内容。",
    orDivider: "或",
    continueGoogle: "使用 Google 继续",
    emailPlaceholder: "you@university.edu",
    emailButton: "邮件链接",
    emailLabel: "电子邮件地址",
    emailFieldLabel: "电子邮件地址",
    emailHelper: "我们会向您发送一次性登录链接——无需密码。",
    signingIn: "正在登录…",
    checkInboxTitle: "请查收邮箱",
    checkInboxBody:
      "我们已向您的邮箱发送了一次性登录链接。请在本设备上打开它以完成登录。该链接将很快过期；您可以关闭此标签页。",
    authError: {
      metaTitle: "登录出现问题",
      intro: "我们无法完成您的登录。",
      messages: {
        Configuration: "我们这边的登录暂时配置有误。请稍后再试。",
        AccessDenied: "登录已取消或未获授权。您可以在准备好后重试。",
        Verification: "该登录链接已过期或已被使用。请重新获取链接后再试。",
        OAuthSignin: "我们无法连接登录服务提供方。通常这是暂时性问题——请重试。",
        OAuthCallback: "完成登录时出错（通常是请求过期或被中断）。请重试。",
        Default: "登录时出错。请重试。",
      },
      tryAgain: "重试",
      useOrcidHint: "使用您的 ORCID iD 登录是最可靠的方式。",
      backHome: "返回首页",
    },
    fineprint: "开源 · Apache-2.0。SigmaCV 仅读取公开的研究元数据，未经明确同意绝不记录您的选择。",
    about: "关于",
    footer: "© SigmaCV · 开源",
    languageLabel: "语言",
    ctaBuild: "创建我的简历",
    featuresTitle: "全部汇聚于一个规范化简历",
    features: [
      {
        title: "从开放数据自动获取",
        body: "论文、指标和资助自 OpenAlex 与 ORCID 导入——无需复制粘贴。",
      },
      {
        title: "一个对象，适配各种格式",
        body: "通过 CSL，单一规范化简历在各处呈现完全一致的引用。",
      },
      { title: "按标识符高亮", body: "您的姓名按 ORCID / OpenAlex ID 高亮——绝不按姓名字符串。" },
      {
        title: "58 种一键版式",
        body: "资助方、机构与行业简历版式——UKRI R4RI、Royal Society、SNSF、NIH、NSF、ERC 以及 ICH-GCP 研究者简历。",
      },
      {
        title: "随处导出",
        body: "PDF、DOCX、LaTeX、Markdown、BibTeX、CSL-JSON、JSON Résumé 以及 NIH biosketch。",
      },
      {
        title: "持续更新的公开页面",
        body: "发布可被机器读取、并从公开记录重新同步的页面。支持十种语言。",
      },
      { title: "负责任地使用指标", body: "可选的领域归一化指标——默认不显示，符合 DORA。" },
    ],
    trustTitle: "为什么选择 SigmaCV",
    trust: [
      { title: "免费", body: "永久面向个人。" },
      { title: "隐私", body: "您的数据由您掌控。" },
      { title: "开源", body: "Apache-2.0，可审计。" },
      { title: "负责任", body: "可选、符合 DORA 的指标。" },
    ],
    creatorTitle: "由研究者打造，为研究者而生",
    creatorBody:
      "由 Basile Chrétien（PharmD, MSc, MPH）创建，作为面向负责任研究评价的非营利开放基础设施。",
    exploreTitle: "了解更多",
    exploreOrcid: "将您的 ORCID iD 变成简历",
    exploreNih: "生成 NIH biosketch",
  },
  "es-ES": {
    metaTitle: "SigmaCV — Generador gratuito de CV académicos desde ORCID y OpenAlex",
    metaDescription:
      "Genera automáticamente un CV académico limpio desde ORCID y OpenAlex. Elige un estilo de cita, selecciona lo que es tuyo y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
    eyebrow: "Infraestructura abierta para una evaluación responsable de la investigación",
    heroTitle: "Tu CV académico, generado automáticamente desde el registro científico abierto.",
    heroSub:
      "CV limpios y personalizables generados desde OpenAlex, ORCID, Crossref, DataCite y más: selecciona lo que es tuyo, elige un estilo de cita y exporta a PDF, DOCX, LaTeX o Markdown.",
    step1: "Inicia sesión con tu iD ORCID.",
    step2: "Las publicaciones se rellenan automáticamente desde OpenAlex.",
    step3: "Selecciona, da estilo y exporta, o publica una página viva.",
    signInTitle: "Iniciar sesión",
    signInSub: "Gratis para particulares · código abierto",
    signInOrcid: "Iniciar sesión con ORCID",
    orcidTrust: "Solo leemos tu registro público de ORCID: nunca publicamos ni escribimos nada.",
    orDivider: "o",
    continueGoogle: "Continuar con Google",
    emailPlaceholder: "tu@universidad.edu",
    emailButton: "Enlace por correo",
    emailLabel: "Correo electrónico",
    emailFieldLabel: "Correo electrónico",
    emailHelper: "Te enviaremos un enlace de inicio de sesión de un solo uso — sin contraseña.",
    signingIn: "Iniciando sesión…",
    checkInboxTitle: "Revisa tu bandeja de entrada",
    checkInboxBody:
      "Hemos enviado un enlace de inicio de sesión de un solo uso a tu correo. Ábrelo en este dispositivo para completar el acceso. El enlace caduca en breve; puedes cerrar esta pestaña.",
    authError: {
      metaTitle: "Problema al iniciar sesión",
      intro: "No pudimos completar tu inicio de sesión.",
      messages: {
        Configuration:
          "El inicio de sesión está temporalmente mal configurado por nuestra parte. Inténtalo de nuevo en un momento.",
        AccessDenied:
          "Se canceló el inicio de sesión o no se concedió el acceso. Puedes intentarlo de nuevo cuando quieras.",
        Verification:
          "Ese enlace de inicio de sesión ha caducado o ya se usó. Solicita un enlace nuevo e inténtalo otra vez.",
        OAuthSignin:
          "No pudimos contactar con el proveedor de inicio de sesión. Suele ser temporal — inténtalo de nuevo.",
        OAuthCallback:
          "Algo salió mal al completar el inicio de sesión (a menudo una solicitud caducada o interrumpida). Inténtalo de nuevo.",
        Default: "Algo salió mal al iniciar sesión. Inténtalo de nuevo.",
      },
      tryAgain: "Intentar de nuevo",
      useOrcidHint: "Iniciar sesión con tu iD ORCID es la opción más fiable.",
      backHome: "Volver al inicio",
    },
    fineprint:
      "Código abierto · Apache-2.0. SigmaCV solo lee metadatos públicos de investigación y nunca registra tus decisiones sin consentimiento explícito.",
    about: "Acerca de",
    footer: "© SigmaCV · código abierto",
    languageLabel: "Idioma",
    ctaBuild: "Crear mi CV",
    featuresTitle: "Todo en un único CV canónico",
    features: [
      {
        title: "Importado de datos abiertos",
        body: "Publicaciones, métricas y financiación importadas de OpenAlex y ORCID — sin copiar y pegar.",
      },
      {
        title: "Un objeto, todos los formatos",
        body: "Un único CV canónico genera citas idénticas en todas partes mediante CSL.",
      },
      {
        title: "Resaltado por identificador",
        body: "Tu nombre se resalta por ID de ORCID / OpenAlex — nunca por la cadena del nombre.",
      },
      {
        title: "58 diseños con un clic",
        body: "Diseños de CV de financiadores, instituciones e industria — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC y un CV de investigador ICH-GCP.",
      },
      {
        title: "Exporta a cualquier sitio",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé y un NIH biosketch.",
      },
      {
        title: "Página pública viva",
        body: "Publica una página legible por máquinas que se resincroniza con el registro abierto. Diez idiomas.",
      },
      {
        title: "Métricas con responsabilidad",
        body: "Métricas opcionales y normalizadas por campo — ninguna por defecto, alineadas con DORA.",
      },
    ],
    trustTitle: "Por qué SigmaCV",
    trust: [
      { title: "Gratis", body: "Para particulares, siempre." },
      { title: "Privado", body: "Tus datos, tu control." },
      { title: "Código abierto", body: "Apache-2.0, auditable." },
      { title: "Responsable", body: "Métricas opcionales, alineadas con DORA." },
    ],
    creatorTitle: "Creado por un investigador, para investigadores",
    creatorBody:
      "Creado por Basile Chrétien (PharmD, MSc, MPH) como infraestructura abierta sin ánimo de lucro para una evaluación responsable de la investigación.",
    exploreTitle: "Explorar",
    exploreOrcid: "Convierte tu iD ORCID en un CV",
    exploreNih: "Genera un NIH biosketch",
  },
  "fr-FR": {
    metaTitle: "SigmaCV — Générateur gratuit de CV académique depuis ORCID et OpenAlex",
    metaDescription:
      "Générez automatiquement un CV académique soigné depuis ORCID et OpenAlex. Choisissez un style de citation, sélectionnez ce qui est à vous et exportez en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
    eyebrow: "Infrastructure ouverte pour une évaluation responsable de la recherche",
    heroTitle:
      "Votre CV académique, généré automatiquement à partir du dossier scientifique ouvert.",
    heroSub:
      "Des CV soignés et personnalisables générés depuis OpenAlex, ORCID, Crossref, DataCite et bien d’autres — sélectionnez ce qui est à vous, choisissez un style de citation et exportez en PDF, DOCX, LaTeX ou Markdown.",
    step1: "Connectez-vous avec votre iD ORCID.",
    step2: "Les publications se remplissent automatiquement depuis OpenAlex.",
    step3: "Sélectionnez, mettez en forme et exportez — ou publiez une page vivante.",
    signInTitle: "Se connecter",
    signInSub: "Gratuit pour les particuliers · open source",
    signInOrcid: "Se connecter avec ORCID",
    orcidTrust:
      "Nous lisons seulement votre fiche ORCID publique — jamais de publication ni d’écriture.",
    orDivider: "ou",
    continueGoogle: "Continuer avec Google",
    emailPlaceholder: "vous@universite.edu",
    emailButton: "Lien par e-mail",
    emailLabel: "Adresse e-mail",
    emailFieldLabel: "Adresse e-mail",
    emailHelper: "Nous vous enverrons un lien de connexion à usage unique — sans mot de passe.",
    signingIn: "Connexion…",
    checkInboxTitle: "Vérifiez votre boîte de réception",
    checkInboxBody:
      "Nous avons envoyé un lien de connexion à usage unique à votre adresse e-mail. Ouvrez-le sur cet appareil pour terminer la connexion. Le lien expire sous peu ; vous pouvez fermer cet onglet.",
    authError: {
      metaTitle: "Problème de connexion",
      intro: "Nous n’avons pas pu finaliser votre connexion.",
      messages: {
        Configuration:
          "La connexion est temporairement mal configurée de notre côté. Veuillez réessayer dans un instant.",
        AccessDenied:
          "La connexion a été annulée ou l’accès n’a pas été accordé. Vous pouvez réessayer quand vous le souhaitez.",
        Verification:
          "Ce lien de connexion a expiré ou a déjà été utilisé. Demandez un nouveau lien et réessayez.",
        OAuthSignin:
          "Nous n’avons pas pu joindre le fournisseur de connexion. C’est généralement temporaire — veuillez réessayer.",
        OAuthCallback:
          "Une erreur s’est produite lors de la finalisation de la connexion (souvent une requête expirée ou interrompue). Veuillez réessayer.",
        Default: "Une erreur s’est produite lors de la connexion. Veuillez réessayer.",
      },
      tryAgain: "Réessayer",
      useOrcidHint: "Se connecter avec votre iD ORCID est l’option la plus fiable.",
      backHome: "Retour à l’accueil",
    },
    fineprint:
      "Open source · Apache-2.0. SigmaCV ne lit que des métadonnées de recherche publiques et n’enregistre jamais vos choix sans consentement explicite.",
    about: "À propos",
    footer: "© SigmaCV · open source",
    languageLabel: "Langue",
    ctaBuild: "Créer mon CV",
    featuresTitle: "Tout dans un seul CV canonique",
    features: [
      {
        title: "Importé des données ouvertes",
        body: "Publications, métriques et financements importés depuis OpenAlex et ORCID — sans copier-coller.",
      },
      {
        title: "Un objet, tous les formats",
        body: "Un seul CV canonique produit des citations identiques partout via CSL.",
      },
      {
        title: "Mis en évidence par identifiant",
        body: "Votre nom est mis en évidence par identifiant ORCID / OpenAlex — jamais par la chaîne du nom.",
      },
      {
        title: "58 mises en page en un clic",
        body: "Mises en page de CV pour financeurs, institutions et industrie — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC et un CV d'investigateur ICH-GCP.",
      },
      {
        title: "Exportez partout",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé et un NIH biosketch.",
      },
      {
        title: "Page publique vivante",
        body: "Publiez une page lisible par machine qui se resynchronise avec le corpus ouvert. Dix langues.",
      },
      {
        title: "Des métriques responsables",
        body: "Métriques optionnelles et normalisées par champ — aucune par défaut, alignées sur DORA.",
      },
    ],
    trustTitle: "Pourquoi SigmaCV",
    trust: [
      { title: "Gratuit", body: "Pour les particuliers, toujours." },
      { title: "Confidentiel", body: "Vos données, votre contrôle." },
      { title: "Open source", body: "Apache-2.0, auditable." },
      { title: "Responsable", body: "Métriques optionnelles, alignées DORA." },
    ],
    creatorTitle: "Conçu par un chercheur, pour les chercheurs",
    creatorBody:
      "Créé par Basile Chrétien (PharmD, MSc, MPH) comme infrastructure ouverte à but non lucratif au service d'une évaluation responsable de la recherche.",
    exploreTitle: "Explorer",
    exploreOrcid: "Transformez votre iD ORCID en CV",
    exploreNih: "Générez un NIH biosketch",
  },
  "de-DE": {
    metaTitle: "SigmaCV — Kostenloser akademischer Lebenslauf-Generator aus ORCID & OpenAlex",
    metaDescription:
      "Erstellen Sie automatisch einen sauberen akademischen Lebenslauf aus ORCID und OpenAlex. Zitierstil wählen, Eigenes kuratieren und als PDF, DOCX, LaTeX oder Markdown exportieren. Kostenlos und quelloffen.",
    eyebrow: "Offene Infrastruktur für verantwortungsvolle Forschungsbewertung",
    heroTitle:
      "Ihr akademischer Lebenslauf, automatisch aus dem offenen Forschungsnachweis erstellt.",
    heroSub:
      "Saubere, anpassbare Lebensläufe aus OpenAlex, ORCID, Crossref, DataCite und mehr — kuratieren Sie, was Ihnen gehört, wählen Sie einen Zitierstil und exportieren Sie als PDF, DOCX, LaTeX oder Markdown.",
    step1: "Melden Sie sich mit Ihrer ORCID iD an.",
    step2: "Publikationen werden automatisch aus OpenAlex befüllt.",
    step3: "Kuratieren, gestalten und exportieren — oder eine lebende Seite veröffentlichen.",
    signInTitle: "Anmelden",
    signInSub: "Kostenlos für Einzelpersonen · quelloffen",
    signInOrcid: "Mit ORCID anmelden",
    orcidTrust:
      "Wir lesen nur Ihren öffentlichen ORCID-Eintrag — wir posten und schreiben nie etwas zurück.",
    orDivider: "oder",
    continueGoogle: "Mit Google fortfahren",
    emailPlaceholder: "sie@universitaet.edu",
    emailButton: "E-Mail-Link",
    emailLabel: "E-Mail-Adresse",
    emailFieldLabel: "E-Mail-Adresse",
    emailHelper: "Wir senden Ihnen einen einmaligen Anmeldelink — ganz ohne Passwort.",
    signingIn: "Anmeldung läuft…",
    checkInboxTitle: "Prüfen Sie Ihren Posteingang",
    checkInboxBody:
      "Wir haben einen einmaligen Anmeldelink an Ihre E-Mail-Adresse gesendet. Öffnen Sie ihn auf diesem Gerät, um die Anmeldung abzuschließen. Der Link läuft bald ab; Sie können diesen Tab schließen.",
    authError: {
      metaTitle: "Anmeldeproblem",
      intro: "Wir konnten Ihre Anmeldung nicht abschließen.",
      messages: {
        Configuration:
          "Die Anmeldung ist auf unserer Seite vorübergehend falsch konfiguriert. Bitte versuchen Sie es gleich erneut.",
        AccessDenied:
          "Die Anmeldung wurde abgebrochen oder der Zugriff wurde nicht gewährt. Sie können es jederzeit erneut versuchen.",
        Verification:
          "Dieser Anmeldelink ist abgelaufen oder wurde bereits verwendet. Fordern Sie einen neuen Link an und versuchen Sie es erneut.",
        OAuthSignin:
          "Wir konnten den Anmeldeanbieter nicht erreichen. Das ist meist vorübergehend — bitte versuchen Sie es erneut.",
        OAuthCallback:
          "Beim Abschließen der Anmeldung ist etwas schiefgegangen (oft eine abgelaufene oder unterbrochene Anfrage). Bitte versuchen Sie es erneut.",
        Default: "Bei der Anmeldung ist etwas schiefgegangen. Bitte versuchen Sie es erneut.",
      },
      tryAgain: "Erneut versuchen",
      useOrcidHint: "Die Anmeldung mit Ihrer ORCID iD ist die zuverlässigste Option.",
      backHome: "Zurück zur Startseite",
    },
    fineprint:
      "Quelloffen · Apache-2.0. SigmaCV liest nur öffentliche Forschungsmetadaten und protokolliert Ihre Entscheidungen niemals ohne ausdrückliche Einwilligung.",
    about: "Über",
    footer: "© SigmaCV · quelloffen",
    languageLabel: "Sprache",
    ctaBuild: "Meinen Lebenslauf erstellen",
    featuresTitle: "Alles in einem kanonischen Lebenslauf",
    features: [
      {
        title: "Aus offenen Daten importiert",
        body: "Publikationen, Metriken und Förderungen aus OpenAlex und ORCID importiert — ohne Copy-Paste.",
      },
      {
        title: "Ein Objekt, jedes Format",
        body: "Ein einziger kanonischer Lebenslauf erzeugt über CSL überall identische Zitate.",
      },
      {
        title: "Hervorhebung per Kennung",
        body: "Ihr Name wird per ORCID-/OpenAlex-ID hervorgehoben — nie per Namenszeichenkette.",
      },
      {
        title: "58 Layouts per Klick",
        body: "Layouts für Förderer, Institutionen und Industrie — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC und ein ICH-GCP-Prüfer-Lebenslauf.",
      },
      {
        title: "Überall exportieren",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé und ein NIH biosketch.",
      },
      {
        title: "Lebende öffentliche Seite",
        body: "Veröffentlichen Sie eine maschinenlesbare Seite, die sich mit dem offenen Nachweis neu synchronisiert. Zehn Sprachen.",
      },
      {
        title: "Metriken, verantwortungsvoll",
        body: "Optionale, feldnormierte Metriken — standardmäßig keine, DORA-konform.",
      },
    ],
    trustTitle: "Warum SigmaCV",
    trust: [
      { title: "Kostenlos", body: "Für Einzelne, immer." },
      { title: "Privat", body: "Ihre Daten, Ihre Kontrolle." },
      { title: "Open Source", body: "Apache-2.0, prüfbar." },
      { title: "Verantwortungsvoll", body: "Opt-in-Metriken, DORA-konform." },
    ],
    creatorTitle: "Von einem Forscher für Forschende gebaut",
    creatorBody:
      "Erstellt von Basile Chrétien (PharmD, MSc, MPH) als gemeinnützige offene Infrastruktur für verantwortungsvolle Forschungsbewertung.",
    exploreTitle: "Entdecken",
    exploreOrcid: "Machen Sie aus Ihrer ORCID iD einen Lebenslauf",
    exploreNih: "Erstellen Sie ein NIH biosketch",
  },
  "ja-JP": {
    metaTitle: "SigmaCV — ORCID と OpenAlex から作る無料の研究者 CV ジェネレーター",
    metaDescription:
      "ORCID と OpenAlex から整った学術 CV を自動生成。引用スタイルを選び、自分の業績を整理し、PDF・DOCX・LaTeX・Markdown に書き出せます。無料・オープンソース。",
    eyebrow: "責任ある研究評価のためのオープンインフラ",
    heroTitle: "あなたの学術 CV を、公開された研究記録から自動生成。",
    heroSub:
      "OpenAlex・ORCID・Crossref・DataCite など複数のオープンソースから、整って自由に編集できる CV を生成——自分の業績を整理し、引用スタイルを選び、PDF・DOCX・LaTeX・Markdown に書き出せます。",
    step1: "ORCID iD でサインインします。",
    step2: "論文が OpenAlex から自動的に取り込まれます。",
    step3: "整理・スタイル設定・書き出し——または更新され続けるページを公開。",
    signInTitle: "サインイン",
    signInSub: "個人は無料 · オープンソース",
    signInOrcid: "ORCID でサインイン",
    orcidTrust: "公開されている ORCID の記録を読み取るだけです。投稿も書き込みも一切行いません。",
    orDivider: "または",
    continueGoogle: "Google で続行",
    emailPlaceholder: "you@university.edu",
    emailButton: "メールリンク",
    emailLabel: "メールアドレス",
    emailFieldLabel: "メールアドレス",
    emailHelper: "一度だけ使えるサインインリンクをメールで送ります——パスワードは不要です。",
    signingIn: "サインインしています…",
    checkInboxTitle: "メールをご確認ください",
    checkInboxBody:
      "一度だけ使えるサインインリンクをメールでお送りしました。サインインを完了するには、この端末でリンクを開いてください。リンクはまもなく失効します。このタブは閉じてかまいません。",
    authError: {
      metaTitle: "サインインの問題",
      intro: "サインインを完了できませんでした。",
      messages: {
        Configuration:
          "現在こちら側でサインインの設定に一時的な不具合があります。しばらくしてからもう一度お試しください。",
        AccessDenied:
          "サインインがキャンセルされたか、アクセスが許可されませんでした。準備ができたらもう一度お試しください。",
        Verification:
          "このサインインリンクは有効期限切れか、すでに使用されています。新しいリンクを取得してもう一度お試しください。",
        OAuthSignin:
          "サインインプロバイダーに接続できませんでした。多くの場合は一時的な問題です——もう一度お試しください。",
        OAuthCallback:
          "サインインの完了中に問題が発生しました（多くはリクエストの期限切れや中断によるものです）。もう一度お試しください。",
        Default: "サインイン中に問題が発生しました。もう一度お試しください。",
      },
      tryAgain: "もう一度試す",
      useOrcidHint: "ORCID iD でのサインインが最も確実です。",
      backHome: "ホームに戻る",
    },
    fineprint:
      "オープンソース · Apache-2.0。SigmaCV は公開された研究メタデータのみを読み取り、明示的な同意なしにあなたの選択を記録することはありません。",
    about: "概要",
    footer: "© SigmaCV · オープンソース",
    languageLabel: "言語",
    ctaBuild: "CVを作成",
    featuresTitle: "すべてを一つの正規化 CV に",
    features: [
      {
        title: "オープンデータから自動取得",
        body: "論文・指標・研究費を OpenAlex と ORCID から取り込み——コピペ不要。",
      },
      {
        title: "一つのオブジェクトで全形式に",
        body: "単一の正規化 CV が CSL によりどこでも同一の引用を生成します。",
      },
      {
        title: "識別子でハイライト",
        body: "お名前は ORCID / OpenAlex ID でハイライト——名前の文字列では行いません。",
      },
      {
        title: "58 種のワンクリックレイアウト",
        body: "助成機関・機関・産業向けの CV レイアウト——UKRI R4RI、Royal Society、SNSF、NIH、NSF、ERC、ICH-GCP 治験責任医師 CV。",
      },
      {
        title: "どこへでも書き出し",
        body: "PDF、DOCX、LaTeX、Markdown、BibTeX、CSL-JSON、JSON Résumé、NIH biosketch。",
      },
      {
        title: "更新され続ける公開ページ",
        body: "公開記録から再同期する機械可読なページを公開。十言語対応。",
      },
      {
        title: "責任ある指標",
        body: "オプトインかつ分野で正規化された指標——既定では非表示、DORA に準拠。",
      },
    ],
    trustTitle: "SigmaCV を選ぶ理由",
    trust: [
      { title: "無料", body: "個人はずっと無料。" },
      { title: "プライバシー", body: "データはあなたの管理下に。" },
      { title: "オープンソース", body: "Apache-2.0、検証可能。" },
      { title: "責任ある評価", body: "任意・DORA準拠の指標。" },
    ],
    creatorTitle: "研究者が、研究者のために作りました",
    creatorBody:
      "責任ある研究評価のための非営利のオープンインフラとして、Basile Chrétien（PharmD, MSc, MPH）が制作しました。",
    exploreTitle: "さらに見る",
    exploreOrcid: "ORCID iD を CV にする",
    exploreNih: "NIH biosketch を生成する",
  },
  "pt-BR": {
    metaTitle: "SigmaCV — Gerador gratuito de currículo acadêmico a partir de ORCID e OpenAlex",
    metaDescription:
      "Gere automaticamente um currículo acadêmico limpo a partir de ORCID e OpenAlex. Escolha um estilo de citação, organize o que é seu e exporte para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
    eyebrow: "Infraestrutura aberta para avaliação responsável da pesquisa",
    heroTitle:
      "Seu currículo acadêmico, gerado automaticamente a partir do registro científico aberto.",
    heroSub:
      "Currículos limpos e personalizáveis gerados a partir de OpenAlex, ORCID, Crossref, DataCite e mais — organize o que é seu, escolha um estilo de citação e exporte para PDF, DOCX, LaTeX ou Markdown.",
    step1: "Entre com o seu iD ORCID.",
    step2: "As publicações são preenchidas automaticamente a partir do OpenAlex.",
    step3: "Organize, estilize e exporte — ou publique uma página viva.",
    signInTitle: "Entrar",
    signInSub: "Gratuito para indivíduos · código aberto",
    signInOrcid: "Entrar com ORCID",
    orcidTrust: "Lemos apenas seu registro público do ORCID — nunca publicamos nem gravamos nada.",
    orDivider: "ou",
    continueGoogle: "Continuar com o Google",
    emailPlaceholder: "voce@universidade.edu",
    emailButton: "Link por e-mail",
    emailLabel: "Endereço de e-mail",
    emailFieldLabel: "Endereço de e-mail",
    emailHelper: "Enviaremos um link de acesso de uso único por e-mail — sem necessidade de senha.",
    signingIn: "Entrando…",
    checkInboxTitle: "Verifique sua caixa de entrada",
    checkInboxBody:
      "Enviamos um link de acesso de uso único para o seu e-mail. Abra-o neste dispositivo para concluir o login. O link expira em breve; você pode fechar esta aba.",
    authError: {
      metaTitle: "Problema ao entrar",
      intro: "Não conseguimos concluir o seu login.",
      messages: {
        Configuration:
          "O login está temporariamente mal configurado do nosso lado. Tente novamente em instantes.",
        AccessDenied:
          "O login foi cancelado ou o acesso não foi concedido. Você pode tentar novamente quando quiser.",
        Verification:
          "Esse link de acesso expirou ou já foi usado. Solicite um novo link e tente de novo.",
        OAuthSignin:
          "Não conseguimos contatar o provedor de login. Costuma ser temporário — tente novamente.",
        OAuthCallback:
          "Algo deu errado ao concluir o login (muitas vezes uma solicitação expirada ou interrompida). Tente novamente.",
        Default: "Algo deu errado ao entrar. Tente novamente.",
      },
      tryAgain: "Tentar novamente",
      useOrcidHint: "Entrar com o seu iD ORCID é a opção mais confiável.",
      backHome: "Voltar para o início",
    },
    fineprint:
      "Código aberto · Apache-2.0. O SigmaCV lê apenas metadados públicos de pesquisa e nunca registra suas escolhas sem consentimento explícito.",
    about: "Sobre",
    footer: "© SigmaCV · código aberto",
    languageLabel: "Idioma",
    ctaBuild: "Criar meu CV",
    featuresTitle: "Tudo em um único currículo canônico",
    features: [
      {
        title: "Importado de dados abertos",
        body: "Publicações, métricas e financiamentos importados do OpenAlex e do ORCID — sem copiar e colar.",
      },
      {
        title: "Um objeto, todos os formatos",
        body: "Um único currículo canônico gera citações idênticas em todos os lugares via CSL.",
      },
      {
        title: "Destacado por identificador",
        body: "Seu nome é destacado por ID do ORCID / OpenAlex — nunca pela cadeia do nome.",
      },
      {
        title: "58 layouts com um clique",
        body: "Layouts de currículo de financiadores, instituições e indústria — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC e um currículo de investigador ICH-GCP.",
      },
      {
        title: "Exporte para qualquer lugar",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé e um NIH biosketch.",
      },
      {
        title: "Página pública viva",
        body: "Publique uma página legível por máquina que se ressincroniza com o registro aberto. Dez idiomas.",
      },
      {
        title: "Métricas com responsabilidade",
        body: "Métricas opcionais e normalizadas por área — nenhuma por padrão, alinhadas à DORA.",
      },
    ],
    trustTitle: "Por que o SigmaCV",
    trust: [
      { title: "Gratuito", body: "Para indivíduos, sempre." },
      { title: "Privado", body: "Seus dados, seu controle." },
      { title: "Código aberto", body: "Apache-2.0, auditável." },
      { title: "Responsável", body: "Métricas opcionais, alinhadas à DORA." },
    ],
    creatorTitle: "Feito por um pesquisador, para pesquisadores",
    creatorBody:
      "Criado por Basile Chrétien (PharmD, MSc, MPH) como infraestrutura aberta sem fins lucrativos para a avaliação responsável da pesquisa.",
    exploreTitle: "Explorar",
    exploreOrcid: "Transforme seu iD ORCID em um currículo",
    exploreNih: "Gere um NIH biosketch",
  },
  "it-IT": {
    metaTitle: "SigmaCV — Generatore gratuito di CV accademici da ORCID e OpenAlex",
    metaDescription:
      "Genera automaticamente un CV accademico ordinato da ORCID e OpenAlex. Scegli uno stile di citazione, seleziona ciò che è tuo ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
    eyebrow: "Infrastruttura aperta per una valutazione responsabile della ricerca",
    heroTitle: "Il tuo CV accademico, generato automaticamente dal registro scientifico aperto.",
    heroSub:
      "CV ordinati e personalizzabili generati da OpenAlex, ORCID, Crossref, DataCite e altro ancora — seleziona ciò che è tuo, scegli uno stile di citazione ed esporta in PDF, DOCX, LaTeX o Markdown.",
    step1: "Accedi con il tuo iD ORCID.",
    step2: "Le pubblicazioni si popolano automaticamente da OpenAlex.",
    step3: "Seleziona, applica uno stile ed esporta — o pubblica una pagina viva.",
    signInTitle: "Accedi",
    signInSub: "Gratuito per i privati · open source",
    signInOrcid: "Accedi con ORCID",
    orcidTrust: "Leggiamo solo il tuo record ORCID pubblico — non pubblichiamo né scriviamo nulla.",
    orDivider: "oppure",
    continueGoogle: "Continua con Google",
    emailPlaceholder: "tu@universita.edu",
    emailButton: "Link via e-mail",
    emailLabel: "Indirizzo e-mail",
    emailFieldLabel: "Indirizzo e-mail",
    emailHelper: "Ti invieremo un link di accesso monouso via e-mail — senza password.",
    signingIn: "Accesso in corso…",
    checkInboxTitle: "Controlla la tua casella di posta",
    checkInboxBody:
      "Abbiamo inviato un link di accesso monouso alla tua e-mail. Aprilo su questo dispositivo per completare l’accesso. Il link scade a breve; puoi chiudere questa scheda.",
    authError: {
      metaTitle: "Problema di accesso",
      intro: "Non siamo riusciti a completare l’accesso.",
      messages: {
        Configuration:
          "L’accesso è temporaneamente configurato male dalla nostra parte. Riprova tra un momento.",
        AccessDenied:
          "L’accesso è stato annullato o non è stato concesso. Puoi riprovare quando vuoi.",
        Verification:
          "Quel link di accesso è scaduto o è già stato usato. Richiedi un nuovo link e riprova.",
        OAuthSignin:
          "Non siamo riusciti a contattare il provider di accesso. Di solito è temporaneo — riprova.",
        OAuthCallback:
          "Qualcosa è andato storto durante il completamento dell’accesso (spesso una richiesta scaduta o interrotta). Riprova.",
        Default: "Qualcosa è andato storto durante l’accesso. Riprova.",
      },
      tryAgain: "Riprova",
      useOrcidHint: "Accedere con il tuo iD ORCID è l’opzione più affidabile.",
      backHome: "Torna alla home",
    },
    fineprint:
      "Open source · Apache-2.0. SigmaCV legge solo metadati di ricerca pubblici e non registra mai le tue scelte senza consenso esplicito.",
    about: "Informazioni",
    footer: "© SigmaCV · open source",
    languageLabel: "Lingua",
    ctaBuild: "Crea il mio CV",
    featuresTitle: "Tutto in un unico CV canonico",
    features: [
      {
        title: "Importato da dati aperti",
        body: "Pubblicazioni, metriche e finanziamenti importati da OpenAlex e ORCID — senza copia-incolla.",
      },
      {
        title: "Un oggetto, ogni formato",
        body: "Un unico CV canonico genera citazioni identiche ovunque tramite CSL.",
      },
      {
        title: "Evidenziato per identificativo",
        body: "Il tuo nome è evidenziato per ID ORCID / OpenAlex — mai per la stringa del nome.",
      },
      {
        title: "58 layout con un clic",
        body: "Layout di CV per enti finanziatori, istituzioni e industria — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC e un CV di sperimentatore ICH-GCP.",
      },
      {
        title: "Esporta ovunque",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé e un NIH biosketch.",
      },
      {
        title: "Pagina pubblica viva",
        body: "Pubblica una pagina leggibile dalle macchine che si risincronizza con il registro aperto. Dieci lingue.",
      },
      {
        title: "Metriche, responsabilmente",
        body: "Metriche facoltative e normalizzate per disciplina — nessuna per impostazione predefinita, in linea con DORA.",
      },
    ],
    trustTitle: "Perché SigmaCV",
    trust: [
      { title: "Gratis", body: "Per i singoli, sempre." },
      { title: "Privato", body: "I tuoi dati, il tuo controllo." },
      { title: "Open source", body: "Apache-2.0, verificabile." },
      { title: "Responsabile", body: "Metriche facoltative, in linea con DORA." },
    ],
    creatorTitle: "Creato da un ricercatore, per i ricercatori",
    creatorBody:
      "Creato da Basile Chrétien (PharmD, MSc, MPH) come infrastruttura aperta senza scopo di lucro per una valutazione responsabile della ricerca.",
    exploreTitle: "Esplora",
    exploreOrcid: "Trasforma il tuo iD ORCID in un CV",
    exploreNih: "Genera un NIH biosketch",
  },
  "ko-KR": {
    metaTitle: "SigmaCV — ORCID와 OpenAlex로 만드는 무료 학술 CV 생성기",
    metaDescription:
      "ORCID와 OpenAlex에서 깔끔한 학술 CV를 자동 생성하세요. 인용 스타일을 선택하고, 본인의 업적을 정리하고, PDF·DOCX·LaTeX·Markdown으로 내보내세요. 무료 오픈소스.",
    eyebrow: "책임 있는 연구 평가를 위한 오픈 인프라",
    heroTitle: "공개된 연구 기록에서 자동으로 만드는 나의 학술 CV.",
    heroSub:
      "OpenAlex·ORCID·Crossref·DataCite 등에서 생성되는 깔끔하고 맞춤형 CV — 본인의 업적을 정리하고, 인용 스타일을 선택하고, PDF·DOCX·LaTeX·Markdown으로 내보내세요.",
    step1: "ORCID iD로 로그인하세요.",
    step2: "논문이 OpenAlex에서 자동으로 채워집니다.",
    step3: "정리하고, 스타일을 지정하고, 내보내거나 — 지속 갱신되는 페이지를 공개하세요.",
    signInTitle: "로그인",
    signInSub: "개인 무료 · 오픈소스",
    signInOrcid: "ORCID로 로그인",
    orcidTrust: "공개된 ORCID 기록만 읽습니다. 게시하거나 무언가를 기록하는 일은 없습니다.",
    orDivider: "또는",
    continueGoogle: "Google로 계속하기",
    emailPlaceholder: "you@university.edu",
    emailButton: "이메일 링크",
    emailLabel: "이메일 주소",
    emailFieldLabel: "이메일 주소",
    emailHelper: "일회용 로그인 링크를 이메일로 보내드립니다 — 비밀번호가 필요 없습니다.",
    signingIn: "로그인 중…",
    checkInboxTitle: "이메일을 확인하세요",
    checkInboxBody:
      "일회용 로그인 링크를 이메일로 보냈습니다. 로그인을 완료하려면 이 기기에서 링크를 여세요. 링크는 곧 만료됩니다. 이 탭은 닫아도 됩니다.",
    authError: {
      metaTitle: "로그인 문제",
      intro: "로그인을 완료하지 못했습니다.",
      messages: {
        Configuration:
          "현재 저희 측 로그인 설정에 일시적인 문제가 있습니다. 잠시 후 다시 시도하세요.",
        AccessDenied:
          "로그인이 취소되었거나 접근이 허용되지 않았습니다. 원하실 때 다시 시도하세요.",
        Verification:
          "해당 로그인 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해 다시 시도하세요.",
        OAuthSignin:
          "로그인 제공자에 연결하지 못했습니다. 보통 일시적인 문제입니다 — 다시 시도하세요.",
        OAuthCallback:
          "로그인을 완료하는 중 문제가 발생했습니다(대개 요청이 만료되었거나 중단된 경우입니다). 다시 시도하세요.",
        Default: "로그인 중 문제가 발생했습니다. 다시 시도하세요.",
      },
      tryAgain: "다시 시도",
      useOrcidHint: "ORCID iD로 로그인하는 것이 가장 안정적입니다.",
      backHome: "홈으로 돌아가기",
    },
    fineprint:
      "오픈소스 · Apache-2.0. SigmaCV는 공개된 연구 메타데이터만 읽으며, 명시적 동의 없이 회원님의 선택을 기록하지 않습니다.",
    about: "소개",
    footer: "© SigmaCV · 오픈소스",
    languageLabel: "언어",
    ctaBuild: "내 CV 만들기",
    featuresTitle: "하나의 정규화된 CV에 모두",
    features: [
      {
        title: "오픈 데이터에서 자동 수집",
        body: "논문·지표·연구비를 OpenAlex와 ORCID에서 가져옵니다 — 복사·붙여넣기 불필요.",
      },
      {
        title: "하나의 객체, 모든 형식",
        body: "단일 정규화 CV가 CSL을 통해 어디서나 동일한 인용을 생성합니다.",
      },
      {
        title: "식별자로 강조",
        body: "이름은 ORCID / OpenAlex ID로 강조됩니다 — 이름 문자열로는 절대 하지 않습니다.",
      },
      {
        title: "58가지 원클릭 레이아웃",
        body: "지원기관·기관·산업용 CV 레이아웃 — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC 및 ICH-GCP 시험자 CV.",
      },
      {
        title: "어디로든 내보내기",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé 및 NIH biosketch.",
      },
      {
        title: "지속 갱신되는 공개 페이지",
        body: "공개 기록에서 재동기화되는 기계 판독 가능 페이지를 게시하세요. 10개 언어.",
      },
      { title: "책임 있는 지표", body: "선택형, 분야 정규화 지표 — 기본값은 없음, DORA에 부합." },
    ],
    trustTitle: "왜 SigmaCV인가",
    trust: [
      { title: "무료", body: "개인은 항상 무료." },
      { title: "프라이버시", body: "내 데이터, 내 통제." },
      { title: "오픈 소스", body: "Apache-2.0, 감사 가능." },
      { title: "책임 있는 평가", body: "선택적, DORA 정렬 지표." },
    ],
    creatorTitle: "연구자가 연구자를 위해 만들었습니다",
    creatorBody:
      "책임 있는 연구 평가를 위한 비영리 오픈 인프라로서 Basile Chrétien(PharmD, MSc, MPH)이 만들었습니다.",
    exploreTitle: "더 알아보기",
    exploreOrcid: "ORCID iD를 CV로 만들기",
    exploreNih: "NIH biosketch 생성하기",
  },
  "ru-RU": {
    metaTitle: "SigmaCV — Бесплатный генератор академических CV из ORCID и OpenAlex",
    metaDescription:
      "Автоматически создавайте аккуратное академическое резюме из ORCID и OpenAlex. Выберите стиль цитирования, отберите свои работы и экспортируйте в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым кодом.",
    eyebrow: "Открытая инфраструктура для ответственной оценки исследований",
    heroTitle: "Ваше академическое резюме, автоматически собранное из открытых научных записей.",
    heroSub:
      "Аккуратные настраиваемые резюме на основе OpenAlex, ORCID, Crossref, DataCite и других источников — отберите свои работы, выберите стиль цитирования и экспортируйте в PDF, DOCX, LaTeX или Markdown.",
    step1: "Войдите с помощью вашего ORCID iD.",
    step2: "Публикации автоматически загружаются из OpenAlex.",
    step3: "Отберите, оформите и экспортируйте — или опубликуйте живую страницу.",
    signInTitle: "Войти",
    signInSub: "Бесплатно для частных лиц · открытый код",
    signInOrcid: "Войти через ORCID",
    orcidTrust:
      "Мы только читаем ваш публичный профиль ORCID — ничего не публикуем и не записываем.",
    orDivider: "или",
    continueGoogle: "Продолжить с Google",
    emailPlaceholder: "you@university.edu",
    emailButton: "Ссылка по эл. почте",
    emailLabel: "Адрес эл. почты",
    emailFieldLabel: "Адрес эл. почты",
    emailHelper: "Мы отправим вам одноразовую ссылку для входа — пароль не нужен.",
    signingIn: "Выполняется вход…",
    checkInboxTitle: "Проверьте почту",
    checkInboxBody:
      "Мы отправили одноразовую ссылку для входа на вашу почту. Откройте её на этом устройстве, чтобы завершить вход. Ссылка скоро истечёт; эту вкладку можно закрыть.",
    authError: {
      metaTitle: "Проблема со входом",
      intro: "Не удалось завершить вход.",
      messages: {
        Configuration:
          "Вход временно настроен неправильно на нашей стороне. Пожалуйста, повторите попытку через мгновение.",
        AccessDenied:
          "Вход был отменён или доступ не предоставлен. Вы можете повторить попытку в любое время.",
        Verification:
          "Срок действия этой ссылки для входа истёк, или она уже использована. Запросите новую ссылку и повторите попытку.",
        OAuthSignin:
          "Не удалось связаться с поставщиком входа. Обычно это временно — пожалуйста, повторите попытку.",
        OAuthCallback:
          "При завершении входа произошла ошибка (часто из-за истёкшего или прерванного запроса). Пожалуйста, повторите попытку.",
        Default: "При входе произошла ошибка. Пожалуйста, повторите попытку.",
      },
      tryAgain: "Повторить попытку",
      useOrcidHint: "Вход через ваш ORCID iD — самый надёжный вариант.",
      backHome: "На главную",
    },
    fineprint:
      "Открытый код · Apache-2.0. SigmaCV читает только публичные метаданные исследований и никогда не записывает ваши действия без явного согласия.",
    about: "О проекте",
    footer: "© SigmaCV · открытый код",
    languageLabel: "Язык",
    ctaBuild: "Создать резюме",
    featuresTitle: "Всё в одном каноническом резюме",
    features: [
      {
        title: "Импорт из открытых данных",
        body: "Публикации, метрики и гранты импортируются из OpenAlex и ORCID — без копирования.",
      },
      {
        title: "Один объект, любой формат",
        body: "Единое каноническое резюме формирует одинаковые ссылки везде через CSL.",
      },
      {
        title: "Выделение по идентификатору",
        body: "Ваше имя выделяется по идентификатору ORCID / OpenAlex — никогда по строке имени.",
      },
      {
        title: "58 макетов в один клик",
        body: "Макеты резюме для грантодателей, учреждений и индустрии — UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC и резюме исследователя ICH-GCP.",
      },
      {
        title: "Экспорт куда угодно",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé и NIH biosketch.",
      },
      {
        title: "Живая публичная страница",
        body: "Опубликуйте машиночитаемую страницу, которая повторно синхронизируется с открытыми научными записями. Десять языков.",
      },
      {
        title: "Метрики — ответственно",
        body: "Подключаемые, нормированные по области метрики — по умолчанию нет, в соответствии с DORA.",
      },
    ],
    trustTitle: "Почему SigmaCV",
    trust: [
      { title: "Бесплатно", body: "Для частных лиц, всегда." },
      { title: "Приватно", body: "Ваши данные под вашим контролем." },
      { title: "Открытый код", body: "Apache-2.0, можно проверить." },
      { title: "Ответственно", body: "Метрики по желанию, по принципам DORA." },
    ],
    creatorTitle: "Создано исследователем для исследователей",
    creatorBody:
      "Создано Basile Chrétien (PharmD, MSc, MPH) как некоммерческая открытая инфраструктура для ответственной оценки исследований.",
    exploreTitle: "Узнать больше",
    exploreOrcid: "Превратите свой ORCID iD в резюме",
    exploreNih: "Сгенерируйте NIH biosketch",
  },
};

/** Localized landing-page copy (falls back to English for unknown locales). */
export function landingStrings(locale: string): LandingStrings {
  return LANDING_I18N[asLocale(locale)];
}
