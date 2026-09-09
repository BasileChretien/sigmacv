import { asLocale, type Locale } from "./index";

/**
 * Editor-workspace strings for the sync-report banner ("what changed in your
 * last sync"), the CV-health checklist, and the bulk-curation bar. Kept in
 * their own dictionary (typed Record<Locale, …> so a missing locale is a
 * compile error), like `editorUi.ts`. `{n}` placeholders are substituted with
 * `.replace("{n}", …)` at the call site.
 */
export interface WorkspaceUiStrings {
  // ── Sync-report banner ─────────────────────────────────────────────────────
  srLastSync: string;
  /** First-sync welcome; {n} = imported item count. */
  srInitial: string;
  srAdded: string;
  srRemoved: string;
  srReview: string;
  /** Title on the clickable review pill — jumps to the next item to review. */
  srReviewJump: string;
  /** "+{n} more" — overflow count when the additions list is summarized by section. */
  srMore: string;
  srDetails: string;
  srDismiss: string;
  srNoTitle: string;
  // ── CV-health checklist ────────────────────────────────────────────────────
  hpTitle: string;
  hpReview: string;
  hpDuplicates: string;
  hpConflicts: string;
  hpMisattributed: string;
  hpMisAllMine: string;
  hpRetracted: string;
  hpHint: string;
  /** Heading of the health panel when it carries only owner-only information. */
  hpInfoTitle: string;
  /** Owner-only self-referencing notice; "{pct}" and "{n}" substituted. */
  hpSelfRef: string;
  /** Announced (politely) after a checklist jump so the walk is perceptible
   *  without sight. {n} / {total} = position in the category; {title} = the row. */
  hpWalkPosition: string;
  /** Evidence references in prose whose entry is hidden / gone ({n}). */
  hpEvidence: string;
  /** Narrative modules written without one linked evidence entry ({n}). */
  hpNarrative: string;
  // ── Per-item review confirmation ───────────────────────────────────────────
  /** Row button: record that the user checked this work and it is theirs. */
  reviewConfirm: string;
  /** Row button in the confirmed state (click again to undo). */
  reviewConfirmed: string;
  /** Tooltip explaining what confirming does — and does not — change. */
  reviewConfirmHint: string;
  // ── Bulk-curation bar ──────────────────────────────────────────────────────
  bulkSelect: string;
  bulkDone: string;
  bulkFilterText: string;
  bulkYearFrom: string;
  bulkYearTo: string;
  bulkFlaggedOnly: string;
  bulkSelectAll: string;
  bulkClear: string;
  bulkSelected: string;
  bulkHide: string;
  bulkShow: string;
  bulkNotMine: string;
  bulkExcludeView: string;
  bulkNoMatches: string;
  /** Aria prefix for a row's selection checkbox ("Select: <title>"). */
  bulkSelectRow: string;
  // ── Re-sync digest email (account toggle) ──────────────────────────────────
  dgLabel: string;
  dgHint: string;
  dgFailed: string;
  // ── Contact email for digests (field shown only while the toggle is ON) ────
  dgEmailLabel: string;
  dgEmailSave: string;
  dgEmailPending: string;
  dgEmailVerified: string;
  dgEmailNone: string;
  /** Fallback notice; {e} = the account's login email. */
  dgEmailUsing: string;
  dgEmailFailed: string;
  // ── Restructured top bar: Publish menu trigger ─────────────────────────────
  tbPublish: string;
  tbPublished: string;
  tbShare: string;
  // ── Owner worklist: affiliations & open access (editor-only) ─────────────
  /** Collapsible panel title. */
  wlTitle: string;
  /** Owner-only framing: help, not a verdict; never on the CV or public page. */
  wlIntro: string;
  /** Group (a): current positions without a ROR record; {n} of {total}. */
  wlPositionsHeading: string;
  wlPositionsHelp: string;
  /** Group (b): works whose printed affiliation lacks a consented id; {n} of {total}. */
  wlGapsHeading: string;
  wlGapsHelp: string;
  /** Sub-group label: the ROR the works DO carry; {ror}, {n}. */
  wlGapsGroup: string;
  /** OpenAlex works with EMPTY affiliation data (no institution on the owner's
   *  authorship, or none with a ROR id — missing data, not a missing affiliation). */
  wlNoAffiliationHeading: string;
  wlNoAffiliationHelp: string;
  /** One line under that bucket: works in the period from OTHER sources, which
   *  never carry affiliation data and are not checked; {n}. Counts only. */
  wlNotCheckedNote: string;
  /** Group (c): countable works with no open copy found; {n} of {total}. */
  wlClosedHeading: string;
  /** Help under the closed works — a deposit MAY be possible; never a verdict. */
  wlClosedHelp: string;
  /** Lead-in to the four-state counts; {total} = countable works. */
  wlOaSummary: string;
  wlStateOpenCc: string;
  wlStateOpenOther: string;
  wlStateClosed: string;
  wlStateUnknown: string;
  /** Open Policy Finder link text (journal policy by name). */
  wlPolicyLink: string;
  /** Funder NAMES printed on the work, as context only; {names}. */
  wlFunders: string;
  /** Title on a row's jump button. */
  wlJump: string;
  // ── Owner worklist: your grants and their open-access policies ───────────
  /** Section heading — no count: never a number of works "needing action". */
  wlFundingHeading: string;
  /** Facts side by side, no verdict; the judgement is the owner's. */
  wlFundingHelp: string;
  /** Award-number match: "acknowledges award {award} from {funder}". */
  wlFundingAward: string;
  /** Funder-id match (weaker): the work names the funder, no award number; {funder}. */
  wlFundingFunderOnly: string;
  /** The recorded policy sentence for a maintainer-confirmed entry; {funder},
   *  {date} (lastVerified), {statements}. */
  wlFundingPolicy: string;
  /** The same sentence for an entry still awaiting live confirmation — no
   *  date exists, and it must never say "as recorded on"; {funder}, {statements}. */
  wlFundingPolicyPending: string;
  /** Link text to the policy on the funder's own domain. */
  wlFundingPolicyLink: string;
  /** No row in the policy table; {funder}. */
  wlFundingNoPolicy: string;
  /** What SigmaCV found, from stored fields; {state} = the four-state label. */
  wlFundingFound: string;
  /** Fallback when neither the grant, the work nor the crosswalk names the funder. */
  wlFundingUnnamedFunder: string;
}

const WORKSPACE_UI: Record<Locale, WorkspaceUiStrings> = {
  "en-US": {
    hpMisAllMine: "They're all mine",
    srLastSync: "Last sync",
    srInitial:
      "Imported {n} entries from the open record. Your CV is ready — reviewing the flagged ones below is optional.",
    srAdded: "{n} new",
    srRemoved: "{n} no longer in the sources",
    srReview: "{n} to review",
    srReviewJump: "Jump to the next item to review",
    srMore: "+{n} more",
    srDetails: "Show what’s new",
    srDismiss: "Dismiss",
    srNoTitle: "(untitled)",
    hpTitle: "Needs your attention",
    hpReview: "{n} review candidates waiting for a decision",
    hpDuplicates: "{n} possible duplicates to resolve",
    hpConflicts: "{n} works listing a different ORCID iD",
    hpMisattributed: "{n} works that may not be yours to review",
    hpRetracted: "{n} retracted works still shown",
    hpHint: "Select one to jump to it; select again for the next.",
    hpWalkPosition: "{n} of {total}: {title}",
    hpEvidence: "{n} evidence references in your narrative no longer point to a shown entry",
    hpNarrative: "{n} narrative modules have no linked evidence",
    reviewConfirm: "Confirm",
    reviewConfirmed: "Confirmed",
    reviewConfirmHint:
      "Record that you've checked this work is yours. Changes nothing about your CV — it only marks the work as reviewed.",
    bulkSelect: "Select multiple",
    bulkDone: "Done",
    bulkFilterText: "Filter by title or venue…",
    bulkYearFrom: "From year",
    bulkYearTo: "To year",
    bulkFlaggedOnly: "Flagged only",
    bulkSelectAll: "Select all shown ({n})",
    bulkClear: "Clear",
    bulkSelected: "{n} selected",
    bulkHide: "Hide",
    bulkShow: "Show",
    bulkNotMine: "Mark not mine",
    bulkExcludeView: "Hide from this view",
    bulkNoMatches: "No entries match the filter.",
    bulkSelectRow: "Select",
    dgLabel: "Email updates",
    dgHint:
      "Email me when a re-sync changes my CV — at most one a month, only when something changed. Unsubscribe anytime.",
    dgFailed: "Could not update the email preference — please try again.",
    dgEmailLabel: "Send digests to",
    dgEmailSave: "Confirm address",
    dgEmailPending: "Confirmation sent — check that inbox and click the link.",
    dgEmailVerified: "Confirmed",
    dgEmailNone: "Add an email address to receive digests.",
    dgEmailUsing: "Digests will go to your account email ({e}).",
    dgEmailFailed: "Could not save the address — please try again.",
    tbPublish: "Publish",
    tbPublished: "Published",
    tbShare: "Share",
    wlTitle: "Affiliations & open access",
    wlIntro:
      "For you only — help with the record, not a verdict. Nothing here appears on your CV or your public page.",
    wlPositionsHeading: "Current positions without an institution record ({n} of {total})",
    wlPositionsHelp:
      "The ROR record was not resolved. Add the organisation on ORCID, or pick it in the editor, so the position links to its institution.",
    wlGapsHeading: "Works whose printed affiliation lacks your institution ({n} of {total})",
    wlGapsHelp:
      "Dated during a position you are listed under, but the affiliation on the paper — as OpenAlex indexes it — names another organisation. Often the paper printed a different unit, or the affiliation was not captured; nothing here is wrong by itself.",
    wlGapsGroup: "Affiliation on the paper: ROR {ror} — {n}",
    wlNoAffiliationHeading: "Works with no affiliation data ({n} of {total})",
    wlNoAffiliationHelp:
      "OpenAlex recorded no institution — or none with a ROR id — on your authorship of these works. That is missing data, not a missing affiliation.",
    wlNotCheckedNote:
      "{n} further works in this period come from other sources (datasets, conference papers, claimed DOIs) and are not checked here.",
    wlClosedHeading: "Works with no open copy found ({n} of {total})",
    wlClosedHelp:
      "No open copy was found by OpenAlex; a repository deposit may be possible — check the journal's policy.",
    wlOaSummary: "Open-access status of your {total} countable works:",
    wlStateOpenCc: "Open, Creative Commons licence",
    wlStateOpenOther: "Open, other or unknown licence",
    wlStateClosed: "No open copy found",
    wlStateUnknown: "Not determined",
    wlPolicyLink: "Check the journal's policy (Open Policy Finder)",
    wlFunders: "Funders named on the work: {names}",
    wlJump: "Jump to this entry",
    wlFundingHeading: "Your grants and their open-access policies",
    wlFundingHelp:
      "Works that acknowledge one of your own grants, beside what that funder's policy says and what SigmaCV found. Facts side by side, no verdict: whether a policy applies to a given work is for you to judge.",
    wlFundingAward: "acknowledges award {award} from {funder}",
    wlFundingFunderOnly: "names your funder {funder}; no award number on the work",
    wlFundingPolicy: "{funder}'s open-access policy, as recorded on {date}: {statements}",
    wlFundingPolicyPending:
      "{funder}'s open-access policy, drafted from memory and not yet confirmed against the funder's site: {statements}",
    wlFundingPolicyLink: "policy page",
    wlFundingNoPolicy: "SigmaCV has no policy record for {funder}.",
    wlFundingFound: "SigmaCV found: {state}",
    wlFundingUnnamedFunder: "a funder",
    hpInfoTitle: "For your eyes only",
    hpSelfRef:
      "About {pct} of the references in your papers point to your own work (n = {n}). Some panels look at this; nothing on your CV shows it.",
  },
  "zh-CN": {
    hpMisAllMine: "都是我的",
    srLastSync: "上次同步",
    srInitial: "已从公开记录导入 {n} 条条目。您的简历已就绪——下方带标记的条目可按需查看。",
    srAdded: "新增 {n} 条",
    srRemoved: "{n} 条已不在数据源中",
    srReview: "{n} 条待审核",
    srReviewJump: "跳转到下一个待审核项",
    srMore: "另有 {n} 条",
    srDetails: "查看新增内容",
    srDismiss: "关闭",
    srNoTitle: "（无标题）",
    hpTitle: "需要您处理",
    hpReview: "{n} 条候选条目等待确认",
    hpDuplicates: "{n} 条疑似重复待处理",
    hpConflicts: "{n} 条作品标注了不同的 ORCID iD",
    hpMisattributed: "{n} 条可能不属于您的作品待核查",
    hpRetracted: "{n} 条已撤稿的作品仍在显示",
    hpHint: "选择一项跳转；再次选择跳转到下一项。",
    hpWalkPosition: "第 {n} / {total} 项：{title}",
    hpEvidence: "叙述中有 {n} 个证据引用不再指向显示的条目",
    hpNarrative: "{n} 个叙述模块没有链接任何证据",
    reviewConfirm: "确认",
    reviewConfirmed: "已确认",
    reviewConfirmHint: "记录你已核对这项成果确属本人。不会改变简历内容，仅标记为已核对。",
    bulkSelect: "批量选择",
    bulkDone: "完成",
    bulkFilterText: "按标题或期刊筛选…",
    bulkYearFrom: "起始年份",
    bulkYearTo: "截止年份",
    bulkFlaggedOnly: "仅带标记的",
    bulkSelectAll: "全选当前显示（{n}）",
    bulkClear: "清除",
    bulkSelected: "已选 {n} 条",
    bulkHide: "隐藏",
    bulkShow: "显示",
    bulkNotMine: "标记为“不是我的”",
    bulkExcludeView: "从此视图中隐藏",
    bulkNoMatches: "没有符合筛选条件的条目。",
    bulkSelectRow: "选择",
    dgLabel: "邮件通知",
    dgHint: "当重新同步更改我的简历时发邮件通知;每月最多一封,仅在有变化时发送,可随时退订。",
    dgFailed: "无法更新邮件设置——请重试。",
    dgEmailLabel: "摘要发送至",
    dgEmailSave: "确认地址",
    dgEmailPending: "确认邮件已发送——请到该邮箱点击链接。",
    dgEmailVerified: "已确认",
    dgEmailNone: "请添加邮箱地址以接收摘要。",
    dgEmailUsing: "摘要将发送到您的账户邮箱({e})。",
    dgEmailFailed: "无法保存地址——请重试。",
    tbPublish: "发布",
    tbPublished: "已发布",
    tbShare: "分享",
    wlTitle: "机构隶属与开放获取",
    wlIntro:
      "仅供您本人查看——这是对您记录的帮助，不是评判。这里的内容不会出现在您的简历或公开页面上。",
    wlPositionsHeading: "没有机构记录的当前职位（{total} 个中的 {n} 个）",
    wlPositionsHelp:
      "未能解析 ROR 记录。请在 ORCID 上添加该组织，或在编辑器中选择它，使该职位关联到其机构。",
    wlGapsHeading: "印刷署名机构中不含您所在机构的作品（{total} 篇中的 {n} 篇）",
    wlGapsHelp:
      "这些作品的日期落在您被列入的职位期间，但论文上的署名机构（按 OpenAlex 的索引）是另一个组织。通常是论文印了不同的单位，或署名机构未被采集；这本身并不是错误。",
    wlGapsGroup: "论文上的署名机构：ROR {ror} — {n}",
    wlNoAffiliationHeading: "没有署名机构数据的作品（{total} 篇中的 {n} 篇）",
    wlNoAffiliationHelp:
      "OpenAlex 没有为您在这些作品中的署名记录任何机构，或记录的机构没有 ROR 标识。这是数据缺失，不是署名机构缺失。",
    wlNotCheckedNote:
      "此期间另有 {n} 篇作品来自其他来源（数据集、会议论文、认领的 DOI），此处不做检查。",
    wlClosedHeading: "未找到开放副本的作品（{total} 篇中的 {n} 篇）",
    wlClosedHelp: "OpenAlex 未找到开放副本；也许可以在知识库中存缴——请查看该期刊的政策。",
    wlOaSummary: "您 {total} 篇计入统计的作品的开放获取状态：",
    wlStateOpenCc: "开放，知识共享（CC）许可",
    wlStateOpenOther: "开放，其他或未知许可",
    wlStateClosed: "未找到开放副本",
    wlStateUnknown: "未确定",
    wlPolicyLink: "查看期刊政策（Open Policy Finder）",
    wlFunders: "作品上列出的资助方：{names}",
    wlJump: "跳转到此条目",
    wlFundingHeading: "您的资助项目及其开放获取政策",
    wlFundingHelp:
      "致谢您本人资助项目的研究成果，与该资助方政策的表述及 SigmaCV 的发现并列呈现。仅列事实，不作结论：某项政策是否适用于某篇成果，由您自行判断。",
    wlFundingAward: "致谢来自 {funder} 的资助编号 {award}",
    wlFundingFunderOnly: "提及您的资助方 {funder}；成果上未注明资助编号",
    wlFundingPolicy: "{funder} 的开放获取政策（记录日期 {date}）：{statements}",
    wlFundingPolicyPending:
      "{funder} 的开放获取政策（凭记忆草拟，尚未与资助方网站核对）：{statements}",
    wlFundingPolicyLink: "政策页面",
    wlFundingNoPolicy: "SigmaCV 没有 {funder} 的政策记录。",
    wlFundingFound: "SigmaCV 的发现：{state}",
    wlFundingUnnamedFunder: "某资助方",
    hpInfoTitle: "仅供您本人查看",
    hpSelfRef:
      "您论文中约 {pct} 的参考文献指向您自己的作品（n = {n}）。部分评审会关注这一点；您的简历中不会显示它。",
  },
  "es-ES": {
    hpMisAllMine: "Todos son míos",
    srLastSync: "Última sincronización",
    srInitial:
      "Se importaron {n} entradas del registro abierto. Tu CV ya está listo: revisar las marcadas abajo es opcional.",
    srAdded: "{n} nuevas",
    srRemoved: "{n} ya no están en las fuentes",
    srReview: "{n} por revisar",
    srReviewJump: "Ir al siguiente elemento por revisar",
    srMore: "+{n} más",
    srDetails: "Ver novedades",
    srDismiss: "Descartar",
    srNoTitle: "(sin título)",
    hpTitle: "Requiere su atención",
    hpReview: "{n} entradas candidatas esperan una decisión",
    hpDuplicates: "{n} posibles duplicados por resolver",
    hpConflicts: "{n} trabajos con un ORCID iD distinto",
    hpMisattributed: "{n} trabajos que podrían no ser tuyos por revisar",
    hpRetracted: "{n} trabajos retractados aún visibles",
    hpHint: "Selecciona uno para ir a él; vuelve a seleccionarlo para el siguiente.",
    hpWalkPosition: "{n} de {total}: {title}",
    hpEvidence: "{n} referencias de evidencia en tu narrativa ya no apuntan a una entrada mostrada",
    hpNarrative: "{n} módulos narrativos no tienen evidencia enlazada",
    reviewConfirm: "Confirmar",
    reviewConfirmed: "Confirmado",
    reviewConfirmHint:
      "Deja constancia de que has comprobado que este trabajo es tuyo. No cambia nada en tu CV: solo lo marca como revisado.",
    bulkSelect: "Selección múltiple",
    bulkDone: "Hecho",
    bulkFilterText: "Filtrar por título o revista…",
    bulkYearFrom: "Desde el año",
    bulkYearTo: "Hasta el año",
    bulkFlaggedOnly: "Solo marcadas",
    bulkSelectAll: "Seleccionar todo lo mostrado ({n})",
    bulkClear: "Limpiar",
    bulkSelected: "{n} seleccionadas",
    bulkHide: "Ocultar",
    bulkShow: "Mostrar",
    bulkNotMine: "Marcar como «no es mío»",
    bulkExcludeView: "Ocultar de esta vista",
    bulkNoMatches: "Ninguna entrada coincide con el filtro.",
    bulkSelectRow: "Seleccionar",
    dgLabel: "Avisos por correo",
    dgHint:
      "Recibir un correo cuando una sincronización cambie mi CV: como máximo uno al mes y solo si hay cambios. Baja en cualquier momento.",
    dgFailed: "No se pudo actualizar la preferencia de correo; inténtelo de nuevo.",
    dgEmailLabel: "Enviar resúmenes a",
    dgEmailSave: "Confirmar dirección",
    dgEmailPending: "Confirmación enviada: revise esa bandeja y haga clic en el enlace.",
    dgEmailVerified: "Confirmada",
    dgEmailNone: "Añada un correo para recibir los resúmenes.",
    dgEmailUsing: "Los resúmenes irán a su correo de cuenta ({e}).",
    dgEmailFailed: "No se pudo guardar la dirección; inténtelo de nuevo.",
    tbPublish: "Publicar",
    tbPublished: "Publicado",
    tbShare: "Compartir",
    wlTitle: "Afiliaciones y acceso abierto",
    wlIntro:
      "Solo para ti: una ayuda para tu registro, no un veredicto. Nada de esto aparece en tu CV ni en tu página pública.",
    wlPositionsHeading: "Puestos actuales sin registro de institución ({n} de {total})",
    wlPositionsHelp:
      "No se resolvió el registro ROR. Añade la organización en ORCID, o elígela en el editor, para que el puesto quede enlazado con su institución.",
    wlGapsHeading: "Trabajos cuya afiliación impresa no incluye tu institución ({n} de {total})",
    wlGapsHelp:
      "Fechados durante un puesto bajo el que apareces listado, pero la afiliación en el artículo, tal como la indexa OpenAlex, nombra otra organización. A menudo el artículo imprimió otra unidad, o la afiliación no se recogió; nada de esto es un error por sí mismo.",
    wlGapsGroup: "Afiliación en el artículo: ROR {ror} — {n}",
    wlNoAffiliationHeading: "Trabajos sin datos de afiliación ({n} de {total})",
    wlNoAffiliationHelp:
      "OpenAlex no registró ninguna institución —o ninguna con identificador ROR— en tu autoría de estos trabajos. Es un dato ausente, no una afiliación ausente.",
    wlNotCheckedNote:
      "Otros {n} trabajos de este periodo proceden de otras fuentes (conjuntos de datos, artículos de congreso, DOI reclamados) y no se comprueban aquí.",
    wlClosedHeading: "Trabajos sin copia abierta encontrada ({n} de {total})",
    wlClosedHelp:
      "OpenAlex no encontró ninguna copia abierta; quizá sea posible un depósito en repositorio: consulta la política de la revista.",
    wlOaSummary: "Estado de acceso abierto de tus {total} trabajos contabilizados:",
    wlStateOpenCc: "Abierto, licencia Creative Commons",
    wlStateOpenOther: "Abierto, otra licencia o licencia desconocida",
    wlStateClosed: "No se encontró copia abierta",
    wlStateUnknown: "Sin determinar",
    wlPolicyLink: "Consultar la política de la revista (Open Policy Finder)",
    wlFunders: "Financiadores nombrados en el trabajo: {names}",
    wlJump: "Ir a esta entrada",
    wlFundingHeading: "Tus ayudas y sus políticas de acceso abierto",
    wlFundingHelp:
      "Trabajos que reconocen una de tus propias ayudas, junto a lo que dice la política de ese financiador y lo que SigmaCV encontró. Solo hechos, sin veredicto: si una política se aplica a un trabajo concreto es algo que te corresponde juzgar a ti.",
    wlFundingAward: "reconoce la ayuda {award} de {funder}",
    wlFundingFunderOnly: "menciona a tu financiador {funder}; sin número de ayuda en el trabajo",
    wlFundingPolicy: "Política de acceso abierto de {funder}, registrada el {date}: {statements}",
    wlFundingPolicyPending:
      "Política de acceso abierto de {funder}, redactada de memoria y aún no contrastada con el sitio del financiador: {statements}",
    wlFundingPolicyLink: "página de la política",
    wlFundingNoPolicy: "SigmaCV no tiene registro de política para {funder}.",
    wlFundingFound: "SigmaCV encontró: {state}",
    wlFundingUnnamedFunder: "un financiador",
    hpInfoTitle: "Solo para ti",
    hpSelfRef:
      "Alrededor del {pct} de las referencias de tus artículos remiten a tu propio trabajo (n = {n}). Algunos comités se fijan en esto; nada en tu CV lo muestra.",
  },
  "fr-FR": {
    hpMisAllMine: "Tous sont à moi",
    srLastSync: "Dernière synchronisation",
    srInitial:
      "{n} entrées importées depuis les sources ouvertes. Votre CV est prêt — vérifier les éléments signalés ci-dessous est facultatif.",
    srAdded: "{n} nouvelles",
    srRemoved: "{n} absentes des sources",
    srReview: "{n} à vérifier",
    srReviewJump: "Aller au prochain élément à vérifier",
    srMore: "+{n} de plus",
    srDetails: "Voir les nouveautés",
    srDismiss: "Fermer",
    srNoTitle: "(sans titre)",
    hpTitle: "À traiter",
    hpReview: "{n} entrées candidates en attente de décision",
    hpDuplicates: "{n} doublons possibles à résoudre",
    hpConflicts: "{n} travaux portant un ORCID iD différent",
    hpMisattributed: "{n} travaux qui ne sont peut-être pas les vôtres à vérifier",
    hpRetracted: "{n} travaux rétractés encore affichés",
    hpHint: "Sélectionnez-en un pour y accéder ; sélectionnez à nouveau pour le suivant.",
    hpWalkPosition: "{n} sur {total} : {title}",
    hpEvidence:
      "{n} références de preuve dans votre récit ne pointent plus vers une entrée affichée",
    hpNarrative: "{n} modules narratifs n’ont aucune preuve liée",
    reviewConfirm: "Confirmer",
    reviewConfirmed: "Confirmé",
    reviewConfirmHint:
      "Indiquez que vous avez vérifié que ce travail est bien le vôtre. Ne modifie en rien votre CV : le travail est simplement marqué comme vérifié.",
    bulkSelect: "Sélection multiple",
    bulkDone: "Terminé",
    bulkFilterText: "Filtrer par titre ou revue…",
    bulkYearFrom: "Depuis l’année",
    bulkYearTo: "Jusqu’à l’année",
    bulkFlaggedOnly: "Signalées uniquement",
    bulkSelectAll: "Tout sélectionner ({n})",
    bulkClear: "Effacer",
    bulkSelected: "{n} sélectionnées",
    bulkHide: "Masquer",
    bulkShow: "Afficher",
    bulkNotMine: "Marquer « pas de moi »",
    bulkExcludeView: "Masquer de cette vue",
    bulkNoMatches: "Aucune entrée ne correspond au filtre.",
    bulkSelectRow: "Sélectionner",
    dgLabel: "Alertes e-mail",
    dgHint:
      "Recevoir un e-mail quand une synchronisation modifie mon CV — au plus un par mois, seulement en cas de changement. Désinscription à tout moment.",
    dgFailed: "Impossible de mettre à jour la préférence e-mail — réessayez.",
    dgEmailLabel: "Envoyer les synthèses à",
    dgEmailSave: "Confirmer l’adresse",
    dgEmailPending: "Confirmation envoyée — ouvrez cette boîte et cliquez sur le lien.",
    dgEmailVerified: "Confirmée",
    dgEmailNone: "Ajoutez une adresse e-mail pour recevoir les synthèses.",
    dgEmailUsing: "Les synthèses iront à l’adresse de votre compte ({e}).",
    dgEmailFailed: "Impossible d’enregistrer l’adresse — réessayez.",
    tbPublish: "Publier",
    tbPublished: "Publié",
    tbShare: "Partager",
    wlTitle: "Affiliations et accès ouvert",
    wlIntro:
      "Pour vous seulement — une aide pour votre dossier, pas un verdict. Rien de ceci n’apparaît sur votre CV ni sur votre page publique.",
    wlPositionsHeading: "Postes actuels sans fiche d’institution ({n} sur {total})",
    wlPositionsHelp:
      "La fiche ROR n’a pas été résolue. Ajoutez l’organisation sur ORCID, ou choisissez-la dans l’éditeur, pour que le poste soit relié à son institution.",
    wlGapsHeading:
      "Travaux dont l’affiliation imprimée ne mentionne pas votre institution ({n} sur {total})",
    wlGapsHelp:
      "Datés pendant un poste sous lequel vous êtes listé·e, mais l’affiliation sur l’article — telle qu’OpenAlex l’indexe — nomme une autre organisation. Souvent l’article a imprimé une autre unité, ou l’affiliation n’a pas été relevée ; rien ici n’est faux en soi.",
    wlGapsGroup: "Affiliation sur l’article : ROR {ror} — {n}",
    wlNoAffiliationHeading: "Travaux sans donnée d’affiliation ({n} sur {total})",
    wlNoAffiliationHelp:
      "OpenAlex n’a relevé aucune institution — ou aucune dotée d’un identifiant ROR — sur votre signature de ces travaux. C’est une donnée manquante, pas une affiliation manquante.",
    wlNotCheckedNote:
      "{n} autres travaux de cette période proviennent d’autres sources (jeux de données, communications de conférence, DOI revendiqués) et ne sont pas vérifiés ici.",
    wlClosedHeading: "Travaux sans copie ouverte trouvée ({n} sur {total})",
    wlClosedHelp:
      "OpenAlex n’a trouvé aucune copie ouverte ; un dépôt en archive ouverte est peut-être possible — consultez la politique de la revue.",
    wlOaSummary: "Statut d’accès ouvert de vos {total} travaux comptabilisés :",
    wlStateOpenCc: "Ouvert, licence Creative Commons",
    wlStateOpenOther: "Ouvert, autre licence ou licence inconnue",
    wlStateClosed: "Aucune copie ouverte trouvée",
    wlStateUnknown: "Non déterminé",
    wlPolicyLink: "Consulter la politique de la revue (Open Policy Finder)",
    wlFunders: "Financeurs nommés sur le travail : {names}",
    wlJump: "Aller à cette entrée",
    wlFundingHeading: "Vos financements et leurs politiques d'accès ouvert",
    wlFundingHelp:
      "Travaux qui mentionnent l'un de vos propres financements, présentés à côté de ce que dit la politique de ce financeur et de ce que SigmaCV a trouvé. Des faits, sans verdict : c'est à vous de juger si une politique s'applique à un travail donné.",
    wlFundingAward: "mentionne la subvention {award} de {funder}",
    wlFundingFunderOnly:
      "cite votre financeur {funder} ; aucun numéro de subvention sur le travail",
    wlFundingPolicy:
      "Politique d'accès ouvert de {funder}, telle qu'enregistrée le {date} : {statements}",
    wlFundingPolicyPending:
      "Politique d'accès ouvert de {funder}, rédigée de mémoire et pas encore vérifiée sur le site du financeur : {statements}",
    wlFundingPolicyLink: "page de la politique",
    wlFundingNoPolicy: "SigmaCV n'a pas d'enregistrement de politique pour {funder}.",
    wlFundingFound: "SigmaCV a trouvé : {state}",
    wlFundingUnnamedFunder: "un financeur",
    hpInfoTitle: "Pour vous seulement",
    hpSelfRef:
      "Environ {pct} des références de vos articles renvoient à vos propres travaux (n = {n}). Certains comités y prêtent attention ; rien sur votre CV ne l'affiche.",
  },
  "de-DE": {
    hpMisAllMine: "Alle gehören mir",
    srLastSync: "Letzte Synchronisierung",
    srInitial:
      "{n} Einträge aus den offenen Quellen importiert. Ihr Lebenslauf ist fertig — das Prüfen der markierten Einträge unten ist optional.",
    srAdded: "{n} neu",
    srRemoved: "{n} nicht mehr in den Quellen",
    srReview: "{n} zu prüfen",
    srReviewJump: "Zum nächsten zu prüfenden Eintrag springen",
    srMore: "+{n} weitere",
    srDetails: "Neues anzeigen",
    srDismiss: "Schließen",
    srNoTitle: "(ohne Titel)",
    hpTitle: "Erfordert Ihre Aufmerksamkeit",
    hpReview: "{n} Kandidaten warten auf eine Entscheidung",
    hpDuplicates: "{n} mögliche Duplikate zu klären",
    hpConflicts: "{n} Arbeiten mit einer anderen ORCID iD",
    hpMisattributed: "{n} Arbeiten, die möglicherweise nicht von Ihnen sind",
    hpRetracted: "{n} zurückgezogene Arbeiten noch sichtbar",
    hpHint: "Wählen Sie einen aus, um dorthin zu springen; erneut auswählen für den nächsten.",
    hpWalkPosition: "{n} von {total}: {title}",
    hpEvidence:
      "{n} Belegverweise in deinem Narrativ zeigen nicht mehr auf einen angezeigten Eintrag",
    hpNarrative: "{n} narrative Module haben keinen verknüpften Beleg",
    reviewConfirm: "Bestätigen",
    reviewConfirmed: "Bestätigt",
    reviewConfirmHint:
      "Halten Sie fest, dass Sie diese Arbeit als Ihre eigene geprüft haben. Ändert nichts an Ihrem Lebenslauf — die Arbeit wird lediglich als geprüft markiert.",
    bulkSelect: "Mehrfachauswahl",
    bulkDone: "Fertig",
    bulkFilterText: "Nach Titel oder Zeitschrift filtern…",
    bulkYearFrom: "Ab Jahr",
    bulkYearTo: "Bis Jahr",
    bulkFlaggedOnly: "Nur markierte",
    bulkSelectAll: "Alle angezeigten auswählen ({n})",
    bulkClear: "Auswahl aufheben",
    bulkSelected: "{n} ausgewählt",
    bulkHide: "Ausblenden",
    bulkShow: "Anzeigen",
    bulkNotMine: "Als „nicht von mir“ markieren",
    bulkExcludeView: "In dieser Ansicht ausblenden",
    bulkNoMatches: "Keine Einträge entsprechen dem Filter.",
    bulkSelectRow: "Auswählen",
    dgLabel: "E-Mail-Updates",
    dgHint:
      "E-Mail erhalten, wenn eine Synchronisierung den CV ändert — höchstens eine pro Monat, nur bei Änderungen. Jederzeit abbestellbar.",
    dgFailed: "E-Mail-Einstellung konnte nicht gespeichert werden — bitte erneut versuchen.",
    dgEmailLabel: "Digests senden an",
    dgEmailSave: "Adresse bestätigen",
    dgEmailPending: "Bestätigung gesendet — Postfach öffnen und Link anklicken.",
    dgEmailVerified: "Bestätigt",
    dgEmailNone: "Fügen Sie eine E-Mail-Adresse hinzu, um Digests zu erhalten.",
    dgEmailUsing: "Digests gehen an Ihre Konto-E-Mail ({e}).",
    dgEmailFailed: "Adresse konnte nicht gespeichert werden — bitte erneut versuchen.",
    tbPublish: "Veröffentlichen",
    tbPublished: "Veröffentlicht",
    tbShare: "Teilen",
    wlTitle: "Affiliationen & Open Access",
    wlIntro:
      "Nur für Sie — eine Hilfe für Ihren Datensatz, kein Urteil. Nichts davon erscheint in Ihrem Lebenslauf oder auf Ihrer öffentlichen Seite.",
    wlPositionsHeading: "Aktuelle Positionen ohne Institutionsdatensatz ({n} von {total})",
    wlPositionsHelp:
      "Der ROR-Datensatz wurde nicht aufgelöst. Ergänzen Sie die Organisation auf ORCID oder wählen Sie sie im Editor, damit die Position mit ihrer Institution verknüpft ist.",
    wlGapsHeading:
      "Arbeiten, deren gedruckte Affiliation Ihre Institution nicht nennt ({n} von {total})",
    wlGapsHelp:
      "Datiert während einer Position, unter der Sie gelistet sind, aber die Affiliation auf der Arbeit — wie OpenAlex sie indexiert — nennt eine andere Organisation. Oft stand auf der Arbeit eine andere Einheit, oder die Affiliation wurde nicht erfasst; nichts hiervon ist für sich genommen falsch.",
    wlGapsGroup: "Affiliation auf der Arbeit: ROR {ror} — {n}",
    wlNoAffiliationHeading: "Arbeiten ohne Affiliationsdaten ({n} von {total})",
    wlNoAffiliationHelp:
      "OpenAlex hat zu Ihrer Autorschaft dieser Arbeiten keine Institution erfasst — oder keine mit ROR-Kennung. Das sind fehlende Daten, keine fehlende Affiliation.",
    wlNotCheckedNote:
      "{n} weitere Arbeiten aus diesem Zeitraum stammen aus anderen Quellen (Datensätze, Konferenzbeiträge, beanspruchte DOIs) und werden hier nicht geprüft.",
    wlClosedHeading: "Arbeiten ohne gefundene offene Kopie ({n} von {total})",
    wlClosedHelp:
      "OpenAlex hat keine offene Kopie gefunden; eine Ablage in einem Repositorium ist womöglich möglich — prüfen Sie die Richtlinie der Zeitschrift.",
    wlOaSummary: "Open-Access-Status Ihrer {total} zählbaren Arbeiten:",
    wlStateOpenCc: "Offen, Creative-Commons-Lizenz",
    wlStateOpenOther: "Offen, andere oder unbekannte Lizenz",
    wlStateClosed: "Keine offene Kopie gefunden",
    wlStateUnknown: "Nicht bestimmt",
    wlPolicyLink: "Richtlinie der Zeitschrift prüfen (Open Policy Finder)",
    wlFunders: "Auf der Arbeit genannte Förderer: {names}",
    wlJump: "Zu diesem Eintrag springen",
    wlFundingHeading: "Ihre Förderungen und deren Open-Access-Richtlinien",
    wlFundingHelp:
      "Arbeiten, die eine Ihrer eigenen Förderungen nennen, neben dem, was die Richtlinie des Förderers sagt, und dem, was SigmaCV gefunden hat. Nur Fakten, kein Urteil: ob eine Richtlinie auf eine bestimmte Arbeit zutrifft, beurteilen Sie selbst.",
    wlFundingAward: "nennt die Förderung {award} von {funder}",
    wlFundingFunderOnly: "nennt Ihren Förderer {funder}; keine Fördernummer auf der Arbeit",
    wlFundingPolicy: "Open-Access-Richtlinie von {funder}, Stand {date}: {statements}",
    wlFundingPolicyPending:
      "Open-Access-Richtlinie von {funder}, aus dem Gedächtnis verfasst und noch nicht mit der Website des Förderers abgeglichen: {statements}",
    wlFundingPolicyLink: "Seite der Richtlinie",
    wlFundingNoPolicy: "SigmaCV hat keinen Richtlinien-Eintrag für {funder}.",
    wlFundingFound: "SigmaCV hat gefunden: {state}",
    wlFundingUnnamedFunder: "ein Förderer",
    hpInfoTitle: "Nur für Sie",
    hpSelfRef:
      "Etwa {pct} der Literaturangaben in Ihren Arbeiten verweisen auf Ihre eigenen Arbeiten (n = {n}). Manche Gutachtergremien achten darauf; in Ihrem Lebenslauf erscheint es nirgends.",
  },
  "ja-JP": {
    hpMisAllMine: "すべて自分のものです",
    srLastSync: "前回の同期",
    srInitial:
      "公開データから {n} 件を取り込みました。CV はすでに利用可能です。下のフラグ付き項目の確認は任意です。",
    srAdded: "新規 {n} 件",
    srRemoved: "{n} 件がソースから消失",
    srReview: "要確認 {n} 件",
    srReviewJump: "次の要確認項目へ移動",
    srMore: "他 {n} 件",
    srDetails: "新着を表示",
    srDismiss: "閉じる",
    srNoTitle: "（無題）",
    hpTitle: "要対応",
    hpReview: "確認待ちの候補が {n} 件",
    hpDuplicates: "重複の可能性が {n} 件",
    hpConflicts: "別の ORCID iD が記載された業績が {n} 件",
    hpMisattributed: "あなたのものでない可能性がある業績が {n} 件",
    hpRetracted: "撤回済みの業績が {n} 件表示されています",
    hpHint: "項目を選ぶと移動します。もう一度選ぶと次の項目へ移動します。",
    hpWalkPosition: "{total} 件中 {n} 件目：{title}",
    hpEvidence: "ナラティブ内の {n} 件の根拠参照が、表示中の項目を指していません",
    hpNarrative: "{n} 件のナラティブモジュールに根拠がリンクされていません",
    reviewConfirm: "確認",
    reviewConfirmed: "確認済み",
    reviewConfirmHint:
      "この業績がご自身のものであると確認したことを記録します。CV の内容は変わりません（確認済みの印が付くだけです）。",
    bulkSelect: "複数選択",
    bulkDone: "完了",
    bulkFilterText: "タイトル・誌名で絞り込み…",
    bulkYearFrom: "開始年",
    bulkYearTo: "終了年",
    bulkFlaggedOnly: "フラグ付きのみ",
    bulkSelectAll: "表示中をすべて選択（{n}）",
    bulkClear: "解除",
    bulkSelected: "{n} 件選択中",
    bulkHide: "非表示",
    bulkShow: "表示",
    bulkNotMine: "「自分の業績ではない」にする",
    bulkExcludeView: "このビューから外す",
    bulkNoMatches: "絞り込みに一致する項目はありません。",
    bulkSelectRow: "選択",
    dgLabel: "メール通知",
    dgHint:
      "再同期でCVが変わったときにメールで通知(変更があった場合のみ、月1通まで。いつでも解除可能)。",
    dgFailed: "メール設定を更新できませんでした。もう一度お試しください。",
    dgEmailLabel: "ダイジェストの送信先",
    dgEmailSave: "アドレスを確認",
    dgEmailPending: "確認メールを送信しました。受信箱のリンクをクリックしてください。",
    dgEmailVerified: "確認済み",
    dgEmailNone: "ダイジェストを受け取るにはメールアドレスを追加してください。",
    dgEmailUsing: "ダイジェストはアカウントのメール({e})に送信されます。",
    dgEmailFailed: "アドレスを保存できませんでした。もう一度お試しください。",
    tbPublish: "公開",
    tbPublished: "公開中",
    tbShare: "共有",
    wlTitle: "所属とオープンアクセス",
    wlIntro:
      "あなただけに表示 — 記録を整えるための手助けであり、評価ではありません。ここの内容は CV にも公開ページにも表示されません。",
    wlPositionsHeading: "機関レコードのない現在の職位（{total} 件中 {n} 件）",
    wlPositionsHelp:
      "ROR レコードを解決できませんでした。ORCID に組織を追加するか、エディタで選択すると、職位がその機関に結び付きます。",
    wlGapsHeading: "掲載された所属にあなたの機関が含まれない業績（{total} 件中 {n} 件）",
    wlGapsHelp:
      "あなたが掲載されている職位の期間に発表されていますが、論文上の所属（OpenAlex の索引による）は別の組織です。論文に別の部局が印刷されていたり、所属が取り込まれていなかったりすることがよくあります。それ自体は誤りではありません。",
    wlGapsGroup: "論文上の所属：ROR {ror} — {n} 件",
    wlNoAffiliationHeading: "所属データのない業績（{total} 件中 {n} 件）",
    wlNoAffiliationHelp:
      "OpenAlex はこれらの業績におけるあなたの著者情報に機関を記録していないか、ROR 識別子のない機関のみを記録しています。これはデータの欠落であり、所属の欠落ではありません。",
    wlNotCheckedNote:
      "この期間の他の {n} 件の業績は他のソース（データセット、会議論文、申請した DOI）に由来し、ここでは確認されません。",
    wlClosedHeading: "オープンな複製が見つからなかった業績（{total} 件中 {n} 件）",
    wlClosedHelp:
      "OpenAlex はオープンな複製を見つけられませんでした。リポジトリへの登録が可能かもしれません — 学術誌のポリシーを確認してください。",
    wlOaSummary: "集計対象の業績 {total} 件のオープンアクセス状況：",
    wlStateOpenCc: "オープン、クリエイティブ・コモンズ・ライセンス",
    wlStateOpenOther: "オープン、その他または不明のライセンス",
    wlStateClosed: "オープンな複製は見つかりませんでした",
    wlStateUnknown: "未判定",
    wlPolicyLink: "学術誌のポリシーを確認（Open Policy Finder）",
    wlFunders: "業績に記載された助成機関：{names}",
    wlJump: "この項目へ移動",
    wlFundingHeading: "あなたの助成金とそのオープンアクセス方針",
    wlFundingHelp:
      "あなた自身の助成金を謝辞に挙げている業績を、その助成機関の方針の記述と SigmaCV が見つけた状態と並べて示します。事実のみで判定はしません。ある方針が特定の業績に当てはまるかどうかは、あなた自身が判断してください。",
    wlFundingAward: "{funder} の助成番号 {award} を謝辞に記載",
    wlFundingFunderOnly: "あなたの助成機関 {funder} を記載。業績に助成番号なし",
    wlFundingPolicy: "{funder} のオープンアクセス方針（{date} 時点の記録）：{statements}",
    wlFundingPolicyPending:
      "{funder} のオープンアクセス方針（記憶をもとに下書きしたもので、助成機関のサイトとはまだ照合していません）：{statements}",
    wlFundingPolicyLink: "方針のページ",
    wlFundingNoPolicy: "SigmaCV には {funder} の方針の記録がありません。",
    wlFundingFound: "SigmaCV が見つけた状態：{state}",
    wlFundingUnnamedFunder: "助成機関",
    hpInfoTitle: "あなただけに表示",
    hpSelfRef:
      "あなたの論文の参考文献のうち約 {pct} が自身の業績を引用しています（n = {n}）。審査委員会がこれを見ることがありますが、CV には一切表示されません。",
  },
  "pt-BR": {
    hpMisAllMine: "Todos são meus",
    srLastSync: "Última sincronização",
    srInitial:
      "{n} itens importados do registro aberto. Seu CV já está pronto — revisar os sinalizados abaixo é opcional.",
    srAdded: "{n} novos",
    srRemoved: "{n} não estão mais nas fontes",
    srReview: "{n} para revisar",
    srReviewJump: "Ir para o próximo item a revisar",
    srMore: "+{n} mais",
    srDetails: "Ver novidades",
    srDismiss: "Dispensar",
    srNoTitle: "(sem título)",
    hpTitle: "Requer sua atenção",
    hpReview: "{n} itens candidatos aguardando decisão",
    hpDuplicates: "{n} possíveis duplicatas a resolver",
    hpConflicts: "{n} trabalhos com um ORCID iD diferente",
    hpMisattributed: "{n} trabalhos que podem não ser seus para revisar",
    hpRetracted: "{n} trabalhos retratados ainda exibidos",
    hpHint: "Selecione um para ir até ele; selecione novamente para o próximo.",
    hpWalkPosition: "{n} de {total}: {title}",
    hpEvidence:
      "{n} referências de evidência na sua narrativa não apontam mais para uma entrada exibida",
    hpNarrative: "{n} módulos narrativos não têm evidência vinculada",
    reviewConfirm: "Confirmar",
    reviewConfirmed: "Confirmado",
    reviewConfirmHint:
      "Registre que você verificou que este trabalho é seu. Não altera nada no seu CV — apenas o marca como revisado.",
    bulkSelect: "Seleção múltipla",
    bulkDone: "Concluir",
    bulkFilterText: "Filtrar por título ou periódico…",
    bulkYearFrom: "Do ano",
    bulkYearTo: "Até o ano",
    bulkFlaggedOnly: "Apenas sinalizados",
    bulkSelectAll: "Selecionar todos exibidos ({n})",
    bulkClear: "Limpar",
    bulkSelected: "{n} selecionados",
    bulkHide: "Ocultar",
    bulkShow: "Mostrar",
    bulkNotMine: "Marcar como “não é meu”",
    bulkExcludeView: "Ocultar desta visualização",
    bulkNoMatches: "Nenhum item corresponde ao filtro.",
    bulkSelectRow: "Selecionar",
    dgLabel: "Avisos por e-mail",
    dgHint:
      "Receber e-mail quando uma sincronização alterar meu CV — no máximo um por mês, apenas quando algo mudar. Cancele quando quiser.",
    dgFailed: "Não foi possível atualizar a preferência de e-mail — tente novamente.",
    dgEmailLabel: "Enviar resumos para",
    dgEmailSave: "Confirmar endereço",
    dgEmailPending: "Confirmação enviada — abra essa caixa e clique no link.",
    dgEmailVerified: "Confirmado",
    dgEmailNone: "Adicione um e-mail para receber os resumos.",
    dgEmailUsing: "Os resumos irão para o e-mail da sua conta ({e}).",
    dgEmailFailed: "Não foi possível salvar o endereço — tente novamente.",
    tbPublish: "Publicar",
    tbPublished: "Publicado",
    tbShare: "Compartilhar",
    wlTitle: "Afiliações e acesso aberto",
    wlIntro:
      "Somente para você: uma ajuda para o seu registro, não um veredito. Nada disto aparece no seu CV nem na sua página pública.",
    wlPositionsHeading: "Cargos atuais sem registro de instituição ({n} de {total})",
    wlPositionsHelp:
      "O registro ROR não foi resolvido. Adicione a organização no ORCID, ou escolha-a no editor, para que o cargo fique vinculado à sua instituição.",
    wlGapsHeading:
      "Trabalhos cuja afiliação impressa não inclui a sua instituição ({n} de {total})",
    wlGapsHelp:
      "Datados durante um cargo sob o qual você está listado, mas a afiliação no artigo, tal como o OpenAlex a indexa, nomeia outra organização. Muitas vezes o artigo imprimiu outra unidade, ou a afiliação não foi captada; nada aqui é um erro por si só.",
    wlGapsGroup: "Afiliação no artigo: ROR {ror} — {n}",
    wlNoAffiliationHeading: "Trabalhos sem dados de afiliação ({n} de {total})",
    wlNoAffiliationHelp:
      "O OpenAlex não registrou nenhuma instituição — ou nenhuma com identificador ROR — na sua autoria destes trabalhos. É um dado ausente, não uma afiliação ausente.",
    wlNotCheckedNote:
      "Outros {n} trabalhos deste período vêm de outras fontes (conjuntos de dados, artigos de conferência, DOIs reivindicados) e não são verificados aqui.",
    wlClosedHeading: "Trabalhos sem cópia aberta encontrada ({n} de {total})",
    wlClosedHelp:
      "O OpenAlex não encontrou nenhuma cópia aberta; um depósito em repositório pode ser possível: consulte a política da revista.",
    wlOaSummary: "Situação de acesso aberto dos seus {total} trabalhos contabilizados:",
    wlStateOpenCc: "Aberto, licença Creative Commons",
    wlStateOpenOther: "Aberto, outra licença ou licença desconhecida",
    wlStateClosed: "Nenhuma cópia aberta encontrada",
    wlStateUnknown: "Não determinado",
    wlPolicyLink: "Consultar a política da revista (Open Policy Finder)",
    wlFunders: "Financiadores nomeados no trabalho: {names}",
    wlJump: "Ir para esta entrada",
    wlFundingHeading: "Seus financiamentos e suas políticas de acesso aberto",
    wlFundingHelp:
      "Trabalhos que reconhecem um dos seus próprios financiamentos, ao lado do que diz a política desse financiador e do que o SigmaCV encontrou. Apenas fatos, sem veredito: se uma política se aplica a um trabalho específico é algo que cabe a você julgar.",
    wlFundingAward: "reconhece o financiamento {award} de {funder}",
    wlFundingFunderOnly:
      "menciona seu financiador {funder}; sem número de financiamento no trabalho",
    wlFundingPolicy: "Política de acesso aberto de {funder}, registrada em {date}: {statements}",
    wlFundingPolicyPending:
      "Política de acesso aberto de {funder}, redigida de memória e ainda não conferida no site do financiador: {statements}",
    wlFundingPolicyLink: "página da política",
    wlFundingNoPolicy: "O SigmaCV não tem registro de política para {funder}.",
    wlFundingFound: "O SigmaCV encontrou: {state}",
    wlFundingUnnamedFunder: "um financiador",
    hpInfoTitle: "Somente para você",
    hpSelfRef:
      "Cerca de {pct} das referências dos seus artigos apontam para o seu próprio trabalho (n = {n}). Alguns comitês observam isso; nada no seu CV o mostra.",
  },
  "it-IT": {
    hpMisAllMine: "Sono tutti miei",
    srLastSync: "Ultima sincronizzazione",
    srInitial:
      "Importate {n} voci dal registro aperto. Il tuo CV è già pronto: rivedere quelle segnalate qui sotto è facoltativo.",
    srAdded: "{n} nuove",
    srRemoved: "{n} non più nelle fonti",
    srReview: "{n} da verificare",
    srReviewJump: "Vai al prossimo elemento da verificare",
    srMore: "+{n} altri",
    srDetails: "Mostra le novità",
    srDismiss: "Chiudi",
    srNoTitle: "(senza titolo)",
    hpTitle: "Richiede la tua attenzione",
    hpReview: "{n} voci candidate in attesa di decisione",
    hpDuplicates: "{n} possibili duplicati da risolvere",
    hpConflicts: "{n} lavori con un ORCID iD diverso",
    hpMisattributed: "{n} lavori che potrebbero non essere tuoi da verificare",
    hpRetracted: "{n} lavori ritrattati ancora visibili",
    hpHint: "Selezionane uno per andarci; selezionalo di nuovo per il successivo.",
    hpWalkPosition: "{n} di {total}: {title}",
    hpEvidence:
      "{n} riferimenti a evidenze nella tua narrativa non puntano più a una voce mostrata",
    hpNarrative: "{n} moduli narrativi non hanno evidenze collegate",
    reviewConfirm: "Conferma",
    reviewConfirmed: "Confermato",
    reviewConfirmHint:
      "Registra che hai verificato che questo lavoro è tuo. Non modifica nulla nel CV: lo segna soltanto come verificato.",
    bulkSelect: "Selezione multipla",
    bulkDone: "Fatto",
    bulkFilterText: "Filtra per titolo o rivista…",
    bulkYearFrom: "Dall’anno",
    bulkYearTo: "All’anno",
    bulkFlaggedOnly: "Solo segnalate",
    bulkSelectAll: "Seleziona tutte le voci mostrate ({n})",
    bulkClear: "Annulla selezione",
    bulkSelected: "{n} selezionate",
    bulkHide: "Nascondi",
    bulkShow: "Mostra",
    bulkNotMine: "Segna come «non mio»",
    bulkExcludeView: "Nascondi da questa vista",
    bulkNoMatches: "Nessuna voce corrisponde al filtro.",
    bulkSelectRow: "Seleziona",
    dgLabel: "Avvisi e-mail",
    dgHint:
      "Ricevi un’e-mail quando una sincronizzazione modifica il CV — al massimo una al mese, solo in caso di modifiche. Disiscrizione in qualsiasi momento.",
    dgFailed: "Impossibile aggiornare la preferenza e-mail: riprova.",
    dgEmailLabel: "Invia i riepiloghi a",
    dgEmailSave: "Conferma indirizzo",
    dgEmailPending: "Conferma inviata: apri quella casella e fai clic sul link.",
    dgEmailVerified: "Confermato",
    dgEmailNone: "Aggiungi un indirizzo e-mail per ricevere i riepiloghi.",
    dgEmailUsing: "I riepiloghi andranno all’e-mail del tuo account ({e}).",
    dgEmailFailed: "Impossibile salvare l’indirizzo: riprova.",
    tbPublish: "Pubblica",
    tbPublished: "Pubblicato",
    tbShare: "Condividi",
    wlTitle: "Affiliazioni e accesso aperto",
    wlIntro:
      "Solo per te: un aiuto per il tuo profilo, non un verdetto. Nulla di questo compare nel tuo CV né nella tua pagina pubblica.",
    wlPositionsHeading: "Posizioni attuali senza scheda dell’istituzione ({n} di {total})",
    wlPositionsHelp:
      "La scheda ROR non è stata risolta. Aggiungi l’organizzazione su ORCID, o sceglila nell’editor, così la posizione è collegata alla sua istituzione.",
    wlGapsHeading:
      "Lavori la cui affiliazione stampata non riporta la tua istituzione ({n} di {total})",
    wlGapsHelp:
      "Datati durante una posizione sotto cui sei elencato, ma l’affiliazione sull’articolo, come la indicizza OpenAlex, nomina un’altra organizzazione. Spesso l’articolo riportava un’altra unità, o l’affiliazione non è stata rilevata; nulla qui è sbagliato di per sé.",
    wlGapsGroup: "Affiliazione sull’articolo: ROR {ror} — {n}",
    wlNoAffiliationHeading: "Lavori senza dati di affiliazione ({n} di {total})",
    wlNoAffiliationHelp:
      "OpenAlex non ha registrato alcuna istituzione — o nessuna con identificativo ROR — sulla tua paternità di questi lavori. È un dato mancante, non un’affiliazione mancante.",
    wlNotCheckedNote:
      "Altri {n} lavori di questo periodo provengono da altre fonti (set di dati, articoli di conferenza, DOI rivendicati) e non sono controllati qui.",
    wlClosedHeading: "Lavori senza copia aperta trovata ({n} di {total})",
    wlClosedHelp:
      "OpenAlex non ha trovato alcuna copia aperta; un deposito in un repository potrebbe essere possibile: verifica la politica della rivista.",
    wlOaSummary: "Stato di accesso aperto dei tuoi {total} lavori conteggiati:",
    wlStateOpenCc: "Aperto, licenza Creative Commons",
    wlStateOpenOther: "Aperto, altra licenza o licenza sconosciuta",
    wlStateClosed: "Nessuna copia aperta trovata",
    wlStateUnknown: "Non determinato",
    wlPolicyLink: "Verifica la politica della rivista (Open Policy Finder)",
    wlFunders: "Finanziatori indicati sul lavoro: {names}",
    wlJump: "Vai a questa voce",
    wlFundingHeading: "I tuoi finanziamenti e le loro politiche di accesso aperto",
    wlFundingHelp:
      "Lavori che citano uno dei tuoi finanziamenti, accanto a ciò che dice la politica di quel finanziatore e a ciò che SigmaCV ha trovato. Solo fatti, nessun verdetto: se una politica si applica a un dato lavoro spetta a te giudicarlo.",
    wlFundingAward: "cita il finanziamento {award} di {funder}",
    wlFundingFunderOnly:
      "cita il tuo finanziatore {funder}; nessun numero di finanziamento sul lavoro",
    wlFundingPolicy: "Politica di accesso aperto di {funder}, registrata il {date}: {statements}",
    wlFundingPolicyPending:
      "Politica di accesso aperto di {funder}, redatta a memoria e non ancora verificata sul sito del finanziatore: {statements}",
    wlFundingPolicyLink: "pagina della politica",
    wlFundingNoPolicy: "SigmaCV non ha alcuna registrazione della politica di {funder}.",
    wlFundingFound: "SigmaCV ha trovato: {state}",
    wlFundingUnnamedFunder: "un finanziatore",
    hpInfoTitle: "Solo per te",
    hpSelfRef:
      "Circa il {pct} dei riferimenti nei tuoi articoli rimanda ai tuoi stessi lavori (n = {n}). Alcune commissioni lo guardano; nulla nel tuo CV lo mostra.",
  },
  "ko-KR": {
    hpMisAllMine: "모두 내 것입니다",
    srLastSync: "마지막 동기화",
    srInitial:
      "공개 기록에서 {n}개 항목을 가져왔습니다. CV가 준비되었습니다 — 아래 표시된 항목 검토는 선택 사항입니다.",
    srAdded: "신규 {n}개",
    srRemoved: "{n}개가 소스에서 사라짐",
    srReview: "검토 필요 {n}개",
    srReviewJump: "다음 검토 항목으로 이동",
    srMore: "외 {n}개",
    srDetails: "새 항목 보기",
    srDismiss: "닫기",
    srNoTitle: "(제목 없음)",
    hpTitle: "확인이 필요합니다",
    hpReview: "결정 대기 중인 후보 {n}개",
    hpDuplicates: "중복 가능성 {n}개",
    hpConflicts: "다른 ORCID iD가 기재된 업적 {n}개",
    hpMisattributed: "본인의 것이 아닐 수 있는 업적 {n}개",
    hpRetracted: "철회된 업적 {n}개가 아직 표시됨",
    hpHint: "항목을 선택하면 이동합니다. 다시 선택하면 다음 항목으로 이동합니다.",
    hpWalkPosition: "{total}개 중 {n}번째: {title}",
    hpEvidence: "서술의 근거 참조 {n}개가 더 이상 표시된 항목을 가리키지 않습니다",
    hpNarrative: "서술 모듈 {n}개에 연결된 근거가 없습니다",
    reviewConfirm: "확인",
    reviewConfirmed: "확인함",
    reviewConfirmHint:
      "이 업적이 본인의 것임을 확인했다고 기록합니다. CV 내용은 바뀌지 않으며 확인 표시만 남습니다.",
    bulkSelect: "여러 항목 선택",
    bulkDone: "완료",
    bulkFilterText: "제목·저널로 필터…",
    bulkYearFrom: "시작 연도",
    bulkYearTo: "끝 연도",
    bulkFlaggedOnly: "표시된 항목만",
    bulkSelectAll: "표시된 항목 모두 선택({n})",
    bulkClear: "선택 해제",
    bulkSelected: "{n}개 선택됨",
    bulkHide: "숨기기",
    bulkShow: "표시",
    bulkNotMine: "‘내 업적 아님’으로 표시",
    bulkExcludeView: "이 보기에서 숨기기",
    bulkNoMatches: "필터와 일치하는 항목이 없습니다.",
    bulkSelectRow: "선택",
    dgLabel: "이메일 알림",
    dgHint:
      "재동기화로 CV가 바뀌면 이메일로 알림 — 변경이 있을 때만 월 1회 이하로 발송됩니다. 언제든지 해지할 수 있습니다.",
    dgFailed: "이메일 설정을 업데이트하지 못했습니다. 다시 시도해 주세요.",
    dgEmailLabel: "다이제스트 수신 주소",
    dgEmailSave: "주소 확인",
    dgEmailPending: "확인 메일을 보냈습니다. 해당 받은편지함에서 링크를 클릭하세요.",
    dgEmailVerified: "확인됨",
    dgEmailNone: "다이제스트를 받으려면 이메일 주소를 추가하세요.",
    dgEmailUsing: "다이제스트는 계정 이메일({e})로 발송됩니다.",
    dgEmailFailed: "주소를 저장하지 못했습니다. 다시 시도해 주세요.",
    tbPublish: "게시",
    tbPublished: "게시됨",
    tbShare: "공유",
    wlTitle: "소속 및 오픈 액세스",
    wlIntro:
      "본인에게만 표시 — 기록을 정리하는 데 도움을 주는 것이지 판정이 아닙니다. 여기의 내용은 CV나 공개 페이지에 나타나지 않습니다.",
    wlPositionsHeading: "기관 레코드가 없는 현재 직위 ({total}개 중 {n}개)",
    wlPositionsHelp:
      "ROR 레코드를 찾지 못했습니다. ORCID에 기관을 추가하거나 편집기에서 선택하면 직위가 해당 기관과 연결됩니다.",
    wlGapsHeading: "게재된 소속에 내 기관이 없는 연구물 ({total}건 중 {n}건)",
    wlGapsHelp:
      "내가 등재된 직위 기간에 발표되었지만, 논문에 인쇄된 소속(OpenAlex 색인 기준)은 다른 기관입니다. 논문에 다른 부서가 인쇄되었거나 소속이 수집되지 않은 경우가 많습니다. 이것 자체는 오류가 아닙니다.",
    wlGapsGroup: "논문상의 소속: ROR {ror} — {n}건",
    wlNoAffiliationHeading: "소속 데이터가 없는 연구물 ({total}건 중 {n}건)",
    wlNoAffiliationHelp:
      "OpenAlex가 이 연구물의 내 저자 정보에 기관을 기록하지 않았거나, ROR 식별자가 없는 기관만 기록했습니다. 데이터가 없는 것이지 소속이 없는 것이 아닙니다.",
    wlNotCheckedNote:
      "이 기간의 다른 연구물 {n}건은 다른 출처(데이터셋, 학술대회 논문, 직접 등록한 DOI)에서 왔으며 여기서는 확인하지 않습니다.",
    wlClosedHeading: "공개 사본을 찾지 못한 연구물 ({total}건 중 {n}건)",
    wlClosedHelp:
      "OpenAlex가 공개 사본을 찾지 못했습니다. 리포지터리 기탁이 가능할 수 있습니다 — 학술지의 정책을 확인하세요.",
    wlOaSummary: "집계 대상 연구물 {total}건의 오픈 액세스 상태:",
    wlStateOpenCc: "공개, 크리에이티브 커먼즈 라이선스",
    wlStateOpenOther: "공개, 기타 또는 알 수 없는 라이선스",
    wlStateClosed: "공개 사본을 찾지 못함",
    wlStateUnknown: "판정되지 않음",
    wlPolicyLink: "학술지 정책 확인 (Open Policy Finder)",
    wlFunders: "연구물에 명시된 지원 기관: {names}",
    wlJump: "이 항목으로 이동",
    wlFundingHeading: "내 연구비와 그 오픈 액세스 정책",
    wlFundingHelp:
      "내 연구비를 사사에 밝힌 연구물을, 해당 지원 기관의 정책 내용과 SigmaCV가 확인한 상태와 나란히 보여 줍니다. 사실만 제시하며 판정하지 않습니다. 특정 정책이 특정 연구물에 적용되는지는 직접 판단하세요.",
    wlFundingAward: "{funder}의 과제번호 {award}를 사사에 명시",
    wlFundingFunderOnly: "내 지원 기관 {funder}을(를) 명시. 연구물에 과제번호 없음",
    wlFundingPolicy: "{funder}의 오픈 액세스 정책({date} 기준 기록): {statements}",
    wlFundingPolicyPending:
      "{funder}의 오픈 액세스 정책(기억에 의존해 작성했으며 아직 지원 기관 사이트와 대조하지 않음): {statements}",
    wlFundingPolicyLink: "정책 페이지",
    wlFundingNoPolicy: "SigmaCV에는 {funder}의 정책 기록이 없습니다.",
    wlFundingFound: "SigmaCV가 확인한 상태: {state}",
    wlFundingUnnamedFunder: "지원 기관",
    hpInfoTitle: "본인에게만 표시",
    hpSelfRef:
      "논문의 참고문헌 중 약 {pct}가 본인의 연구를 가리킵니다 (n = {n}). 일부 심사 위원회는 이를 살펴보지만 CV에는 전혀 표시되지 않습니다.",
  },
  "ru-RU": {
    hpMisAllMine: "Все мои",
    srLastSync: "Последняя синхронизация",
    srInitial:
      "Импортировано {n} записей из открытых источников. Ваше резюме готово — проверять отмеченные ниже необязательно.",
    srAdded: "{n} новых",
    srRemoved: "{n} больше нет в источниках",
    srReview: "{n} на проверку",
    srReviewJump: "Перейти к следующему элементу на проверку",
    srMore: "+{n} ещё",
    srDetails: "Показать новое",
    srDismiss: "Закрыть",
    srNoTitle: "(без названия)",
    hpTitle: "Требует вашего внимания",
    hpReview: "{n} записей-кандидатов ждут решения",
    hpDuplicates: "{n} возможных дубликатов",
    hpConflicts: "{n} работ с другим ORCID iD",
    hpMisattributed: "{n} работ, которые могут быть не вашими",
    hpRetracted: "{n} отозванных работ всё ещё отображаются",
    hpHint: "Выберите пункт, чтобы перейти к нему; выберите снова для следующего.",
    hpWalkPosition: "{n} из {total}: {title}",
    hpEvidence:
      "{n} ссылок на подтверждения в вашем нарративе больше не указывают на показанную запись",
    hpNarrative: "{n} нарративных модулей без связанных подтверждений",
    reviewConfirm: "Подтвердить",
    reviewConfirmed: "Подтверждено",
    reviewConfirmHint:
      "Отметьте, что вы проверили: эта работа действительно ваша. Ничего в резюме не меняется — работа лишь помечается как проверенная.",
    bulkSelect: "Выбрать несколько",
    bulkDone: "Готово",
    bulkFilterText: "Фильтр по названию или журналу…",
    bulkYearFrom: "С года",
    bulkYearTo: "По год",
    bulkFlaggedOnly: "Только отмеченные",
    bulkSelectAll: "Выбрать все показанные ({n})",
    bulkClear: "Сбросить",
    bulkSelected: "Выбрано: {n}",
    bulkHide: "Скрыть",
    bulkShow: "Показать",
    bulkNotMine: "Отметить «не моё»",
    bulkExcludeView: "Скрыть из этого вида",
    bulkNoMatches: "Нет записей, соответствующих фильтру.",
    bulkSelectRow: "Выбрать",
    dgLabel: "Почтовые уведомления",
    dgHint:
      "Письмо, когда синхронизация меняет CV — не чаще раза в месяц и только при изменениях. Отписаться можно в любой момент.",
    dgFailed: "Не удалось обновить настройку почты — попробуйте ещё раз.",
    dgEmailLabel: "Куда присылать дайджесты",
    dgEmailSave: "Подтвердить адрес",
    dgEmailPending:
      "Письмо с подтверждением отправлено — откройте этот ящик и перейдите по ссылке.",
    dgEmailVerified: "Подтверждён",
    dgEmailNone: "Добавьте адрес электронной почты, чтобы получать дайджесты.",
    dgEmailUsing: "Дайджесты будут приходить на адрес аккаунта ({e}).",
    dgEmailFailed: "Не удалось сохранить адрес — попробуйте ещё раз.",
    tbPublish: "Опубликовать",
    tbPublished: "Опубликовано",
    tbShare: "Поделиться",
    wlTitle: "Аффилиации и открытый доступ",
    wlIntro:
      "Только для вас — помощь с вашей записью, а не вердикт. Ничего из этого не появляется в вашем CV или на публичной странице.",
    wlPositionsHeading: "Текущие должности без записи об организации ({n} из {total})",
    wlPositionsHelp:
      "Запись ROR не была определена. Добавьте организацию в ORCID или выберите её в редакторе, чтобы должность была связана со своей организацией.",
    wlGapsHeading:
      "Работы, в напечатанной аффилиации которых нет вашей организации ({n} из {total})",
    wlGapsHelp:
      "Датированы периодом должности, под которой вы указаны, но аффилиация в статье — как её индексирует OpenAlex — называет другую организацию. Часто в статье напечатано другое подразделение или аффилиация не была собрана; само по себе это не ошибка.",
    wlGapsGroup: "Аффилиация в статье: ROR {ror} — {n}",
    wlNoAffiliationHeading: "Работы без данных об аффилиации ({n} из {total})",
    wlNoAffiliationHelp:
      "OpenAlex не зафиксировал организацию в вашем авторстве этих работ — или зафиксировал только организацию без идентификатора ROR. Это отсутствующие данные, а не отсутствующая аффилиация.",
    wlNotCheckedNote:
      "Ещё {n} работ этого периода поступили из других источников (наборы данных, доклады конференций, заявленные DOI) и здесь не проверяются.",
    wlClosedHeading: "Работы, для которых не найдена открытая копия ({n} из {total})",
    wlClosedHelp:
      "OpenAlex не нашёл открытой копии; возможно, доступно размещение в репозитории — проверьте политику журнала.",
    wlOaSummary: "Статус открытого доступа ваших {total} учитываемых работ:",
    wlStateOpenCc: "Открыто, лицензия Creative Commons",
    wlStateOpenOther: "Открыто, другая или неизвестная лицензия",
    wlStateClosed: "Открытая копия не найдена",
    wlStateUnknown: "Не определено",
    wlPolicyLink: "Проверить политику журнала (Open Policy Finder)",
    wlFunders: "Спонсоры, указанные в работе: {names}",
    wlJump: "Перейти к этой записи",
    wlFundingHeading: "Ваши гранты и их политики открытого доступа",
    wlFundingHelp:
      "Работы, в которых указан один из ваших собственных грантов, рядом с тем, что говорит политика этого спонсора, и тем, что нашёл SigmaCV. Только факты, без вердикта: применима ли политика к конкретной работе, решаете вы.",
    wlFundingAward: "указывает грант {award} от {funder}",
    wlFundingFunderOnly: "упоминает вашего спонсора {funder}; номер гранта в работе не указан",
    wlFundingPolicy: "Политика открытого доступа {funder}, по записи от {date}: {statements}",
    wlFundingPolicyPending:
      "Политика открытого доступа {funder}, записанная по памяти и ещё не сверенная с сайтом спонсора: {statements}",
    wlFundingPolicyLink: "страница политики",
    wlFundingNoPolicy: "У SigmaCV нет записи о политике {funder}.",
    wlFundingFound: "SigmaCV нашёл: {state}",
    wlFundingUnnamedFunder: "спонсор",
    hpInfoTitle: "Только для вас",
    hpSelfRef:
      "Около {pct} ссылок в ваших статьях указывают на ваши собственные работы (n = {n}). Некоторые комиссии обращают на это внимание; в вашем резюме это нигде не отображается.",
  },
};

/** Workspace strings for a UI locale (falls back to en-US). */
export function workspaceUi(locale: string): WorkspaceUiStrings {
  return WORKSPACE_UI[asLocale(locale)];
}
