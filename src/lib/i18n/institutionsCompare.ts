import { asLocale, type Locale } from "./index";

/**
 * Copy of the institution comparison view (`/i/compare`, `/[locale]/i/compare`),
 * localized for all 10 supported languages and typed so a missing translation is
 * a compile error. Designed by the panel of 2026-09-10: a side-by-side of two or
 * three organisations' OpenAlex records, never ranked — so this file never
 * orders, grades or judges (`tests/institutions-compare-i18n.test.ts` bans the
 * vocabulary in every locale). The share vocabulary matches
 * `institutions.ts` (`openalexColShare` …) per locale, and the ja/zh headings say
 * "side by side" (並置 / 并列), never "compare" (比較 / 比较), which reads as
 * ranking in those languages.
 */
export interface InstitutionCompareStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  /** The page's promise, mirroring the lookup's: what, not where. */
  promise: string;
  pickerIntro: string;
  pickerNeedTwo: string;
  pickerSubmit: string;
  pickerEmpty: string;
  pickerChange: string;
  /** `{floor}`: the method box, above the tables — what is counted, folding, as-of, share definition. */
  method: string;
  /** The visible field-mix label the panel asked for, above the tables. */
  label: string;
  alphabetical: string;
  colOpen: string;
  colNone: string;
  shareFew: string;
  shareIncomplete: string;
  shareSkew: string;
  /** `{days}`. */
  skewNote: string;
  /** `{date}`, per column. */
  asOf: string;
  /** `{id}` (OpenAlex `I…`), `{n}` folded organisations, per column. */
  entity: string;
  ownPage: string;
  /** `{ror}`, `{floor}`: one line per requested id that has nothing to show. */
  dropped: string;
  /** `{max}`. */
  overCap: string;
  caveatsHeading: string;
  caveatField: string;
  caveatSize: string;
  caveatCurrent: string;
  caveatRecent: string;
  caveatClosed: string;
  /** `{max}`: the folding cap. */
  caveatFolding: string;
  caveatUniverse: string;
  caveatDrift: string;
  /** Shown only when the columns are in different countries. */
  caveatCountries: string;
  /** `{contact}`. */
  disclaimer: string;
}

const INSTITUTIONS_COMPARE_I18N: Record<Locale, InstitutionCompareStrings> = {
  "en-US": {
    metaTitle: "Organisations side by side",
    metaDescription:
      "OpenAlex's public record of two or three organisations set side by side: works and open copies by year, each with its own total and date — a description, not an assessment.",
    heading: "Organisations side by side",
    promise: "See what an organisation publishes openly — not where it stands.",
    pickerIntro:
      "Choose two or three organisations. Only an organisation under which at least one researcher chose to be listed, and whose OpenAlex record has been read, can be chosen — a self-selected set, not a country or a sector.",
    pickerNeedTwo: "Choose at least two organisations.",
    pickerSubmit: "Set side by side",
    pickerEmpty: "No organisation can be set side by side yet.",
    pickerChange: "Choose other organisations",
    method:
      'This page sets side by side OpenAlex\'s record of each organisation: the articles, reviews, book chapters and preprints OpenAlex attributes to the organisation and to the hospitals and labs it records as related or child organisations (never parents), for the full years every record covers, each as read on the date under its name — refreshed about weekly, nothing fetched when the page opens. Affiliations are author strings supplied by publishers and parsed by OpenAlex; none was declared by any organisation. "Open copy" is OpenAlex\'s own status of a work; "none found" means OpenAlex found no open copy, not that none exists. The share is open copies divided by the works with a status that year, rounded to a whole number, printed beside both counts, and shown only where a year has at least {floor} such works. Method v1.',
    label: "Not adjusted for field, language, publisher or size.",
    alphabetical:
      "Columns are in alphabetical order. Nothing on this page orders these organisations or sums them into a verdict; each figure carries its own count and total.",
    colOpen: "Open copy",
    colNone: "None found",
    shareFew: "too few works to state a share",
    shareIncomplete: "year not complete",
    shareSkew: "records read too far apart",
    skewNote:
      "These records were read more than {days} days apart, so no share is stated on this page; the counts stand.",
    asOf: "As of {date}",
    entity: "OpenAlex entity {id}, {n} organisations folded in",
    ownPage: "Its page on SigmaCV",
    dropped:
      "{ror}: nothing to set side by side — no page, no OpenAlex record read yet, or fewer than {floor} works with a status in every full year.",
    overCap: "At most {max} organisations are set side by side; the rest were left out.",
    caveatsHeading: "Read with care",
    caveatField:
      "Disciplines differ in open-access practice; organisations with different subject mixes are not directly comparable.",
    caveatSize:
      "A small organisation's share moves several points on a handful of works; the counts are shown so you can judge.",
    caveatCurrent:
      "The current year is not complete and its statuses are still changing; no share is shown for it.",
    caveatRecent:
      "Open copies appear after embargoes end, so the last full year's share tends to rise on later readings.",
    caveatClosed:
      '"None found" means OpenAlex found no open copy at the time — not that the work is paywalled.',
    caveatFolding:
      "Attribution, work types and statuses are OpenAlex's; hospitals and labs are folded in as OpenAlex records them, up to {max} organisations.",
    caveatUniverse:
      "Only organisations under which at least one researcher chose to be listed appear here — a self-selected set, not a country or a sector.",
    caveatDrift: "Figures move with OpenAlex; a few points between readings is normal.",
    caveatCountries:
      "These organisations are in different countries: open-access practice follows national policy and infrastructure as much as the organisation.",
    disclaimer:
      "This is public data arranged for reading, not an assessment. SigmaCV gives no organisation a position, a mark or a verdict; nothing here says whether any policy was followed, and no figure of any researcher listed on SigmaCV is used. Only organisations under which at least one researcher chose to be listed can appear — a self-selected set, not a country or a sector. A difference of a few points, or between records read weeks apart, is not meaningful. Corrections belong to OpenAlex, which SigmaCV re-reads weekly; questions about this page: {contact}.",
  },
  "zh-CN": {
    metaTitle: "机构并列查看",
    metaDescription:
      "并列展示两到三个机构在 OpenAlex 中的公开记录：按年份的成果数与开放版本数，各自标明总数和日期——这是描述，不是评价。",
    heading: "机构并列查看",
    promise: "看一个机构公开发表了什么——而不是它排在哪里。",
    pickerIntro:
      "请选择两到三个机构。只有至少有一位研究者选择列于其下、且其 OpenAlex 记录已被读取的机构才可选择——这是一个自我选择形成的集合，不代表一个国家或领域。",
    pickerNeedTwo: "请至少选择两个机构。",
    pickerSubmit: "并列查看",
    pickerEmpty: "目前还没有可以并列查看的机构。",
    pickerChange: "选择其他机构",
    method:
      "本页并列展示 OpenAlex 对各机构的记录：OpenAlex 归属于该机构及其记录为关联或下属机构（绝不含上级机构）的医院和实验室的论文、综述、图书章节和预印本，涵盖所有记录共同覆盖的完整年份，各机构的读取日期标注在其名称之下——约每周刷新一次，打开本页时不会获取任何数据。机构归属来自出版商提供、由 OpenAlex 解析的作者署名字符串；没有任何机构作过声明。“开放版本”是 OpenAlex 对成果的自有状态；“未找到”表示 OpenAlex 未找到开放版本，而非不存在。占比为开放版本数除以该年有状态的成果数，四舍五入到整数，与两个计数并列印出，且仅当某年至少有 {floor} 项此类成果时才给出。方法 v1。",
    label: "未按学科、语言、出版商或规模调整。",
    alphabetical:
      "各列按字母顺序排列。本页不对这些机构排序，也不将其归结为任何结论；每个数字都附有自己的计数和总数。",
    colOpen: "开放版本",
    colNone: "未找到",
    shareFew: "成果太少，不给出占比",
    shareIncomplete: "年份未结束",
    shareSkew: "记录读取时间相隔过久",
    skewNote: "这些记录的读取时间相隔超过 {days} 天，因此本页不给出占比；计数照常显示。",
    asOf: "截至 {date}",
    entity: "OpenAlex 实体 {id}，合并计入 {n} 个机构",
    ownPage: "它在 SigmaCV 上的页面",
    dropped:
      "{ror}：没有可并列的记录——没有页面、尚未读取 OpenAlex 记录，或每个完整年份有状态的成果都不足 {floor} 项。",
    overCap: "最多并列 {max} 个机构；其余未纳入。",
    caveatsHeading: "请审慎阅读",
    caveatField: "各学科的开放获取实践不同；学科构成不同的机构不能直接比较。",
    caveatSize: "小型机构的占比会因少数几项成果而变动数个百分点；计数已列出，供您自行判断。",
    caveatCurrent: "当年尚未结束，其状态仍在变化；不给出当年的占比。",
    caveatRecent:
      "开放版本会在禁运期结束后出现，因此最后一个完整年份的占比在之后的读取中往往会上升。",
    caveatClosed: "“未找到”表示 OpenAlex 当时未找到开放版本——并不表示该成果被付费墙阻挡。",
    caveatFolding:
      "归属、成果类型和状态均以 OpenAlex 为准；医院和实验室按 OpenAlex 的记录合并计入，最多 {max} 个机构。",
    caveatUniverse:
      "这里只出现至少有一位研究者选择列于其下的机构——这是一个自我选择形成的集合，不代表一个国家或领域。",
    caveatDrift: "数字随 OpenAlex 变动；不同读取之间相差几个百分点属于正常。",
    caveatCountries:
      "这些机构位于不同国家：开放获取实践既取决于机构，也同样取决于国家政策和基础设施。",
    disclaimer:
      "这是为阅读而整理的公开数据，不是评价。SigmaCV 不给任何机构名次、分数或结论；这里没有任何数字说明是否遵循了某项政策，也未使用任何列于 SigmaCV 的研究者的数字。只有至少有一位研究者选择列于其下的机构才会出现——这是一个自我选择形成的集合，不代表一个国家或领域。几个百分点的差异，或相隔数周读取的记录之间的差异，没有意义。更正应向 OpenAlex 提出，SigmaCV 每周重新读取；关于本页的问题请联系：{contact}。",
  },
  "es-ES": {
    metaTitle: "Organizaciones en paralelo",
    metaDescription:
      "El registro público de dos o tres organizaciones en OpenAlex, puesto en paralelo: trabajos y copias abiertas por año, cada uno con su propio total y fecha — una descripción, no una evaluación.",
    heading: "Organizaciones en paralelo",
    promise: "Vea qué publica en abierto una organización — no en qué lugar queda.",
    pickerIntro:
      "Elija dos o tres organizaciones. Solo puede elegirse una organización bajo la que al menos un investigador decidió figurar y cuyo registro de OpenAlex ya se ha leído: un conjunto autoseleccionado, no un país ni un sector.",
    pickerNeedTwo: "Elija al menos dos organizaciones.",
    pickerSubmit: "Poner en paralelo",
    pickerEmpty: "Todavía no hay ninguna organización que pueda ponerse en paralelo.",
    pickerChange: "Elegir otras organizaciones",
    method:
      "Esta página pone en paralelo el registro de OpenAlex de cada organización: los artículos, revisiones, capítulos de libro y preprints que OpenAlex atribuye a la organización y a los hospitales y laboratorios que registra como organizaciones relacionadas o dependientes (nunca superiores), para los años completos que cubren todos los registros, cada uno leído en la fecha que figura bajo su nombre — actualizado aproximadamente cada semana, sin obtener nada al abrir la página. Las afiliaciones son cadenas de autor suministradas por las editoriales e interpretadas por OpenAlex; ninguna organización las ha declarado. «Copia abierta» es el estado propio que OpenAlex asigna a un trabajo; «ninguna encontrada» significa que OpenAlex no encontró copia abierta, no que no exista. La proporción es el número de copias abiertas dividido por los trabajos con estado ese año, redondeada a un número entero, impresa junto a ambos recuentos y mostrada solo cuando un año cuenta al menos {floor} de esos trabajos. Método v1.",
    label: "Sin ajustar por campo, idioma, editorial ni tamaño.",
    alphabetical:
      "Las columnas van en orden alfabético. Nada en esta página ordena a estas organizaciones ni las resume en un veredicto; cada cifra lleva su propio recuento y su total.",
    colOpen: "Copia abierta",
    colNone: "Ninguna encontrada",
    shareFew: "demasiado pocos trabajos para indicar una proporción",
    shareIncomplete: "año no completo",
    shareSkew: "registros leídos con demasiada distancia",
    skewNote:
      "Estos registros se leyeron con más de {days} días de diferencia, así que en esta página no se indica ninguna proporción; los recuentos se mantienen.",
    asOf: "A {date}",
    entity: "Entidad de OpenAlex {id}, {n} organizaciones agrupadas",
    ownPage: "Su página en SigmaCV",
    dropped:
      "{ror}: nada que poner en paralelo — sin página, sin registro de OpenAlex leído aún, o menos de {floor} trabajos con estado en cada año completo.",
    overCap:
      "Como máximo se ponen en paralelo {max} organizaciones; las demás se han dejado fuera.",
    caveatsHeading: "Léase con cuidado",
    caveatField:
      "Las disciplinas difieren en su práctica de acceso abierto; organizaciones con distinta composición temática no son directamente comparables.",
    caveatSize:
      "La proporción de una organización pequeña se mueve varios puntos con un puñado de trabajos; los recuentos se muestran para que pueda juzgar.",
    caveatCurrent:
      "El año en curso no está completo y sus estados siguen cambiando; no se muestra proporción para él.",
    caveatRecent:
      "Las copias abiertas aparecen cuando vencen los embargos, por lo que la proporción del último año completo tiende a subir en lecturas posteriores.",
    caveatClosed:
      "«Ninguna encontrada» significa que OpenAlex no encontró copia abierta en ese momento — no que el trabajo esté tras un muro de pago.",
    caveatFolding:
      "La atribución, los tipos de trabajo y los estados son los de OpenAlex; los hospitales y laboratorios se agrupan tal como OpenAlex los registra, hasta {max} organizaciones.",
    caveatUniverse:
      "Aquí solo aparecen organizaciones bajo las que al menos un investigador decidió figurar: un conjunto autoseleccionado, no un país ni un sector.",
    caveatDrift: "Las cifras se mueven con OpenAlex; unos puntos entre lecturas es normal.",
    caveatCountries:
      "Estas organizaciones están en países distintos: la práctica de acceso abierto depende tanto de la política y la infraestructura nacionales como de la organización.",
    disclaimer:
      "Estos son datos públicos dispuestos para su lectura, no una evaluación. SigmaCV no da a ninguna organización una posición, una nota ni un veredicto; nada aquí dice si se ha seguido alguna política, y no se usa ninguna cifra de ningún investigador que figure en SigmaCV. Solo pueden aparecer organizaciones bajo las que al menos un investigador decidió figurar: un conjunto autoseleccionado, no un país ni un sector. Una diferencia de unos puntos, o entre registros leídos con semanas de distancia, no es significativa. Las correcciones corresponden a OpenAlex, que SigmaCV vuelve a leer cada semana; preguntas sobre esta página: {contact}.",
  },
  "fr-FR": {
    metaTitle: "Organismes côte à côte",
    metaDescription:
      "Ce qu'OpenAlex enregistre publiquement sur deux ou trois organismes, côte à côte : travaux et copies ouvertes par année, chacun avec son propre total et sa date — une description, pas une évaluation.",
    heading: "Organismes côte à côte",
    promise: "Voir ce qu'un organisme publie en accès ouvert — pas la place qu'il occupe.",
    pickerIntro:
      "Choisissez deux ou trois organismes. Seul un organisme sous lequel au moins un chercheur a choisi d'être listé, et dont le relevé OpenAlex a été lu, peut être choisi : un ensemble auto-sélectionné, ni un pays ni un secteur.",
    pickerNeedTwo: "Choisissez au moins deux organismes.",
    pickerSubmit: "Mettre côte à côte",
    pickerEmpty: "Aucun organisme ne peut encore être mis côte à côte.",
    pickerChange: "Choisir d'autres organismes",
    method:
      "Cette page met côte à côte ce qu'OpenAlex enregistre sur chaque organisme : les articles, revues de littérature, chapitres d'ouvrage et prépublications qu'OpenAlex attribue à l'organisme et aux hôpitaux et laboratoires qu'il enregistre comme organismes liés ou rattachés (jamais les organismes parents), pour les années complètes que tous les relevés couvrent, chacun lu à la date indiquée sous son nom — actualisé environ chaque semaine, rien n'est récupéré à l'ouverture de la page. Les affiliations sont des chaînes d'auteur fournies par les éditeurs et interprétées par OpenAlex ; aucun organisme ne les a déclarées. « Copie ouverte » est le statut propre qu'OpenAlex attribue à un travail ; « aucune trouvée » signifie qu'OpenAlex n'a trouvé aucune copie ouverte, non qu'il n'en existe pas. La part est le nombre de copies ouvertes divisé par les travaux dotés d'un statut cette année-là, arrondie à l'entier, imprimée à côté des deux effectifs, et indiquée seulement lorsqu'une année compte au moins {floor} de ces travaux. Méthode v1.",
    label: "Non corrigé du domaine, de la langue, de l'éditeur ni de la taille.",
    alphabetical:
      "Les colonnes sont dans l'ordre alphabétique. Rien sur cette page n'ordonne ces organismes ni ne les résume en un verdict ; chaque chiffre porte son propre effectif et son total.",
    colOpen: "Copie ouverte",
    colNone: "Aucune trouvée",
    shareFew: "trop peu de travaux pour indiquer une part",
    shareIncomplete: "année incomplète",
    shareSkew: "relevés lus à trop d'intervalle",
    skewNote:
      "Ces relevés ont été lus à plus de {days} jours d'intervalle : aucune part n'est indiquée sur cette page ; les effectifs restent.",
    asOf: "Au {date}",
    entity: "Entité OpenAlex {id}, {n} organismes regroupés",
    ownPage: "Sa page sur SigmaCV",
    dropped:
      "{ror} : rien à mettre côte à côte — pas de page, pas de relevé OpenAlex encore lu, ou moins de {floor} travaux dotés d'un statut pour chaque année complète.",
    overCap: "Au plus {max} organismes sont mis côte à côte ; les autres ont été laissés de côté.",
    caveatsHeading: "À lire avec précaution",
    caveatField:
      "Les disciplines diffèrent dans leur pratique de l'accès ouvert ; des organismes de composition disciplinaire différente ne sont pas directement comparables.",
    caveatSize:
      "La part d'un petit organisme varie de plusieurs points sur une poignée de travaux ; les effectifs sont affichés pour que vous puissiez juger.",
    caveatCurrent:
      "L'année en cours n'est pas complète et ses statuts changent encore ; aucune part n'est indiquée pour elle.",
    caveatRecent:
      "Les copies ouvertes apparaissent à la fin des embargos : la part de la dernière année complète tend à monter aux lectures suivantes.",
    caveatClosed:
      "« Aucune trouvée » signifie qu'OpenAlex n'a trouvé aucune copie ouverte à ce moment-là — non que le travail soit derrière un péage.",
    caveatFolding:
      "L'attribution, les types de travaux et les statuts sont ceux d'OpenAlex ; les hôpitaux et laboratoires sont regroupés tels qu'OpenAlex les enregistre, jusqu'à {max} organismes.",
    caveatUniverse:
      "Seuls figurent ici des organismes sous lesquels au moins un chercheur a choisi d'être listé : un ensemble auto-sélectionné, ni un pays ni un secteur.",
    caveatDrift:
      "Les chiffres bougent avec OpenAlex ; quelques points entre deux lectures, c'est normal.",
    caveatCountries:
      "Ces organismes sont dans des pays différents : la pratique de l'accès ouvert tient autant à la politique et aux infrastructures nationales qu'à l'organisme.",
    disclaimer:
      "Ce sont des données publiques disposées pour la lecture, pas une évaluation. SigmaCV n'attribue à aucun organisme une place, une note ni un verdict ; rien ici ne dit si une politique a été suivie, et aucun chiffre d'aucun chercheur listé sur SigmaCV n'est utilisé. Seuls peuvent figurer des organismes sous lesquels au moins un chercheur a choisi d'être listé : un ensemble auto-sélectionné, ni un pays ni un secteur. Un écart de quelques points, ou entre des relevés lus à quelques semaines d'intervalle, n'est pas significatif. Les corrections relèvent d'OpenAlex, que SigmaCV relit chaque semaine ; pour toute question sur cette page : {contact}.",
  },
  "de-DE": {
    metaTitle: "Einrichtungen nebeneinander",
    metaDescription:
      "Was OpenAlex öffentlich über zwei oder drei Einrichtungen verzeichnet, nebeneinander gestellt: Arbeiten und offene Kopien nach Jahr, jeweils mit eigener Gesamtzahl und eigenem Datum — eine Beschreibung, keine Bewertung.",
    heading: "Einrichtungen nebeneinander",
    promise: "Sehen, was eine Einrichtung offen veröffentlicht — nicht, wo sie steht.",
    pickerIntro:
      "Wählen Sie zwei oder drei Einrichtungen. Wählbar ist nur eine Einrichtung, unter der sich mindestens eine forschende Person listen ließ und deren OpenAlex-Eintrag gelesen wurde — eine selbstgewählte Menge, kein Land und keine Branche.",
    pickerNeedTwo: "Wählen Sie mindestens zwei Einrichtungen.",
    pickerSubmit: "Nebeneinander stellen",
    pickerEmpty: "Noch keine Einrichtung lässt sich nebeneinander stellen.",
    pickerChange: "Andere Einrichtungen wählen",
    method:
      "Diese Seite stellt nebeneinander, was OpenAlex über jede Einrichtung verzeichnet: die Artikel, Übersichtsarbeiten, Buchkapitel und Preprints, die OpenAlex der Einrichtung und den Kliniken und Laboren zuordnet, die es als verbundene oder untergeordnete Einrichtungen führt (nie übergeordnete), für die vollständigen Jahre, die alle Einträge abdecken, jeweils gelesen an dem Datum unter dem Namen — etwa wöchentlich aktualisiert, beim Öffnen der Seite wird nichts abgerufen. Zugehörigkeiten sind von Verlagen gelieferte Autorenangaben, die OpenAlex auswertet; keine Einrichtung hat sie erklärt. „Offene Kopie“ ist der eigene Status, den OpenAlex einer Arbeit zuweist; „keine gefunden“ heißt, dass OpenAlex keine offene Kopie gefunden hat, nicht, dass keine existiert. Der Anteil ist die Zahl der offenen Kopien geteilt durch die Arbeiten mit Status in dem Jahr, auf eine ganze Zahl gerundet, neben beiden Zahlen abgedruckt und nur angegeben, wenn ein Jahr mindestens {floor} solcher Arbeiten zählt. Methode v1.",
    label: "Nicht nach Fach, Sprache, Verlag oder Größe bereinigt.",
    alphabetical:
      "Die Spalten stehen in alphabetischer Reihenfolge. Nichts auf dieser Seite ordnet diese Einrichtungen oder fasst sie zu einem Urteil zusammen; jede Zahl trägt ihre eigene Anzahl und Gesamtzahl.",
    colOpen: "Offene Kopie",
    colNone: "Keine gefunden",
    shareFew: "zu wenige Arbeiten für einen Anteil",
    shareIncomplete: "Jahr nicht abgeschlossen",
    shareSkew: "Einträge zu weit auseinander gelesen",
    skewNote:
      "Diese Einträge wurden mehr als {days} Tage auseinander gelesen; deshalb wird auf dieser Seite kein Anteil angegeben. Die Zahlen bleiben.",
    asOf: "Stand {date}",
    entity: "OpenAlex-Entität {id}, {n} Einrichtungen zusammengefasst",
    ownPage: "Ihre Seite auf SigmaCV",
    dropped:
      "{ror}: nichts nebeneinanderzustellen — keine Seite, noch kein OpenAlex-Eintrag gelesen oder in jedem vollständigen Jahr weniger als {floor} Arbeiten mit Status.",
    overCap:
      "Höchstens {max} Einrichtungen werden nebeneinander gestellt; die übrigen blieben außen vor.",
    caveatsHeading: "Mit Bedacht lesen",
    caveatField:
      "Fächer unterscheiden sich in der Open-Access-Praxis; Einrichtungen mit verschiedener Fächerzusammensetzung sind nicht unmittelbar vergleichbar.",
    caveatSize:
      "Der Anteil einer kleinen Einrichtung bewegt sich mit wenigen Arbeiten um mehrere Punkte; die Zahlen werden gezeigt, damit Sie das beurteilen können.",
    caveatCurrent:
      "Das laufende Jahr ist nicht abgeschlossen, seine Status ändern sich noch; für dieses Jahr wird kein Anteil gezeigt.",
    caveatRecent:
      "Offene Kopien erscheinen nach Ablauf von Embargofristen; der Anteil des letzten vollständigen Jahres steigt bei späteren Lesungen meist noch.",
    caveatClosed:
      "„Keine gefunden“ heißt, dass OpenAlex zu diesem Zeitpunkt keine offene Kopie gefunden hat — nicht, dass die Arbeit hinter einer Bezahlschranke liegt.",
    caveatFolding:
      "Zuordnung, Arbeitstypen und Status sind die von OpenAlex; Kliniken und Labore werden so zusammengefasst, wie OpenAlex sie führt, bis zu {max} Einrichtungen.",
    caveatUniverse:
      "Hier erscheinen nur Einrichtungen, unter denen sich mindestens eine forschende Person listen ließ — eine selbstgewählte Menge, kein Land und keine Branche.",
    caveatDrift:
      "Die Zahlen bewegen sich mit OpenAlex; ein paar Punkte zwischen zwei Lesungen sind normal.",
    caveatCountries:
      "Diese Einrichtungen liegen in verschiedenen Ländern: Open-Access-Praxis hängt ebenso von nationaler Politik und Infrastruktur ab wie von der Einrichtung.",
    disclaimer:
      "Dies sind öffentliche Daten, zum Lesen angeordnet, keine Bewertung. SigmaCV gibt keiner Einrichtung einen Platz, eine Note oder ein Urteil; nichts hier sagt, ob eine Vorgabe befolgt wurde, und keine Zahl einer auf SigmaCV gelisteten forschenden Person wird verwendet. Erscheinen können nur Einrichtungen, unter denen sich mindestens eine forschende Person listen ließ — eine selbstgewählte Menge, kein Land und keine Branche. Ein Unterschied von wenigen Punkten oder zwischen Wochen auseinander gelesenen Einträgen ist nicht aussagekräftig. Korrekturen gehören zu OpenAlex, das SigmaCV wöchentlich neu liest; Fragen zu dieser Seite: {contact}.",
  },
  "ja-JP": {
    metaTitle: "機関の並置",
    metaDescription:
      "二つまたは三つの機関について OpenAlex が公開している記録を並置します。年別の成果数とオープン版の数を、それぞれの合計と日付とともに示します。これは記述であり、評価ではありません。",
    heading: "機関の並置",
    promise: "機関が何をオープンに公開しているかを見る。どの位置にいるかではなく。",
    pickerIntro:
      "二つまたは三つの機関を選んでください。選べるのは、少なくとも一人の研究者がその機関の下に掲載されることを選び、かつ OpenAlex の記録が読み取られている機関のみです。自己選択によって成る集合であり、国や分野を代表するものではありません。",
    pickerNeedTwo: "少なくとも二つの機関を選んでください。",
    pickerSubmit: "並置する",
    pickerEmpty: "並置できる機関はまだありません。",
    pickerChange: "別の機関を選ぶ",
    method:
      "このページは、各機関について OpenAlex が記録している内容を並置します。対象は、OpenAlex がその機関と、関連または下位機関として記録している病院・研究所（上位機関は含めません）に帰属させた論文・総説・図書の章・プレプリントで、すべての記録が共通して含む完全な年について、名前の下に示した日付にそれぞれ読み取ったものです。約週一回更新され、ページを開いたときには何も取得しません。所属は出版社が提供し OpenAlex が解析した著者文字列であり、いずれの機関も申告していません。「オープン版」は OpenAlex が成果に付与した状態そのものです。「見つからず」は OpenAlex がオープン版を見つけなかったことを意味し、存在しないことを意味しません。率はオープン版の数をその年の状態のある成果数で割り、整数に丸め、二つの件数と並べて示したもので、ある年にそのような成果が {floor} 件以上ある場合にのみ示します。方法 v1。",
    label: "分野・言語・出版社・規模による補正はしていません。",
    alphabetical:
      "列は五十音・アルファベット順です。このページはこれらの機関を順位づけせず、結論にまとめることもありません。各数値はそれぞれの件数と合計を伴います。",
    colOpen: "オープン版",
    colNone: "見つからず",
    shareFew: "成果が少なすぎるため率を示しません",
    shareIncomplete: "年が終わっていません",
    shareSkew: "記録の読み取り時期が離れすぎています",
    skewNote:
      "これらの記録は {days} 日以上離れて読み取られたため、このページでは率を示しません。件数はそのまま示します。",
    asOf: "{date} 時点",
    entity: "OpenAlex エンティティ {id}、{n} 機関を合算",
    ownPage: "SigmaCV 上のページ",
    dropped:
      "{ror}：並置できる記録がありません。ページがない、OpenAlex の記録がまだ読み取られていない、またはすべての完全な年で状態のある成果が {floor} 件未満です。",
    overCap: "並置できるのは最大 {max} 機関です。残りは除外しました。",
    caveatsHeading: "読む際の注意",
    caveatField:
      "分野によってオープンアクセスの慣行は異なります。分野構成が異なる機関を直接比べることはできません。",
    caveatSize:
      "小さな機関の率は、わずか数件の成果で数ポイント動きます。判断できるよう件数を示しています。",
    caveatCurrent: "当年はまだ終わっておらず、状態も変わり続けています。当年の率は示しません。",
    caveatRecent:
      "オープン版はエンバーゴの終了後に現れるため、最後の完全な年の率は後の読み取りで上がる傾向があります。",
    caveatClosed:
      "「見つからず」は、その時点で OpenAlex がオープン版を見つけなかったことを意味します。成果が有料の壁の向こうにあることを意味しません。",
    caveatFolding:
      "帰属・成果の種類・状態は OpenAlex によるものです。病院や研究所は OpenAlex の記録どおりに合算され、最大 {max} 機関までです。",
    caveatUniverse:
      "ここに現れるのは、少なくとも一人の研究者がその下に掲載されることを選んだ機関だけです。自己選択によって成る集合であり、国や分野を代表するものではありません。",
    caveatDrift:
      "数値は OpenAlex とともに動きます。読み取りの間で数ポイントの差が出るのは普通です。",
    caveatCountries:
      "これらの機関は異なる国にあります。オープンアクセスの慣行は、機関と同じくらい国の政策や基盤に左右されます。",
    disclaimer:
      "これは読むために整えた公開データであり、評価ではありません。SigmaCV はどの機関にも位置・点・結論を与えません。ここにある数値は、何らかの方針が守られたかどうかを語りませんし、SigmaCV に掲載された研究者の数値は一切使っていません。現れるのは、少なくとも一人の研究者がその下に掲載されることを選んだ機関だけです。自己選択によって成る集合であり、国や分野を代表するものではありません。数ポイントの差や、数週間離れて読み取った記録の間の差に意味はありません。訂正は OpenAlex に属し、SigmaCV は毎週読み直します。このページについての質問は {contact} まで。",
  },
  "pt-BR": {
    metaTitle: "Organizações lado a lado",
    metaDescription:
      "O registro público de duas ou três organizações no OpenAlex, lado a lado: trabalhos e cópias abertas por ano, cada um com seu próprio total e data — uma descrição, não uma avaliação.",
    heading: "Organizações lado a lado",
    promise: "Veja o que uma organização publica em aberto — não em que posição ela fica.",
    pickerIntro:
      "Escolha duas ou três organizações. Só pode ser escolhida uma organização sob a qual pelo menos um pesquisador optou por ser listado e cujo registro do OpenAlex já foi lido — um conjunto autosselecionado, não um país nem um setor.",
    pickerNeedTwo: "Escolha pelo menos duas organizações.",
    pickerSubmit: "Colocar lado a lado",
    pickerEmpty: "Nenhuma organização pode ser colocada lado a lado ainda.",
    pickerChange: "Escolher outras organizações",
    method:
      'Esta página coloca lado a lado o registro do OpenAlex de cada organização: os artigos, revisões, capítulos de livro e preprints que o OpenAlex atribui à organização e aos hospitais e laboratórios que ele registra como organizações relacionadas ou subordinadas (nunca superiores), para os anos completos que todos os registros cobrem, cada um lido na data sob seu nome — atualizado aproximadamente toda semana, sem buscar nada ao abrir a página. As afiliações são cadeias de autor fornecidas pelas editoras e interpretadas pelo OpenAlex; nenhuma organização as declarou. "Cópia aberta" é o status próprio que o OpenAlex atribui a um trabalho; "nenhuma encontrada" significa que o OpenAlex não encontrou cópia aberta, não que não exista. A proporção é o número de cópias abertas dividido pelos trabalhos com status naquele ano, arredondada para um número inteiro, impressa ao lado das duas contagens e mostrada apenas quando um ano conta pelo menos {floor} desses trabalhos. Método v1.',
    label: "Sem ajuste por área, idioma, editora ou tamanho.",
    alphabetical:
      "As colunas estão em ordem alfabética. Nada nesta página ordena essas organizações nem as resume em um veredito; cada número traz sua própria contagem e seu total.",
    colOpen: "Cópia aberta",
    colNone: "Nenhuma encontrada",
    shareFew: "trabalhos de menos para indicar uma proporção",
    shareIncomplete: "ano não completo",
    shareSkew: "registros lidos com intervalo grande demais",
    skewNote:
      "Estes registros foram lidos com mais de {days} dias de intervalo, por isso nenhuma proporção é indicada nesta página; as contagens permanecem.",
    asOf: "Em {date}",
    entity: "Entidade do OpenAlex {id}, {n} organizações agrupadas",
    ownPage: "Sua página no SigmaCV",
    dropped:
      "{ror}: nada para colocar lado a lado — sem página, sem registro do OpenAlex lido ainda, ou menos de {floor} trabalhos com status em cada ano completo.",
    overCap: "No máximo {max} organizações são colocadas lado a lado; as demais ficaram de fora.",
    caveatsHeading: "Leia com cuidado",
    caveatField:
      "As disciplinas diferem na prática de acesso aberto; organizações com composições temáticas diferentes não são diretamente comparáveis.",
    caveatSize:
      "A proporção de uma organização pequena varia vários pontos com um punhado de trabalhos; as contagens são mostradas para que você possa julgar.",
    caveatCurrent:
      "O ano corrente não está completo e seus status ainda mudam; nenhuma proporção é mostrada para ele.",
    caveatRecent:
      "Cópias abertas aparecem quando os embargos terminam, por isso a proporção do último ano completo tende a subir em leituras posteriores.",
    caveatClosed:
      '"Nenhuma encontrada" significa que o OpenAlex não encontrou cópia aberta naquele momento — não que o trabalho esteja atrás de um paywall.',
    caveatFolding:
      "Atribuição, tipos de trabalho e status são os do OpenAlex; hospitais e laboratórios são agrupados como o OpenAlex os registra, até {max} organizações.",
    caveatUniverse:
      "Só aparecem aqui organizações sob as quais pelo menos um pesquisador optou por ser listado — um conjunto autosselecionado, não um país nem um setor.",
    caveatDrift: "Os números mudam com o OpenAlex; alguns pontos entre leituras é normal.",
    caveatCountries:
      "Estas organizações estão em países diferentes: a prática de acesso aberto depende tanto da política e da infraestrutura nacionais quanto da organização.",
    disclaimer:
      "Estes são dados públicos dispostos para leitura, não uma avaliação. O SigmaCV não dá a nenhuma organização uma posição, uma nota ou um veredito; nada aqui diz se alguma política foi seguida, e nenhum número de nenhum pesquisador listado no SigmaCV é usado. Só podem aparecer organizações sob as quais pelo menos um pesquisador optou por ser listado — um conjunto autosselecionado, não um país nem um setor. Uma diferença de alguns pontos, ou entre registros lidos com semanas de intervalo, não é significativa. Correções pertencem ao OpenAlex, que o SigmaCV relê toda semana; perguntas sobre esta página: {contact}.",
  },
  "it-IT": {
    metaTitle: "Organizzazioni affiancate",
    metaDescription:
      "Ciò che OpenAlex registra pubblicamente su due o tre organizzazioni, affiancato: lavori e copie aperte per anno, ciascuno con il proprio totale e la propria data — una descrizione, non una valutazione.",
    heading: "Organizzazioni affiancate",
    promise: "Vedere cosa pubblica in aperto un'organizzazione — non in che posizione si trova.",
    pickerIntro:
      "Scegli due o tre organizzazioni. Si può scegliere solo un'organizzazione sotto la quale almeno un ricercatore ha scelto di essere elencato e la cui registrazione OpenAlex è stata letta: un insieme autoselezionato, non un paese né un settore.",
    pickerNeedTwo: "Scegli almeno due organizzazioni.",
    pickerSubmit: "Affianca",
    pickerEmpty: "Nessuna organizzazione può ancora essere affiancata.",
    pickerChange: "Scegli altre organizzazioni",
    method:
      "Questa pagina affianca ciò che OpenAlex registra su ciascuna organizzazione: gli articoli, le rassegne, i capitoli di libro e i preprint che OpenAlex attribuisce all'organizzazione e agli ospedali e laboratori che registra come organizzazioni collegate o subordinate (mai superiori), per gli anni completi coperti da tutte le registrazioni, ciascuna letta alla data sotto il suo nome — aggiornata circa ogni settimana, nulla viene scaricato all'apertura della pagina. Le affiliazioni sono stringhe d'autore fornite dagli editori e interpretate da OpenAlex; nessuna organizzazione le ha dichiarate. «Copia aperta» è lo stato che OpenAlex stesso assegna a un lavoro; «nessuna trovata» significa che OpenAlex non ha trovato una copia aperta, non che non esista. La quota è il numero di copie aperte diviso per i lavori con uno stato in quell'anno, arrotondata a un numero intero, stampata accanto a entrambi i conteggi e mostrata solo quando un anno conta almeno {floor} di tali lavori. Metodo v1.",
    label: "Non corretta per disciplina, lingua, editore o dimensione.",
    alphabetical:
      "Le colonne sono in ordine alfabetico. Nulla in questa pagina ordina queste organizzazioni o le riassume in un verdetto; ogni cifra porta con sé il proprio conteggio e il proprio totale.",
    colOpen: "Copia aperta",
    colNone: "Nessuna trovata",
    shareFew: "troppo pochi lavori per indicare una quota",
    shareIncomplete: "anno non completo",
    shareSkew: "registrazioni lette a troppa distanza",
    skewNote:
      "Queste registrazioni sono state lette a più di {days} giorni di distanza, quindi in questa pagina non è indicata alcuna quota; i conteggi restano.",
    asOf: "Al {date}",
    entity: "Entità OpenAlex {id}, {n} organizzazioni accorpate",
    ownPage: "La sua pagina su SigmaCV",
    dropped:
      "{ror}: nulla da affiancare — nessuna pagina, nessuna registrazione OpenAlex ancora letta, oppure meno di {floor} lavori con uno stato in ogni anno completo.",
    overCap:
      "Al massimo {max} organizzazioni vengono affiancate; le altre sono state lasciate fuori.",
    caveatsHeading: "Da leggere con attenzione",
    caveatField:
      "Le discipline differiscono nella pratica dell'accesso aperto; organizzazioni con composizioni disciplinari diverse non sono direttamente confrontabili.",
    caveatSize:
      "La quota di una piccola organizzazione si muove di diversi punti con una manciata di lavori; i conteggi sono mostrati perché possiate giudicare.",
    caveatCurrent:
      "L'anno in corso non è completo e i suoi stati cambiano ancora; per esso non è mostrata alcuna quota.",
    caveatRecent:
      "Le copie aperte compaiono alla fine degli embarghi, quindi la quota dell'ultimo anno completo tende a salire nelle letture successive.",
    caveatClosed:
      "«Nessuna trovata» significa che OpenAlex non ha trovato una copia aperta in quel momento — non che il lavoro sia dietro un paywall.",
    caveatFolding:
      "Attribuzione, tipi di lavoro e stati sono quelli di OpenAlex; ospedali e laboratori sono accorpati come OpenAlex li registra, fino a {max} organizzazioni.",
    caveatUniverse:
      "Qui compaiono solo organizzazioni sotto le quali almeno un ricercatore ha scelto di essere elencato: un insieme autoselezionato, non un paese né un settore.",
    caveatDrift:
      "Le cifre si muovono con OpenAlex; qualche punto fra una lettura e l'altra è normale.",
    caveatCountries:
      "Queste organizzazioni si trovano in paesi diversi: la pratica dell'accesso aperto dipende dalla politica e dalle infrastrutture nazionali quanto dall'organizzazione.",
    disclaimer:
      "Questi sono dati pubblici disposti per la lettura, non una valutazione. SigmaCV non assegna ad alcuna organizzazione una posizione, un voto o un verdetto; nulla qui dice se una politica sia stata seguita, e non viene usata alcuna cifra di alcun ricercatore elencato su SigmaCV. Possono comparire solo organizzazioni sotto le quali almeno un ricercatore ha scelto di essere elencato: un insieme autoselezionato, non un paese né un settore. Una differenza di pochi punti, o fra registrazioni lette a settimane di distanza, non è significativa. Le correzioni spettano a OpenAlex, che SigmaCV rilegge ogni settimana; domande su questa pagina: {contact}.",
  },
  "ko-KR": {
    metaTitle: "기관 나란히 보기",
    metaDescription:
      "두세 기관에 대한 OpenAlex의 공개 기록을 나란히 놓습니다. 연도별 성과 수와 공개본 수를 각각의 합계와 날짜와 함께 보여 줍니다. 기술이지 평가가 아닙니다.",
    heading: "기관 나란히 보기",
    promise: "한 기관이 무엇을 공개로 출판하는지 봅니다. 어디에 서 있는지가 아니라.",
    pickerIntro:
      "두세 기관을 고르십시오. 적어도 한 명의 연구자가 그 아래 등재되기를 선택했고 OpenAlex 기록이 읽힌 기관만 고를 수 있습니다. 스스로 선택하여 이루어진 집합이며, 국가나 분야를 대표하지 않습니다.",
    pickerNeedTwo: "적어도 두 기관을 고르십시오.",
    pickerSubmit: "나란히 놓기",
    pickerEmpty: "아직 나란히 놓을 수 있는 기관이 없습니다.",
    pickerChange: "다른 기관 고르기",
    method:
      '이 페이지는 각 기관에 대한 OpenAlex의 기록을 나란히 놓습니다. OpenAlex가 그 기관과, 관련 또는 하위 기관으로 기록한 병원·연구소(상위 기관은 결코 포함하지 않음)에 귀속시킨 논문, 리뷰, 단행본 챕터, 프리프린트를, 모든 기록이 공통으로 포함하는 완전한 연도에 대해, 이름 아래 적힌 날짜에 각각 읽은 것입니다. 약 매주 갱신되며, 페이지를 열 때 아무것도 가져오지 않습니다. 소속은 출판사가 제공하고 OpenAlex가 해석한 저자 문자열이며, 어떤 기관도 신고한 것이 아닙니다. "공개본"은 OpenAlex가 성과에 부여한 상태 그 자체이고, "찾지 못함"은 OpenAlex가 공개본을 찾지 못했다는 뜻이지 없다는 뜻이 아닙니다. 비율은 공개본 수를 그해 상태가 있는 성과 수로 나누어 정수로 반올림하고 두 건수와 나란히 표시한 것이며, 한 해에 그런 성과가 {floor}건 이상일 때만 표시합니다. 방법 v1.',
    label: "분야, 언어, 출판사, 규모에 따라 보정하지 않았습니다.",
    alphabetical:
      "열은 알파벳순입니다. 이 페이지의 어떤 것도 이들 기관을 줄 세우거나 하나의 결론으로 묶지 않습니다. 각 수치는 자체 건수와 합계를 함께 보여 줍니다.",
    colOpen: "공개본",
    colNone: "찾지 못함",
    shareFew: "성과가 너무 적어 비율을 표시하지 않습니다",
    shareIncomplete: "연도가 끝나지 않았습니다",
    shareSkew: "기록을 읽은 시점이 너무 떨어져 있습니다",
    skewNote:
      "이 기록들은 {days}일 넘게 떨어진 시점에 읽혔으므로 이 페이지에는 비율을 표시하지 않습니다. 건수는 그대로입니다.",
    asOf: "{date} 기준",
    entity: "OpenAlex 엔티티 {id}, {n}개 기관 합산",
    ownPage: "SigmaCV의 해당 페이지",
    dropped:
      "{ror}: 나란히 놓을 기록이 없습니다. 페이지가 없거나, OpenAlex 기록이 아직 읽히지 않았거나, 모든 완전한 연도에서 상태가 있는 성과가 {floor}건 미만입니다.",
    overCap: "최대 {max}개 기관까지 나란히 놓습니다. 나머지는 제외했습니다.",
    caveatsHeading: "주의해서 읽기",
    caveatField:
      "분야마다 오픈 액세스 관행이 다릅니다. 분야 구성이 다른 기관은 직접 비교할 수 없습니다.",
    caveatSize:
      "작은 기관의 비율은 몇 건의 성과로도 몇 포인트씩 움직입니다. 판단할 수 있도록 건수를 표시합니다.",
    caveatCurrent:
      "올해는 아직 끝나지 않았고 상태도 계속 바뀝니다. 올해의 비율은 표시하지 않습니다.",
    caveatRecent:
      "공개본은 엠바고가 끝난 뒤에 나타나므로, 마지막 완전한 연도의 비율은 이후 읽을 때 올라가는 경향이 있습니다.",
    caveatClosed:
      '"찾지 못함"은 OpenAlex가 그 시점에 공개본을 찾지 못했다는 뜻입니다. 성과가 유료 장벽 뒤에 있다는 뜻이 아닙니다.',
    caveatFolding:
      "귀속, 성과 유형, 상태는 OpenAlex의 것입니다. 병원과 연구소는 OpenAlex가 기록한 대로 최대 {max}개 기관까지 합산됩니다.",
    caveatUniverse:
      "여기에는 적어도 한 명의 연구자가 그 아래 등재되기를 선택한 기관만 나타납니다. 스스로 선택하여 이루어진 집합이며, 국가나 분야를 대표하지 않습니다.",
    caveatDrift:
      "수치는 OpenAlex와 함께 움직입니다. 읽은 시점 사이에 몇 포인트 차이가 나는 것은 정상입니다.",
    caveatCountries:
      "이들 기관은 서로 다른 나라에 있습니다. 오픈 액세스 관행은 기관만큼이나 국가 정책과 기반에 좌우됩니다.",
    disclaimer:
      "이것은 읽기 위해 정리한 공개 데이터이지 평가가 아닙니다. SigmaCV는 어떤 기관에도 자리, 점수 같은 표시, 결론을 주지 않습니다. 여기의 어떤 수치도 어떤 정책이 지켜졌는지 말하지 않으며, SigmaCV에 등재된 연구자의 수치는 전혀 쓰이지 않습니다. 적어도 한 명의 연구자가 그 아래 등재되기를 선택한 기관만 나타납니다. 스스로 선택하여 이루어진 집합이며, 국가나 분야를 대표하지 않습니다. 몇 포인트의 차이나 몇 주 떨어져 읽은 기록 사이의 차이는 의미가 없습니다. 정정은 OpenAlex의 몫이며 SigmaCV는 매주 다시 읽습니다. 이 페이지에 관한 문의: {contact}.",
  },
  "ru-RU": {
    metaTitle: "Организации рядом",
    metaDescription:
      "Публичные записи OpenAlex о двух или трёх организациях, поставленные рядом: работы и открытые копии по годам, каждая со своим итогом и датой — описание, а не оценка.",
    heading: "Организации рядом",
    promise: "Увидеть, что организация публикует открыто, — а не то, какое место она занимает.",
    pickerIntro:
      "Выберите две или три организации. Выбрать можно только организацию, под которой хотя бы один исследователь решил быть указанным и запись которой в OpenAlex уже прочитана, — это самоотобранное множество, а не страна и не отрасль.",
    pickerNeedTwo: "Выберите не меньше двух организаций.",
    pickerSubmit: "Поставить рядом",
    pickerEmpty: "Пока ни одну организацию нельзя поставить рядом с другой.",
    pickerChange: "Выбрать другие организации",
    method:
      "Эта страница ставит рядом записи OpenAlex о каждой организации: статьи, обзоры, главы книг и препринты, которые OpenAlex относит к организации и к больницам и лабораториям, записанным как связанные или дочерние организации (никогда — вышестоящие), за полные годы, которые покрывают все записи, каждая прочитана в дату, указанную под её названием, — обновляется примерно еженедельно, при открытии страницы ничего не запрашивается. Аффилиации — это авторские строки, предоставленные издателями и разобранные OpenAlex; ни одна организация их не заявляла. «Открытая копия» — собственный статус, который OpenAlex присваивает работе; «не найдена» означает, что OpenAlex не нашёл открытой копии, а не что её нет. Доля — число открытых копий, делённое на работы со статусом за этот год, округлённая до целого, напечатанная рядом с обоими числами и показанная только там, где год насчитывает не меньше {floor} таких работ. Метод v1.",
    label: "Без поправки на область, язык, издателя или размер.",
    alphabetical:
      "Столбцы идут в алфавитном порядке. Ничто на этой странице не выстраивает эти организации и не сводит их к вердикту; каждая цифра несёт своё число и свой итог.",
    colOpen: "Открытая копия",
    colNone: "Не найдена",
    shareFew: "слишком мало работ, чтобы указать долю",
    shareIncomplete: "год не завершён",
    shareSkew: "записи прочитаны со слишком большим разрывом",
    skewNote:
      "Эти записи прочитаны с разрывом более {days} дней, поэтому доля на этой странице не указывается; числа остаются.",
    asOf: "По состоянию на {date}",
    entity: "Сущность OpenAlex {id}, объединено организаций: {n}",
    ownPage: "Её страница на SigmaCV",
    dropped:
      "{ror}: нечего поставить рядом — нет страницы, запись OpenAlex ещё не прочитана или в каждом полном году меньше {floor} работ со статусом.",
    overCap: "Рядом ставятся не более {max} организаций; остальные не включены.",
    caveatsHeading: "Читать с осторожностью",
    caveatField:
      "Практика открытого доступа различается по областям; организации с разным составом областей нельзя сопоставлять напрямую.",
    caveatSize:
      "Доля небольшой организации сдвигается на несколько пунктов от горстки работ; числа показаны, чтобы вы могли судить сами.",
    caveatCurrent:
      "Текущий год не завершён, его статусы ещё меняются; доля для него не показывается.",
    caveatRecent:
      "Открытые копии появляются после окончания эмбарго, поэтому доля последнего полного года при последующих чтениях обычно растёт.",
    caveatClosed:
      "«Не найдена» означает, что OpenAlex на тот момент не нашёл открытой копии, — а не что работа за платным доступом.",
    caveatFolding:
      "Отнесение, типы работ и статусы — OpenAlex; больницы и лаборатории объединены так, как их записывает OpenAlex, до {max} организаций.",
    caveatUniverse:
      "Здесь появляются только организации, под которыми хотя бы один исследователь решил быть указанным, — самоотобранное множество, а не страна и не отрасль.",
    caveatDrift:
      "Цифры движутся вместе с OpenAlex; несколько пунктов между чтениями — это нормально.",
    caveatCountries:
      "Эти организации находятся в разных странах: практика открытого доступа зависит от национальной политики и инфраструктуры не меньше, чем от организации.",
    disclaimer:
      "Это публичные данные, расположенные для чтения, а не оценка. SigmaCV не даёт ни одной организации места, отметки или вердикта; ничто здесь не говорит, соблюдалась ли какая-либо политика, и не используется ни одно число ни одного исследователя, указанного на SigmaCV. Появиться могут только организации, под которыми хотя бы один исследователь решил быть указанным, — самоотобранное множество, а не страна и не отрасль. Разница в несколько пунктов или между записями, прочитанными с разницей в недели, не значима. Исправления — дело OpenAlex, который SigmaCV перечитывает еженедельно; вопросы об этой странице: {contact}.",
  },
};

/** The comparison view's strings for a locale (en-US for an unknown one). */
export function institutionCompareStrings(locale: string): InstitutionCompareStrings {
  return INSTITUTIONS_COMPARE_I18N[asLocale(locale)];
}
