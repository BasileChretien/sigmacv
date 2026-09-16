// Localized chrome for one /examples page (disclaimer, build box, related list,
// back-link). The examples were English-only until the French CV-FRQ example;
// the CV content of an example is written in ITS language (`ExampleMeta.locale`)
// and this record dresses the page around it in the same language. `{name}`,
// `{style}`, `{template}` and `{label}` are substituted by `ExamplePage`.
// Non-English copy was machine-drafted and is flagged for a native-speaker
// review pass (same convention as `guidesChrome.ts`).
import { asLocale, type Locale } from "./index";

export interface ExamplesChrome {
  /** Lead-in of the disclaimer, rendered bold: "Illustrative example." */
  disclaimerLead: string;
  /** Rest of the disclaimer; `{name}` = the fictional researcher. */
  disclaimerBody: string;
  /** Byline fragments: "{style} citations", "{template} template". */
  citations: string;
  template: string;
  /** aria-label of the CV article; `{label}` = the example's nav label. */
  exampleAria: string;
  buildHeading: string;
  buildBody: string;
  buildCta: string;
  relatedHeading: string;
  allExamples: string;
  /** Heading of the official-documents list an example may carry. */
  sourcesHeading: string;
}

export const EXAMPLES_CHROME: Record<Locale, ExamplesChrome> = {
  "en-US": {
    disclaimerLead: "Illustrative example.",
    disclaimerBody:
      "{name} is a fictional researcher and the publications below are fabricated for demonstration — any resemblance to a real person or work is coincidental.",
    citations: "{style} citations",
    template: "{template} template",
    exampleAria: "Example CV: {label}",
    buildHeading: "Build your own academic CV",
    buildBody:
      "SigmaCV builds a clean, citation-formatted CV like this from your ORCID and OpenAlex record — free and open source. You curate what appears and export to PDF, DOCX, LaTeX or Markdown.",
    buildCta: "Build your academic CV free",
    relatedHeading: "Related",
    allExamples: "All examples",
    sourcesHeading: "Official documents this example follows",
  },
  "zh-CN": {
    disclaimerLead: "示例说明。",
    disclaimerBody:
      "{name} 是虚构的研究者，以下发表成果均为演示而编造——如与真实人物或作品雷同，纯属巧合。",
    citations: "{style} 引用格式",
    template: "{template} 模板",
    exampleAria: "示例简历：{label}",
    buildHeading: "构建您自己的学术简历",
    buildBody:
      "SigmaCV 从您的 ORCID 和 OpenAlex 记录构建一份像这样干净、引用格式规范的简历——免费且开源。您决定显示的内容，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
    buildCta: "免费构建您的学术简历",
    relatedHeading: "相关内容",
    allExamples: "全部示例",
    sourcesHeading: "本示例遵循的官方文件",
  },
  "es-ES": {
    disclaimerLead: "Ejemplo ilustrativo.",
    disclaimerBody:
      "{name} es una persona investigadora ficticia y las publicaciones siguientes se han inventado para la demostración; cualquier parecido con una persona u obra real es casual.",
    citations: "citas {style}",
    template: "plantilla {template}",
    exampleAria: "CV de ejemplo: {label}",
    buildHeading: "Construye tu propio CV académico",
    buildBody:
      "SigmaCV construye un CV limpio y con citas formateadas como este a partir de tu registro ORCID y OpenAlex — gratis y de código abierto. Tú decides qué aparece y exportas a PDF, DOCX, LaTeX o Markdown.",
    buildCta: "Construye tu CV académico gratis",
    relatedHeading: "Relacionado",
    allExamples: "Todos los ejemplos",
    sourcesHeading: "Documentos oficiales que sigue este ejemplo",
  },
  "fr-FR": {
    disclaimerLead: "Exemple illustratif.",
    disclaimerBody:
      "{name} est une personne fictive et les publications ci-dessous sont inventées pour la démonstration — toute ressemblance avec une personne ou un travail réel serait fortuite.",
    citations: "citations {style}",
    template: "modèle {template}",
    exampleAria: "CV d'exemple : {label}",
    buildHeading: "Bâtissez votre propre CV académique",
    buildBody:
      "SigmaCV bâtit un CV propre, aux citations formatées, comme celui-ci à partir de votre dossier ORCID et OpenAlex — gratuit et libre. Vous choisissez ce qui apparaît et exportez en PDF, DOCX, LaTeX ou Markdown.",
    buildCta: "Bâtir votre CV académique gratuitement",
    relatedHeading: "Pour aller plus loin",
    allExamples: "Tous les exemples",
    sourcesHeading: "Documents officiels suivis par cet exemple",
  },
  "de-DE": {
    disclaimerLead: "Anschauungsbeispiel.",
    disclaimerBody:
      "{name} ist eine fiktive Person und die folgenden Publikationen sind zu Demonstrationszwecken erfunden — jede Ähnlichkeit mit einer realen Person oder Arbeit wäre zufällig.",
    citations: "{style}-Zitate",
    template: "Vorlage {template}",
    exampleAria: "Beispiel-Lebenslauf: {label}",
    buildHeading: "Erstellen Sie Ihren eigenen akademischen Lebenslauf",
    buildBody:
      "SigmaCV erstellt aus Ihrem ORCID- und OpenAlex-Verzeichnis einen sauberen, zitierformatierten Lebenslauf wie diesen — kostenlos und quelloffen. Sie kuratieren, was erscheint, und exportieren als PDF, DOCX, LaTeX oder Markdown.",
    buildCta: "Akademischen Lebenslauf kostenlos erstellen",
    relatedHeading: "Verwandt",
    allExamples: "Alle Beispiele",
    sourcesHeading: "Offizielle Dokumente, denen dieses Beispiel folgt",
  },
  "ja-JP": {
    disclaimerLead: "説明用の例。",
    disclaimerBody:
      "{name} は架空の研究者であり、以下の出版物はデモンストレーション用に創作されたものです——実在の人物や著作との類似は偶然です。",
    citations: "{style} 形式の引用",
    template: "{template} テンプレート",
    exampleAria: "CV の例：{label}",
    buildHeading: "自身の学術 CV を作成する",
    buildBody:
      "SigmaCV は ORCID と OpenAlex の記録から、このような整った引用書式の CV を作成します——無料でオープンソース。表示内容はあなたが選び、PDF、DOCX、LaTeX、Markdown にエクスポートできます。",
    buildCta: "学術 CV を無料で作成",
    relatedHeading: "関連",
    allExamples: "すべての例",
    sourcesHeading: "この例が従う公式文書",
  },
  "pt-BR": {
    disclaimerLead: "Exemplo ilustrativo.",
    disclaimerBody:
      "{name} é uma pessoa fictícia e as publicações abaixo foram inventadas para demonstração — qualquer semelhança com uma pessoa ou obra real é coincidência.",
    citations: "citações {style}",
    template: "modelo {template}",
    exampleAria: "CV de exemplo: {label}",
    buildHeading: "Construa seu próprio CV acadêmico",
    buildBody:
      "O SigmaCV constrói um CV limpo e com citações formatadas como este a partir do seu registro ORCID e OpenAlex — grátis e de código aberto. Você escolhe o que aparece e exporta para PDF, DOCX, LaTeX ou Markdown.",
    buildCta: "Construa seu CV acadêmico grátis",
    relatedHeading: "Relacionado",
    allExamples: "Todos os exemplos",
    sourcesHeading: "Documentos oficiais que este exemplo segue",
  },
  "it-IT": {
    disclaimerLead: "Esempio illustrativo.",
    disclaimerBody:
      "{name} è una persona immaginaria e le pubblicazioni qui sotto sono inventate a scopo dimostrativo — ogni somiglianza con una persona o un lavoro reale è casuale.",
    citations: "citazioni {style}",
    template: "modello {template}",
    exampleAria: "CV di esempio: {label}",
    buildHeading: "Costruisci il tuo CV accademico",
    buildBody:
      "SigmaCV costruisce un CV pulito, con citazioni formattate, come questo a partire dal tuo registro ORCID e OpenAlex — gratis e open source. Scegli tu cosa compare ed esporti in PDF, DOCX, LaTeX o Markdown.",
    buildCta: "Costruisci il tuo CV accademico gratis",
    relatedHeading: "Correlati",
    allExamples: "Tutti gli esempi",
    sourcesHeading: "Documenti ufficiali seguiti da questo esempio",
  },
  "ko-KR": {
    disclaimerLead: "예시용 자료.",
    disclaimerBody:
      "{name}은(는) 가상의 연구자이며 아래 출판물은 시연을 위해 만들어진 것입니다 — 실제 인물이나 저작과의 유사성은 우연입니다.",
    citations: "{style} 인용",
    template: "{template} 템플릿",
    exampleAria: "예시 CV: {label}",
    buildHeading: "나만의 학술 CV 만들기",
    buildBody:
      "SigmaCV는 ORCID와 OpenAlex 기록으로부터 이처럼 깔끔하고 인용 서식이 갖춰진 CV를 만듭니다 — 무료 오픈 소스. 표시할 내용을 직접 고르고 PDF, DOCX, LaTeX, Markdown으로 내보내세요.",
    buildCta: "학술 CV 무료로 만들기",
    relatedHeading: "관련",
    allExamples: "모든 예시",
    sourcesHeading: "이 예시가 따르는 공식 문서",
  },
  "ru-RU": {
    disclaimerLead: "Иллюстративный пример.",
    disclaimerBody:
      "{name} — вымышленное лицо, а публикации ниже придуманы для демонстрации; любое сходство с реальным человеком или работой случайно.",
    citations: "цитирование {style}",
    template: "шаблон {template}",
    exampleAria: "Пример резюме: {label}",
    buildHeading: "Соберите собственное академическое резюме",
    buildBody:
      "SigmaCV собирает такое же аккуратное резюме с оформленными ссылками из вашей записи ORCID и OpenAlex — бесплатно и с открытым кодом. Вы выбираете, что показывать, и экспортируете в PDF, DOCX, LaTeX или Markdown.",
    buildCta: "Собрать академическое резюме бесплатно",
    relatedHeading: "См. также",
    allExamples: "Все примеры",
    sourcesHeading: "Официальные документы, которым следует этот пример",
  },
};

/** The examples chrome for a locale (falls back to English). */
export function examplesChrome(locale: string): ExamplesChrome {
  return EXAMPLES_CHROME[asLocale(locale)];
}

/** Substitute `{key}` placeholders in a chrome string. */
export function fillChrome(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}
