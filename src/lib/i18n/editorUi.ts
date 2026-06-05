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
  langLabel: string;
  langLevel: string;
  langNative: string;
  langOther: string;
  refName: string;
  refAffiliation: string;
  refEmail: string;
  refPhone: string;
  // "Add a publication by DOI" (OpenAlex-sourced claim) flow.
  claimLabel: string;
  claimPlaceholder: string;
  claimFind: string;
  claimNote: string;
  claimNotFound: string;
  claimAlready: string;
  claimWhichAuthor: string;
  claimError: string;
  // Narrative-CV editor (funder résumé prose) + one-click starter layout.
  narrativeLegend: string;
  narrativeIntro: string;
  narrativeAdd: string;
  narrativeStarter: string;
  narrativeStarterNote: string;
  narrativeHeading: string;
  narrativeBody: string;
  narrativeBodyHint: string;
  narrativeCharsLeft: string;
  narrativeRemove: string;
  narrativeMoveUp: string;
  narrativeMoveDown: string;
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
    langLabel: "Language",
    langLevel: "Level",
    langNative: "Native / bilingual",
    langOther: "Other (test + score)",
    refName: "Name",
    refAffiliation: "Affiliation",
    refEmail: "Email",
    refPhone: "Phone",
    claimLabel: "Add a publication by DOI",
    claimPlaceholder: "10.1016/… or a DOI link",
    claimFind: "Find",
    claimNote: "Pulled from OpenAlex — citations, author order and FWCI come from the source, so it counts in your charts and authorship table (but not the OpenAlex author-level totals like h-index).",
    claimNotFound: "Not found in OpenAlex. Only works it indexes can be added this way.",
    claimAlready: "Already in your CV.",
    claimWhichAuthor: "Which author are you?",
    claimError: "Lookup failed — please try again.",
    narrativeLegend: "Narrative CV",
    narrativeIntro:
      "Funder-style résumé prose (UKRI / Royal Society framing). Shown above your sections. Write your own text; each module has a guidance prompt.",
    narrativeAdd: "Add narrative section",
    narrativeStarter: "Narrative CV layout",
    narrativeStarterNote:
      "Seeds the narrative modules and trims the publication list to a few selected works. Reversible — it only changes display.",
    narrativeHeading: "Heading",
    narrativeBody: "Body",
    narrativeBodyHint: "Blank line = new paragraph; lines starting with “- ” become a list.",
    narrativeCharsLeft: "{n} characters left",
    narrativeRemove: "Remove module",
    narrativeMoveUp: "Move module up",
    narrativeMoveDown: "Move module down",
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
    langLabel: "语言",
    langLevel: "水平",
    langNative: "母语／双语",
    langOther: "其他（考试＋分数）",
    refName: "姓名",
    refAffiliation: "单位",
    refEmail: "邮箱",
    refPhone: "电话",
    claimLabel: "通过 DOI 添加论文",
    claimPlaceholder: "10.1016/… 或 DOI 链接",
    claimFind: "查找",
    claimNote: "数据取自 OpenAlex——被引、作者顺序与 FWCI 均来自来源，因此会计入你的图表与作者贡献表（但不计入 h 指数等 OpenAlex 作者级总计）。",
    claimNotFound: "在 OpenAlex 中未找到。只能添加其已收录的论文。",
    claimAlready: "已在你的简历中。",
    claimWhichAuthor: "你是哪位作者？",
    claimError: "查找失败——请重试。",
    narrativeLegend: "叙述式简历",
    narrativeIntro:
      "资助方风格的叙述式简历（UKRI／英国皇家学会框架），显示在各栏目上方。请自行撰写，每个模块都有写作提示。",
    narrativeAdd: "添加叙述部分",
    narrativeStarter: "叙述式简历版式",
    narrativeStarterNote:
      "生成叙述模块，并将论文列表精简为少量代表作。可逆——仅更改显示。",
    narrativeHeading: "标题",
    narrativeBody: "正文",
    narrativeBodyHint: "空行＝新段落；以“- ”开头的行会变成列表。",
    narrativeCharsLeft: "还剩 {n} 个字符",
    narrativeRemove: "移除模块",
    narrativeMoveUp: "上移模块",
    narrativeMoveDown: "下移模块",
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
    langLabel: "Idioma",
    langLevel: "Nivel",
    langNative: "Nativo / bilingüe",
    langOther: "Otro (examen + puntuación)",
    refName: "Nombre",
    refAffiliation: "Afiliación",
    refEmail: "Correo",
    refPhone: "Teléfono",
    claimLabel: "Añadir una publicación por DOI",
    claimPlaceholder: "10.1016/… o un enlace DOI",
    claimFind: "Buscar",
    claimNote: "Se obtiene de OpenAlex: las citas, el orden de autoría y el FWCI provienen de la fuente, por lo que cuenta en tus gráficos y tabla de autoría (pero no en los totales a nivel de autor de OpenAlex, como el índice h).",
    claimNotFound: "No se encontró en OpenAlex. Solo se pueden añadir así los trabajos que indexa.",
    claimAlready: "Ya está en tu CV.",
    claimWhichAuthor: "¿Cuál autor eres?",
    claimError: "La búsqueda falló: inténtalo de nuevo.",
    narrativeLegend: "CV narrativo",
    narrativeIntro:
      "Texto de CV narrativo al estilo de las agencias financiadoras (marco UKRI / Royal Society). Se muestra encima de tus secciones. Escribe tu propio texto; cada módulo tiene una guía.",
    narrativeAdd: "Añadir sección narrativa",
    narrativeStarter: "Diseño de CV narrativo",
    narrativeStarterNote:
      "Genera los módulos narrativos y recorta la lista de publicaciones a unas obras seleccionadas. Reversible: solo cambia la visualización.",
    narrativeHeading: "Encabezado",
    narrativeBody: "Texto",
    narrativeBodyHint: "Línea en blanco = párrafo nuevo; las líneas que empiezan por «- » forman una lista.",
    narrativeCharsLeft: "Quedan {n} caracteres",
    narrativeRemove: "Eliminar módulo",
    narrativeMoveUp: "Subir módulo",
    narrativeMoveDown: "Bajar módulo",
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
    langLabel: "Langue",
    langLevel: "Niveau",
    langNative: "Langue maternelle / bilingue",
    langOther: "Autre (test + score)",
    refName: "Nom",
    refAffiliation: "Affiliation",
    refEmail: "E-mail",
    refPhone: "Téléphone",
    claimLabel: "Ajouter une publication par DOI",
    claimPlaceholder: "10.1016/… ou un lien DOI",
    claimFind: "Rechercher",
    claimNote: "Récupéré depuis OpenAlex — citations, ordre des auteurs et FWCI proviennent de la source, donc la publication compte dans vos graphiques et votre tableau de paternité (mais pas dans les totaux au niveau auteur d’OpenAlex comme l’indice h).",
    claimNotFound: "Introuvable dans OpenAlex. Seuls les travaux qu’il indexe peuvent être ajoutés ainsi.",
    claimAlready: "Déjà dans votre CV.",
    claimWhichAuthor: "Quel auteur êtes-vous ?",
    claimError: "Échec de la recherche — veuillez réessayer.",
    narrativeLegend: "CV narratif",
    narrativeIntro:
      "Texte de CV narratif façon financeurs (cadre UKRI / Royal Society). Affiché au-dessus de vos sections. Rédigez votre propre texte ; chaque module comporte une consigne.",
    narrativeAdd: "Ajouter une section narrative",
    narrativeStarter: "Mise en page CV narratif",
    narrativeStarterNote:
      "Crée les modules narratifs et réduit la liste de publications à quelques travaux choisis. Réversible — ne modifie que l’affichage.",
    narrativeHeading: "Titre",
    narrativeBody: "Texte",
    narrativeBodyHint: "Ligne vide = nouveau paragraphe ; les lignes commençant par « - » forment une liste.",
    narrativeCharsLeft: "{n} caractères restants",
    narrativeRemove: "Supprimer le module",
    narrativeMoveUp: "Monter le module",
    narrativeMoveDown: "Descendre le module",
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
    langLabel: "Sprache",
    langLevel: "Niveau",
    langNative: "Muttersprache / zweisprachig",
    langOther: "Andere (Test + Punktzahl)",
    refName: "Name",
    refAffiliation: "Zugehörigkeit",
    refEmail: "E-Mail",
    refPhone: "Telefon",
    claimLabel: "Publikation per DOI hinzufügen",
    claimPlaceholder: "10.1016/… oder ein DOI-Link",
    claimFind: "Suchen",
    claimNote: "Aus OpenAlex bezogen — Zitationen, Autorenreihenfolge und FWCI stammen aus der Quelle, daher zählt sie in Ihren Diagrammen und der Autorschaftstabelle (aber nicht in den Autoren-Gesamtwerten von OpenAlex wie dem h-Index).",
    claimNotFound: "Nicht in OpenAlex gefunden. Nur dort indexierte Arbeiten können so hinzugefügt werden.",
    claimAlready: "Bereits in Ihrem Lebenslauf.",
    claimWhichAuthor: "Welcher Autor sind Sie?",
    claimError: "Suche fehlgeschlagen – bitte erneut versuchen.",
    narrativeLegend: "Narrativer Lebenslauf",
    narrativeIntro:
      "Narrativer Lebenslauf im Stil der Förderer (UKRI- / Royal-Society-Rahmen). Wird über Ihren Abschnitten angezeigt. Schreiben Sie Ihren eigenen Text; jedes Modul hat einen Hinweis.",
    narrativeAdd: "Narrativen Abschnitt hinzufügen",
    narrativeStarter: "Layout „Narrativer Lebenslauf“",
    narrativeStarterNote:
      "Legt die narrativen Module an und kürzt die Publikationsliste auf einige ausgewählte Arbeiten. Umkehrbar – ändert nur die Anzeige.",
    narrativeHeading: "Überschrift",
    narrativeBody: "Text",
    narrativeBodyHint: "Leerzeile = neuer Absatz; Zeilen mit „- “ am Anfang werden zur Liste.",
    narrativeCharsLeft: "{n} Zeichen übrig",
    narrativeRemove: "Modul entfernen",
    narrativeMoveUp: "Modul nach oben",
    narrativeMoveDown: "Modul nach unten",
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
    langLabel: "言語",
    langLevel: "レベル",
    langNative: "母語／バイリンガル",
    langOther: "その他（試験＋スコア）",
    refName: "氏名",
    refAffiliation: "所属",
    refEmail: "メール",
    refPhone: "電話",
    claimLabel: "DOI で論文を追加",
    claimPlaceholder: "10.1016/… または DOI リンク",
    claimFind: "検索",
    claimNote: "OpenAlex から取得します。被引用数・著者順・FWCI は出典由来なので、グラフや著者一覧表には反映されますが、h 指数などの OpenAlex 著者レベルの合計には反映されません。",
    claimNotFound: "OpenAlex に見つかりません。OpenAlex が収録している論文のみ追加できます。",
    claimAlready: "すでに CV にあります。",
    claimWhichAuthor: "あなたはどの著者ですか？",
    claimError: "検索に失敗しました。もう一度お試しください。",
    narrativeLegend: "ナラティブCV",
    narrativeIntro:
      "助成機関方式のナラティブCV（UKRI／Royal Society の枠組み）。各セクションの上に表示されます。本文はご自身で記述してください。各モジュールにガイドがあります。",
    narrativeAdd: "ナラティブ欄を追加",
    narrativeStarter: "ナラティブCVレイアウト",
    narrativeStarterNote:
      "ナラティブ各モジュールを用意し、論文一覧を選抜した数件に絞ります。元に戻せます——表示のみを変更します。",
    narrativeHeading: "見出し",
    narrativeBody: "本文",
    narrativeBodyHint: "空行＝段落の区切り。「- 」で始まる行は箇条書きになります。",
    narrativeCharsLeft: "残り{n}文字",
    narrativeRemove: "モジュールを削除",
    narrativeMoveUp: "モジュールを上へ",
    narrativeMoveDown: "モジュールを下へ",
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
    langLabel: "Idioma",
    langLevel: "Nível",
    langNative: "Nativo / bilíngue",
    langOther: "Outro (teste + pontuação)",
    refName: "Nome",
    refAffiliation: "Afiliação",
    refEmail: "E-mail",
    refPhone: "Telefone",
    claimLabel: "Adicionar uma publicação por DOI",
    claimPlaceholder: "10.1016/… ou um link DOI",
    claimFind: "Buscar",
    claimNote: "Obtido do OpenAlex — citações, ordem de autoria e FWCI vêm da fonte, então conta nos seus gráficos e na tabela de autoria (mas não nos totais por autor do OpenAlex, como o índice h).",
    claimNotFound: "Não encontrado no OpenAlex. Só é possível adicionar assim os trabalhos que ele indexa.",
    claimAlready: "Já está no seu CV.",
    claimWhichAuthor: "Qual autor é você?",
    claimError: "Falha na busca — tente novamente.",
    narrativeLegend: "Currículo narrativo",
    narrativeIntro:
      "Texto de currículo narrativo no estilo das agências de fomento (estrutura UKRI / Royal Society). Exibido acima das suas seções. Escreva o seu próprio texto; cada módulo tem uma orientação.",
    narrativeAdd: "Adicionar seção narrativa",
    narrativeStarter: "Layout de currículo narrativo",
    narrativeStarterNote:
      "Cria os módulos narrativos e reduz a lista de publicações a alguns trabalhos selecionados. Reversível — altera apenas a exibição.",
    narrativeHeading: "Título",
    narrativeBody: "Texto",
    narrativeBodyHint: "Linha em branco = novo parágrafo; linhas iniciadas por “- ” viram uma lista.",
    narrativeCharsLeft: "Faltam {n} caracteres",
    narrativeRemove: "Remover módulo",
    narrativeMoveUp: "Mover módulo para cima",
    narrativeMoveDown: "Mover módulo para baixo",
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
    langLabel: "Lingua",
    langLevel: "Livello",
    langNative: "Madrelingua / bilingue",
    langOther: "Altro (test + punteggio)",
    refName: "Nome",
    refAffiliation: "Affiliazione",
    refEmail: "Email",
    refPhone: "Telefono",
    claimLabel: "Aggiungi una pubblicazione tramite DOI",
    claimPlaceholder: "10.1016/… o un link DOI",
    claimFind: "Cerca",
    claimNote: "Recuperato da OpenAlex — citazioni, ordine degli autori e FWCI provengono dalla fonte, quindi conta nei tuoi grafici e nella tabella di paternità (ma non nei totali a livello di autore di OpenAlex come l’indice h).",
    claimNotFound: "Non trovato in OpenAlex. Solo i lavori che indicizza possono essere aggiunti così.",
    claimAlready: "Già presente nel tuo CV.",
    claimWhichAuthor: "Quale autore sei?",
    claimError: "Ricerca non riuscita — riprova.",
    narrativeLegend: "CV narrativo",
    narrativeIntro:
      "CV narrativo in stile enti finanziatori (impostazione UKRI / Royal Society). Mostrato sopra le tue sezioni. Scrivi il tuo testo; ogni modulo ha una guida.",
    narrativeAdd: "Aggiungi sezione narrativa",
    narrativeStarter: "Layout CV narrativo",
    narrativeStarterNote:
      "Crea i moduli narrativi e riduce l’elenco delle pubblicazioni ad alcuni lavori selezionati. Reversibile — cambia solo la visualizzazione.",
    narrativeHeading: "Titolo",
    narrativeBody: "Testo",
    narrativeBodyHint: "Riga vuota = nuovo paragrafo; le righe che iniziano con «- » diventano un elenco.",
    narrativeCharsLeft: "{n} caratteri rimasti",
    narrativeRemove: "Rimuovi modulo",
    narrativeMoveUp: "Sposta modulo su",
    narrativeMoveDown: "Sposta modulo giù",
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
    langLabel: "언어",
    langLevel: "수준",
    langNative: "원어민/이중언어",
    langOther: "기타(시험+점수)",
    refName: "이름",
    refAffiliation: "소속",
    refEmail: "이메일",
    refPhone: "전화",
    claimLabel: "DOI로 논문 추가",
    claimPlaceholder: "10.1016/… 또는 DOI 링크",
    claimFind: "찾기",
    claimNote: "OpenAlex에서 가져옵니다 — 피인용 수, 저자 순서, FWCI가 출처에서 오므로 그래프와 저자 표에는 반영되지만 h-지수 등 OpenAlex 저자 수준 합계에는 반영되지 않습니다.",
    claimNotFound: "OpenAlex에서 찾을 수 없습니다. OpenAlex가 색인한 논문만 이렇게 추가할 수 있습니다.",
    claimAlready: "이미 CV에 있습니다.",
    claimWhichAuthor: "본인은 어느 저자인가요?",
    claimError: "조회 실패 — 다시 시도해 주세요.",
    narrativeLegend: "내러티브 CV",
    narrativeIntro:
      "연구비 지원기관 방식의 내러티브 CV(UKRI / Royal Society 틀). 섹션 위에 표시됩니다. 본문은 직접 작성하세요. 각 모듈에 안내가 있습니다.",
    narrativeAdd: "내러티브 섹션 추가",
    narrativeStarter: "내러티브 CV 레이아웃",
    narrativeStarterNote:
      "내러티브 모듈을 생성하고 논문 목록을 선별한 몇 편으로 줄입니다. 되돌릴 수 있음 — 표시만 변경합니다.",
    narrativeHeading: "제목",
    narrativeBody: "본문",
    narrativeBodyHint: "빈 줄 = 새 문단, “- ”로 시작하는 줄은 목록이 됩니다.",
    narrativeCharsLeft: "{n}자 남음",
    narrativeRemove: "모듈 삭제",
    narrativeMoveUp: "모듈 위로",
    narrativeMoveDown: "모듈 아래로",
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
    langLabel: "Язык",
    langLevel: "Уровень",
    langNative: "Родной / билингв",
    langOther: "Другое (тест + балл)",
    refName: "Имя",
    refAffiliation: "Аффилиация",
    refEmail: "Эл. почта",
    refPhone: "Телефон",
    claimLabel: "Добавить публикацию по DOI",
    claimPlaceholder: "10.1016/… или ссылка DOI",
    claimFind: "Найти",
    claimNote: "Берётся из OpenAlex — цитирования, порядок авторов и FWCI из источника, поэтому работа учитывается в ваших графиках и таблице авторства (но не в авторских итогах OpenAlex, таких как индекс Хирша).",
    claimNotFound: "Не найдено в OpenAlex. Так можно добавить только индексируемые им работы.",
    claimAlready: "Уже есть в вашем CV.",
    claimWhichAuthor: "Какой из авторов — вы?",
    claimError: "Не удалось выполнить поиск — попробуйте снова.",
    narrativeLegend: "Нарративное резюме",
    narrativeIntro:
      "Нарративное резюме в стиле грантодателей (рамка UKRI / Royal Society). Показывается над вашими разделами. Пишите свой текст; у каждого модуля есть подсказка.",
    narrativeAdd: "Добавить нарративный раздел",
    narrativeStarter: "Макет нарративного резюме",
    narrativeStarterNote:
      "Создаёт нарративные модули и сокращает список публикаций до нескольких избранных работ. Обратимо — меняет только отображение.",
    narrativeHeading: "Заголовок",
    narrativeBody: "Текст",
    narrativeBodyHint: "Пустая строка = новый абзац; строки, начинающиеся с «- », образуют список.",
    narrativeCharsLeft: "Осталось символов: {n}",
    narrativeRemove: "Удалить модуль",
    narrativeMoveUp: "Поднять модуль",
    narrativeMoveDown: "Опустить модуль",
  },
};

/** Editor-extra strings for a locale (falls back to en-US for unknown input). */
export function editorUi(locale: string): EditorExtraStrings {
  return EDITOR_UI[asLocale(locale)] ?? EDITOR_UI["en-US"];
}
