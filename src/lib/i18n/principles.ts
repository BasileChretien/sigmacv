import { asLocale, type Locale } from "./index";

/**
 * "Standards & principles we align with" page copy, localized for all 10
 * supported languages. Typed as Record<Locale, PrinciplesStrings> so a missing
 * translation is a compile error. Used by the default `/principles` and the
 * localized `/[locale]/principles` routes.
 *
 * Framework NAMES and acronyms (DORA, CoARA, FAIR, FAIR4RS, the Barcelona
 * Declaration, the Leiden Manifesto, the Hong Kong Principles, The Metric Tide,
 * OpenAlex/ORCID/Crossref/DataCite) are proper nouns and live untranslated in
 * the `Principles` component; only the "how we apply it" descriptions are
 * localized here. `navLabel` is the short footer label.
 *
 * NOTE: non-English copy is an initial translation pending native review (same
 * convention as the SEO landing pages).
 */
export interface PrinciplesStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  lead: string;
  /** One-line "how SigmaCV applies it" per framework. */
  barcelona: string;
  dora: string;
  coara: string;
  leiden: string;
  hongKong: string;
  metricTide: string;
  fair: string;
  more: string;
  navLabel: string;
  backLink: string;
}

const PRINCIPLES_I18N: Record<Locale, PrinciplesStrings> = {
  "en-US": {
    metaTitle: "Standards & principles",
    metaDescription:
      "The open-science and responsible-assessment frameworks SigmaCV is built on: DORA, CoARA, the Barcelona Declaration, the Leiden Manifesto, the Hong Kong Principles, the Metric Tide and FAIR.",
    heading: "Standards & principles we align with",
    intro:
      "SigmaCV is open infrastructure for responsible research assessment, not only a CV tool. It is built on — and helps put into practice — the frameworks below.",
    lead: "How SigmaCV applies each:",
    barcelona:
      "Built entirely on open research information, and publishing every CV as open, machine-readable metadata.",
    dora: "Metrics are opt-in and default to none; field-normalized measures are preferred over journal-based proxies.",
    coara:
      "Narrative and contribution-focused CVs are first-class, supporting qualitative, responsible assessment.",
    leiden:
      "Quantitative indicators stay optional and contextual — supporting expert judgement, not replacing it.",
    hongKong:
      "Open access, open data and code, and retraction status are surfaced — rewarding transparency and reliability.",
    metricTide:
      "When shown, metrics carry their provenance and limitations: robustness, humility, transparency, diversity, reflexivity.",
    fair: "Every CV is Findable, Accessible, Interoperable and Reusable; SigmaCV itself follows FAIR for Research Software (FAIR4RS).",
    more: "The full open-science & FAIR statement and the source code are on GitHub.",
    navLabel: "Principles",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "标准与原则",
    metaDescription:
      "SigmaCV 所遵循的开放科学与负责任研究评价框架：DORA、CoARA、巴塞罗那宣言、莱顿宣言、香港原则、Metric Tide 以及 FAIR。",
    heading: "我们所遵循的标准与原则",
    intro:
      "SigmaCV 不仅是一个简历工具，更是负责任研究评价的开放基础设施。它建立在以下框架之上，并帮助将其付诸实践。",
    lead: "SigmaCV 如何践行每一项：",
    barcelona: "完全建立在开放研究信息之上，并将每份简历都发布为开放、机器可读的元数据。",
    dora: "指标为可选项且默认不显示；相比基于期刊的代理指标，更倾向于学科归一化的度量。",
    coara: "以叙述性和以贡献为核心的简历为一等公民，支持定性的、负责任的评价。",
    leiden: "定量指标始终是可选且结合语境的——用以支持而非取代专家判断。",
    hongKong: "呈现开放获取、开放数据与代码以及撤稿状态——奖励透明与可靠。",
    metricTide: "指标在显示时附带其来源与局限：稳健性、谦逊、透明、多样性与反身性。",
    fair: "每份简历都可被发现、可访问、可互操作、可重用；SigmaCV 自身亦遵循面向研究软件的 FAIR（FAIR4RS）。",
    more: "完整的开放科学与 FAIR 声明及源代码均发布在 GitHub 上。",
    navLabel: "原则",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Estándares y principios",
    metaDescription:
      "Los marcos de ciencia abierta y evaluación responsable en los que se basa SigmaCV: DORA, CoARA, la Declaración de Barcelona, el Manifiesto de Leiden, los Principios de Hong Kong, The Metric Tide y FAIR.",
    heading: "Estándares y principios que seguimos",
    intro:
      "SigmaCV es infraestructura abierta para la evaluación responsable de la investigación, no solo una herramienta de CV. Se basa en los marcos siguientes y ayuda a ponerlos en práctica.",
    lead: "Cómo aplica SigmaCV cada uno:",
    barcelona:
      "Construido íntegramente sobre información de investigación abierta y publicando cada CV como metadatos abiertos y legibles por máquina.",
    dora: "Las métricas son opcionales y están desactivadas por defecto; se prefieren las medidas normalizadas por campo frente a los indicadores basados en la revista.",
    coara:
      "Los CV narrativos y centrados en las contribuciones son de primer nivel, apoyando una evaluación cualitativa y responsable.",
    leiden:
      "Los indicadores cuantitativos siguen siendo opcionales y contextuales: apoyan el juicio experto, no lo sustituyen.",
    hongKong:
      "Se muestran el acceso abierto, los datos y el código abiertos y el estado de retractación, premiando la transparencia y la fiabilidad.",
    metricTide:
      "Cuando se muestran, las métricas incluyen su procedencia y limitaciones: solidez, humildad, transparencia, diversidad y reflexividad.",
    fair: "Cada CV es Localizable, Accesible, Interoperable y Reutilizable; el propio SigmaCV sigue FAIR para Software de Investigación (FAIR4RS).",
    more: "La declaración completa de ciencia abierta y FAIR y el código fuente están en GitHub.",
    navLabel: "Principios",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "Normes et principes",
    metaDescription:
      "Les cadres de science ouverte et d'évaluation responsable sur lesquels repose SigmaCV : DORA, CoARA, la Déclaration de Barcelone, le Manifeste de Leyde, les Principes de Hong Kong, The Metric Tide et FAIR.",
    heading: "Normes et principes que nous suivons",
    intro:
      "SigmaCV est une infrastructure ouverte au service d'une évaluation responsable de la recherche, et pas seulement un outil de CV. Il repose sur les cadres ci-dessous et aide à les mettre en pratique.",
    lead: "Comment SigmaCV applique chacun :",
    barcelona:
      "Entièrement fondé sur l'information ouverte de la recherche et publiant chaque CV sous forme de métadonnées ouvertes et lisibles par machine.",
    dora: "Les indicateurs sont optionnels et désactivés par défaut ; les mesures normalisées par domaine sont préférées aux indicateurs fondés sur la revue.",
    coara:
      "Les CV narratifs et axés sur les contributions sont de premier plan, au service d'une évaluation qualitative et responsable.",
    leiden:
      "Les indicateurs quantitatifs restent optionnels et contextuels : ils soutiennent le jugement des experts sans le remplacer.",
    hongKong:
      "L'accès ouvert, les données et le code ouverts ainsi que le statut de rétractation sont mis en avant, récompensant la transparence et la fiabilité.",
    metricTide:
      "Lorsqu'ils sont affichés, les indicateurs s'accompagnent de leur provenance et de leurs limites : robustesse, humilité, transparence, diversité et réflexivité.",
    fair: "Chaque CV est facile à trouver, accessible, interopérable et réutilisable ; SigmaCV lui-même suit FAIR pour les logiciels de recherche (FAIR4RS).",
    more: "La déclaration complète de science ouverte et FAIR ainsi que le code source sont sur GitHub.",
    navLabel: "Principes",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Standards & Prinzipien",
    metaDescription:
      "Die Open-Science- und Reform-Rahmenwerke, auf denen SigmaCV aufbaut: DORA, CoARA, die Barcelona-Erklärung, das Leiden-Manifest, die Hong-Kong-Prinzipien, The Metric Tide und FAIR.",
    heading: "Standards und Prinzipien, denen wir folgen",
    intro:
      "SigmaCV ist offene Infrastruktur für verantwortungsvolle Forschungsbewertung, nicht nur ein Lebenslauf-Werkzeug. Es baut auf den folgenden Rahmenwerken auf und hilft, sie in die Praxis umzusetzen.",
    lead: "Wie SigmaCV jedes davon umsetzt:",
    barcelona:
      "Vollständig auf offener Forschungsinformation aufgebaut; jeder Lebenslauf wird als offene, maschinenlesbare Metadaten veröffentlicht.",
    dora: "Kennzahlen sind optional und standardmäßig deaktiviert; feldnormalisierte Maße werden gegenüber zeitschriftenbasierten Proxys bevorzugt.",
    coara:
      "Narrative und beitragsorientierte Lebensläufe sind erstklassig und unterstützen eine qualitative, verantwortungsvolle Bewertung.",
    leiden:
      "Quantitative Indikatoren bleiben optional und kontextbezogen – sie unterstützen das Urteil von Fachleuten, ersetzen es aber nicht.",
    hongKong:
      "Open Access, offene Daten und offener Code sowie der Rückzugsstatus werden sichtbar gemacht und belohnen Transparenz und Verlässlichkeit.",
    metricTide:
      "Wenn Kennzahlen angezeigt werden, tragen sie ihre Herkunft und Grenzen mit sich: Robustheit, Bescheidenheit, Transparenz, Vielfalt und Reflexivität.",
    fair: "Jeder Lebenslauf ist auffindbar, zugänglich, interoperabel und wiederverwendbar; SigmaCV selbst folgt FAIR für Forschungssoftware (FAIR4RS).",
    more: "Die vollständige Open-Science- und FAIR-Erklärung sowie der Quellcode sind auf GitHub verfügbar.",
    navLabel: "Prinzipien",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "基準と原則",
    metaDescription:
      "SigmaCV が拠って立つオープンサイエンスと責任ある研究評価の枠組み：DORA、CoARA、バルセロナ宣言、ライデン声明、香港原則、The Metric Tide、そして FAIR。",
    heading: "私たちが準拠する基準と原則",
    intro:
      "SigmaCV は単なる CV ツールではなく、責任ある研究評価のためのオープンインフラです。以下の枠組みに基づき、それらの実践を後押しします。",
    lead: "SigmaCV における各原則の実践：",
    barcelona:
      "オープンな研究情報のみに基づいて構築され、すべての CV をオープンで機械可読なメタデータとして公開します。",
    dora: "指標はオプトインで既定では表示されません。表示する場合も、雑誌ベースの代理指標より分野正規化された指標を優先します。",
    coara: "ナラティブで貢献を重視した CV を第一級に扱い、定性的で責任ある評価を支えます。",
    leiden:
      "定量的指標はあくまで任意かつ文脈依存とし、専門家の判断を置き換えるのではなく支援します。",
    hongKong:
      "オープンアクセス、オープンデータ・コード、撤回状況を示し、透明性と信頼性を評価します。",
    metricTide:
      "指標を表示する際は、その出所と限界（頑健性・謙虚さ・透明性・多様性・再帰性）とともに提示します。",
    fair: "すべての CV は Findable・Accessible・Interoperable・Reusable であり、SigmaCV 自体も研究ソフトウェア向けの FAIR（FAIR4RS）に従います。",
    more: "オープンサイエンスと FAIR に関する完全な声明とソースコードは GitHub で公開しています。",
    navLabel: "原則",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Padrões e princípios",
    metaDescription:
      "Os marcos de ciência aberta e avaliação responsável nos quais o SigmaCV se baseia: DORA, CoARA, a Declaração de Barcelona, o Manifesto de Leiden, os Princípios de Hong Kong, The Metric Tide e FAIR.",
    heading: "Padrões e princípios que seguimos",
    intro:
      "O SigmaCV é uma infraestrutura aberta para a avaliação responsável da pesquisa, não apenas uma ferramenta de currículo. Ele se baseia nos marcos abaixo e ajuda a colocá-los em prática.",
    lead: "Como o SigmaCV aplica cada um:",
    barcelona:
      "Construído inteiramente sobre informações abertas de pesquisa e publicando cada currículo como metadados abertos e legíveis por máquina.",
    dora: "As métricas são opcionais e desativadas por padrão; medidas normalizadas por área são preferidas a indicadores baseados na revista.",
    coara:
      "Currículos narrativos e centrados em contribuições são de primeira classe, apoiando uma avaliação qualitativa e responsável.",
    leiden:
      "Os indicadores quantitativos permanecem opcionais e contextuais — apoiam o julgamento de especialistas, sem substituí-lo.",
    hongKong:
      "Acesso aberto, dados e código abertos e o status de retratação são exibidos, recompensando a transparência e a confiabilidade.",
    metricTide:
      "Quando exibidas, as métricas trazem sua procedência e limitações: robustez, humildade, transparência, diversidade e reflexividade.",
    fair: "Cada currículo é Localizável, Acessível, Interoperável e Reutilizável; o próprio SigmaCV segue o FAIR para Software de Pesquisa (FAIR4RS).",
    more: "A declaração completa de ciência aberta e FAIR e o código-fonte estão no GitHub.",
    navLabel: "Princípios",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Standard e principi",
    metaDescription:
      "I quadri di scienza aperta e valutazione responsabile su cui si basa SigmaCV: DORA, CoARA, la Dichiarazione di Barcellona, il Manifesto di Leiden, i Principi di Hong Kong, The Metric Tide e FAIR.",
    heading: "Standard e principi che seguiamo",
    intro:
      "SigmaCV è un'infrastruttura aperta per la valutazione responsabile della ricerca, non solo uno strumento per CV. Si basa sui quadri seguenti e aiuta a metterli in pratica.",
    lead: "Come SigmaCV applica ciascuno:",
    barcelona:
      "Costruito interamente su informazioni di ricerca aperte e pubblicando ogni CV come metadati aperti e leggibili dalle macchine.",
    dora: "Le metriche sono facoltative e disattivate per impostazione predefinita; si preferiscono misure normalizzate per campo rispetto agli indicatori basati sulla rivista.",
    coara:
      "I CV narrativi e incentrati sui contributi sono di primaria importanza, a sostegno di una valutazione qualitativa e responsabile.",
    leiden:
      "Gli indicatori quantitativi restano facoltativi e contestuali: sostengono il giudizio degli esperti, senza sostituirlo.",
    hongKong:
      "Vengono mostrati l'accesso aperto, i dati e il codice aperti e lo stato di ritrattazione, premiando trasparenza e affidabilità.",
    metricTide:
      "Quando mostrate, le metriche riportano la loro provenienza e i loro limiti: robustezza, umiltà, trasparenza, diversità e riflessività.",
    fair: "Ogni CV è Reperibile, Accessibile, Interoperabile e Riutilizzabile; SigmaCV stesso segue FAIR per il software di ricerca (FAIR4RS).",
    more: "La dichiarazione completa di scienza aperta e FAIR e il codice sorgente sono su GitHub.",
    navLabel: "Principi",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "표준 및 원칙",
    metaDescription:
      "SigmaCV가 기반으로 삼는 오픈 사이언스 및 책임 있는 연구 평가 프레임워크: DORA, CoARA, 바르셀로나 선언, 라이덴 선언, 홍콩 원칙, The Metric Tide, FAIR.",
    heading: "우리가 따르는 표준과 원칙",
    intro:
      "SigmaCV는 단순한 이력서 도구가 아니라 책임 있는 연구 평가를 위한 오픈 인프라입니다. 아래 프레임워크를 기반으로 하며 이를 실천하도록 돕습니다.",
    lead: "SigmaCV가 각 원칙을 적용하는 방식:",
    barcelona:
      "전적으로 공개 연구 정보 위에 구축되며, 모든 이력서를 공개되고 기계가 읽을 수 있는 메타데이터로 게시합니다.",
    dora: "지표는 선택 사항이며 기본적으로 표시되지 않습니다. 표시할 때도 학술지 기반 대리 지표보다 분야 정규화된 지표를 선호합니다.",
    coara: "서술형·기여 중심 이력서를 일급으로 다루어 정성적이고 책임 있는 평가를 지원합니다.",
    leiden: "정량 지표는 선택적이고 맥락적으로 유지되어 전문가의 판단을 대체하지 않고 보완합니다.",
    hongKong: "오픈 액세스, 공개 데이터·코드, 철회 상태를 드러내어 투명성과 신뢰성을 보상합니다.",
    metricTide:
      "지표를 표시할 때는 그 출처와 한계(견고성·겸손·투명성·다양성·성찰성)와 함께 제시합니다.",
    fair: "모든 이력서는 검색 가능·접근 가능·상호운용 가능·재사용 가능하며, SigmaCV 자체도 연구 소프트웨어를 위한 FAIR(FAIR4RS)를 따릅니다.",
    more: "오픈 사이언스 및 FAIR에 대한 전체 성명과 소스 코드는 GitHub에 공개되어 있습니다.",
    navLabel: "원칙",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Стандарты и принципы",
    metaDescription:
      "Рамки открытой науки и ответственной оценки исследований, на которых основан SigmaCV: DORA, CoARA, Барселонская декларация, Лейденский манифест, Гонконгские принципы, The Metric Tide и FAIR.",
    heading: "Стандарты и принципы, которых мы придерживаемся",
    intro:
      "SigmaCV — это открытая инфраструктура для ответственной оценки исследований, а не просто инструмент для резюме. Он основан на приведённых ниже рамках и помогает воплощать их на практике.",
    lead: "Как SigmaCV применяет каждый из них:",
    barcelona:
      "Полностью построен на открытой исследовательской информации и публикует каждое резюме как открытые, машиночитаемые метаданные.",
    dora: "Метрики необязательны и по умолчанию отключены; предпочтение отдаётся нормированным по области показателям, а не журнальным прокси.",
    coara:
      "Нарративные и ориентированные на вклад резюме являются полноценными, поддерживая качественную и ответственную оценку.",
    leiden:
      "Количественные показатели остаются необязательными и контекстными — они поддерживают экспертное суждение, а не заменяют его.",
    hongKong:
      "Отображаются открытый доступ, открытые данные и код, а также статус отзыва — вознаграждая прозрачность и надёжность.",
    metricTide:
      "При отображении метрики сопровождаются их происхождением и ограничениями: надёжность, скромность, прозрачность, разнообразие и рефлексивность.",
    fair: "Каждое резюме является находимым, доступным, совместимым и пригодным для повторного использования; сам SigmaCV следует FAIR для исследовательского ПО (FAIR4RS).",
    more: "Полное заявление об открытой науке и FAIR, а также исходный код доступны на GitHub.",
    navLabel: "Принципы",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized Standards-&-principles page copy (falls back to English). */
export function principlesStrings(locale: string): PrinciplesStrings {
  return PRINCIPLES_I18N[asLocale(locale)];
}
