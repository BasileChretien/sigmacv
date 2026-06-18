import { asLocale, type Locale } from "./index";
import type { CvSectionType } from "@/lib/canonical/schema";

/**
 * Writing guidance for the four R4RI / Royal-Society "Résumé for Researchers"
 * narrative modules, shown above each narrative section's editor textarea. A
 * narrative CV is hard to start from a blank box; this scaffolds WHAT belongs in
 * each module (the funder framing) without prescribing wording. One concise prompt
 * per module, localized for all ten UI languages. Editor-only — never rendered on
 * the CV (an empty narrative section isn't rendered at all). `statement` and the
 * other prose types intentionally have no prompt (they're free-form).
 *
 * NOTE: non-English copy is an initial translation pending native review (same
 * convention as the SEO landing pages / doc pages).
 */
type NarrativeKey =
  | "narrative-knowledge"
  | "narrative-individuals"
  | "narrative-community"
  | "narrative-society";

const NARRATIVE_GUIDANCE: Record<Locale, Record<NarrativeKey, string>> = {
  "en-US": {
    "narrative-knowledge":
      "Your key contributions to knowledge — significant findings, datasets, software or methods, and why they matter.",
    "narrative-individuals":
      "How you've developed people — students and trainees supervised, mentoring, teaching, and team leadership.",
    "narrative-community":
      "How you've supported the research community — peer review, editorial roles, organising events, and open science.",
    "narrative-society":
      "Your impact beyond academia — public engagement, policy or clinical influence, industry translation, and outreach.",
  },
  "zh-CN": {
    "narrative-knowledge": "你对知识的主要贡献——重要发现、数据集、软件或方法，以及它们为何重要。",
    "narrative-individuals": "你如何培养人才——指导的学生与受训者、辅导、教学与团队领导。",
    "narrative-community": "你如何支持研究共同体——同行评审、编辑职务、组织活动与开放科学。",
    "narrative-society": "你在学术界之外的影响——公众参与、政策或临床影响、产业转化与科普。",
  },
  "es-ES": {
    "narrative-knowledge":
      "Tus principales contribuciones al conocimiento: hallazgos, conjuntos de datos, software o métodos relevantes, y por qué importan.",
    "narrative-individuals":
      "Cómo has formado a personas: estudiantes y personal en formación supervisados, mentoría, docencia y liderazgo de equipos.",
    "narrative-community":
      "Cómo has apoyado a la comunidad investigadora: revisión por pares, funciones editoriales, organización de eventos y ciencia abierta.",
    "narrative-society":
      "Tu impacto más allá de la academia: divulgación, influencia en políticas o clínica, transferencia a la industria y difusión.",
  },
  "fr-FR": {
    "narrative-knowledge":
      "Vos principales contributions à la connaissance : résultats, jeux de données, logiciels ou méthodes marquants, et leur importance.",
    "narrative-individuals":
      "Comment vous avez formé des personnes : étudiants et stagiaires encadrés, mentorat, enseignement et direction d'équipe.",
    "narrative-community":
      "Comment vous avez soutenu la communauté scientifique : évaluation par les pairs, fonctions éditoriales, organisation d'événements et science ouverte.",
    "narrative-society":
      "Votre impact au-delà du monde académique : médiation, influence sur les politiques ou la clinique, transfert industriel et diffusion.",
  },
  "de-DE": {
    "narrative-knowledge":
      "Ihre wichtigsten Beiträge zum Wissen — bedeutende Erkenntnisse, Datensätze, Software oder Methoden und warum sie zählen.",
    "narrative-individuals":
      "Wie Sie Menschen gefördert haben — betreute Studierende und Nachwuchskräfte, Mentoring, Lehre und Teamleitung.",
    "narrative-community":
      "Wie Sie die Forschungsgemeinschaft unterstützt haben — Begutachtung, Herausgebertätigkeiten, Organisation von Veranstaltungen und Open Science.",
    "narrative-society":
      "Ihre Wirkung über die Wissenschaft hinaus — Öffentlichkeitsarbeit, Einfluss auf Politik oder Klinik, Transfer in die Industrie und Outreach.",
  },
  "ja-JP": {
    "narrative-knowledge":
      "知識への主な貢献——重要な発見、データセット、ソフトウェアや手法と、その意義。",
    "narrative-individuals": "人材の育成——指導した学生や研修者、メンタリング、教育、チームの統率。",
    "narrative-community":
      "研究コミュニティへの貢献——査読、編集職、イベント運営、オープンサイエンス。",
    "narrative-society":
      "学術界を超えた影響——アウトリーチ、政策・臨床への影響、産業への橋渡し、社会への発信。",
  },
  "pt-BR": {
    "narrative-knowledge":
      "Suas principais contribuições ao conhecimento — descobertas, conjuntos de dados, software ou métodos relevantes, e por que importam.",
    "narrative-individuals":
      "Como você desenvolveu pessoas — estudantes e formandos orientados, mentoria, ensino e liderança de equipes.",
    "narrative-community":
      "Como você apoiou a comunidade de pesquisa — revisão por pares, funções editoriais, organização de eventos e ciência aberta.",
    "narrative-society":
      "Seu impacto além da academia — engajamento público, influência em políticas ou clínica, transferência para a indústria e divulgação.",
  },
  "it-IT": {
    "narrative-knowledge":
      "I tuoi principali contributi alla conoscenza — risultati, set di dati, software o metodi significativi, e perché contano.",
    "narrative-individuals":
      "Come hai fatto crescere le persone — studenti e tirocinanti seguiti, mentoring, insegnamento e guida di gruppi.",
    "narrative-community":
      "Come hai sostenuto la comunità di ricerca — revisione tra pari, ruoli editoriali, organizzazione di eventi e scienza aperta.",
    "narrative-society":
      "Il tuo impatto oltre l'accademia — divulgazione, influenza su politiche o clinica, trasferimento all'industria e outreach.",
  },
  "ko-KR": {
    "narrative-knowledge":
      "지식에 대한 주요 기여 — 중요한 발견, 데이터셋, 소프트웨어 또는 방법과 그 의의.",
    "narrative-individuals": "사람을 키운 방식 — 지도한 학생과 연수생, 멘토링, 교육, 팀 리더십.",
    "narrative-community":
      "연구 공동체에 기여한 방식 — 동료 심사, 편집 역할, 행사 조직, 오픈 사이언스.",
    "narrative-society": "학계를 넘어선 영향 — 대중 참여, 정책·임상 영향, 산업 이전, 아웃리치.",
  },
  "ru-RU": {
    "narrative-knowledge":
      "Ваш главный вклад в знание — значимые результаты, наборы данных, ПО или методы и почему они важны.",
    "narrative-individuals":
      "Как вы развивали людей — наставничество студентов и стажёров, обучение и руководство командами.",
    "narrative-community":
      "Как вы поддерживали научное сообщество — рецензирование, редакционная работа, организация мероприятий и открытая наука.",
    "narrative-society":
      "Ваше влияние за пределами науки — популяризация, влияние на политику или клинику, передача в индустрию и просвещение.",
  },
};

/**
 * The R4RI writing prompt for a narrative module, or `undefined` for any other
 * section type (so the editor only shows it on the four narrative modules).
 */
export function narrativeGuidance(locale: string, type: CvSectionType): string | undefined {
  return (NARRATIVE_GUIDANCE[asLocale(locale)] as Record<string, string>)[type];
}
