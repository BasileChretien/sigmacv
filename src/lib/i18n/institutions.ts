import { asLocale, type Locale } from "./index";

/**
 * Institution-page copy (`/i`, `/i/[ror]`), localized for all 10 supported
 * languages. Typed as Record<Locale, InstitutionStrings> so a missing
 * translation is a compile error.
 *
 * The pages state counts, plus one whole-percent open share on `/i/[ror]`
 * that is defined and bounded on the page (`openalexShareNote`). The copy
 * therefore never ranks, scores or
 * compares, never uses compliance vocabulary, and never says an institution
 * "evaluates its researchers" — it says: read a verifiable CV a researcher
 * chooses to send you. Placeholders: `{name}` (institution), `{count}`
 * (listed researchers), `{id}` (the `ror:<id>` OAI set spec). Proper nouns
 * (SigmaCV, ROR, OAI-PMH, Dublin Core, Basile Chrétien) stay untranslated.
 */
export interface InstitutionStrings {
  indexMetaTitle: string;
  indexMetaDescription: string;
  indexHeading: string;
  indexIntro: string;
  indexEmpty: string;
  /** Page meta description; `{name}`. */
  metaDescription: string;
  listedOne: string;
  /** `{count}`. */
  listedMany: string;
  rorLabel: string;
  selfDeclared: string;
  oaiHeading: string;
  oaiBody: string;
  /** `{id}`. */
  oaiLink: string;
  aboutHeading: string;
  aboutController: string;
  aboutReader: string;
  aboutVoluntary: string;
  aboutNoRanking: string;
  aboutRequestLink: string;
  backToIndex: string;
  backLink: string;
  rateLimitedHeading: string;
  rateLimitedBody: string;
  /** "OpenAlex's record of this organisation" — rendered from the stored
   *  snapshot only: counts with explicit denominators, and the one open
   *  share `openalexShareNote` defines. */
  openalexHeading: string;
  openalexNotFetched: string;
  /** `{id}` (OpenAlex `I…`), `{entityName}`, `{lineage}`, `{related}`. */
  openalexCountedEntity: string;
  /** `{from}`, `{to}` (years). */
  openalexScope: string;
  openalexNotCompared: string;
  openalexWorksByYearHeading: string;
  openalexOaByYearHeading: string;
  openalexOaNote: string;
  /** `{n}`. */
  openalexCountriesHeading: string;
  openalexCountriesNote: string;
  /** `{n}`. */
  openalexCoAffiliationsHeading: string;
  openalexCoAffiliationsNote: string;
  /** `{date}`. */
  openalexAsOf: string;
  /** Column header of the open share. */
  openalexColShare: string;
  /** `{floor}`: the share's definition, floor and limits, above the table. */
  openalexShareNote: string;
  /** The share cell below the floor. */
  openalexShareFew: string;
  /** The share cell of the snapshot's last (incomplete) year. */
  openalexShareIncomplete: string;
  /** `{years}`: the years where the two totals differ by more than one percent. */
  openalexTotalsDiffer: string;
  /** The field-mix table (works by OpenAlex domain), shown only for rows that carry it. */
  openalexDomainsHeading: string;
  /** `{from}`, `{to}`, `{total}`: the window and that request's own total. */
  openalexDomainsNote: string;
  openalexColDomain: string;
  openalexColYear: string;
  openalexColWorks: string;
  openalexColTotal: string;
  openalexColCountry: string;
  openalexColOrganisation: string;
  /** "Figures from researchers who chose to be counted here" — the k-anonymous
   *  sum of the consented CVs' stored aggregates (counts, explicit totals, no
   *  share). Placeholders: `{k}` (the threshold), `{count}` (contributors),
   *  `{pending}` (not yet computed), `{limit}` (the reader's bound). */
  figuresHeading: string;
  /** `{k}`. */
  figuresBelowK: string;
  /** `{count}`. */
  figuresContributors: string;
  /** `{pending}`. */
  figuresPending: string;
  /** `{limit}`. */
  figuresTruncated: string;
  /** `{k}`. */
  figuresScope: string;
  figuresNotCompared: string;
  figuresByYearHeading: string;
  figuresByTypeHeading: string;
  /** The suppressed-cell label; `{k}`. */
  figuresSuppressed: string;
  figuresAllSuppressed: string;
  figuresYearUnknown: string;
  figuresColYear: string;
  figuresColTotal: string;
  figuresColSection: string;
  figuresColWorks: string;
  /** The reconciliation export line (shown from one contributor): the count,
   *  then the two download links; and the About sentence that says the rows
   *  identify the researcher because each one chose to share them. */
  reconciliationOne: string;
  /** `{count}`. */
  reconciliationMany: string;
  reconciliationCsv: string;
  reconciliationJson: string;
  aboutReconciliation: string;
}

const INSTITUTIONS_I18N: Record<Locale, InstitutionStrings> = {
  "en-US": {
    indexMetaTitle: "Institutions",
    indexMetaDescription:
      "Institutions under which researchers chose to list their public SigmaCV CV — a count per institution, no roster, no ranking.",
    indexHeading: "Institutions",
    indexIntro:
      "Each institution below has at least one researcher who chose to list their public CV under it. The page shows how many did — a count only, never who, and never a comparison between institutions.",
    indexEmpty: "No researcher has chosen to be listed under an institution yet.",
    metaDescription:
      "Researchers who chose to list their public SigmaCV CV under {name}: a count only — no roster, no ranking, no score.",
    listedOne: "1 researcher lists this affiliation",
    listedMany: "{count} researchers list this affiliation",
    rorLabel: "ROR record",
    selfDeclared:
      "Each of them declared this affiliation on their own CV and chose to be listed here. The count is theirs, not the institution's: it is not a staff list and says nothing about anyone who is absent.",
    oaiHeading: "Machine access",
    oaiBody:
      "The listed CVs can be harvested as an OAI-PMH set (Dublin Core, one record per CV and per work):",
    oaiLink: "OAI-PMH set {id}",
    aboutHeading: "About this page",
    aboutController:
      "SigmaCV is operated by Basile Chrétien as an independent personal project — not by, or on behalf of, any university or employer — and he is the sole data controller for the personal data behind this page.",
    aboutReader:
      "The institution named here is a reader like anyone else: it receives nothing from SigmaCV, has no account, and instructs nothing about what is processed or shown.",
    aboutVoluntary:
      "Being listed is each researcher's own, revocable choice. Absence from this page means nothing: most researchers are not on SigmaCV, and those who are may simply not have opted in.",
    aboutNoRanking:
      "SigmaCV does not rank, score or compare researchers, here or anywhere. To read a verifiable CV, ask the researcher for a request link — they choose what to send you.",
    aboutRequestLink: "How request links work",
    backToIndex: "← All institutions",
    backLink: "← Back to SigmaCV",
    rateLimitedHeading: "Too many requests",
    rateLimitedBody:
      "There have been a lot of requests to this page in a short time. Please wait a moment and try again.",
    openalexHeading: "OpenAlex's record of this organisation",
    openalexNotFetched: "OpenAlex figures not fetched yet.",
    openalexCountedEntity:
      "Counted as OpenAlex entity {id} ({entityName}): a lineage of {lineage}, {related} associated organisations. Hospitals and affiliated labs that OpenAlex records as related or child organisations are folded in; parent organisations are not.",
    openalexScope:
      "Counts of articles, reviews, book chapters and preprints that OpenAlex attributes to these organisations, {from}–{to}. Datasets are left out: they swamp the current year. Each table states its own total.",
    openalexNotCompared:
      "These are OpenAlex's figures about the organisation, not about the researchers listed above, and SigmaCV compares neither with the other.",
    openalexWorksByYearHeading: "Works by year",
    openalexOaByYearHeading: "Open-access status by year",
    openalexOaNote:
      "OpenAlex's own status of each work's best open copy (gold, hybrid, diamond, green, bronze — or closed when it found none). Total is the number of works with a status that year, from the same request as the columns; it can differ slightly from the works-by-year table.",
    openalexCountriesHeading: "Countries of co-authors (top {n})",
    openalexCountriesNote:
      "Number of works with at least one author affiliated in each country, this organisation's own country included.",
    openalexCoAffiliationsHeading: "Co-affiliated organisations (top {n})",
    openalexCoAffiliationsNote:
      "Number of works that also carry an author from each other organisation; this organisation's own lineage and associated organisations are left out.",
    openalexAsOf:
      "As of {date}, from OpenAlex; refreshed about weekly by SigmaCV. Nothing on this page is fetched when it is opened.",
    openalexColShare: "Open share",
    openalexShareNote:
      "Open share: the works OpenAlex records under any status but closed (bronze included), divided by that year's total and stated as a whole percent beside both counts. It is given only where a year counts at least {floor} works with a status, and not for the latest year shown, which is not over; the statuses of the year before it may still change as embargoes end. It is not adjusted for field, language, publisher or size: a difference of a few points, or a shift between records read weeks apart, means nothing on its own.",
    openalexShareFew: "too few works to state a share",
    openalexShareIncomplete: "year not complete",
    openalexTotalsDiffer:
      "For {years}, the works-by-year table counts a noticeably different number of works from those with a status here; the two come from different OpenAlex requests.",
    openalexDomainsHeading: "OpenAlex domains",
    openalexDomainsNote:
      "Works by the OpenAlex domain of their primary topic, {from}–{to}: {total} works in all; the rows can add up to fewer, since a work OpenAlex has given no topic is in no row. The open share above is not adjusted for this mix: where two organisations differ here, their shares do not measure the same thing.",
    openalexColDomain: "Domain",
    openalexColYear: "Year",
    openalexColWorks: "Works",
    openalexColTotal: "Total",
    openalexColCountry: "Country",
    openalexColOrganisation: "Organisation",
    figuresHeading: "Figures from researchers who chose to be counted here",
    figuresBelowK:
      "Fewer than {k} researchers have chosen to be counted here, so no figures are shown yet.",
    figuresContributors: "{count} researchers chose to be counted on this page.",
    figuresPending:
      "{pending} more chose to be counted but their figures have not been computed yet; they are added after their next save or weekly re-sync.",
    figuresTruncated: "Only the first {limit} researchers who chose to be counted are included.",
    figuresScope:
      "Counts of the works each researcher's own public CV lists, added up: by year and open-access state, then by section. Counts only; each row states its own total. A year, a cell or a section that fewer than {k} researchers contribute to is not shown, and whenever what is hidden would stand on fewer than {k} researchers, the next-smallest shown figure is hidden with it — within a row, and across the two tables.",
    figuresNotCompared:
      "These are the researchers' own figures, added up. They are not compared with OpenAlex's record of the organisation, and neither is subtracted from the other.",
    figuresByYearHeading: "Works by year and open-access state",
    figuresByTypeHeading: "Works by section",
    figuresSuppressed: "fewer than {k} researchers",
    figuresAllSuppressed:
      "No figure can be shown yet: every year and every section would either count fewer than {k} researchers or let a figure about fewer than {k} be worked out.",
    figuresYearUnknown: "No year",
    figuresColYear: "Year",
    figuresColTotal: "Total",
    figuresColSection: "Section",
    figuresColWorks: "Works",
    reconciliationOne: "1 researcher shares their reconciliation rows:",
    reconciliationMany: "{count} researchers share their reconciliation rows:",
    reconciliationCsv: "download CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "Rows in the reconciliation export identify the researcher by ORCID iD, because each one chose to share them.",
  },
  "zh-CN": {
    indexMetaTitle: "机构",
    indexMetaDescription:
      "研究者选择将其 SigmaCV 公开简历列于其下的机构——每个机构一个数字，没有名单，没有排名。",
    indexHeading: "机构",
    indexIntro:
      "下列每个机构都至少有一位研究者选择将其公开简历列于该机构之下。页面只显示人数——仅为数量，绝不显示是谁，也绝不在机构之间进行比较。",
    indexEmpty: "尚无研究者选择列于某个机构之下。",
    metaDescription:
      "选择将其 SigmaCV 公开简历列于 {name} 之下的研究者：仅为数量——没有名单，没有排名，没有评分。",
    listedOne: "1 位研究者列出了此所属机构",
    listedMany: "{count} 位研究者列出了此所属机构",
    rorLabel: "ROR 记录",
    selfDeclared:
      "他们每一位都在自己的简历中申明了此所属机构，并选择在此列出。这个数字属于他们，而非机构：它不是员工名单，也不说明任何未出现在此的人。",
    oaiHeading: "机器访问",
    oaiBody: "已列出的简历可作为 OAI-PMH 集合采集（Dublin Core，每份简历及每项成果各一条记录）：",
    oaiLink: "OAI-PMH 集合 {id}",
    aboutHeading: "关于本页面",
    aboutController:
      "SigmaCV 由 Basile Chrétien 作为独立的个人项目运营——不属于也不代表任何大学或雇主——他是本页面背后个人数据的唯一数据控制者。",
    aboutReader:
      "此处列名的机构与任何人一样只是读者：它不从 SigmaCV 接收任何东西，没有账户，也不对处理或显示的内容作任何指示。",
    aboutVoluntary:
      "是否列出是每位研究者本人可撤回的选择。未出现在本页面不说明任何问题：大多数研究者并不使用 SigmaCV，而使用者也可能只是未选择加入。",
    aboutNoRanking:
      "SigmaCV 在此处或任何地方都不对研究者进行排名、评分或比较。要阅读可核验的简历，请向研究者索取请求链接——由他们决定发送给你什么。",
    aboutRequestLink: "请求链接如何运作",
    backToIndex: "← 所有机构",
    backLink: "← 返回 SigmaCV",
    rateLimitedHeading: "请求过多",
    rateLimitedBody: "短时间内对本页面的请求过多。请稍候再试。",
    openalexHeading: "OpenAlex 对该机构的记录",
    openalexNotFetched: "尚未获取 OpenAlex 数据。",
    openalexCountedEntity:
      "按 OpenAlex 实体 {id}（{entityName}）计数：谱系包含 {lineage} 个机构，关联机构 {related} 个。OpenAlex 记为关联或下属机构的医院和附属实验室已合并计入；上级机构不计入。",
    openalexScope:
      "OpenAlex 归属于这些机构的论文、综述、图书章节和预印本的数量，{from}–{to} 年。不含数据集：数据集会淹没当年的数字。每张表都写明自己的总数。",
    openalexNotCompared:
      "这些是 OpenAlex 关于该机构的数字，与上面列出的研究者无关，SigmaCV 也不将两者相互比较。",
    openalexWorksByYearHeading: "按年份的成果数",
    openalexOaByYearHeading: "按年份的开放获取状态",
    openalexOaNote:
      "OpenAlex 对每篇成果最佳开放版本的自有状态（gold、hybrid、diamond、green、bronze；未找到开放版本时为 closed）。总计是该年有状态的成果数，与各列来自同一次请求；它可能与按年份的成果数表略有出入。",
    openalexCountriesHeading: "合著者所在国家（前 {n} 位）",
    openalexCountriesNote: "至少有一位作者隶属于该国家的成果数，包括本机构所在的国家。",
    openalexCoAffiliationsHeading: "共同署名机构（前 {n} 位）",
    openalexCoAffiliationsNote: "同时带有其他机构作者的成果数；本机构自身的谱系和关联机构不计入。",
    openalexAsOf:
      "数据截至 {date}，来自 OpenAlex，由 SigmaCV 大约每周刷新一次。打开本页时不会获取任何数据。",
    openalexColShare: "开放占比",
    openalexShareNote:
      "开放占比：OpenAlex 记为 closed 以外任一状态（含 bronze）的成果数除以该年总计，取整数百分比，并与两个计数并列显示。只有当某年至少有 {floor} 篇有状态的成果时才给出，所示的最后一年因尚未结束不给出；其前一年的状态也可能随着禁运期结束而变化。未按学科、语言、出版商或规模调整：几个百分点的差异，或相隔数周读取的记录之间的变化，本身没有任何意义。",
    openalexShareFew: "成果太少，不给出占比",
    openalexShareIncomplete: "年份未结束",
    openalexTotalsDiffer:
      "{years} 年，按年份的成果数表的数量与此处有状态的成果数明显不同；两者来自 OpenAlex 的不同请求。",
    openalexDomainsHeading: "OpenAlex 领域",
    openalexDomainsNote:
      "按成果主要主题所属的 OpenAlex 领域统计的成果数，{from}–{to} 年：共 {total} 项成果；各行之和可能少于此数，因为 OpenAlex 未指定主题的成果不在任何一行中。上方的开放占比未按此构成调整：两个机构在此处不同时，其占比衡量的并非同一事物。",
    openalexColDomain: "领域",
    openalexColYear: "年份",
    openalexColWorks: "成果",
    openalexColTotal: "总计",
    openalexColCountry: "国家",
    openalexColOrganisation: "机构",
    figuresHeading: "选择在此被计入的研究者的数字",
    figuresBelowK: "选择在此被计入的研究者少于 {k} 位，因此暂不显示任何数字。",
    figuresContributors: "{count} 位研究者选择在本页面被计入。",
    figuresPending:
      "另有 {pending} 位选择被计入，但其数字尚未计算；他们将在下一次保存或每周重新同步后加入。",
    figuresTruncated: "仅包含最先选择被计入的 {limit} 位研究者。",
    figuresScope:
      "各研究者自己的公开简历所列成果的数量之和：按年份与开放获取状态，再按栏目。仅为数量；每一行都注明其总数。少于 {k} 位研究者贡献的年份、单元格或栏目不予显示；凡被隐藏的部分若仅涉及少于 {k} 位研究者，则将次小的已显示数字一并隐藏——在同一行内如此，在两张表之间亦然。",
    figuresNotCompared:
      "这些是研究者自己的数字之和。它们不与 OpenAlex 关于该机构的记录进行比较，二者也不互相相减。",
    figuresByYearHeading: "按年份与开放获取状态的成果",
    figuresByTypeHeading: "按栏目的成果",
    figuresSuppressed: "少于 {k} 位研究者",
    figuresAllSuppressed:
      "目前无法显示任何数字：每个年份和每个栏目要么计入的研究者少于 {k} 位，要么会让人推算出少于 {k} 位研究者的数字。",
    figuresYearUnknown: "无年份",
    figuresColYear: "年份",
    figuresColTotal: "总数",
    figuresColSection: "栏目",
    figuresColWorks: "成果",
    reconciliationOne: "1 位研究者共享了核对行：",
    reconciliationMany: "{count} 位研究者共享了核对行：",
    reconciliationCsv: "下载 CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "核对导出中的每一行都通过 ORCID iD 标识研究者，因为每一位都自行选择了共享。",
  },
  "es-ES": {
    indexMetaTitle: "Instituciones",
    indexMetaDescription:
      "Instituciones bajo las que los investigadores eligieron listar su CV público de SigmaCV: una cifra por institución, sin lista de personas, sin clasificación.",
    indexHeading: "Instituciones",
    indexIntro:
      "Cada institución de abajo tiene al menos un investigador que eligió listar su CV público bajo ella. La página muestra cuántos lo hicieron: solo una cifra, nunca quiénes, y nunca una comparación entre instituciones.",
    indexEmpty: "Ningún investigador ha elegido todavía ser listado bajo una institución.",
    metaDescription:
      "Investigadores que eligieron listar su CV público de SigmaCV bajo {name}: solo una cifra, sin lista de personas, sin clasificación, sin puntuación.",
    listedOne: "1 investigador lista esta afiliación",
    listedMany: "{count} investigadores listan esta afiliación",
    rorLabel: "Registro ROR",
    selfDeclared:
      "Cada uno de ellos declaró esta afiliación en su propio CV y eligió aparecer aquí. La cifra es suya, no de la institución: no es una lista de personal y no dice nada de quien no aparece.",
    oaiHeading: "Acceso automatizado",
    oaiBody:
      "Los CV listados pueden recolectarse como un conjunto OAI-PMH (Dublin Core, un registro por CV y por obra):",
    oaiLink: "Conjunto OAI-PMH {id}",
    aboutHeading: "Sobre esta página",
    aboutController:
      "SigmaCV lo opera Basile Chrétien como proyecto personal independiente —no por ni en nombre de ninguna universidad o empleador— y él es el único responsable del tratamiento de los datos personales que hay detrás de esta página.",
    aboutReader:
      "La institución aquí nombrada es un lector como cualquier otro: no recibe nada de SigmaCV, no tiene cuenta y no da instrucciones sobre qué se trata o se muestra.",
    aboutVoluntary:
      "Aparecer aquí es una decisión propia y revocable de cada investigador. No figurar en esta página no significa nada: la mayoría de los investigadores no están en SigmaCV, y quienes están pueden simplemente no haber activado la opción.",
    aboutNoRanking:
      "SigmaCV no clasifica, puntúa ni compara investigadores, ni aquí ni en ningún otro sitio. Para leer un CV verificable, pida al investigador un enlace de solicitud: él decide qué le envía.",
    aboutRequestLink: "Cómo funcionan los enlaces de solicitud",
    backToIndex: "← Todas las instituciones",
    backLink: "← Volver a SigmaCV",
    rateLimitedHeading: "Demasiadas solicitudes",
    rateLimitedBody:
      "Ha habido muchas solicitudes a esta página en poco tiempo. Espere un momento e inténtelo de nuevo.",
    openalexHeading: "El registro de esta organización en OpenAlex",
    openalexNotFetched: "Cifras de OpenAlex aún no obtenidas.",
    openalexCountedEntity:
      "Contabilizada como la entidad de OpenAlex {id} ({entityName}): un linaje de {lineage}, {related} organizaciones asociadas. Los hospitales y laboratorios afiliados que OpenAlex registra como organizaciones relacionadas o dependientes se incluyen; las organizaciones matrices, no.",
    openalexScope:
      "Recuento de artículos, revisiones, capítulos de libro y preprints que OpenAlex atribuye a estas organizaciones, {from}–{to}. Se excluyen los conjuntos de datos: inundan el año en curso. Cada tabla indica su propio total.",
    openalexNotCompared:
      "Son las cifras de OpenAlex sobre la organización, no sobre las personas investigadoras listadas arriba, y SigmaCV no compara unas con otras.",
    openalexWorksByYearHeading: "Trabajos por año",
    openalexOaByYearHeading: "Estado de acceso abierto por año",
    openalexOaNote:
      "El estado que OpenAlex asigna a la mejor copia abierta de cada trabajo (gold, hybrid, diamond, green, bronze, o closed cuando no encontró ninguna). El total es el número de trabajos con estado ese año, de la misma petición que las columnas; puede diferir ligeramente de la tabla de trabajos por año.",
    openalexCountriesHeading: "Países de los coautores (los {n} primeros)",
    openalexCountriesNote:
      "Número de trabajos con al menos un autor afiliado en cada país, incluido el país de esta organización.",
    openalexCoAffiliationsHeading: "Organizaciones coafiliadas (las {n} primeras)",
    openalexCoAffiliationsNote:
      "Número de trabajos que también llevan un autor de cada otra organización; se excluyen el propio linaje y las organizaciones asociadas de esta organización.",
    openalexAsOf:
      "A fecha de {date}, según OpenAlex; SigmaCV lo actualiza aproximadamente cada semana. Nada de esta página se obtiene al abrirla.",
    openalexColShare: "Proporción abierta",
    openalexShareNote:
      "Proporción abierta: los trabajos que OpenAlex registra con cualquier estado salvo closed (bronze incluido), divididos por el total de ese año y expresados como porcentaje entero junto a ambos recuentos. Solo se indica cuando un año cuenta al menos {floor} trabajos con estado, y no para el último año mostrado, que no ha terminado; los estados del año anterior aún pueden cambiar a medida que vencen los embargos. No se ajusta por campo, idioma, editorial ni tamaño: una diferencia de unos puntos, o un cambio entre registros leídos con semanas de distancia, no significa nada por sí sola.",
    openalexShareFew: "demasiado pocos trabajos para indicar una proporción",
    openalexShareIncomplete: "año no completo",
    openalexTotalsDiffer:
      "En {years}, la tabla de trabajos por año cuenta un número de trabajos claramente distinto del de trabajos con estado aquí; ambos proceden de peticiones distintas a OpenAlex.",
    openalexDomainsHeading: "Dominios de OpenAlex",
    openalexDomainsNote:
      "Trabajos según el dominio de OpenAlex de su tema principal, {from}–{to}: {total} trabajos en total; las filas pueden sumar menos, ya que un trabajo al que OpenAlex no ha asignado tema no está en ninguna fila. La proporción abierta de arriba no se ajusta por esta composición: cuando dos organizaciones difieren aquí, sus proporciones no miden lo mismo.",
    openalexColDomain: "Dominio",
    openalexColYear: "Año",
    openalexColWorks: "Trabajos",
    openalexColTotal: "Total",
    openalexColCountry: "País",
    openalexColOrganisation: "Organización",
    figuresHeading: "Cifras de quienes eligieron ser contados aquí",
    figuresBelowK:
      "Menos de {k} investigadores han elegido ser contados aquí, así que todavía no se muestran cifras.",
    figuresContributors: "{count} investigadores eligieron ser contados en esta página.",
    figuresPending:
      "{pending} más eligieron ser contados, pero sus cifras aún no se han calculado; se añaden tras su próximo guardado o la resincronización semanal.",
    figuresTruncated:
      "Solo se incluyen los primeros {limit} investigadores que eligieron ser contados.",
    figuresScope:
      "Recuentos de los trabajos que lista el CV público de cada investigador, sumados: por año y estado de acceso abierto, y después por sección. Solo recuentos; cada fila indica su propio total. No se muestra ningún año, celda o sección al que contribuyan menos de {k} investigadores, y siempre que lo oculto se apoyara en menos de {k} investigadores, se oculta también la siguiente cifra mostrada más pequeña: dentro de una fila y entre las dos tablas.",
    figuresNotCompared:
      "Son las cifras propias de los investigadores, sumadas. No se comparan con el registro de la organización en OpenAlex, y ninguna se resta de la otra.",
    figuresByYearHeading: "Trabajos por año y estado de acceso abierto",
    figuresByTypeHeading: "Trabajos por sección",
    figuresSuppressed: "menos de {k} investigadores",
    figuresAllSuppressed:
      "Todavía no se puede mostrar ninguna cifra: cada año y cada sección contarían a menos de {k} investigadores o permitirían deducir una cifra sobre menos de {k}.",
    figuresYearUnknown: "Sin año",
    figuresColYear: "Año",
    figuresColTotal: "Total",
    figuresColSection: "Sección",
    figuresColWorks: "Trabajos",
    reconciliationOne: "1 investigador comparte sus filas de conciliación:",
    reconciliationMany: "{count} investigadores comparten sus filas de conciliación:",
    reconciliationCsv: "descargar CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "Las filas de la exportación de conciliación identifican al investigador por su ORCID iD, porque cada uno eligió compartirlas.",
  },
  "fr-FR": {
    indexMetaTitle: "Établissements",
    indexMetaDescription:
      "Établissements sous lesquels des chercheurs ont choisi de lister leur CV public SigmaCV : un décompte par établissement, sans liste nominative, sans classement.",
    indexHeading: "Établissements",
    indexIntro:
      "Chaque établissement ci-dessous compte au moins un chercheur qui a choisi d'y lister son CV public. La page indique combien l'ont fait : un simple décompte, jamais qui, et jamais de comparaison entre établissements.",
    indexEmpty: "Aucun chercheur n'a encore choisi d'être listé sous un établissement.",
    metaDescription:
      "Chercheurs ayant choisi de lister leur CV public SigmaCV sous {name} : un simple décompte, sans liste nominative, sans classement, sans score.",
    listedOne: "1 chercheur liste cette affiliation",
    listedMany: "{count} chercheurs listent cette affiliation",
    rorLabel: "Fiche ROR",
    selfDeclared:
      "Chacun d'eux a déclaré cette affiliation sur son propre CV et a choisi de figurer ici. Le décompte est le leur, pas celui de l'établissement : ce n'est pas une liste du personnel et il ne dit rien de qui n'y figure pas.",
    oaiHeading: "Accès machine",
    oaiBody:
      "Les CV listés peuvent être moissonnés comme un ensemble OAI-PMH (Dublin Core, une notice par CV et par travail) :",
    oaiLink: "Ensemble OAI-PMH {id}",
    aboutHeading: "À propos de cette page",
    aboutController:
      "SigmaCV est exploité par Basile Chrétien dans le cadre d'un projet personnel indépendant — ni par, ni pour le compte d'une université ou d'un employeur — et il est l'unique responsable du traitement des données personnelles derrière cette page.",
    aboutReader:
      "L'établissement nommé ici est un lecteur comme un autre : il ne reçoit rien de SigmaCV, n'a pas de compte et ne donne aucune instruction sur ce qui est traité ou affiché.",
    aboutVoluntary:
      "Figurer ici est le choix propre et révocable de chaque chercheur. Ne pas y figurer ne signifie rien : la plupart des chercheurs ne sont pas sur SigmaCV, et ceux qui y sont peuvent simplement ne pas avoir activé l'option.",
    aboutNoRanking:
      "SigmaCV ne classe, ne note et ne compare pas les chercheurs, ici ou ailleurs. Pour lire un CV vérifiable, demandez au chercheur un lien de demande : c'est lui qui choisit ce qu'il vous envoie.",
    aboutRequestLink: "Comment fonctionnent les liens de demande",
    backToIndex: "← Tous les établissements",
    backLink: "← Retour à SigmaCV",
    rateLimitedHeading: "Trop de requêtes",
    rateLimitedBody:
      "Cette page a reçu beaucoup de requêtes en peu de temps. Patientez un instant, puis réessayez.",
    openalexHeading: "Ce qu'OpenAlex enregistre sur cet organisme",
    openalexNotFetched: "Chiffres OpenAlex pas encore récupérés.",
    openalexCountedEntity:
      "Comptabilisé comme l'entité OpenAlex {id} ({entityName}) : une lignée de {lineage}, {related} organismes associés. Les hôpitaux et laboratoires affiliés qu'OpenAlex enregistre comme organismes liés ou rattachés sont inclus ; les organismes parents ne le sont pas.",
    openalexScope:
      "Nombre d'articles, de revues de littérature, de chapitres d'ouvrage et de prépublications qu'OpenAlex attribue à ces organismes, {from}–{to}. Les jeux de données sont exclus : ils submergent l'année en cours. Chaque tableau indique son propre total.",
    openalexNotCompared:
      "Ce sont les chiffres d'OpenAlex sur l'organisme, non sur les chercheuses et chercheurs listés ci-dessus, et SigmaCV ne compare pas les uns aux autres.",
    openalexWorksByYearHeading: "Travaux par année",
    openalexOaByYearHeading: "Statut d'accès ouvert par année",
    openalexOaNote:
      "Le statut qu'OpenAlex attribue à la meilleure copie ouverte de chaque travail (gold, hybrid, diamond, green, bronze, ou closed lorsqu'il n'en a trouvé aucune). Le total est le nombre de travaux dotés d'un statut cette année-là, issu de la même requête que les colonnes ; il peut différer légèrement du tableau des travaux par année.",
    openalexCountriesHeading: "Pays des co-auteurs ({n} premiers)",
    openalexCountriesNote:
      "Nombre de travaux ayant au moins un auteur affilié dans chaque pays, celui de cet organisme compris.",
    openalexCoAffiliationsHeading: "Organismes co-affiliés ({n} premiers)",
    openalexCoAffiliationsNote:
      "Nombre de travaux portant aussi un auteur de chaque autre organisme ; la lignée et les organismes associés de cet organisme sont exclus.",
    openalexAsOf:
      "Au {date}, d'après OpenAlex ; actualisé environ chaque semaine par SigmaCV. Rien sur cette page n'est récupéré à son ouverture.",
    openalexColShare: "Part ouverte",
    openalexShareNote:
      "Part ouverte : les travaux qu'OpenAlex enregistre sous tout statut sauf closed (bronze compris), divisés par le total de l'année et exprimés en pourcentage entier à côté des deux effectifs. Elle n'est indiquée que lorsqu'une année compte au moins {floor} travaux dotés d'un statut, et jamais pour la dernière année affichée, qui n'est pas terminée ; les statuts de l'année précédente peuvent encore changer à mesure que les embargos expirent. Elle n'est corrigée ni du domaine, ni de la langue, ni de l'éditeur, ni de la taille : un écart de quelques points, ou une variation entre des relevés lus à quelques semaines d'intervalle, ne signifie rien en soi.",
    openalexShareFew: "trop peu de travaux pour indiquer une part",
    openalexShareIncomplete: "année incomplète",
    openalexTotalsDiffer:
      "Pour {years}, le tableau des travaux par année compte un nombre de travaux nettement différent de celui des travaux dotés d'un statut ici ; les deux viennent de requêtes OpenAlex distinctes.",
    openalexDomainsHeading: "Domaines OpenAlex",
    openalexDomainsNote:
      "Travaux selon le domaine OpenAlex de leur sujet principal, {from}–{to} : {total} travaux en tout ; les lignes peuvent totaliser moins, car un travail auquel OpenAlex n'a attribué aucun sujet ne figure dans aucune ligne. La part ouverte ci-dessus n'est pas corrigée de cette composition : là où deux organismes diffèrent ici, leurs parts ne mesurent pas la même chose.",
    openalexColDomain: "Domaine",
    openalexColYear: "Année",
    openalexColWorks: "Travaux",
    openalexColTotal: "Total",
    openalexColCountry: "Pays",
    openalexColOrganisation: "Organisme",
    figuresHeading: "Chiffres des chercheurs qui ont choisi d'être comptés ici",
    figuresBelowK:
      "Moins de {k} chercheurs ont choisi d'être comptés ici ; aucun chiffre n'est donc encore affiché.",
    figuresContributors: "{count} chercheurs ont choisi d'être comptés sur cette page.",
    figuresPending:
      "{pending} autres ont choisi d'être comptés, mais leurs chiffres n'ont pas encore été calculés ; ils s'ajoutent après leur prochain enregistrement ou la resynchronisation hebdomadaire.",
    figuresTruncated:
      "Seuls les {limit} premiers chercheurs ayant choisi d'être comptés sont inclus.",
    figuresScope:
      "Nombre de travaux listés par le CV public de chaque chercheur, additionnés : par année et par état d'accès ouvert, puis par rubrique. Des nombres seulement ; chaque ligne indique son propre total. Une année, une case ou une rubrique à laquelle moins de {k} chercheurs contribuent n'est pas affichée, et chaque fois que ce qui est masqué ne reposerait que sur moins de {k} chercheurs, le chiffre affiché suivant le plus petit est masqué avec — au sein d'une ligne comme entre les deux tableaux.",
    figuresNotCompared:
      "Ce sont les chiffres des chercheurs eux-mêmes, additionnés. Ils ne sont pas comparés à la fiche de l'organisation dans OpenAlex, et aucun n'est soustrait de l'autre.",
    figuresByYearHeading: "Travaux par année et état d'accès ouvert",
    figuresByTypeHeading: "Travaux par rubrique",
    figuresSuppressed: "moins de {k} chercheurs",
    figuresAllSuppressed:
      "Aucun chiffre ne peut encore être affiché : chaque année et chaque rubrique compterait moins de {k} chercheurs, ou permettrait de déduire un chiffre portant sur moins de {k}.",
    figuresYearUnknown: "Sans année",
    figuresColYear: "Année",
    figuresColTotal: "Total",
    figuresColSection: "Rubrique",
    figuresColWorks: "Travaux",
    reconciliationOne: "1 chercheur partage ses lignes de rapprochement :",
    reconciliationMany: "{count} chercheurs partagent leurs lignes de rapprochement :",
    reconciliationCsv: "télécharger le CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "Les lignes de l'export de rapprochement identifient le chercheur par son ORCID iD, parce que chacun a choisi de les partager.",
  },
  "de-DE": {
    indexMetaTitle: "Einrichtungen",
    indexMetaDescription:
      "Einrichtungen, unter denen Forschende ihren öffentlichen SigmaCV-Lebenslauf listen ließen – eine Zahl je Einrichtung, keine Namensliste, kein Ranking.",
    indexHeading: "Einrichtungen",
    indexIntro:
      "Jede Einrichtung unten hat mindestens eine forschende Person, die ihren öffentlichen Lebenslauf darunter listen ließ. Die Seite zeigt, wie viele es sind – nur eine Zahl, nie wer, und nie ein Vergleich zwischen Einrichtungen.",
    indexEmpty: "Noch keine forschende Person hat sich unter einer Einrichtung listen lassen.",
    metaDescription:
      "Forschende, die ihren öffentlichen SigmaCV-Lebenslauf unter {name} listen ließen: nur eine Zahl – keine Namensliste, kein Ranking, keine Bewertung.",
    listedOne: "1 forschende Person gibt diese Zugehörigkeit an",
    listedMany: "{count} Forschende geben diese Zugehörigkeit an",
    rorLabel: "ROR-Eintrag",
    selfDeclared:
      "Jede dieser Personen hat diese Zugehörigkeit im eigenen Lebenslauf angegeben und sich entschieden, hier zu erscheinen. Die Zahl ist ihre, nicht die der Einrichtung: Sie ist keine Personalliste und sagt nichts über jemanden, der fehlt.",
    oaiHeading: "Maschineller Zugriff",
    oaiBody:
      "Die gelisteten Lebensläufe können als OAI-PMH-Set geerntet werden (Dublin Core, ein Datensatz je Lebenslauf und je Arbeit):",
    oaiLink: "OAI-PMH-Set {id}",
    aboutHeading: "Über diese Seite",
    aboutController:
      "SigmaCV wird von Basile Chrétien als unabhängiges persönliches Projekt betrieben – nicht von oder im Auftrag einer Universität oder eines Arbeitgebers – und er ist der alleinige Verantwortliche für die personenbezogenen Daten hinter dieser Seite.",
    aboutReader:
      "Die hier genannte Einrichtung ist eine Leserin wie jede andere: Sie erhält nichts von SigmaCV, hat kein Konto und gibt keine Anweisungen dazu, was verarbeitet oder angezeigt wird.",
    aboutVoluntary:
      "Gelistet zu werden ist die eigene, widerrufliche Entscheidung jeder forschenden Person. Das Fehlen auf dieser Seite bedeutet nichts: Die meisten Forschenden sind nicht auf SigmaCV, und wer es ist, hat die Option vielleicht einfach nicht aktiviert.",
    aboutNoRanking:
      "SigmaCV erstellt weder hier noch anderswo Rankings, Bewertungen oder Vergleiche von Forschenden. Um einen überprüfbaren Lebenslauf zu lesen, bitten Sie die forschende Person um einen Anfragelink – sie entscheidet, was sie Ihnen schickt.",
    aboutRequestLink: "So funktionieren Anfragelinks",
    backToIndex: "← Alle Einrichtungen",
    backLink: "← Zurück zu SigmaCV",
    rateLimitedHeading: "Zu viele Anfragen",
    rateLimitedBody:
      "Diese Seite hat in kurzer Zeit sehr viele Anfragen erhalten. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    openalexHeading: "Was OpenAlex über diese Einrichtung verzeichnet",
    openalexNotFetched: "OpenAlex-Zahlen noch nicht abgerufen.",
    openalexCountedEntity:
      "Gezählt als OpenAlex-Entität {id} ({entityName}): eine Linie von {lineage}, {related} verbundene Einrichtungen. Kliniken und angegliederte Labore, die OpenAlex als verwandte oder untergeordnete Einrichtungen führt, werden eingerechnet; übergeordnete Einrichtungen nicht.",
    openalexScope:
      "Anzahl der Artikel, Übersichtsarbeiten, Buchkapitel und Preprints, die OpenAlex diesen Einrichtungen zuordnet, {from}–{to}. Datensätze bleiben außen vor: sie überschwemmen das laufende Jahr. Jede Tabelle nennt ihre eigene Gesamtzahl.",
    openalexNotCompared:
      "Das sind OpenAlex-Zahlen über die Einrichtung, nicht über die oben gelisteten Forschenden, und SigmaCV vergleicht beides nicht miteinander.",
    openalexWorksByYearHeading: "Arbeiten nach Jahr",
    openalexOaByYearHeading: "Open-Access-Status nach Jahr",
    openalexOaNote:
      "Der Status, den OpenAlex der besten offenen Kopie jeder Arbeit zuweist (gold, hybrid, diamond, green, bronze — oder closed, wenn keine gefunden wurde). Gesamt ist die Zahl der Arbeiten mit einem Status in dem Jahr, aus derselben Abfrage wie die Spalten; sie kann leicht von der Tabelle der Arbeiten nach Jahr abweichen.",
    openalexCountriesHeading: "Länder der Koautorinnen und Koautoren (Top {n})",
    openalexCountriesNote:
      "Anzahl der Arbeiten mit mindestens einer in dem jeweiligen Land affiliierten Autorin oder einem Autor, das Land dieser Einrichtung eingeschlossen.",
    openalexCoAffiliationsHeading: "Mitaffiliierte Einrichtungen (Top {n})",
    openalexCoAffiliationsNote:
      "Anzahl der Arbeiten, die auch eine Autorin oder einen Autor der jeweils anderen Einrichtung tragen; die eigene Linie und die verbundenen Einrichtungen dieser Einrichtung bleiben außen vor.",
    openalexAsOf:
      "Stand {date}, laut OpenAlex; von SigmaCV etwa wöchentlich aktualisiert. Beim Öffnen dieser Seite wird nichts abgerufen.",
    openalexColShare: "Offener Anteil",
    openalexShareNote:
      "Offener Anteil: die Arbeiten, die OpenAlex mit irgendeinem Status außer closed führt (bronze eingeschlossen), geteilt durch die Gesamtzahl des Jahres und als ganze Prozentzahl neben beiden Zahlen abgedruckt. Er wird nur angegeben, wenn ein Jahr mindestens {floor} Arbeiten mit Status zählt, und nicht für das letzte gezeigte Jahr, das noch nicht zu Ende ist; die Status des Vorjahres können sich noch ändern, wenn Embargofristen ablaufen. Er ist nicht nach Fach, Sprache, Verlag oder Größe bereinigt: ein Unterschied von wenigen Punkten oder eine Verschiebung zwischen Abrufen, die Wochen auseinanderliegen, bedeutet für sich genommen nichts.",
    openalexShareFew: "zu wenige Arbeiten für einen Anteil",
    openalexShareIncomplete: "Jahr nicht abgeschlossen",
    openalexTotalsDiffer:
      "Für {years} zählt die Tabelle der Arbeiten nach Jahr eine deutlich andere Zahl von Arbeiten als die mit Status hier; beide stammen aus verschiedenen OpenAlex-Abfragen.",
    openalexDomainsHeading: "OpenAlex-Domänen",
    openalexDomainsNote:
      "Arbeiten nach der OpenAlex-Domäne ihres Hauptthemas, {from}–{to}: insgesamt {total} Arbeiten; die Zeilen können weniger ergeben, da eine Arbeit ohne von OpenAlex zugewiesenes Thema in keiner Zeile steht. Der offene Anteil oben ist nicht um diese Zusammensetzung bereinigt: wo sich zwei Einrichtungen hier unterscheiden, messen ihre Anteile nicht dasselbe.",
    openalexColDomain: "Domäne",
    openalexColYear: "Jahr",
    openalexColWorks: "Arbeiten",
    openalexColTotal: "Gesamt",
    openalexColCountry: "Land",
    openalexColOrganisation: "Einrichtung",
    figuresHeading: "Zahlen der Forschenden, die sich hier zählen lassen",
    figuresBelowK:
      "Weniger als {k} Forschende haben sich entschieden, hier gezählt zu werden; deshalb werden noch keine Zahlen gezeigt.",
    figuresContributors:
      "{count} Forschende haben sich entschieden, auf dieser Seite gezählt zu werden.",
    figuresPending:
      "{pending} weitere haben sich dafür entschieden, doch ihre Zahlen sind noch nicht berechnet; sie kommen nach ihrem nächsten Speichern oder der wöchentlichen Neusynchronisierung hinzu.",
    figuresTruncated: "Nur die ersten {limit} Forschenden, die sich zählen lassen, sind enthalten.",
    figuresScope:
      "Anzahl der Arbeiten, die der öffentliche Lebenslauf jeder Person auflistet, aufsummiert: nach Jahr und Open-Access-Status, dann nach Abschnitt. Nur Zahlen; jede Zeile nennt ihre eigene Gesamtzahl. Ein Jahr, eine Zelle oder ein Abschnitt, zu dem weniger als {k} Forschende beitragen, wird nicht gezeigt, und wo das Verborgene auf weniger als {k} Forschenden beruhte, wird die nächstkleinere gezeigte Zahl mit verborgen – innerhalb einer Zeile wie zwischen den beiden Tabellen.",
    figuresNotCompared:
      "Das sind die eigenen Zahlen der Forschenden, aufsummiert. Sie werden nicht mit dem OpenAlex-Eintrag der Organisation verglichen, und keines wird vom anderen abgezogen.",
    figuresByYearHeading: "Arbeiten nach Jahr und Open-Access-Status",
    figuresByTypeHeading: "Arbeiten nach Abschnitt",
    figuresSuppressed: "weniger als {k} Forschende",
    figuresAllSuppressed:
      "Noch kann keine Zahl gezeigt werden: Jedes Jahr und jeder Abschnitt würde entweder weniger als {k} Forschende zählen oder eine Zahl über weniger als {k} ableitbar machen.",
    figuresYearUnknown: "Ohne Jahr",
    figuresColYear: "Jahr",
    figuresColTotal: "Gesamt",
    figuresColSection: "Abschnitt",
    figuresColWorks: "Arbeiten",
    reconciliationOne: "1 forschende Person teilt ihre Abgleichszeilen:",
    reconciliationMany: "{count} Forschende teilen ihre Abgleichszeilen:",
    reconciliationCsv: "CSV herunterladen",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "Die Zeilen des Abgleichsexports nennen die forschende Person über ihre ORCID iD, weil jede einzelne sich dafür entschieden hat, sie zu teilen.",
  },
  "ja-JP": {
    indexMetaTitle: "研究機関",
    indexMetaDescription:
      "研究者が自分の SigmaCV 公開 CV を掲載することを選んだ研究機関の一覧。機関ごとの人数のみで、名簿も順位付けもありません。",
    indexHeading: "研究機関",
    indexIntro:
      "以下の各機関には、その機関の下に公開 CV を掲載することを選んだ研究者が少なくとも 1 人います。このページに表示されるのは人数だけで、誰かは表示されず、機関同士の比較も行いません。",
    indexEmpty: "まだ、機関の下への掲載を選んだ研究者はいません。",
    metaDescription:
      "{name} の下に SigmaCV 公開 CV を掲載することを選んだ研究者：人数のみ。名簿も順位付けもスコアもありません。",
    listedOne: "1 人の研究者がこの所属を掲載しています",
    listedMany: "{count} 人の研究者がこの所属を掲載しています",
    rorLabel: "ROR レコード",
    selfDeclared:
      "各研究者は自分の CV でこの所属を申告し、ここに掲載されることを選びました。この人数は研究者自身のものであり、機関のものではありません。職員名簿ではなく、掲載されていない人については何も意味しません。",
    oaiHeading: "機械アクセス",
    oaiBody:
      "掲載された CV は OAI-PMH セットとして収集できます（Dublin Core、CV ごと・業績ごとに 1 レコード）：",
    oaiLink: "OAI-PMH セット {id}",
    aboutHeading: "このページについて",
    aboutController:
      "SigmaCV は Basile Chrétien が独立した個人プロジェクトとして運営しており、いかなる大学や雇用主によるもの、またはその代理でもありません。このページの背後にある個人データの唯一の管理者は本人です。",
    aboutReader:
      "ここに名前のある機関は、他の誰とも同じ読者にすぎません。SigmaCV から何も受け取らず、アカウントも持たず、何を処理・表示するかについて指示することもありません。",
    aboutVoluntary:
      "掲載は各研究者本人の、撤回可能な選択です。このページに載っていないことは何も意味しません。ほとんどの研究者は SigmaCV を使っておらず、使っている人も単にオプトインしていないだけかもしれません。",
    aboutNoRanking:
      "SigmaCV は、ここでも他のどこでも、研究者を順位付け・採点・比較しません。検証可能な CV を読むには、研究者本人にリクエストリンクを依頼してください。何を送るかは本人が決めます。",
    aboutRequestLink: "リクエストリンクの仕組み",
    backToIndex: "← すべての研究機関",
    backLink: "← SigmaCV に戻る",
    rateLimitedHeading: "リクエストが多すぎます",
    rateLimitedBody:
      "短時間にこのページへのリクエストが集中しました。少し待ってからもう一度お試しください。",
    openalexHeading: "OpenAlex におけるこの機関の記録",
    openalexNotFetched: "OpenAlex のデータはまだ取得されていません。",
    openalexCountedEntity:
      "OpenAlex エンティティ {id}（{entityName}）として集計：系統 {lineage} 件、関連機関 {related} 件。OpenAlex が関連機関または下位機関として記録する病院や附属研究所は含めます。上位機関は含めません。",
    openalexScope:
      "OpenAlex がこれらの機関に帰属させた論文・総説・図書の章・プレプリントの件数（{from}–{to} 年）。データセットは除外しています。当年の件数を埋め尽くしてしまうためです。各表はそれぞれの合計を明示しています。",
    openalexNotCompared:
      "これは機関に関する OpenAlex の数値であり、上に掲載された研究者に関するものではありません。SigmaCV は両者を比較しません。",
    openalexWorksByYearHeading: "年別の研究成果数",
    openalexOaByYearHeading: "年別のオープンアクセス状況",
    openalexOaNote:
      "各成果の最良のオープン版に OpenAlex が付与した状態（gold、hybrid、diamond、green、bronze。見つからない場合は closed）。合計はその年に状態のある成果の件数で、各列と同じ問い合わせによるものです。年別の研究成果数の表とはわずかに異なることがあります。",
    openalexCountriesHeading: "共著者の国（上位 {n}）",
    openalexCountriesNote:
      "各国に所属する著者を少なくとも一人含む成果の件数。この機関の国も含みます。",
    openalexCoAffiliationsHeading: "共同所属機関（上位 {n}）",
    openalexCoAffiliationsNote:
      "他の各機関の著者も含む成果の件数。この機関自身の系統と関連機関は除きます。",
    openalexAsOf:
      "{date} 時点、OpenAlex より。SigmaCV がおよそ週に一度更新します。このページを開いた時点で取得される情報はありません。",
    openalexColShare: "オープン率",
    openalexShareNote:
      "オープン率：OpenAlex が closed 以外のいずれかの状態（bronze を含む）を付与した成果数をその年の合計で割り、整数のパーセントに丸めて、二つの件数と並べて示します。ある年に状態のある成果が {floor} 件以上ある場合にのみ示し、まだ終わっていない表示される最後の年には示しません。その前年の状態も、エンバーゴの終了に伴いなお変わることがあります。分野・言語・出版社・規模による補正はしていません。数ポイントの差や、数週間離れて読み取った記録の間の変動は、それだけでは何も意味しません。",
    openalexShareFew: "成果が少なすぎるため率を示しません",
    openalexShareIncomplete: "年が終わっていません",
    openalexTotalsDiffer:
      "{years} 年は、年別の研究成果数の表の件数がここでの状態のある成果数と明らかに異なります。両者は OpenAlex への別々の問い合わせによるものです。",
    openalexDomainsHeading: "OpenAlex のドメイン",
    openalexDomainsNote:
      "主要トピックの OpenAlex ドメイン別の成果数（{from}–{to} 年）。合計 {total} 件。OpenAlex がトピックを付与していない成果はどの行にも含まれないため、各行の合計はこれより少ないことがあります。上のオープン率はこの構成で補正していません。ここで構成が異なる二つの機関では、その率は同じものを測っていません。",
    openalexColDomain: "ドメイン",
    openalexColYear: "年",
    openalexColWorks: "成果",
    openalexColTotal: "合計",
    openalexColCountry: "国",
    openalexColOrganisation: "機関",
    figuresHeading: "ここで数えられることを選んだ研究者の数値",
    figuresBelowK:
      "ここで数えられることを選んだ研究者は {k} 人未満のため、数値はまだ表示されません。",
    figuresContributors: "{count} 人の研究者がこのページで数えられることを選びました。",
    figuresPending:
      "さらに {pending} 人が数えられることを選びましたが、その数値はまだ算出されていません。次回の保存または毎週の再同期の後に加わります。",
    figuresTruncated: "数えられることを選んだ研究者のうち、最初の {limit} 人のみを含みます。",
    figuresScope:
      "各研究者の公開 CV に掲載された業績の件数を合計したものです。年とオープンアクセスの状態ごと、次にセクションごとに示します。件数のみで、各行はそれ自身の合計を示します。{k} 人未満の研究者しか寄与しない年・セル・セクションは表示せず、隠された部分が {k} 人未満の研究者にしか基づかない場合は、次に小さい表示中の数字も併せて隠します。これは行の中でも、両方の表の間でも同様です。",
    figuresNotCompared:
      "これは研究者自身の数値を合計したものです。OpenAlex にある組織の記録とは比較せず、どちらかをもう一方から差し引くこともありません。",
    figuresByYearHeading: "年とオープンアクセスの状態ごとの業績",
    figuresByTypeHeading: "セクションごとの業績",
    figuresSuppressed: "{k} 人未満の研究者",
    figuresAllSuppressed:
      "まだ数字を表示できません。どの年もどのセクションも、{k} 人未満の研究者しか含まないか、{k} 人未満に関する数字が推定できてしまうためです。",
    figuresYearUnknown: "年なし",
    figuresColYear: "年",
    figuresColTotal: "合計",
    figuresColSection: "セクション",
    figuresColWorks: "業績",
    reconciliationOne: "1 人の研究者が照合用の行を共有しています：",
    reconciliationMany: "{count} 人の研究者が照合用の行を共有しています：",
    reconciliationCsv: "CSV をダウンロード",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "照合エクスポートの各行は ORCID iD で研究者を特定します。各研究者が自ら共有を選んだためです。",
  },
  "pt-BR": {
    indexMetaTitle: "Instituições",
    indexMetaDescription:
      "Instituições sob as quais pesquisadores escolheram listar seu CV público do SigmaCV: uma contagem por instituição, sem lista de nomes, sem ranking.",
    indexHeading: "Instituições",
    indexIntro:
      "Cada instituição abaixo tem pelo menos um pesquisador que escolheu listar seu CV público sob ela. A página mostra quantos o fizeram: apenas uma contagem, nunca quem, e nunca uma comparação entre instituições.",
    indexEmpty: "Nenhum pesquisador escolheu ainda ser listado sob uma instituição.",
    metaDescription:
      "Pesquisadores que escolheram listar seu CV público do SigmaCV sob {name}: apenas uma contagem, sem lista de nomes, sem ranking, sem pontuação.",
    listedOne: "1 pesquisador lista esta afiliação",
    listedMany: "{count} pesquisadores listam esta afiliação",
    rorLabel: "Registro ROR",
    selfDeclared:
      "Cada um deles declarou esta afiliação em seu próprio CV e escolheu aparecer aqui. A contagem é deles, não da instituição: não é uma lista de pessoal e nada diz sobre quem não aparece.",
    oaiHeading: "Acesso por máquina",
    oaiBody:
      "Os CVs listados podem ser coletados como um conjunto OAI-PMH (Dublin Core, um registro por CV e por trabalho):",
    oaiLink: "Conjunto OAI-PMH {id}",
    aboutHeading: "Sobre esta página",
    aboutController:
      "O SigmaCV é operado por Basile Chrétien como um projeto pessoal independente — não por nenhuma universidade ou empregador, nem em nome deles — e ele é o único controlador dos dados pessoais por trás desta página.",
    aboutReader:
      "A instituição aqui nomeada é uma leitora como qualquer outra: não recebe nada do SigmaCV, não tem conta e não instrui nada sobre o que é processado ou exibido.",
    aboutVoluntary:
      "Ser listado é uma escolha própria e revogável de cada pesquisador. A ausência desta página não significa nada: a maioria dos pesquisadores não está no SigmaCV, e os que estão podem simplesmente não ter ativado a opção.",
    aboutNoRanking:
      "O SigmaCV não classifica, pontua nem compara pesquisadores, aqui ou em qualquer outro lugar. Para ler um CV verificável, peça ao pesquisador um link de solicitação: ele escolhe o que lhe enviar.",
    aboutRequestLink: "Como funcionam os links de solicitação",
    backToIndex: "← Todas as instituições",
    backLink: "← Voltar ao SigmaCV",
    rateLimitedHeading: "Muitas solicitações",
    rateLimitedBody:
      "Houve muitas solicitações a esta página em pouco tempo. Aguarde um momento e tente novamente.",
    openalexHeading: "O registro desta organização no OpenAlex",
    openalexNotFetched: "Números do OpenAlex ainda não obtidos.",
    openalexCountedEntity:
      "Contabilizada como a entidade {id} do OpenAlex ({entityName}): uma linhagem de {lineage}, {related} organizações associadas. Hospitais e laboratórios afiliados que o OpenAlex registra como organizações relacionadas ou subordinadas são incluídos; organizações-mãe, não.",
    openalexScope:
      "Contagem de artigos, revisões, capítulos de livro e preprints que o OpenAlex atribui a essas organizações, {from}–{to}. Conjuntos de dados ficam de fora: eles inundam o ano corrente. Cada tabela indica seu próprio total.",
    openalexNotCompared:
      "São os números do OpenAlex sobre a organização, não sobre as pessoas pesquisadoras listadas acima, e o SigmaCV não compara uns com os outros.",
    openalexWorksByYearHeading: "Trabalhos por ano",
    openalexOaByYearHeading: "Status de acesso aberto por ano",
    openalexOaNote:
      "O status que o OpenAlex atribui à melhor cópia aberta de cada trabalho (gold, hybrid, diamond, green, bronze — ou closed quando não encontrou nenhuma). O total é o número de trabalhos com status naquele ano, da mesma consulta que as colunas; pode diferir ligeiramente da tabela de trabalhos por ano.",
    openalexCountriesHeading: "Países dos coautores ({n} primeiros)",
    openalexCountriesNote:
      "Número de trabalhos com pelo menos um autor afiliado em cada país, incluindo o país desta organização.",
    openalexCoAffiliationsHeading: "Organizações coafiliadas ({n} primeiras)",
    openalexCoAffiliationsNote:
      "Número de trabalhos que também trazem um autor de cada outra organização; a própria linhagem e as organizações associadas desta organização ficam de fora.",
    openalexAsOf:
      "Em {date}, segundo o OpenAlex; atualizado pelo SigmaCV mais ou menos a cada semana. Nada nesta página é buscado ao abri-la.",
    openalexColShare: "Proporção aberta",
    openalexShareNote:
      "Proporção aberta: os trabalhos que o OpenAlex registra com qualquer status exceto closed (bronze incluído), divididos pelo total daquele ano e expressos como porcentagem inteira ao lado das duas contagens. Só é indicada quando um ano conta pelo menos {floor} trabalhos com status, e nunca para o último ano mostrado, que não terminou; os status do ano anterior ainda podem mudar à medida que os embargos expiram. Não é ajustada por área, idioma, editora ou tamanho: uma diferença de alguns pontos, ou uma variação entre registros lidos com semanas de intervalo, não significa nada por si só.",
    openalexShareFew: "trabalhos de menos para indicar uma proporção",
    openalexShareIncomplete: "ano não completo",
    openalexTotalsDiffer:
      "Em {years}, a tabela de trabalhos por ano conta um número de trabalhos claramente diferente do de trabalhos com status aqui; os dois vêm de consultas distintas ao OpenAlex.",
    openalexDomainsHeading: "Domínios do OpenAlex",
    openalexDomainsNote:
      "Trabalhos pelo domínio do OpenAlex de seu tema principal, {from}–{to}: {total} trabalhos ao todo; as linhas podem somar menos, pois um trabalho ao qual o OpenAlex não atribuiu tema não está em nenhuma linha. A proporção aberta acima não é ajustada por essa composição: onde duas organizações diferem aqui, suas proporções não medem a mesma coisa.",
    openalexColDomain: "Domínio",
    openalexColYear: "Ano",
    openalexColWorks: "Trabalhos",
    openalexColTotal: "Total",
    openalexColCountry: "País",
    openalexColOrganisation: "Organização",
    figuresHeading: "Números de quem escolheu ser contado aqui",
    figuresBelowK:
      "Menos de {k} pesquisadores escolheram ser contados aqui, por isso ainda não há números exibidos.",
    figuresContributors: "{count} pesquisadores escolheram ser contados nesta página.",
    figuresPending:
      "Outros {pending} escolheram ser contados, mas seus números ainda não foram calculados; eles entram após o próximo salvamento ou a ressincronização semanal.",
    figuresTruncated:
      "Apenas os primeiros {limit} pesquisadores que escolheram ser contados estão incluídos.",
    figuresScope:
      "Contagens dos trabalhos que o CV público de cada pesquisador lista, somadas: por ano e estado de acesso aberto, depois por seção. Apenas contagens; cada linha informa o seu próprio total. Um ano, uma célula ou uma seção para os quais menos de {k} pesquisadores contribuem não é exibido, e sempre que o que está oculto se apoiasse em menos de {k} pesquisadores, o próximo menor número exibido é ocultado junto — dentro de uma linha e entre as duas tabelas.",
    figuresNotCompared:
      "São os números dos próprios pesquisadores, somados. Não são comparados com o registro da organização no OpenAlex, e nenhum é subtraído do outro.",
    figuresByYearHeading: "Trabalhos por ano e estado de acesso aberto",
    figuresByTypeHeading: "Trabalhos por seção",
    figuresSuppressed: "menos de {k} pesquisadores",
    figuresAllSuppressed:
      "Nenhum número pode ser mostrado ainda: cada ano e cada seção contaria menos de {k} pesquisadores ou permitiria deduzir um número sobre menos de {k}.",
    figuresYearUnknown: "Sem ano",
    figuresColYear: "Ano",
    figuresColTotal: "Total",
    figuresColSection: "Seção",
    figuresColWorks: "Trabalhos",
    reconciliationOne: "1 pesquisador compartilha suas linhas de conciliação:",
    reconciliationMany: "{count} pesquisadores compartilham suas linhas de conciliação:",
    reconciliationCsv: "baixar CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "As linhas da exportação de conciliação identificam o pesquisador pelo ORCID iD, porque cada um escolheu compartilhá-las.",
  },
  "it-IT": {
    indexMetaTitle: "Istituzioni",
    indexMetaDescription:
      "Istituzioni sotto cui i ricercatori hanno scelto di elencare il proprio CV pubblico SigmaCV: un conteggio per istituzione, nessun elenco di nomi, nessuna classifica.",
    indexHeading: "Istituzioni",
    indexIntro:
      "Ogni istituzione qui sotto ha almeno un ricercatore che ha scelto di elencarvi il proprio CV pubblico. La pagina mostra quanti lo hanno fatto: solo un conteggio, mai chi, e mai un confronto tra istituzioni.",
    indexEmpty: "Nessun ricercatore ha ancora scelto di essere elencato sotto un'istituzione.",
    metaDescription:
      "Ricercatori che hanno scelto di elencare il proprio CV pubblico SigmaCV sotto {name}: solo un conteggio, nessun elenco di nomi, nessuna classifica, nessun punteggio.",
    listedOne: "1 ricercatore elenca questa affiliazione",
    listedMany: "{count} ricercatori elencano questa affiliazione",
    rorLabel: "Scheda ROR",
    selfDeclared:
      "Ciascuno di loro ha dichiarato questa affiliazione nel proprio CV e ha scelto di comparire qui. Il conteggio è loro, non dell'istituzione: non è un elenco del personale e non dice nulla di chi non compare.",
    oaiHeading: "Accesso automatico",
    oaiBody:
      "I CV elencati possono essere raccolti come set OAI-PMH (Dublin Core, un record per CV e per lavoro):",
    oaiLink: "Set OAI-PMH {id}",
    aboutHeading: "Informazioni su questa pagina",
    aboutController:
      "SigmaCV è gestito da Basile Chrétien come progetto personale indipendente — non da né per conto di alcuna università o datore di lavoro — ed è l'unico titolare del trattamento dei dati personali dietro questa pagina.",
    aboutReader:
      "L'istituzione qui nominata è un lettore come chiunque altro: non riceve nulla da SigmaCV, non ha un account e non dà istruzioni su cosa viene trattato o mostrato.",
    aboutVoluntary:
      "Comparire qui è una scelta propria e revocabile di ogni ricercatore. L'assenza da questa pagina non significa nulla: la maggior parte dei ricercatori non è su SigmaCV, e chi c'è potrebbe semplicemente non aver attivato l'opzione.",
    aboutNoRanking:
      "SigmaCV non classifica, non valuta con punteggi e non confronta i ricercatori, né qui né altrove. Per leggere un CV verificabile, chiedi al ricercatore un link di richiesta: è lui a scegliere cosa inviarti.",
    aboutRequestLink: "Come funzionano i link di richiesta",
    backToIndex: "← Tutte le istituzioni",
    backLink: "← Torna a SigmaCV",
    rateLimitedHeading: "Troppe richieste",
    rateLimitedBody:
      "Questa pagina ha ricevuto molte richieste in poco tempo. Attendi un momento e riprova.",
    openalexHeading: "Ciò che OpenAlex registra su questa organizzazione",
    openalexNotFetched: "Dati OpenAlex non ancora recuperati.",
    openalexCountedEntity:
      "Conteggiata come entità OpenAlex {id} ({entityName}): una discendenza di {lineage}, {related} organizzazioni associate. Ospedali e laboratori affiliati che OpenAlex registra come organizzazioni collegate o dipendenti sono inclusi; le organizzazioni madri no.",
    openalexScope:
      "Conteggio di articoli, rassegne, capitoli di libro e preprint che OpenAlex attribuisce a queste organizzazioni, {from}–{to}. I dataset sono esclusi: sommergono l'anno in corso. Ogni tabella indica il proprio totale.",
    openalexNotCompared:
      "Sono i dati di OpenAlex sull'organizzazione, non sulle ricercatrici e i ricercatori elencati sopra, e SigmaCV non confronta gli uni con gli altri.",
    openalexWorksByYearHeading: "Lavori per anno",
    openalexOaByYearHeading: "Stato di accesso aperto per anno",
    openalexOaNote:
      "Lo stato che OpenAlex assegna alla migliore copia aperta di ciascun lavoro (gold, hybrid, diamond, green, bronze, oppure closed quando non ne ha trovata alcuna). Il totale è il numero di lavori con uno stato in quell'anno, dalla stessa richiesta delle colonne; può differire leggermente dalla tabella dei lavori per anno.",
    openalexCountriesHeading: "Paesi dei coautori (primi {n})",
    openalexCountriesNote:
      "Numero di lavori con almeno un autore affiliato in ciascun paese, incluso quello di questa organizzazione.",
    openalexCoAffiliationsHeading: "Organizzazioni coaffiliate (prime {n})",
    openalexCoAffiliationsNote:
      "Numero di lavori che riportano anche un autore di ciascun'altra organizzazione; la discendenza e le organizzazioni associate di questa organizzazione sono escluse.",
    openalexAsOf:
      "Al {date}, secondo OpenAlex; aggiornato da SigmaCV circa ogni settimana. Nulla in questa pagina viene recuperato all'apertura.",
    openalexColShare: "Quota aperta",
    openalexShareNote:
      "Quota aperta: i lavori che OpenAlex registra con qualsiasi stato tranne closed (bronze incluso), divisi per il totale dell'anno ed espressi come percentuale intera accanto a entrambi i conteggi. È indicata solo quando un anno conta almeno {floor} lavori con uno stato, e mai per l'ultimo anno mostrato, che non è finito; gli stati dell'anno precedente possono ancora cambiare man mano che scadono gli embarghi. Non è corretta per disciplina, lingua, editore o dimensione: una differenza di pochi punti, o una variazione fra letture distanti settimane, non significa nulla di per sé.",
    openalexShareFew: "troppo pochi lavori per indicare una quota",
    openalexShareIncomplete: "anno non completo",
    openalexTotalsDiffer:
      "Per {years}, la tabella dei lavori per anno conta un numero di lavori nettamente diverso da quello dei lavori con uno stato qui; i due provengono da richieste OpenAlex distinte.",
    openalexDomainsHeading: "Domini OpenAlex",
    openalexDomainsNote:
      "Lavori per dominio OpenAlex del loro tema principale, {from}–{to}: {total} lavori in tutto; le righe possono sommare a meno, poiché un lavoro a cui OpenAlex non ha assegnato un tema non compare in alcuna riga. La quota aperta qui sopra non è corretta per questa composizione: dove due organizzazioni differiscono qui, le loro quote non misurano la stessa cosa.",
    openalexColDomain: "Dominio",
    openalexColYear: "Anno",
    openalexColWorks: "Lavori",
    openalexColTotal: "Totale",
    openalexColCountry: "Paese",
    openalexColOrganisation: "Organizzazione",
    figuresHeading: "Numeri di chi ha scelto di essere conteggiato qui",
    figuresBelowK:
      "Meno di {k} ricercatori hanno scelto di essere conteggiati qui, quindi non viene ancora mostrato alcun numero.",
    figuresContributors: "{count} ricercatori hanno scelto di essere conteggiati in questa pagina.",
    figuresPending:
      "Altri {pending} hanno scelto di essere conteggiati, ma i loro numeri non sono ancora stati calcolati; si aggiungono dopo il prossimo salvataggio o la risincronizzazione settimanale.",
    figuresTruncated:
      "Sono inclusi solo i primi {limit} ricercatori che hanno scelto di essere conteggiati.",
    figuresScope:
      "Conteggi dei lavori elencati dal CV pubblico di ciascun ricercatore, sommati: per anno e stato di accesso aperto, poi per sezione. Solo conteggi; ogni riga indica il proprio totale. Un anno, una cella o una sezione a cui contribuiscono meno di {k} ricercatori non viene mostrata, e ogni volta che ciò che è nascosto poggerebbe su meno di {k} ricercatori, viene nascosta anche la cifra mostrata successiva più piccola — all'interno di una riga come tra le due tabelle.",
    figuresNotCompared:
      "Sono i numeri dei ricercatori stessi, sommati. Non vengono confrontati con la scheda dell'organizzazione in OpenAlex, e nessuno dei due viene sottratto all'altro.",
    figuresByYearHeading: "Lavori per anno e stato di accesso aperto",
    figuresByTypeHeading: "Lavori per sezione",
    figuresSuppressed: "meno di {k} ricercatori",
    figuresAllSuppressed:
      "Nessuna cifra può ancora essere mostrata: ogni anno e ogni sezione conterebbe meno di {k} ricercatori o permetterebbe di ricavare una cifra su meno di {k}.",
    figuresYearUnknown: "Senza anno",
    figuresColYear: "Anno",
    figuresColTotal: "Totale",
    figuresColSection: "Sezione",
    figuresColWorks: "Lavori",
    reconciliationOne: "1 ricercatore condivide le sue righe di riconciliazione:",
    reconciliationMany: "{count} ricercatori condividono le loro righe di riconciliazione:",
    reconciliationCsv: "scarica il CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "Le righe dell'esportazione di riconciliazione identificano il ricercatore tramite il suo ORCID iD, perché ognuno ha scelto di condividerle.",
  },
  "ko-KR": {
    indexMetaTitle: "기관",
    indexMetaDescription:
      "연구자가 자신의 SigmaCV 공개 CV를 등록하기로 선택한 기관 목록. 기관별 인원수만 표시되며, 명단도 순위도 없습니다.",
    indexHeading: "기관",
    indexIntro:
      "아래 각 기관에는 그 기관 아래 공개 CV를 등록하기로 선택한 연구자가 최소 한 명 있습니다. 이 페이지는 그 인원수만 보여 줍니다. 누구인지는 표시하지 않으며, 기관 간 비교도 하지 않습니다.",
    indexEmpty: "아직 기관 아래 등록을 선택한 연구자가 없습니다.",
    metaDescription:
      "{name} 아래 SigmaCV 공개 CV를 등록하기로 선택한 연구자: 인원수만 표시됩니다. 명단도, 순위도, 점수도 없습니다.",
    listedOne: "1명의 연구자가 이 소속을 등록했습니다",
    listedMany: "{count}명의 연구자가 이 소속을 등록했습니다",
    rorLabel: "ROR 레코드",
    selfDeclared:
      "각 연구자는 자신의 CV에 이 소속을 직접 신고하고 여기에 등록되기를 선택했습니다. 이 숫자는 연구자들의 것이지 기관의 것이 아닙니다. 직원 명단이 아니며, 여기에 없는 사람에 대해서는 아무것도 말해 주지 않습니다.",
    oaiHeading: "기계 접근",
    oaiBody:
      "등록된 CV는 OAI-PMH 세트로 수집할 수 있습니다(Dublin Core, CV별·연구 성과별 레코드 1건):",
    oaiLink: "OAI-PMH 세트 {id}",
    aboutHeading: "이 페이지에 대하여",
    aboutController:
      "SigmaCV는 Basile Chrétien이 독립적인 개인 프로젝트로 운영하며, 어떤 대학이나 고용주에 의해서도, 그를 대신해서도 운영되지 않습니다. 이 페이지 뒤에 있는 개인정보의 유일한 관리자는 본인입니다.",
    aboutReader:
      "여기에 이름이 있는 기관은 다른 누구와 마찬가지로 독자일 뿐입니다. SigmaCV로부터 아무것도 받지 않고, 계정도 없으며, 무엇을 처리하거나 표시할지 지시하지 않습니다.",
    aboutVoluntary:
      "등록 여부는 각 연구자 본인의 철회 가능한 선택입니다. 이 페이지에 없다는 것은 아무 의미도 없습니다. 대부분의 연구자는 SigmaCV를 사용하지 않으며, 사용하는 사람도 단지 옵트인하지 않았을 수 있습니다.",
    aboutNoRanking:
      "SigmaCV는 여기서도, 다른 어디서도 연구자를 순위 매기거나 점수화하거나 비교하지 않습니다. 검증 가능한 CV를 읽으려면 연구자에게 요청 링크를 요청하세요. 무엇을 보낼지는 연구자가 정합니다.",
    aboutRequestLink: "요청 링크 작동 방식",
    backToIndex: "← 모든 기관",
    backLink: "← SigmaCV로 돌아가기",
    rateLimitedHeading: "요청이 너무 많습니다",
    rateLimitedBody:
      "짧은 시간에 이 페이지에 요청이 많이 몰렸습니다. 잠시 기다린 후 다시 시도해 주세요.",
    openalexHeading: "OpenAlex에 기록된 이 기관",
    openalexNotFetched: "OpenAlex 수치를 아직 가져오지 않았습니다.",
    openalexCountedEntity:
      "OpenAlex 엔터티 {id}({entityName})로 집계: 계보 {lineage}개, 관련 기관 {related}개. OpenAlex가 관련 또는 하위 기관으로 기록한 병원과 부속 연구소는 포함하며, 상위 기관은 포함하지 않습니다.",
    openalexScope:
      "OpenAlex가 이들 기관에 귀속시킨 논문, 리뷰, 단행본 챕터, 프리프린트의 건수({from}–{to}년). 데이터셋은 제외했습니다. 올해 수치를 뒤덮기 때문입니다. 각 표는 자체 합계를 명시합니다.",
    openalexNotCompared:
      "이는 기관에 관한 OpenAlex의 수치이며 위에 나열된 연구자에 관한 것이 아닙니다. SigmaCV는 둘을 서로 비교하지 않습니다.",
    openalexWorksByYearHeading: "연도별 성과 수",
    openalexOaByYearHeading: "연도별 오픈 액세스 상태",
    openalexOaNote:
      "각 성과의 최선의 공개본에 OpenAlex가 부여한 상태(gold, hybrid, diamond, green, bronze — 찾지 못한 경우 closed). 합계는 그해에 상태가 있는 성과의 건수로, 각 열과 같은 요청에서 나온 것입니다. 연도별 성과 표와는 약간 다를 수 있습니다.",
    openalexCountriesHeading: "공저자 국가(상위 {n})",
    openalexCountriesNote:
      "각 국가에 소속된 저자를 한 명 이상 포함한 성과 수이며, 이 기관의 국가도 포함합니다.",
    openalexCoAffiliationsHeading: "공동 소속 기관(상위 {n})",
    openalexCoAffiliationsNote:
      "다른 각 기관의 저자도 포함한 성과 수이며, 이 기관 자체의 계보와 관련 기관은 제외합니다.",
    openalexAsOf:
      "{date} 기준, OpenAlex 제공. SigmaCV가 약 매주 갱신합니다. 이 페이지를 열 때 가져오는 정보는 없습니다.",
    openalexColShare: "공개 비율",
    openalexShareNote:
      "공개 비율: OpenAlex가 closed 이외의 상태(bronze 포함)를 부여한 성과 수를 그해 합계로 나누어 정수 퍼센트로 반올림하고, 두 건수와 나란히 표시합니다. 한 해에 상태가 있는 성과가 {floor}건 이상일 때만 표시하며, 아직 끝나지 않은 표시된 마지막 연도에는 표시하지 않습니다. 그 전년도의 상태도 엠바고가 끝남에 따라 아직 바뀔 수 있습니다. 분야, 언어, 출판사, 규모에 따라 보정하지 않았습니다. 몇 포인트의 차이나 몇 주 간격으로 읽은 기록 사이의 변동은 그 자체로는 아무것도 뜻하지 않습니다.",
    openalexShareFew: "성과가 너무 적어 비율을 표시하지 않습니다",
    openalexShareIncomplete: "연도가 끝나지 않았습니다",
    openalexTotalsDiffer:
      "{years}년은 연도별 성과 표의 건수가 이곳의 상태가 있는 성과 수와 뚜렷이 다릅니다. 둘은 OpenAlex에 대한 서로 다른 요청에서 나왔습니다.",
    openalexDomainsHeading: "OpenAlex 도메인",
    openalexDomainsNote:
      "주요 주제의 OpenAlex 도메인별 성과 수({from}–{to}년): 모두 {total}건. OpenAlex가 주제를 부여하지 않은 성과는 어느 행에도 없으므로 행의 합은 이보다 적을 수 있습니다. 위의 공개 비율은 이 구성에 따라 보정하지 않았습니다. 두 기관이 여기서 다르면 그 비율은 같은 것을 재지 않습니다.",
    openalexColDomain: "도메인",
    openalexColYear: "연도",
    openalexColWorks: "성과",
    openalexColTotal: "합계",
    openalexColCountry: "국가",
    openalexColOrganisation: "기관",
    figuresHeading: "여기에 집계되기를 선택한 연구자들의 수치",
    figuresBelowK:
      "여기에 집계되기를 선택한 연구자가 {k}명 미만이므로 아직 수치를 표시하지 않습니다.",
    figuresContributors: "{count}명의 연구자가 이 페이지에 집계되기를 선택했습니다.",
    figuresPending:
      "추가로 {pending}명이 집계되기를 선택했지만 수치가 아직 계산되지 않았습니다. 다음 저장 또는 주간 재동기화 이후에 더해집니다.",
    figuresTruncated: "집계되기를 선택한 연구자 중 처음 {limit}명만 포함됩니다.",
    figuresScope:
      "각 연구자의 공개 CV에 실린 업적의 건수를 합산한 것입니다. 연도와 오픈 액세스 상태별, 그다음 섹션별로 보여 줍니다. 건수만 표시하며 각 행은 자체 합계를 밝힙니다. {k}명 미만의 연구자만 기여한 연도·칸·섹션은 표시하지 않으며, 가려진 부분이 {k}명 미만의 연구자에게만 기반할 때에는 그다음으로 작은 표시된 수치도 함께 가립니다. 이는 한 행 안에서도, 두 표 사이에서도 마찬가지입니다.",
    figuresNotCompared:
      "이는 연구자들 자신의 수치를 합산한 것입니다. OpenAlex에 있는 기관 기록과 비교하지 않으며, 어느 한쪽을 다른 쪽에서 빼지도 않습니다.",
    figuresByYearHeading: "연도 및 오픈 액세스 상태별 업적",
    figuresByTypeHeading: "섹션별 업적",
    figuresSuppressed: "{k}명 미만의 연구자",
    figuresAllSuppressed:
      "아직 어떤 수치도 표시할 수 없습니다. 모든 연도와 모든 섹션이 {k}명 미만의 연구자만 포함하거나, {k}명 미만에 관한 수치를 추정할 수 있게 하기 때문입니다.",
    figuresYearUnknown: "연도 없음",
    figuresColYear: "연도",
    figuresColTotal: "합계",
    figuresColSection: "섹션",
    figuresColWorks: "업적",
    reconciliationOne: "1명의 연구자가 대조 행을 공유합니다:",
    reconciliationMany: "{count}명의 연구자가 대조 행을 공유합니다:",
    reconciliationCsv: "CSV 다운로드",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "대조 내보내기의 각 행은 ORCID iD로 연구자를 식별합니다. 각 연구자가 직접 공유를 선택했기 때문입니다.",
  },
  "ru-RU": {
    indexMetaTitle: "Учреждения",
    indexMetaDescription:
      "Учреждения, под которыми исследователи решили разместить своё публичное резюме SigmaCV: число по каждому учреждению, без списка имён, без рейтинга.",
    indexHeading: "Учреждения",
    indexIntro:
      "У каждого учреждения ниже есть хотя бы один исследователь, решивший разместить под ним своё публичное резюме. Страница показывает, сколько их: только число, никогда не имена и никогда не сравнение учреждений.",
    indexEmpty: "Пока ни один исследователь не решил быть указанным под учреждением.",
    metaDescription:
      "Исследователи, решившие разместить своё публичное резюме SigmaCV под {name}: только число — без списка имён, без рейтинга, без оценки.",
    listedOne: "1 исследователь указывает эту аффилиацию",
    listedMany: "{count} исследователей указывают эту аффилиацию",
    rorLabel: "Запись ROR",
    selfDeclared:
      "Каждый из них заявил эту аффилиацию в собственном резюме и решил быть указанным здесь. Это число принадлежит им, а не учреждению: это не список сотрудников, и оно ничего не говорит о тех, кого здесь нет.",
    oaiHeading: "Машинный доступ",
    oaiBody:
      "Указанные резюме можно собирать как набор OAI-PMH (Dublin Core, по одной записи на резюме и на работу):",
    oaiLink: "Набор OAI-PMH {id}",
    aboutHeading: "Об этой странице",
    aboutController:
      "SigmaCV ведёт Basile Chrétien как независимый личный проект — не от имени и не по поручению какого-либо университета или работодателя — и он является единственным контролёром персональных данных, стоящих за этой страницей.",
    aboutReader:
      "Названное здесь учреждение — такой же читатель, как и все остальные: оно ничего не получает от SigmaCV, не имеет учётной записи и не даёт указаний о том, что обрабатывается или показывается.",
    aboutVoluntary:
      "Быть указанным — собственный, отзываемый выбор каждого исследователя. Отсутствие на этой странице ничего не значит: большинство исследователей не пользуются SigmaCV, а те, кто пользуется, могли просто не включить эту опцию.",
    aboutNoRanking:
      "SigmaCV не ранжирует, не оценивает и не сравнивает исследователей — ни здесь, ни где-либо ещё. Чтобы прочитать проверяемое резюме, попросите у исследователя ссылку-запрос: он сам решает, что вам отправить.",
    aboutRequestLink: "Как работают ссылки-запросы",
    backToIndex: "← Все учреждения",
    backLink: "← Назад к SigmaCV",
    rateLimitedHeading: "Слишком много запросов",
    rateLimitedBody:
      "За короткое время к этой странице поступило много запросов. Подождите немного и попробуйте снова.",
    openalexHeading: "Что OpenAlex знает об этой организации",
    openalexNotFetched: "Данные OpenAlex ещё не получены.",
    openalexCountedEntity:
      "Учтена как сущность OpenAlex {id} ({entityName}): линия из {lineage}, связанных организаций — {related}. Больницы и аффилированные лаборатории, которые OpenAlex записывает как связанные или дочерние организации, включены; головные организации — нет.",
    openalexScope:
      "Число статей, обзоров, глав книг и препринтов, которые OpenAlex относит к этим организациям, {from}–{to}. Наборы данных исключены: они заполоняют текущий год. Каждая таблица указывает свой итог.",
    openalexNotCompared:
      "Это данные OpenAlex об организации, а не об исследователях, перечисленных выше, и SigmaCV не сравнивает одно с другим.",
    openalexWorksByYearHeading: "Работы по годам",
    openalexOaByYearHeading: "Статус открытого доступа по годам",
    openalexOaNote:
      "Статус, который OpenAlex присваивает лучшей открытой копии каждой работы (gold, hybrid, diamond, green, bronze — или closed, если она не найдена). Итого — число работ со статусом за этот год, из того же запроса, что и столбцы; оно может немного отличаться от таблицы работ по годам.",
    openalexCountriesHeading: "Страны соавторов (первые {n})",
    openalexCountriesNote:
      "Число работ, у которых хотя бы один автор аффилирован в соответствующей стране, включая страну этой организации.",
    openalexCoAffiliationsHeading: "Соаффилированные организации (первые {n})",
    openalexCoAffiliationsNote:
      "Число работ, у которых есть также автор из каждой другой организации; собственная линия и связанные организации этой организации исключены.",
    openalexAsOf:
      "По состоянию на {date}, по данным OpenAlex; SigmaCV обновляет примерно раз в неделю. При открытии этой страницы ничего не запрашивается.",
    openalexColShare: "Открытая доля",
    openalexShareNote:
      "Открытая доля: работы, которым OpenAlex присвоил любой статус, кроме closed (включая bronze), делённые на итог года и выраженные целым процентом рядом с обоими числами. Она указывается только там, где год насчитывает не меньше {floor} работ со статусом, и не для последнего показанного года, который ещё не завершён; статусы предыдущего года ещё могут меняться по мере окончания эмбарго. Она не скорректирована по области, языку, издателю или размеру: разница в несколько пунктов или сдвиг между записями, прочитанными с разницей в недели, сама по себе ничего не значит.",
    openalexShareFew: "слишком мало работ, чтобы указать долю",
    openalexShareIncomplete: "год не завершён",
    openalexTotalsDiffer:
      "За {years} таблица работ по годам насчитывает заметно иное число работ, чем работ со статусом здесь; оба числа получены разными запросами к OpenAlex.",
    openalexDomainsHeading: "Домены OpenAlex",
    openalexDomainsNote:
      "Работы по домену OpenAlex, к которому относится их основная тема, {from}–{to}: всего {total} работ; сумма строк может быть меньше, поскольку работа, которой OpenAlex не присвоил тему, не входит ни в одну строку. Открытая доля выше не скорректирована по этому составу: там, где две организации здесь различаются, их доли измеряют не одно и то же.",
    openalexColDomain: "Домен",
    openalexColYear: "Год",
    openalexColWorks: "Работы",
    openalexColTotal: "Итого",
    openalexColCountry: "Страна",
    openalexColOrganisation: "Организация",
    figuresHeading: "Цифры исследователей, которые решили быть учтёнными здесь",
    figuresBelowK:
      "Меньше {k} исследователей решили быть учтёнными здесь, поэтому цифры пока не показываются.",
    figuresContributors: "{count} исследователей решили быть учтёнными на этой странице.",
    figuresPending:
      "Ещё {pending} решили быть учтёнными, но их цифры пока не рассчитаны; они добавятся после следующего сохранения или еженедельной повторной синхронизации.",
    figuresTruncated: "Включены только первые {limit} исследователей, решивших быть учтёнными.",
    figuresScope:
      "Число работ, перечисленных в публичном CV каждого исследователя, в сумме: по годам и статусу открытого доступа, затем по разделам. Только числа; в каждой строке указан её собственный итог. Год, ячейка или раздел, в которые внесли вклад меньше {k} исследователей, не показываются, а если скрытое опиралось бы меньше чем на {k} исследователей, вместе с ним скрывается и следующее по величине наименьшее показанное число — как внутри строки, так и между двумя таблицами.",
    figuresNotCompared:
      "Это собственные цифры исследователей, сложенные вместе. Они не сравниваются с записью об организации в OpenAlex, и ни одно не вычитается из другого.",
    figuresByYearHeading: "Работы по годам и статусу открытого доступа",
    figuresByTypeHeading: "Работы по разделам",
    figuresSuppressed: "меньше {k} исследователей",
    figuresAllSuppressed:
      "Пока ни одна цифра не может быть показана: каждый год и каждый раздел либо охватывает меньше {k} исследователей, либо позволил бы вычислить цифру, касающуюся меньше {k} из них.",
    figuresYearUnknown: "Без года",
    figuresColYear: "Год",
    figuresColTotal: "Итого",
    figuresColSection: "Раздел",
    figuresColWorks: "Работы",
    reconciliationOne: "1 исследователь делится своими строками сверки:",
    reconciliationMany: "{count} исследователей делятся своими строками сверки:",
    reconciliationCsv: "скачать CSV",
    reconciliationJson: "JSON",
    aboutReconciliation:
      "Строки экспорта сверки указывают исследователя по его ORCID iD, потому что каждый из них сам решил ими поделиться.",
  },
};

/** Localized institution-page copy (falls back to English for unknown locales). */
export function institutionStrings(locale: string): InstitutionStrings {
  return INSTITUTIONS_I18N[asLocale(locale)];
}

/** Fill `{name}`-style placeholders; every occurrence of each key is replaced,
 *  and a placeholder with no value is left as-is. */
export function fillInstitutionString(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.split(`{${key}}`).join(String(value)),
    template,
  );
}
