import { asLocale, type Locale } from "./index";

/**
 * Extra editor-chrome strings added for the grouped style panel, structured
 * manual entries, the mobile pane tabs, and the disambiguation coachmark.
 * Kept in their own dictionary (typed Record<Locale, …> so a missing locale is
 * a compile error) to avoid threading every new key through the large ui.ts.
 */
export interface EditorExtraStrings {
  // Grouped style-panel headings.
  grpTemplate: string;
  grpCitations: string;
  grpMetrics: string;
  grpDisplay: string;
  // Structured manual-entry form.
  structuredEntry: string;
  feTitle: string;
  feAuthors: string;
  feAuthorsHint: string;
  feVenue: string;
  feYear: string;
  feDoi: string;
  feAdd: string;
  // Mobile Editor/Preview tabs.
  tabEditor: string;
  tabPreview: string;
  // First-run disambiguation coachmark.
  coachTitle: string;
  coachBody: string;
  coachGotIt: string;
  exportWebpage: string;
}

const EDITOR_UI: Record<Locale, EditorExtraStrings> = {
  "en-US": {
    grpTemplate: "Template & layout",
    grpCitations: "Citations & language",
    grpMetrics: "Metrics & authorship",
    grpDisplay: "Sections & visibility",
    structuredEntry: "Add a structured entry",
    feTitle: "Title",
    feAuthors: "Authors",
    feAuthorsHint: "One per line or separated by “;” — ideally “Family, Given”.",
    feVenue: "Journal / venue",
    feYear: "Year",
    feDoi: "DOI or URL",
    feAdd: "Add entry",
    tabEditor: "Editor",
    tabPreview: "Preview",
    coachTitle: "Tip: check these are all yours",
    coachBody:
      "Author matching isn’t perfect. If an entry isn’t yours, open it and mark it “Not mine” — it’s hidden from your CV (never deleted) and improves matching.",
    coachGotIt: "Got it",
    exportWebpage: "Web page (animated)",
  },
  "zh-CN": {
    grpTemplate: "模板与排版",
    grpCitations: "引用与语言",
    grpMetrics: "指标与作者贡献",
    grpDisplay: "栏目与显示",
    structuredEntry: "添加结构化条目",
    feTitle: "标题",
    feAuthors: "作者",
    feAuthorsHint: "每行一位，或用“;”分隔——建议使用“姓, 名”。",
    feVenue: "期刊／会议",
    feYear: "年份",
    feDoi: "DOI 或网址",
    feAdd: "添加条目",
    tabEditor: "编辑",
    tabPreview: "预览",
    coachTitle: "提示：确认这些都是您的成果",
    coachBody:
      "作者匹配并非完美。如果某条目不属于您，请打开它并标记为“不是我的”——它会从简历中隐藏（绝不删除），并有助于改进匹配。",
    coachGotIt: "知道了",
    exportWebpage: "网页（动画）",
  },
  "es-ES": {
    grpTemplate: "Plantilla y diseño",
    grpCitations: "Citas e idioma",
    grpMetrics: "Métricas y autoría",
    grpDisplay: "Secciones y visibilidad",
    structuredEntry: "Añadir una entrada estructurada",
    feTitle: "Título",
    feAuthors: "Autores",
    feAuthorsHint:
      "Uno por línea o separados por «;» — preferiblemente «Apellido, Nombre».",
    feVenue: "Revista / congreso",
    feYear: "Año",
    feDoi: "DOI o URL",
    feAdd: "Añadir entrada",
    tabEditor: "Editor",
    tabPreview: "Vista previa",
    coachTitle: "Consejo: comprueba que todo es tuyo",
    coachBody:
      "La identificación de autores no es perfecta. Si una entrada no es tuya, ábrela y márcala como «No es mía»: se oculta de tu CV (nunca se elimina) y mejora la identificación.",
    coachGotIt: "Entendido",
    exportWebpage: "Página web (animada)",
  },
  "fr-FR": {
    grpTemplate: "Modèle et mise en page",
    grpCitations: "Citations et langue",
    grpMetrics: "Indicateurs et rôles d’auteur",
    grpDisplay: "Sections et affichage",
    structuredEntry: "Ajouter une entrée structurée",
    feTitle: "Titre",
    feAuthors: "Auteurs",
    feAuthorsHint:
      "Un par ligne ou séparés par « ; » — idéalement « Nom, Prénom ».",
    feVenue: "Revue / conférence",
    feYear: "Année",
    feDoi: "DOI ou URL",
    feAdd: "Ajouter l’entrée",
    tabEditor: "Éditeur",
    tabPreview: "Aperçu",
    coachTitle: "Astuce : vérifiez que tout est bien à vous",
    coachBody:
      "L’appariement des auteurs n’est pas parfait. Si une entrée n’est pas la vôtre, ouvrez-la et marquez-la « Pas la mienne » : elle est masquée de votre CV (jamais supprimée) et améliore l’appariement.",
    coachGotIt: "Compris",
    exportWebpage: "Page web (animée)",
  },
  "de-DE": {
    grpTemplate: "Vorlage & Layout",
    grpCitations: "Zitate & Sprache",
    grpMetrics: "Metriken & Autorenschaft",
    grpDisplay: "Abschnitte & Sichtbarkeit",
    structuredEntry: "Strukturierten Eintrag hinzufügen",
    feTitle: "Titel",
    feAuthors: "Autoren",
    feAuthorsHint:
      "Einer pro Zeile oder durch „;“ getrennt — idealerweise „Nachname, Vorname“.",
    feVenue: "Zeitschrift / Konferenz",
    feYear: "Jahr",
    feDoi: "DOI oder URL",
    feAdd: "Eintrag hinzufügen",
    tabEditor: "Editor",
    tabPreview: "Vorschau",
    coachTitle: "Tipp: Prüfen Sie, ob alles von Ihnen stammt",
    coachBody:
      "Die Autorenzuordnung ist nicht perfekt. Wenn ein Eintrag nicht von Ihnen ist, öffnen Sie ihn und markieren Sie ihn als „Nicht von mir“ — er wird aus Ihrem Lebenslauf ausgeblendet (nie gelöscht) und verbessert die Zuordnung.",
    coachGotIt: "Verstanden",
    exportWebpage: "Webseite (animiert)",
  },
  "ja-JP": {
    grpTemplate: "テンプレートとレイアウト",
    grpCitations: "引用と言語",
    grpMetrics: "指標と著者の役割",
    grpDisplay: "セクションと表示",
    structuredEntry: "構造化エントリを追加",
    feTitle: "タイトル",
    feAuthors: "著者",
    feAuthorsHint: "1行に1名、または「;」で区切ります（「姓, 名」が理想）。",
    feVenue: "雑誌／会議",
    feYear: "年",
    feDoi: "DOI または URL",
    feAdd: "エントリを追加",
    tabEditor: "エディタ",
    tabPreview: "プレビュー",
    coachTitle: "ヒント：すべてご自身の業績か確認してください",
    coachBody:
      "著者の自動照合は完全ではありません。ご自身のものでない項目は開いて「自分のものではない」に設定してください。履歴書から非表示になり（削除はされません）、照合の改善に役立ちます。",
    coachGotIt: "了解",
    exportWebpage: "ウェブページ（アニメーション）",
  },
  "pt-BR": {
    grpTemplate: "Modelo e layout",
    grpCitations: "Citações e idioma",
    grpMetrics: "Métricas e autoria",
    grpDisplay: "Seções e visibilidade",
    structuredEntry: "Adicionar uma entrada estruturada",
    feTitle: "Título",
    feAuthors: "Autores",
    feAuthorsHint:
      "Um por linha ou separados por “;” — de preferência “Sobrenome, Nome”.",
    feVenue: "Revista / congresso",
    feYear: "Ano",
    feDoi: "DOI ou URL",
    feAdd: "Adicionar entrada",
    tabEditor: "Editor",
    tabPreview: "Pré-visualização",
    coachTitle: "Dica: confirme que tudo é seu",
    coachBody:
      "A correspondência de autores não é perfeita. Se uma entrada não for sua, abra-a e marque como “Não é minha” — ela fica oculta no seu currículo (nunca é excluída) e melhora a correspondência.",
    coachGotIt: "Entendi",
    exportWebpage: "Página web (animada)",
  },
  "it-IT": {
    grpTemplate: "Modello e layout",
    grpCitations: "Citazioni e lingua",
    grpMetrics: "Metriche e ruoli d’autore",
    grpDisplay: "Sezioni e visibilità",
    structuredEntry: "Aggiungi una voce strutturata",
    feTitle: "Titolo",
    feAuthors: "Autori",
    feAuthorsHint:
      "Uno per riga o separati da «;» — preferibilmente «Cognome, Nome».",
    feVenue: "Rivista / convegno",
    feYear: "Anno",
    feDoi: "DOI o URL",
    feAdd: "Aggiungi voce",
    tabEditor: "Editor",
    tabPreview: "Anteprima",
    coachTitle: "Suggerimento: verifica che sia tutto tuo",
    coachBody:
      "L’abbinamento degli autori non è perfetto. Se una voce non è tua, aprila e contrassegnala come «Non è mia»: viene nascosta dal CV (mai eliminata) e migliora l’abbinamento.",
    coachGotIt: "Ho capito",
    exportWebpage: "Pagina web (animata)",
  },
  "ko-KR": {
    grpTemplate: "템플릿 및 레이아웃",
    grpCitations: "인용 및 언어",
    grpMetrics: "지표 및 저자 역할",
    grpDisplay: "섹션 및 표시",
    structuredEntry: "구조화된 항목 추가",
    feTitle: "제목",
    feAuthors: "저자",
    feAuthorsHint: "한 줄에 한 명씩 또는 “;”로 구분 — 가급적 “성, 이름”.",
    feVenue: "학술지 / 학회",
    feYear: "연도",
    feDoi: "DOI 또는 URL",
    feAdd: "항목 추가",
    tabEditor: "편집기",
    tabPreview: "미리보기",
    coachTitle: "팁: 모두 본인의 성과인지 확인하세요",
    coachBody:
      "저자 매칭은 완벽하지 않습니다. 본인의 항목이 아니라면 열어서 “내 것이 아님”으로 표시하세요. 이력서에서 숨겨지며(삭제되지 않음) 매칭 개선에 도움이 됩니다.",
    coachGotIt: "확인",
    exportWebpage: "웹 페이지(애니메이션)",
  },
  "ru-RU": {
    grpTemplate: "Шаблон и вёрстка",
    grpCitations: "Цитирование и язык",
    grpMetrics: "Метрики и авторство",
    grpDisplay: "Разделы и видимость",
    structuredEntry: "Добавить структурированную запись",
    feTitle: "Название",
    feAuthors: "Авторы",
    feAuthorsHint:
      "По одному в строке или через «;» — желательно «Фамилия, Имя».",
    feVenue: "Журнал / конференция",
    feYear: "Год",
    feDoi: "DOI или URL",
    feAdd: "Добавить запись",
    tabEditor: "Редактор",
    tabPreview: "Предпросмотр",
    coachTitle: "Совет: убедитесь, что всё это ваше",
    coachBody:
      "Сопоставление авторов несовершенно. Если запись не ваша, откройте её и отметьте «Не моя» — она скрывается из резюме (никогда не удаляется) и улучшает сопоставление.",
    coachGotIt: "Понятно",
    exportWebpage: "Веб-страница (анимация)",
  },
};

/** Editor-extra strings for a locale (falls back to en-US for unknown input). */
export function editorUi(locale: string): EditorExtraStrings {
  return EDITOR_UI[asLocale(locale)] ?? EDITOR_UI["en-US"];
}
