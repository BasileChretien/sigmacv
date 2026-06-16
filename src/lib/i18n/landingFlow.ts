import { asLocale, type Locale } from "./index";

/**
 * Homepage "how it works" flow copy: the three steps (Curate / Style / Export)
 * shown as feature rows beside their looping animations, plus the section
 * heading, the templates link label, and the closing CTA. Kept in its own module
 * (same convention as landingAudience.ts / orcidHelp.ts) so the existing
 * landing.ts copy is untouched.
 *
 * Typed as Record<Locale, LandingFlow> so a missing locale/field is a compile
 * error. Non-English copy was machine-drafted and is flagged for native review.
 * "SigmaCV", "ORCID", "CSL", "DOI", "PDF", "DOCX", "LaTeX", "Markdown", funder
 * names and "58" are brand/proper nouns or universal tokens — left untranslated.
 */
export interface LandingStep {
  title: string;
  body: string;
  /** Three concise benefit bullets (same count in every locale). */
  points: string[];
}

export interface LandingFlow {
  howTitle: string;
  howSub: string;
  /** Four steps: Curate, Style, Export, Publish (same count in every locale). */
  steps: LandingStep[];
  /** Label for the link to the funder-cv-templates landing page. */
  templatesCta: string;
  /** Closing call-to-action heading. */
  ctaTitle: string;
  /** Short "Optional" badge on the Publish step (step 4 is not required). */
  optionalLabel: string;
}

const LANDING_FLOW_I18N: Record<Locale, LandingFlow> = {
  "en-US": {
    howTitle: "How it works",
    howSub: "From the open record to a CV you control, step by step.",
    steps: [
      {
        title: "Curate what's yours",
        body: "Drop anything name-matched that isn't you, reorder, and hide whole sections — publications, grants, datasets and editorial roles.",
        points: [
          "Nothing is deleted upstream — it only changes your display",
          "Reorder, rename and hide whole sections",
          "Self-claim works the matcher missed, by DOI",
        ],
      },
      {
        title: "Style it your way",
        body: "58 one-click layouts, any citation style, and your name highlighted by identifier — never by string.",
        points: [
          "58 one-click funder, job & industry layouts",
          "Any CSL citation style — identical across every export",
          "Field-normalized metrics, opt-in and off by default",
        ],
      },
      {
        title: "Export anywhere",
        body: "One canonical CV, every format — all from the same structured document, so they never drift apart.",
        points: [
          "Pixel-perfect PDF, editable DOCX, LaTeX, Markdown",
          "Identical citations in every format — never re-typed",
          "Your data is portable — full export any time",
        ],
      },
      {
        title: "Publish a living page",
        body: "Share one public page that re-syncs from the open record as your work grows — always current, no re-upload. Online only; your exports never change.",
        points: [
          "A clean public URL that updates itself as new work appears",
          "Per-field publish consent — unpublish or go private anytime",
          "Optional animated showcase styles — web-only, sober by default",
        ],
      },
    ],
    templatesCta: "Browse all 58 funder, job & industry templates",
    ctaTitle: "Build your CV from the open research record.",
    optionalLabel: "Optional",
  },
  "zh-CN": {
    howTitle: "工作原理",
    howSub: "从公开学术记录到你掌控的简历——一步一步来。",
    steps: [
      {
        title: "管理属于你的内容",
        body: "删除任何同名匹配但并非你本人的条目，重新排序，并隐藏整个板块——论文、基金、数据集和编辑职务。",
        points: [
          "不会从上游删除——仅改变你的展示",
          "重新排序、重命名并隐藏整个板块",
          "通过 DOI 认领匹配遗漏的成果",
        ],
      },
      {
        title: "按你的方式设计",
        body: "58 种一键布局，任意引用样式，并通过标识符（而非姓名字符串）高亮你的名字。",
        points: [
          "58 种一键式资助方、求职与行业布局",
          "任意 CSL 引用样式——所有导出格式完全一致",
          "领域标准化指标，可选启用，默认关闭",
        ],
      },
      {
        title: "随处导出",
        body: "一份规范化简历，导出任意格式——全部源自同一结构化文档，永不脱节。",
        points: [
          "精美 PDF、可编辑 DOCX、LaTeX、Markdown",
          "所有格式中引用完全一致——无需重新录入",
          "数据可携——随时完整导出",
        ],
      },
      {
        title: "发布在线主页",
        body: "分享一个随你的成果增长而自动同步公开记录的在线页面——始终最新，无需重新上传。仅在线显示；导出文件不会改变。",
        points: [
          "干净的公开网址，随新成果出现自动更新",
          "逐项发布授权——随时取消发布或转为私密",
          "可选的动画展示样式——仅在线，默认朴素",
        ],
      },
    ],
    templatesCta: "浏览全部 58 种资助方、求职与行业模板",
    ctaTitle: "用公开学术记录构建你的简历。",
    optionalLabel: "可选",
  },
  "es-ES": {
    howTitle: "Cómo funciona",
    howSub: "Del registro abierto a un CV que controlas, paso a paso.",
    steps: [
      {
        title: "Selecciona lo que es tuyo",
        body: "Descarta lo que coincide por nombre pero no eres tú, reordena y oculta secciones enteras — publicaciones, financiación, conjuntos de datos y funciones editoriales.",
        points: [
          "No se elimina nada en origen — solo cambia tu visualización",
          "Reordena, renombra y oculta secciones enteras",
          "Reclama por DOI lo que el emparejador no detectó",
        ],
      },
      {
        title: "Dale tu estilo",
        body: "58 diseños de un clic, cualquier estilo de cita y tu nombre resaltado por identificador, nunca por cadena de texto.",
        points: [
          "58 diseños de un clic para financiadores, empleo e industria",
          "Cualquier estilo de cita CSL — idéntico en todas las exportaciones",
          "Métricas normalizadas por campo, opcionales y desactivadas por defecto",
        ],
      },
      {
        title: "Exporta a cualquier formato",
        body: "Un CV canónico, todos los formatos — todos del mismo documento estructurado, así nunca divergen.",
        points: [
          "PDF impecable, DOCX editable, LaTeX, Markdown",
          "Citas idénticas en todos los formatos — sin volver a escribirlas",
          "Tus datos son portables — exportación completa cuando quieras",
        ],
      },
      {
        title: "Publica una página viva",
        body: "Comparte una página pública que se resincroniza con el registro abierto a medida que crece tu trabajo — siempre al día, sin volver a subir nada. Solo en línea; tus exportaciones no cambian.",
        points: [
          "Una URL pública limpia que se actualiza al aparecer trabajos nuevos",
          "Consentimiento de publicación por campo — despublica o hazla privada cuando quieras",
          "Estilos animados opcionales — solo en la web, sobrios por defecto",
        ],
      },
    ],
    templatesCta: "Explora las 58 plantillas para financiadores, empleo e industria",
    ctaTitle: "Crea tu CV a partir del registro abierto.",
    optionalLabel: "Opcional",
  },
  "fr-FR": {
    howTitle: "Comment ça marche",
    howSub: "Du registre ouvert à un CV que vous maîtrisez, étape par étape.",
    steps: [
      {
        title: "Sélectionnez ce qui est à vous",
        body: "Retirez tout ce qui correspond à votre nom sans être vous, réordonnez et masquez des sections entières — publications, financements, jeux de données et rôles éditoriaux.",
        points: [
          "Rien n'est supprimé en amont — seul votre affichage change",
          "Réordonnez, renommez et masquez des sections entières",
          "Revendiquez par DOI les travaux manqués par l'appariement",
        ],
      },
      {
        title: "Personnalisez le style",
        body: "58 mises en page en un clic, n'importe quel style de citation, et votre nom mis en évidence par identifiant — jamais par chaîne de caractères.",
        points: [
          "58 mises en page en un clic : financeurs, emploi et industrie",
          "Tout style de citation CSL — identique dans tous les exports",
          "Indicateurs normalisés par domaine, optionnels et désactivés par défaut",
        ],
      },
      {
        title: "Exportez partout",
        body: "Un CV canonique, tous les formats — tous issus du même document structuré, sans jamais diverger.",
        points: [
          "PDF impeccable, DOCX modifiable, LaTeX, Markdown",
          "Des citations identiques dans tous les formats — jamais ressaisies",
          "Vos données sont portables — export complet à tout moment",
        ],
      },
      {
        title: "Publiez une page vivante",
        body: "Partagez une page publique qui se resynchronise avec le registre ouvert à mesure que vos travaux s'enrichissent — toujours à jour, sans réimport. En ligne uniquement ; vos exports ne changent jamais.",
        points: [
          "Une URL publique nette qui se met à jour quand de nouveaux travaux paraissent",
          "Consentement de publication par champ — dépubliez ou passez en privé à tout moment",
          "Styles animés en option — web uniquement, sobres par défaut",
        ],
      },
    ],
    templatesCta: "Parcourir les 58 modèles financeurs, emploi et industrie",
    ctaTitle: "Construisez votre CV à partir du registre ouvert.",
    optionalLabel: "Facultatif",
  },
  "de-DE": {
    howTitle: "So funktioniert's",
    howSub: "Vom offenen Forschungsnachweis zu einem CV, den Sie steuern — Schritt für Schritt.",
    steps: [
      {
        title: "Kuratieren Sie, was Ihnen gehört",
        body: "Entfernen Sie alles, was über den Namen zugeordnet wurde, aber nicht von Ihnen ist, ordnen Sie um und blenden Sie ganze Abschnitte aus — Publikationen, Förderungen, Datensätze und Editor-Rollen.",
        points: [
          "Nichts wird an der Quelle gelöscht — nur Ihre Anzeige ändert sich",
          "Abschnitte umordnen, umbenennen und ausblenden",
          "Per DOI nachtragen, was die Zuordnung übersehen hat",
        ],
      },
      {
        title: "Gestalten Sie nach Ihrem Stil",
        body: "58 Layouts per Klick, jeder Zitierstil und Ihr Name per Identifikator hervorgehoben — nie per Namensstring.",
        points: [
          "58 Ein-Klick-Layouts für Förderer, Job und Industrie",
          "Jeder CSL-Zitierstil — in jedem Export identisch",
          "Feldnormierte Metriken, optional und standardmäßig aus",
        ],
      },
      {
        title: "Überall exportieren",
        body: "Ein kanonischer CV, jedes Format — alle aus demselben strukturierten Dokument, ohne je auseinanderzudriften.",
        points: [
          "Pixelgenaues PDF, editierbares DOCX, LaTeX, Markdown",
          "Identische Zitate in jedem Format — nie neu getippt",
          "Ihre Daten sind portabel — jederzeit vollständiger Export",
        ],
      },
      {
        title: "Veröffentlichen Sie eine lebende Seite",
        body: "Teilen Sie eine öffentliche Seite, die sich mit dem offenen Nachweis neu synchronisiert, während Ihre Arbeit wächst — stets aktuell, ohne erneutes Hochladen. Nur online; Ihre Exporte ändern sich nie.",
        points: [
          "Eine saubere öffentliche URL, die sich bei neuen Arbeiten selbst aktualisiert",
          "Feldweise Veröffentlichungsfreigabe — jederzeit zurückziehen oder privat schalten",
          "Optionale animierte Showcase-Stile — nur im Web, standardmäßig schlicht",
        ],
      },
    ],
    templatesCta: "Alle 58 Vorlagen für Förderer, Job und Industrie ansehen",
    ctaTitle: "Erstellen Sie Ihren CV aus dem offenen Forschungsnachweis.",
    optionalLabel: "Optional",
  },
  "ja-JP": {
    howTitle: "仕組み",
    howSub: "公開された研究記録から、あなたが管理できる CV へ——ステップごとに。",
    steps: [
      {
        title: "自分のものを取捨選択",
        body: "名前が一致するだけであなたではないものを除外し、並べ替え、セクションごと非表示に——論文、助成金、データセット、編集者の役割。",
        points: [
          "元データは削除されません——表示が変わるだけ",
          "セクションの並べ替え・名称変更・非表示",
          "照合が見逃した成果を DOI で追加",
        ],
      },
      {
        title: "好みのスタイルに",
        body: "ワンクリックの 58 レイアウト、任意の引用スタイル、そして名前は識別子で強調——文字列では照合しません。",
        points: [
          "助成機関・求職・業界向けのワンクリック 58 レイアウト",
          "任意の CSL 引用スタイル——すべての書き出しで同一",
          "分野標準化指標、オプトインで既定はオフ",
        ],
      },
      {
        title: "どこへでも書き出し",
        body: "正規の CV ひとつであらゆる形式へ——同じ構造化文書から生成されるため、ずれません。",
        points: [
          "精緻な PDF、編集可能な DOCX、LaTeX、Markdown",
          "すべての形式で引用が同一——再入力不要",
          "データは持ち出し可能——いつでも完全エクスポート",
        ],
      },
      {
        title: "公開ページを公開",
        body: "成果の増加に合わせて公開記録から再同期される公開ページを共有——常に最新で、再アップロード不要。オンライン限定で、書き出しは変わりません。",
        points: [
          "新しい成果が出るたびに自動更新される、すっきりした公開 URL",
          "項目ごとの公開同意——いつでも非公開化・取り下げ可能",
          "任意のアニメーション表示スタイル——ウェブ限定、既定はシンプル",
        ],
      },
    ],
    templatesCta: "助成機関・求職・業界向けの全 58 テンプレートを見る",
    ctaTitle: "公開された研究記録から CV を作成。",
    optionalLabel: "任意",
  },
  "pt-BR": {
    howTitle: "Como funciona",
    howSub: "Do registro aberto a um currículo que você controla, passo a passo.",
    steps: [
      {
        title: "Faça a curadoria do que é seu",
        body: "Remova o que foi associado pelo nome mas não é você, reordene e oculte seções inteiras — publicações, financiamentos, conjuntos de dados e funções editoriais.",
        points: [
          "Nada é excluído na origem — só muda a sua exibição",
          "Reordene, renomeie e oculte seções inteiras",
          "Reivindique por DOI o que a correspondência deixou passar",
        ],
      },
      {
        title: "Estilize do seu jeito",
        body: "58 layouts com um clique, qualquer estilo de citação e seu nome destacado por identificador — nunca por texto.",
        points: [
          "58 layouts de um clique para financiadores, emprego e indústria",
          "Qualquer estilo de citação CSL — idêntico em toda exportação",
          "Métricas normalizadas por área, opcionais e desativadas por padrão",
        ],
      },
      {
        title: "Exporte para qualquer lugar",
        body: "Um currículo canônico, todos os formatos — todos do mesmo documento estruturado, sem nunca divergir.",
        points: [
          "PDF impecável, DOCX editável, LaTeX, Markdown",
          "Citações idênticas em todos os formatos — sem redigitar",
          "Seus dados são portáveis — exportação completa quando quiser",
        ],
      },
      {
        title: "Publique uma página viva",
        body: "Compartilhe uma página pública que se ressincroniza com o registro aberto conforme seu trabalho cresce — sempre atual, sem reenviar. Somente on-line; suas exportações nunca mudam.",
        points: [
          "Uma URL pública limpa que se atualiza quando surgem novos trabalhos",
          "Consentimento de publicação por campo — despublique ou torne privada quando quiser",
          "Estilos animados opcionais — somente na web, sóbrios por padrão",
        ],
      },
    ],
    templatesCta: "Veja todos os 58 modelos para financiadores, emprego e indústria",
    ctaTitle: "Monte seu currículo a partir do registro aberto.",
    optionalLabel: "Opcional",
  },
  "it-IT": {
    howTitle: "Come funziona",
    howSub: "Dal registro aperto a un CV che controlli tu, passo dopo passo.",
    steps: [
      {
        title: "Cura ciò che è tuo",
        body: "Rimuovi ciò che è abbinato per nome ma non sei tu, riordina e nascondi intere sezioni — pubblicazioni, finanziamenti, dataset e ruoli editoriali.",
        points: [
          "Niente viene eliminato all'origine — cambia solo la tua visualizzazione",
          "Riordina, rinomina e nascondi intere sezioni",
          "Rivendica tramite DOI ciò che l'abbinamento ha mancato",
        ],
      },
      {
        title: "Dai il tuo stile",
        body: "58 layout con un clic, qualsiasi stile di citazione e il tuo nome evidenziato per identificatore — mai per stringa.",
        points: [
          "58 layout con un clic per finanziatori, lavoro e industria",
          "Qualsiasi stile di citazione CSL — identico in ogni esportazione",
          "Metriche normalizzate per campo, opt-in e disattivate per impostazione predefinita",
        ],
      },
      {
        title: "Esporta ovunque",
        body: "Un CV canonico, ogni formato — tutti dallo stesso documento strutturato, senza mai divergere.",
        points: [
          "PDF impeccabile, DOCX modificabile, LaTeX, Markdown",
          "Citazioni identiche in ogni formato — mai riscritte",
          "I tuoi dati sono portabili — esportazione completa quando vuoi",
        ],
      },
      {
        title: "Pubblica una pagina viva",
        body: "Condividi una pagina pubblica che si risincronizza con il registro aperto man mano che il tuo lavoro cresce — sempre aggiornata, senza ricaricare nulla. Solo online; le tue esportazioni non cambiano mai.",
        points: [
          "Un URL pubblico pulito che si aggiorna quando compaiono nuovi lavori",
          "Consenso alla pubblicazione per campo — annulla la pubblicazione o rendi privata quando vuoi",
          "Stili animati opzionali — solo web, sobri per impostazione predefinita",
        ],
      },
    ],
    templatesCta: "Sfoglia tutti i 58 modelli per finanziatori, lavoro e industria",
    ctaTitle: "Crea il tuo CV dal registro aperto.",
    optionalLabel: "Facoltativo",
  },
  "ko-KR": {
    howTitle: "이용 방법",
    howSub: "공개된 연구 기록에서 당신이 관리하는 CV까지 — 한 단계씩.",
    steps: [
      {
        title: "내 것만 선별하기",
        body: "이름만 일치하고 본인이 아닌 항목을 제거하고, 순서를 바꾸고, 섹션 전체를 숨기세요 — 논문, 연구비, 데이터셋, 편집 역할.",
        points: [
          "원본은 삭제되지 않으며 — 표시만 바뀝니다",
          "섹션 순서 변경·이름 변경·숨기기",
          "매칭이 놓친 성과를 DOI로 직접 추가",
        ],
      },
      {
        title: "원하는 스타일로",
        body: "원클릭 58개 레이아웃, 모든 인용 스타일, 그리고 이름은 문자열이 아닌 식별자로 강조.",
        points: [
          "연구비·구직·산업용 원클릭 58개 레이아웃",
          "모든 CSL 인용 스타일 — 모든 내보내기에서 동일",
          "분야 정규화 지표, 옵트인이며 기본은 꺼짐",
        ],
      },
      {
        title: "어디로든 내보내기",
        body: "하나의 표준 CV로 모든 형식을 — 동일한 구조화 문서에서 생성되어 서로 어긋나지 않습니다.",
        points: [
          "완벽한 PDF, 편집 가능한 DOCX, LaTeX, Markdown",
          "모든 형식에서 동일한 인용 — 다시 입력할 필요 없음",
          "데이터는 이동 가능 — 언제든 전체 내보내기",
        ],
      },
      {
        title: "살아있는 공개 페이지 게시",
        body: "성과가 늘어남에 따라 공개 기록에서 재동기화되는 공개 페이지를 공유하세요 — 항상 최신이며 다시 올릴 필요가 없습니다. 온라인 전용이며, 내보내기는 바뀌지 않습니다.",
        points: [
          "새 성과가 나오면 스스로 업데이트되는 깔끔한 공개 URL",
          "항목별 게시 동의 — 언제든 게시 취소하거나 비공개로 전환",
          "선택적 애니메이션 쇼케이스 스타일 — 웹 전용, 기본은 차분하게",
        ],
      },
    ],
    templatesCta: "연구비·구직·산업용 58개 템플릿 모두 보기",
    ctaTitle: "공개된 연구 기록으로 CV를 만드세요.",
    optionalLabel: "선택 사항",
  },
  "ru-RU": {
    howTitle: "Как это работает",
    howSub: "От открытого реестра к резюме, которым управляете вы, — шаг за шагом.",
    steps: [
      {
        title: "Отберите своё",
        body: "Уберите всё, что совпало по имени, но не относится к вам, измените порядок и скрывайте целые разделы — публикации, гранты, наборы данных и редакторские роли.",
        points: [
          "Ничего не удаляется в источнике — меняется только отображение",
          "Меняйте порядок, переименовывайте и скрывайте разделы",
          "Добавляйте по DOI то, что пропустило сопоставление",
        ],
      },
      {
        title: "Оформите по-своему",
        body: "58 макетов в один клик, любой стиль цитирования и ваше имя, выделяемое по идентификатору, а не по строке.",
        points: [
          "58 макетов в один клик: фонды, работа и индустрия",
          "Любой стиль цитирования CSL — одинаково во всех форматах",
          "Нормированные по области метрики, по желанию и по умолчанию выключены",
        ],
      },
      {
        title: "Экспорт куда угодно",
        body: "Одно каноническое резюме, любой формат — всё из одного структурированного документа, без расхождений.",
        points: [
          "Идеальный PDF, редактируемый DOCX, LaTeX, Markdown",
          "Идентичные ссылки во всех форматах — без повторного ввода",
          "Ваши данные переносимы — полный экспорт в любой момент",
        ],
      },
      {
        title: "Опубликуйте живую страницу",
        body: "Поделитесь публичной страницей, которая пересинхронизируется с открытым реестром по мере роста ваших работ — всегда актуальна, без повторной загрузки. Только онлайн; ваши экспортируемые файлы не меняются.",
        points: [
          "Аккуратный публичный URL, обновляющийся при появлении новых работ",
          "Согласие на публикацию по каждому полю — в любой момент снимите с публикации или сделайте приватной",
          "Дополнительные анимированные стили — только в вебе, по умолчанию сдержанные",
        ],
      },
    ],
    templatesCta: "Посмотреть все 58 шаблонов: фонды, работа и индустрия",
    ctaTitle: "Создайте резюме из открытого реестра.",
    optionalLabel: "Необязательно",
  },
};

export function landingFlow(locale: string): LandingFlow {
  return LANDING_FLOW_I18N[asLocale(locale)];
}
