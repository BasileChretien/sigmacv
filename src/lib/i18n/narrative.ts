import {
  NARRATIVE_MODULE_KEYS,
  type CvNarrativeModule,
  type NarrativeModuleKey,
} from "@/lib/canonical/schema";
import { asLocale, type Locale } from "./index";

/**
 * Localized defaults for the standard funder "narrative CV" modules (UKRI Résumé
 * for Research and Innovation / Royal Society Résumé for Researchers framing).
 *
 * Each module carries a default `heading` (the user may rename it) and a one-line
 * `prompt` — guidance on what to write in that module. The researcher supplies
 * the prose; this is only the localized scaffolding. Typed as
 * Record<Locale, Record<NarrativeModuleKey, …>> so a missing translation is a
 * compile error (the same enforcement as every other i18n module here).
 *
 * "SigmaCV"/"ORCID"/"OpenAlex" etc. are proper nouns and stay untranslated.
 */
export interface NarrativeModuleStrings {
  /** Default localized heading for the module (user-renamable). */
  heading: string;
  /** One-line guidance prompt: what to write in this module. */
  prompt: string;
}

type NarrativeStrings = Record<NarrativeModuleKey, NarrativeModuleStrings>;

const NARRATIVE_I18N: Record<Locale, NarrativeStrings> = {
  "en-US": {
    "personal-statement": {
      heading: "Personal statement",
      prompt:
        "Summarise who you are as a researcher, your expertise, and the context for your career.",
    },
    knowledge: {
      heading: "Contributions to the generation of knowledge",
      prompt:
        "Describe your most important research contributions and their significance, not just publication counts.",
    },
    individuals: {
      heading: "Contributions to the development of individuals",
      prompt:
        "Describe how you have mentored, taught, supervised or supported the development of others.",
    },
    community: {
      heading: "Contributions to the wider research community",
      prompt:
        "Describe your peer review, editorial work, organising, leadership and service to your field.",
    },
    society: {
      heading: "Contributions to broader society",
      prompt:
        "Describe the impact of your work beyond academia — on policy, practice, the public or the economy.",
    },
    additional: {
      heading: "Additional information",
      prompt:
        "Note anything else relevant, including career breaks or circumstances that affected your work.",
    },
  },
  "zh-CN": {
    "personal-statement": {
      heading: "个人陈述",
      prompt: "概述你作为研究者的身份、专长以及职业生涯的背景。",
    },
    knowledge: {
      heading: "对知识创造的贡献",
      prompt: "描述你最重要的研究贡献及其意义，而不仅仅是论文数量。",
    },
    individuals: {
      heading: "对个人发展的贡献",
      prompt: "描述你如何指导、教学、督导或支持他人的成长。",
    },
    community: {
      heading: "对更广泛研究共同体的贡献",
      prompt: "描述你的同行评审、编辑工作、组织、领导以及对所在领域的服务。",
    },
    society: {
      heading: "对更广泛社会的贡献",
      prompt: "描述你的工作在学术界之外的影响——对政策、实践、公众或经济的影响。",
    },
    additional: {
      heading: "其他信息",
      prompt: "补充其他相关内容，包括职业中断或影响你工作的特殊情况。",
    },
  },
  "es-ES": {
    "personal-statement": {
      heading: "Declaración personal",
      prompt:
        "Resume quién eres como investigador, tu experiencia y el contexto de tu trayectoria.",
    },
    knowledge: {
      heading: "Contribuciones a la generación de conocimiento",
      prompt:
        "Describe tus aportaciones de investigación más importantes y su relevancia, no solo el número de publicaciones.",
    },
    individuals: {
      heading: "Contribuciones al desarrollo de las personas",
      prompt:
        "Describe cómo has tutorizado, enseñado, supervisado o apoyado el desarrollo de otras personas.",
    },
    community: {
      heading: "Contribuciones a la comunidad investigadora",
      prompt:
        "Describe tu revisión por pares, labor editorial, organización, liderazgo y servicio a tu campo.",
    },
    society: {
      heading: "Contribuciones a la sociedad en general",
      prompt:
        "Describe el impacto de tu trabajo más allá de la academia: en las políticas, la práctica, el público o la economía.",
    },
    additional: {
      heading: "Información adicional",
      prompt:
        "Indica cualquier otra cosa relevante, incluidas pausas profesionales o circunstancias que afectaran a tu trabajo.",
    },
  },
  "fr-FR": {
    "personal-statement": {
      heading: "Présentation personnelle",
      prompt:
        "Résumez qui vous êtes en tant que chercheur, votre expertise et le contexte de votre parcours.",
    },
    knowledge: {
      heading: "Contributions à la production de connaissances",
      prompt:
        "Décrivez vos contributions de recherche les plus importantes et leur portée, pas seulement le nombre de publications.",
    },
    individuals: {
      heading: "Contributions au développement des personnes",
      prompt:
        "Décrivez comment vous avez encadré, enseigné, supervisé ou soutenu le développement d’autrui.",
    },
    community: {
      heading: "Contributions à la communauté scientifique",
      prompt:
        "Décrivez votre évaluation par les pairs, votre travail éditorial, votre organisation, votre leadership et votre service à votre domaine.",
    },
    society: {
      heading: "Contributions à la société au sens large",
      prompt:
        "Décrivez l’impact de votre travail au-delà du monde académique — sur les politiques, les pratiques, le public ou l’économie.",
    },
    additional: {
      heading: "Informations complémentaires",
      prompt:
        "Signalez tout autre élément pertinent, y compris des interruptions de carrière ou des circonstances ayant affecté votre travail.",
    },
  },
  "de-DE": {
    "personal-statement": {
      heading: "Persönliche Darstellung",
      prompt:
        "Fassen Sie zusammen, wer Sie als Forschende sind, Ihre Expertise und den Kontext Ihres Werdegangs.",
    },
    knowledge: {
      heading: "Beiträge zur Schaffung von Wissen",
      prompt:
        "Beschreiben Sie Ihre wichtigsten Forschungsbeiträge und deren Bedeutung, nicht nur die Anzahl der Publikationen.",
    },
    individuals: {
      heading: "Beiträge zur Entwicklung von Menschen",
      prompt:
        "Beschreiben Sie, wie Sie andere betreut, gelehrt, angeleitet oder in ihrer Entwicklung unterstützt haben.",
    },
    community: {
      heading: "Beiträge zur weiteren Forschungsgemeinschaft",
      prompt:
        "Beschreiben Sie Ihre Begutachtung, Herausgebertätigkeit, Organisation, Führung und Ihren Einsatz für Ihr Fach.",
    },
    society: {
      heading: "Beiträge zur Gesellschaft insgesamt",
      prompt:
        "Beschreiben Sie die Wirkung Ihrer Arbeit über die Wissenschaft hinaus — auf Politik, Praxis, Öffentlichkeit oder Wirtschaft.",
    },
    additional: {
      heading: "Zusätzliche Informationen",
      prompt:
        "Vermerken Sie alles weitere Relevante, einschließlich Karrierepausen oder Umstände, die Ihre Arbeit beeinflusst haben.",
    },
  },
  "ja-JP": {
    "personal-statement": {
      heading: "自己紹介",
      prompt: "研究者としての自分、専門性、これまでの経歴の背景を簡潔にまとめてください。",
    },
    knowledge: {
      heading: "知の創出への貢献",
      prompt: "論文数だけでなく、最も重要な研究上の貢献とその意義を記述してください。",
    },
    individuals: {
      heading: "人材育成への貢献",
      prompt: "他者の指導・教育・監督や成長支援にどのように関わってきたかを記述してください。",
    },
    community: {
      heading: "研究コミュニティ全体への貢献",
      prompt: "査読・編集業務・運営・リーダーシップ、および分野への貢献を記述してください。",
    },
    society: {
      heading: "より広い社会への貢献",
      prompt: "政策・実務・市民・経済など、学術の枠を超えた研究の影響を記述してください。",
    },
    additional: {
      heading: "補足情報",
      prompt: "キャリアの中断や業務に影響した事情など、その他の関連事項を記載してください。",
    },
  },
  "pt-BR": {
    "personal-statement": {
      heading: "Declaração pessoal",
      prompt:
        "Resuma quem você é como pesquisador, sua experiência e o contexto da sua trajetória.",
    },
    knowledge: {
      heading: "Contribuições para a geração de conhecimento",
      prompt:
        "Descreva suas contribuições de pesquisa mais importantes e sua relevância, não apenas o número de publicações.",
    },
    individuals: {
      heading: "Contribuições para o desenvolvimento das pessoas",
      prompt:
        "Descreva como você orientou, ensinou, supervisionou ou apoiou o desenvolvimento de outras pessoas.",
    },
    community: {
      heading: "Contribuições para a comunidade de pesquisa",
      prompt:
        "Descreva sua revisão por pares, trabalho editorial, organização, liderança e serviço à sua área.",
    },
    society: {
      heading: "Contribuições para a sociedade em geral",
      prompt:
        "Descreva o impacto do seu trabalho além da academia — em políticas, práticas, no público ou na economia.",
    },
    additional: {
      heading: "Informações adicionais",
      prompt:
        "Registre qualquer outra informação relevante, incluindo pausas na carreira ou circunstâncias que afetaram seu trabalho.",
    },
  },
  "it-IT": {
    "personal-statement": {
      heading: "Presentazione personale",
      prompt:
        "Riassumi chi sei come ricercatore, la tua competenza e il contesto del tuo percorso.",
    },
    knowledge: {
      heading: "Contributi alla produzione di conoscenza",
      prompt:
        "Descrivi i tuoi contributi di ricerca più importanti e la loro rilevanza, non solo il numero di pubblicazioni.",
    },
    individuals: {
      heading: "Contributi allo sviluppo delle persone",
      prompt:
        "Descrivi come hai seguito, insegnato, supervisionato o sostenuto lo sviluppo di altre persone.",
    },
    community: {
      heading: "Contributi alla comunità di ricerca",
      prompt:
        "Descrivi la tua revisione paritaria, il lavoro editoriale, l’organizzazione, la leadership e il servizio al tuo settore.",
    },
    society: {
      heading: "Contributi alla società in senso ampio",
      prompt:
        "Descrivi l’impatto del tuo lavoro oltre il mondo accademico — su politiche, pratiche, pubblico o economia.",
    },
    additional: {
      heading: "Informazioni aggiuntive",
      prompt:
        "Segnala qualsiasi altro elemento rilevante, comprese interruzioni di carriera o circostanze che hanno influito sul tuo lavoro.",
    },
  },
  "ko-KR": {
    "personal-statement": {
      heading: "자기소개",
      prompt: "연구자로서의 자신, 전문성, 경력의 배경을 요약하세요.",
    },
    knowledge: {
      heading: "지식 창출에 대한 기여",
      prompt: "논문 수가 아니라 가장 중요한 연구 기여와 그 의의를 기술하세요.",
    },
    individuals: {
      heading: "개인의 성장에 대한 기여",
      prompt: "타인의 멘토링·교육·지도 또는 성장 지원에 어떻게 기여했는지 기술하세요.",
    },
    community: {
      heading: "넓은 연구 공동체에 대한 기여",
      prompt: "동료 심사, 편집 활동, 조직 운영, 리더십, 분야에 대한 봉사를 기술하세요.",
    },
    society: {
      heading: "더 넓은 사회에 대한 기여",
      prompt: "정책·실무·대중·경제 등 학계를 넘어선 연구의 영향을 기술하세요.",
    },
    additional: {
      heading: "추가 정보",
      prompt: "경력 단절이나 업무에 영향을 준 상황 등 그 밖의 관련 사항을 적으세요.",
    },
  },
  "ru-RU": {
    "personal-statement": {
      heading: "Личное заявление",
      prompt:
        "Кратко опишите себя как исследователя, свою экспертизу и контекст вашей карьеры.",
    },
    knowledge: {
      heading: "Вклад в создание знаний",
      prompt:
        "Опишите свои важнейшие научные результаты и их значимость, а не только число публикаций.",
    },
    individuals: {
      heading: "Вклад в развитие людей",
      prompt:
        "Опишите, как вы наставляли, обучали, руководили или поддерживали развитие других.",
    },
    community: {
      heading: "Вклад в более широкое научное сообщество",
      prompt:
        "Опишите ваше рецензирование, редакционную работу, организацию, лидерство и служение вашей области.",
    },
    society: {
      heading: "Вклад в общество в целом",
      prompt:
        "Опишите влияние вашей работы за пределами науки — на политику, практику, общество или экономику.",
    },
    additional: {
      heading: "Дополнительная информация",
      prompt:
        "Укажите любые другие важные сведения, включая перерывы в карьере или обстоятельства, повлиявшие на вашу работу.",
    },
  },
};

/** Localized narrative-module strings (falls back to English for unknown locales). */
export function narrativeStrings(locale: string): NarrativeStrings {
  return NARRATIVE_I18N[asLocale(locale)];
}

/** The default localized heading + guidance prompt for one narrative module. */
export function narrativeModuleStrings(
  locale: string,
  key: NarrativeModuleKey,
): NarrativeModuleStrings {
  return narrativeStrings(locale)[key];
}

/**
 * The six standard narrative modules, each seeded with its localized default
 * heading, an empty body and `included: true` — the scaffolding the editor seeds
 * a fresh narrative CV with. The researcher then fills in each body.
 */
export function defaultNarrativeModules(locale: string): CvNarrativeModule[] {
  const strings = narrativeStrings(locale);
  return NARRATIVE_MODULE_KEYS.map((key) => ({
    key,
    heading: strings[key].heading,
    body: "",
    included: true,
  }));
}
