import { asLocale, type Locale } from "./index";

/**
 * About-page copy, localized for all 10 supported languages. Typed as
 * Record<Locale, AboutStrings> so a missing translation is a compile error.
 * Used by the default `/about` and the localized `/[locale]/about` routes.
 */
export interface AboutStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  privacy: string;
  whoHeading: string;
  maintainer: string;
  backLink: string;
}

const ABOUT_I18N: Record<Locale, AboutStrings> = {
  "en-US": {
    metaTitle: "About — the free, open academic CV builder",
    metaDescription:
      "SigmaCV is open infrastructure for responsible research assessment — academic CVs auto-generated from open research data.",
    heading: "About SigmaCV",
    intro:
      "SigmaCV is open infrastructure for responsible research assessment. It auto-generates clean, customizable academic CVs from open research data — OpenAlex, ORCID, Crossref, DataCite and Open Editors Plus — so your CV stays in sync with the open record. Free for individuals and open source (Apache-2.0).",
    privacy:
      "Your data stays yours: SigmaCV reads only public research metadata, matches your work by identifier (never by name), and never logs your choices without explicit consent.",
    whoHeading: "Who's behind it",
    maintainer:
      "SigmaCV is built and maintained by Basile Chrétien (PharmD, MSc, MPH), a pharmacist and researcher in pharmacovigilance and clinical pharmacology. Contributions and feedback are welcome on GitHub.",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "关于 — 免费开源的学术简历生成器",
    metaDescription: "SigmaCV 是负责任研究评价的开放基础设施——根据开放研究数据自动生成学术简历。",
    heading: "关于 SigmaCV",
    intro:
      "SigmaCV 是负责任研究评价的开放基础设施。它根据开放研究数据——OpenAlex、ORCID、Crossref、DataCite 和 Open Editors Plus——自动生成简洁、可定制的学术简历，让您的简历始终与公开记录保持同步。对个人免费，且为开源（Apache-2.0）。",
    privacy:
      "您的数据始终属于您：SigmaCV 仅读取公开的研究元数据，通过标识符（绝不通过姓名）匹配您的成果，并且未经明确同意绝不记录您的选择。",
    whoHeading: "幕后团队",
    maintainer:
      "SigmaCV 由 Basile Chrétien（PharmD, MSc, MPH）开发与维护，他是一名从事药物警戒与临床药理学研究的药师和研究人员。欢迎在 GitHub 上贡献代码与提供反馈。",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Acerca de — el generador de CV académico libre y abierto",
    metaDescription:
      "SigmaCV es infraestructura abierta para la evaluación responsable de la investigación: CV académicos generados automáticamente a partir de datos de investigación abiertos.",
    heading: "Acerca de SigmaCV",
    intro:
      "SigmaCV es infraestructura abierta para la evaluación responsable de la investigación. Genera automáticamente CV académicos limpios y personalizables a partir de datos de investigación abiertos —OpenAlex, ORCID, Crossref, DataCite y Open Editors Plus—, de modo que tu CV se mantiene sincronizado con el registro abierto. Gratuito para particulares y de código abierto (Apache-2.0).",
    privacy:
      "Tus datos siguen siendo tuyos: SigmaCV solo lee metadatos de investigación públicos, identifica tu trabajo mediante identificadores (nunca por el nombre) y jamás registra tus decisiones sin tu consentimiento explícito.",
    whoHeading: "Quién está detrás",
    maintainer:
      "SigmaCV ha sido creado y es mantenido por Basile Chrétien (PharmD, MSc, MPH), farmacéutico e investigador en farmacovigilancia y farmacología clínica. Las contribuciones y los comentarios son bienvenidos en GitHub.",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "À propos — le générateur de CV académique libre et ouvert",
    metaDescription:
      "SigmaCV est une infrastructure ouverte au service d'une évaluation responsable de la recherche — des CV académiques générés automatiquement à partir de données de recherche ouvertes.",
    heading: "À propos de SigmaCV",
    intro:
      "SigmaCV est une infrastructure ouverte au service d'une évaluation responsable de la recherche. Elle génère automatiquement des CV académiques épurés et personnalisables à partir de données de recherche ouvertes — OpenAlex, ORCID, Crossref, DataCite et Open Editors Plus — afin que votre CV reste synchronisé avec le corpus ouvert. Gratuit pour les particuliers et open source (Apache-2.0).",
    privacy:
      "Vos données vous appartiennent : SigmaCV ne lit que les métadonnées publiques de recherche, associe vos travaux par identifiant (jamais par nom) et n'enregistre jamais vos choix sans votre consentement explicite.",
    whoHeading: "Qui est derrière le projet",
    maintainer:
      "SigmaCV est développé et maintenu par Basile Chrétien (PharmD, MSc, MPH), pharmacien et chercheur en pharmacovigilance et pharmacologie clinique. Les contributions et les retours sont les bienvenus sur GitHub.",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Über uns — der freie, offene Generator für akademische Lebensläufe",
    metaDescription:
      "SigmaCV ist offene Infrastruktur für verantwortungsvolle Forschungsbewertung — akademische Lebensläufe, automatisch erstellt aus offenen Forschungsdaten.",
    heading: "Über SigmaCV",
    intro:
      "SigmaCV ist offene Infrastruktur für verantwortungsvolle Forschungsbewertung. Es erstellt automatisch übersichtliche, anpassbare akademische Lebensläufe aus offenen Forschungsdaten — OpenAlex, ORCID, Crossref, DataCite und Open Editors Plus —, sodass Ihr Lebenslauf stets mit dem offenen Forschungsverzeichnis synchron bleibt. Kostenlos für Einzelpersonen und quelloffen (Apache-2.0).",
    privacy:
      "Ihre Daten bleiben Ihre: SigmaCV liest ausschließlich öffentliche Forschungsmetadaten, ordnet Ihre Arbeiten anhand von Kennungen zu (niemals anhand des Namens) und protokolliert Ihre Auswahl niemals ohne ausdrückliche Einwilligung.",
    whoHeading: "Wer dahintersteht",
    maintainer:
      "SigmaCV wird von Basile Chrétien (PharmD, MSc, MPH) entwickelt und betreut, einem Apotheker und Forscher in den Bereichen Pharmakovigilanz und klinische Pharmakologie. Beiträge und Rückmeldungen sind auf GitHub willkommen.",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "概要 — 無料・オープンソースの学術 CV ジェネレーター",
    metaDescription:
      "SigmaCV は、責任ある研究評価のためのオープンインフラです。オープンな研究データから学術用 CV を自動生成します。",
    heading: "SigmaCV について",
    intro:
      "SigmaCV は、責任ある研究評価のためのオープンインフラです。OpenAlex、ORCID、Crossref、DataCite、Open Editors Plus といったオープンな研究データから、洗練されたカスタマイズ可能な学術用 CV を自動生成し、あなたの CV を公開された記録と常に同期させます。個人には無料で、オープンソース（Apache-2.0）です。",
    privacy:
      "あなたのデータはあなたのものです。SigmaCV は公開された研究メタデータのみを読み取り、あなたの業績を識別子で照合し（名前では一切照合しません）、明示的な同意なしにあなたの選択を記録することは決してありません。",
    whoHeading: "運営者について",
    maintainer:
      "SigmaCV は、ファーマコビジランスおよび臨床薬理学を専門とする薬剤師・研究者である Basile Chrétien（PharmD, MSc, MPH）によって開発・保守されています。コントリビューションやフィードバックは GitHub にて歓迎します。",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Sobre — o gerador de currículo acadêmico livre e aberto",
    metaDescription:
      "O SigmaCV é uma infraestrutura aberta para a avaliação responsável da pesquisa — currículos acadêmicos gerados automaticamente a partir de dados abertos de pesquisa.",
    heading: "Sobre o SigmaCV",
    intro:
      "O SigmaCV é uma infraestrutura aberta para a avaliação responsável da pesquisa. Ele gera automaticamente currículos acadêmicos limpos e personalizáveis a partir de dados abertos de pesquisa — OpenAlex, ORCID, Crossref, DataCite e Open Editors Plus — para que o seu currículo permaneça sincronizado com o registro aberto. Gratuito para indivíduos e de código aberto (Apache-2.0).",
    privacy:
      "Os seus dados continuam sendo seus: o SigmaCV lê apenas metadados públicos de pesquisa, identifica os seus trabalhos por identificador (nunca por nome) e nunca registra as suas escolhas sem consentimento explícito.",
    whoHeading: "Quem está por trás",
    maintainer:
      "O SigmaCV é desenvolvido e mantido por Basile Chrétien (PharmD, MSc, MPH), farmacêutico e pesquisador em farmacovigilância e farmacologia clínica. Contribuições e comentários são bem-vindos no GitHub.",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Informazioni — il generatore di CV accademici libero e aperto",
    metaDescription:
      "SigmaCV è un'infrastruttura aperta per la valutazione responsabile della ricerca: CV accademici generati automaticamente a partire da dati di ricerca aperti.",
    heading: "Informazioni su SigmaCV",
    intro:
      "SigmaCV è un'infrastruttura aperta per la valutazione responsabile della ricerca. Genera automaticamente CV accademici curati e personalizzabili a partire da dati di ricerca aperti — OpenAlex, ORCID, Crossref, DataCite e Open Editors Plus — così il tuo CV resta sincronizzato con i dati aperti disponibili. Gratuito per i singoli individui e open source (Apache-2.0).",
    privacy:
      "I tuoi dati restano tuoi: SigmaCV legge solo i metadati pubblici della ricerca, abbina i tuoi lavori tramite identificatore (mai tramite il nome) e non registra mai le tue scelte senza un consenso esplicito.",
    whoHeading: "Chi c'è dietro",
    maintainer:
      "SigmaCV è sviluppato e mantenuto da Basile Chrétien (PharmD, MSc, MPH), farmacista e ricercatore in farmacovigilanza e farmacologia clinica. Contributi e feedback sono benvenuti su GitHub.",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "소개 — 무료 오픈소스 학술 이력서 생성기",
    metaDescription:
      "SigmaCV는 책임 있는 연구 평가를 위한 오픈 인프라로, 공개 연구 데이터로부터 학술 이력서를 자동 생성합니다.",
    heading: "SigmaCV 소개",
    intro:
      "SigmaCV는 책임 있는 연구 평가를 위한 오픈 인프라입니다. OpenAlex, ORCID, Crossref, DataCite, Open Editors Plus 등 공개 연구 데이터로부터 깔끔하고 자유롭게 맞춤 설정할 수 있는 학술 이력서를 자동 생성하므로, 여러분의 이력서가 공개 기록과 항상 동기화된 상태로 유지됩니다. 개인에게 무료이며 오픈 소스입니다(Apache-2.0).",
    privacy:
      "여러분의 데이터는 여러분의 것입니다. SigmaCV는 공개된 연구 메타데이터만 읽고, 이름이 아닌 식별자로 여러분의 저작물을 매칭하며, 명시적 동의 없이는 여러분의 선택을 절대 기록하지 않습니다.",
    whoHeading: "누가 만들었나요",
    maintainer:
      "SigmaCV는 약물감시 및 임상약리학 분야의 약사이자 연구자인 Basile Chrétien(PharmD, MSc, MPH)이 개발하고 유지 관리합니다. 기여와 피드백은 GitHub에서 언제든 환영합니다.",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "О проекте — бесплатный открытый генератор академических CV",
    metaDescription:
      "SigmaCV — это открытая инфраструктура для ответственной оценки научных исследований: академические резюме, автоматически создаваемые на основе открытых научных данных.",
    heading: "О проекте SigmaCV",
    intro:
      "SigmaCV — это открытая инфраструктура для ответственной оценки научных исследований. Сервис автоматически создаёт аккуратные, настраиваемые академические резюме на основе открытых научных данных — OpenAlex, ORCID, Crossref, DataCite и Open Editors Plus, — благодаря чему ваше резюме всегда синхронизировано с открытыми записями. Бесплатно для частных лиц и с открытым исходным кодом (Apache-2.0).",
    privacy:
      "Ваши данные остаются вашими: SigmaCV считывает только публичные метаданные исследований, сопоставляет ваши работы по идентификатору (никогда по имени) и никогда не записывает ваши действия без явного согласия.",
    whoHeading: "Кто стоит за проектом",
    maintainer:
      "SigmaCV создан и поддерживается Basile Chrétien (PharmD, MSc, MPH), фармацевтом и исследователем в области фармаконадзора и клинической фармакологии. Вклад и отзывы приветствуются на GitHub.",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized About-page copy (falls back to English for unknown locales). */
export function aboutStrings(locale: string): AboutStrings {
  return ABOUT_I18N[asLocale(locale)];
}
