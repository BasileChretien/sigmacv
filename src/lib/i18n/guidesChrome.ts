// Localized chrome for the /guides + /glossary surfaces (index meta, byline,
// section headings, back-links). Non-English copy was machine-drafted and is
// flagged for a per-locale native-speaker review pass (cf. `landingContent.ts`).
import { asLocale, type Locale } from "./index";

export interface GuidesChrome {
  guidesIndexTitle: string;
  guidesIndexDescription: string;
  glossaryIndexTitle: string;
  glossaryIndexDescription: string;
  byline: string;
  minRead: string;
  faqHeading: string;
  relatedHeading: string;
  allGuides: string;
  allTerms: string;
  backToHome: string;
}

export const GUIDES_CHROME: Record<Locale, GuidesChrome> = {
  "en-US": {
    guidesIndexTitle: "Academic CV guides",
    guidesIndexDescription:
      "Practical, up-to-date guides on writing, formatting, and automating your academic CV — what to include, how long it should be, how to list publications, and more.",
    glossaryIndexTitle: "Academic CV glossary",
    glossaryIndexDescription:
      "Plain-language definitions of the key terms behind an academic CV — ORCID, OpenAlex, citation metrics (FWCI, h-index), the Citation Style Language, the NIH biosketch and more.",
    byline: "By",
    minRead: "min read",
    faqHeading: "Frequently asked questions",
    relatedHeading: "Related",
    allGuides: "All guides",
    allTerms: "All terms",
    backToHome: "Back to SigmaCV",
  },
  "zh-CN": {
    guidesIndexTitle: "学术简历指南",
    guidesIndexDescription:
      "关于撰写、格式化和自动化生成学术简历的实用、最新指南——应包含哪些内容、篇幅应多长、如何列出发表成果等。",
    glossaryIndexTitle: "学术简历词汇表",
    glossaryIndexDescription:
      "学术简历核心术语的通俗定义——ORCID、OpenAlex、引用指标（FWCI、h-index）、引文格式语言、NIH 个人简介等。",
    byline: "作者：",
    minRead: "分钟阅读",
    faqHeading: "常见问题",
    relatedHeading: "相关内容",
    allGuides: "所有指南",
    allTerms: "所有术语",
    backToHome: "返回 SigmaCV",
  },
  "es-ES": {
    guidesIndexTitle: "Guías sobre el currículum académico",
    guidesIndexDescription:
      "Guías prácticas y actualizadas sobre cómo redactar, formatear y automatizar su currículum académico: qué incluir, qué extensión debe tener, cómo listar las publicaciones y mucho más.",
    glossaryIndexTitle: "Glosario del currículum académico",
    glossaryIndexDescription:
      "Definiciones en lenguaje claro de los términos clave del currículum académico: ORCID, OpenAlex, métricas de citas (FWCI, h-index), el Citation Style Language, el NIH biosketch y más.",
    byline: "Por",
    minRead: "min de lectura",
    faqHeading: "Preguntas frecuentes",
    relatedHeading: "Relacionado",
    allGuides: "Todas las guías",
    allTerms: "Todos los términos",
    backToHome: "Volver a SigmaCV",
  },
  "fr-FR": {
    guidesIndexTitle: "Guides sur le CV académique",
    guidesIndexDescription:
      "Des guides pratiques et à jour pour rédiger, mettre en forme et automatiser votre CV académique — ce qu'il faut inclure, quelle longueur viser, comment lister vos publications, et bien plus.",
    glossaryIndexTitle: "Glossaire du CV académique",
    glossaryIndexDescription:
      "Définitions accessibles des termes clés du CV académique — ORCID, OpenAlex, indicateurs bibliométriques (FWCI, indice h), le Citation Style Language, le NIH biosketch et bien d'autres.",
    byline: "Par",
    minRead: "min de lecture",
    faqHeading: "Questions fréquentes",
    relatedHeading: "À lire aussi",
    allGuides: "Tous les guides",
    allTerms: "Tous les termes",
    backToHome: "Retour à SigmaCV",
  },
  "de-DE": {
    guidesIndexTitle: "Leitfäden zum akademischen Lebenslauf",
    guidesIndexDescription:
      "Praktische, aktuelle Leitfäden zum Verfassen, Formatieren und automatischen Erstellen Ihres akademischen Lebenslaufs – was enthalten sein sollte, wie lang er sein sollte, wie Publikationen aufgeführt werden und mehr.",
    glossaryIndexTitle: "Glossar zum akademischen Lebenslauf",
    glossaryIndexDescription:
      "Verständliche Definitionen der wichtigsten Begriffe rund um den akademischen Lebenslauf – ORCID, OpenAlex, Zitierungsmetriken (FWCI, h-Index), die Citation Style Language, der NIH Biosketch und mehr.",
    byline: "Von",
    minRead: "Min. Lesezeit",
    faqHeading: "Häufig gestellte Fragen",
    relatedHeading: "Verwandte Themen",
    allGuides: "Alle Leitfäden",
    allTerms: "Alle Begriffe",
    backToHome: "Zurück zu SigmaCV",
  },
  "ja-JP": {
    guidesIndexTitle: "アカデミックCVガイド",
    guidesIndexDescription:
      "アカデミックCVの書き方、フォーマット、自動化に関する実践的・最新のガイド——記載すべき内容、適切な長さ、文献リストの書き方などを解説します。",
    glossaryIndexTitle: "アカデミックCV用語集",
    glossaryIndexDescription:
      "アカデミックCVの背景にある主要な用語のわかりやすい解説——ORCID、OpenAlex、引用指標（FWCI、h-index）、Citation Style Language、NIH biosketachなど。",
    byline: "著者：",
    minRead: "分で読めます",
    faqHeading: "よくある質問",
    relatedHeading: "関連",
    allGuides: "すべてのガイド",
    allTerms: "すべての用語",
    backToHome: "SigmaCV に戻る",
  },
  "pt-BR": {
    guidesIndexTitle: "Guias de currículo acadêmico",
    guidesIndexDescription:
      "Guias práticos e atualizados sobre como elaborar, formatar e automatizar o seu currículo acadêmico — o que incluir, qual deve ser a extensão, como listar publicações e muito mais.",
    glossaryIndexTitle: "Glossário de currículo acadêmico",
    glossaryIndexDescription:
      "Definições em linguagem acessível dos principais termos relacionados ao currículo acadêmico — ORCID, OpenAlex, métricas de citação (FWCI, h-index), a Citation Style Language, o NIH biosketch e mais.",
    byline: "Por",
    minRead: "min de leitura",
    faqHeading: "Perguntas frequentes",
    relatedHeading: "Relacionados",
    allGuides: "Todos os guias",
    allTerms: "Todos os termos",
    backToHome: "Voltar ao SigmaCV",
  },
  "it-IT": {
    guidesIndexTitle: "Guide al curriculum vitae accademico",
    guidesIndexDescription:
      "Guide pratiche e aggiornate sulla redazione, la formattazione e l'automazione del proprio curriculum vitae accademico: cosa includere, la lunghezza adeguata, come elencare le pubblicazioni e molto altro.",
    glossaryIndexTitle: "Glossario del curriculum vitae accademico",
    glossaryIndexDescription:
      "Definizioni in linguaggio semplice dei termini chiave del curriculum vitae accademico: ORCID, OpenAlex, metriche citazionali (FWCI, h-index), il Citation Style Language, il biosketch NIH e altro ancora.",
    byline: "Di",
    minRead: "min di lettura",
    faqHeading: "Domande frequenti",
    relatedHeading: "Correlati",
    allGuides: "Tutte le guide",
    allTerms: "Tutti i termini",
    backToHome: "Torna a SigmaCV",
  },
  "ko-KR": {
    guidesIndexTitle: "학술 CV 가이드",
    guidesIndexDescription:
      "학술 CV 작성, 형식화, 자동화에 관한 실용적이고 최신의 가이드 — 포함할 내용, 적정 분량, 논문 목록 작성 방법 등을 다룹니다.",
    glossaryIndexTitle: "학술 CV 용어집",
    glossaryIndexDescription:
      "학술 CV의 핵심 용어에 대한 평이한 해설 — ORCID, OpenAlex, 인용 지표(FWCI, h-index), Citation Style Language, NIH biosketch 등.",
    byline: "작성자",
    minRead: "분 읽기",
    faqHeading: "자주 묻는 질문",
    relatedHeading: "관련 항목",
    allGuides: "전체 가이드",
    allTerms: "전체 용어",
    backToHome: "SigmaCV로 돌아가기",
  },
  "ru-RU": {
    guidesIndexTitle: "Руководства по академическому резюме",
    guidesIndexDescription:
      "Практические актуальные руководства по написанию, оформлению и автоматизации вашего академического резюме — что включать, какой должна быть длина, как оформлять список публикаций и многое другое.",
    glossaryIndexTitle: "Глоссарий академического резюме",
    glossaryIndexDescription:
      "Доступные определения ключевых понятий, связанных с академическим резюме: ORCID, OpenAlex, показатели цитируемости (FWCI, индекс Хирша), Citation Style Language, NIH biosketch и другие.",
    byline: "Автор",
    minRead: "мин чтения",
    faqHeading: "Часто задаваемые вопросы",
    relatedHeading: "По теме",
    allGuides: "Все руководства",
    allTerms: "Все термины",
    backToHome: "На главную SigmaCV",
  },
};

/** Localized chrome strings for a locale (falls back to English). */
export function guidesChrome(locale: string): GuidesChrome {
  return GUIDES_CHROME[asLocale(locale)];
}
