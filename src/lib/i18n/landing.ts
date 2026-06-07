import { asLocale, type Locale } from "./index";

/**
 * Marketing/landing-page copy, localized for the public homepage. Kept separate
 * from the editor "chrome" dictionary (high cohesion): this is the only
 * crawlable, user-facing-before-login surface, so its strings double as the
 * localized SEO title/description for each `/[locale]` variant.
 */
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
  orDivider: string;
  continueGoogle: string;
  emailPlaceholder: string;
  emailButton: string;
  /** Accessible name for the email sign-in input (placeholder is not a label). */
  emailLabel: string;
  fineprint: string;
  about: string;
  footer: string;
  languageLabel: string;
}

const LANDING_I18N: Record<Locale, LandingStrings> = {
  "en-US": {
    metaTitle: "SigmaCV — Free academic CV generator from ORCID & OpenAlex",
    metaDescription:
      "Auto-generate a clean academic CV from ORCID and OpenAlex. Pick a citation style, curate what’s yours, and export to PDF, DOCX, LaTeX or Markdown. Free and open source.",
    eyebrow: "Open infrastructure for responsible research assessment",
    heroTitle: "Your academic CV, auto-built from the open research record.",
    heroSub:
      "Clean, customizable CVs generated from OpenAlex, ORCID, Crossref and DataCite — curate what’s yours, pick a citation style, and export to PDF, DOCX, LaTeX or Markdown.",
    step1: "Sign in with your ORCID iD.",
    step2: "Publications populate automatically from OpenAlex.",
    step3: "Curate, style, and export — or publish a living page.",
    signInTitle: "Sign in",
    signInSub: "Free for individuals · open source",
    signInOrcid: "Sign in with ORCID",
    orDivider: "or",
    continueGoogle: "Continue with Google",
    emailPlaceholder: "you@university.edu",
    emailButton: "Email link",
    emailLabel: "Email address",
    fineprint:
      "Open source · Apache-2.0. SigmaCV reads only public research metadata and never logs your choices without explicit consent.",
    about: "About",
    footer: "© SigmaCV · open source",
    languageLabel: "Language",
  },
  "zh-CN": {
    metaTitle: "SigmaCV — 基于 ORCID 和 OpenAlex 的免费学术简历生成器",
    metaDescription:
      "根据 ORCID 和 OpenAlex 自动生成简洁的学术简历。选择引用样式，整理属于您的成果，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
    eyebrow: "面向负责任研究评价的开放基础设施",
    heroTitle: "您的学术简历，依据公开学术记录自动生成。",
    heroSub:
      "依据 OpenAlex、ORCID、Crossref 和 DataCite 生成简洁、可定制的简历——整理属于您的成果，选择引用样式，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
    step1: "使用您的 ORCID iD 登录。",
    step2: "论文将自动从 OpenAlex 填充。",
    step3: "整理、设置样式并导出——或发布一个持续更新的页面。",
    signInTitle: "登录",
    signInSub: "个人免费 · 开源",
    signInOrcid: "使用 ORCID 登录",
    orDivider: "或",
    continueGoogle: "使用 Google 继续",
    emailPlaceholder: "you@university.edu",
    emailButton: "邮件链接",
    emailLabel: "电子邮件地址",
    fineprint:
      "开源 · Apache-2.0。SigmaCV 仅读取公开的研究元数据，未经明确同意绝不记录您的选择。",
    about: "关于",
    footer: "© SigmaCV · 开源",
    languageLabel: "语言",
  },
  "es-ES": {
    metaTitle: "SigmaCV — Generador gratuito de CV académicos desde ORCID y OpenAlex",
    metaDescription:
      "Genera automáticamente un CV académico limpio desde ORCID y OpenAlex. Elige un estilo de cita, selecciona lo que es tuyo y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
    eyebrow: "Infraestructura abierta para una evaluación responsable de la investigación",
    heroTitle: "Tu CV académico, generado automáticamente desde el registro científico abierto.",
    heroSub:
      "CV limpios y personalizables generados desde OpenAlex, ORCID, Crossref y DataCite: selecciona lo que es tuyo, elige un estilo de cita y exporta a PDF, DOCX, LaTeX o Markdown.",
    step1: "Inicia sesión con tu iD ORCID.",
    step2: "Las publicaciones se rellenan automáticamente desde OpenAlex.",
    step3: "Selecciona, da estilo y exporta, o publica una página viva.",
    signInTitle: "Iniciar sesión",
    signInSub: "Gratis para particulares · código abierto",
    signInOrcid: "Iniciar sesión con ORCID",
    orDivider: "o",
    continueGoogle: "Continuar con Google",
    emailPlaceholder: "tu@universidad.edu",
    emailButton: "Enlace por correo",
    emailLabel: "Correo electrónico",
    fineprint:
      "Código abierto · Apache-2.0. SigmaCV solo lee metadatos públicos de investigación y nunca registra tus decisiones sin consentimiento explícito.",
    about: "Acerca de",
    footer: "© SigmaCV · código abierto",
    languageLabel: "Idioma",
  },
  "fr-FR": {
    metaTitle: "SigmaCV — Générateur gratuit de CV académique depuis ORCID et OpenAlex",
    metaDescription:
      "Générez automatiquement un CV académique soigné depuis ORCID et OpenAlex. Choisissez un style de citation, sélectionnez ce qui est à vous et exportez en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
    eyebrow: "Infrastructure ouverte pour une évaluation responsable de la recherche",
    heroTitle: "Votre CV académique, généré automatiquement à partir du dossier scientifique ouvert.",
    heroSub:
      "Des CV soignés et personnalisables générés depuis OpenAlex, ORCID, Crossref et DataCite — sélectionnez ce qui est à vous, choisissez un style de citation et exportez en PDF, DOCX, LaTeX ou Markdown.",
    step1: "Connectez-vous avec votre iD ORCID.",
    step2: "Les publications se remplissent automatiquement depuis OpenAlex.",
    step3: "Sélectionnez, mettez en forme et exportez — ou publiez une page vivante.",
    signInTitle: "Se connecter",
    signInSub: "Gratuit pour les particuliers · open source",
    signInOrcid: "Se connecter avec ORCID",
    orDivider: "ou",
    continueGoogle: "Continuer avec Google",
    emailPlaceholder: "vous@universite.edu",
    emailButton: "Lien par e-mail",
    emailLabel: "Adresse e-mail",
    fineprint:
      "Open source · Apache-2.0. SigmaCV ne lit que des métadonnées de recherche publiques et n’enregistre jamais vos choix sans consentement explicite.",
    about: "À propos",
    footer: "© SigmaCV · open source",
    languageLabel: "Langue",
  },
  "de-DE": {
    metaTitle: "SigmaCV — Kostenloser akademischer Lebenslauf-Generator aus ORCID & OpenAlex",
    metaDescription:
      "Erstellen Sie automatisch einen sauberen akademischen Lebenslauf aus ORCID und OpenAlex. Zitierstil wählen, Eigenes kuratieren und als PDF, DOCX, LaTeX oder Markdown exportieren. Kostenlos und quelloffen.",
    eyebrow: "Offene Infrastruktur für verantwortungsvolle Forschungsbewertung",
    heroTitle: "Ihr akademischer Lebenslauf, automatisch aus dem offenen Forschungsnachweis erstellt.",
    heroSub:
      "Saubere, anpassbare Lebensläufe aus OpenAlex, ORCID, Crossref und DataCite — kuratieren Sie, was Ihnen gehört, wählen Sie einen Zitierstil und exportieren Sie als PDF, DOCX, LaTeX oder Markdown.",
    step1: "Melden Sie sich mit Ihrer ORCID iD an.",
    step2: "Publikationen werden automatisch aus OpenAlex befüllt.",
    step3: "Kuratieren, gestalten und exportieren — oder eine lebende Seite veröffentlichen.",
    signInTitle: "Anmelden",
    signInSub: "Kostenlos für Einzelpersonen · quelloffen",
    signInOrcid: "Mit ORCID anmelden",
    orDivider: "oder",
    continueGoogle: "Mit Google fortfahren",
    emailPlaceholder: "sie@universitaet.edu",
    emailButton: "E-Mail-Link",
    emailLabel: "E-Mail-Adresse",
    fineprint:
      "Quelloffen · Apache-2.0. SigmaCV liest nur öffentliche Forschungsmetadaten und protokolliert Ihre Entscheidungen niemals ohne ausdrückliche Einwilligung.",
    about: "Über",
    footer: "© SigmaCV · quelloffen",
    languageLabel: "Sprache",
  },
  "ja-JP": {
    metaTitle: "SigmaCV — ORCID と OpenAlex から作る無料の研究者 CV ジェネレーター",
    metaDescription:
      "ORCID と OpenAlex から整った学術 CV を自動生成。引用スタイルを選び、自分の業績を整理し、PDF・DOCX・LaTeX・Markdown に書き出せます。無料・オープンソース。",
    eyebrow: "責任ある研究評価のためのオープンインフラ",
    heroTitle: "あなたの学術 CV を、公開された研究記録から自動生成。",
    heroSub:
      "OpenAlex・ORCID・Crossref・DataCite から、整って自由に編集できる CV を生成——自分の業績を整理し、引用スタイルを選び、PDF・DOCX・LaTeX・Markdown に書き出せます。",
    step1: "ORCID iD でサインインします。",
    step2: "論文が OpenAlex から自動的に取り込まれます。",
    step3: "整理・スタイル設定・書き出し——または更新され続けるページを公開。",
    signInTitle: "サインイン",
    signInSub: "個人は無料 · オープンソース",
    signInOrcid: "ORCID でサインイン",
    orDivider: "または",
    continueGoogle: "Google で続行",
    emailPlaceholder: "you@university.edu",
    emailButton: "メールリンク",
    emailLabel: "メールアドレス",
    fineprint:
      "オープンソース · Apache-2.0。SigmaCV は公開された研究メタデータのみを読み取り、明示的な同意なしにあなたの選択を記録することはありません。",
    about: "概要",
    footer: "© SigmaCV · オープンソース",
    languageLabel: "言語",
  },
  "pt-BR": {
    metaTitle: "SigmaCV — Gerador gratuito de currículo acadêmico a partir de ORCID e OpenAlex",
    metaDescription:
      "Gere automaticamente um currículo acadêmico limpo a partir de ORCID e OpenAlex. Escolha um estilo de citação, organize o que é seu e exporte para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
    eyebrow: "Infraestrutura aberta para avaliação responsável da pesquisa",
    heroTitle: "Seu currículo acadêmico, gerado automaticamente a partir do registro científico aberto.",
    heroSub:
      "Currículos limpos e personalizáveis gerados a partir de OpenAlex, ORCID, Crossref e DataCite — organize o que é seu, escolha um estilo de citação e exporte para PDF, DOCX, LaTeX ou Markdown.",
    step1: "Entre com o seu iD ORCID.",
    step2: "As publicações são preenchidas automaticamente a partir do OpenAlex.",
    step3: "Organize, estilize e exporte — ou publique uma página viva.",
    signInTitle: "Entrar",
    signInSub: "Gratuito para indivíduos · código aberto",
    signInOrcid: "Entrar com ORCID",
    orDivider: "ou",
    continueGoogle: "Continuar com o Google",
    emailPlaceholder: "voce@universidade.edu",
    emailButton: "Link por e-mail",
    emailLabel: "Endereço de e-mail",
    fineprint:
      "Código aberto · Apache-2.0. O SigmaCV lê apenas metadados públicos de pesquisa e nunca registra suas escolhas sem consentimento explícito.",
    about: "Sobre",
    footer: "© SigmaCV · código aberto",
    languageLabel: "Idioma",
  },
  "it-IT": {
    metaTitle: "SigmaCV — Generatore gratuito di CV accademici da ORCID e OpenAlex",
    metaDescription:
      "Genera automaticamente un CV accademico ordinato da ORCID e OpenAlex. Scegli uno stile di citazione, seleziona ciò che è tuo ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
    eyebrow: "Infrastruttura aperta per una valutazione responsabile della ricerca",
    heroTitle: "Il tuo CV accademico, generato automaticamente dal registro scientifico aperto.",
    heroSub:
      "CV ordinati e personalizzabili generati da OpenAlex, ORCID, Crossref e DataCite — seleziona ciò che è tuo, scegli uno stile di citazione ed esporta in PDF, DOCX, LaTeX o Markdown.",
    step1: "Accedi con il tuo iD ORCID.",
    step2: "Le pubblicazioni si popolano automaticamente da OpenAlex.",
    step3: "Seleziona, applica uno stile ed esporta — o pubblica una pagina viva.",
    signInTitle: "Accedi",
    signInSub: "Gratuito per i privati · open source",
    signInOrcid: "Accedi con ORCID",
    orDivider: "oppure",
    continueGoogle: "Continua con Google",
    emailPlaceholder: "tu@universita.edu",
    emailButton: "Link via e-mail",
    emailLabel: "Indirizzo e-mail",
    fineprint:
      "Open source · Apache-2.0. SigmaCV legge solo metadati di ricerca pubblici e non registra mai le tue scelte senza consenso esplicito.",
    about: "Informazioni",
    footer: "© SigmaCV · open source",
    languageLabel: "Lingua",
  },
  "ko-KR": {
    metaTitle: "SigmaCV — ORCID와 OpenAlex로 만드는 무료 학술 CV 생성기",
    metaDescription:
      "ORCID와 OpenAlex에서 깔끔한 학술 CV를 자동 생성하세요. 인용 스타일을 선택하고, 본인의 업적을 정리하고, PDF·DOCX·LaTeX·Markdown으로 내보내세요. 무료 오픈소스.",
    eyebrow: "책임 있는 연구 평가를 위한 오픈 인프라",
    heroTitle: "공개된 연구 기록에서 자동으로 만드는 나의 학술 CV.",
    heroSub:
      "OpenAlex·ORCID·Crossref·DataCite에서 생성되는 깔끔하고 맞춤형 CV — 본인의 업적을 정리하고, 인용 스타일을 선택하고, PDF·DOCX·LaTeX·Markdown으로 내보내세요.",
    step1: "ORCID iD로 로그인하세요.",
    step2: "논문이 OpenAlex에서 자동으로 채워집니다.",
    step3: "정리하고, 스타일을 지정하고, 내보내거나 — 지속 갱신되는 페이지를 공개하세요.",
    signInTitle: "로그인",
    signInSub: "개인 무료 · 오픈소스",
    signInOrcid: "ORCID로 로그인",
    orDivider: "또는",
    continueGoogle: "Google로 계속하기",
    emailPlaceholder: "you@university.edu",
    emailButton: "이메일 링크",
    emailLabel: "이메일 주소",
    fineprint:
      "오픈소스 · Apache-2.0. SigmaCV는 공개된 연구 메타데이터만 읽으며, 명시적 동의 없이 회원님의 선택을 기록하지 않습니다.",
    about: "소개",
    footer: "© SigmaCV · 오픈소스",
    languageLabel: "언어",
  },
  "ru-RU": {
    metaTitle: "SigmaCV — Бесплатный генератор академических CV из ORCID и OpenAlex",
    metaDescription:
      "Автоматически создавайте аккуратное академическое резюме из ORCID и OpenAlex. Выберите стиль цитирования, отберите свои работы и экспортируйте в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым кодом.",
    eyebrow: "Открытая инфраструктура для ответственной оценки исследований",
    heroTitle: "Ваше академическое резюме, автоматически собранное из открытой научной летописи.",
    heroSub:
      "Аккуратные настраиваемые резюме на основе OpenAlex, ORCID, Crossref и DataCite — отберите свои работы, выберите стиль цитирования и экспортируйте в PDF, DOCX, LaTeX или Markdown.",
    step1: "Войдите с помощью вашего ORCID iD.",
    step2: "Публикации автоматически загружаются из OpenAlex.",
    step3: "Отберите, оформите и экспортируйте — или опубликуйте живую страницу.",
    signInTitle: "Войти",
    signInSub: "Бесплатно для частных лиц · открытый код",
    signInOrcid: "Войти через ORCID",
    orDivider: "или",
    continueGoogle: "Продолжить с Google",
    emailPlaceholder: "you@university.edu",
    emailButton: "Ссылка по эл. почте",
    emailLabel: "Адрес эл. почты",
    fineprint:
      "Открытый код · Apache-2.0. SigmaCV читает только публичные метаданные исследований и никогда не записывает ваши действия без явного согласия.",
    about: "О проекте",
    footer: "© SigmaCV · открытый код",
    languageLabel: "Язык",
  },
};

/** Localized landing-page copy (falls back to English for unknown locales). */
export function landingStrings(locale: string): LandingStrings {
  return LANDING_I18N[asLocale(locale)];
}
