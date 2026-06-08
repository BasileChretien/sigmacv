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
  // Prose sections (narrative contribution / statement) — free-text body editor.
  proseBody: string;
  proseBodyHint: string;
  proseCharsLeft: string;
  // Grant / funder-CV presets (ERC / MSCA / NSF / JSPS) — one-click layout.
  grantLegend: string;
  grantIntro: string;
  grantApply: string;
  // CV-model catalog picker chrome (the only localized strings — model names /
  // descriptions render as-is in English). `modelGrp*` are the optgroup labels.
  modelLegend: string;
  modelApply: string;
  modelSnapshot: string;
  modelGrpGrant: string;
  modelGrpInstitution: string;
  modelGrpIndustry: string;
  /** Placeholder/optional option in the CV-model picker (selecting it is a no-op). */
  modelOptional: string;
  /** Helper line under the picker stressing it's optional. */
  modelHelp: string;
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
    claimNote:
      "Pulled from OpenAlex — citations, author order and FWCI come from the source, so it counts in your charts and authorship table (but not the OpenAlex author-level totals like h-index).",
    claimNotFound: "Not found in OpenAlex. Only works it indexes can be added this way.",
    claimAlready: "Already in your CV.",
    claimWhichAuthor: "Which author are you?",
    claimError: "Lookup failed — please try again.",
    proseBody: "Body",
    proseBodyHint: "Blank line = new paragraph; lines starting with “- ” become a list.",
    proseCharsLeft: "{n} characters left",
    grantLegend: "Grant / funder CV",
    grantIntro:
      "Apply a structured starting layout matching a major funder’s call. It shows the funder’s sections (creating any missing ones), sets their order and hides the rest. Reversible — your current view is saved first. Submit the final application via the funder’s own portal/template.",
    grantApply: "Apply {name} layout",
    modelLegend: "Choose a CV model",
    modelApply: "Apply",
    modelSnapshot: "Before CV model",
    modelGrpGrant: "Grant calls",
    modelGrpInstitution: "Public institutions",
    modelGrpIndustry: "Industry & clinical",
    modelOptional: "— Optional: start from a layout —",
    modelHelp:
      "Optional. Pick a funder or institution layout to auto-arrange your sections — or just build your CV freely.",
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
    claimNote:
      "数据取自 OpenAlex——被引、作者顺序与 FWCI 均来自来源，因此会计入你的图表与作者贡献表（但不计入 h 指数等 OpenAlex 作者级总计）。",
    claimNotFound: "在 OpenAlex 中未找到。只能添加其已收录的论文。",
    claimAlready: "已在你的简历中。",
    claimWhichAuthor: "你是哪位作者？",
    claimError: "查找失败——请重试。",
    proseBody: "正文",
    proseBodyHint: "空行＝新段落；以“- ”开头的行会变成列表。",
    proseCharsLeft: "还剩 {n} 个字符",
    grantLegend: "资助／资助方简历",
    grantIntro:
      "套用与某个重要资助方公募相匹配的结构化起始版式。它会显示该资助方的栏目（缺失的将创建）、设定其顺序并隐藏其余栏目。可逆——会先保存你当前的视图。最终申请请通过资助方自己的门户／模板提交。",
    grantApply: "套用 {name} 版式",
    modelLegend: "选择简历模型",
    modelApply: "套用",
    modelSnapshot: "套用简历模型前",
    modelGrpGrant: "资助公募",
    modelGrpInstitution: "公共机构",
    modelGrpIndustry: "产业与临床",
    modelOptional: "— 可选：从某个版式开始 —",
    modelHelp: "可选。选择一个资助方或机构版式以自动排列你的栏目——或直接自由编排你的简历。",
  },
  "es-ES": {
    grpTemplate: "Plantilla y diseño",
    grpCitations: "Citas e idioma",
    grpMetrics: "Métricas y autoría",
    grpDisplay: "Secciones y visibilidad",
    structuredEntry: "Añadir una entrada estructurada",
    feTitle: "Título",
    feAuthors: "Autores",
    feAuthorsHint: "Uno por línea o separados por «;» — preferiblemente «Apellido, Nombre».",
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
    claimNote:
      "Se obtiene de OpenAlex: las citas, el orden de autoría y el FWCI provienen de la fuente, por lo que cuenta en tus gráficos y tabla de autoría (pero no en los totales a nivel de autor de OpenAlex, como el índice h).",
    claimNotFound: "No se encontró en OpenAlex. Solo se pueden añadir así los trabajos que indexa.",
    claimAlready: "Ya está en tu CV.",
    claimWhichAuthor: "¿Cuál autor eres?",
    claimError: "La búsqueda falló: inténtalo de nuevo.",
    proseBody: "Texto",
    proseBodyHint:
      "Línea en blanco = párrafo nuevo; las líneas que empiezan por «- » forman una lista.",
    proseCharsLeft: "Quedan {n} caracteres",
    grantLegend: "CV de subvención / financiador",
    grantIntro:
      "Aplica un diseño inicial estructurado acorde con una gran convocatoria de un financiador. Muestra las secciones del financiador (creando las que falten), fija su orden y oculta el resto. Reversible: tu vista actual se guarda primero. Presenta la solicitud final mediante el portal/plantilla del propio financiador.",
    grantApply: "Aplicar diseño {name}",
    modelLegend: "Elige un modelo de CV",
    modelApply: "Aplicar",
    modelSnapshot: "Antes del modelo de CV",
    modelGrpGrant: "Convocatorias de financiación",
    modelGrpInstitution: "Instituciones públicas",
    modelGrpIndustry: "Industria y clínica",
    modelOptional: "— Opcional: parte de un diseño —",
    modelHelp:
      "Opcional. Elige un diseño de financiador o institución para ordenar tus secciones automáticamente, o crea tu CV libremente.",
  },
  "fr-FR": {
    grpTemplate: "Modèle et mise en page",
    grpCitations: "Citations et langue",
    grpMetrics: "Indicateurs et rôles d’auteur",
    grpDisplay: "Sections et affichage",
    structuredEntry: "Ajouter une entrée structurée",
    feTitle: "Titre",
    feAuthors: "Auteurs",
    feAuthorsHint: "Un par ligne ou séparés par « ; » — idéalement « Nom, Prénom ».",
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
    claimNote:
      "Récupéré depuis OpenAlex — citations, ordre des auteurs et FWCI proviennent de la source, donc la publication compte dans vos graphiques et votre tableau de paternité (mais pas dans les totaux au niveau auteur d’OpenAlex comme l’indice h).",
    claimNotFound:
      "Introuvable dans OpenAlex. Seuls les travaux qu’il indexe peuvent être ajoutés ainsi.",
    claimAlready: "Déjà dans votre CV.",
    claimWhichAuthor: "Quel auteur êtes-vous ?",
    claimError: "Échec de la recherche — veuillez réessayer.",
    proseBody: "Texte",
    proseBodyHint:
      "Ligne vide = nouveau paragraphe ; les lignes commençant par « - » forment une liste.",
    proseCharsLeft: "{n} caractères restants",
    grantLegend: "CV de financement",
    grantIntro:
      "Appliquez une mise en page de départ structurée correspondant à un grand appel d’un financeur. Elle affiche les sections du financeur (en créant celles qui manquent), fixe leur ordre et masque les autres. Réversible — votre vue actuelle est d’abord enregistrée. Déposez la candidature finale via le portail/modèle propre au financeur.",
    grantApply: "Appliquer la mise en page {name}",
    modelLegend: "Choisir un modèle de CV",
    modelApply: "Appliquer",
    modelSnapshot: "Avant le modèle de CV",
    modelGrpGrant: "Appels à financement",
    modelGrpInstitution: "Institutions publiques",
    modelGrpIndustry: "Industrie et clinique",
    modelOptional: "— Facultatif : partir d’une mise en page —",
    modelHelp:
      "Facultatif. Choisissez une mise en page de financeur ou d’institution pour organiser automatiquement vos sections — ou composez votre CV librement.",
  },
  "de-DE": {
    grpTemplate: "Vorlage & Layout",
    grpCitations: "Zitate & Sprache",
    grpMetrics: "Metriken & Autorenschaft",
    grpDisplay: "Abschnitte & Sichtbarkeit",
    structuredEntry: "Strukturierten Eintrag hinzufügen",
    feTitle: "Titel",
    feAuthors: "Autoren",
    feAuthorsHint: "Einer pro Zeile oder durch „;“ getrennt — idealerweise „Nachname, Vorname“.",
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
    claimNote:
      "Aus OpenAlex bezogen — Zitationen, Autorenreihenfolge und FWCI stammen aus der Quelle, daher zählt sie in Ihren Diagrammen und der Autorschaftstabelle (aber nicht in den Autoren-Gesamtwerten von OpenAlex wie dem h-Index).",
    claimNotFound:
      "Nicht in OpenAlex gefunden. Nur dort indexierte Arbeiten können so hinzugefügt werden.",
    claimAlready: "Bereits in Ihrem Lebenslauf.",
    claimWhichAuthor: "Welcher Autor sind Sie?",
    claimError: "Suche fehlgeschlagen – bitte erneut versuchen.",
    proseBody: "Text",
    proseBodyHint: "Leerzeile = neuer Absatz; Zeilen mit „- “ am Anfang werden zur Liste.",
    proseCharsLeft: "{n} Zeichen übrig",
    grantLegend: "Förder-Lebenslauf",
    grantIntro:
      "Wenden Sie ein strukturiertes Ausgangslayout passend zur Ausschreibung eines großen Förderers an. Es zeigt die Abschnitte des Förderers (legt fehlende an), setzt ihre Reihenfolge und blendet die übrigen aus. Umkehrbar — Ihre aktuelle Ansicht wird zuvor gespeichert. Reichen Sie den endgültigen Antrag über das Portal/die Vorlage des Förderers ein.",
    grantApply: "Layout {name} anwenden",
    modelLegend: "Lebenslauf-Modell wählen",
    modelApply: "Anwenden",
    modelSnapshot: "Vor dem Lebenslauf-Modell",
    modelGrpGrant: "Förderausschreibungen",
    modelGrpInstitution: "Öffentliche Einrichtungen",
    modelGrpIndustry: "Industrie & Klinik",
    modelOptional: "— Optional: mit einem Layout beginnen —",
    modelHelp:
      "Optional. Wählen Sie ein Förderer- oder Institutionslayout, um Ihre Abschnitte automatisch anzuordnen — oder erstellen Sie Ihren Lebenslauf frei.",
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
    claimNote:
      "OpenAlex から取得します。被引用数・著者順・FWCI は出典由来なので、グラフや著者一覧表には反映されますが、h 指数などの OpenAlex 著者レベルの合計には反映されません。",
    claimNotFound: "OpenAlex に見つかりません。OpenAlex が収録している論文のみ追加できます。",
    claimAlready: "すでに CV にあります。",
    claimWhichAuthor: "あなたはどの著者ですか？",
    claimError: "検索に失敗しました。もう一度お試しください。",
    proseBody: "本文",
    proseBodyHint: "空行＝段落の区切り。「- 」で始まる行は箇条書きになります。",
    proseCharsLeft: "残り{n}文字",
    grantLegend: "助成用 CV",
    grantIntro:
      "主要な助成機関の公募に合わせた構造化された初期レイアウトを適用します。その助成機関のセクションを表示し（不足分は作成）、順序を設定し、残りを非表示にします。元に戻せます——先に現在のビューを保存します。最終的な申請は助成機関自身のポータル／テンプレートで提出してください。",
    grantApply: "{name} レイアウトを適用",
    modelLegend: "CV モデルを選択",
    modelApply: "適用",
    modelSnapshot: "CV モデル適用前",
    modelGrpGrant: "助成公募",
    modelGrpInstitution: "公的機関",
    modelGrpIndustry: "産業・臨床",
    modelOptional: "— 任意：レイアウトから始める —",
    modelHelp:
      "任意です。助成機関や機関のレイアウトを選ぶとセクションが自動で並びます。自由に CV を作成することもできます。",
  },
  "pt-BR": {
    grpTemplate: "Modelo e layout",
    grpCitations: "Citações e idioma",
    grpMetrics: "Métricas e autoria",
    grpDisplay: "Seções e visibilidade",
    structuredEntry: "Adicionar uma entrada estruturada",
    feTitle: "Título",
    feAuthors: "Autores",
    feAuthorsHint: "Um por linha ou separados por “;” — de preferência “Sobrenome, Nome”.",
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
    claimNote:
      "Obtido do OpenAlex — citações, ordem de autoria e FWCI vêm da fonte, então conta nos seus gráficos e na tabela de autoria (mas não nos totais por autor do OpenAlex, como o índice h).",
    claimNotFound:
      "Não encontrado no OpenAlex. Só é possível adicionar assim os trabalhos que ele indexa.",
    claimAlready: "Já está no seu CV.",
    claimWhichAuthor: "Qual autor é você?",
    claimError: "Falha na busca — tente novamente.",
    proseBody: "Texto",
    proseBodyHint: "Linha em branco = novo parágrafo; linhas iniciadas por “- ” viram uma lista.",
    proseCharsLeft: "Faltam {n} caracteres",
    grantLegend: "Currículo de financiamento",
    grantIntro:
      "Aplique um layout inicial estruturado correspondente a uma grande chamada de um financiador. Ele mostra as seções do financiador (criando as que faltam), define a ordem delas e oculta as demais. Reversível — sua visualização atual é salva primeiro. Envie a candidatura final pelo portal/modelo do próprio financiador.",
    grantApply: "Aplicar layout {name}",
    modelLegend: "Escolha um modelo de currículo",
    modelApply: "Aplicar",
    modelSnapshot: "Antes do modelo de currículo",
    modelGrpGrant: "Chamadas de financiamento",
    modelGrpInstitution: "Instituições públicas",
    modelGrpIndustry: "Indústria e clínica",
    modelOptional: "— Opcional: comece a partir de um layout —",
    modelHelp:
      "Opcional. Escolha um layout de financiador ou instituição para organizar suas seções automaticamente — ou monte seu currículo livremente.",
  },
  "it-IT": {
    grpTemplate: "Modello e layout",
    grpCitations: "Citazioni e lingua",
    grpMetrics: "Metriche e ruoli d’autore",
    grpDisplay: "Sezioni e visibilità",
    structuredEntry: "Aggiungi una voce strutturata",
    feTitle: "Titolo",
    feAuthors: "Autori",
    feAuthorsHint: "Uno per riga o separati da «;» — preferibilmente «Cognome, Nome».",
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
    claimNote:
      "Recuperato da OpenAlex — citazioni, ordine degli autori e FWCI provengono dalla fonte, quindi conta nei tuoi grafici e nella tabella di paternità (ma non nei totali a livello di autore di OpenAlex come l’indice h).",
    claimNotFound:
      "Non trovato in OpenAlex. Solo i lavori che indicizza possono essere aggiunti così.",
    claimAlready: "Già presente nel tuo CV.",
    claimWhichAuthor: "Quale autore sei?",
    claimError: "Ricerca non riuscita — riprova.",
    proseBody: "Testo",
    proseBodyHint:
      "Riga vuota = nuovo paragrafo; le righe che iniziano con «- » diventano un elenco.",
    proseCharsLeft: "{n} caratteri rimasti",
    grantLegend: "CV per finanziamenti",
    grantIntro:
      "Applica un layout iniziale strutturato corrispondente a un importante bando di un ente finanziatore. Mostra le sezioni dell’ente (creando quelle mancanti), ne imposta l’ordine e nasconde le altre. Reversibile — la tua vista attuale viene salvata prima. Presenta la domanda finale tramite il portale/modello dell’ente finanziatore.",
    grantApply: "Applica layout {name}",
    modelLegend: "Scegli un modello di CV",
    modelApply: "Applica",
    modelSnapshot: "Prima del modello di CV",
    modelGrpGrant: "Bandi di finanziamento",
    modelGrpInstitution: "Istituzioni pubbliche",
    modelGrpIndustry: "Industria e clinica",
    modelOptional: "— Facoltativo: parti da un layout —",
    modelHelp:
      "Facoltativo. Scegli un layout di un ente finanziatore o di un’istituzione per disporre automaticamente le tue sezioni — oppure crea il tuo CV liberamente.",
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
    claimNote:
      "OpenAlex에서 가져옵니다 — 피인용 수, 저자 순서, FWCI가 출처에서 오므로 그래프와 저자 표에는 반영되지만 h-지수 등 OpenAlex 저자 수준 합계에는 반영되지 않습니다.",
    claimNotFound:
      "OpenAlex에서 찾을 수 없습니다. OpenAlex가 색인한 논문만 이렇게 추가할 수 있습니다.",
    claimAlready: "이미 CV에 있습니다.",
    claimWhichAuthor: "본인은 어느 저자인가요?",
    claimError: "조회 실패 — 다시 시도해 주세요.",
    proseBody: "본문",
    proseBodyHint: "빈 줄 = 새 문단, “- ”로 시작하는 줄은 목록이 됩니다.",
    proseCharsLeft: "{n}자 남음",
    grantLegend: "연구비 CV",
    grantIntro:
      "주요 지원기관 공모에 맞는 구조화된 시작 레이아웃을 적용합니다. 해당 지원기관의 섹션을 표시하고(없으면 생성), 순서를 설정하며 나머지는 숨깁니다. 되돌릴 수 있음 — 현재 보기를 먼저 저장합니다. 최종 지원은 지원기관 자체 포털/템플릿으로 제출하세요.",
    grantApply: "{name} 레이아웃 적용",
    modelLegend: "CV 모델 선택",
    modelApply: "적용",
    modelSnapshot: "CV 모델 적용 전",
    modelGrpGrant: "연구비 공모",
    modelGrpInstitution: "공공기관",
    modelGrpIndustry: "산업 및 임상",
    modelOptional: "— 선택 사항: 레이아웃에서 시작 —",
    modelHelp:
      "선택 사항입니다. 지원기관이나 기관 레이아웃을 고르면 섹션이 자동으로 배치됩니다 — 또는 자유롭게 CV를 작성하세요.",
  },
  "ru-RU": {
    grpTemplate: "Шаблон и вёрстка",
    grpCitations: "Цитирование и язык",
    grpMetrics: "Метрики и авторство",
    grpDisplay: "Разделы и видимость",
    structuredEntry: "Добавить структурированную запись",
    feTitle: "Название",
    feAuthors: "Авторы",
    feAuthorsHint: "По одному в строке или через «;» — желательно «Фамилия, Имя».",
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
    claimNote:
      "Берётся из OpenAlex — цитирования, порядок авторов и FWCI из источника, поэтому работа учитывается в ваших графиках и таблице авторства (но не в авторских итогах OpenAlex, таких как индекс Хирша).",
    claimNotFound: "Не найдено в OpenAlex. Так можно добавить только индексируемые им работы.",
    claimAlready: "Уже есть в вашем CV.",
    claimWhichAuthor: "Какой из авторов — вы?",
    claimError: "Не удалось выполнить поиск — попробуйте снова.",
    proseBody: "Текст",
    proseBodyHint: "Пустая строка = новый абзац; строки, начинающиеся с «- », образуют список.",
    proseCharsLeft: "Осталось символов: {n}",
    grantLegend: "Резюме для гранта",
    grantIntro:
      "Примените структурированный начальный макет под крупный конкурс грантодателя. Он показывает разделы грантодателя (создавая недостающие), задаёт их порядок и скрывает остальные. Обратимо — текущий вид сохраняется заранее. Итоговую заявку подавайте через собственный портал/шаблон грантодателя.",
    grantApply: "Применить макет {name}",
    modelLegend: "Выберите модель резюме",
    modelApply: "Применить",
    modelSnapshot: "До модели резюме",
    modelGrpGrant: "Грантовые конкурсы",
    modelGrpInstitution: "Государственные учреждения",
    modelGrpIndustry: "Индустрия и клиника",
    modelOptional: "— Необязательно: начать с макета —",
    modelHelp:
      "Необязательно. Выберите макет грантодателя или учреждения, чтобы автоматически расставить разделы, — или составьте резюме свободно.",
  },
};

/** Editor-extra strings for a locale (falls back to en-US for unknown input). */
export function editorUi(locale: string): EditorExtraStrings {
  return EDITOR_UI[asLocale(locale)] ?? EDITOR_UI["en-US"];
}
