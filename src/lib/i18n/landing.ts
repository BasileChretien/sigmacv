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
  /** Trust line shown directly under the ORCID sign-in button. */
  orcidTrust: string;
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
  /** Header CTA button → sign-in (e.g. "Build my CV"). */
  ctaBuild: string;
  /** Features-showcase section heading. */
  featuresTitle: string;
  /** Concise feature cards (title + one-line body). Same count in every locale. */
  features: { title: string; body: string }[];
  /** Trust / "why SigmaCV" section heading. */
  trustTitle: string;
  /** Trust cards (Free / Privacy-first / Open-source). Same count in every locale. */
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
      { title: "Free", body: "Free for individuals. No ads, no upsells." },
      {
        title: "Privacy-first",
        body: "Your data is yours — per-field publish consent, full export, account deletion (GDPR + Japan APPI). No ads, no data-selling.",
      },
      { title: "Open-source", body: "Apache-2.0 and auditable — read or self-host every line." },
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
      "根据 ORCID 和 OpenAlex 自动生成简洁的学术简历。选择引用样式，整理属于您的成果，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
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
      { title: "免费", body: "对个人免费。无广告，无附加销售。" },
      {
        title: "隐私优先",
        body: "您的数据属于您——逐字段发布同意、完整导出、账户删除（GDPR + 日本 APPI）。无广告，不出售数据。",
      },
      { title: "开源", body: "Apache-2.0 且可审计——可阅读或自行托管每一行代码。" },
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
      { title: "Gratis", body: "Gratis para particulares. Sin anuncios ni ventas adicionales." },
      {
        title: "Privacidad ante todo",
        body: "Tus datos son tuyos — consentimiento de publicación por campo, exportación completa, eliminación de cuenta (RGPD + APPI de Japón). Sin anuncios, sin venta de datos.",
      },
      { title: "Código abierto", body: "Apache-2.0 y auditable — lee o autoaloja cada línea." },
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
      {
        title: "Gratuit",
        body: "Gratuit pour les particuliers. Sans publicité ni ventes additionnelles.",
      },
      {
        title: "Confidentialité d'abord",
        body: "Vos données vous appartiennent — consentement de publication par champ, export complet, suppression du compte (RGPD + APPI du Japon). Sans publicité, sans revente de données.",
      },
      {
        title: "Open source",
        body: "Apache-2.0 et auditable — lisez ou hébergez vous-même chaque ligne.",
      },
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
      { title: "Kostenlos", body: "Kostenlos für Einzelpersonen. Keine Werbung, kein Upselling." },
      {
        title: "Datenschutz zuerst",
        body: "Ihre Daten gehören Ihnen — feldweise Veröffentlichungs-Einwilligung, vollständiger Export, Kontolöschung (DSGVO + Japans APPI). Keine Werbung, kein Datenverkauf.",
      },
      {
        title: "Quelloffen",
        body: "Apache-2.0 und auditierbar — lesen oder hosten Sie jede Zeile selbst.",
      },
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
      { title: "無料", body: "個人は無料。広告やアップセルはありません。" },
      {
        title: "プライバシー優先",
        body: "データはあなたのもの——項目ごとの公開同意、完全なエクスポート、アカウント削除（GDPR + 日本の APPI）。広告なし、データ販売なし。",
      },
      {
        title: "オープンソース",
        body: "Apache-2.0 で監査可能——すべての行を読むことも自己ホストすることもできます。",
      },
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
      { title: "Gratuito", body: "Gratuito para indivíduos. Sem anúncios, sem vendas adicionais." },
      {
        title: "Privacidade em primeiro lugar",
        body: "Seus dados são seus — consentimento de publicação por campo, exportação completa, exclusão de conta (GDPR + APPI do Japão). Sem anúncios, sem venda de dados.",
      },
      {
        title: "Código aberto",
        body: "Apache-2.0 e auditável — leia ou hospede cada linha você mesmo.",
      },
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
      {
        title: "Gratuito",
        body: "Gratuito per i privati. Niente pubblicità, niente vendite aggiuntive.",
      },
      {
        title: "Privacy prima di tutto",
        body: "I tuoi dati sono tuoi — consenso alla pubblicazione campo per campo, esportazione completa, eliminazione dell'account (GDPR + APPI del Giappone). Niente pubblicità, nessuna vendita di dati.",
      },
      {
        title: "Open source",
        body: "Apache-2.0 e verificabile — leggi o ospita autonomamente ogni riga.",
      },
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
      { title: "무료", body: "개인에게 무료. 광고도, 끼워팔기도 없습니다." },
      {
        title: "프라이버시 우선",
        body: "데이터는 회원님의 것입니다 — 항목별 게시 동의, 전체 내보내기, 계정 삭제(GDPR + 일본 APPI). 광고 없음, 데이터 판매 없음.",
      },
      {
        title: "오픈소스",
        body: "Apache-2.0이며 감사 가능 — 모든 줄을 읽거나 직접 호스팅할 수 있습니다.",
      },
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
      { title: "Бесплатно", body: "Бесплатно для частных лиц. Без рекламы и допродаж." },
      {
        title: "Конфиденциальность прежде всего",
        body: "Ваши данные принадлежат вам — согласие на публикацию по каждому полю, полный экспорт, удаление учётной записи (GDPR + APPI Японии). Без рекламы, без продажи данных.",
      },
      {
        title: "Открытый код",
        body: "Apache-2.0 и поддаётся аудиту — читайте или размещайте у себя каждую строку.",
      },
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
