import { asLocale, type Locale } from "./index";

/**
 * Accessibility-statement copy, localized for all 10 supported languages. Typed
 * as Record<Locale, AccessibilityStrings> so a missing translation is a compile
 * error. Used by the default `/accessibility` and the localized
 * `/[locale]/accessibility` routes.
 *
 * SigmaCV targets WCAG 2.1 AA. Proper nouns (SigmaCV, WCAG, GitHub) are kept
 * untranslated. `navLabel` is the short footer label.
 */
export interface AccessibilityStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  commitmentHeading: string;
  commitment: string;
  knownHeading: string;
  known: string;
  reportHeading: string;
  report: string;
  navLabel: string;
  backLink: string;
}

const ACCESSIBILITY_I18N: Record<Locale, AccessibilityStrings> = {
  "en-US": {
    metaTitle: "Accessibility",
    metaDescription:
      "SigmaCV's accessibility statement: we aim to conform to WCAG 2.1 AA — keyboard-operable, screen-reader friendly, sufficient contrast.",
    heading: "Accessibility",
    intro:
      "SigmaCV aims to be usable by everyone, including people who rely on assistive technology. We design and test against the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.",
    commitmentHeading: "Our commitment",
    commitment:
      "The editor is fully keyboard-operable with a visible focus indicator, uses semantic landmarks and headings, maintains sufficient colour contrast, and exposes a screen-reader live status for save and sync. A skip link lets keyboard and screen-reader users jump straight to the main content.",
    knownHeading: "Known limitations",
    known:
      "Reordering entries by drag-and-drop also offers keyboard-accessible Move up / Move down buttons, so no drag is required. Exported PDFs are visually faithful but their tagging for assistive technology is still being improved; the HTML and Markdown exports are the most accessible formats today.",
    reportHeading: "Reporting a problem",
    report:
      "If you hit an accessibility barrier, please tell us by opening an issue on our GitHub repository. Describe the page, what you were trying to do, and your assistive technology if relevant — we treat accessibility issues as bugs and aim to fix them quickly.",
    navLabel: "Accessibility",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "无障碍",
    metaDescription:
      "SigmaCV 的无障碍声明：我们力求符合 WCAG 2.1 AA——可用键盘操作、对屏幕阅读器友好、对比度充足。",
    heading: "无障碍访问",
    intro:
      "SigmaCV 致力于让每个人都能使用，包括依赖辅助技术的用户。我们按照《Web 内容无障碍指南》（WCAG）2.1 的 AA 级别进行设计与测试。",
    commitmentHeading: "我们的承诺",
    commitment:
      "编辑器完全支持键盘操作，并带有可见的焦点指示；采用语义化的地标与标题，保持充足的颜色对比度，并通过屏幕阅读器的实时状态播报保存与同步情况。跳转链接可让键盘和屏幕阅读器用户直接跳到主要内容。",
    knownHeading: "已知限制",
    known:
      "通过拖放重新排序条目时，也提供可用键盘操作的“上移／下移”按钮，因此无需拖动。导出的 PDF 在视觉上忠实呈现，但其面向辅助技术的标签仍在改进中；目前 HTML 和 Markdown 导出是最易于访问的格式。",
    reportHeading: "报告问题",
    report:
      "如果您遇到无障碍方面的障碍，请在我们的 GitHub 仓库中提交 issue 告知我们。请描述相关页面、您当时想完成的操作，以及（如相关）您使用的辅助技术——我们将无障碍问题视为缺陷，并力求尽快修复。",
    navLabel: "无障碍",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Accesibilidad",
    metaDescription:
      "Declaración de accesibilidad de SigmaCV: aspiramos a cumplir las WCAG 2.1 AA: operable con teclado, compatible con lectores de pantalla y con contraste suficiente.",
    heading: "Accesibilidad",
    intro:
      "SigmaCV aspira a que cualquier persona pueda utilizarlo, incluidas las que dependen de tecnología de asistencia. Diseñamos y probamos conforme a las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 en el nivel AA.",
    commitmentHeading: "Nuestro compromiso",
    commitment:
      "El editor es totalmente operable con el teclado y tiene un indicador de foco visible, usa puntos de referencia y encabezados semánticos, mantiene un contraste de color suficiente y expone un estado dinámico para lectores de pantalla al guardar y sincronizar. Un enlace para saltar permite que las personas usuarias de teclado y lector de pantalla vayan directamente al contenido principal.",
    knownHeading: "Limitaciones conocidas",
    known:
      "Reordenar las entradas arrastrando y soltando ofrece además botones de Subir / Bajar accesibles con el teclado, por lo que no es necesario arrastrar. Los PDF exportados son fieles visualmente, pero su etiquetado para tecnología de asistencia aún se está mejorando; hoy las exportaciones en HTML y Markdown son los formatos más accesibles.",
    reportHeading: "Informar de un problema",
    report:
      "Si encuentras una barrera de accesibilidad, cuéntanoslo abriendo una incidencia en nuestro repositorio de GitHub. Describe la página, lo que intentabas hacer y, si procede, tu tecnología de asistencia: tratamos los problemas de accesibilidad como errores y procuramos resolverlos rápidamente.",
    navLabel: "Accesibilidad",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "Accessibilité",
    metaDescription:
      "Déclaration d'accessibilité de SigmaCV : nous visons la conformité WCAG 2.1 AA — utilisable au clavier, compatible avec les lecteurs d'écran, contraste suffisant.",
    heading: "Accessibilité",
    intro:
      "SigmaCV vise à être utilisable par toutes et tous, y compris les personnes qui s'appuient sur des technologies d'assistance. Nous concevons et testons l'application selon les Règles pour l'accessibilité des contenus Web (WCAG) 2.1, niveau AA.",
    commitmentHeading: "Notre engagement",
    commitment:
      "L'éditeur est entièrement utilisable au clavier avec un indicateur de focus visible, recourt à des repères et des titres sémantiques, conserve un contraste de couleurs suffisant et expose un état dynamique pour les lecteurs d'écran lors de l'enregistrement et de la synchronisation. Un lien d'évitement permet aux personnes au clavier ou au lecteur d'écran d'accéder directement au contenu principal.",
    knownHeading: "Limites connues",
    known:
      "Le réordonnancement des entrées par glisser-déposer propose aussi des boutons Monter / Descendre accessibles au clavier : aucun glissement n'est requis. Les PDF exportés sont fidèles visuellement, mais leur balisage pour les technologies d'assistance est encore en cours d'amélioration ; aujourd'hui, les exports HTML et Markdown sont les formats les plus accessibles.",
    reportHeading: "Signaler un problème",
    report:
      "Si vous rencontrez un obstacle d'accessibilité, signalez-le en ouvrant un ticket sur notre dépôt GitHub. Décrivez la page, ce que vous tentiez de faire et, le cas échéant, votre technologie d'assistance — nous traitons les problèmes d'accessibilité comme des anomalies et nous nous efforçons de les corriger rapidement.",
    navLabel: "Accessibilité",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Barrierefreiheit",
    metaDescription:
      "Erklärung zur Barrierefreiheit von SigmaCV: Wir streben die Konformität mit WCAG 2.1 AA an — per Tastatur bedienbar, screenreaderfreundlich, ausreichender Kontrast.",
    heading: "Barrierefreiheit",
    intro:
      "SigmaCV soll für alle nutzbar sein, auch für Menschen, die auf assistive Technologien angewiesen sind. Wir gestalten und testen die Anwendung anhand der Web Content Accessibility Guidelines (WCAG) 2.1 auf Stufe AA.",
    commitmentHeading: "Unsere Verpflichtung",
    commitment:
      "Der Editor ist vollständig per Tastatur bedienbar und besitzt einen sichtbaren Fokusindikator, verwendet semantische Landmarken und Überschriften, hält ausreichenden Farbkontrast ein und meldet Speicher- und Synchronisationsstatus über einen Live-Bereich für Screenreader. Ein Sprunglink lässt Tastatur- und Screenreader-Nutzende direkt zum Hauptinhalt springen.",
    knownHeading: "Bekannte Einschränkungen",
    known:
      "Das Umsortieren von Einträgen per Drag-and-drop bietet zusätzlich tastaturbedienbare Schaltflächen „Nach oben“ / „Nach unten“, sodass kein Ziehen nötig ist. Exportierte PDFs sind optisch originalgetreu, ihre Auszeichnung für assistive Technologien wird jedoch noch verbessert; die HTML- und Markdown-Exporte sind derzeit die barrierefreiesten Formate.",
    reportHeading: "Ein Problem melden",
    report:
      "Wenn Sie auf eine Barriere stoßen, teilen Sie uns dies bitte mit, indem Sie ein Issue in unserem GitHub-Repository eröffnen. Beschreiben Sie die Seite, was Sie tun wollten, und gegebenenfalls Ihre assistive Technologie — wir behandeln Barrierefreiheitsprobleme als Fehler und bemühen uns um eine zügige Behebung.",
    navLabel: "Barrierefreiheit",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "アクセシビリティ",
    metaDescription:
      "SigmaCV のアクセシビリティ方針：WCAG 2.1 AA への準拠を目指します。キーボード操作対応、スクリーンリーダー対応、十分なコントラスト。",
    heading: "アクセシビリティ",
    intro:
      "SigmaCV は、支援技術を利用する方を含め、誰もが使えることを目指しています。私たちは Web コンテンツ・アクセシビリティ・ガイドライン（WCAG）2.1 のレベル AA に沿って設計・検証しています。",
    commitmentHeading: "私たちの取り組み",
    commitment:
      "エディターは完全にキーボードで操作でき、フォーカスインジケーターを視認できます。意味のあるランドマークと見出しを用い、十分な色のコントラストを保ち、保存や同期の状況をスクリーンリーダー向けのライブ領域で通知します。スキップリンクにより、キーボードやスクリーンリーダーの利用者は本文へ直接移動できます。",
    knownHeading: "既知の制限",
    known:
      "項目をドラッグ＆ドロップで並べ替える操作には、キーボードで使える「上へ／下へ」ボタンも用意しているため、ドラッグは不要です。書き出した PDF は見た目を忠実に再現しますが、支援技術向けのタグ付けは改善を続けています。現時点では HTML と Markdown の書き出しが最もアクセシブルな形式です。",
    reportHeading: "問題の報告",
    report:
      "アクセシビリティ上の障壁に気づかれた場合は、私たちの GitHub リポジトリで issue を作成してお知らせください。対象のページ、実行しようとした操作、（該当する場合は）ご利用の支援技術をお書きください。アクセシビリティの問題は不具合として扱い、速やかな修正に努めます。",
    navLabel: "アクセシビリティ",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Acessibilidade",
    metaDescription:
      "Declaração de acessibilidade do SigmaCV: buscamos conformidade com as WCAG 2.1 AA — operável por teclado, compatível com leitores de tela e com contraste suficiente.",
    heading: "Acessibilidade",
    intro:
      "O SigmaCV busca ser utilizável por todas as pessoas, inclusive as que dependem de tecnologia assistiva. Projetamos e testamos de acordo com as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1, no nível AA.",
    commitmentHeading: "Nosso compromisso",
    commitment:
      "O editor é totalmente operável pelo teclado, com indicador de foco visível, usa marcos e títulos semânticos, mantém contraste de cores suficiente e expõe um status dinâmico para leitores de tela ao salvar e sincronizar. Um link de pular permite que pessoas que usam teclado e leitor de tela vão direto ao conteúdo principal.",
    knownHeading: "Limitações conhecidas",
    known:
      "Reordenar entradas por arrastar e soltar também oferece botões Subir / Descer acessíveis pelo teclado, dispensando o arraste. Os PDFs exportados são fiéis visualmente, mas sua marcação para tecnologia assistiva ainda está sendo aprimorada; hoje as exportações em HTML e Markdown são os formatos mais acessíveis.",
    reportHeading: "Relatar um problema",
    report:
      "Se você encontrar uma barreira de acessibilidade, avise-nos abrindo uma issue no nosso repositório do GitHub. Descreva a página, o que você tentava fazer e, se for o caso, sua tecnologia assistiva — tratamos os problemas de acessibilidade como bugs e procuramos corrigi-los rapidamente.",
    navLabel: "Acessibilidade",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Accessibilità",
    metaDescription:
      "Dichiarazione di accessibilità di SigmaCV: puntiamo alla conformità WCAG 2.1 AA — utilizzabile da tastiera, compatibile con gli screen reader e con contrasto sufficiente.",
    heading: "Accessibilità",
    intro:
      "SigmaCV punta a essere utilizzabile da tutti, comprese le persone che si affidano alle tecnologie assistive. Progettiamo e testiamo l'applicazione secondo le Linee guida per l'accessibilità dei contenuti Web (WCAG) 2.1, livello AA.",
    commitmentHeading: "Il nostro impegno",
    commitment:
      "L'editor è completamente utilizzabile da tastiera con un indicatore di focus visibile, usa landmark e intestazioni semantiche, mantiene un contrasto cromatico sufficiente ed espone uno stato dinamico per gli screen reader durante il salvataggio e la sincronizzazione. Un link di salto consente a chi usa tastiera e screen reader di raggiungere direttamente il contenuto principale.",
    knownHeading: "Limitazioni note",
    known:
      "Il riordino delle voci tramite trascinamento offre anche pulsanti Sposta su / Sposta giù accessibili da tastiera, quindi non è necessario trascinare. I PDF esportati sono fedeli sul piano visivo, ma la loro marcatura per le tecnologie assistive è ancora in fase di miglioramento; oggi le esportazioni in HTML e Markdown sono i formati più accessibili.",
    reportHeading: "Segnalare un problema",
    report:
      "Se incontri una barriera all'accessibilità, segnalacela aprendo una issue nel nostro repository GitHub. Descrivi la pagina, ciò che stavi cercando di fare e, se pertinente, la tua tecnologia assistiva: trattiamo i problemi di accessibilità come bug e cerchiamo di risolverli rapidamente.",
    navLabel: "Accessibilità",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "접근성",
    metaDescription:
      "SigmaCV의 접근성 선언: WCAG 2.1 AA 준수를 목표로 합니다. 키보드 조작 가능, 스크린 리더 친화적, 충분한 대비.",
    heading: "접근성",
    intro:
      "SigmaCV는 보조 기술에 의존하는 분들을 포함해 누구나 사용할 수 있도록 노력합니다. 웹 콘텐츠 접근성 지침(WCAG) 2.1의 AA 수준에 맞추어 설계하고 테스트합니다.",
    commitmentHeading: "우리의 약속",
    commitment:
      "편집기는 키보드만으로 완전히 조작할 수 있으며 포커스 표시가 보입니다. 의미 있는 랜드마크와 제목을 사용하고, 충분한 색 대비를 유지하며, 저장 및 동기화 상태를 스크린 리더용 라이브 영역으로 알립니다. 건너뛰기 링크를 통해 키보드 및 스크린 리더 사용자는 본문으로 바로 이동할 수 있습니다.",
    knownHeading: "알려진 제한 사항",
    known:
      "항목을 끌어다 놓아 순서를 바꾸는 기능에는 키보드로 사용할 수 있는 ‘위로 / 아래로’ 버튼도 제공되므로 끌어다 놓기가 필요하지 않습니다. 내보낸 PDF는 시각적으로는 충실하지만 보조 기술을 위한 태깅은 아직 개선 중이며, 현재로서는 HTML과 Markdown 내보내기가 가장 접근성이 좋은 형식입니다.",
    reportHeading: "문제 신고",
    report:
      "접근성 장벽을 만나셨다면 저희 GitHub 저장소에 이슈를 등록해 알려 주세요. 해당 페이지, 하려던 작업, 그리고 (관련이 있다면) 사용 중인 보조 기술을 설명해 주시기 바랍니다. 접근성 문제는 버그로 간주하여 신속히 해결하고자 합니다.",
    navLabel: "접근성",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Доступность",
    metaDescription:
      "Заявление о доступности SigmaCV: мы стремимся соответствовать WCAG 2.1 AA — управление с клавиатуры, поддержка программ чтения с экрана, достаточный контраст.",
    heading: "Доступность",
    intro:
      "SigmaCV стремится быть удобным для всех, в том числе для людей, использующих вспомогательные технологии. Мы проектируем и тестируем приложение в соответствии с Руководством по обеспечению доступности веб-контента (WCAG) 2.1 уровня AA.",
    commitmentHeading: "Наши обязательства",
    commitment:
      "Редактор полностью управляется с клавиатуры и имеет видимый индикатор фокуса, использует семантические ориентиры и заголовки, поддерживает достаточный цветовой контраст и сообщает о состоянии сохранения и синхронизации через живую область для программ чтения с экрана. Ссылка для пропуска позволяет пользователям клавиатуры и программ чтения с экрана сразу перейти к основному содержимому.",
    knownHeading: "Известные ограничения",
    known:
      "Изменение порядка записей перетаскиванием также предлагает доступные с клавиатуры кнопки «Вверх» / «Вниз», поэтому перетаскивание не требуется. Экспортированные PDF визуально точны, но их разметка для вспомогательных технологий ещё дорабатывается; на сегодня экспорт в HTML и Markdown — наиболее доступные форматы.",
    reportHeading: "Сообщить о проблеме",
    report:
      "Если вы столкнулись с барьером доступности, сообщите нам, открыв задачу (issue) в нашем репозитории на GitHub. Опишите страницу, что вы пытались сделать и, если это уместно, вашу вспомогательную технологию — мы считаем проблемы доступности ошибками и стремимся быстро их устранять.",
    navLabel: "Доступность",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized Accessibility-page copy (falls back to English for unknown locales). */
export function accessibilityStrings(locale: string): AccessibilityStrings {
  return ACCESSIBILITY_I18N[asLocale(locale)];
}
