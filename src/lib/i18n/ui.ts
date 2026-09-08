import { asLocale, type Locale } from "./index";

/**
 * Editor / app-chrome strings (the customization panel, account + publish
 * controls, item rows, preview, site links). Localized into all 10 supported
 * languages. Typed as Record<Locale, UiStrings> so a missing translation is a
 * compile error — the site can't ship an untranslated control, now or later.
 *
 * (Distinct from `t` in ./index which covers the topbar/profile chrome, and
 * from ./render which covers the rendered CV document.)
 */
export interface UiStrings {
  styleLegend: string;
  templateLabel: string;
  citationLabel: string;
  yourStyles: string;
  journalStyles: string;
  styleLoading: string;
  stylePickHint: string;
  styleLoadError: string;
  styleNetworkError: string;
  fontLabel: string;
  densityLabel: string;
  fontSizeLabel: string;
  pageSizeLabel: string;
  pageSizeA4: string;
  pageSizeLetter: string;
  accentLabel: string;
  customAccent: string;
  highlightSelf: string;
  highlightStyleLabel: string;
  metricsLabel: string;
  metricNoData: string;
  metricsPreset: string;
  metricsPresetNote: string;
  authorshipLabel: string;
  authorshipNote: string;
  authorshipResyncNote: string;
  showCharts: string;
  /** StyleControls toggle: show the aggregated "Research areas" chip row. */
  showResearchAreas: string;
  /** StyleControls toggle: show the research-output breadth ledger (counts by type). */
  showOutputLedger: string;
  /** StyleControls toggle: hold newly-synced works for review instead of auto-including them. */
  holdNewForReview: string;
  /** ItemRow star toggle: mark a publication as selected / featured. */
  featureItem: string;
  showOpenAccess: string;
  /** Editor toggle: show the profile open-access SHARE in the header (separate
   *  from the per-work badges above). */
  showOpenAccessShare: string;
  /** Research-summary placement control: the group label + the four placement
   *  options (header / own section / end / hidden) + the optional-heading field. */
  summaryBlockLabel: string;
  summaryPosHeader: string;
  summaryPosTop: string;
  summaryPosBottom: string;
  summaryPosHidden: string;
  summaryHeadingLabel: string;
  /** Editor toggle: show the public-page "Co-authors on SigmaCV" block (opt-in). */
  showCoauthorLinks: string;
  /** Editor toggle: allow other SigmaCV CVs to link to this one (opt-out, default on). */
  coauthorLinkable: string;
  hideRetracted: string;
  showAuthorRole: string;
  showCitationCounts: string;
  /** Editor toggle: the "Verified" mark on institution-asserted positions/education. */
  showVerifiedBadges: string;
  /** Editor toggle: the opt-in open data / code line under each publication. */
  showDataLinks: string;
  /** Editor toggle: show FORRT/FReD replication evidence under each publication. */
  showReplications: string;
  /** Editor toggle label: show Software Heritage archival status on software items. */
  showArchivalStatus: string;
  /** Editor toggle label: show Sciety public evaluations on preprints. */
  showPublicEvaluations: string;
  showProvenance: string;
  peerReviewedOnly: string;
  peerReviewedOnlyTitle: string;
  peerReviewedOnlyNote: string;
  countLetters: string;
  countLettersTitle: string;
  countLettersNote: string;
  shownSuffix: string;
  dragSection: string;
  sectionTitleAria: string;
  moveSectionUp: string;
  moveSectionDown: string;
  grantsPlaceholder: string;
  addEntryAria: string;
  tplClassic: string;
  tplModern: string;
  tplMinimal: string;
  tplCompact: string;
  tplSidebar: string;
  tplEditorial: string;
  tplAts: string;
  hlAccent: string;
  hlBold: string;
  hlUnderline: string;
  hlAccentUnderline: string;
  fontSerif: string;
  fontSans: string;
  fontPalatino: string;
  densityComfortable: string;
  densityCompact: string;
  stopContributing: string;
  stopContributingTitle: string;
  exportData: string;
  deleteAccount: string;
  deleteConfirm: string;
  deleteFailed: string;
  consentWithdrawFailed: string;
  cancel: string;
  publishPublic: string;
  publicLive: string;
  /** Plain-language summary of what publishing exposes (shown at the toggle). */
  publicSummary: string;
  openPage: string;
  copyLink: string;
  linkCopied: string;
  /** One-line hint under a published page's link, nudging the owner to share it. */
  shareHint: string;
  /** Error shown when publishing/unpublishing the public page fails. */
  publishError: string;
  publishTitle: string;
  allowIndexing: string;
  allowIndexingTitle: string;
  /** One-line benefit explanation shown beside the indexing toggle. Names the
   *  OAI-PMH endpoint: an indexable page is also harvestable, and listing under
   *  the institution is a separate choice. */
  allowIndexingBody: string;
  /** "List under my current affiliation": the OAI-PMH `ror:<id>` set opt-in —
   *  a consent separate from indexing (which it requires). */
  listUnderAffiliation: string;
  listUnderAffiliationTitle: string;
  listUnderAffiliationBody: string;
  /** Why the opt-in is disabled: no visible current position resolves to ROR. */
  listUnderAffiliationNoRor: string;
  /** "Show me on my institution's public page": a FOURTH separate consent,
   *  pinned to the ROR ids ticked among the visible current positions. */
  showOnInstitutionPage: string;
  showOnInstitutionPageTitle: string;
  showOnInstitutionPageBody: string;
  institutionPagePick: string;
  institutionPageListedUnder: string;
  institutionPageLapsed: string;
  institutionPageLapsedNone: string;
  institutionPageUnavailable: string;
  /** Shown with exactly one current affiliation: one click consents to it — say which. */
  institutionPageSingle: string;
  /** The toggle is ticked but nothing is posted until an institution is ticked. */
  institutionPageArmedHint: string;
  /** A lapsed (kept) id, rendered with its own Remove control. */
  institutionPageLapsedKept: string;
  institutionPageRemove: string;
  publicContactLegend: string;
  publicShowEmail: string;
  publicShowPhone: string;
  publicShowLocation: string;
  exportFormatTitle: string;
  exportGroupDocuments: string;
  exportGroupData: string;
  exportGroupGrantCv: string;
  exportPdf: string;
  exportDocx: string;
  exportLatexModern: string;
  exportMarkdown: string;
  exportHtml: string;
  exportBibtex: string;
  exportCslJson: string;
  exportJsonResume: string;
  exportRoCrate: string;
  exportJson: string;
  exportBiosketch: string;
  exportErc: string;
  exportMsca: string;
  exportNsf: string;
  exportJsps: string;
  itemUntitled: string;
  dragItem: string;
  manualPlaceholder: string;
  entryTextAria: string;
  /** Placeholder inviting the user to add a missing role on a positions/education line. */
  rolePlaceholder: string;
  /** Aria-label for the editable "Role / title" field on a positions/education entry. */
  roleAria: string;
  /** Summary label of the "Edit details" disclosure on a positions/education row. */
  editDetails: string;
  /** Aria-label for the editable department/sub-unit field. */
  departmentAria: string;
  /** Aria-label for the editable institution-name field. */
  institutionAria: string;
  editInstitutionHint: string;
  publicationYearAria: string;
  venueAria: string;
  /** Aria-label for the start-year field. */
  startYearAria: string;
  /** Aria-label for the end-year field. */
  endYearAria: string;
  /** Label for the "ongoing / present" checkbox (no end year). */
  ongoingLabel: string;
  /** Note shown when a legacy entry has no structured dates yet to edit. */
  resyncForDates: string;
  /** Short button label: revert a source-derived entry's edited text to source. */
  revertToSource: string;
  /** Tooltip/aria for the revert control on an edited Positions/Education line. */
  revertToSourceHint: string;
  matchedByIdentifier: string;
  matchedByIdOnly: string;
  photoTooLarge: string;
  previewTitle: string;
  previewRendering: string;
  previewEmpty: string;
  linksNav: string;
  coffee: string;
  supportTitle: string;
  /** Editor toggle: opt-in per-work indicator pills (RCR / FWCI / clinical citations). */
  showWorkIndicators: string;
  /** Note under the per-work indicators toggle explaining what is (and is not) shown. */
  showWorkIndicatorsNote: string;
  /** Design toggle: the opt-in collaboration-breadth line (default off). */
  showCollaboration: string;
  showCollaborationNote: string;
  /** Editor toggle: offer the assessor "Reader view" link on the public page (opt-in, default off). */
  allowReaderMode: string;
  /** Tooltip on that toggle. */
  allowReaderModeTitle: string;
  /** Note under that toggle; "{list}" → the comma-joined labels of the toggles the reader view forces on. */
  allowReaderModeNote: string;
  /** Share panel: label before the reader-view URL. */
  readerViewUrlLabel: string;
  /** Share panel: hint under the reader-view URL. */
  readerViewUrlHint: string;
}

const UI_I18N: Record<Locale, UiStrings> = {
  "en-US": {
    pageSizeLabel: "Page size",
    pageSizeA4: "A4",
    pageSizeLetter: "US Letter",
    showCoauthorLinks: "Show co-authors who are on SigmaCV",
    coauthorLinkable: "Let other SigmaCV CVs link to mine",
    editDetails: "Edit details",
    departmentAria: "Department",
    institutionAria: "Institution",
    editInstitutionHint: "Edit the institution name",
    publicationYearAria: "Year",
    venueAria: "Journal / venue",
    startYearAria: "Start year",
    endYearAria: "End year",
    ongoingLabel: "Ongoing",
    resyncForDates: "Re-sync to edit dates",
    styleLegend: "Style",
    templateLabel: "Template",
    citationLabel: "Citation style",
    yourStyles: "Your styles",
    journalStyles: "Journal & society styles",
    styleLoading: "Loading style…",
    stylePickHint: "Pick any journal style — applied to every citation.",
    styleLoadError: "Could not load that style.",
    styleNetworkError: "Network error — please try again.",
    fontLabel: "Font",
    densityLabel: "Density",
    fontSizeLabel: "Font size",
    accentLabel: "Accent",
    customAccent: "Custom accent colour",
    highlightSelf: "Highlight my name",
    highlightStyleLabel: "Highlight style",
    metricsLabel: "Metrics (optional — none by default)",
    metricNoData: "(no data)",
    metricsPreset: "Responsible-metrics preset",
    metricsPresetNote:
      "Field-normalised indicators only (DORA / Leiden) — avoids journal-level proxies like the Impact Factor.",
    authorshipLabel: "Authorship summary table (peer-reviewed only)",
    authorshipNote:
      "Adds a table counting how often you are first / last / corresponding author, etc. Pre-prints are not counted.",
    authorshipResyncNote:
      "⚠ These counts are empty for your existing publications. Click Re-sync (top right) to pull author positions from OpenAlex.",
    showCharts: "Show charts (publications & citations / year)",
    showResearchAreas: "Show research areas (top fields)",
    showOutputLedger: "Show research-output summary (counts by type)",
    holdNewForReview: "Review new works before they appear",
    featureItem: "Mark as a selected / featured publication",
    showOpenAccess: "Open-access badges",
    showOpenAccessShare: "Open-access share in header",
    summaryBlockLabel: "Research summary",
    summaryPosHeader: "In header",
    summaryPosTop: "Its own section",
    summaryPosBottom: "At the end",
    summaryPosHidden: "Hidden",
    summaryHeadingLabel: "Heading (optional)",
    hideRetracted: "Hide retracted publications",
    showAuthorRole: "Show my author role (first / last / corresponding)",
    showCitationCounts: "Show citation counts on each publication",
    showVerifiedBadges: "Mark positions & education confirmed by the institution via ORCID",
    showReplications: "Show replication evidence on publications (FORRT/FReD)",
    showArchivalStatus: "Show Software Heritage archival status on software items",
    showPublicEvaluations: "Show public evaluations on preprints (Sciety)",
    showProvenance: "Data-provenance footer",
    peerReviewedOnly: "Hide preprints & non-peer-reviewed work",
    peerReviewedOnlyTitle:
      "Removes ALL non-peer-reviewed works from the CV, including your entire Preprints section. Leave this OFF to keep preprints listed (in their own section).",
    peerReviewedOnlyNote:
      "By default, preprints are kept but listed in a separate “Preprints” section. Turn this on only if you want them gone entirely.",
    countLetters: "Include letters (correspondence)",
    countLettersTitle:
      "Letters / research correspondence published in journals are peer-reviewed, so they're listed and counted (charts, metrics, authorship table) by default. Turn off for an articles-only view that drops letters from the list and figures. Preprints are handled separately (above).",
    countLettersNote: "On by default — letters are peer-reviewed. Off gives an articles-only CV.",
    shownSuffix: "shown",
    dragSection: "Drag to reorder section",
    sectionTitleAria: "Section title",
    moveSectionUp: "Move section up",
    moveSectionDown: "Move section down",
    grantsPlaceholder: "Add a grant, e.g. NIH R01, $1.2M (2024–2028)",
    addEntryAria: "Add an entry",
    tplClassic: "Classic",
    tplModern: "Modern",
    tplMinimal: "Minimal",
    tplCompact: "Compact",
    tplSidebar: "Sidebar (photo)",
    tplEditorial: "Editorial",
    tplAts: "ATS-friendly",
    hlAccent: "Accent colour",
    hlBold: "Bold",
    hlUnderline: "Underline",
    hlAccentUnderline: "Accent + underline",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Comfortable",
    densityCompact: "Compact",
    stopContributing: "Stop contributing to research",
    stopContributingTitle:
      "You’re currently contributing anonymised curation data to research. Click to stop and turn it off.",
    exportData: "Export my data",
    deleteAccount: "Delete account",
    deleteConfirm:
      "Permanently delete your account and all associated data? This cannot be undone.",
    deleteFailed: "Failed to delete account. Please try again.",
    consentWithdrawFailed: "Failed to withdraw consent. Please try again.",
    cancel: "Cancel",
    publishPublic: "Publish public page",
    publicLive: "Public page is live",
    publicSummary:
      "Get a living public page — one link that always re-syncs to your latest work, for your email signature, ORCID or website. It shows your name, ORCID and kept publications; your email, phone and location stay private unless you opt in below.",
    openPage: "Open page",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    shareHint: "Add it to your ORCID record, website, or email signature.",
    publishError: "Couldn’t update the public page — please try again.",
    publicContactLegend: "Show on the public page",
    publicShowEmail: "Email",
    publicShowPhone: "Phone",
    publicShowLocation: "Location",
    allowIndexing: "Allow search engines to index this page",
    allowIndexingBody:
      "This is how colleagues and employers find your work in Google and other search engines. Recommended — you can turn it off anytime. An indexable page can also be harvested by open repositories and aggregators through SigmaCV's OAI-PMH endpoint (/api/oai): your CV record and the works it lists, in Dublin Core or OpenAIRE format. Being listed under your institution is a separate choice below.",
    allowIndexingTitle:
      "Off by default. When on, your public CV can appear in search results (name, ORCID, publications) and can be harvested by open repositories and aggregators through the OAI-PMH endpoint. Listing under your institution is a separate opt-in.",
    listUnderAffiliation: "List me under my current affiliation for repositories",
    listUnderAffiliationTitle:
      "Off by default. When on, harvesters using the OAI-PMH endpoint can select your CV by your current institution's ROR set (ror:<id>). Requires indexing.",
    listUnderAffiliationBody:
      "Adds your CV to the OAI-PMH set for the institution of your first visible current position (its ROR identifier), so a repository or CRIS harvesting by institution can find it. Labelled as your own self-declared affiliation, never as your institution's record. Follows your CV if your affiliation changes; requires indexing; off by default. The number of researchers listed under an institution is shown publicly on its institution page (/i/<ror>) — a count only, never who.",
    listUnderAffiliationNoRor:
      "Not available yet: none of your visible current positions is linked to a ROR institution record. Re-sync, or set the institution on a position.",
    showOnInstitutionPage: "Show me on my institution's public page",
    showOnInstitutionPageTitle:
      "Off by default. When on, your name, ORCID iD, current position and the works your public page lists appear on the public page of the institutions you tick (/i/<ROR id>) and count in its figures. Requires indexing. Withdraw at any time, effective immediately.",
    showOnInstitutionPageBody:
      "Your name, ORCID iD, current position and the works your public page lists appear on your institution's public page on SigmaCV, and you are counted in the page's figures (how many researchers list it, and their works' open-access status). Where OpenAlex's record and yours differ, only counts are shown. Pinned to the institutions you tick below — if your affiliation changes, we ask again rather than move you. A listing you keep from a former affiliation resumes if that affiliation becomes current again. Listing is voluntary and absence means nothing. You can withdraw at any time, effective immediately.",
    institutionPagePick: "List me under",
    institutionPageListedUnder: "You are listed under {institutions}.",
    institutionPageLapsed:
      "Your current affiliation changed: confirm whether to be listed under {institutions}.",
    institutionPageLapsedNone:
      "Your current affiliation changed and none of your current positions is linked to a ROR record; your listing is paused until one is.",
    institutionPageUnavailable:
      "Not available: requires search indexing and a current position linked to a ROR institution record.",
    institutionPageSingle: "Ticking this lists you under {institution}.",
    institutionPageArmedHint: "Nothing is listed yet — tick at least one institution below.",
    institutionPageLapsedKept: "Kept from a former affiliation: ROR {rorId}",
    institutionPageRemove: "Remove",
    publishTitle:
      "Creates a shareable public web page of this CV at a public link. It re-syncs as you update. Off by default; un-tick to take it offline.",
    exportFormatTitle:
      "PDF matches your template exactly. LaTeX follows it closely (editable source). Word and Markdown are plain, editable text — no template styling.",
    exportGroupDocuments: "Documents",
    exportGroupData: "Data",
    exportGroupGrantCv: "Grant CVs (funder-structured drafts)",
    exportPdf: "PDF — print-ready CV (.pdf)",
    exportDocx: "Word — plain, editable (.docx)",
    exportLatexModern: "LaTeX — editable source (.tex)",
    exportMarkdown: "Markdown — plain text (.md)",
    exportHtml: "HTML — self-contained web page (.html)",
    exportBibtex: "BibTeX — publication list (.bib)",
    exportCslJson: "CSL-JSON — citations interchange (.json)",
    exportJsonResume: "JSON Résumé — standard schema (.json)",
    exportRoCrate: "RO-Crate — research object package (.zip)",
    exportJson: "JSON — raw CV data (.json)",
    exportBiosketch: "NIH biosketch — draft (.md)",
    exportErc: "ERC — track record (.md)",
    exportMsca: "MSCA — track record (.md)",
    exportNsf: "NSF — biographical sketch (.md)",
    exportJsps: "JSPS/KAKENHI — track record (.md)",
    itemUntitled: "Untitled",
    dragItem: "Drag to reorder",
    manualPlaceholder: "e.g. Visiting Researcher, MIT (2023)",
    entryTextAria: "Entry text",
    rolePlaceholder: "Add your title…",
    roleAria: "Role or title",
    revertToSource: "Revert",
    revertToSourceHint: "Discard your edit and restore the original text from ORCID/OpenAlex",
    matchedByIdentifier: "Matched by your identifier",
    matchedByIdOnly: "Matched by OpenAlex ID only — not ORCID-confirmed; review",
    photoTooLarge: "That image is too large — try a smaller one.",
    previewTitle: "CV preview",
    previewRendering: "Rendering preview…",
    previewEmpty: "Preview will appear here.",
    linksNav: "Links",
    coffee: "☕ Buy me a coffee",
    supportTitle: "SigmaCV is free and not-for-profit — a coffee helps cover its running costs.",
    showWorkIndicators: "Show per-publication indicators (RCR, FWCI, clinical citations)",
    showWorkIndicatorsNote:
      "Per-work values as reported by NIH iCite and OpenAlex, each with its own caveat, shown only on works that carry one (RCR and clinical citations are biomedical-only). Nothing is summed, averaged or ranked.",
    showCollaboration: "Show collaboration breadth (co-author countries)",
    showCollaborationNote:
      "One line in the research summary: how many countries appear on your author lists and what share of works span at least two, from OpenAlex affiliation data. Descriptive only — no map, no ranking.",
    showDataLinks: "Show open data / code links under each publication",
    allowReaderMode: 'Offer a "Reader view" on the public page',
    allowReaderModeTitle:
      "Assessors can switch to a view that reveals every trust and context signal your data carries. Off by default; your standard page is unchanged.",
    allowReaderModeNote:
      'Adds a small "Reader view" link to your living page. That view turns on: {list}; shows retracted works with their badge; and marks each work with where it came from. It never adds metrics you did not choose — nothing there is a score.',
    readerViewUrlLabel: "Reader view:",
    readerViewUrlHint:
      "Hand this link to a committee — it opens your page with provenance, verification and context signals shown.",
  },
  "zh-CN": {
    pageSizeLabel: "页面尺寸",
    pageSizeA4: "A4",
    pageSizeLetter: "美式 Letter",
    showCoauthorLinks: "显示也在 SigmaCV 的合作者",
    coauthorLinkable: "允许其他 SigmaCV 简历链接到我的简历",
    editDetails: "编辑详情",
    departmentAria: "部门",
    institutionAria: "机构",
    editInstitutionHint: "编辑机构名称",
    publicationYearAria: "年份",
    venueAria: "期刊 / 出处",
    startYearAria: "起始年份",
    endYearAria: "结束年份",
    ongoingLabel: "至今",
    resyncForDates: "重新同步以编辑日期",
    styleLegend: "样式",
    templateLabel: "模板",
    citationLabel: "引用样式",
    yourStyles: "你的样式",
    journalStyles: "期刊与学会样式",
    styleLoading: "正在加载样式…",
    stylePickHint: "选择任意期刊样式——将应用于所有引用。",
    styleLoadError: "无法加载该样式。",
    styleNetworkError: "网络错误——请重试。",
    fontLabel: "字体",
    densityLabel: "密度",
    fontSizeLabel: "字体大小",
    accentLabel: "强调色",
    customAccent: "自定义强调色",
    highlightSelf: "高亮我的姓名",
    highlightStyleLabel: "高亮样式",
    metricsLabel: "指标（可选——默认不显示）",
    metricNoData: "（无数据）",
    metricsPreset: "负责任指标预设",
    metricsPresetNote:
      "仅显示领域归一化指标（DORA / Leiden）——避免使用 Impact Factor 等期刊层级的替代指标。",
    authorshipLabel: "作者贡献汇总表（仅限同行评审）",
    authorshipNote:
      "添加一个表格，统计你担任第一作者／末位作者／通讯作者等的频次。预印本不计入其中。",
    authorshipResyncNote:
      "⚠ 你现有的出版物没有这些统计数据。点击右上角的 Re-sync（重新同步），从 OpenAlex 拉取作者署名位置。",
    showCharts: "显示图表（每年出版物与引用数）",
    showResearchAreas: "显示研究领域（主要领域）",
    showOutputLedger: "显示研究产出汇总（按类型计数）",
    holdNewForReview: "新作品出现前先核查",
    featureItem: "标记为精选 / 重点论文",
    showOpenAccess: "开放获取标识",
    showOpenAccessShare: "页眉显示开放获取比例",
    summaryBlockLabel: "研究概要",
    summaryPosHeader: "在页眉中",
    summaryPosTop: "作为独立板块",
    summaryPosBottom: "在末尾",
    summaryPosHidden: "隐藏",
    summaryHeadingLabel: "标题（可选）",
    hideRetracted: "隐藏已撤稿的出版物",
    showAuthorRole: "显示我的作者角色（第一／末位／通讯）",
    showCitationCounts: "在每篇论文上显示被引次数",
    showVerifiedBadges: "标记由机构通过 ORCID 确认的职位与教育经历",
    showReplications: "在论文上显示复现证据（FORRT/FReD）",
    showArchivalStatus: "在软件条目上显示 Software Heritage 存档状态",
    showPublicEvaluations: "在预印本上显示公开评审信息（Sciety）",
    showProvenance: "数据来源页脚",
    peerReviewedOnly: "隐藏预印本及非同行评审成果",
    peerReviewedOnlyTitle:
      "从简历中移除所有非同行评审的成果，包括整个预印本部分。保持关闭可继续列出预印本（在其专属部分中）。",
    peerReviewedOnlyNote:
      "默认情况下，预印本会保留但列在单独的“预印本”部分。仅当你想彻底删除它们时才开启此项。",
    countLetters: "包含快报（通讯类论文）",
    countLettersTitle:
      "发表于期刊的快报／研究通讯属于同行评审，默认列出并计入图表、指标和作者署名表。关闭则为“仅论著”视图，从列表和图表中移除快报。预印本由上方选项单独控制。",
    countLettersNote: "默认开启——快报属于同行评审。关闭则仅显示论著。",
    shownSuffix: "已显示",
    dragSection: "拖动以重新排序此部分",
    sectionTitleAria: "部分标题",
    moveSectionUp: "上移此部分",
    moveSectionDown: "下移此部分",
    grantsPlaceholder: "添加一项资助，例如 国家自然科学基金面上项目，60万元（2024–2027）",
    addEntryAria: "添加条目",
    tplClassic: "经典",
    tplModern: "现代",
    tplMinimal: "极简",
    tplCompact: "紧凑",
    tplSidebar: "侧边栏（含照片）",
    tplEditorial: "编辑风格",
    tplAts: "ATS 友好",
    hlAccent: "强调色",
    hlBold: "加粗",
    hlUnderline: "下划线",
    hlAccentUnderline: "强调色 + 下划线",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "宽松",
    densityCompact: "紧凑",
    stopContributing: "停止向研究贡献数据",
    stopContributingTitle: "你当前正在向研究贡献匿名化的整理数据。点击以停止并关闭此功能。",
    exportData: "导出我的数据",
    deleteAccount: "删除账户",
    deleteConfirm: "永久删除你的账户及所有相关数据？此操作无法撤销。",
    deleteFailed: "删除账户失败。请重试。",
    consentWithdrawFailed: "撤回同意失败。请重试。",
    cancel: "取消",
    publishPublic: "发布公开页面",
    publicLive: "公开页面已上线",
    publicSummary:
      "获得一个持续更新的公开页面——一个始终同步您最新成果的链接，可放入邮件签名、ORCID 或个人网站。页面显示您的姓名、ORCID 和保留的论文；除非您在下方勾选，否则邮箱、电话和所在地不会公开。",
    openPage: "打开页面",
    copyLink: "复制链接",
    linkCopied: "链接已复制！",
    shareHint: "可将其添加到您的 ORCID 记录、网站或邮件签名中。",
    publishError: "无法更新公开页面——请重试。",
    publicContactLegend: "在公开页面显示",
    publicShowEmail: "电子邮箱",
    publicShowPhone: "电话",
    publicShowLocation: "所在地",
    allowIndexing: "允许搜索引擎索引此页面",
    allowIndexingBody:
      "这正是同事和招聘方在 Google 等搜索引擎中找到你工作的方式。建议开启——你可以随时关闭。可被索引的页面还可能被开放知识库和聚合平台通过 SigmaCV 的 OAI-PMH 接口（/api/oai）采集：即你的简历记录及其列出的成果（Dublin Core 或 OpenAIRE 格式）。是否列入你所在机构的集合是下方的另一项单独选择。",
    allowIndexingTitle:
      "默认关闭。开启后，您的公开简历可能出现在搜索结果中（姓名、ORCID、论文），也可能被开放知识库和聚合平台通过 OAI-PMH 接口采集。列入所在机构是另一项单独的选择。",
    listUnderAffiliation: "为知识库将我列入当前所属机构",
    listUnderAffiliationTitle:
      "默认关闭。开启后，使用 OAI-PMH 接口的采集方可以按你当前机构的 ROR 集合（ror:<id>）选取你的简历。需要先开启索引。",
    listUnderAffiliationBody:
      "将你的简历加入 OAI-PMH 中你第一个可见当前职位所属机构（以其 ROR 标识符）的集合，便于按机构采集的知识库或 CRIS 系统找到它。标注为你本人自述的所属机构，绝不作为机构的官方记录。所属机构变更时随简历更新；需要开启索引；默认关闭。某机构下已列出的研究者人数会在其机构页面（/i/<ror>）公开显示——仅为数量，绝不显示是谁。",
    listUnderAffiliationNoRor:
      "暂不可用：你可见的当前职位均未关联 ROR 机构记录。请重新同步，或在某个职位上设置机构。",
    showOnInstitutionPage: "在我所属机构的公开页面上显示我",
    showOnInstitutionPageTitle:
      "默认关闭。开启后，你的姓名、ORCID iD、当前职位以及你公开页面列出的成果会出现在你勾选的机构的公开页面（/i/<ROR id>）上并计入其统计。需要开启索引。可随时撤回，立即生效。",
    showOnInstitutionPageBody:
      "你的姓名、ORCID iD、当前职位以及你公开页面列出的成果会出现在 SigmaCV 上你所属机构的公开页面，并且你会被计入该页面的统计（有多少研究者列入该机构，以及他们成果的开放获取状态）。在 OpenAlex 的记录与你的记录不一致之处，只显示计数。固定到你在下方勾选的机构——所属机构变更时我们会重新询问，而不会自动迁移。你保留的来自先前所属机构的列入，会在该机构再次成为当前所属时恢复。列入完全自愿，未列入不代表任何含义。你可以随时撤回，立即生效。",
    institutionPagePick: "将我列入",
    institutionPageListedUnder: "你已列入 {institutions}。",
    institutionPageLapsed: "你的当前所属机构已变更：请确认是否列入 {institutions}。",
    institutionPageLapsedNone:
      "你的当前所属机构已变更，且你当前的职位均未关联 ROR 记录；在关联之前，你的列入已暂停。",
    institutionPageUnavailable: "不可用：需要开启搜索索引，并有一个关联 ROR 机构记录的当前职位。",
    institutionPageSingle: "勾选后你将列入 {institution}。",
    institutionPageArmedHint: "尚未列入——请在下方至少勾选一个机构。",
    institutionPageLapsedKept: "保留自先前所属机构：ROR {rorId}",
    institutionPageRemove: "移除",
    publishTitle:
      "在公开链接处创建此简历的可分享公开网页。它会随你的更新而重新同步。默认关闭；取消勾选可将其下线。",
    exportFormatTitle:
      "PDF 完全匹配您的模板。LaTeX 接近匹配（可编辑源文件）。Word 和 Markdown 为纯文本，可编辑，不含模板样式。",
    exportGroupDocuments: "文档",
    exportGroupData: "数据",
    exportGroupGrantCv: "资助方简历（按资助方样式组织的草稿）",
    exportPdf: "PDF — 可打印简历 (.pdf)",
    exportDocx: "Word — 纯文本，可编辑 (.docx)",
    exportLatexModern: "LaTeX — 可编辑源文件 (.tex)",
    exportMarkdown: "Markdown — 纯文本 (.md)",
    exportHtml: "HTML — 独立网页 (.html)",
    exportBibtex: "BibTeX — 论文列表 (.bib)",
    exportCslJson: "CSL-JSON — 引用交换格式 (.json)",
    exportJsonResume: "JSON Résumé — 标准架构 (.json)",
    exportRoCrate: "RO-Crate — 研究对象包 (.zip)",
    exportJson: "JSON — 简历原始数据 (.json)",
    exportBiosketch: "NIH biosketch — 草稿 (.md)",
    exportErc: "ERC — 业绩记录 (.md)",
    exportMsca: "MSCA — 业绩记录 (.md)",
    exportNsf: "NSF — 个人简介 (.md)",
    exportJsps: "JSPS/KAKENHI — 业绩记录 (.md)",
    itemUntitled: "无标题",
    dragItem: "拖动以重新排序",
    manualPlaceholder: "例如：访问研究员，MIT（2023）",
    entryTextAria: "条目文本",
    rolePlaceholder: "添加你的职称…",
    roleAria: "职务或头衔",
    revertToSource: "还原",
    revertToSourceHint: "放弃你的修改，恢复来自 ORCID/OpenAlex 的原始文本",
    matchedByIdentifier: "通过你的标识符匹配",
    matchedByIdOnly: "仅通过 OpenAlex ID 匹配——未经 ORCID 确认，请核查",
    photoTooLarge: "该图片过大——请尝试较小的图片。",
    previewTitle: "简历预览",
    previewRendering: "正在渲染预览…",
    previewEmpty: "预览将显示在此处。",
    linksNav: "链接",
    coffee: "☕ 请我喝杯咖啡",
    supportTitle: "SigmaCV 免费且非营利——一杯咖啡有助于支付运营成本。",
    showWorkIndicators: "在每篇论文上显示指标（RCR、FWCI、临床引用）",
    showWorkIndicatorsNote:
      "按 NIH iCite 与 OpenAlex 报告的单篇数值，各自附带说明，仅在有数据的论文上显示（RCR 与临床引用仅限生物医学）。不做求和、平均或排名。",
    showCollaboration: "显示合作广度（合作者所在国家/地区）",
    showCollaborationNote:
      "在研究概览中显示一行：作者列表涉及多少个国家/地区，以及跨两个及以上国家/地区的作品比例，数据来自 OpenAlex 机构信息。仅作描述——无地图、无排名。",
    showDataLinks: "在每篇论文下显示开放数据/代码链接",
    allowReaderMode: "在公开页面提供“审阅视图”",
    allowReaderModeTitle:
      "评审者可切换到一个视图，查看您的数据所包含的全部可信度与背景信号。默认关闭；您的标准页面不变。",
    allowReaderModeNote:
      "在您的动态简历页面添加一个小的“审阅视图”链接。该视图会开启：{list}；显示带有标记的已撤稿作品；并标注每项成果的来源。它绝不会添加您未选择的指标——那里没有任何内容是评分。",
    readerViewUrlLabel: "审阅视图：",
    readerViewUrlHint: "把此链接交给评审委员会——它会打开显示来源、核验与背景信号的页面。",
  },
  "es-ES": {
    pageSizeLabel: "Tamaño de página",
    pageSizeA4: "A4",
    pageSizeLetter: "Carta (EE. UU.)",
    showCoauthorLinks: "Mostrar coautores que están en SigmaCV",
    coauthorLinkable: "Permitir que otros CV de SigmaCV enlacen al mío",
    editDetails: "Editar detalles",
    departmentAria: "Departamento",
    institutionAria: "Institución",
    editInstitutionHint: "Editar el nombre de la institución",
    publicationYearAria: "Año",
    venueAria: "Revista / publicación",
    startYearAria: "Año de inicio",
    endYearAria: "Año de fin",
    ongoingLabel: "En curso",
    resyncForDates: "Vuelve a sincronizar para editar las fechas",
    styleLegend: "Estilo",
    templateLabel: "Plantilla",
    citationLabel: "Estilo de citas",
    yourStyles: "Tus estilos",
    journalStyles: "Estilos de revistas y sociedades",
    styleLoading: "Cargando estilo…",
    stylePickHint: "Elige cualquier estilo de revista; se aplicará a todas las citas.",
    styleLoadError: "No se pudo cargar ese estilo.",
    styleNetworkError: "Error de red: inténtalo de nuevo.",
    fontLabel: "Fuente",
    densityLabel: "Densidad",
    fontSizeLabel: "Tamaño de fuente",
    accentLabel: "Color de acento",
    customAccent: "Color de acento personalizado",
    highlightSelf: "Resaltar mi nombre",
    highlightStyleLabel: "Estilo de resaltado",
    metricsLabel: "Métricas (opcional; ninguna por defecto)",
    metricNoData: "(sin datos)",
    metricsPreset: "Preajuste de métricas responsables",
    metricsPresetNote:
      "Solo indicadores normalizados por campo (DORA / Leiden); evita aproximaciones a nivel de revista como el Impact Factor.",
    authorshipLabel: "Tabla resumen de autoría (solo revisado por pares)",
    authorshipNote:
      "Añade una tabla que cuenta con qué frecuencia eres primer/último autor, autor de correspondencia, etc. Los preprints no se cuentan.",
    authorshipResyncNote:
      "⚠ Estos recuentos están vacíos para tus publicaciones existentes. Haz clic en Resincronizar (arriba a la derecha) para obtener las posiciones de autoría desde OpenAlex.",
    showCharts: "Mostrar gráficos (publicaciones y citas / año)",
    showResearchAreas: "Mostrar áreas de investigación (campos principales)",
    showOutputLedger: "Mostrar resumen de producción (recuento por tipo)",
    holdNewForReview: "Revisar los trabajos nuevos antes de mostrarlos",
    featureItem: "Marcar como publicación destacada / seleccionada",
    showOpenAccess: "Distintivos de acceso abierto",
    showOpenAccessShare: "Porcentaje de acceso abierto en la cabecera",
    summaryBlockLabel: "Resumen de investigación",
    summaryPosHeader: "En el encabezado",
    summaryPosTop: "Como sección propia",
    summaryPosBottom: "Al final",
    summaryPosHidden: "Oculto",
    summaryHeadingLabel: "Título (opcional)",
    hideRetracted: "Ocultar publicaciones retractadas",
    showAuthorRole: "Mostrar mi rol de autor (primero / último / correspondencia)",
    showCitationCounts: "Mostrar el número de citas en cada publicación",
    showVerifiedBadges:
      "Marcar los puestos y estudios confirmados por la institución mediante ORCID",
    showReplications: "Mostrar evidencia de replicación en las publicaciones (FORRT/FReD)",
    showArchivalStatus:
      "Mostrar el estado de archivo de Software Heritage en los elementos de software",
    showPublicEvaluations: "Mostrar evaluaciones públicas en los preprints (Sciety)",
    showProvenance: "Pie de página con la procedencia de los datos",
    peerReviewedOnly: "Ocultar preprints y trabajos no revisados por pares",
    peerReviewedOnlyTitle:
      "Elimina TODOS los trabajos no revisados por pares del CV, incluida toda tu sección de Preprints. Déjalo DESACTIVADO para mantener los preprints listados (en su propia sección).",
    peerReviewedOnlyNote:
      "Por defecto, los preprints se conservan pero se listan en una sección «Preprints» aparte. Actívalo solo si quieres eliminarlos por completo.",
    countLetters: "Incluir cartas (correspondencia)",
    countLettersTitle:
      "Las cartas/correspondencia de investigación publicadas en revistas están revisadas por pares, por lo que se listan y cuentan (gráficos, métricas, tabla de autoría) de forma predeterminada. Desactívalo para una vista solo de artículos que omite las cartas de la lista y las cifras. Los preprints se controlan aparte (arriba).",
    countLettersNote:
      "Activado por defecto: las cartas están revisadas por pares. Desactivado = solo artículos.",
    shownSuffix: "mostrados",
    dragSection: "Arrastra para reordenar la sección",
    sectionTitleAria: "Título de la sección",
    moveSectionUp: "Subir la sección",
    moveSectionDown: "Bajar la sección",
    grantsPlaceholder: "Añade una financiación, p. ej. Proyecto PID (AEI), 250 k € (2024–2027)",
    addEntryAria: "Añadir una entrada",
    tplClassic: "Clásica",
    tplModern: "Moderna",
    tplMinimal: "Minimalista",
    tplCompact: "Compacta",
    tplSidebar: "Barra lateral (foto)",
    tplEditorial: "Editorial",
    tplAts: "Compatible con ATS",
    hlAccent: "Color de acento",
    hlBold: "Negrita",
    hlUnderline: "Subrayado",
    hlAccentUnderline: "Acento + subrayado",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Cómoda",
    densityCompact: "Compacta",
    stopContributing: "Dejar de contribuir a la investigación",
    stopContributingTitle:
      "Actualmente contribuyes con datos de curación anonimizados a la investigación. Haz clic para detenerlo y desactivarlo.",
    exportData: "Exportar mis datos",
    deleteAccount: "Eliminar cuenta",
    deleteConfirm:
      "¿Eliminar permanentemente tu cuenta y todos los datos asociados? Esta acción no se puede deshacer.",
    deleteFailed: "No se pudo eliminar la cuenta. Inténtalo de nuevo.",
    consentWithdrawFailed: "No se pudo retirar el consentimiento. Inténtalo de nuevo.",
    cancel: "Cancelar",
    publishPublic: "Publicar página pública",
    publicLive: "La página pública está activa",
    publicSummary:
      "Consigue una página pública viva: un enlace que siempre se sincroniza con tu trabajo más reciente, ideal para tu firma de correo, ORCID o web. Muestra tu nombre, ORCID y las publicaciones que conservaste; tu correo, teléfono y ubicación quedan privados salvo que los actives abajo.",
    openPage: "Abrir página",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado!",
    shareHint: "Añádelo a tu registro ORCID, tu web o tu firma de correo.",
    publishError: "No se pudo actualizar la página pública: inténtalo de nuevo.",
    publicContactLegend: "Mostrar en la página pública",
    publicShowEmail: "Correo electrónico",
    publicShowPhone: "Teléfono",
    publicShowLocation: "Ubicación",
    allowIndexing: "Permitir que los buscadores indexen esta página",
    allowIndexingBody:
      "Así es como colegas y empleadores encuentran tu trabajo en Google y otros buscadores. Recomendado: puedes desactivarlo cuando quieras. Una página indexable también puede ser recolectada por repositorios abiertos y agregadores a través del punto de acceso OAI-PMH de SigmaCV (/api/oai): el registro de tu CV y los trabajos que enumera, en formato Dublin Core u OpenAIRE. Aparecer bajo tu institución es una elección aparte, más abajo.",
    allowIndexingTitle:
      "Desactivado por defecto. Si se activa, tu CV público puede aparecer en los resultados de búsqueda (nombre, ORCID, publicaciones) y puede ser recolectado por repositorios abiertos y agregadores a través del punto de acceso OAI-PMH. Aparecer bajo tu institución es una opción aparte.",
    listUnderAffiliation: "Incluirme bajo mi afiliación actual para los repositorios",
    listUnderAffiliationTitle:
      "Desactivado por defecto. Si se activa, los recolectores que usan el punto de acceso OAI-PMH pueden seleccionar tu CV por el conjunto ROR de tu institución actual (ror:<id>). Requiere la indexación.",
    listUnderAffiliationBody:
      "Añade tu CV al conjunto OAI-PMH de la institución de tu primer puesto actual visible (su identificador ROR), para que un repositorio o CRIS que recolecta por institución pueda encontrarlo. Se etiqueta como afiliación declarada por ti, nunca como registro de tu institución. Sigue a tu CV si cambia tu afiliación; requiere la indexación; desactivado por defecto. El número de investigadores listados bajo una institución se muestra públicamente en su página de institución (/i/<ror>): solo una cifra, nunca quiénes.",
    listUnderAffiliationNoRor:
      "Aún no disponible: ninguno de tus puestos actuales visibles está vinculado a un registro institucional ROR. Vuelve a sincronizar o indica la institución en un puesto.",
    showOnInstitutionPage: "Mostrarme en la página pública de mi institución",
    showOnInstitutionPageTitle:
      "Desactivado por defecto. Al activarlo, tu nombre, ORCID iD, puesto actual y las obras que lista tu página pública aparecen en la página pública de las instituciones que marques (/i/<ROR id>) y cuentan en sus cifras. Requiere la indexación. Puedes retirarlo en cualquier momento, con efecto inmediato.",
    showOnInstitutionPageBody:
      "Tu nombre, ORCID iD, puesto actual y las obras que lista tu página pública aparecen en la página pública de tu institución en SigmaCV, y cuentas en las cifras de la página (cuántos investigadores la indican y el estado de acceso abierto de sus obras). Donde el registro de OpenAlex y el tuyo difieren, solo se muestran recuentos. Se fija a las instituciones que marques abajo: si tu afiliación cambia, te lo preguntamos de nuevo en lugar de moverte. Una inclusión que conserves de una afiliación anterior se reanuda si esa afiliación vuelve a ser actual. Aparecer es voluntario y no aparecer no significa nada. Puedes retirarlo en cualquier momento, con efecto inmediato.",
    institutionPagePick: "Listarme bajo",
    institutionPageListedUnder: "Apareces bajo {institutions}.",
    institutionPageLapsed:
      "Tu afiliación actual ha cambiado: confirma si quieres aparecer bajo {institutions}.",
    institutionPageLapsedNone:
      "Tu afiliación actual ha cambiado y ninguno de tus puestos actuales está vinculado a un registro ROR; tu listado queda en pausa hasta que lo esté.",
    institutionPageUnavailable:
      "No disponible: requiere la indexación en buscadores y un puesto actual vinculado a un registro de institución ROR.",
    institutionPageSingle: "Al marcarlo aparecerás bajo {institution}.",
    institutionPageArmedHint: "Aún no apareces en ninguna: marca al menos una institución abajo.",
    institutionPageLapsedKept: "Conservado de una afiliación anterior: ROR {rorId}",
    institutionPageRemove: "Quitar",
    publishTitle:
      "Crea una página web pública de este CV en un enlace público que se puede compartir. Se resincroniza a medida que lo actualizas. Desactivada por defecto; desmárcala para retirarla.",
    exportFormatTitle:
      "El PDF coincide exactamente con tu plantilla. LaTeX la sigue de cerca (código editable). Word y Markdown son texto sencillo y editable, sin estilo de plantilla.",
    exportGroupDocuments: "Documentos",
    exportGroupData: "Datos",
    exportGroupGrantCv: "CV para financiación (borradores según la convocatoria)",
    exportPdf: "PDF — CV listo para imprimir (.pdf)",
    exportDocx: "Word — sencillo, editable (.docx)",
    exportLatexModern: "LaTeX — código editable (.tex)",
    exportMarkdown: "Markdown — texto sin formato (.md)",
    exportHtml: "HTML — página web independiente (.html)",
    exportBibtex: "BibTeX — lista de publicaciones (.bib)",
    exportCslJson: "CSL-JSON — intercambio de citas (.json)",
    exportJsonResume: "JSON Résumé — esquema estándar (.json)",
    exportRoCrate: "RO-Crate — paquete de objeto de investigación (.zip)",
    exportJson: "JSON — datos del CV (.json)",
    exportBiosketch: "NIH biosketch — borrador (.md)",
    exportErc: "ERC — trayectoria (.md)",
    exportMsca: "MSCA — trayectoria (.md)",
    exportNsf: "NSF — reseña biográfica (.md)",
    exportJsps: "JSPS/KAKENHI — trayectoria (.md)",
    itemUntitled: "Sin título",
    dragItem: "Arrastra para reordenar",
    manualPlaceholder: "p. ej. Investigador visitante, MIT (2023)",
    entryTextAria: "Texto de la entrada",
    rolePlaceholder: "Añade tu cargo…",
    roleAria: "Cargo o título",
    revertToSource: "Restaurar",
    revertToSourceHint: "Descartar tu edición y restaurar el texto original de ORCID/OpenAlex",
    matchedByIdentifier: "Coincidencia por tu identificador",
    matchedByIdOnly: "Coincidencia solo por ID de OpenAlex — sin confirmar por ORCID; revísalo",
    photoTooLarge: "Esa imagen es demasiado grande; prueba con una más pequeña.",
    previewTitle: "Vista previa del CV",
    previewRendering: "Generando vista previa…",
    previewEmpty: "La vista previa aparecerá aquí.",
    linksNav: "Enlaces",
    coffee: "☕ Invítame a un café",
    supportTitle: "SigmaCV es gratuito y sin ánimo de lucro: un café ayuda a cubrir sus costes.",
    showWorkIndicators: "Mostrar indicadores por publicación (RCR, FWCI, citas clínicas)",
    showWorkIndicatorsNote:
      "Valores por trabajo tal como los reportan NIH iCite y OpenAlex, cada uno con su propia advertencia, mostrados solo en los trabajos que los tienen (RCR y citas clínicas son solo biomédicos). Nada se suma, promedia ni clasifica.",
    showCollaboration: "Mostrar amplitud de colaboración (países de los coautores)",
    showCollaborationNote:
      "Una línea en el resumen de investigación: cuántos países aparecen en tus listas de autores y qué proporción de trabajos abarca al menos dos, según las afiliaciones de OpenAlex. Solo descriptivo: sin mapa ni clasificación.",
    showDataLinks: "Mostrar enlaces a datos abiertos / código bajo cada publicación",
    allowReaderMode: "Ofrecer una «vista para evaluadores» en la página pública",
    allowReaderModeTitle:
      "Los evaluadores pueden cambiar a una vista que revela todas las señales de confianza y contexto que contienen tus datos. Desactivada por defecto; tu página estándar no cambia.",
    allowReaderModeNote:
      "Añade un pequeño enlace «Vista para evaluadores» a tu página viva. Esa vista activa: {list}; muestra los trabajos retractados con su distintivo; y marca en cada trabajo de dónde procede. Nunca añade métricas que no hayas elegido: nada de lo que aparece allí es una puntuación.",
    readerViewUrlLabel: "Vista para evaluadores:",
    readerViewUrlHint:
      "Entrega este enlace a un comité: abre tu página con las señales de procedencia, verificación y contexto visibles.",
  },
  "fr-FR": {
    pageSizeLabel: "Format de page",
    pageSizeA4: "A4",
    pageSizeLetter: "Lettre US",
    showCoauthorLinks: "Afficher les co-auteurs présents sur SigmaCV",
    coauthorLinkable: "Autoriser d'autres CV SigmaCV à pointer vers le mien",
    editDetails: "Modifier les détails",
    departmentAria: "Service / département",
    institutionAria: "Établissement",
    editInstitutionHint: "Modifier le nom de l'établissement",
    publicationYearAria: "Année",
    venueAria: "Revue / support",
    startYearAria: "Année de début",
    endYearAria: "Année de fin",
    ongoingLabel: "En cours",
    resyncForDates: "Resynchronisez pour modifier les dates",
    styleLegend: "Style",
    templateLabel: "Modèle",
    citationLabel: "Style de citation",
    yourStyles: "Vos styles",
    journalStyles: "Styles de revues et de sociétés savantes",
    styleLoading: "Chargement du style…",
    stylePickHint: "Choisissez n’importe quel style de revue — appliqué à toutes les citations.",
    styleLoadError: "Impossible de charger ce style.",
    styleNetworkError: "Erreur réseau — veuillez réessayer.",
    fontLabel: "Police",
    densityLabel: "Densité",
    fontSizeLabel: "Taille de police",
    accentLabel: "Accent",
    customAccent: "Couleur d’accent personnalisée",
    highlightSelf: "Mettre mon nom en évidence",
    highlightStyleLabel: "Style de mise en évidence",
    metricsLabel: "Indicateurs (facultatif — aucun par défaut)",
    metricNoData: "(aucune donnée)",
    metricsPreset: "Préréglage des indicateurs responsables",
    metricsPresetNote:
      "Indicateurs normalisés par discipline uniquement (DORA / Leiden) — évite les approximations à l’échelle de la revue comme l’Impact Factor.",
    authorshipLabel:
      "Tableau récapitulatif des rôles d’auteur (articles évalués par les pairs uniquement)",
    authorshipNote:
      "Ajoute un tableau comptabilisant la fréquence à laquelle vous êtes premier / dernier / auteur correspondant, etc. Les pré-publications ne sont pas comptabilisées.",
    authorshipResyncNote:
      "⚠ Ces décomptes sont vides pour vos publications existantes. Cliquez sur Resynchroniser (en haut à droite) pour récupérer les positions des auteurs depuis OpenAlex.",
    showCharts: "Afficher les graphiques (publications et citations / an)",
    showResearchAreas: "Afficher les domaines de recherche (principaux champs)",
    showOutputLedger: "Afficher le résumé de la production (nombre par type)",
    holdNewForReview: "Vérifier les nouveaux travaux avant de les afficher",
    featureItem: "Marquer comme publication sélectionnée / mise en avant",
    showOpenAccess: "Badges de libre accès",
    showOpenAccessShare: "Part en libre accès dans l'en-tête",
    summaryBlockLabel: "Synthèse de recherche",
    summaryPosHeader: "Dans l'en-tête",
    summaryPosTop: "Section dédiée",
    summaryPosBottom: "À la fin",
    summaryPosHidden: "Masqué",
    summaryHeadingLabel: "Titre (facultatif)",
    hideRetracted: "Masquer les publications rétractées",
    showAuthorRole: "Afficher mon rôle d’auteur (premier / dernier / correspondant)",
    showCitationCounts: "Afficher le nombre de citations sur chaque publication",
    showVerifiedBadges: "Marquer les postes et formations confirmés par l’établissement via ORCID",
    showReplications: "Afficher les preuves de réplication sur les publications (FORRT/FReD)",
    showArchivalStatus:
      "Afficher le statut d'archivage Software Heritage sur les éléments logiciels",
    showPublicEvaluations: "Afficher les évaluations publiques sur les prépublications (Sciety)",
    showProvenance: "Pied de page sur la provenance des données",
    peerReviewedOnly: "Masquer les pré-publications et les travaux non évalués par les pairs",
    peerReviewedOnlyTitle:
      "Supprime du CV TOUS les travaux non évalués par les pairs, y compris l’intégralité de votre section Pré-publications. Laissez cette option DÉSACTIVÉE pour conserver les pré-publications dans la liste (dans leur propre section).",
    peerReviewedOnlyNote:
      "Par défaut, les pré-publications sont conservées mais regroupées dans une section « Pré-publications » distincte. N’activez cette option que si vous souhaitez les supprimer entièrement.",
    countLetters: "Inclure les lettres (correspondance)",
    countLettersTitle:
      "Les lettres / correspondances de recherche publiées dans des revues sont évaluées par les pairs ; elles sont donc listées et comptées (graphiques, métriques, tableau de qualité d’auteur) par défaut. Désactivez pour une vue articles uniquement qui retire les lettres de la liste et des figures. Les prépublications sont gérées à part (ci-dessus).",
    countLettersNote:
      "Activé par défaut — les lettres sont évaluées par les pairs. Désactivé = articles uniquement.",
    shownSuffix: "affiché(s)",
    dragSection: "Faire glisser pour réordonner la section",
    sectionTitleAria: "Titre de la section",
    moveSectionUp: "Déplacer la section vers le haut",
    moveSectionDown: "Déplacer la section vers le bas",
    grantsPlaceholder: "Ajoutez un financement, p. ex. ANR JCJC, 250 k€ (2024–2027)",
    addEntryAria: "Ajouter une entrée",
    tplClassic: "Classique",
    tplModern: "Moderne",
    tplMinimal: "Minimal",
    tplCompact: "Compact",
    tplSidebar: "Barre latérale (photo)",
    tplEditorial: "Éditorial",
    tplAts: "Compatible ATS",
    hlAccent: "Couleur d’accent",
    hlBold: "Gras",
    hlUnderline: "Souligné",
    hlAccentUnderline: "Accent + souligné",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Confortable",
    densityCompact: "Compact",
    stopContributing: "Cesser de contribuer à la recherche",
    stopContributingTitle:
      "Vous contribuez actuellement à la recherche en partageant des données de curation anonymisées. Cliquez pour arrêter et désactiver cette option.",
    exportData: "Exporter mes données",
    deleteAccount: "Supprimer le compte",
    deleteConfirm:
      "Supprimer définitivement votre compte et toutes les données associées ? Cette action est irréversible.",
    deleteFailed: "Échec de la suppression du compte. Veuillez réessayer.",
    consentWithdrawFailed: "Échec du retrait du consentement. Veuillez réessayer.",
    cancel: "Annuler",
    publishPublic: "Publier la page publique",
    publicLive: "La page publique est en ligne",
    publicSummary:
      "Obtenez une page publique vivante : un seul lien toujours synchronisé avec vos derniers travaux, pour votre signature d’e-mail, votre ORCID ou votre site. Elle affiche votre nom, votre ORCID et les publications conservées ; vos e-mail, téléphone et localisation restent privés, sauf si vous les activez ci-dessous.",
    openPage: "Ouvrir la page",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié !",
    shareHint: "Ajoutez-le à votre fiche ORCID, votre site ou votre signature e-mail.",
    publishError: "Impossible de mettre à jour la page publique — veuillez réessayer.",
    publicContactLegend: "Afficher sur la page publique",
    publicShowEmail: "E-mail",
    publicShowPhone: "Téléphone",
    publicShowLocation: "Localisation",
    allowIndexing: "Autoriser l’indexation par les moteurs de recherche",
    allowIndexingBody:
      "C'est ainsi que vos collègues et recruteurs trouvent vos travaux dans Google et les autres moteurs de recherche. Recommandé — vous pouvez le désactiver à tout moment. Une page indexable peut aussi être moissonnée par des dépôts ouverts et des agrégateurs via le point d'accès OAI-PMH de SigmaCV (/api/oai) : la notice de votre CV et les travaux qu'il liste, au format Dublin Core ou OpenAIRE. Figurer sous votre établissement est un choix distinct, ci-dessous.",
    allowIndexingTitle:
      "Désactivé par défaut. Activé, votre CV public peut apparaître dans les résultats de recherche (nom, ORCID, publications) et être moissonné par des dépôts ouverts et des agrégateurs via le point d'accès OAI-PMH. Figurer sous votre établissement est une option distincte.",
    listUnderAffiliation: "Me lister sous mon affiliation actuelle pour les dépôts",
    listUnderAffiliationTitle:
      "Désactivé par défaut. Activé, les moissonneurs qui utilisent le point d'accès OAI-PMH peuvent sélectionner votre CV par l'ensemble ROR de votre établissement actuel (ror:<id>). Nécessite l'indexation.",
    listUnderAffiliationBody:
      "Ajoute votre CV à l'ensemble OAI-PMH de l'établissement de votre premier poste actuel visible (son identifiant ROR), pour qu'un dépôt ou un CRIS qui moissonne par établissement puisse le trouver. Étiqueté comme votre affiliation auto-déclarée, jamais comme un registre de votre établissement. Suit votre CV si votre affiliation change ; nécessite l'indexation ; désactivé par défaut. Le nombre de chercheurs listés sous un établissement est affiché publiquement sur sa page d'établissement (/i/<ror>) : un simple décompte, jamais qui.",
    listUnderAffiliationNoRor:
      "Pas encore disponible : aucun de vos postes actuels visibles n'est relié à une fiche d'établissement ROR. Resynchronisez, ou renseignez l'établissement sur un poste.",
    showOnInstitutionPage: "M'afficher sur la page publique de mon établissement",
    showOnInstitutionPageTitle:
      "Désactivé par défaut. Une fois activé, votre nom, votre ORCID iD, votre poste actuel et les travaux listés sur votre page publique apparaissent sur la page publique des établissements que vous cochez (/i/<ROR id>) et sont comptés dans ses chiffres. Nécessite l'indexation. Retrait possible à tout moment, avec effet immédiat.",
    showOnInstitutionPageBody:
      "Votre nom, votre ORCID iD, votre poste actuel et les travaux listés sur votre page publique apparaissent sur la page publique de votre établissement sur SigmaCV, et vous êtes compté dans les chiffres de la page (combien de chercheurs l'indiquent, et le statut d'accès ouvert de leurs travaux). Là où les données d'OpenAlex et les vôtres diffèrent, seuls des décomptes sont affichés. Épinglé aux établissements que vous cochez ci-dessous : si votre affiliation change, nous vous redemandons au lieu de vous déplacer. Une inscription que vous conservez d'une affiliation antérieure reprend si cette affiliation redevient actuelle. Figurer est volontaire et l'absence ne signifie rien. Vous pouvez vous retirer à tout moment, avec effet immédiat.",
    institutionPagePick: "Me lister sous",
    institutionPageListedUnder: "Vous figurez sous {institutions}.",
    institutionPageLapsed:
      "Votre affiliation actuelle a changé : confirmez si vous souhaitez figurer sous {institutions}.",
    institutionPageLapsedNone:
      "Votre affiliation actuelle a changé et aucun de vos postes actuels n'est lié à un registre ROR ; votre inscription est suspendue jusqu'à ce qu'un le soit.",
    institutionPageUnavailable:
      "Indisponible : nécessite l'indexation par les moteurs de recherche et un poste actuel lié à un registre d'établissement ROR.",
    institutionPageSingle: "En cochant, vous figurerez sous {institution}.",
    institutionPageArmedHint:
      "Vous ne figurez encore nulle part : cochez au moins un établissement ci-dessous.",
    institutionPageLapsedKept: "Conservé d'une affiliation antérieure : ROR {rorId}",
    institutionPageRemove: "Retirer",
    publishTitle:
      "Crée une page web publique partageable de ce CV via un lien public. Elle se resynchronise au fur et à mesure de vos mises à jour. Désactivée par défaut ; décochez pour la mettre hors ligne.",
    exportFormatTitle:
      "Le PDF correspond exactement à votre modèle. LaTeX le suit fidèlement (source modifiable). Word et Markdown sont du texte brut et modifiable, sans style de modèle.",
    exportGroupDocuments: "Documents",
    exportGroupData: "Données",
    exportGroupGrantCv: "CV de financement (brouillons selon le financeur)",
    exportPdf: "PDF — CV prêt à imprimer (.pdf)",
    exportDocx: "Word — simple, modifiable (.docx)",
    exportLatexModern: "LaTeX — source modifiable (.tex)",
    exportMarkdown: "Markdown — texte brut (.md)",
    exportHtml: "HTML — page web autonome (.html)",
    exportBibtex: "BibTeX — liste de publications (.bib)",
    exportCslJson: "CSL-JSON — échange de citations (.json)",
    exportJsonResume: "JSON Résumé — schéma standard (.json)",
    exportRoCrate: "RO-Crate — objet de recherche (.zip)",
    exportJson: "JSON — données du CV (.json)",
    exportBiosketch: "NIH biosketch — brouillon (.md)",
    exportErc: "ERC — parcours (.md)",
    exportMsca: "MSCA — parcours (.md)",
    exportNsf: "NSF — notice biographique (.md)",
    exportJsps: "JSPS/KAKENHI — parcours (.md)",
    itemUntitled: "Sans titre",
    dragItem: "Faire glisser pour réordonner",
    manualPlaceholder: "p. ex. Chercheur invité, MIT (2023)",
    entryTextAria: "Texte de l’entrée",
    rolePlaceholder: "Ajoutez votre fonction…",
    roleAria: "Fonction ou intitulé",
    revertToSource: "Rétablir",
    revertToSourceHint:
      "Annuler votre modification et rétablir le texte d’origine d’ORCID/OpenAlex",
    matchedByIdentifier: "Identifié par votre identifiant",
    matchedByIdOnly: "Identifié par l’ID OpenAlex seul — non confirmé par ORCID ; à vérifier",
    photoTooLarge: "Cette image est trop volumineuse — essayez-en une plus petite.",
    previewTitle: "Aperçu du CV",
    previewRendering: "Génération de l’aperçu…",
    previewEmpty: "L’aperçu apparaîtra ici.",
    linksNav: "Liens",
    coffee: "☕ Offrez-moi un café",
    supportTitle: "SigmaCV est gratuit et à but non lucratif — un café aide à payer les frais.",
    showWorkIndicators: "Afficher des indicateurs par publication (RCR, FWCI, citations cliniques)",
    showWorkIndicatorsNote:
      "Valeurs par travail telles que rapportées par NIH iCite et OpenAlex, chacune avec sa propre réserve, affichées uniquement sur les travaux qui en ont (RCR et citations cliniques : biomédical uniquement). Rien n’est additionné, moyenné ni classé.",
    showCollaboration: "Afficher l'étendue des collaborations (pays des co-auteurs)",
    showCollaborationNote:
      "Une ligne dans le résumé de recherche : combien de pays figurent dans vos listes d'auteurs et quelle part des travaux en réunit au moins deux, d'après les affiliations OpenAlex. Purement descriptif : ni carte ni classement.",
    showDataLinks: "Afficher les liens vers les données ouvertes / le code sous chaque publication",
    allowReaderMode: "Proposer une « vue évaluateur » sur la page publique",
    allowReaderModeTitle:
      "Les évaluateurs peuvent basculer vers une vue qui révèle tous les signaux de confiance et de contexte contenus dans vos données. Désactivé par défaut ; votre page standard reste inchangée.",
    allowReaderModeNote:
      "Ajoute un petit lien « Vue évaluateur » à votre page vivante. Cette vue active : {list} ; affiche les travaux rétractés avec leur badge ; et indique, pour chaque travail, d'où il provient. Elle n'ajoute jamais d'indicateurs que vous n'avez pas choisis — rien n'y est un score.",
    readerViewUrlLabel: "Vue évaluateur :",
    readerViewUrlHint:
      "Transmettez ce lien à un comité : il ouvre votre page avec les signaux de provenance, de vérification et de contexte affichés.",
  },
  "de-DE": {
    pageSizeLabel: "Seitenformat",
    pageSizeA4: "A4",
    pageSizeLetter: "US Letter",
    showCoauthorLinks: "Mitautor:innen auf SigmaCV anzeigen",
    coauthorLinkable: "Anderen SigmaCV-Lebensläufen erlauben, auf meinen zu verlinken",
    editDetails: "Details bearbeiten",
    departmentAria: "Abteilung",
    institutionAria: "Einrichtung",
    editInstitutionHint: "Namen der Einrichtung bearbeiten",
    publicationYearAria: "Jahr",
    venueAria: "Zeitschrift / Publikationsort",
    startYearAria: "Startjahr",
    endYearAria: "Endjahr",
    ongoingLabel: "Laufend",
    resyncForDates: "Zum Bearbeiten der Daten neu synchronisieren",
    styleLegend: "Stil",
    templateLabel: "Vorlage",
    citationLabel: "Zitierstil",
    yourStyles: "Ihre Stile",
    journalStyles: "Zeitschriften- & Gesellschaftsstile",
    styleLoading: "Stil wird geladen…",
    stylePickHint:
      "Wählen Sie einen beliebigen Zeitschriftenstil — wird auf jedes Zitat angewendet.",
    styleLoadError: "Dieser Stil konnte nicht geladen werden.",
    styleNetworkError: "Netzwerkfehler — bitte erneut versuchen.",
    fontLabel: "Schriftart",
    densityLabel: "Dichte",
    fontSizeLabel: "Schriftgröße",
    accentLabel: "Akzent",
    customAccent: "Eigene Akzentfarbe",
    highlightSelf: "Meinen Namen hervorheben",
    highlightStyleLabel: "Hervorhebungsstil",
    metricsLabel: "Kennzahlen (optional — standardmäßig keine)",
    metricNoData: "(keine Daten)",
    metricsPreset: "Voreinstellung für verantwortungsvolle Kennzahlen",
    metricsPresetNote:
      "Nur feldnormalisierte Indikatoren (DORA / Leiden) — vermeidet zeitschriftenbasierte Näherungswerte wie den Impact Factor.",
    authorshipLabel: "Autorschafts-Übersichtstabelle (nur peer-reviewt)",
    authorshipNote:
      "Fügt eine Tabelle hinzu, die zählt, wie oft Sie Erst-/Letzt-/korrespondierende:r Autor:in usw. sind. Preprints werden nicht gezählt.",
    authorshipResyncNote:
      "⚠ Diese Zählungen sind für Ihre bestehenden Publikationen leer. Klicken Sie auf Re-sync (oben rechts), um die Autorenpositionen von OpenAlex abzurufen.",
    showCharts: "Diagramme anzeigen (Publikationen & Zitationen / Jahr)",
    showResearchAreas: "Forschungsgebiete anzeigen (Hauptfelder)",
    showOutputLedger: "Forschungsoutput-Übersicht anzeigen (Anzahl je Typ)",
    holdNewForReview: "Neue Arbeiten vor dem Anzeigen prüfen",
    featureItem: "Als ausgewählte / hervorgehobene Publikation markieren",
    showOpenAccess: "Open-Access-Abzeichen",
    showOpenAccessShare: "Open-Access-Anteil im Kopfbereich",
    summaryBlockLabel: "Forschungsüberblick",
    summaryPosHeader: "Im Kopfbereich",
    summaryPosTop: "Als eigener Abschnitt",
    summaryPosBottom: "Am Ende",
    summaryPosHidden: "Ausgeblendet",
    summaryHeadingLabel: "Überschrift (optional)",
    hideRetracted: "Zurückgezogene Publikationen ausblenden",
    showAuthorRole: "Meine Autorenrolle anzeigen (Erst-/Letzt-/korrespondierend)",
    showCitationCounts: "Zitationszahl bei jeder Publikation anzeigen",
    showVerifiedBadges:
      "Positionen & Ausbildung markieren, die die Institution über ORCID bestätigt hat",
    showReplications: "Replikationsnachweise bei Publikationen anzeigen (FORRT/FReD)",
    showArchivalStatus: "Software-Heritage-Archivierungsstatus bei Software-Einträgen anzeigen",
    showPublicEvaluations: "Öffentliche Begutachtungen bei Preprints anzeigen (Sciety)",
    showProvenance: "Fußzeile zur Datenherkunft",
    peerReviewedOnly: "Preprints & nicht peer-reviewte Arbeiten ausblenden",
    peerReviewedOnlyTitle:
      "Entfernt ALLE nicht peer-reviewten Arbeiten aus dem Lebenslauf, einschließlich Ihres gesamten Preprints-Abschnitts. Lassen Sie dies AUS, um Preprints (in einem eigenen Abschnitt) aufgeführt zu lassen.",
    peerReviewedOnlyNote:
      "Standardmäßig werden Preprints beibehalten, aber in einem separaten Abschnitt „Preprints“ aufgeführt. Aktivieren Sie dies nur, wenn Sie sie vollständig entfernen möchten.",
    countLetters: "Briefe (Korrespondenz) einbeziehen",
    countLettersTitle:
      "In Zeitschriften veröffentlichte Briefe/Forschungskorrespondenz sind begutachtet und werden daher standardmäßig aufgeführt und gezählt (Diagramme, Kennzahlen, Autorschaftstabelle). Ausschalten für eine reine Artikel-Ansicht, die Briefe aus Liste und Kennzahlen entfernt. Preprints werden separat gesteuert (oben).",
    countLettersNote: "Standardmäßig an — Briefe sind begutachtet. Aus = nur Artikel.",
    shownSuffix: "angezeigt",
    dragSection: "Ziehen, um den Abschnitt neu anzuordnen",
    sectionTitleAria: "Abschnittstitel",
    moveSectionUp: "Abschnitt nach oben verschieben",
    moveSectionDown: "Abschnitt nach unten verschieben",
    grantsPlaceholder: "Fördermittel hinzufügen, z. B. DFG-Sachbeihilfe, 250 Tsd. € (2024–2027)",
    addEntryAria: "Eintrag hinzufügen",
    tplClassic: "Klassisch",
    tplModern: "Modern",
    tplMinimal: "Minimal",
    tplCompact: "Kompakt",
    tplSidebar: "Seitenleiste (Foto)",
    tplEditorial: "Redaktionell",
    tplAts: "ATS-freundlich",
    hlAccent: "Akzentfarbe",
    hlBold: "Fett",
    hlUnderline: "Unterstrichen",
    hlAccentUnderline: "Akzent + unterstrichen",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Komfortabel",
    densityCompact: "Kompakt",
    stopContributing: "Beitrag zur Forschung beenden",
    stopContributingTitle:
      "Sie tragen derzeit anonymisierte Kurationsdaten zur Forschung bei. Klicken Sie, um dies zu beenden und abzuschalten.",
    exportData: "Meine Daten exportieren",
    deleteAccount: "Konto löschen",
    deleteConfirm:
      "Ihr Konto und alle zugehörigen Daten dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.",
    deleteFailed: "Konto konnte nicht gelöscht werden. Bitte erneut versuchen.",
    consentWithdrawFailed: "Einwilligung konnte nicht widerrufen werden. Bitte erneut versuchen.",
    cancel: "Abbrechen",
    publishPublic: "Öffentliche Seite veröffentlichen",
    publicLive: "Öffentliche Seite ist online",
    publicSummary:
      "Erhalten Sie eine lebendige öffentliche Seite – ein Link, der stets mit Ihren neuesten Arbeiten synchron ist, für Ihre E-Mail-Signatur, ORCID oder Website. Sie zeigt Ihren Namen, Ihre ORCID und die behaltenen Publikationen; E-Mail, Telefon und Standort bleiben privat, sofern Sie sie unten nicht aktivieren.",
    openPage: "Seite öffnen",
    copyLink: "Link kopieren",
    linkCopied: "Link kopiert!",
    shareHint: "Fügen Sie ihn Ihrem ORCID-Eintrag, Ihrer Website oder E-Mail-Signatur hinzu.",
    publishError:
      "Die öffentliche Seite konnte nicht aktualisiert werden — bitte erneut versuchen.",
    publicContactLegend: "Auf der öffentlichen Seite anzeigen",
    publicShowEmail: "E-Mail",
    publicShowPhone: "Telefon",
    publicShowLocation: "Standort",
    allowIndexing: "Suchmaschinen-Indexierung dieser Seite erlauben",
    allowIndexingBody:
      "So finden Kolleginnen, Kollegen und Arbeitgeber Ihre Arbeit bei Google und anderen Suchmaschinen. Empfohlen – jederzeit abschaltbar. Eine indexierbare Seite kann außerdem von offenen Repositorien und Aggregatoren über die OAI-PMH-Schnittstelle von SigmaCV (/api/oai) geerntet werden: der Datensatz Ihres Lebenslaufs und die darin aufgeführten Arbeiten, im Format Dublin Core oder OpenAIRE. Die Auflistung unter Ihrer Einrichtung ist eine separate Entscheidung weiter unten.",
    allowIndexingTitle:
      "Standardmäßig aus. Wenn aktiviert, kann Ihr öffentlicher Lebenslauf in Suchergebnissen erscheinen (Name, ORCID, Publikationen) und von offenen Repositorien und Aggregatoren über die OAI-PMH-Schnittstelle geerntet werden. Die Auflistung unter Ihrer Einrichtung ist eine separate Einwilligung.",
    listUnderAffiliation: "Mich für Repositorien unter meiner aktuellen Einrichtung auflisten",
    listUnderAffiliationTitle:
      "Standardmäßig aus. Wenn aktiviert, können Harvester über die OAI-PMH-Schnittstelle Ihren Lebenslauf anhand des ROR-Sets Ihrer aktuellen Einrichtung (ror:<id>) auswählen. Erfordert die Indexierung.",
    listUnderAffiliationBody:
      "Nimmt Ihren Lebenslauf in das OAI-PMH-Set der Einrichtung Ihrer ersten sichtbaren aktuellen Position (ihre ROR-Kennung) auf, damit ein Repositorium oder CRIS, das nach Einrichtung erntet, ihn findet. Gekennzeichnet als Ihre selbst angegebene Zugehörigkeit, nie als Verzeichnis Ihrer Einrichtung. Folgt Ihrem Lebenslauf, wenn sich Ihre Zugehörigkeit ändert; erfordert die Indexierung; standardmäßig aus. Die Zahl der unter einer Einrichtung gelisteten Forschenden wird öffentlich auf deren Einrichtungsseite (/i/<ror>) angezeigt – nur eine Zahl, nie wer.",
    listUnderAffiliationNoRor:
      "Noch nicht verfügbar: keine Ihrer sichtbaren aktuellen Positionen ist mit einem ROR-Einrichtungsdatensatz verknüpft. Synchronisieren Sie erneut oder tragen Sie die Einrichtung bei einer Position ein.",
    showOnInstitutionPage: "Mich auf der öffentlichen Seite meiner Einrichtung zeigen",
    showOnInstitutionPageTitle:
      "Standardmäßig aus. Wenn an, erscheinen Ihr Name, Ihre ORCID iD, Ihre aktuelle Position und die Werke Ihrer öffentlichen Seite auf der öffentlichen Seite der von Ihnen angekreuzten Einrichtungen (/i/<ROR id>) und zählen in deren Zahlen. Erfordert die Indexierung. Jederzeit widerrufbar, mit sofortiger Wirkung.",
    showOnInstitutionPageBody:
      "Ihr Name, Ihre ORCID iD, Ihre aktuelle Position und die Werke, die Ihre öffentliche Seite auflistet, erscheinen auf der öffentlichen Seite Ihrer Einrichtung auf SigmaCV, und Sie werden in den Zahlen der Seite mitgezählt (wie viele Forschende sie angeben und der Open-Access-Status ihrer Werke). Wo sich der Datensatz von OpenAlex und Ihrer unterscheiden, werden nur Zählungen angezeigt. Festgelegt auf die Einrichtungen, die Sie unten ankreuzen – ändert sich Ihre Zugehörigkeit, fragen wir erneut, statt Sie zu verschieben. Eine Auflistung, die Sie aus einer früheren Zugehörigkeit behalten, wird fortgesetzt, sobald diese Zugehörigkeit wieder aktuell ist. Die Auflistung ist freiwillig, und ein Fehlen bedeutet nichts. Sie können jederzeit widerrufen, mit sofortiger Wirkung.",
    institutionPagePick: "Mich auflisten unter",
    institutionPageListedUnder: "Sie sind aufgelistet unter {institutions}.",
    institutionPageLapsed:
      "Ihre aktuelle Zugehörigkeit hat sich geändert: Bestätigen Sie, ob Sie unter {institutions} aufgelistet werden möchten.",
    institutionPageLapsedNone:
      "Ihre aktuelle Zugehörigkeit hat sich geändert, und keine Ihrer aktuellen Positionen ist mit einem ROR-Eintrag verknüpft; Ihre Auflistung pausiert, bis eine es ist.",
    institutionPageUnavailable:
      "Nicht verfügbar: erfordert die Suchmaschinen-Indexierung und eine aktuelle Position, die mit einem ROR-Einrichtungseintrag verknüpft ist.",
    institutionPageSingle: "Mit dem Ankreuzen werden Sie unter {institution} aufgelistet.",
    institutionPageArmedHint:
      "Noch nirgends aufgelistet – kreuzen Sie unten mindestens eine Einrichtung an.",
    institutionPageLapsedKept: "Aus einer früheren Zugehörigkeit behalten: ROR {rorId}",
    institutionPageRemove: "Entfernen",
    publishTitle:
      "Erstellt eine teilbare öffentliche Webseite dieses Lebenslaufs unter einem öffentlichen Link. Sie wird bei Aktualisierungen neu synchronisiert. Standardmäßig aus; Häkchen entfernen, um sie offline zu nehmen.",
    exportFormatTitle:
      "Das PDF entspricht exakt Ihrer Vorlage. LaTeX folgt ihr eng (bearbeitbarer Quelltext). Word und Markdown sind einfacher, bearbeitbarer Text ohne Vorlagenstil.",
    exportGroupDocuments: "Dokumente",
    exportGroupData: "Daten",
    exportGroupGrantCv: "Förder-Lebensläufe (Entwürfe nach Geldgeber-Struktur)",
    exportPdf: "PDF — druckfertiger Lebenslauf (.pdf)",
    exportDocx: "Word — schlicht, bearbeitbar (.docx)",
    exportLatexModern: "LaTeX — bearbeitbarer Quelltext (.tex)",
    exportMarkdown: "Markdown — reiner Text (.md)",
    exportHtml: "HTML — eigenständige Webseite (.html)",
    exportBibtex: "BibTeX — Publikationsliste (.bib)",
    exportCslJson: "CSL-JSON — Zitations-Austausch (.json)",
    exportJsonResume: "JSON Résumé — Standardschema (.json)",
    exportRoCrate: "RO-Crate — Forschungsobjekt-Paket (.zip)",
    exportJson: "JSON — Lebenslauf-Daten (.json)",
    exportBiosketch: "NIH biosketch — Entwurf (.md)",
    exportErc: "ERC — Werdegang (.md)",
    exportMsca: "MSCA — Werdegang (.md)",
    exportNsf: "NSF — biografische Skizze (.md)",
    exportJsps: "JSPS/KAKENHI — Werdegang (.md)",
    itemUntitled: "Ohne Titel",
    dragItem: "Ziehen, um neu anzuordnen",
    manualPlaceholder: "z. B. Gastforscher:in, MIT (2023)",
    entryTextAria: "Eintragstext",
    rolePlaceholder: "Titel hinzufügen…",
    roleAria: "Rolle oder Titel",
    revertToSource: "Zurücksetzen",
    revertToSourceHint:
      "Bearbeitung verwerfen und den Originaltext aus ORCID/OpenAlex wiederherstellen",
    matchedByIdentifier: "Anhand Ihrer Kennung zugeordnet",
    matchedByIdOnly: "Nur über OpenAlex-ID zugeordnet — nicht per ORCID bestätigt; bitte prüfen",
    photoTooLarge: "Dieses Bild ist zu groß — versuchen Sie ein kleineres.",
    previewTitle: "Lebenslauf-Vorschau",
    previewRendering: "Vorschau wird erstellt…",
    previewEmpty: "Hier erscheint die Vorschau.",
    linksNav: "Links",
    coffee: "☕ Spendieren Sie mir einen Kaffee",
    supportTitle: "SigmaCV ist kostenlos und gemeinnützig — ein Kaffee deckt die Betriebskosten.",
    showWorkIndicators: "Indikatoren je Publikation anzeigen (RCR, FWCI, klinische Zitationen)",
    showWorkIndicatorsNote:
      "Werte je Arbeit, wie von NIH iCite und OpenAlex gemeldet, jeweils mit eigenem Vorbehalt und nur bei Arbeiten angezeigt, die einen tragen (RCR und klinische Zitationen nur biomedizinisch). Nichts wird summiert, gemittelt oder gerankt.",
    showCollaboration: "Kooperationsbreite anzeigen (Länder der Koautorinnen und Koautoren)",
    showCollaborationNote:
      "Eine Zeile in der Forschungsübersicht: wie viele Länder in Ihren Autorenlisten vorkommen und welcher Anteil der Arbeiten mindestens zwei umfasst, nach OpenAlex-Affiliationsdaten. Rein beschreibend – keine Karte, kein Ranking.",
    showDataLinks: "Links zu offenen Daten / Code unter jeder Publikation anzeigen",
    allowReaderMode: "„Gutachteransicht“ auf der öffentlichen Seite anbieten",
    allowReaderModeTitle:
      "Gutachter können in eine Ansicht wechseln, die alle Vertrauens- und Kontextsignale Ihrer Daten offenlegt. Standardmäßig aus; Ihre Standardseite bleibt unverändert.",
    allowReaderModeNote:
      "Fügt Ihrer lebenden Seite einen kleinen Link „Gutachteransicht“ hinzu. Diese Ansicht aktiviert: {list}; zeigt zurückgezogene Arbeiten mit ihrem Hinweis; und vermerkt bei jeder Arbeit, woher sie stammt. Sie fügt nie Kennzahlen hinzu, die Sie nicht gewählt haben – nichts dort ist eine Bewertung.",
    readerViewUrlLabel: "Gutachteransicht:",
    readerViewUrlHint:
      "Geben Sie diesen Link an ein Gremium weiter – er öffnet Ihre Seite mit sichtbaren Herkunfts-, Verifizierungs- und Kontextsignalen.",
  },
  "ja-JP": {
    pageSizeLabel: "用紙サイズ",
    pageSizeA4: "A4",
    pageSizeLetter: "US レター",
    showCoauthorLinks: "SigmaCV を使う共著者を表示",
    coauthorLinkable: "他の SigmaCV CV から自分の CV へのリンクを許可する",
    editDetails: "詳細を編集",
    departmentAria: "部門",
    institutionAria: "所属機関",
    editInstitutionHint: "所属機関名を編集",
    publicationYearAria: "発行年",
    venueAria: "ジャーナル / 掲載媒体",
    startYearAria: "開始年",
    endYearAria: "終了年",
    ongoingLabel: "継続中",
    resyncForDates: "日付を編集するには再同期してください",
    styleLegend: "スタイル",
    templateLabel: "テンプレート",
    citationLabel: "引用スタイル",
    yourStyles: "あなたのスタイル",
    journalStyles: "ジャーナル・学会スタイル",
    styleLoading: "スタイルを読み込み中…",
    stylePickHint: "任意のジャーナルスタイルを選択 — すべての引用に適用されます。",
    styleLoadError: "そのスタイルを読み込めませんでした。",
    styleNetworkError: "ネットワークエラー — もう一度お試しください。",
    fontLabel: "フォント",
    densityLabel: "表示密度",
    fontSizeLabel: "文字サイズ",
    accentLabel: "アクセント",
    customAccent: "カスタムアクセントカラー",
    highlightSelf: "自分の名前を強調表示",
    highlightStyleLabel: "強調スタイル",
    metricsLabel: "指標（任意 — 既定ではなし）",
    metricNoData: "（データなし）",
    metricsPreset: "責任ある指標プリセット",
    metricsPresetNote:
      "分野正規化指標のみ（DORA / Leiden）— Impact Factor のようなジャーナルレベルの代理指標を避けます。",
    authorshipLabel: "著者貢献まとめ表（査読付きのみ）",
    authorshipNote:
      "筆頭著者・最終著者・責任著者などの回数を集計する表を追加します。プレプリントはカウントされません。",
    authorshipResyncNote:
      "⚠ これらの集計は既存の論文では空です。右上の「Re-sync」をクリックして OpenAlex から著者の位置情報を取得してください。",
    showCharts: "グラフを表示（年別の論文数・被引用数）",
    showResearchAreas: "研究分野を表示（主要分野）",
    showOutputLedger: "研究成果サマリーを表示（種類別の件数）",
    holdNewForReview: "新しい業績を表示前に確認する",
    featureItem: "選定／注目の論文として設定",
    showOpenAccess: "オープンアクセスバッジ",
    showOpenAccessShare: "ヘッダーにオープンアクセス率を表示",
    summaryBlockLabel: "研究サマリー",
    summaryPosHeader: "ヘッダー内",
    summaryPosTop: "独立したセクション",
    summaryPosBottom: "末尾に",
    summaryPosHidden: "非表示",
    summaryHeadingLabel: "見出し（任意）",
    hideRetracted: "撤回された出版物を非表示",
    showAuthorRole: "自分の著者役割を表示（筆頭・最終・責任著者）",
    showCitationCounts: "各論文に被引用数を表示",
    showVerifiedBadges: "機関が ORCID を通じて確認した職歴・学歴に認証マークを表示",
    showReplications: "論文に追試（再現性）の証拠を表示（FORRT/FReD）",
    showArchivalStatus: "ソフトウェア項目に Software Heritage のアーカイブ状態を表示",
    showPublicEvaluations: "プレプリントに公開レビュー情報を表示（Sciety）",
    showProvenance: "データ出典フッター",
    peerReviewedOnly: "プレプリント・非査読の業績を非表示",
    peerReviewedOnlyTitle:
      "プレプリントのセクション全体を含め、すべての非査読業績を CV から削除します。プレプリントを（独立したセクションに）残すにはオフのままにしてください。",
    peerReviewedOnlyNote:
      "既定では、プレプリントは残りますが別の「プレプリント」セクションに掲載されます。完全に削除したい場合のみオンにしてください。",
    countLetters: "レター（誌上通信）を含める",
    countLettersTitle:
      "学術誌に掲載されたレター／研究通信は査読付きのため、既定で一覧に表示され、図表・指標・著者貢献表に集計されます。オフにすると「論文のみ」表示となり、レターを一覧と図表から除外します。プレプリントは上の設定で個別に管理します。",
    countLettersNote: "既定はオン（レターは査読付き）。オフで論文のみ。",
    shownSuffix: "件表示",
    dragSection: "ドラッグしてセクションを並べ替え",
    sectionTitleAria: "セクションタイトル",
    moveSectionUp: "セクションを上へ移動",
    moveSectionDown: "セクションを下へ移動",
    grantsPlaceholder: "助成金を追加、例：科研費 基盤研究(C)、500万円（2024–2027）",
    addEntryAria: "項目を追加",
    tplClassic: "クラシック",
    tplModern: "モダン",
    tplMinimal: "ミニマル",
    tplCompact: "コンパクト",
    tplSidebar: "サイドバー（写真付き）",
    tplEditorial: "エディトリアル",
    tplAts: "ATS対応",
    hlAccent: "アクセントカラー",
    hlBold: "太字",
    hlUnderline: "下線",
    hlAccentUnderline: "アクセント＋下線",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "ゆったり",
    densityCompact: "コンパクト",
    stopContributing: "研究への提供を停止",
    stopContributingTitle:
      "現在、匿名化されたキュレーションデータを研究に提供しています。クリックして停止・オフにします。",
    exportData: "データをエクスポート",
    deleteAccount: "アカウントを削除",
    deleteConfirm:
      "アカウントと関連するすべてのデータを完全に削除しますか？この操作は取り消せません。",
    deleteFailed: "アカウントの削除に失敗しました。もう一度お試しください。",
    consentWithdrawFailed: "同意の撤回に失敗しました。もう一度お試しください。",
    cancel: "キャンセル",
    publishPublic: "公開ページを公開",
    publicLive: "公開ページは公開中です",
    publicSummary:
      "更新され続ける公開ページを作成できます。常に最新の業績に同期する 1 つのリンクで、メール署名・ORCID・ウェブサイトに使えます。氏名・ORCID・残した業績が表示されます。メール・電話・所在地は、下で許可しない限り非公開のままです。",
    openPage: "ページを開く",
    copyLink: "リンクをコピー",
    linkCopied: "リンクをコピーしました！",
    shareHint: "ORCID レコード、ウェブサイト、メール署名に追加できます。",
    publishError: "公開ページを更新できませんでした。もう一度お試しください。",
    publicContactLegend: "公開ページに表示",
    publicShowEmail: "メール",
    publicShowPhone: "電話",
    publicShowLocation: "所在地",
    allowIndexing: "このページの検索エンジンによるインデックスを許可",
    allowIndexingBody:
      "同僚や採用担当者が Google などの検索エンジンであなたの業績を見つけられるようになります。おすすめです。いつでもオフにできます。インデックス可能なページは、SigmaCV の OAI-PMH エンドポイント（/api/oai）を通じてオープンリポジトリやアグリゲータにも収集（ハーベスト）されることがあります。対象は CV のレコードとそこに掲載された業績（Dublin Core または OpenAIRE 形式）です。所属機関のセットに掲載するかどうかは、下の別の選択です。",
    allowIndexingTitle:
      "初期設定はオフです。オンにすると、公開CVが検索結果に表示される場合があり（氏名・ORCID・論文）、OAI-PMH エンドポイントを通じてオープンリポジトリやアグリゲータに収集されることもあります。所属機関のセットへの掲載は別のオプトインです。",
    listUnderAffiliation: "リポジトリ向けに現在の所属機関のもとに掲載する",
    listUnderAffiliationTitle:
      "初期設定はオフです。オンにすると、OAI-PMH エンドポイントを使うハーベスタが、現在の所属機関の ROR セット（ror:<id>）であなたの CV を選択できるようになります。インデックス許可が必要です。",
    listUnderAffiliationBody:
      "表示中の最初の現職の所属機関（その ROR 識別子）の OAI-PMH セットに CV を追加し、機関単位で収集するリポジトリや CRIS が見つけられるようにします。あなた自身が申告した所属として表示され、機関の公式記録としては扱われません。所属が変わると CV に追随します。インデックス許可が必要で、初期設定はオフです。ある機関の下に掲載された研究者の人数は、その機関ページ（/i/<ror>）で公開されます。人数のみで、誰かは表示されません。",
    listUnderAffiliationNoRor:
      "まだ利用できません：表示中の現職のいずれも ROR の機関レコードに紐づいていません。再同期するか、職位に機関を設定してください。",
    showOnInstitutionPage: "所属機関の公開ページに自分を表示する",
    showOnInstitutionPageTitle:
      "初期設定はオフです。オンにすると、あなたの氏名、ORCID iD、現在の職位、公開ページに掲載している業績が、チェックした機関の公開ページ（/i/<ROR id>）に表示され、その集計に含まれます。インデックス許可が必要です。いつでも撤回でき、即時に反映されます。",
    showOnInstitutionPageBody:
      "あなたの氏名、ORCID iD、現在の職位、公開ページに掲載している業績が、SigmaCV 上の所属機関の公開ページに表示され、あなたはそのページの集計（その機関を掲げる研究者の人数と、その業績のオープンアクセス状況）に含まれます。OpenAlex の記録とあなたの記録が異なる箇所では、件数のみが表示されます。下でチェックした機関に固定され、所属が変わった場合は移し替えずに改めて確認します。以前の所属から残した掲載は、その所属が再び現在の所属になれば再開されます。掲載は任意で、掲載がないことは何も意味しません。いつでも撤回でき、即時に反映されます。",
    institutionPagePick: "掲載先",
    institutionPageListedUnder: "{institutions} のもとに掲載されています。",
    institutionPageLapsed:
      "現在の所属が変わりました：{institutions} のもとに掲載するかどうかを確認してください。",
    institutionPageLapsedNone:
      "現在の所属が変わり、現在の職位のいずれも ROR の記録に紐づいていません。紐づくまで掲載は一時停止されます。",
    institutionPageUnavailable:
      "利用できません：検索インデックスの許可と、ROR 機関記録に紐づいた現在の職位が必要です。",
    institutionPageSingle: "チェックすると {institution} に掲載されます。",
    institutionPageArmedHint:
      "まだどこにも掲載されていません。下で少なくとも 1 つの機関をチェックしてください。",
    institutionPageLapsedKept: "以前の所属から残した掲載：ROR {rorId}",
    institutionPageRemove: "削除",
    publishTitle:
      "この CV を共有可能な公開ウェブページとして公開リンクに作成します。更新すると再同期されます。既定ではオフ。チェックを外すとオフラインにできます。",
    exportFormatTitle:
      "PDF はテンプレートと完全に一致します。LaTeX はそれに近い形（編集可能なソース）です。Word と Markdown はテンプレートの装飾がない、編集可能なプレーンテキストです。",
    exportGroupDocuments: "ドキュメント",
    exportGroupData: "データ",
    exportGroupGrantCv: "助成金 CV（資金提供機関の様式に沿った下書き）",
    exportPdf: "PDF — 印刷用 CV (.pdf)",
    exportDocx: "Word — シンプル・編集可能 (.docx)",
    exportLatexModern: "LaTeX — 編集可能なソース (.tex)",
    exportMarkdown: "Markdown — プレーンテキスト (.md)",
    exportHtml: "HTML — 単体で使える Web ページ (.html)",
    exportBibtex: "BibTeX — 論文リスト (.bib)",
    exportCslJson: "CSL-JSON — 引用交換形式 (.json)",
    exportJsonResume: "JSON Résumé — 標準スキーマ (.json)",
    exportRoCrate: "RO-Crate — 研究オブジェクト (.zip)",
    exportJson: "JSON — CV データ (.json)",
    exportBiosketch: "NIH biosketch — 下書き (.md)",
    exportErc: "ERC — 業績 (.md)",
    exportMsca: "MSCA — 業績 (.md)",
    exportNsf: "NSF — 略歴 (.md)",
    exportJsps: "JSPS/科研費 — 業績 (.md)",
    itemUntitled: "無題",
    dragItem: "ドラッグして並べ替え",
    manualPlaceholder: "例：客員研究員、MIT（2023）",
    entryTextAria: "項目テキスト",
    rolePlaceholder: "役職を追加…",
    roleAria: "役職・肩書き",
    revertToSource: "元に戻す",
    revertToSourceHint: "編集を破棄して、ORCID/OpenAlex の元のテキストに戻します",
    matchedByIdentifier: "あなたの識別子で一致",
    matchedByIdOnly: "OpenAlex ID のみで一致 — ORCID 未確認。確認してください",
    photoTooLarge: "この画像は大きすぎます — もっと小さいものをお試しください。",
    previewTitle: "CV プレビュー",
    previewRendering: "プレビューを描画中…",
    previewEmpty: "プレビューはここに表示されます。",
    linksNav: "リンク",
    coffee: "☕ コーヒーをおごる",
    supportTitle: "SigmaCV は無料・非営利です。コーヒー一杯が運営費の支えになります。",
    showWorkIndicators: "各論文に指標を表示（RCR、FWCI、臨床引用）",
    showWorkIndicatorsNote:
      "NIH iCite と OpenAlex が報告する論文ごとの値を、それぞれ注記付きで、値のある論文にのみ表示します（RCR と臨床引用は生物医学分野のみ）。合計・平均・順位付けは行いません。",
    showCollaboration: "共同研究の広がりを表示（共著者の国）",
    showCollaborationNote:
      "研究概要に 1 行追加します。著者リストに現れる国の数と、2 か国以上にまたがる業績の割合を、OpenAlex の所属データから示します。記述のみで、地図も順位付けもありません。",
    showDataLinks: "各論文の下にオープンデータ／コードへのリンクを表示",
    allowReaderMode: "公開ページで「審査者ビュー」を提供する",
    allowReaderModeTitle:
      "審査者は、あなたのデータに含まれるすべての信頼性・文脈の情報を表示するビューに切り替えられます。既定ではオフで、通常のページは変わりません。",
    allowReaderModeNote:
      "リビングCVページに小さな「審査者ビュー」リンクを追加します。このビューでは次をオンにします：{list}。撤回された業績はバッジ付きで表示し、各業績に出典を示します。あなたが選んでいない指標を追加することはなく、そこにあるものはいずれもスコアではありません。",
    readerViewUrlLabel: "審査者ビュー：",
    readerViewUrlHint:
      "このリンクを委員会に渡してください。出典・検証・文脈の情報を表示した状態でページが開きます。",
  },
  "pt-BR": {
    pageSizeLabel: "Tamanho da página",
    pageSizeA4: "A4",
    pageSizeLetter: "Carta (EUA)",
    showCoauthorLinks: "Mostrar coautores que estão no SigmaCV",
    coauthorLinkable: "Permitir que outros CVs do SigmaCV criem links para o meu",
    editDetails: "Editar detalhes",
    departmentAria: "Departamento",
    institutionAria: "Instituição",
    editInstitutionHint: "Editar o nome da instituição",
    publicationYearAria: "Ano",
    venueAria: "Revista / veículo",
    startYearAria: "Ano de início",
    endYearAria: "Ano de término",
    ongoingLabel: "Em andamento",
    resyncForDates: "Sincronize novamente para editar as datas",
    styleLegend: "Estilo",
    templateLabel: "Modelo",
    citationLabel: "Estilo de citação",
    yourStyles: "Seus estilos",
    journalStyles: "Estilos de periódicos e sociedades",
    styleLoading: "Carregando estilo…",
    stylePickHint: "Escolha qualquer estilo de periódico — aplicado a todas as citações.",
    styleLoadError: "Não foi possível carregar esse estilo.",
    styleNetworkError: "Erro de rede — tente novamente.",
    fontLabel: "Fonte",
    densityLabel: "Densidade",
    fontSizeLabel: "Tamanho da fonte",
    accentLabel: "Destaque",
    customAccent: "Cor de destaque personalizada",
    highlightSelf: "Destacar meu nome",
    highlightStyleLabel: "Estilo de destaque",
    metricsLabel: "Métricas (opcional — nenhuma por padrão)",
    metricNoData: "(sem dados)",
    metricsPreset: "Predefinição de métricas responsáveis",
    metricsPresetNote:
      "Apenas indicadores normalizados por área (DORA / Leiden) — evita aproximações no nível do periódico, como o Impact Factor.",
    authorshipLabel: "Tabela-resumo de autoria (somente revisados por pares)",
    authorshipNote:
      "Adiciona uma tabela contando com que frequência você é primeiro / último / autor correspondente, etc. Pré-prints não são contados.",
    authorshipResyncNote:
      "⚠ Essas contagens estão vazias para suas publicações existentes. Clique em Re-sync (canto superior direito) para obter as posições de autoria do OpenAlex.",
    showCharts: "Mostrar gráficos (publicações e citações / ano)",
    showResearchAreas: "Mostrar áreas de pesquisa (principais campos)",
    showOutputLedger: "Mostrar resumo da produção (contagem por tipo)",
    holdNewForReview: "Revisar novos trabalhos antes de exibi-los",
    featureItem: "Marcar como publicação em destaque / selecionada",
    showOpenAccess: "Selos de acesso aberto",
    showOpenAccessShare: "Percentual de acesso aberto no cabeçalho",
    summaryBlockLabel: "Resumo da pesquisa",
    summaryPosHeader: "No cabeçalho",
    summaryPosTop: "Como seção própria",
    summaryPosBottom: "No final",
    summaryPosHidden: "Oculto",
    summaryHeadingLabel: "Título (opcional)",
    hideRetracted: "Ocultar publicações retratadas",
    showAuthorRole: "Mostrar meu papel de autoria (primeiro / último / correspondente)",
    showCitationCounts: "Mostrar o número de citações em cada publicação",
    showVerifiedBadges: "Marcar cargos e formação confirmados pela instituição via ORCID",
    showReplications: "Mostrar evidências de replicação nas publicações (FORRT/FReD)",
    showArchivalStatus:
      "Mostrar o status de arquivamento do Software Heritage em itens de software",
    showPublicEvaluations: "Mostrar avaliações públicas em preprints (Sciety)",
    showProvenance: "Rodapé de proveniência dos dados",
    peerReviewedOnly: "Ocultar pré-prints e trabalhos não revisados por pares",
    peerReviewedOnlyTitle:
      "Remove TODOS os trabalhos não revisados por pares do CV, incluindo toda a sua seção de Pré-prints. Deixe DESATIVADO para manter os pré-prints listados (em sua própria seção).",
    peerReviewedOnlyNote:
      "Por padrão, os pré-prints são mantidos, mas listados em uma seção “Pré-prints” separada. Ative isto apenas se quiser removê-los por completo.",
    countLetters: "Incluir cartas (correspondência)",
    countLettersTitle:
      "Cartas/correspondência de pesquisa publicadas em revistas são revisadas por pares, por isso são listadas e contadas (gráficos, métricas, tabela de autoria) por padrão. Desative para uma visão somente de artigos que remove as cartas da lista e das figuras. Preprints são controlados à parte (acima).",
    countLettersNote:
      "Ativado por padrão — cartas são revisadas por pares. Desativado = somente artigos.",
    shownSuffix: "exibido(s)",
    dragSection: "Arraste para reordenar a seção",
    sectionTitleAria: "Título da seção",
    moveSectionUp: "Mover seção para cima",
    moveSectionDown: "Mover seção para baixo",
    grantsPlaceholder: "Adicione um financiamento, ex.: CNPq Universal, R$ 300 mil (2024–2027)",
    addEntryAria: "Adicionar uma entrada",
    tplClassic: "Clássico",
    tplModern: "Moderno",
    tplMinimal: "Minimalista",
    tplCompact: "Compacto",
    tplSidebar: "Barra lateral (foto)",
    tplEditorial: "Editorial",
    tplAts: "Compatível com ATS",
    hlAccent: "Cor de destaque",
    hlBold: "Negrito",
    hlUnderline: "Sublinhado",
    hlAccentUnderline: "Destaque + sublinhado",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Confortável",
    densityCompact: "Compacta",
    stopContributing: "Parar de contribuir para a pesquisa",
    stopContributingTitle:
      "Você está atualmente contribuindo com dados de curadoria anonimizados para a pesquisa. Clique para parar e desativar.",
    exportData: "Exportar meus dados",
    deleteAccount: "Excluir conta",
    deleteConfirm:
      "Excluir permanentemente sua conta e todos os dados associados? Isso não pode ser desfeito.",
    deleteFailed: "Falha ao excluir a conta. Tente novamente.",
    consentWithdrawFailed: "Falha ao retirar o consentimento. Tente novamente.",
    cancel: "Cancelar",
    publishPublic: "Publicar página pública",
    publicLive: "A página pública está no ar",
    publicSummary:
      "Tenha uma página pública viva: um link que sempre sincroniza com seu trabalho mais recente, para sua assinatura de e-mail, ORCID ou site. Ela mostra seu nome, ORCID e as publicações mantidas; e-mail, telefone e localização ficam privados, a menos que você os ative abaixo.",
    openPage: "Abrir página",
    copyLink: "Copiar link",
    linkCopied: "Link copiado!",
    shareHint: "Adicione-o ao seu registro ORCID, site ou assinatura de e-mail.",
    publishError: "Não foi possível atualizar a página pública — tente novamente.",
    publicContactLegend: "Mostrar na página pública",
    publicShowEmail: "E-mail",
    publicShowPhone: "Telefone",
    publicShowLocation: "Localização",
    allowIndexing: "Permitir que mecanismos de busca indexem esta página",
    allowIndexingBody:
      "É assim que colegas e recrutadores encontram seu trabalho no Google e em outros buscadores. Recomendado — você pode desativar quando quiser. Uma página indexável também pode ser coletada por repositórios abertos e agregadores pelo ponto de acesso OAI-PMH do SigmaCV (/api/oai): o registro do seu CV e os trabalhos que ele lista, em formato Dublin Core ou OpenAIRE. Aparecer sob a sua instituição é uma escolha separada, abaixo.",
    allowIndexingTitle:
      "Desativado por padrão. Quando ativado, seu CV público pode aparecer nos resultados de busca (nome, ORCID, publicações) e ser coletado por repositórios abertos e agregadores pelo ponto de acesso OAI-PMH. Aparecer sob a sua instituição é uma opção separada.",
    listUnderAffiliation: "Listar-me sob minha afiliação atual para repositórios",
    listUnderAffiliationTitle:
      "Desativado por padrão. Quando ativado, coletores que usam o ponto de acesso OAI-PMH podem selecionar seu CV pelo conjunto ROR da sua instituição atual (ror:<id>). Requer a indexação.",
    listUnderAffiliationBody:
      "Adiciona seu CV ao conjunto OAI-PMH da instituição do seu primeiro cargo atual visível (o identificador ROR dela), para que um repositório ou CRIS que coleta por instituição possa encontrá-lo. Rotulado como afiliação declarada por você, nunca como registro da sua instituição. Acompanha seu CV se a afiliação mudar; requer a indexação; desativado por padrão. O número de pesquisadores listados sob uma instituição é exibido publicamente na página da instituição (/i/<ror>): apenas uma contagem, nunca quem.",
    listUnderAffiliationNoRor:
      "Ainda indisponível: nenhum dos seus cargos atuais visíveis está vinculado a um registro institucional ROR. Sincronize novamente ou defina a instituição em um cargo.",
    showOnInstitutionPage: "Mostrar-me na página pública da minha instituição",
    showOnInstitutionPageTitle:
      "Desativado por padrão. Quando ativado, seu nome, ORCID iD, cargo atual e as obras listadas na sua página pública aparecem na página pública das instituições que você marcar (/i/<ROR id>) e contam nos seus números. Requer a indexação. Retire quando quiser, com efeito imediato.",
    showOnInstitutionPageBody:
      "Seu nome, ORCID iD, cargo atual e as obras listadas na sua página pública aparecem na página pública da sua instituição no SigmaCV, e você é contado nos números da página (quantos pesquisadores a indicam e o status de acesso aberto de suas obras). Onde o registro do OpenAlex e o seu diferem, apenas contagens são mostradas. Fixado às instituições que você marcar abaixo — se sua afiliação mudar, perguntamos de novo em vez de mover você. Uma listagem que você mantiver de uma afiliação anterior é retomada se essa afiliação voltar a ser atual. Aparecer é voluntário e não aparecer não significa nada. Você pode retirar a qualquer momento, com efeito imediato.",
    institutionPagePick: "Listar-me sob",
    institutionPageListedUnder: "Você está listado(a) sob {institutions}.",
    institutionPageLapsed:
      "Sua afiliação atual mudou: confirme se deseja aparecer sob {institutions}.",
    institutionPageLapsedNone:
      "Sua afiliação atual mudou e nenhum dos seus cargos atuais está vinculado a um registro ROR; sua listagem fica pausada até que um esteja.",
    institutionPageUnavailable:
      "Indisponível: requer a indexação por buscadores e um cargo atual vinculado a um registro de instituição ROR.",
    institutionPageSingle: "Ao marcar, você aparecerá sob {institution}.",
    institutionPageArmedHint:
      "Ainda não aparece em nenhuma: marque pelo menos uma instituição abaixo.",
    institutionPageLapsedKept: "Mantido de uma afiliação anterior: ROR {rorId}",
    institutionPageRemove: "Remover",
    publishTitle:
      "Cria uma página web pública e compartilhável deste CV em um link público. Ela é ressincronizada conforme você atualiza. Desativada por padrão; desmarque para tirá-la do ar.",
    exportFormatTitle:
      "O PDF corresponde exatamente ao seu modelo. O LaTeX o segue de perto (código editável). Word e Markdown são texto simples e editável, sem estilo de modelo.",
    exportGroupDocuments: "Documentos",
    exportGroupData: "Dados",
    exportGroupGrantCv: "CV para financiamento (rascunhos no formato da agência)",
    exportPdf: "PDF — currículo pronto para impressão (.pdf)",
    exportDocx: "Word — simples, editável (.docx)",
    exportLatexModern: "LaTeX — código editável (.tex)",
    exportMarkdown: "Markdown — texto simples (.md)",
    exportHtml: "HTML — página web independente (.html)",
    exportBibtex: "BibTeX — lista de publicações (.bib)",
    exportCslJson: "CSL-JSON — intercâmbio de citações (.json)",
    exportJsonResume: "JSON Résumé — esquema padrão (.json)",
    exportRoCrate: "RO-Crate — pacote de objeto de pesquisa (.zip)",
    exportJson: "JSON — dados do currículo (.json)",
    exportBiosketch: "NIH biosketch — rascunho (.md)",
    exportErc: "ERC — trajetória (.md)",
    exportMsca: "MSCA — trajetória (.md)",
    exportNsf: "NSF — resumo biográfico (.md)",
    exportJsps: "JSPS/KAKENHI — trajetória (.md)",
    itemUntitled: "Sem título",
    dragItem: "Arraste para reordenar",
    manualPlaceholder: "ex.: Pesquisador Visitante, MIT (2023)",
    entryTextAria: "Texto da entrada",
    rolePlaceholder: "Adicione seu cargo…",
    roleAria: "Cargo ou título",
    revertToSource: "Reverter",
    revertToSourceHint: "Descartar sua edição e restaurar o texto original do ORCID/OpenAlex",
    matchedByIdentifier: "Correspondência pelo seu identificador",
    matchedByIdOnly: "Correspondência apenas por ID do OpenAlex — não confirmada por ORCID; revise",
    photoTooLarge: "Essa imagem é muito grande — tente uma menor.",
    previewTitle: "Prévia do CV",
    previewRendering: "Renderizando prévia…",
    previewEmpty: "A prévia aparecerá aqui.",
    linksNav: "Links",
    coffee: "☕ Pague-me um café",
    supportTitle: "O SigmaCV é gratuito e sem fins lucrativos — um café ajuda a cobrir os custos.",
    showWorkIndicators: "Mostrar indicadores por publicação (RCR, FWCI, citações clínicas)",
    showWorkIndicatorsNote:
      "Valores por trabalho conforme reportados pelo NIH iCite e pelo OpenAlex, cada um com sua ressalva, exibidos apenas nos trabalhos que os têm (RCR e citações clínicas são apenas biomédicos). Nada é somado, calculado em média ou ranqueado.",
    showCollaboration: "Mostrar abrangência de colaboração (países dos coautores)",
    showCollaborationNote:
      "Uma linha no resumo de pesquisa: quantos países aparecem nas suas listas de autores e que parcela dos trabalhos abrange pelo menos dois, segundo as afiliações do OpenAlex. Apenas descritivo — sem mapa, sem classificação.",
    showDataLinks: "Mostrar links para dados abertos / código sob cada publicação",
    allowReaderMode: 'Oferecer uma "visão para avaliadores" na página pública',
    allowReaderModeTitle:
      "Avaliadores podem alternar para uma visão que revela todos os sinais de confiança e contexto que seus dados carregam. Desligado por padrão; sua página padrão não muda.",
    allowReaderModeNote:
      'Adiciona um pequeno link "Visão para avaliadores" à sua página viva. Essa visão ativa: {list}; mostra trabalhos retratados com o respectivo selo; e marca em cada trabalho de onde ele veio. Nunca adiciona métricas que você não escolheu — nada ali é uma pontuação.',
    readerViewUrlLabel: "Visão para avaliadores:",
    readerViewUrlHint:
      "Entregue este link a uma comissão — ele abre sua página com os sinais de procedência, verificação e contexto visíveis.",
  },
  "it-IT": {
    pageSizeLabel: "Formato pagina",
    pageSizeA4: "A4",
    pageSizeLetter: "Lettera US",
    showCoauthorLinks: "Mostra i coautori presenti su SigmaCV",
    coauthorLinkable: "Consenti ad altri CV SigmaCV di collegarsi al mio",
    editDetails: "Modifica dettagli",
    departmentAria: "Dipartimento",
    institutionAria: "Istituzione",
    editInstitutionHint: "Modifica il nome dell'istituzione",
    publicationYearAria: "Anno",
    venueAria: "Rivista / sede",
    startYearAria: "Anno di inizio",
    endYearAria: "Anno di fine",
    ongoingLabel: "In corso",
    resyncForDates: "Risincronizza per modificare le date",
    styleLegend: "Stile",
    templateLabel: "Modello",
    citationLabel: "Stile di citazione",
    yourStyles: "I tuoi stili",
    journalStyles: "Stili di riviste e società",
    styleLoading: "Caricamento dello stile…",
    stylePickHint: "Scegli qualsiasi stile di rivista — applicato a ogni citazione.",
    styleLoadError: "Impossibile caricare quello stile.",
    styleNetworkError: "Errore di rete — riprova.",
    fontLabel: "Carattere",
    densityLabel: "Densità",
    fontSizeLabel: "Dimensione del carattere",
    accentLabel: "Accento",
    customAccent: "Colore d’accento personalizzato",
    highlightSelf: "Evidenzia il mio nome",
    highlightStyleLabel: "Stile di evidenziazione",
    metricsLabel: "Metriche (facoltative — nessuna per impostazione predefinita)",
    metricNoData: "(nessun dato)",
    metricsPreset: "Preimpostazione metriche responsabili",
    metricsPresetNote:
      "Solo indicatori normalizzati per disciplina (DORA / Leiden) — evita proxy a livello di rivista come l’Impact Factor.",
    authorshipLabel:
      "Tabella riepilogativa delle paternità (solo lavori sottoposti a revisione paritaria)",
    authorshipNote:
      "Aggiunge una tabella che conta quante volte sei primo / ultimo autore, autore corrispondente, ecc. I preprint non vengono conteggiati.",
    authorshipResyncNote:
      "⚠ Questi conteggi sono vuoti per le tue pubblicazioni esistenti. Fai clic su Re-sync (in alto a destra) per recuperare le posizioni degli autori da OpenAlex.",
    showCharts: "Mostra grafici (pubblicazioni e citazioni / anno)",
    showResearchAreas: "Mostra aree di ricerca (campi principali)",
    showOutputLedger: "Mostra riepilogo della produzione (conteggio per tipo)",
    holdNewForReview: "Rivedere i nuovi lavori prima di mostrarli",
    featureItem: "Segna come pubblicazione selezionata / in evidenza",
    showOpenAccess: "Badge ad accesso aperto",
    showOpenAccessShare: "Quota di accesso aperto nell'intestazione",
    summaryBlockLabel: "Sintesi della ricerca",
    summaryPosHeader: "Nell'intestazione",
    summaryPosTop: "Come sezione propria",
    summaryPosBottom: "Alla fine",
    summaryPosHidden: "Nascosto",
    summaryHeadingLabel: "Titolo (facoltativo)",
    hideRetracted: "Nascondi le pubblicazioni ritirate",
    showAuthorRole: "Mostra il mio ruolo di autore (primo / ultimo / corrispondente)",
    showCitationCounts: "Mostra il numero di citazioni per ogni pubblicazione",
    showVerifiedBadges: "Segnala posizioni e formazione confermate dall’istituzione tramite ORCID",
    showReplications: "Mostra le evidenze di replicazione sulle pubblicazioni (FORRT/FReD)",
    showArchivalStatus:
      "Mostra lo stato di archiviazione Software Heritage sugli elementi software",
    showPublicEvaluations: "Mostra le valutazioni pubbliche sui preprint (Sciety)",
    showProvenance: "Piè di pagina sulla provenienza dei dati",
    peerReviewedOnly: "Nascondi i preprint e i lavori non sottoposti a revisione paritaria",
    peerReviewedOnlyTitle:
      "Rimuove TUTTI i lavori non sottoposti a revisione paritaria dal CV, inclusa l’intera sezione Preprint. Lascia questa opzione DISATTIVATA per mantenere i preprint elencati (in una sezione dedicata).",
    peerReviewedOnlyNote:
      "Per impostazione predefinita, i preprint vengono mantenuti ma elencati in una sezione separata “Preprint”. Attiva questa opzione solo se vuoi eliminarli del tutto.",
    countLetters: "Includi lettere (corrispondenza)",
    countLettersTitle:
      "Le lettere / la corrispondenza di ricerca pubblicate su riviste sono sottoposte a revisione paritaria, quindi sono elencate e conteggiate (grafici, metriche, tabella di paternità) per impostazione predefinita. Disattiva per una vista solo articoli che rimuove le lettere dall’elenco e dalle figure. I preprint sono gestiti a parte (sopra).",
    countLettersNote:
      "Attivo per impostazione predefinita — le lettere sono sottoposte a revisione. Disattivato = solo articoli.",
    shownSuffix: "mostrati",
    dragSection: "Trascina per riordinare la sezione",
    sectionTitleAria: "Titolo della sezione",
    moveSectionUp: "Sposta la sezione in alto",
    moveSectionDown: "Sposta la sezione in basso",
    grantsPlaceholder: "Aggiungi un finanziamento, ad es. PRIN 2022, €250k (2024–2027)",
    addEntryAria: "Aggiungi una voce",
    tplClassic: "Classico",
    tplModern: "Moderno",
    tplMinimal: "Minimalista",
    tplCompact: "Compatto",
    tplSidebar: "Barra laterale (foto)",
    tplEditorial: "Editoriale",
    tplAts: "Compatibile con ATS",
    hlAccent: "Colore d’accento",
    hlBold: "Grassetto",
    hlUnderline: "Sottolineato",
    hlAccentUnderline: "Accento + sottolineato",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Comoda",
    densityCompact: "Compatta",
    stopContributing: "Smetti di contribuire alla ricerca",
    stopContributingTitle:
      "Attualmente stai contribuendo con dati di curatela anonimizzati alla ricerca. Fai clic per interrompere e disattivare.",
    exportData: "Esporta i miei dati",
    deleteAccount: "Elimina account",
    deleteConfirm:
      "Eliminare definitivamente il tuo account e tutti i dati associati? L’operazione non può essere annullata.",
    deleteFailed: "Eliminazione dell’account non riuscita. Riprova.",
    consentWithdrawFailed: "Revoca del consenso non riuscita. Riprova.",
    cancel: "Annulla",
    publishPublic: "Pubblica pagina pubblica",
    publicLive: "La pagina pubblica è online",
    publicSummary:
      "Ottieni una pagina pubblica viva: un unico link sempre sincronizzato con i tuoi lavori più recenti, per la firma e-mail, ORCID o il tuo sito. Mostra nome, ORCID e le pubblicazioni mantenute; e-mail, telefono e posizione restano privati, salvo che tu li attivi qui sotto.",
    openPage: "Apri pagina",
    copyLink: "Copia link",
    linkCopied: "Link copiato!",
    shareHint: "Aggiungilo al tuo profilo ORCID, al tuo sito o alla firma email.",
    publishError: "Impossibile aggiornare la pagina pubblica — riprova.",
    publicContactLegend: "Mostra nella pagina pubblica",
    publicShowEmail: "E-mail",
    publicShowPhone: "Telefono",
    publicShowLocation: "Località",
    allowIndexing: "Consenti l’indicizzazione di questa pagina dai motori di ricerca",
    allowIndexingBody:
      "È così che colleghi e datori di lavoro trovano il tuo lavoro su Google e altri motori di ricerca. Consigliato: puoi disattivarlo quando vuoi. Una pagina indicizzabile può anche essere raccolta da repository aperti e aggregatori tramite l'endpoint OAI-PMH di SigmaCV (/api/oai): il record del tuo CV e i lavori che elenca, in formato Dublin Core o OpenAIRE. Comparire sotto la tua istituzione è una scelta separata, qui sotto.",
    allowIndexingTitle:
      "Disattivato per impostazione predefinita. Se attivo, il tuo CV pubblico può comparire nei risultati di ricerca (nome, ORCID, pubblicazioni) ed essere raccolto da repository aperti e aggregatori tramite l'endpoint OAI-PMH. Comparire sotto la tua istituzione è un'opzione separata.",
    listUnderAffiliation: "Elencami sotto la mia affiliazione attuale per i repository",
    listUnderAffiliationTitle:
      "Disattivato per impostazione predefinita. Se attivo, gli harvester che usano l'endpoint OAI-PMH possono selezionare il tuo CV tramite il set ROR della tua istituzione attuale (ror:<id>). Richiede l'indicizzazione.",
    listUnderAffiliationBody:
      "Aggiunge il tuo CV al set OAI-PMH dell'istituzione della tua prima posizione attuale visibile (il suo identificativo ROR), così che un repository o un CRIS che raccoglie per istituzione possa trovarlo. Etichettato come affiliazione dichiarata da te, mai come registro della tua istituzione. Segue il tuo CV se l'affiliazione cambia; richiede l'indicizzazione; disattivato per impostazione predefinita. Il numero di ricercatori elencati sotto un'istituzione è mostrato pubblicamente nella sua pagina istituzione (/i/<ror>): solo un conteggio, mai chi.",
    listUnderAffiliationNoRor:
      "Non ancora disponibile: nessuna delle tue posizioni attuali visibili è collegata a un record istituzionale ROR. Risincronizza, oppure indica l'istituzione su una posizione.",
    showOnInstitutionPage: "Mostrami sulla pagina pubblica della mia istituzione",
    showOnInstitutionPageTitle:
      "Disattivato per impostazione predefinita. Se attivo, il tuo nome, ORCID iD, posizione attuale e i lavori elencati nella tua pagina pubblica compaiono nella pagina pubblica delle istituzioni che spunti (/i/<ROR id>) e contano nelle sue cifre. Richiede l'indicizzazione. Revocabile in qualsiasi momento, con effetto immediato.",
    showOnInstitutionPageBody:
      "Il tuo nome, ORCID iD, posizione attuale e i lavori elencati nella tua pagina pubblica compaiono nella pagina pubblica della tua istituzione su SigmaCV, e sei conteggiato nelle cifre della pagina (quanti ricercatori la indicano e lo stato di accesso aperto dei loro lavori). Dove il record di OpenAlex e il tuo differiscono, sono mostrati solo conteggi. Fissato alle istituzioni che spunti qui sotto: se la tua affiliazione cambia, te lo chiediamo di nuovo invece di spostarti. Un'inclusione che conservi da un'affiliazione precedente riprende se quell'affiliazione torna a essere attuale. Comparire è volontario e l'assenza non significa nulla. Puoi revocare in qualsiasi momento, con effetto immediato.",
    institutionPagePick: "Elencami sotto",
    institutionPageListedUnder: "Sei elencato sotto {institutions}.",
    institutionPageLapsed:
      "La tua affiliazione attuale è cambiata: conferma se vuoi comparire sotto {institutions}.",
    institutionPageLapsedNone:
      "La tua affiliazione attuale è cambiata e nessuna delle tue posizioni attuali è collegata a un record ROR; il tuo elenco è in pausa finché una non lo sarà.",
    institutionPageUnavailable:
      "Non disponibile: richiede l'indicizzazione nei motori di ricerca e una posizione attuale collegata a un record di istituzione ROR.",
    institutionPageSingle: "Spuntando comparirai sotto {institution}.",
    institutionPageArmedHint:
      "Non compari ancora da nessuna parte: spunta almeno un'istituzione qui sotto.",
    institutionPageLapsedKept: "Conservato da un'affiliazione precedente: ROR {rorId}",
    institutionPageRemove: "Rimuovi",
    publishTitle:
      "Crea una pagina web pubblica condivisibile di questo CV tramite un link pubblico. Si risincronizza man mano che apporti aggiornamenti. Disattivata per impostazione predefinita; deseleziona per metterla offline.",
    exportFormatTitle:
      "Il PDF corrisponde esattamente al tuo modello. LaTeX lo segue fedelmente (sorgente modificabile). Word e Markdown sono testo semplice e modificabile, senza stile del modello.",
    exportGroupDocuments: "Documenti",
    exportGroupData: "Dati",
    exportGroupGrantCv: "CV per finanziamenti (bozze secondo l’ente finanziatore)",
    exportPdf: "PDF — CV pronto per la stampa (.pdf)",
    exportDocx: "Word — semplice, modificabile (.docx)",
    exportLatexModern: "LaTeX — sorgente modificabile (.tex)",
    exportMarkdown: "Markdown — testo semplice (.md)",
    exportHtml: "HTML — pagina web autonoma (.html)",
    exportBibtex: "BibTeX — elenco pubblicazioni (.bib)",
    exportCslJson: "CSL-JSON — interscambio di citazioni (.json)",
    exportJsonResume: "JSON Résumé — schema standard (.json)",
    exportRoCrate: "RO-Crate — oggetto di ricerca (.zip)",
    exportJson: "JSON — dati del CV (.json)",
    exportBiosketch: "NIH biosketch — bozza (.md)",
    exportErc: "ERC — percorso (.md)",
    exportMsca: "MSCA — percorso (.md)",
    exportNsf: "NSF — profilo biografico (.md)",
    exportJsps: "JSPS/KAKENHI — percorso (.md)",
    itemUntitled: "Senza titolo",
    dragItem: "Trascina per riordinare",
    manualPlaceholder: "ad es. Ricercatore in visita, MIT (2023)",
    entryTextAria: "Testo della voce",
    rolePlaceholder: "Aggiungi il tuo ruolo…",
    roleAria: "Ruolo o titolo",
    revertToSource: "Ripristina",
    revertToSourceHint: "Annulla la tua modifica e ripristina il testo originale da ORCID/OpenAlex",
    matchedByIdentifier: "Abbinato tramite il tuo identificativo",
    matchedByIdOnly: "Abbinato solo tramite ID OpenAlex — non confermato da ORCID; verifica",
    photoTooLarge: "Quell’immagine è troppo grande — provane una più piccola.",
    previewTitle: "Anteprima del CV",
    previewRendering: "Rendering dell’anteprima…",
    previewEmpty: "L’anteprima apparirà qui.",
    linksNav: "Link",
    coffee: "☕ Offrimi un caffè",
    supportTitle: "SigmaCV è gratuito e senza scopo di lucro: un caffè aiuta a coprire i costi.",
    showWorkIndicators: "Mostra indicatori per pubblicazione (RCR, FWCI, citazioni cliniche)",
    showWorkIndicatorsNote:
      "Valori per lavoro come riportati da NIH iCite e OpenAlex, ciascuno con la propria avvertenza, mostrati solo sui lavori che li hanno (RCR e citazioni cliniche solo per il biomedico). Nulla viene sommato, mediato o classificato.",
    showCollaboration: "Mostra ampiezza delle collaborazioni (paesi dei coautori)",
    showCollaborationNote:
      "Una riga nel riepilogo della ricerca: quanti paesi compaiono nelle tue liste di autori e quale quota di lavori ne coinvolge almeno due, in base alle affiliazioni OpenAlex. Solo descrittivo: nessuna mappa, nessuna classifica.",
    showDataLinks: "Mostra i link a dati aperti / codice sotto ogni pubblicazione",
    allowReaderMode: "Offri una «vista per valutatori» nella pagina pubblica",
    allowReaderModeTitle:
      "I valutatori possono passare a una vista che rivela tutti i segnali di affidabilità e contesto contenuti nei tuoi dati. Disattivata per impostazione predefinita; la tua pagina standard resta invariata.",
    allowReaderModeNote:
      "Aggiunge un piccolo link «Vista per valutatori» alla tua pagina viva. Quella vista attiva: {list}; mostra i lavori ritrattati con il relativo contrassegno; e indica per ogni lavoro da dove proviene. Non aggiunge mai metriche che non hai scelto — nulla lì è un punteggio.",
    readerViewUrlLabel: "Vista per valutatori:",
    readerViewUrlHint:
      "Consegna questo link a una commissione: apre la tua pagina con i segnali di provenienza, verifica e contesto visibili.",
  },
  "ko-KR": {
    pageSizeLabel: "페이지 크기",
    pageSizeA4: "A4",
    pageSizeLetter: "US 레터",
    showCoauthorLinks: "SigmaCV를 사용하는 공저자 표시",
    coauthorLinkable: "다른 SigmaCV 이력서가 내 이력서로 연결하도록 허용",
    editDetails: "세부 정보 편집",
    departmentAria: "부서",
    institutionAria: "기관",
    editInstitutionHint: "기관 이름 편집",
    publicationYearAria: "연도",
    venueAria: "저널 / 게재처",
    startYearAria: "시작 연도",
    endYearAria: "종료 연도",
    ongoingLabel: "진행 중",
    resyncForDates: "날짜를 편집하려면 다시 동기화하세요",
    styleLegend: "스타일",
    templateLabel: "템플릿",
    citationLabel: "인용 스타일",
    yourStyles: "내 스타일",
    journalStyles: "저널 및 학회 스타일",
    styleLoading: "스타일 불러오는 중…",
    stylePickHint: "원하는 저널 스타일을 선택하세요 — 모든 인용에 적용됩니다.",
    styleLoadError: "해당 스타일을 불러올 수 없습니다.",
    styleNetworkError: "네트워크 오류 — 다시 시도해 주세요.",
    fontLabel: "글꼴",
    densityLabel: "밀도",
    fontSizeLabel: "글자 크기",
    accentLabel: "강조색",
    customAccent: "사용자 지정 강조색",
    highlightSelf: "내 이름 강조",
    highlightStyleLabel: "강조 스타일",
    metricsLabel: "지표 (선택 — 기본값 없음)",
    metricNoData: "(데이터 없음)",
    metricsPreset: "책임 있는 지표 프리셋",
    metricsPresetNote:
      "분야 정규화 지표만 사용 (DORA / Leiden) — Impact Factor 같은 저널 수준 대용 지표를 피합니다.",
    authorshipLabel: "저자 기여 요약 표 (동료 심사 논문만)",
    authorshipNote:
      "제1저자 / 교신저자 / 마지막 저자 등으로 활동한 횟수를 집계하는 표를 추가합니다. 프리프린트는 집계되지 않습니다.",
    authorshipResyncNote:
      "⚠ 기존 출판물에 대해서는 이 집계가 비어 있습니다. 우측 상단의 Re-sync를 클릭하여 OpenAlex에서 저자 위치를 가져오세요.",
    showCharts: "차트 표시 (연도별 출판물 및 인용 수)",
    showResearchAreas: "연구 분야 표시 (주요 분야)",
    showOutputLedger: "연구 성과 요약 표시 (유형별 개수)",
    holdNewForReview: "새 성과를 표시하기 전에 검토",
    featureItem: "선정 / 주요 논문으로 표시",
    showOpenAccess: "오픈 액세스 배지",
    showOpenAccessShare: "헤더에 오픈 액세스 비율 표시",
    summaryBlockLabel: "연구 요약",
    summaryPosHeader: "헤더에",
    summaryPosTop: "별도 섹션으로",
    summaryPosBottom: "마지막에",
    summaryPosHidden: "숨김",
    summaryHeadingLabel: "제목 (선택)",
    hideRetracted: "철회된 출판물 숨기기",
    showAuthorRole: "내 저자 역할 표시 (제1저자 / 마지막 저자 / 교신저자)",
    showCitationCounts: "각 논문에 피인용 수 표시",
    showVerifiedBadges: "기관이 ORCID를 통해 확인한 경력·학력에 인증 표시",
    showReplications: "논문에 재현(FORRT/FReD) 증거 표시",
    showArchivalStatus: "소프트웨어 항목에 Software Heritage 보관 상태 표시",
    showPublicEvaluations: "프리프린트에 공개 평가 표시 (Sciety)",
    showProvenance: "데이터 출처 푸터",
    peerReviewedOnly: "프리프린트 및 비동료 심사 자료 숨기기",
    peerReviewedOnlyTitle:
      "프리프린트 섹션 전체를 포함하여 동료 심사를 거치지 않은 모든 자료를 CV에서 제거합니다. 프리프린트를 (별도 섹션에) 계속 표시하려면 이 옵션을 끄세요.",
    peerReviewedOnlyNote:
      "기본적으로 프리프린트는 유지되지만 별도의 “프리프린트” 섹션에 표시됩니다. 완전히 제거하려는 경우에만 이 옵션을 켜세요.",
    countLetters: "레터(서신) 포함",
    countLettersTitle:
      "학술지에 게재된 레터/연구 서신은 동료 심사를 거치므로 기본적으로 목록에 표시되고 차트·지표·저자 정보 표에 집계됩니다. 끄면 레터를 목록과 그림에서 제외하는 ‘논문만’ 보기가 됩니다. 프리프린트는 위 옵션에서 별도로 제어합니다.",
    countLettersNote: "기본값 켜짐 — 레터는 동료 심사 대상입니다. 끄면 논문만 표시.",
    shownSuffix: "표시됨",
    dragSection: "드래그하여 섹션 순서 변경",
    sectionTitleAria: "섹션 제목",
    moveSectionUp: "섹션 위로 이동",
    moveSectionDown: "섹션 아래로 이동",
    grantsPlaceholder: "연구비를 추가하세요. 예: 한국연구재단(NRF) 중견연구, 3억 원 (2024–2027)",
    addEntryAria: "항목 추가",
    tplClassic: "클래식",
    tplModern: "모던",
    tplMinimal: "미니멀",
    tplCompact: "컴팩트",
    tplSidebar: "사이드바 (사진)",
    tplEditorial: "에디토리얼",
    tplAts: "ATS 친화형",
    hlAccent: "강조색",
    hlBold: "굵게",
    hlUnderline: "밑줄",
    hlAccentUnderline: "강조색 + 밑줄",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "여유롭게",
    densityCompact: "촘촘하게",
    stopContributing: "연구 기여 중단",
    stopContributingTitle:
      "현재 익명화된 큐레이션 데이터를 연구에 기여하고 있습니다. 중단하고 끄려면 클릭하세요.",
    exportData: "내 데이터 내보내기",
    deleteAccount: "계정 삭제",
    deleteConfirm:
      "계정과 관련된 모든 데이터를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    deleteFailed: "계정 삭제에 실패했습니다. 다시 시도해 주세요.",
    consentWithdrawFailed: "동의 철회에 실패했습니다. 다시 시도해 주세요.",
    cancel: "취소",
    publishPublic: "공개 페이지 게시",
    publicLive: "공개 페이지가 활성화되었습니다",
    publicSummary:
      "계속 갱신되는 공개 페이지를 만드세요. 항상 최신 업적과 동기화되는 링크 하나로 이메일 서명, ORCID, 웹사이트에 사용할 수 있습니다. 이름, ORCID, 보관한 논문이 표시됩니다. 이메일·전화·위치는 아래에서 동의하지 않으면 비공개로 유지됩니다.",
    openPage: "페이지 열기",
    copyLink: "링크 복사",
    linkCopied: "링크가 복사되었습니다!",
    shareHint: "ORCID 기록, 웹사이트 또는 이메일 서명에 추가하세요.",
    publishError: "공개 페이지를 업데이트하지 못했습니다. 다시 시도해 주세요.",
    publicContactLegend: "공개 페이지에 표시",
    publicShowEmail: "이메일",
    publicShowPhone: "전화",
    publicShowLocation: "위치",
    allowIndexing: "검색 엔진이 이 페이지를 색인하도록 허용",
    allowIndexingBody:
      "동료와 고용주가 Google 등 검색 엔진에서 당신의 연구를 찾는 방법입니다. 권장하며, 언제든지 끌 수 있습니다. 색인 가능한 페이지는 SigmaCV의 OAI-PMH 엔드포인트(/api/oai)를 통해 오픈 리포지터리와 애그리게이터가 수집(하베스트)할 수도 있습니다. 대상은 CV 레코드와 거기에 나열된 연구 성과(Dublin Core 또는 OpenAIRE 형식)입니다. 소속 기관 아래에 등재할지는 아래의 별도 선택입니다.",
    allowIndexingTitle:
      "기본적으로 꺼져 있습니다. 켜면 공개 CV가 검색 결과에 표시될 수 있고(이름, ORCID, 논문), OAI-PMH 엔드포인트를 통해 오픈 리포지터리와 애그리게이터가 수집할 수도 있습니다. 소속 기관 아래 등재는 별도의 옵트인입니다.",
    listUnderAffiliation: "리포지터리를 위해 현재 소속 기관 아래에 등재",
    listUnderAffiliationTitle:
      "기본적으로 꺼져 있습니다. 켜면 OAI-PMH 엔드포인트를 사용하는 하베스터가 현재 소속 기관의 ROR 세트(ror:<id>)로 당신의 CV를 선택할 수 있습니다. 색인 허용이 필요합니다.",
    listUnderAffiliationBody:
      "표시된 첫 번째 현재 직위의 소속 기관(ROR 식별자)에 해당하는 OAI-PMH 세트에 CV를 추가하여, 기관 단위로 수집하는 리포지터리나 CRIS가 찾을 수 있게 합니다. 본인이 직접 신고한 소속으로 표시되며, 기관의 공식 기록으로 취급되지 않습니다. 소속이 바뀌면 CV를 따라갑니다. 색인 허용이 필요하며 기본적으로 꺼져 있습니다. 한 기관 아래 등록된 연구자 수는 해당 기관 페이지(/i/<ror>)에 공개적으로 표시됩니다. 숫자만 표시되며 누구인지는 표시되지 않습니다.",
    listUnderAffiliationNoRor:
      "아직 사용할 수 없습니다: 표시된 현재 직위 중 ROR 기관 레코드에 연결된 것이 없습니다. 다시 동기화하거나 직위에 기관을 설정하세요.",
    showOnInstitutionPage: "소속 기관의 공개 페이지에 나를 표시",
    showOnInstitutionPageTitle:
      "기본적으로 꺼져 있습니다. 켜면 이름, ORCID iD, 현재 직위, 공개 페이지에 나열된 연구 성과가 선택한 기관의 공개 페이지(/i/<ROR id>)에 표시되고 그 집계에 포함됩니다. 색인 허용이 필요합니다. 언제든지 철회할 수 있으며 즉시 적용됩니다.",
    showOnInstitutionPageBody:
      "이름, ORCID iD, 현재 직위, 공개 페이지에 나열된 연구 성과가 SigmaCV의 소속 기관 공개 페이지에 표시되며, 페이지 집계(해당 기관을 등재한 연구자 수와 그 성과의 오픈 액세스 상태)에 포함됩니다. OpenAlex의 기록과 본인의 기록이 다른 부분에서는 집계만 표시됩니다. 아래에서 선택한 기관에 고정되며, 소속이 바뀌면 옮기지 않고 다시 묻습니다. 이전 소속에서 유지한 등재는 그 소속이 다시 현재 소속이 되면 재개됩니다. 등재는 자발적이며 등재되지 않았다는 사실은 아무 의미도 없습니다. 언제든지 철회할 수 있으며 즉시 적용됩니다.",
    institutionPagePick: "등재 기관",
    institutionPageListedUnder: "{institutions} 아래에 등재되어 있습니다.",
    institutionPageLapsed:
      "현재 소속이 바뀌었습니다: {institutions} 아래에 등재할지 확인해 주세요.",
    institutionPageLapsedNone:
      "현재 소속이 바뀌었고 현재 직위 중 ROR 기록에 연결된 것이 없습니다. 연결될 때까지 등재가 일시 중지됩니다.",
    institutionPageUnavailable:
      "사용할 수 없음: 검색 색인 허용과 ROR 기관 기록에 연결된 현재 직위가 필요합니다.",
    institutionPageSingle: "선택하면 {institution}에 등재됩니다.",
    institutionPageArmedHint:
      "아직 어디에도 등재되지 않았습니다. 아래에서 기관을 하나 이상 선택하세요.",
    institutionPageLapsedKept: "이전 소속에서 유지한 등재: ROR {rorId}",
    institutionPageRemove: "제거",
    publishTitle:
      "이 CV의 공유 가능한 공개 웹 페이지를 공개 링크로 생성합니다. 업데이트할 때마다 다시 동기화됩니다. 기본값은 꺼짐이며, 체크를 해제하면 오프라인으로 전환됩니다.",
    exportFormatTitle:
      "PDF는 템플릿과 정확히 일치합니다. LaTeX는 이에 가깝습니다(편집 가능한 소스). Word와 Markdown은 템플릿 스타일이 없는 편집 가능한 일반 텍스트입니다.",
    exportGroupDocuments: "문서",
    exportGroupData: "데이터",
    exportGroupGrantCv: "연구비 이력서 (지원기관 형식 초안)",
    exportPdf: "PDF — 인쇄용 이력서 (.pdf)",
    exportDocx: "Word — 단순, 편집 가능 (.docx)",
    exportLatexModern: "LaTeX — 편집 가능한 소스 (.tex)",
    exportMarkdown: "Markdown — 일반 텍스트 (.md)",
    exportHtml: "HTML — 독립형 웹 페이지 (.html)",
    exportBibtex: "BibTeX — 논문 목록 (.bib)",
    exportCslJson: "CSL-JSON — 인용 교환 형식 (.json)",
    exportJsonResume: "JSON Résumé — 표준 스키마 (.json)",
    exportRoCrate: "RO-Crate — 연구 객체 패키지 (.zip)",
    exportJson: "JSON — 이력서 데이터 (.json)",
    exportBiosketch: "NIH biosketch — 초안 (.md)",
    exportErc: "ERC — 연구 실적 (.md)",
    exportMsca: "MSCA — 연구 실적 (.md)",
    exportNsf: "NSF — 약력 (.md)",
    exportJsps: "JSPS/KAKENHI — 연구 실적 (.md)",
    itemUntitled: "제목 없음",
    dragItem: "드래그하여 순서 변경",
    manualPlaceholder: "예: 방문 연구원, MIT (2023)",
    entryTextAria: "항목 텍스트",
    rolePlaceholder: "직함 추가…",
    roleAria: "직책 또는 직함",
    revertToSource: "되돌리기",
    revertToSourceHint: "편집을 취소하고 ORCID/OpenAlex의 원래 텍스트로 복원합니다",
    matchedByIdentifier: "내 식별자로 매칭됨",
    matchedByIdOnly: "OpenAlex ID로만 매칭됨 — ORCID 미확인. 확인하세요",
    photoTooLarge: "이미지가 너무 큽니다 — 더 작은 이미지를 사용해 보세요.",
    previewTitle: "CV 미리보기",
    previewRendering: "미리보기 렌더링 중…",
    previewEmpty: "여기에 미리보기가 표시됩니다.",
    linksNav: "링크",
    coffee: "☕ 커피 한 잔 사주기",
    supportTitle: "SigmaCV는 무료이며 비영리입니다 — 커피 한 잔이 운영 비용에 보탬이 됩니다.",
    showWorkIndicators: "논문별 지표 표시(RCR, FWCI, 임상 인용)",
    showWorkIndicatorsNote:
      "NIH iCite와 OpenAlex가 보고한 논문별 값을 각각의 주의사항과 함께, 값이 있는 논문에만 표시합니다(RCR과 임상 인용은 생의학 전용). 합산·평균·순위 매기기는 하지 않습니다.",
    showCollaboration: "협력 범위 표시 (공저자 국가)",
    showCollaborationNote:
      "연구 요약에 한 줄을 추가합니다. 저자 목록에 등장하는 국가 수와 두 개 국가 이상에 걸친 논문의 비율을 OpenAlex 소속 데이터로 보여줍니다. 설명용일 뿐 지도나 순위는 없습니다.",
    showDataLinks: "각 논문 아래에 공개 데이터/코드 링크 표시",
    allowReaderMode: "공개 페이지에 “심사자 보기” 제공",
    allowReaderModeTitle:
      "심사자는 내 데이터에 담긴 모든 신뢰·맥락 신호를 드러내는 보기로 전환할 수 있습니다. 기본은 꺼짐이며 기본 페이지는 바뀌지 않습니다.",
    allowReaderModeNote:
      "리빙 CV 페이지에 작은 “심사자 보기” 링크를 추가합니다. 이 보기에서는 다음이 켜집니다: {list}. 철회된 연구는 배지와 함께 표시되고, 각 연구에 출처가 표시됩니다. 선택하지 않은 지표를 추가하는 일은 결코 없으며, 그곳의 어떤 것도 점수가 아닙니다.",
    readerViewUrlLabel: "심사자 보기:",
    readerViewUrlHint:
      "이 링크를 위원회에 전달하세요. 출처·검증·맥락 신호가 표시된 상태로 페이지가 열립니다.",
  },
  "ru-RU": {
    pageSizeLabel: "Размер страницы",
    pageSizeA4: "A4",
    pageSizeLetter: "US Letter",
    showCoauthorLinks: "Показывать соавторов из SigmaCV",
    coauthorLinkable: "Разрешить другим резюме SigmaCV ссылаться на моё",
    editDetails: "Изменить детали",
    departmentAria: "Подразделение",
    institutionAria: "Организация",
    editInstitutionHint: "Изменить название организации",
    publicationYearAria: "Год",
    venueAria: "Журнал / издание",
    startYearAria: "Год начала",
    endYearAria: "Год окончания",
    ongoingLabel: "По наст. время",
    resyncForDates: "Синхронизируйте заново, чтобы изменить даты",
    styleLegend: "Стиль",
    templateLabel: "Шаблон",
    citationLabel: "Стиль цитирования",
    yourStyles: "Ваши стили",
    journalStyles: "Стили журналов и научных обществ",
    styleLoading: "Загрузка стиля…",
    stylePickHint: "Выберите любой журнальный стиль — он применится ко всем ссылкам.",
    styleLoadError: "Не удалось загрузить этот стиль.",
    styleNetworkError: "Ошибка сети — пожалуйста, попробуйте ещё раз.",
    fontLabel: "Шрифт",
    densityLabel: "Плотность",
    fontSizeLabel: "Размер шрифта",
    accentLabel: "Акцент",
    customAccent: "Свой акцентный цвет",
    highlightSelf: "Выделить моё имя",
    highlightStyleLabel: "Стиль выделения",
    metricsLabel: "Метрики (необязательно — по умолчанию отсутствуют)",
    metricNoData: "(нет данных)",
    metricsPreset: "Пресет ответственных метрик",
    metricsPresetNote:
      "Только нормированные по области показатели (DORA / Leiden) — без журнальных приближений вроде Impact Factor.",
    authorshipLabel: "Сводная таблица авторства (только рецензируемые работы)",
    authorshipNote:
      "Добавляет таблицу с подсчётом, как часто вы являетесь первым / последним / корреспондирующим автором и т. д. Препринты не учитываются.",
    authorshipResyncNote:
      "⚠ Для ваших текущих публикаций эти показатели пусты. Нажмите Re-sync (вверху справа), чтобы загрузить позиции авторов из OpenAlex.",
    showCharts: "Показать графики (публикации и цитирования по годам)",
    showResearchAreas: "Показать области исследований (основные)",
    showOutputLedger: "Показать сводку результатов (число по типам)",
    holdNewForReview: "Проверять новые работы перед показом",
    featureItem: "Отметить как избранную / рекомендуемую публикацию",
    showOpenAccess: "Значки открытого доступа",
    showOpenAccessShare: "Доля открытого доступа в шапке",
    summaryBlockLabel: "Сводка исследований",
    summaryPosHeader: "В шапке",
    summaryPosTop: "Отдельный раздел",
    summaryPosBottom: "В конце",
    summaryPosHidden: "Скрыто",
    summaryHeadingLabel: "Заголовок (необязательно)",
    hideRetracted: "Скрывать отозванные публикации",
    showAuthorRole: "Показывать мою авторскую роль (первый / последний / корреспондирующий)",
    showCitationCounts: "Показывать число цитирований у каждой публикации",
    showVerifiedBadges: "Отмечать должности и образование, подтверждённые организацией через ORCID",
    showReplications: "Показывать данные о репликации у публикаций (FORRT/FReD)",
    showArchivalStatus: "Показывать статус архивации Software Heritage для программных элементов",
    showPublicEvaluations: "Показывать публичные оценки препринтов (Sciety)",
    showProvenance: "Нижний колонтитул с источниками данных",
    peerReviewedOnly: "Скрыть препринты и нерецензируемые работы",
    peerReviewedOnlyTitle:
      "Удаляет из CV ВСЕ нерецензируемые работы, включая весь ваш раздел «Препринты». Оставьте этот параметр ВЫКЛЮЧЕННЫМ, чтобы препринты оставались в списке (в отдельном разделе).",
    peerReviewedOnlyNote:
      "По умолчанию препринты сохраняются, но выводятся в отдельном разделе «Препринты». Включайте этот параметр, только если хотите полностью их убрать.",
    countLetters: "Включать письма (корреспонденцию)",
    countLettersTitle:
      "Письма / научная корреспонденция, опубликованные в журналах, проходят рецензирование, поэтому по умолчанию отображаются в списке и учитываются (графики, метрики, таблица авторства). Выключите для режима «только статьи», который убирает письма из списка и показателей. Препринты управляются отдельно (выше).",
    countLettersNote: "По умолчанию включено — письма рецензируются. Выключено = только статьи.",
    shownSuffix: "показано",
    dragSection: "Перетащите, чтобы изменить порядок раздела",
    sectionTitleAria: "Заголовок раздела",
    moveSectionUp: "Переместить раздел вверх",
    moveSectionDown: "Переместить раздел вниз",
    grantsPlaceholder: "Добавьте грант, напр. РНФ, 6 млн ₽ (2024–2027)",
    addEntryAria: "Добавить запись",
    tplClassic: "Классический",
    tplModern: "Современный",
    tplMinimal: "Минималистичный",
    tplCompact: "Компактный",
    tplSidebar: "Боковая панель (с фото)",
    tplEditorial: "Редакционный",
    tplAts: "Совместимый с ATS",
    hlAccent: "Акцентный цвет",
    hlBold: "Полужирный",
    hlUnderline: "Подчёркивание",
    hlAccentUnderline: "Акцент + подчёркивание",
    fontSerif: "Source Serif",
    fontSans: "Inter",
    fontPalatino: "EB Garamond",
    densityComfortable: "Комфортная",
    densityCompact: "Компактная",
    stopContributing: "Прекратить участие в исследовании",
    stopContributingTitle:
      "Сейчас вы передаёте анонимизированные данные о курировании для исследования. Нажмите, чтобы прекратить и отключить это.",
    exportData: "Экспортировать мои данные",
    deleteAccount: "Удалить аккаунт",
    deleteConfirm:
      "Безвозвратно удалить ваш аккаунт и все связанные данные? Это действие нельзя отменить.",
    deleteFailed: "Не удалось удалить аккаунт. Пожалуйста, попробуйте ещё раз.",
    consentWithdrawFailed: "Не удалось отозвать согласие. Пожалуйста, попробуйте ещё раз.",
    cancel: "Отмена",
    publishPublic: "Опубликовать публичную страницу",
    publicLive: "Публичная страница активна",
    publicSummary:
      "Создайте живую публичную страницу — одна ссылка, всегда синхронизированная с вашими последними работами, для подписи в почте, ORCID или сайта. Показываются имя, ORCID и оставленные публикации; эл. почта, телефон и местоположение остаются скрытыми, если вы не включите их ниже.",
    openPage: "Открыть страницу",
    copyLink: "Скопировать ссылку",
    linkCopied: "Ссылка скопирована!",
    shareHint: "Добавьте её в свой профиль ORCID, на сайт или в подпись в эл. письме.",
    publishError: "Не удалось обновить публичную страницу — попробуйте ещё раз.",
    publicContactLegend: "Показывать на публичной странице",
    publicShowEmail: "Эл. почта",
    publicShowPhone: "Телефон",
    publicShowLocation: "Местоположение",
    allowIndexing: "Разрешить индексирование этой страницы поисковыми системами",
    allowIndexingBody:
      "Именно так коллеги и работодатели находят ваши работы в Google и других поисковых системах. Рекомендуется — вы можете отключить это в любой момент. Индексируемую страницу также могут собирать открытые репозитории и агрегаторы через точку доступа OAI-PMH SigmaCV (/api/oai): запись вашего резюме и перечисленные в нём работы в формате Dublin Core или OpenAIRE. Включение в набор вашей организации — отдельный выбор ниже.",
    allowIndexingTitle:
      "По умолчанию выключено. Если включить, ваше публичное резюме может появляться в результатах поиска (имя, ORCID, публикации) и собираться открытыми репозиториями и агрегаторами через точку доступа OAI-PMH. Включение в набор вашей организации — отдельное согласие.",
    listUnderAffiliation: "Включить меня в набор моей текущей организации для репозиториев",
    listUnderAffiliationTitle:
      "По умолчанию выключено. Если включить, харвестеры, использующие точку доступа OAI-PMH, смогут выбирать ваше резюме по набору ROR вашей текущей организации (ror:<id>). Требуется индексация.",
    listUnderAffiliationBody:
      "Добавляет ваше резюме в набор OAI-PMH организации из вашей первой видимой текущей должности (её идентификатор ROR), чтобы репозиторий или CRIS, собирающий данные по организациям, мог его найти. Помечается как заявленная вами аффилиация и никогда — как реестр вашей организации. Следует за резюме при смене аффилиации; требует индексации; по умолчанию выключено. Число исследователей, перечисленных под учреждением, публично показывается на странице учреждения (/i/<ror>) — только число, никогда не имена.",
    listUnderAffiliationNoRor:
      "Пока недоступно: ни одна из ваших видимых текущих должностей не связана с записью организации в ROR. Выполните повторную синхронизацию или укажите организацию в должности.",
    showOnInstitutionPage: "Показывать меня на публичной странице моей организации",
    showOnInstitutionPageTitle:
      "По умолчанию выключено. При включении ваше имя, ORCID iD, текущая должность и работы, перечисленные на вашей публичной странице, появляются на публичной странице отмеченных вами организаций (/i/<ROR id>) и учитываются в её показателях. Требует индексации. Можно отозвать в любой момент, вступает в силу немедленно.",
    showOnInstitutionPageBody:
      "Ваше имя, ORCID iD, текущая должность и работы, перечисленные на вашей публичной странице, появляются на публичной странице вашей организации в SigmaCV, и вы учитываетесь в её показателях (сколько исследователей её указали и статус открытого доступа их работ). Там, где запись OpenAlex и ваша расходятся, показываются только подсчёты. Закреплено за организациями, которые вы отметите ниже: при смене аффилиации мы спросим снова, а не перенесём вас. Размещение, сохранённое от прежней аффилиации, возобновляется, если эта аффилиация снова станет текущей. Размещение добровольно, а его отсутствие ничего не значит. Вы можете отозвать согласие в любой момент, вступает в силу немедленно.",
    institutionPagePick: "Разместить меня под",
    institutionPageListedUnder: "Вы размещены под {institutions}.",
    institutionPageLapsed:
      "Ваша текущая аффилиация изменилась: подтвердите, размещать ли вас под {institutions}.",
    institutionPageLapsedNone:
      "Ваша текущая аффилиация изменилась, и ни одна из ваших текущих должностей не связана с записью ROR; размещение приостановлено, пока связь не появится.",
    institutionPageUnavailable:
      "Недоступно: требуется индексация поисковыми системами и текущая должность, связанная с записью организации ROR.",
    institutionPageSingle: "Если отметить, вы будете размещены под {institution}.",
    institutionPageArmedHint: "Пока нигде не размещено — отметьте ниже хотя бы одну организацию.",
    institutionPageLapsedKept: "Сохранено от прежней аффилиации: ROR {rorId}",
    institutionPageRemove: "Удалить",
    publishTitle:
      "Создаёт публичную веб-страницу этого CV, доступную по публичной ссылке. Она пересинхронизируется по мере ваших изменений. По умолчанию отключено; снимите галочку, чтобы перевести её в офлайн.",
    exportFormatTitle:
      "PDF в точности соответствует вашему шаблону. LaTeX близко следует ему (редактируемый исходник). Word и Markdown — простой редактируемый текст без стилей шаблона.",
    exportGroupDocuments: "Документы",
    exportGroupData: "Данные",
    exportGroupGrantCv: "CV для грантов (черновики по форме фонда)",
    exportPdf: "PDF — резюме для печати (.pdf)",
    exportDocx: "Word — простой, редактируемый (.docx)",
    exportLatexModern: "LaTeX — редактируемый исходник (.tex)",
    exportMarkdown: "Markdown — простой текст (.md)",
    exportHtml: "HTML — автономная веб-страница (.html)",
    exportBibtex: "BibTeX — список публикаций (.bib)",
    exportCslJson: "CSL-JSON — обмен ссылками (.json)",
    exportJsonResume: "JSON Résumé — стандартная схема (.json)",
    exportRoCrate: "RO-Crate — исследовательский объект (.zip)",
    exportJson: "JSON — данные резюме (.json)",
    exportBiosketch: "NIH biosketch — черновик (.md)",
    exportErc: "ERC — научный путь (.md)",
    exportMsca: "MSCA — научный путь (.md)",
    exportNsf: "NSF — биографическая справка (.md)",
    exportJsps: "JSPS/KAKENHI — научный путь (.md)",
    itemUntitled: "Без названия",
    dragItem: "Перетащите, чтобы изменить порядок",
    manualPlaceholder: "напр. Приглашённый исследователь, MIT (2023)",
    entryTextAria: "Текст записи",
    rolePlaceholder: "Добавьте должность…",
    roleAria: "Должность или звание",
    revertToSource: "Сбросить",
    revertToSourceHint: "Отменить правку и восстановить исходный текст из ORCID/OpenAlex",
    matchedByIdentifier: "Сопоставлено по вашему идентификатору",
    matchedByIdOnly: "Сопоставлено только по OpenAlex ID — не подтверждено ORCID; проверьте",
    photoTooLarge: "Это изображение слишком большое — попробуйте поменьше.",
    previewTitle: "Предпросмотр CV",
    previewRendering: "Формирование предпросмотра…",
    previewEmpty: "Здесь появится предпросмотр.",
    linksNav: "Ссылки",
    coffee: "☕ Купите мне кофе",
    supportTitle: "SigmaCV бесплатен и некоммерческий — чашка кофе помогает покрыть расходы.",
    showWorkIndicators:
      "Показывать индикаторы у каждой публикации (RCR, FWCI, клинические цитирования)",
    showWorkIndicatorsNote:
      "Значения по каждой работе, как их сообщают NIH iCite и OpenAlex, каждое со своей оговоркой, показываются только у работ, где они есть (RCR и клинические цитирования — только биомедицина). Ничего не суммируется, не усредняется и не ранжируется.",
    showCollaboration: "Показать широту сотрудничества (страны соавторов)",
    showCollaborationNote:
      "Одна строка в сводке исследований: сколько стран встречается в ваших списках авторов и какая доля работ охватывает не менее двух, по данным OpenAlex об аффилиациях. Только описание — без карты и рейтинга.",
    showDataLinks: "Показывать ссылки на открытые данные / код под каждой публикацией",
    allowReaderMode: "Предлагать «режим эксперта» на публичной странице",
    allowReaderModeTitle:
      "Эксперты смогут переключиться на представление, раскрывающее все признаки достоверности и контекста в ваших данных. По умолчанию выключено; ваша обычная страница не меняется.",
    allowReaderModeNote:
      "Добавляет на вашу живую страницу небольшую ссылку «Режим эксперта». В этом режиме включаются: {list}; отозванные работы показываются с отметкой; у каждой работы указывается её источник. Он никогда не добавляет показатели, которые вы не выбирали, — ничто там не является оценкой.",
    readerViewUrlLabel: "Режим эксперта:",
    readerViewUrlHint:
      "Передайте эту ссылку комиссии — она открывает вашу страницу с показанными признаками происхождения, подтверждения и контекста.",
  },
};

/** Localized editor/app-chrome strings (falls back to English). */
export function ui(locale: string): UiStrings {
  return UI_I18N[asLocale(locale)];
}
