import type { DegreeLevel, SupervisionRole, SupervisionStatus } from "@/lib/canonical/schema";
import { asLocale, type Locale } from "./index";
import type { CreditRole } from "@/lib/canonical/credit";

/**
 * Localized strings that appear in the RENDERED CV (the exported PDF/DOCX/LaTeX/
 * Markdown and the public page) — charts, the metrics line, the authorship
 * table, and the provenance footer. Keyed off `cv.display.locale` so the
 * document is fully in the chosen language. Distinct from the editor chrome
 * dictionary (`t`), but enforced the same way: Record<Locale, RenderStrings>
 * makes a missing translation a compile error.
 */
export interface RenderStrings {
  chartPublicationsPerYear: string;
  chartCitationsPerYear: string;
  authorshipCaption: string;
  /** Caveat shown under the authorship table when a "corresponding" row is present. */
  authorshipCorrespondingNote: string;
  /** Provenance caveat: peer-reviewed vs preprint split is a heuristic. */
  provClassificationNote: string;
  provGeneratedFrom: string;
  provOn: string;
  provRecords: string;
  provHidden: string;
  provCorrected: string;
  sourceManualEntries: string;
  sourceDerived: string;
  cvFallbackTitle: string;
  /** Date-range term for an ongoing position/education entry ("…–present"). */
  datePresent: string;
  /** Date-range term for an end-only range; "{year}" → the end year ("until {year}"). */
  dateUntil: string;
  /** Short label inside the open-access badge on a publication entry. */
  badgeOpenAccess: string;
  /** Accessible title/tooltip for the OA badge; "{status}" → the OA status. */
  badgeOpenAccessTitle: string;
  /** Profile-level open-access label (the metric-row term, e.g. "Open access");
   *  the percentage value is formatted separately at render time. */
  openAccessLabel: string;
  /** Default heading for the research-summary block when it renders as its own
   *  section ("top"/"bottom" placement) and the user left the heading blank. */
  researchSummaryHeading: string;
  /** Public "What's new" strip label — the most recent sync's additions. */
  whatsNewLabel: string;
  /** Accessible label for the research-output breadth ledger ("N Publications · …"). */
  outputSummaryLabel: string;
  /** Inline "Retracted" badge label on a retracted publication entry. */
  badgeRetracted: string;
  /** Accessible title/tooltip for the retracted badge. */
  badgeRetractedTitle: string;
  /** Per-entry citation-count badge; "{n}" → the (locale-formatted) count. */
  badgeCitations: string;
  /** Tooltip caveat on the citation pill (raw counts aren't field-normalised). */
  badgeCitationsTitle: string;
  /** Label inside the opt-in "Verified" mark on an institution-asserted entry. */
  badgeVerified: string;
  /** Accessible title for the verified mark when the asserting organisation is unknown. */
  badgeVerifiedTitle: string;
  /** Accessible title for the verified mark; "{org}" → the asserting organisation. */
  badgeVerifiedByTitle: string;
  /** Plain-text per-entry verified mark for the text exports (DOCX / Markdown / LaTeX /
   *  JSON Résumé) and the parser-safe ATS template — printed in parentheses right after
   *  the entry, lower-case so it reads as a clause; "{org}" → the asserting organisation. */
  verifiedByText: string;
  /** Same, when the asserting organisation is unknown (generic "via ORCID" wording). */
  verifiedGenericText: string;
  metric2yr: string;
  metricFwci: string;
  metricHIndex: string;
  metricI10: string;
  metricWorks: string;
  metricCitations: string;
  metricContextFwci: string;
  metricContext2yr: string;
  /** Coverage note appended to mean-FWCI; "{n}" is replaced with the work count. */
  metricFwciCoverage: string;
  /** Label for the NIH iCite mean-RCR metric. */
  metricRcr: string;
  /** Responsible-reading context for mean-RCR (benchmark + biomedical caveat). */
  metricContextRcr: string;
  /** Reader-facing caveat for the h-index (not field-normalised; career-length-sensitive). */
  metricContextHIndex: string;
  /** Reader-facing caveat for the i10-index (works with ≥10 citations; not field-normalised). */
  metricContextI10: string;
  /** Reader-facing caveat for the raw works count (coverage-dependent; not a quality measure). */
  metricContextWorks: string;
  /** Reader-facing caveat for the raw citation total (not field-normalised). */
  metricContextCitations: string;
  /** Coverage note appended to mean-RCR; "{n}" is replaced with the work count. */
  metricRcrCoverage: string;
  /** Small-sample caveat appended to a field-normalized coverage note below the
   *  reliability threshold. */
  metricSmallN: string;
  roleFirst: string;
  roleSecond: string;
  roleThird: string;
  roleMiddle: string;
  roleSecondLast: string;
  roleLast: string;
  roleCorresponding: string;
  /** Prefix of the public-page "Made with SigmaCV" footer; "SigmaCV" follows untranslated. */
  madeWith: string;
  /** Label beside the document QR + link to this CV's public live page ("Live version"). */
  liveVersionLabel: string;
  /** Public-page "living CV" line; "{date}" is the localized last-synced date. */
  livingNote: string;
  /** Public-page hint that the publications can be saved to a reference manager
   *  (Zotero/Mendeley) via the browser connector — the page carries COinS metadata. */
  refManagerNote: string;
  /** Public-page footer credit for the "Hanko" style's brushed-kanji section
   *  headings. "{kanjivg}" → the linked "KanjiVG" term; the proper nouns
   *  (Yuji Boku) and licence identifiers (CC BY-SA 3.0, SIL OFL) stay untranslated. */
  hankoCredit: string;
  /** Heading for the public-page "Co-authors on SigmaCV" block (opt-in); "SigmaCV" stays untranslated. */
  coauthorsHeading: string;
  /** Tooltip/aria for the institution→ROR-record link on a positions/education line. */
  rorRecordTitle: string;
  /** Tooltip/aria when the institution name links to its own homepage (ROR `links.website`). */
  institutionSiteTitle: string;
  /** Header label for the aggregated "Research areas" chip row (opt-in). */
  researchAreasLabel: string;
  /** Public-page per-publication "Cite" disclosure label. */
  citeLabel: string;
  /** Public-page per-publication "Abstract" disclosure label. */
  abstractLabel: string;
  /** Public-page per-publication open-access "Full text" link label. */
  fullTextLabel: string;
  /** "Selected" star badge on a featured publication. */
  badgeFeatured: string;
  /** Tooltip for the featured-publication star badge. */
  badgeFeaturedTitle: string;
  /** Public-page "Subscribe" (Atom/RSS feed) link label. */
  subscribeLabel: string;
  /** Hint shown when the public-page "Subscribe" disclosure is opened — explains that the feed URL goes into an RSS reader. */
  subscribeHint: string;
  /** Leading label of the public-page view-filter bar. */
  filterLabel: string;
  /** Filter chip: clear all filters / show everything. */
  filterAll: string;
  /** Filter chip for a year cutoff; "{year}" -> the start year ("Since 2021"). */
  filterSince: string;
  /** Filter chip: open-access works only. */
  filterOpenAccess: string;
  /** Work-type filter chip labels (bucketed: article/preprint/review/conference/book/dataset). */
  filterTypeArticle: string;
  filterTypePreprint: string;
  filterTypeReview: string;
  filterTypeConference: string;
  filterTypeBook: string;
  filterTypeDataset: string;
  /** Per-work RCR pill (opt-in `showWorkIndicators`); "{v}" → the locale-formatted value. */
  indicatorRcr: string;
  /** Tooltip caveat on the RCR pill (NIH iCite; biomedical-only). */
  indicatorRcrTitle: string;
  /** Per-work FWCI pill; "{v}" → the locale-formatted value. */
  indicatorFwci: string;
  /** Tooltip caveat on the FWCI pill (OpenAlex). */
  indicatorFwciTitle: string;
  /** Per-work clinical-citations pill, plural; "{n}" → the count. */
  indicatorClinicalCitations: string;
  /** Per-work clinical-citations pill, singular; "{n}" → the count (1). */
  indicatorClinicalCitationOne: string;
  /** Structured label of the clinical-citations indicator. */
  indicatorClinicalCitationsLabel: string;
  /** Tooltip caveat on the clinical-citations pill (NIH iCite). */
  indicatorClinicalCitationsTitle: string;
  /** Per-work pill for a work iCite classifies as a clinical article. */
  indicatorClinical: string;
  /** Tooltip on the clinical-article pill. */
  indicatorClinicalTitle: string;
  /** Heading of the opt-in provenance-ledger table (footer + editor panel). */
  provLedgerTitle: string;
  /** Editor-panel caveat under the ledger: it measures the document, never the person. */
  provLedgerNote: string;
  provLedgerIdentifier: string;
  provLedgerClaimed: string;
  provLedgerSelfEntered: string;
  provLedgerNameMatched: string;
  provLedgerOther: string;
  provLedgerVerified: string;
  provLedgerPid: string;
  provLedgerReviewed: string;
  provLedgerRetracted: string;
  /** Ledger figure; "{n}", "{total}", "{pct}" substituted at render. */
  provLedgerOf: string;
  /** Collaboration-breadth line; "{countries}" and "{pct}" substituted. */
  collabLine: string;
  /** Same line for a single country ("{pct}" only). */
  collabLineOne: string;
  /** Top-countries clause; "{list}" is a locale-joined list of country names. */
  collabTop: string;
  /** Basis clause; "{n}" → the number of works with country data. */
  collabContext: string;
  /** Leading label of the opt-in CRediT contribution line under a citation ("Roles:"). */
  creditRolesLabel: string;
  /** Tooltip when the roles were declared by the account holder in the editor. */
  creditRolesSelfTitle: string;
  /** Tooltip when the roles were read from the publisher's Crossref deposit. */
  creditRolesCrossrefTitle: string;
  /** Localised names of the 14 CRediT contributor roles, keyed by canonical id. */
  creditRoles: Record<CreditRole, string>;
  /** Header label of the opt-in, owner-declared "Career context" block. */
  careerContextLabel: string;
  /** Kind labels for career-context entries (`CAREER_CONTEXT_KINDS`). */
  careerKindCareerBreak: string;
  careerKindPartTime: string;
  careerKindClinicalDuties: string;
  careerKindCaring: string;
  careerKindMilitary: string;
  careerKindOther: string;
  /** "First publication: {year} ({n} years active)" context line. */
  careerFirstPublication: string;
  /** Supervision record: degree-level labels (the lead line, the summary line, the editor selects). */
  degreeBachelor: string;
  degreeMaster: string;
  degreePhd: string;
  degreePostdoc: string;
  degreeClinicalFellow: string;
  degreeOther: string;
  /** Supervision record: the degree-level NOUN shown in place of a hidden supervisee name. */
  superviseeBachelor: string;
  superviseeMaster: string;
  superviseePhd: string;
  superviseePostdoc: string;
  superviseeClinicalFellow: string;
  superviseeOther: string;
  /** Supervision record: the owner's role labels (lower-case, they follow the degree in the lead line). */
  supervisionRolePrimary: string;
  supervisionRoleCo: string;
  supervisionRoleCommittee: string;
  supervisionRoleMentor: string;
  /** Supervision record: status terms ("ongoing" renders as a badge). */
  supervisionStatusOngoing: string;
  supervisionStatusCompleted: string;
  supervisionStatusDiscontinued: string;
  /** Supervision record sub-line: "where they went next"; "{position}" → the current position. */
  supervisionNow: string;
  /** Supervision summary line head; "{n}" → the total number supervised. */
  supervisionSummaryTotal: string;
  /** Supervision summary per-level parenthetical; "{n}" → the completed count. */
  supervisionSummaryCompleted: string;
  /** Label of the opt-in open data / code line under a publication ("Data: …"). */
  dataLinksLabel: string;
  /** Label of the software part of that line ("Code: …"). */
  codeLinksLabel: string;
  /** FORRT/FReD replication-evidence line under a work that has been replicated;
   *  "{n}" -> the (locale-formatted) replication count. */
  replicatedLabel: string;
  /** Leading label of the FORRT/FReD line under a work that IS a replication
   *  study, followed by the original work's reference/DOI link. */
  replicatedOfLabel: string;
  /** Generic FReD outcome bucket, localized (the dataset's own non-generic
   *  outcome text is shown verbatim instead when it doesn't match a bucket). */
  outcomeSuccess: string;
  outcomeFailure: string;
  outcomeMixed: string;
  outcomeInformativeFailure: string;
  /** Small "Archived (Software Heritage)" badge label on a software item with a
   *  recorded Software Heritage snapshot (opt-in `display.showArchivalStatus`). */
  badgeArchived: string;
  /** Tooltip for the archived-software badge. */
  badgeArchivedTitle: string;
  /** Prefix of the muted "Publicly evaluated: eLife (2024) · PREreview (2024)"
   *  line after a preprint with Sciety-aggregated public evaluations (opt-in
   *  `display.showPublicEvaluations`). The group names + years follow, built at
   *  render time — not part of this string. */
  publicEvaluationsPrefix: string;
  /** Link text for a software item's source-code repository (`meta.repositoryUrl`),
   *  in the muted details line under a Software entry. */
  softwareRepository: string;
  /** "Version 1.2.0" — the released version of a software item (`meta.version`).
   *  `{version}` is substituted at render time. */
  softwareVersion: string;
  /** "License: MIT" — the reuse licence of a software item (`meta.license`).
   *  `{license}` is substituted at render time. */
  softwareLicense: string;
  /** Public-page link to the assessor "Reader view" (`?view=reader`), shown only when the owner opted in. */
  readerLinkLabel: string;
  /** Tooltip on that link. */
  readerLinkTitle: string;
  /** Banner at the top of the reader view: what it shows, and that nothing in it is a score. */
  readerBannerText: string;
  /** Banner link back to the standard page. */
  readerBannerBack: string;
  /** Reader-view per-item provenance: how the work was tied to the owner (ORCID iD match). */
  provMatchOrcid: string;
  /** Reader-view per-item provenance: OpenAlex author-ID match. */
  provMatchOpenAlexId: string;
  /** Reader-view per-item provenance: both identifiers matched. */
  provMatchBoth: string;
  /** Reader-view per-item provenance: the owner added the work by DOI with no identifier match. */
  provMatchClaimed: string;
  /** Reader-view per-item provenance when no match basis is on the item; "{source}" → the source name (OpenAlex, DataCite, …). */
  provSourceOf: string;
  /** Reader-view per-item provenance for a manual (owner-entered) item. */
  provSourceManual: string;
  /** Reader-view per-item provenance fragment: metadata gap-filled from Crossref. */
  provEnriched: string;
  /** Reader-view per-item provenance fragment: the item carries a review flag. */
  provUnderReview: string;
  /** Reader-view per-item provenance fragment: freshness; "{date}" → the localized date the item was last re-fetched. */
  provLastVerified: string;
  /** Short reader-view mark label for an owner-claimed work (the proper-noun labels "ORCID"/"OpenAlex ID" are not translated). */
  provLabelClaimed: string;
  /** Short reader-view mark label for a manual (owner-entered) item. */
  provLabelManual: string;
  /** Tail appended to a citation whose style truncated the author list PAST the owner ("et al."), so the account holder still appears in their own entry; "{name}" → the owner's printed name, "{position}" → 1-based author position, "{count}" → total authors. */
  selfAuthorTail: string;
}

const RENDER_I18N: Record<Locale, RenderStrings> = {
  "en-US": {
    hankoCredit:
      "Section names brushed stroke by stroke · stroke order {kanjivg} (CC BY-SA 3.0) · brush face Yuji Boku (SIL OFL)",
    refManagerNote:
      "Save these publications to a reference manager (Zotero, Mendeley…) — your browser connector will detect them.",
    researchAreasLabel: "Research areas",
    citeLabel: "Cite",
    abstractLabel: "Abstract",
    fullTextLabel: "Full text",
    badgeFeatured: "Selected",
    badgeFeaturedTitle: "Selected / featured publication",
    subscribeLabel: "Subscribe",
    subscribeHint: "Add this feed URL to your RSS reader:",
    filterLabel: "Filter",
    filterAll: "All",
    filterSince: "Since {year}",
    filterOpenAccess: "Open access",
    filterTypeArticle: "Articles",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Reviews",
    filterTypeConference: "Conference",
    filterTypeBook: "Books",
    filterTypeDataset: "Datasets",
    badgeArchived: "Archived",
    badgeArchivedTitle: "Archived by Software Heritage — a permanent snapshot of the source code",
    publicEvaluationsPrefix: "Publicly evaluated:",
    coauthorsHeading: "Co-authors on SigmaCV",
    datePresent: "present",
    dateUntil: "until {year}",
    chartPublicationsPerYear: "Publications / year",
    chartCitationsPerYear: "Citations / year",
    authorshipCaption: "Authorship (peer-reviewed)",
    authorshipCorrespondingNote: "Corresponding-author data (OpenAlex) is often incomplete.",
    provClassificationNote: "Peer-reviewed vs. preprint classification is heuristic.",
    provGeneratedFrom: "Generated from",
    provOn: "on",
    provRecords: "records",
    provHidden: "hidden",
    provCorrected: "corrected",
    sourceManualEntries: "manual entries",
    sourceDerived: "derived",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Open access ({status})",
    openAccessLabel: "Open access",
    researchSummaryHeading: "Research summary",
    whatsNewLabel: "Recently added",
    outputSummaryLabel: "Research output",
    badgeRetracted: "Retracted",
    badgeRetractedTitle: "This work has been retracted (per Crossref / Retraction Watch)",
    badgeCitations: "{n} citations",
    badgeCitationsTitle: "Raw citation count — not field-normalised (varies by field and age)",
    verifiedByText: "verified by {org}",
    verifiedGenericText: "verified via ORCID",
    badgeVerified: "Verified",
    badgeVerifiedTitle:
      "Confirmed by the institution via ORCID — asserted by a trusted organisation, not self-entered",
    badgeVerifiedByTitle:
      "Verified by {org} via ORCID — asserted by the organisation, not self-entered",
    metric2yr: "2-yr mean citedness",
    metricFwci: "Mean work FWCI",
    metricHIndex: "h-index",
    metricI10: "i10-index",
    metricWorks: "Works",
    metricCitations: "Citations",
    metricContextFwci: "1.0 = world average for field & year",
    metricContext2yr: "2-year citation rate — not field-normalised (varies by field)",
    metricFwciCoverage: "mean over {n} works with FWCI",
    metricRcr: "Mean RCR",
    metricContextRcr: "1.0 = NIH-funded average; biomedical (PMID) works only",
    metricContextHIndex: "not field-normalised; sensitive to career length and field",
    metricContextI10: "works with ≥10 citations — not field-normalised; grows with career length",
    metricContextWorks:
      "raw count of indexed works — depends on database coverage; not a measure of quality",
    metricContextCitations: "raw total — not field-normalised (varies by field and career length)",
    metricRcrCoverage: "mean over {n} works with RCR",
    metricSmallN: "small sample — interpret with caution",
    roleFirst: "First author",
    roleSecond: "Second author",
    roleThird: "Third author",
    roleMiddle: "k-th author",
    roleSecondLast: "Second-to-last author",
    roleLast: "Last author",
    roleCorresponding: "Corresponding author",
    madeWith: "Made with",
    liveVersionLabel: "Live version",
    livingNote: "Updated {date} · living CV, updates automatically",
    rorRecordTitle: "ROR organization record",
    institutionSiteTitle: "Institution website",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) — field-normalised citation rate; 1.0 = the average NIH-funded article. Biomedical works only.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) — citations relative to works of the same field, type and year; 1.0 = average.",
    indicatorClinicalCitations: "cited by {n} clinical articles",
    indicatorClinicalCitationOne: "cited by {n} clinical article",
    indicatorClinicalCitationsLabel: "Clinical citations",
    indicatorClinicalCitationsTitle:
      "Number of clinical articles (guidelines, clinical trials) citing this work, per NIH iCite. Biomedical works only.",
    indicatorClinical: "Clinical article",
    indicatorClinicalTitle:
      "NIH iCite classifies this work as a clinical article (guideline or clinical study).",
    provLedgerTitle: "Provenance ledger",
    provLedgerNote:
      "How verifiable this document is — each line counts entries shown, with its own denominator. Not an assessment of the researcher, and never a score.",
    provLedgerIdentifier: "Matched by identifier (ORCID / OpenAlex)",
    provLedgerClaimed: "Added by DOI (owner-asserted)",
    provLedgerSelfEntered: "Entered by hand",
    provLedgerNameMatched: "Matched by name only",
    provLedgerOther: "Other attribution",
    provLedgerVerified: "Positions, education and distinctions asserted by a trusted organisation",
    provLedgerPid: "Resolvable by a persistent identifier (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Source-attributed publications confirmed by the owner",
    provLedgerRetracted: "Retracted works shown",
    provLedgerOf: "{n} of {total} ({pct})",
    collabLine: "Co-authors from {countries} countries · {pct} of works international",
    collabLineOne: "Co-authors from one country · {pct} of works international",
    collabTop: "most often {list}",
    collabContext: "based on OpenAlex affiliation data; n = {n}",
    creditRolesLabel: "Roles:",
    creditRolesSelfTitle: "Self-declared",
    creditRolesCrossrefTitle: "From publisher metadata (Crossref)",
    creditRoles: {
      conceptualization: "Conceptualization",
      "data-curation": "Data curation",
      "formal-analysis": "Formal analysis",
      "funding-acquisition": "Funding acquisition",
      investigation: "Investigation",
      methodology: "Methodology",
      "project-administration": "Project administration",
      resources: "Resources",
      software: "Software",
      supervision: "Supervision",
      validation: "Validation",
      visualization: "Visualization",
      "writing-original-draft": "Writing – original draft",
      "writing-review-editing": "Writing – review & editing",
    },
    careerContextLabel: "Career context (self-declared)",
    careerKindCareerBreak: "Career break",
    careerKindPartTime: "Part-time",
    careerKindClinicalDuties: "Clinical duties alongside research",
    careerKindCaring: "Caring responsibilities",
    careerKindMilitary: "Military service",
    careerKindOther: "Other",
    careerFirstPublication: "First publication: {year} ({n} years active)",
    degreeBachelor: "Bachelor's",
    degreeMaster: "Master's",
    degreePhd: "PhD",
    degreePostdoc: "Postdoc",
    degreeClinicalFellow: "Clinical fellow",
    degreeOther: "Other",
    superviseeBachelor: "Undergraduate student",
    superviseeMaster: "Master's student",
    superviseePhd: "PhD student",
    superviseePostdoc: "Postdoctoral researcher",
    superviseeClinicalFellow: "Clinical fellow",
    superviseeOther: "Supervisee",
    supervisionRolePrimary: "primary supervisor",
    supervisionRoleCo: "co-supervisor",
    supervisionRoleCommittee: "committee member",
    supervisionRoleMentor: "mentor",
    supervisionStatusOngoing: "ongoing",
    supervisionStatusCompleted: "completed",
    supervisionStatusDiscontinued: "discontinued",
    supervisionNow: "now: {position}",
    supervisionSummaryTotal: "{n} supervised",
    supervisionSummaryCompleted: "{n} completed",
    dataLinksLabel: "Data",
    codeLinksLabel: "Code",
    replicatedLabel: "Replicated: {n} studies",
    replicatedOfLabel: "Replication of:",
    outcomeSuccess: "successful",
    outcomeFailure: "failed",
    outcomeMixed: "mixed",
    outcomeInformativeFailure: "informative failure",
    softwareRepository: "Source code",
    softwareVersion: "Version {version}",
    softwareLicense: "License: {license}",
    readerLinkLabel: "Reader view",
    readerLinkTitle: "Show the provenance, verification and context signals in the owner's data",
    readerBannerText:
      "Reader view: shows provenance, verification and context signals from the owner's data. Nothing here is a score.",
    readerBannerBack: "Back to the standard page",
    provMatchOrcid: "Matched to the owner by ORCID iD",
    provMatchOpenAlexId: "Matched to the owner by OpenAlex author ID",
    provMatchBoth: "Matched to the owner by ORCID iD and OpenAlex author ID",
    provMatchClaimed: "Added by the owner by DOI — no identifier match on the record",
    provSourceOf: "Record from {source}",
    provSourceManual: "Entered by the owner",
    provEnriched: "metadata completed from Crossref",
    provUnderReview: "flagged for the owner's review",
    provLastVerified: "last verified {date}",
    provLabelClaimed: "Claimed",
    provLabelManual: "Manual",
    selfAuthorTail: "incl. {name}, author {position} of {count}",
  },
  "zh-CN": {
    hankoCredit:
      "栏目名称按笔顺逐笔书写 · 笔顺数据 {kanjivg}（CC BY-SA 3.0）· 毛笔字体 Yuji Boku（SIL OFL）",
    refManagerNote:
      "可将这些论文保存到文献管理器（Zotero、Mendeley 等）——你的浏览器连接器会自动识别它们。",
    researchAreasLabel: "研究领域",
    citeLabel: "引用",
    abstractLabel: "摘要",
    fullTextLabel: "全文",
    badgeFeatured: "精选",
    badgeFeaturedTitle: "精选 / 重点论文",
    subscribeLabel: "订阅",
    subscribeHint: "将此订阅源网址添加到您的 RSS 阅读器：",
    filterLabel: "筛选",
    filterAll: "全部",
    filterSince: "{year} 年起",
    filterOpenAccess: "开放获取",
    filterTypeArticle: "论文",
    filterTypePreprint: "预印本",
    filterTypeReview: "综述",
    filterTypeConference: "会议",
    filterTypeBook: "书籍",
    filterTypeDataset: "数据集",
    badgeArchived: "已存档",
    badgeArchivedTitle: "由 Software Heritage 存档——源代码的永久快照",
    publicEvaluationsPrefix: "公开评审：",
    coauthorsHeading: "也在 SigmaCV 的合作者",
    datePresent: "至今",
    dateUntil: "至 {year}",
    chartPublicationsPerYear: "年度发表数",
    chartCitationsPerYear: "年度被引数",
    authorshipCaption: "作者署名（同行评审）",
    authorshipCorrespondingNote: "通讯作者数据（来自 OpenAlex）通常不完整。",
    provClassificationNote: "同行评审与预印本的分类为启发式判断。",
    provGeneratedFrom: "数据来源",
    provOn: "时间",
    provRecords: "条记录",
    provHidden: "已隐藏",
    provCorrected: "已更正",
    sourceManualEntries: "手动录入",
    sourceDerived: "推导得出",
    cvFallbackTitle: "简历",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "开放获取（{status}）",
    openAccessLabel: "开放获取",
    researchSummaryHeading: "研究概要",
    whatsNewLabel: "最近新增",
    outputSummaryLabel: "研究产出",
    badgeRetracted: "已撤稿",
    badgeRetractedTitle: "该成果已被撤稿（依据 Crossref／Retraction Watch）",
    badgeCitations: "被引 {n}",
    badgeCitationsTitle: "原始被引次数——未经领域标准化（因领域与年代而异）",
    verifiedByText: "由 {org} 认证",
    verifiedGenericText: "通过 ORCID 认证",
    badgeVerified: "已认证",
    badgeVerifiedTitle: "由所在机构通过 ORCID 确认——由受信任的机构录入，而非本人自行填写",
    badgeVerifiedByTitle: "由 {org} 通过 ORCID 认证——由该机构录入，而非本人自行填写",
    metric2yr: "两年平均被引率",
    metricFwci: "平均成果 FWCI",
    metricHIndex: "h 指数",
    metricI10: "i10 指数",
    metricWorks: "成果数",
    metricCitations: "被引数",
    metricContextFwci: "1.0 = 同领域同年度的全球平均水平",
    metricContext2yr: "两年期被引率 — 非领域归一化（因领域而异）",
    metricFwciCoverage: "基于 {n} 篇有 FWCI 的成果的均值",
    metricRcr: "平均 RCR",
    metricContextRcr: "1.0 = NIH 资助论文的平均水平；仅限生物医学（PMID）成果",
    metricContextHIndex: "非领域归一化；受职业年限与领域影响",
    metricContextI10: "被引 ≥10 次的成果数 — 非领域归一化；随职业年限增长",
    metricContextWorks: "已收录成果的原始数量 — 取决于数据库覆盖范围；不代表质量",
    metricContextCitations: "原始总数 — 非领域归一化（因领域与职业年限而异）",
    metricRcrCoverage: "基于 {n} 篇有 RCR 的成果的均值",
    metricSmallN: "样本较小——请谨慎解读",
    roleFirst: "第一作者",
    roleSecond: "第二作者",
    roleThird: "第三作者",
    roleMiddle: "第 k 作者",
    roleSecondLast: "倒数第二作者",
    roleLast: "末位作者",
    roleCorresponding: "通讯作者",
    madeWith: "制作工具：",
    liveVersionLabel: "在线版本",
    livingNote: "更新于 {date} · 在线简历，自动更新",
    rorRecordTitle: "ROR 机构记录",
    institutionSiteTitle: "机构网站",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "相对引用率（NIH iCite）——经领域标准化的被引率；1.0 = NIH 资助论文的平均水平。仅限生物医学文献。",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "领域加权引用影响力（OpenAlex）——相对于同领域、同类型、同年份文献的被引情况；1.0 = 平均水平。",
    indicatorClinicalCitations: "被 {n} 篇临床文献引用",
    indicatorClinicalCitationOne: "被 {n} 篇临床文献引用",
    indicatorClinicalCitationsLabel: "临床引用",
    indicatorClinicalCitationsTitle:
      "引用本文的临床文献（指南、临床试验）数量，来源 NIH iCite。仅限生物医学文献。",
    indicatorClinical: "临床文献",
    indicatorClinicalTitle: "NIH iCite 将本文归类为临床文献（指南或临床研究）。",
    provLedgerTitle: "来源核验表",
    provLedgerNote:
      "本文档的可核验程度——每一行统计所显示的条目，并各自注明分母。这不是对研究者的评价，也绝不是评分。",
    provLedgerIdentifier: "通过标识符匹配（ORCID / OpenAlex）",
    provLedgerClaimed: "通过 DOI 添加（本人声明）",
    provLedgerSelfEntered: "手动录入",
    provLedgerNameMatched: "仅通过姓名匹配",
    provLedgerOther: "其他归属方式",
    provLedgerVerified: "由可信机构认证的职位、教育经历与荣誉",
    provLedgerPid: "可通过持久标识符解析（DOI / PMID / arXiv / ORCID）",
    provLedgerReviewed: "本人已确认的来源归属论文",
    provLedgerRetracted: "显示的已撤稿作品",
    provLedgerOf: "{n} / {total}（{pct}）",
    collabLine: "合作者来自 {countries} 个国家/地区 · {pct} 的作品为国际合作",
    collabLineOne: "合作者来自 1 个国家/地区 · {pct} 的作品为国际合作",
    collabTop: "最常见：{list}",
    collabContext: "基于 OpenAlex 机构信息；n = {n}",
    creditRolesLabel: "贡献角色：",
    creditRolesSelfTitle: "本人声明",
    creditRolesCrossrefTitle: "来自出版商元数据（Crossref）",
    creditRoles: {
      conceptualization: "概念构思",
      "data-curation": "数据管理",
      "formal-analysis": "形式分析",
      "funding-acquisition": "资金获取",
      investigation: "调查研究",
      methodology: "方法设计",
      "project-administration": "项目管理",
      resources: "资源提供",
      software: "软件开发",
      supervision: "指导监督",
      validation: "结果验证",
      visualization: "可视化",
      "writing-original-draft": "撰写初稿",
      "writing-review-editing": "审阅与修订",
    },
    careerContextLabel: "职业背景（自述）",
    careerKindCareerBreak: "职业中断",
    careerKindPartTime: "兼职",
    careerKindClinicalDuties: "兼顾临床工作",
    careerKindCaring: "照护责任",
    careerKindMilitary: "服兵役",
    careerKindOther: "其他",
    careerFirstPublication: "首篇论文：{year}（从业 {n} 年）",
    degreeBachelor: "学士",
    degreeMaster: "硕士",
    degreePhd: "博士",
    degreePostdoc: "博士后",
    degreeClinicalFellow: "临床专科医师",
    degreeOther: "其他",
    superviseeBachelor: "本科生",
    superviseeMaster: "硕士生",
    superviseePhd: "博士生",
    superviseePostdoc: "博士后研究员",
    superviseeClinicalFellow: "临床专科医师",
    superviseeOther: "受指导者",
    supervisionRolePrimary: "主导师",
    supervisionRoleCo: "副导师",
    supervisionRoleCommittee: "答辩委员会成员",
    supervisionRoleMentor: "指导者",
    supervisionStatusOngoing: "进行中",
    supervisionStatusCompleted: "已完成",
    supervisionStatusDiscontinued: "已中止",
    supervisionNow: "现任：{position}",
    supervisionSummaryTotal: "共指导 {n} 人",
    supervisionSummaryCompleted: "{n} 人已完成",
    dataLinksLabel: "数据",
    codeLinksLabel: "代码",
    replicatedLabel: "已被复现：{n} 项研究",
    replicatedOfLabel: "复现自：",
    outcomeSuccess: "成功",
    outcomeFailure: "失败",
    outcomeMixed: "结果不一",
    outcomeInformativeFailure: "有信息价值的失败",
    softwareRepository: "源代码",
    softwareVersion: "版本 {version}",
    softwareLicense: "许可证：{license}",
    readerLinkLabel: "审阅视图",
    readerLinkTitle: "显示所有者数据中的来源、核验与背景信号",
    readerBannerText: "审阅视图：显示所有者数据中的来源、核验与背景信号。此处没有任何内容是评分。",
    readerBannerBack: "返回标准页面",
    provMatchOrcid: "通过 ORCID iD 与所有者匹配",
    provMatchOpenAlexId: "通过 OpenAlex 作者 ID 与所有者匹配",
    provMatchBoth: "通过 ORCID iD 和 OpenAlex 作者 ID 与所有者匹配",
    provMatchClaimed: "由所有者通过 DOI 添加——记录上没有标识符匹配",
    provSourceOf: "记录来自 {source}",
    provSourceManual: "由所有者手动录入",
    provEnriched: "元数据已由 Crossref 补全",
    provUnderReview: "已标记待所有者复核",
    provLastVerified: "最近核验于 {date}",
    provLabelClaimed: "自行认领",
    provLabelManual: "手动",
    selfAuthorTail: "含 {name}，共 {count} 位作者中的第 {position} 位",
  },
  "es-ES": {
    hankoCredit:
      "Nombres de sección pincelados trazo a trazo · orden de trazos {kanjivg} (CC BY-SA 3.0) · tipografía de pincel Yuji Boku (SIL OFL)",
    refManagerNote:
      "Guarda estas publicaciones en un gestor de referencias (Zotero, Mendeley…): el conector de tu navegador las detectará.",
    researchAreasLabel: "Áreas de investigación",
    citeLabel: "Citar",
    abstractLabel: "Resumen",
    fullTextLabel: "Texto completo",
    badgeFeatured: "Destacada",
    badgeFeaturedTitle: "Publicación destacada / seleccionada",
    subscribeLabel: "Suscribirse",
    subscribeHint: "Añade esta URL de feed a tu lector de RSS:",
    filterLabel: "Filtrar",
    filterAll: "Todas",
    filterSince: "Desde {year}",
    filterOpenAccess: "Acceso abierto",
    filterTypeArticle: "Artículos",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Revisiones",
    filterTypeConference: "Congresos",
    filterTypeBook: "Libros",
    filterTypeDataset: "Conjuntos de datos",
    badgeArchived: "Archivado",
    badgeArchivedTitle:
      "Archivado por Software Heritage: una instantánea permanente del código fuente",
    publicEvaluationsPrefix: "Evaluado públicamente:",
    coauthorsHeading: "Coautores en SigmaCV",
    datePresent: "presente",
    dateUntil: "hasta {year}",
    chartPublicationsPerYear: "Publicaciones / año",
    chartCitationsPerYear: "Citas / año",
    authorshipCaption: "Autoría (revisado por pares)",
    authorshipCorrespondingNote:
      "Los datos de autor de correspondencia (OpenAlex) suelen estar incompletos.",
    provClassificationNote: "La clasificación revisado por pares/preimpresión es heurística.",
    provGeneratedFrom: "Generado a partir de",
    provOn: "el",
    provRecords: "registros",
    provHidden: "ocultos",
    provCorrected: "corregidos",
    sourceManualEntries: "entradas manuales",
    sourceDerived: "derivado",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Acceso abierto ({status})",
    openAccessLabel: "Acceso abierto",
    researchSummaryHeading: "Resumen de investigación",
    whatsNewLabel: "Añadido recientemente",
    outputSummaryLabel: "Producción científica",
    badgeRetracted: "Retractado",
    badgeRetractedTitle: "Este trabajo ha sido retractado (según Crossref / Retraction Watch)",
    badgeCitations: "{n} citas",
    badgeCitationsTitle:
      "Recuento bruto de citas — sin normalización por campo (varía por campo y antigüedad)",
    verifiedByText: "verificado por {org}",
    verifiedGenericText: "verificado a través de ORCID",
    badgeVerified: "Verificado",
    badgeVerifiedTitle:
      "Confirmado por la institución mediante ORCID: registrado por una organización de confianza, no por la propia persona",
    badgeVerifiedByTitle:
      "Verificado por {org} mediante ORCID: registrado por la organización, no por la propia persona",
    metric2yr: "Citación media a 2 años",
    metricFwci: "FWCI medio por trabajo",
    metricHIndex: "índice h",
    metricI10: "índice i10",
    metricWorks: "Trabajos",
    metricCitations: "Citas",
    metricContextFwci: "1,0 = media mundial del campo y año",
    metricContext2yr: "tasa de citación a 2 años — no normalizada por campo (varía según el campo)",
    metricFwciCoverage: "media sobre {n} trabajos con FWCI",
    metricRcr: "RCR medio",
    metricContextRcr:
      "1,0 = media de artículos financiados por los NIH; solo trabajos biomédicos (PMID)",
    metricContextHIndex:
      "no normalizado por campo; sensible a la duración de la carrera y al campo",
    metricContextI10:
      "trabajos con ≥10 citas — no normalizado por campo; crece con la duración de la carrera",
    metricContextWorks:
      "recuento bruto de trabajos indexados — depende de la cobertura de la base de datos; no mide la calidad",
    metricContextCitations:
      "total bruto — no normalizado por campo (varía según el campo y la duración de la carrera)",
    metricRcrCoverage: "media sobre {n} trabajos con RCR",
    metricSmallN: "muestra pequeña: interprétalo con cautela",
    roleFirst: "Primer autor",
    roleSecond: "Segundo autor",
    roleThird: "Tercer autor",
    roleMiddle: "k-ésimo autor",
    roleSecondLast: "Penúltimo autor",
    roleLast: "Último autor",
    roleCorresponding: "Autor de correspondencia",
    madeWith: "Hecho con",
    liveVersionLabel: "Versión en línea",
    livingNote: "Actualizado el {date} · CV vivo, se actualiza solo",
    rorRecordTitle: "Ficha de la organización en ROR",
    institutionSiteTitle: "Sitio web de la institución",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite): tasa de citas normalizada por campo; 1,0 = el artículo medio financiado por los NIH. Solo trabajos biomédicos.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex): citas respecto a trabajos del mismo campo, tipo y año; 1,0 = la media.",
    indicatorClinicalCitations: "citado por {n} artículos clínicos",
    indicatorClinicalCitationOne: "citado por {n} artículo clínico",
    indicatorClinicalCitationsLabel: "Citas clínicas",
    indicatorClinicalCitationsTitle:
      "Número de artículos clínicos (guías, ensayos clínicos) que citan este trabajo, según NIH iCite. Solo trabajos biomédicos.",
    indicatorClinical: "Artículo clínico",
    indicatorClinicalTitle:
      "NIH iCite clasifica este trabajo como artículo clínico (guía o estudio clínico).",
    provLedgerTitle: "Registro de procedencia",
    provLedgerNote:
      "Hasta qué punto es verificable este documento: cada línea cuenta las entradas mostradas, con su propio denominador. No es una evaluación del investigador ni, en ningún caso, una puntuación.",
    provLedgerIdentifier: "Emparejadas por identificador (ORCID / OpenAlex)",
    provLedgerClaimed: "Añadidas por DOI (afirmadas por el titular)",
    provLedgerSelfEntered: "Introducidas a mano",
    provLedgerNameMatched: "Emparejadas solo por nombre",
    provLedgerOther: "Otra atribución",
    provLedgerVerified:
      "Puestos, formación y distinciones afirmados por una organización de confianza",
    provLedgerPid: "Resolubles mediante un identificador persistente (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Publicaciones atribuidas por fuentes y confirmadas por el titular",
    provLedgerRetracted: "Trabajos retractados mostrados",
    provLedgerOf: "{n} de {total} ({pct})",
    collabLine: "Coautores de {countries} países · {pct} de los trabajos son internacionales",
    collabLineOne: "Coautores de un país · {pct} de los trabajos son internacionales",
    collabTop: "con mayor frecuencia {list}",
    collabContext: "según los datos de afiliación de OpenAlex; n = {n}",
    creditRolesLabel: "Roles:",
    creditRolesSelfTitle: "Declarado por el autor",
    creditRolesCrossrefTitle: "Según los metadatos del editor (Crossref)",
    creditRoles: {
      conceptualization: "Conceptualización",
      "data-curation": "Curación de datos",
      "formal-analysis": "Análisis formal",
      "funding-acquisition": "Obtención de financiación",
      investigation: "Investigación",
      methodology: "Metodología",
      "project-administration": "Administración del proyecto",
      resources: "Recursos",
      software: "Software",
      supervision: "Supervisión",
      validation: "Validación",
      visualization: "Visualización",
      "writing-original-draft": "Redacción del borrador original",
      "writing-review-editing": "Revisión y edición",
    },
    careerContextLabel: "Contexto profesional (declarado por el autor)",
    careerKindCareerBreak: "Interrupción de carrera",
    careerKindPartTime: "Tiempo parcial",
    careerKindClinicalDuties: "Actividad clínica junto a la investigación",
    careerKindCaring: "Responsabilidades de cuidado",
    careerKindMilitary: "Servicio militar",
    careerKindOther: "Otro",
    careerFirstPublication: "Primera publicación: {year} ({n} años de actividad)",
    degreeBachelor: "Grado",
    degreeMaster: "Máster",
    degreePhd: "Doctorado",
    degreePostdoc: "Posdoctorado",
    degreeClinicalFellow: "Fellow clínico",
    degreeOther: "Otro",
    superviseeBachelor: "Estudiante de grado",
    superviseeMaster: "Estudiante de máster",
    superviseePhd: "Doctorando/a",
    superviseePostdoc: "Investigador/a posdoctoral",
    superviseeClinicalFellow: "Fellow clínico",
    superviseeOther: "Persona supervisada",
    supervisionRolePrimary: "director/a principal",
    supervisionRoleCo: "codirector/a",
    supervisionRoleCommittee: "miembro del tribunal",
    supervisionRoleMentor: "mentor/a",
    supervisionStatusOngoing: "en curso",
    supervisionStatusCompleted: "completada",
    supervisionStatusDiscontinued: "interrumpida",
    supervisionNow: "ahora: {position}",
    supervisionSummaryTotal: "{n} supervisiones",
    supervisionSummaryCompleted: "{n} completadas",
    dataLinksLabel: "Datos",
    codeLinksLabel: "Código",
    replicatedLabel: "Replicado: {n} estudios",
    replicatedOfLabel: "Replicación de:",
    outcomeSuccess: "exitosa",
    outcomeFailure: "fallida",
    outcomeMixed: "mixta",
    outcomeInformativeFailure: "fallo informativo",
    softwareRepository: "Código fuente",
    softwareVersion: "Versión {version}",
    softwareLicense: "Licencia: {license}",
    readerLinkLabel: "Vista para evaluadores",
    readerLinkTitle:
      "Mostrar las señales de procedencia, verificación y contexto de los datos del titular",
    readerBannerText:
      "Vista para evaluadores: muestra las señales de procedencia, verificación y contexto de los datos del titular. Nada de lo que aparece aquí es una puntuación.",
    readerBannerBack: "Volver a la página estándar",
    provMatchOrcid: "Vinculado al titular por su ORCID iD",
    provMatchOpenAlexId: "Vinculado al titular por su ID de autor de OpenAlex",
    provMatchBoth: "Vinculado al titular por su ORCID iD y su ID de autor de OpenAlex",
    provMatchClaimed:
      "Añadido por el titular mediante DOI: sin coincidencia de identificador en el registro",
    provSourceOf: "Registro procedente de {source}",
    provSourceManual: "Introducido por el titular",
    provEnriched: "metadatos completados desde Crossref",
    provUnderReview: "marcado para revisión del titular",
    provLastVerified: "última verificación: {date}",
    provLabelClaimed: "Reclamado",
    provLabelManual: "Manual",
    selfAuthorTail: "incl. {name}, autor {position} de {count}",
  },
  "fr-FR": {
    hankoCredit:
      "Noms de section tracés au pinceau, trait par trait · ordre des traits {kanjivg} (CC BY-SA 3.0) · police au pinceau Yuji Boku (SIL OFL)",
    refManagerNote:
      "Enregistrez ces publications dans un gestionnaire de références (Zotero, Mendeley…) — le connecteur de votre navigateur les détectera.",
    researchAreasLabel: "Domaines de recherche",
    citeLabel: "Citer",
    abstractLabel: "Résumé",
    fullTextLabel: "Texte intégral",
    badgeFeatured: "Sélection",
    badgeFeaturedTitle: "Publication sélectionnée / mise en avant",
    subscribeLabel: "S'abonner",
    subscribeHint: "Ajoutez cette URL de flux à votre lecteur RSS :",
    filterLabel: "Filtrer",
    filterAll: "Tout",
    filterSince: "Depuis {year}",
    filterOpenAccess: "Libre accès",
    filterTypeArticle: "Articles",
    filterTypePreprint: "Préprints",
    filterTypeReview: "Synthèses",
    filterTypeConference: "Conférences",
    filterTypeBook: "Livres",
    filterTypeDataset: "Jeux de données",
    badgeArchived: "Archivé",
    badgeArchivedTitle: "Archivé par Software Heritage — un instantané permanent du code source",
    publicEvaluationsPrefix: "Évalué publiquement :",
    coauthorsHeading: "Co-auteurs sur SigmaCV",
    datePresent: "présent",
    dateUntil: "jusqu’en {year}",
    chartPublicationsPerYear: "Publications / an",
    chartCitationsPerYear: "Citations / an",
    authorshipCaption: "Rôles d’auteur (évalués par les pairs)",
    authorshipCorrespondingNote:
      "Les données d’auteur correspondant (OpenAlex) sont souvent incomplètes.",
    provClassificationNote: "La distinction évalué par les pairs / prépublication est heuristique.",
    provGeneratedFrom: "Généré à partir de",
    provOn: "le",
    provRecords: "enregistrements",
    provHidden: "masqués",
    provCorrected: "corrigés",
    sourceManualEntries: "saisies manuelles",
    sourceDerived: "dérivé",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Accès libre ({status})",
    openAccessLabel: "Accès libre",
    researchSummaryHeading: "Synthèse de recherche",
    whatsNewLabel: "Ajouté récemment",
    outputSummaryLabel: "Production scientifique",
    badgeRetracted: "Rétracté",
    badgeRetractedTitle: "Ce travail a été rétracté (selon Crossref / Retraction Watch)",
    badgeCitations: "{n} citations",
    badgeCitationsTitle:
      "Nombre brut de citations — non normalisé par domaine (varie selon le domaine et l’ancienneté)",
    verifiedByText: "vérifié par {org}",
    verifiedGenericText: "vérifié via ORCID",
    badgeVerified: "Vérifié",
    badgeVerifiedTitle:
      "Confirmé par l’établissement via ORCID — saisi par un organisme de confiance, et non par la personne elle-même",
    badgeVerifiedByTitle:
      "Vérifié par {org} via ORCID — saisi par l’organisme, et non par la personne elle-même",
    metric2yr: "Citations moyennes sur 2 ans",
    metricFwci: "FWCI moyen des travaux",
    metricHIndex: "indice h",
    metricI10: "indice i10",
    metricWorks: "Travaux",
    metricCitations: "Citations",
    metricContextFwci: "1,0 = moyenne mondiale pour le domaine et l’année",
    metricContext2yr:
      "taux de citation sur 2 ans — non normalisé par domaine (varie selon le domaine)",
    metricFwciCoverage: "moyenne sur {n} travaux avec FWCI",
    metricRcr: "RCR moyen",
    metricContextRcr:
      "1,0 = moyenne des articles financés par les NIH ; uniquement les travaux biomédicaux (PMID)",
    metricContextHIndex:
      "non normalisé par domaine ; sensible à la durée de carrière et au domaine",
    metricContextI10:
      "travaux cités ≥10 fois — non normalisé par domaine ; croît avec la durée de carrière",
    metricContextWorks:
      "nombre brut de travaux indexés — dépend de la couverture de la base ; ne mesure pas la qualité",
    metricContextCitations:
      "total brut — non normalisé par domaine (varie selon le domaine et la durée de carrière)",
    metricRcrCoverage: "moyenne sur {n} travaux avec RCR",
    metricSmallN: "échantillon réduit — à interpréter avec prudence",
    roleFirst: "Premier auteur",
    roleSecond: "Deuxième auteur",
    roleThird: "Troisième auteur",
    roleMiddle: "k-ième auteur",
    roleSecondLast: "Avant-dernier auteur",
    roleLast: "Dernier auteur",
    roleCorresponding: "Auteur correspondant",
    madeWith: "Créé avec",
    liveVersionLabel: "Version en ligne",
    livingNote: "Mis à jour le {date} · CV vivant, mis à jour automatiquement",
    rorRecordTitle: "Fiche de l’organisation dans ROR",
    institutionSiteTitle: "Site web de l’établissement",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) : taux de citation normalisé par domaine ; 1,0 = l’article moyen financé par les NIH. Travaux biomédicaux uniquement.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) : citations rapportées aux travaux de même domaine, type et année ; 1,0 = la moyenne.",
    indicatorClinicalCitations: "cité par {n} articles cliniques",
    indicatorClinicalCitationOne: "cité par {n} article clinique",
    indicatorClinicalCitationsLabel: "Citations cliniques",
    indicatorClinicalCitationsTitle:
      "Nombre d’articles cliniques (recommandations, essais cliniques) citant ce travail, d’après NIH iCite. Travaux biomédicaux uniquement.",
    indicatorClinical: "Article clinique",
    indicatorClinicalTitle:
      "NIH iCite classe ce travail comme article clinique (recommandation ou étude clinique).",
    provLedgerTitle: "Registre de provenance",
    provLedgerNote:
      "Dans quelle mesure ce document est vérifiable : chaque ligne compte les entrées affichées, avec son propre dénominateur. Ce n'est ni une évaluation du chercheur ni, en aucun cas, un score.",
    provLedgerIdentifier: "Associées par identifiant (ORCID / OpenAlex)",
    provLedgerClaimed: "Ajoutées par DOI (déclarées par le titulaire)",
    provLedgerSelfEntered: "Saisies à la main",
    provLedgerNameMatched: "Associées par le nom seul",
    provLedgerOther: "Autre attribution",
    provLedgerVerified:
      "Postes, formations et distinctions attestés par une organisation de confiance",
    provLedgerPid: "Résolubles par un identifiant pérenne (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Publications attribuées par les sources et confirmées par le titulaire",
    provLedgerRetracted: "Travaux rétractés affichés",
    provLedgerOf: "{n} sur {total} ({pct})",
    collabLine: "Co-auteurs de {countries} pays · {pct} des travaux sont internationaux",
    collabLineOne: "Co-auteurs d'un seul pays · {pct} des travaux sont internationaux",
    collabTop: "le plus souvent {list}",
    collabContext: "d'après les affiliations OpenAlex ; n = {n}",
    creditRolesLabel: "Rôles :",
    creditRolesSelfTitle: "Déclaré par l’auteur",
    creditRolesCrossrefTitle: "D’après les métadonnées de l’éditeur (Crossref)",
    creditRoles: {
      conceptualization: "Conceptualisation",
      "data-curation": "Curation des données",
      "formal-analysis": "Analyse formelle",
      "funding-acquisition": "Obtention du financement",
      investigation: "Investigation",
      methodology: "Méthodologie",
      "project-administration": "Administration du projet",
      resources: "Ressources",
      software: "Logiciel",
      supervision: "Supervision",
      validation: "Validation",
      visualization: "Visualisation",
      "writing-original-draft": "Rédaction du premier jet",
      "writing-review-editing": "Relecture et révision",
    },
    careerContextLabel: "Contexte de carrière (déclaré par l'auteur)",
    careerKindCareerBreak: "Interruption de carrière",
    careerKindPartTime: "Temps partiel",
    careerKindClinicalDuties: "Activité clinique en parallèle de la recherche",
    careerKindCaring: "Responsabilités familiales",
    careerKindMilitary: "Service militaire",
    careerKindOther: "Autre",
    careerFirstPublication: "Première publication : {year} ({n} ans d'activité)",
    degreeBachelor: "Licence",
    degreeMaster: "Master",
    degreePhd: "Doctorat",
    degreePostdoc: "Post-doctorat",
    degreeClinicalFellow: "Fellow clinique",
    degreeOther: "Autre",
    superviseeBachelor: "Étudiant·e de licence",
    superviseeMaster: "Étudiant·e de master",
    superviseePhd: "Doctorant·e",
    superviseePostdoc: "Chercheur·euse post-doctoral·e",
    superviseeClinicalFellow: "Fellow clinique",
    superviseeOther: "Personne encadrée",
    supervisionRolePrimary: "directeur·rice principal·e",
    supervisionRoleCo: "co-encadrant·e",
    supervisionRoleCommittee: "membre du jury",
    supervisionRoleMentor: "mentor",
    supervisionStatusOngoing: "en cours",
    supervisionStatusCompleted: "terminée",
    supervisionStatusDiscontinued: "interrompue",
    supervisionNow: "aujourd’hui : {position}",
    supervisionSummaryTotal: "{n} personnes encadrées",
    supervisionSummaryCompleted: "{n} terminées",
    dataLinksLabel: "Données",
    codeLinksLabel: "Code",
    replicatedLabel: "Répliqué : {n} études",
    replicatedOfLabel: "Réplication de :",
    outcomeSuccess: "réussie",
    outcomeFailure: "échouée",
    outcomeMixed: "mitigée",
    outcomeInformativeFailure: "échec informatif",
    softwareRepository: "Code source",
    softwareVersion: "Version {version}",
    softwareLicense: "Licence : {license}",
    readerLinkLabel: "Vue évaluateur",
    readerLinkTitle:
      "Afficher les signaux de provenance, de vérification et de contexte présents dans les données du titulaire",
    readerBannerText:
      "Vue évaluateur : affiche les signaux de provenance, de vérification et de contexte issus des données du titulaire. Rien ici n'est un score.",
    readerBannerBack: "Revenir à la page standard",
    provMatchOrcid: "Rattaché au titulaire par son ORCID iD",
    provMatchOpenAlexId: "Rattaché au titulaire par son identifiant auteur OpenAlex",
    provMatchBoth: "Rattaché au titulaire par son ORCID iD et son identifiant auteur OpenAlex",
    provMatchClaimed:
      "Ajouté par le titulaire via le DOI — aucune correspondance d'identifiant sur la notice",
    provSourceOf: "Notice issue de {source}",
    provSourceManual: "Saisi par le titulaire",
    provEnriched: "métadonnées complétées depuis Crossref",
    provUnderReview: "signalé pour vérification par le titulaire",
    provLastVerified: "dernière vérification le {date}",
    provLabelClaimed: "Revendiqué",
    provLabelManual: "Manuel",
    selfAuthorTail: "dont {name}, auteur {position} sur {count}",
  },
  "de-DE": {
    hankoCredit:
      "Abschnittsnamen Strich für Strich mit dem Pinsel geschrieben · Strichreihenfolge {kanjivg} (CC BY-SA 3.0) · Pinselschrift Yuji Boku (SIL OFL)",
    refManagerNote:
      "Speichern Sie diese Publikationen in einem Literaturverwaltungsprogramm (Zotero, Mendeley…) — Ihr Browser-Connector erkennt sie automatisch.",
    researchAreasLabel: "Forschungsgebiete",
    citeLabel: "Zitieren",
    abstractLabel: "Zusammenfassung",
    fullTextLabel: "Volltext",
    badgeFeatured: "Ausgewählt",
    badgeFeaturedTitle: "Ausgewählte / hervorgehobene Publikation",
    subscribeLabel: "Abonnieren",
    subscribeHint: "Füge diese Feed-URL zu deinem RSS-Reader hinzu:",
    filterLabel: "Filtern",
    filterAll: "Alle",
    filterSince: "Seit {year}",
    filterOpenAccess: "Open Access",
    filterTypeArticle: "Artikel",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Übersichten",
    filterTypeConference: "Konferenz",
    filterTypeBook: "Bücher",
    filterTypeDataset: "Datensätze",
    badgeArchived: "Archiviert",
    badgeArchivedTitle:
      "Von Software Heritage archiviert — ein dauerhafter Schnappschuss des Quellcodes",
    publicEvaluationsPrefix: "Öffentlich begutachtet:",
    coauthorsHeading: "Mitautor:innen auf SigmaCV",
    datePresent: "heute",
    dateUntil: "bis {year}",
    chartPublicationsPerYear: "Publikationen / Jahr",
    chartCitationsPerYear: "Zitationen / Jahr",
    authorshipCaption: "Autorschaft (begutachtet)",
    authorshipCorrespondingNote:
      "Angaben zum korrespondierenden Autor (OpenAlex) sind oft unvollständig.",
    provClassificationNote: "Die Einstufung begutachtet/Preprint erfolgt heuristisch.",
    provGeneratedFrom: "Erstellt aus",
    provOn: "am",
    provRecords: "Einträge",
    provHidden: "ausgeblendet",
    provCorrected: "korrigiert",
    sourceManualEntries: "manuelle Einträge",
    sourceDerived: "abgeleitet",
    cvFallbackTitle: "Lebenslauf",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Open Access ({status})",
    openAccessLabel: "Open Access",
    researchSummaryHeading: "Forschungsüberblick",
    whatsNewLabel: "Kürzlich hinzugefügt",
    outputSummaryLabel: "Forschungsoutput",
    badgeRetracted: "Zurückgezogen",
    badgeRetractedTitle: "Diese Arbeit wurde zurückgezogen (laut Crossref / Retraction Watch)",
    badgeCitations: "{n} Zitationen",
    badgeCitationsTitle:
      "Reine Zitationszahl — nicht feldnormiert (variiert je nach Fach und Alter)",
    verifiedByText: "verifiziert durch {org}",
    verifiedGenericText: "verifiziert über ORCID",
    badgeVerified: "Verifiziert",
    badgeVerifiedTitle:
      "Von der Institution über ORCID bestätigt – von einer vertrauenswürdigen Organisation eingetragen, nicht selbst erfasst",
    badgeVerifiedByTitle:
      "Verifiziert durch {org} über ORCID – von der Organisation eingetragen, nicht selbst erfasst",
    metric2yr: "Mittlere Zitationsrate (2 Jahre)",
    metricFwci: "Mittlerer FWCI",
    metricHIndex: "h-Index",
    metricI10: "i10-Index",
    metricWorks: "Werke",
    metricCitations: "Zitationen",
    metricContextFwci: "1,0 = Weltdurchschnitt für Fachgebiet & Jahr",
    metricContext2yr: "2-Jahres-Zitationsrate — nicht fachnormiert (variiert je nach Fach)",
    metricFwciCoverage: "Mittel über {n} Werke mit FWCI",
    metricRcr: "Mittlerer RCR",
    metricContextRcr:
      "1,0 = Durchschnitt NIH-geförderter Arbeiten; nur biomedizinische (PMID) Arbeiten",
    metricContextHIndex: "nicht fachnormiert; abhängig von Karrieredauer und Fach",
    metricContextI10: "Werke mit ≥10 Zitationen — nicht fachnormiert; wächst mit der Karrieredauer",
    metricContextWorks:
      "Rohzahl indexierter Werke — abhängig von der Datenbankabdeckung; kein Qualitätsmaß",
    metricContextCitations:
      "Rohsumme — nicht fachnormiert (variiert je nach Fach und Karrieredauer)",
    metricRcrCoverage: "Mittel über {n} Werke mit RCR",
    metricSmallN: "kleine Stichprobe – mit Vorsicht interpretieren",
    roleFirst: "Erstautor",
    roleSecond: "Zweitautor",
    roleThird: "Drittautor",
    roleMiddle: "k-ter Autor",
    roleSecondLast: "Vorletzter Autor",
    roleLast: "Letztautor",
    roleCorresponding: "Korrespondierender Autor",
    madeWith: "Erstellt mit",
    liveVersionLabel: "Live-Version",
    livingNote: "Aktualisiert am {date} · lebender Lebenslauf, automatisch aktualisiert",
    rorRecordTitle: "ROR-Organisationseintrag",
    institutionSiteTitle: "Website der Einrichtung",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) – fachnormierte Zitationsrate; 1,0 = der durchschnittliche NIH-geförderte Artikel. Nur biomedizinische Arbeiten.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) – Zitationen im Verhältnis zu Arbeiten desselben Fachs, Typs und Jahres; 1,0 = Durchschnitt.",
    indicatorClinicalCitations: "zitiert von {n} klinischen Artikeln",
    indicatorClinicalCitationOne: "zitiert von {n} klinischen Artikel",
    indicatorClinicalCitationsLabel: "Klinische Zitationen",
    indicatorClinicalCitationsTitle:
      "Anzahl klinischer Artikel (Leitlinien, klinische Studien), die diese Arbeit zitieren, laut NIH iCite. Nur biomedizinische Arbeiten.",
    indicatorClinical: "Klinischer Artikel",
    indicatorClinicalTitle:
      "NIH iCite stuft diese Arbeit als klinischen Artikel ein (Leitlinie oder klinische Studie).",
    provLedgerTitle: "Herkunftsregister",
    provLedgerNote:
      "Wie überprüfbar dieses Dokument ist – jede Zeile zählt die angezeigten Einträge mit eigenem Nenner. Keine Bewertung der forschenden Person und niemals ein Score.",
    provLedgerIdentifier: "Über Identifikator zugeordnet (ORCID / OpenAlex)",
    provLedgerClaimed: "Per DOI hinzugefügt (von der Inhaberin/dem Inhaber beansprucht)",
    provLedgerSelfEntered: "Von Hand eingetragen",
    provLedgerNameMatched: "Nur über den Namen zugeordnet",
    provLedgerOther: "Sonstige Zuordnung",
    provLedgerVerified:
      "Von einer vertrauenswürdigen Organisation bestätigte Positionen, Ausbildung und Auszeichnungen",
    provLedgerPid: "Über einen persistenten Identifikator auflösbar (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Quellenzugeordnete Publikationen, von der Inhaberin/dem Inhaber bestätigt",
    provLedgerRetracted: "Angezeigte zurückgezogene Arbeiten",
    provLedgerOf: "{n} von {total} ({pct})",
    collabLine:
      "Koautorinnen und Koautoren aus {countries} Ländern · {pct} der Arbeiten international",
    collabLineOne: "Koautorinnen und Koautoren aus einem Land · {pct} der Arbeiten international",
    collabTop: "am häufigsten {list}",
    collabContext: "nach OpenAlex-Affiliationsdaten; n = {n}",
    creditRolesLabel: "Rollen:",
    creditRolesSelfTitle: "Selbst angegeben",
    creditRolesCrossrefTitle: "Aus den Verlagsmetadaten (Crossref)",
    creditRoles: {
      conceptualization: "Konzeption",
      "data-curation": "Datenkuratierung",
      "formal-analysis": "Formale Analyse",
      "funding-acquisition": "Mitteleinwerbung",
      investigation: "Untersuchung",
      methodology: "Methodik",
      "project-administration": "Projektadministration",
      resources: "Ressourcen",
      software: "Software",
      supervision: "Betreuung",
      validation: "Validierung",
      visualization: "Visualisierung",
      "writing-original-draft": "Schreiben – Erstentwurf",
      "writing-review-editing": "Schreiben – Überarbeitung und Lektorat",
    },
    careerContextLabel: "Karrierekontext (Selbstangabe)",
    careerKindCareerBreak: "Karriereunterbrechung",
    careerKindPartTime: "Teilzeit",
    careerKindClinicalDuties: "Klinische Tätigkeit neben der Forschung",
    careerKindCaring: "Betreuungspflichten",
    careerKindMilitary: "Wehrdienst",
    careerKindOther: "Sonstiges",
    careerFirstPublication: "Erste Publikation: {year} ({n} Jahre aktiv)",
    degreeBachelor: "Bachelor",
    degreeMaster: "Master",
    degreePhd: "Promotion",
    degreePostdoc: "Postdoc",
    degreeClinicalFellow: "Clinical Fellow",
    degreeOther: "Sonstiges",
    superviseeBachelor: "Bachelorstudent·in",
    superviseeMaster: "Masterstudent·in",
    superviseePhd: "Doktorand·in",
    superviseePostdoc: "Postdoktorand·in",
    superviseeClinicalFellow: "Clinical Fellow",
    superviseeOther: "Betreute Person",
    supervisionRolePrimary: "Erstbetreuung",
    supervisionRoleCo: "Zweitbetreuung",
    supervisionRoleCommittee: "Prüfungsausschuss",
    supervisionRoleMentor: "Mentor·in",
    supervisionStatusOngoing: "laufend",
    supervisionStatusCompleted: "abgeschlossen",
    supervisionStatusDiscontinued: "abgebrochen",
    supervisionNow: "heute: {position}",
    supervisionSummaryTotal: "{n} betreut",
    supervisionSummaryCompleted: "{n} abgeschlossen",
    dataLinksLabel: "Daten",
    codeLinksLabel: "Code",
    replicatedLabel: "Repliziert: {n} Studien",
    replicatedOfLabel: "Replikation von:",
    outcomeSuccess: "erfolgreich",
    outcomeFailure: "gescheitert",
    outcomeMixed: "gemischt",
    outcomeInformativeFailure: "informativer Misserfolg",
    softwareRepository: "Quellcode",
    softwareVersion: "Version {version}",
    softwareLicense: "Lizenz: {license}",
    readerLinkLabel: "Gutachteransicht",
    readerLinkTitle:
      "Herkunfts-, Verifizierungs- und Kontextsignale aus den Daten der Inhaberin bzw. des Inhabers anzeigen",
    readerBannerText:
      "Gutachteransicht: zeigt Herkunfts-, Verifizierungs- und Kontextsignale aus den Daten der Inhaberin bzw. des Inhabers. Nichts hiervon ist eine Bewertung.",
    readerBannerBack: "Zurück zur Standardseite",
    provMatchOrcid: "Über die ORCID iD zugeordnet",
    provMatchOpenAlexId: "Über die OpenAlex-Autoren-ID zugeordnet",
    provMatchBoth: "Über die ORCID iD und die OpenAlex-Autoren-ID zugeordnet",
    provMatchClaimed:
      "Per DOI selbst hinzugefügt – keine Identifikator-Übereinstimmung im Datensatz",
    provSourceOf: "Datensatz aus {source}",
    provSourceManual: "Manuell eingetragen",
    provEnriched: "Metadaten aus Crossref ergänzt",
    provUnderReview: "zur Prüfung durch die Inhaberin bzw. den Inhaber markiert",
    provLastVerified: "zuletzt geprüft am {date}",
    provLabelClaimed: "Beansprucht",
    provLabelManual: "Manuell",
    selfAuthorTail: "inkl. {name}, Autor {position} von {count}",
  },
  "ja-JP": {
    hankoCredit:
      "節の名称を一画ずつ筆で運筆 · 筆順 {kanjivg}（CC BY-SA 3.0）· 毛筆書体 Yuji Boku（SIL OFL）",
    refManagerNote:
      "これらの論文は文献管理ツール（Zotero、Mendeley など）に保存できます——ブラウザのコネクタが自動的に検出します。",
    researchAreasLabel: "研究分野",
    citeLabel: "引用",
    abstractLabel: "要旨",
    fullTextLabel: "全文",
    badgeFeatured: "選定",
    badgeFeaturedTitle: "選定／注目の論文",
    subscribeLabel: "購読",
    subscribeHint: "このフィードのURLをRSSリーダーに追加してください：",
    filterLabel: "絞り込み",
    filterAll: "すべて",
    filterSince: "{year}年以降",
    filterOpenAccess: "オープンアクセス",
    filterTypeArticle: "論文",
    filterTypePreprint: "プレプリント",
    filterTypeReview: "総説",
    filterTypeConference: "会議",
    filterTypeBook: "書籍",
    filterTypeDataset: "データセット",
    badgeArchived: "アーカイブ済み",
    badgeArchivedTitle:
      "Software Heritage によりアーカイブ済み — ソースコードの永続的なスナップショット",
    publicEvaluationsPrefix: "公開レビュー：",
    coauthorsHeading: "SigmaCV を使う共著者",
    datePresent: "現在",
    dateUntil: "{year} まで",
    chartPublicationsPerYear: "年別論文数",
    chartCitationsPerYear: "年別被引用数",
    authorshipCaption: "著者貢献（査読付き）",
    authorshipCorrespondingNote: "責任著者のデータ（OpenAlex）は不完全な場合が多くあります。",
    provClassificationNote: "査読付き／プレプリントの分類は推定によるものです。",
    provGeneratedFrom: "生成元",
    provOn: "日付",
    provRecords: "件",
    provHidden: "非表示",
    provCorrected: "修正済み",
    sourceManualEntries: "手動入力",
    sourceDerived: "推定",
    cvFallbackTitle: "履歴書",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "オープンアクセス（{status}）",
    openAccessLabel: "オープンアクセス",
    researchSummaryHeading: "研究サマリー",
    whatsNewLabel: "最近の追加",
    outputSummaryLabel: "研究成果",
    badgeRetracted: "撤回済み",
    badgeRetractedTitle: "この成果は撤回されています（Crossref／Retraction Watch による）",
    badgeCitations: "被引用 {n}",
    badgeCitationsTitle: "被引用数の生の値 — 分野正規化なし（分野・年代で変動）",
    verifiedByText: "{org} による認証済み",
    verifiedGenericText: "ORCID 経由で認証済み",
    badgeVerified: "認証済み",
    badgeVerifiedTitle:
      "所属機関が ORCID を通じて確認 — 信頼された機関が登録した情報で、本人による入力ではありません",
    badgeVerifiedByTitle:
      "{org} が ORCID を通じて認証 — 当該機関が登録した情報で、本人による入力ではありません",
    metric2yr: "2年間平均被引用度",
    metricFwci: "平均FWCI",
    metricHIndex: "h指数",
    metricI10: "i10指数",
    metricWorks: "業績数",
    metricCitations: "被引用数",
    metricContextFwci: "1.0 = 分野・年の世界平均",
    metricContext2yr: "2年間の被引用率 — 分野正規化なし（分野により大きく異なる）",
    metricFwciCoverage: "FWCIのある{n}件の業績による平均",
    metricRcr: "平均 RCR",
    metricContextRcr: "1.0 = NIH 助成論文の平均；生物医学（PMID）業績のみ",
    metricContextHIndex: "分野正規化なし；キャリア年数と分野の影響を受ける",
    metricContextI10: "被引用10回以上の業績数 — 分野正規化なし；キャリア年数とともに増加",
    metricContextWorks:
      "索引付けされた業績の生の件数 — データベースの収録範囲に依存；質の指標ではない",
    metricContextCitations: "生の合計値 — 分野正規化なし（分野・キャリア年数で変動）",
    metricRcrCoverage: "RCRのある{n}件の業績による平均",
    metricSmallN: "少数サンプル — 解釈には注意",
    roleFirst: "筆頭著者",
    roleSecond: "第二著者",
    roleThird: "第三著者",
    roleMiddle: "k 番目の著者",
    roleSecondLast: "最後から2番目の著者",
    roleLast: "最終著者",
    roleCorresponding: "責任著者",
    madeWith: "作成ツール：",
    liveVersionLabel: "オンライン版",
    livingNote: "{date} 更新 · 自動更新されるライブ CV",
    rorRecordTitle: "ROR 機関レコード",
    institutionSiteTitle: "機関ウェブサイト",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "相対被引用率（NIH iCite）— 分野で正規化した被引用率。1.0 = NIH 助成論文の平均。生物医学分野の論文のみ。",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "分野加重被引用インパクト（OpenAlex）— 同分野・同種別・同年の論文に対する被引用の比。1.0 = 平均。",
    indicatorClinicalCitations: "臨床文献 {n} 件に引用",
    indicatorClinicalCitationOne: "臨床文献 {n} 件に引用",
    indicatorClinicalCitationsLabel: "臨床引用",
    indicatorClinicalCitationsTitle:
      "この論文を引用する臨床文献（ガイドライン、臨床試験）の数（NIH iCite による）。生物医学分野の論文のみ。",
    indicatorClinical: "臨床文献",
    indicatorClinicalTitle:
      "NIH iCite はこの論文を臨床文献（ガイドラインまたは臨床研究）に分類しています。",
    provLedgerTitle: "出典検証表",
    provLedgerNote:
      "この文書がどの程度検証可能かを示します。各行は表示されている項目を、それぞれの分母とともに数えたものです。研究者の評価ではなく、決してスコアではありません。",
    provLedgerIdentifier: "識別子で照合（ORCID / OpenAlex）",
    provLedgerClaimed: "DOI で追加（本人申告）",
    provLedgerSelfEntered: "手入力",
    provLedgerNameMatched: "氏名のみで照合",
    provLedgerOther: "その他の帰属",
    provLedgerVerified: "信頼できる機関が証明した職歴・学歴・受賞",
    provLedgerPid: "永続識別子で解決可能（DOI / PMID / arXiv / ORCID）",
    provLedgerReviewed: "出典に基づく論文のうち本人が確認したもの",
    provLedgerRetracted: "表示中の撤回済み論文",
    provLedgerOf: "{total} 件中 {n} 件（{pct}）",
    collabLine: "共著者は {countries} か国 · 国際共著は全体の {pct}",
    collabLineOne: "共著者は 1 か国 · 国際共著は全体の {pct}",
    collabTop: "最も多いのは {list}",
    collabContext: "OpenAlex の所属データに基づく；n = {n}",
    creditRolesLabel: "役割：",
    creditRolesSelfTitle: "本人申告",
    creditRolesCrossrefTitle: "出版社のメタデータ（Crossref）より",
    creditRoles: {
      conceptualization: "概念化",
      "data-curation": "データキュレーション",
      "formal-analysis": "形式的分析",
      "funding-acquisition": "資金獲得",
      investigation: "調査",
      methodology: "方法論",
      "project-administration": "プロジェクト管理",
      resources: "リソース提供",
      software: "ソフトウェア",
      supervision: "監督・指導",
      validation: "検証",
      visualization: "可視化",
      "writing-original-draft": "執筆（原案）",
      "writing-review-editing": "執筆（査読・編集）",
    },
    careerContextLabel: "キャリアの背景（自己申告）",
    careerKindCareerBreak: "キャリア中断",
    careerKindPartTime: "パートタイム",
    careerKindClinicalDuties: "研究と並行した臨床業務",
    careerKindCaring: "育児・介護",
    careerKindMilitary: "兵役",
    careerKindOther: "その他",
    careerFirstPublication: "初出版：{year}年（活動歴 {n} 年）",
    degreeBachelor: "学士",
    degreeMaster: "修士",
    degreePhd: "博士",
    degreePostdoc: "ポスドク",
    degreeClinicalFellow: "臨床フェロー",
    degreeOther: "その他",
    superviseeBachelor: "学部生",
    superviseeMaster: "修士課程学生",
    superviseePhd: "博士課程学生",
    superviseePostdoc: "博士研究員",
    superviseeClinicalFellow: "臨床フェロー",
    superviseeOther: "指導学生",
    supervisionRolePrimary: "主指導教員",
    supervisionRoleCo: "副指導教員",
    supervisionRoleCommittee: "審査委員",
    supervisionRoleMentor: "メンター",
    supervisionStatusOngoing: "指導中",
    supervisionStatusCompleted: "修了",
    supervisionStatusDiscontinued: "中断",
    supervisionNow: "現職：{position}",
    supervisionSummaryTotal: "指導 {n} 名",
    supervisionSummaryCompleted: "うち修了 {n} 名",
    dataLinksLabel: "データ",
    codeLinksLabel: "コード",
    replicatedLabel: "追試あり：{n} 件",
    replicatedOfLabel: "追試元：",
    outcomeSuccess: "成功",
    outcomeFailure: "失敗",
    outcomeMixed: "結果混在",
    outcomeInformativeFailure: "有意義な失敗",
    softwareRepository: "ソースコード",
    softwareVersion: "バージョン {version}",
    softwareLicense: "ライセンス：{license}",
    readerLinkLabel: "審査者ビュー",
    readerLinkTitle: "所有者のデータに含まれる出典・検証・文脈の情報を表示します",
    readerBannerText:
      "審査者ビュー：所有者のデータに含まれる出典・検証・文脈の情報を表示しています。ここにあるものはいずれもスコアではありません。",
    readerBannerBack: "通常のページに戻る",
    provMatchOrcid: "ORCID iD により所有者と照合",
    provMatchOpenAlexId: "OpenAlex 著者 ID により所有者と照合",
    provMatchBoth: "ORCID iD と OpenAlex 著者 ID により所有者と照合",
    provMatchClaimed: "所有者が DOI で追加 — レコード上に識別子の一致なし",
    provSourceOf: "{source} のレコード",
    provSourceManual: "所有者が手入力",
    provEnriched: "メタデータを Crossref から補完",
    provUnderReview: "所有者の確認待ちとしてフラグ付き",
    provLastVerified: "最終確認 {date}",
    provLabelClaimed: "本人申告",
    provLabelManual: "手入力",
    selfAuthorTail: "{name} を含む（著者 {count} 名中 {position} 番目）",
  },
  "pt-BR": {
    hankoCredit:
      "Nomes das seções pincelados traço a traço · ordem dos traços {kanjivg} (CC BY-SA 3.0) · fonte de pincel Yuji Boku (SIL OFL)",
    refManagerNote:
      "Salve estas publicações em um gerenciador de referências (Zotero, Mendeley…) — o conector do seu navegador as detectará.",
    researchAreasLabel: "Áreas de pesquisa",
    citeLabel: "Citar",
    abstractLabel: "Resumo",
    fullTextLabel: "Texto completo",
    badgeFeatured: "Destaque",
    badgeFeaturedTitle: "Publicação em destaque / selecionada",
    subscribeLabel: "Assinar",
    subscribeHint: "Adicione esta URL de feed ao seu leitor de RSS:",
    filterLabel: "Filtrar",
    filterAll: "Todas",
    filterSince: "Desde {year}",
    filterOpenAccess: "Acesso aberto",
    filterTypeArticle: "Artigos",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Revisões",
    filterTypeConference: "Congressos",
    filterTypeBook: "Livros",
    filterTypeDataset: "Conjuntos de dados",
    badgeArchived: "Arquivado",
    badgeArchivedTitle:
      "Arquivado pelo Software Heritage — um instantâneo permanente do código-fonte",
    publicEvaluationsPrefix: "Avaliado publicamente:",
    coauthorsHeading: "Coautores no SigmaCV",
    datePresent: "presente",
    dateUntil: "até {year}",
    chartPublicationsPerYear: "Publicações / ano",
    chartCitationsPerYear: "Citações / ano",
    authorshipCaption: "Autoria (revisado por pares)",
    authorshipCorrespondingNote:
      "Os dados de autor correspondente (OpenAlex) costumam estar incompletos.",
    provClassificationNote: "A classificação revisado por pares/preprint é heurística.",
    provGeneratedFrom: "Gerado a partir de",
    provOn: "em",
    provRecords: "registros",
    provHidden: "ocultos",
    provCorrected: "corrigidos",
    sourceManualEntries: "entradas manuais",
    sourceDerived: "derivado",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Acesso aberto ({status})",
    openAccessLabel: "Acesso aberto",
    researchSummaryHeading: "Resumo da pesquisa",
    whatsNewLabel: "Adicionado recentemente",
    outputSummaryLabel: "Produção científica",
    badgeRetracted: "Retratado",
    badgeRetractedTitle: "Este trabalho foi retratado (segundo o Crossref / Retraction Watch)",
    badgeCitations: "{n} citações",
    badgeCitationsTitle:
      "Contagem bruta de citações — não normalizada por área (varia por área e idade)",
    verifiedByText: "verificado por {org}",
    verifiedGenericText: "verificado via ORCID",
    badgeVerified: "Verificado",
    badgeVerifiedTitle:
      "Confirmado pela instituição via ORCID — registrado por uma organização confiável, não pela própria pessoa",
    badgeVerifiedByTitle:
      "Verificado por {org} via ORCID — registrado pela organização, não pela própria pessoa",
    metric2yr: "Citação média em 2 anos",
    metricFwci: "FWCI médio dos trabalhos",
    metricHIndex: "índice h",
    metricI10: "índice i10",
    metricWorks: "Trabalhos",
    metricCitations: "Citações",
    metricContextFwci: "1,0 = média mundial para a área e o ano",
    metricContext2yr:
      "taxa de citação em 2 anos — não normalizada por área (varia conforme a área)",
    metricFwciCoverage: "média sobre {n} trabalhos com FWCI",
    metricRcr: "RCR médio",
    metricContextRcr:
      "1,0 = média de artigos financiados pelo NIH; apenas trabalhos biomédicos (PMID)",
    metricContextHIndex: "não normalizado por área; sensível ao tempo de carreira e à área",
    metricContextI10:
      "trabalhos com ≥10 citações — não normalizado por área; cresce com o tempo de carreira",
    metricContextWorks:
      "contagem bruta de trabalhos indexados — depende da cobertura da base; não mede qualidade",
    metricContextCitations:
      "total bruto — não normalizado por área (varia conforme a área e o tempo de carreira)",
    metricRcrCoverage: "média sobre {n} trabalhos com RCR",
    metricSmallN: "amostra pequena — interprete com cautela",
    roleFirst: "Primeiro autor",
    roleSecond: "Segundo autor",
    roleThird: "Terceiro autor",
    roleMiddle: "k-ésimo autor",
    roleSecondLast: "Penúltimo autor",
    roleLast: "Último autor",
    roleCorresponding: "Autor correspondente",
    madeWith: "Feito com",
    liveVersionLabel: "Versão online",
    livingNote: "Atualizado em {date} · currículo vivo, atualizado automaticamente",
    rorRecordTitle: "Registro da organização no ROR",
    institutionSiteTitle: "Site da instituição",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite): taxa de citação normalizada por área; 1,0 = o artigo médio financiado pelos NIH. Apenas trabalhos biomédicos.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex): citações em relação a trabalhos da mesma área, tipo e ano; 1,0 = a média.",
    indicatorClinicalCitations: "citado por {n} artigos clínicos",
    indicatorClinicalCitationOne: "citado por {n} artigo clínico",
    indicatorClinicalCitationsLabel: "Citações clínicas",
    indicatorClinicalCitationsTitle:
      "Número de artigos clínicos (diretrizes, ensaios clínicos) que citam este trabalho, segundo o NIH iCite. Apenas trabalhos biomédicos.",
    indicatorClinical: "Artigo clínico",
    indicatorClinicalTitle:
      "O NIH iCite classifica este trabalho como artigo clínico (diretriz ou estudo clínico).",
    provLedgerTitle: "Registro de proveniência",
    provLedgerNote:
      "Quão verificável é este documento: cada linha conta as entradas exibidas, com seu próprio denominador. Não é uma avaliação do pesquisador e nunca uma pontuação.",
    provLedgerIdentifier: "Correspondidas por identificador (ORCID / OpenAlex)",
    provLedgerClaimed: "Adicionadas por DOI (declaradas pelo titular)",
    provLedgerSelfEntered: "Inseridas manualmente",
    provLedgerNameMatched: "Correspondidas apenas pelo nome",
    provLedgerOther: "Outra atribuição",
    provLedgerVerified: "Cargos, formação e distinções atestados por uma organização confiável",
    provLedgerPid: "Resolvíveis por um identificador persistente (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Publicações atribuídas por fontes e confirmadas pelo titular",
    provLedgerRetracted: "Trabalhos retratados exibidos",
    provLedgerOf: "{n} de {total} ({pct})",
    collabLine: "Coautores de {countries} países · {pct} dos trabalhos são internacionais",
    collabLineOne: "Coautores de um país · {pct} dos trabalhos são internacionais",
    collabTop: "com mais frequência {list}",
    collabContext: "com base nos dados de afiliação do OpenAlex; n = {n}",
    creditRolesLabel: "Papéis:",
    creditRolesSelfTitle: "Declarado pelo autor",
    creditRolesCrossrefTitle: "Conforme os metadados da editora (Crossref)",
    creditRoles: {
      conceptualization: "Conceituação",
      "data-curation": "Curadoria de dados",
      "formal-analysis": "Análise formal",
      "funding-acquisition": "Obtenção de financiamento",
      investigation: "Investigação",
      methodology: "Metodologia",
      "project-administration": "Administração do projeto",
      resources: "Recursos",
      software: "Software",
      supervision: "Supervisão",
      validation: "Validação",
      visualization: "Visualização",
      "writing-original-draft": "Escrita – rascunho original",
      "writing-review-editing": "Escrita – revisão e edição",
    },
    careerContextLabel: "Contexto de carreira (autodeclarado)",
    careerKindCareerBreak: "Interrupção de carreira",
    careerKindPartTime: "Tempo parcial",
    careerKindClinicalDuties: "Atividade clínica paralela à pesquisa",
    careerKindCaring: "Responsabilidades de cuidado",
    careerKindMilitary: "Serviço militar",
    careerKindOther: "Outro",
    careerFirstPublication: "Primeira publicação: {year} ({n} anos de atividade)",
    degreeBachelor: "Graduação",
    degreeMaster: "Mestrado",
    degreePhd: "Doutorado",
    degreePostdoc: "Pós-doutorado",
    degreeClinicalFellow: "Fellow clínico",
    degreeOther: "Outro",
    superviseeBachelor: "Estudante de graduação",
    superviseeMaster: "Mestrando(a)",
    superviseePhd: "Doutorando(a)",
    superviseePostdoc: "Pesquisador(a) de pós-doutorado",
    superviseeClinicalFellow: "Fellow clínico",
    superviseeOther: "Orientando(a)",
    supervisionRolePrimary: "orientador(a) principal",
    supervisionRoleCo: "coorientador(a)",
    supervisionRoleCommittee: "membro da banca",
    supervisionRoleMentor: "mentor(a)",
    supervisionStatusOngoing: "em andamento",
    supervisionStatusCompleted: "concluída",
    supervisionStatusDiscontinued: "interrompida",
    supervisionNow: "atualmente: {position}",
    supervisionSummaryTotal: "{n} orientações",
    supervisionSummaryCompleted: "{n} concluídas",
    dataLinksLabel: "Dados",
    codeLinksLabel: "Código",
    replicatedLabel: "Replicado: {n} estudos",
    replicatedOfLabel: "Replicação de:",
    outcomeSuccess: "bem-sucedida",
    outcomeFailure: "malsucedida",
    outcomeMixed: "mista",
    outcomeInformativeFailure: "fracasso informativo",
    softwareRepository: "Código-fonte",
    softwareVersion: "Versão {version}",
    softwareLicense: "Licença: {license}",
    readerLinkLabel: "Visão para avaliadores",
    readerLinkTitle:
      "Mostrar os sinais de procedência, verificação e contexto presentes nos dados do titular",
    readerBannerText:
      "Visão para avaliadores: mostra os sinais de procedência, verificação e contexto dos dados do titular. Nada aqui é uma pontuação.",
    readerBannerBack: "Voltar à página padrão",
    provMatchOrcid: "Vinculado ao titular pelo ORCID iD",
    provMatchOpenAlexId: "Vinculado ao titular pelo ID de autor do OpenAlex",
    provMatchBoth: "Vinculado ao titular pelo ORCID iD e pelo ID de autor do OpenAlex",
    provMatchClaimed:
      "Adicionado pelo titular por DOI — sem correspondência de identificador no registro",
    provSourceOf: "Registro proveniente de {source}",
    provSourceManual: "Inserido pelo titular",
    provEnriched: "metadados complementados a partir do Crossref",
    provUnderReview: "sinalizado para revisão do titular",
    provLastVerified: "última verificação em {date}",
    provLabelClaimed: "Reivindicado",
    provLabelManual: "Manual",
    selfAuthorTail: "incl. {name}, autor {position} de {count}",
  },
  "it-IT": {
    hankoCredit:
      "Nomi delle sezioni tracciati a pennello, tratto per tratto · ordine dei tratti {kanjivg} (CC BY-SA 3.0) · carattere a pennello Yuji Boku (SIL OFL)",
    refManagerNote:
      "Salva queste pubblicazioni in un gestore di riferimenti (Zotero, Mendeley…): il connettore del browser le rileverà.",
    researchAreasLabel: "Aree di ricerca",
    citeLabel: "Cita",
    abstractLabel: "Abstract",
    fullTextLabel: "Testo completo",
    badgeFeatured: "In evidenza",
    badgeFeaturedTitle: "Pubblicazione selezionata / in evidenza",
    subscribeLabel: "Iscriviti",
    subscribeHint: "Aggiungi questo URL del feed al tuo lettore RSS:",
    filterLabel: "Filtra",
    filterAll: "Tutte",
    filterSince: "Dal {year}",
    filterOpenAccess: "Accesso aperto",
    filterTypeArticle: "Articoli",
    filterTypePreprint: "Preprint",
    filterTypeReview: "Rassegne",
    filterTypeConference: "Conferenze",
    filterTypeBook: "Libri",
    filterTypeDataset: "Dataset",
    badgeArchived: "Archiviato",
    badgeArchivedTitle:
      "Archiviato da Software Heritage — un'istantanea permanente del codice sorgente",
    publicEvaluationsPrefix: "Valutato pubblicamente:",
    coauthorsHeading: "Coautori su SigmaCV",
    datePresent: "presente",
    dateUntil: "fino al {year}",
    chartPublicationsPerYear: "Pubblicazioni / anno",
    chartCitationsPerYear: "Citazioni / anno",
    authorshipCaption: "Paternità (sottoposto a revisione paritaria)",
    authorshipCorrespondingNote:
      "I dati sull’autore corrispondente (OpenAlex) sono spesso incompleti.",
    provClassificationNote: "La classificazione con revisione paritaria/preprint è euristica.",
    provGeneratedFrom: "Generato da",
    provOn: "il",
    provRecords: "record",
    provHidden: "nascosti",
    provCorrected: "corretti",
    sourceManualEntries: "voci manuali",
    sourceDerived: "derivato",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Accesso aperto ({status})",
    openAccessLabel: "Accesso aperto",
    researchSummaryHeading: "Sintesi della ricerca",
    whatsNewLabel: "Aggiunto di recente",
    outputSummaryLabel: "Produzione scientifica",
    badgeRetracted: "Ritirato",
    badgeRetractedTitle: "Questo lavoro è stato ritirato (secondo Crossref / Retraction Watch)",
    badgeCitations: "{n} citazioni",
    badgeCitationsTitle:
      "Conteggio grezzo delle citazioni — non normalizzato per campo (varia per campo ed età)",
    verifiedByText: "verificato da {org}",
    verifiedGenericText: "verificato tramite ORCID",
    badgeVerified: "Verificato",
    badgeVerifiedTitle:
      "Confermato dall’istituzione tramite ORCID: inserito da un’organizzazione fidata, non dalla persona stessa",
    badgeVerifiedByTitle:
      "Verificato da {org} tramite ORCID: inserito dall’organizzazione, non dalla persona stessa",
    metric2yr: "Citazioni medie a 2 anni",
    metricFwci: "FWCI medio dei lavori",
    metricHIndex: "indice h",
    metricI10: "indice i10",
    metricWorks: "Lavori",
    metricCitations: "Citazioni",
    metricContextFwci: "1,0 = media mondiale per campo e anno",
    metricContext2yr:
      "tasso di citazione a 2 anni — non normalizzato per campo (varia per disciplina)",
    metricFwciCoverage: "media su {n} lavori con FWCI",
    metricRcr: "RCR medio",
    metricContextRcr: "1,0 = media degli articoli finanziati dai NIH; solo lavori biomedici (PMID)",
    metricContextHIndex:
      "non normalizzato per campo; sensibile alla durata della carriera e alla disciplina",
    metricContextI10:
      "lavori con ≥10 citazioni — non normalizzato per campo; cresce con la durata della carriera",
    metricContextWorks:
      "conteggio grezzo dei lavori indicizzati — dipende dalla copertura della banca dati; non misura la qualità",
    metricContextCitations:
      "totale grezzo — non normalizzato per campo (varia per disciplina e durata della carriera)",
    metricRcrCoverage: "media su {n} lavori con RCR",
    metricSmallN: "campione ridotto — interpretare con cautela",
    roleFirst: "Primo autore",
    roleSecond: "Secondo autore",
    roleThird: "Terzo autore",
    roleMiddle: "k-esimo autore",
    roleSecondLast: "Penultimo autore",
    roleLast: "Ultimo autore",
    roleCorresponding: "Autore corrispondente",
    madeWith: "Creato con",
    liveVersionLabel: "Versione online",
    livingNote: "Aggiornato il {date} · CV vivo, si aggiorna da solo",
    rorRecordTitle: "Scheda dell’organizzazione su ROR",
    institutionSiteTitle: "Sito web dell’istituzione",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite): tasso di citazione normalizzato per settore; 1,0 = l’articolo medio finanziato dai NIH. Solo lavori biomedici.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex): citazioni rispetto ai lavori dello stesso settore, tipo e anno; 1,0 = la media.",
    indicatorClinicalCitations: "citato da {n} articoli clinici",
    indicatorClinicalCitationOne: "citato da {n} articolo clinico",
    indicatorClinicalCitationsLabel: "Citazioni cliniche",
    indicatorClinicalCitationsTitle:
      "Numero di articoli clinici (linee guida, studi clinici) che citano questo lavoro, secondo NIH iCite. Solo lavori biomedici.",
    indicatorClinical: "Articolo clinico",
    indicatorClinicalTitle:
      "NIH iCite classifica questo lavoro come articolo clinico (linea guida o studio clinico).",
    provLedgerTitle: "Registro di provenienza",
    provLedgerNote:
      "Quanto è verificabile questo documento: ogni riga conta le voci mostrate, con il proprio denominatore. Non è una valutazione del ricercatore e non è mai un punteggio.",
    provLedgerIdentifier: "Abbinate per identificativo (ORCID / OpenAlex)",
    provLedgerClaimed: "Aggiunte tramite DOI (dichiarate dal titolare)",
    provLedgerSelfEntered: "Inserite a mano",
    provLedgerNameMatched: "Abbinate solo per nome",
    provLedgerOther: "Altra attribuzione",
    provLedgerVerified:
      "Posizioni, formazione e riconoscimenti attestati da un'organizzazione affidabile",
    provLedgerPid: "Risolvibili tramite un identificativo persistente (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Pubblicazioni attribuite dalle fonti e confermate dal titolare",
    provLedgerRetracted: "Lavori ritrattati mostrati",
    provLedgerOf: "{n} su {total} ({pct})",
    collabLine: "Coautori da {countries} paesi · {pct} dei lavori sono internazionali",
    collabLineOne: "Coautori da un solo paese · {pct} dei lavori sono internazionali",
    collabTop: "più spesso {list}",
    collabContext: "in base ai dati di affiliazione OpenAlex; n = {n}",
    creditRolesLabel: "Ruoli:",
    creditRolesSelfTitle: "Dichiarato dall’autore",
    creditRolesCrossrefTitle: "Dai metadati dell’editore (Crossref)",
    creditRoles: {
      conceptualization: "Concettualizzazione",
      "data-curation": "Curatela dei dati",
      "formal-analysis": "Analisi formale",
      "funding-acquisition": "Reperimento dei fondi",
      investigation: "Indagine",
      methodology: "Metodologia",
      "project-administration": "Amministrazione del progetto",
      resources: "Risorse",
      software: "Software",
      supervision: "Supervisione",
      validation: "Validazione",
      visualization: "Visualizzazione",
      "writing-original-draft": "Stesura della bozza originale",
      "writing-review-editing": "Revisione e redazione",
    },
    careerContextLabel: "Contesto di carriera (autodichiarato)",
    careerKindCareerBreak: "Interruzione di carriera",
    careerKindPartTime: "Tempo parziale",
    careerKindClinicalDuties: "Attività clinica in parallelo alla ricerca",
    careerKindCaring: "Responsabilità di cura",
    careerKindMilitary: "Servizio militare",
    careerKindOther: "Altro",
    careerFirstPublication: "Prima pubblicazione: {year} ({n} anni di attività)",
    degreeBachelor: "Laurea triennale",
    degreeMaster: "Laurea magistrale",
    degreePhd: "Dottorato",
    degreePostdoc: "Post-doc",
    degreeClinicalFellow: "Fellow clinico",
    degreeOther: "Altro",
    superviseeBachelor: "Studente triennale",
    superviseeMaster: "Studente magistrale",
    superviseePhd: "Dottorando/a",
    superviseePostdoc: "Ricercatore/rice post-doc",
    superviseeClinicalFellow: "Fellow clinico",
    superviseeOther: "Persona supervisionata",
    supervisionRolePrimary: "relatore/rice principale",
    supervisionRoleCo: "co-relatore/rice",
    supervisionRoleCommittee: "membro della commissione",
    supervisionRoleMentor: "mentore",
    supervisionStatusOngoing: "in corso",
    supervisionStatusCompleted: "completata",
    supervisionStatusDiscontinued: "interrotta",
    supervisionNow: "ora: {position}",
    supervisionSummaryTotal: "{n} supervisioni",
    supervisionSummaryCompleted: "{n} completate",
    dataLinksLabel: "Dati",
    codeLinksLabel: "Codice",
    replicatedLabel: "Replicato: {n} studi",
    replicatedOfLabel: "Replica di:",
    outcomeSuccess: "riuscita",
    outcomeFailure: "fallita",
    outcomeMixed: "mista",
    outcomeInformativeFailure: "fallimento informativo",
    softwareRepository: "Codice sorgente",
    softwareVersion: "Versione {version}",
    softwareLicense: "Licenza: {license}",
    readerLinkLabel: "Vista per valutatori",
    readerLinkTitle:
      "Mostra i segnali di provenienza, verifica e contesto presenti nei dati del titolare",
    readerBannerText:
      "Vista per valutatori: mostra i segnali di provenienza, verifica e contesto tratti dai dati del titolare. Nulla di ciò che vedi qui è un punteggio.",
    readerBannerBack: "Torna alla pagina standard",
    provMatchOrcid: "Associato al titolare tramite ORCID iD",
    provMatchOpenAlexId: "Associato al titolare tramite ID autore OpenAlex",
    provMatchBoth: "Associato al titolare tramite ORCID iD e ID autore OpenAlex",
    provMatchClaimed:
      "Aggiunto dal titolare tramite DOI — nessuna corrispondenza di identificativo nel record",
    provSourceOf: "Record proveniente da {source}",
    provSourceManual: "Inserito dal titolare",
    provEnriched: "metadati completati da Crossref",
    provUnderReview: "segnalato per la revisione del titolare",
    provLastVerified: "ultima verifica il {date}",
    provLabelClaimed: "Rivendicato",
    provLabelManual: "Manuale",
    selfAuthorTail: "incl. {name}, autore {position} di {count}",
  },
  "ko-KR": {
    hankoCredit:
      "구획 이름을 한 획씩 붓으로 씀 · 획순 {kanjivg} (CC BY-SA 3.0) · 붓글씨 서체 Yuji Boku (SIL OFL)",
    refManagerNote:
      "이 논문들을 문헌 관리 도구(Zotero, Mendeley 등)에 저장할 수 있습니다 — 브라우저 커넥터가 자동으로 인식합니다.",
    researchAreasLabel: "연구 분야",
    citeLabel: "인용",
    abstractLabel: "초록",
    fullTextLabel: "전문",
    badgeFeatured: "선정",
    badgeFeaturedTitle: "선정 / 주요 논문",
    subscribeLabel: "구독",
    subscribeHint: "이 피드 URL을 RSS 리더에 추가하세요:",
    filterLabel: "필터",
    filterAll: "전체",
    filterSince: "{year}년 이후",
    filterOpenAccess: "오픈 액세스",
    filterTypeArticle: "논문",
    filterTypePreprint: "프리프린트",
    filterTypeReview: "리뷰",
    filterTypeConference: "학회",
    filterTypeBook: "도서",
    filterTypeDataset: "데이터셋",
    badgeArchived: "보관됨",
    badgeArchivedTitle: "Software Heritage에 의해 보관됨 — 소스 코드의 영구 스냅샷",
    publicEvaluationsPrefix: "공개 평가:",
    coauthorsHeading: "SigmaCV를 사용하는 공저자",
    datePresent: "현재",
    dateUntil: "{year}까지",
    chartPublicationsPerYear: "연도별 논문 수",
    chartCitationsPerYear: "연도별 피인용 수",
    authorshipCaption: "저자 정보 (동료 심사)",
    authorshipCorrespondingNote: "교신저자 데이터(OpenAlex)는 불완전한 경우가 많습니다.",
    provClassificationNote: "동료 심사/프리프린트 분류는 추정에 기반합니다.",
    provGeneratedFrom: "출처",
    provOn: "생성일",
    provRecords: "건",
    provHidden: "숨김",
    provCorrected: "수정됨",
    sourceManualEntries: "수동 입력",
    sourceDerived: "파생",
    cvFallbackTitle: "이력서",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "오픈 액세스 ({status})",
    openAccessLabel: "오픈 액세스",
    researchSummaryHeading: "연구 요약",
    whatsNewLabel: "최근 추가됨",
    outputSummaryLabel: "연구 성과",
    badgeRetracted: "철회됨",
    badgeRetractedTitle: "이 성과는 철회되었습니다 (Crossref / Retraction Watch 기준)",
    badgeCitations: "인용 {n}회",
    badgeCitationsTitle: "원시 피인용 수 — 분야 정규화 안 됨 (분야·연도에 따라 다름)",
    verifiedByText: "{org}에서 인증",
    verifiedGenericText: "ORCID를 통해 인증됨",
    badgeVerified: "인증됨",
    badgeVerifiedTitle:
      "소속 기관이 ORCID를 통해 확인 — 신뢰할 수 있는 기관이 등록한 정보로, 본인이 직접 입력한 것이 아닙니다",
    badgeVerifiedByTitle:
      "{org}이(가) ORCID를 통해 인증 — 해당 기관이 등록한 정보로, 본인이 직접 입력한 것이 아닙니다",
    metric2yr: "2년 평균 피인용도",
    metricFwci: "평균 논문 FWCI",
    metricHIndex: "h-지수",
    metricI10: "i10-지수",
    metricWorks: "논문 수",
    metricCitations: "피인용 수",
    metricContextFwci: "1.0 = 분야 및 연도별 세계 평균",
    metricContext2yr: "2년 피인용률 — 분야 정규화 아님 (분야별로 크게 다름)",
    metricFwciCoverage: "FWCI가 있는 {n}편 논문 기준 평균",
    metricRcr: "평균 RCR",
    metricContextRcr: "1.0 = NIH 지원 논문 평균; 생의학(PMID) 논문만",
    metricContextHIndex: "분야 정규화 아님; 경력 기간과 분야에 따라 달라짐",
    metricContextI10: "피인용 10회 이상 논문 수 — 분야 정규화 아님; 경력이 길수록 증가",
    metricContextWorks: "색인된 논문의 원시 수 — 데이터베이스 수록 범위에 좌우됨; 질의 척도가 아님",
    metricContextCitations: "원시 합계 — 분야 정규화 아님 (분야·경력 기간에 따라 다름)",
    metricRcrCoverage: "RCR가 있는 {n}편 논문 기준 평균",
    metricSmallN: "표본이 적음 — 해석에 주의",
    roleFirst: "제1저자",
    roleSecond: "제2저자",
    roleThird: "제3저자",
    roleMiddle: "k번째 저자",
    roleSecondLast: "끝에서 두 번째 저자",
    roleLast: "마지막 저자",
    roleCorresponding: "교신저자",
    madeWith: "제작 도구:",
    liveVersionLabel: "온라인 버전",
    livingNote: "{date} 업데이트 · 자동으로 갱신되는 라이브 CV",
    rorRecordTitle: "ROR 기관 레코드",
    institutionSiteTitle: "기관 웹사이트",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "상대 인용 비율(NIH iCite) — 분야로 정규화한 피인용률. 1.0 = NIH 지원 논문 평균. 생의학 논문에만 해당.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "분야 가중 인용 영향력(OpenAlex) — 같은 분야·유형·연도의 논문 대비 피인용. 1.0 = 평균.",
    indicatorClinicalCitations: "임상 문헌 {n}편에 인용됨",
    indicatorClinicalCitationOne: "임상 문헌 {n}편에 인용됨",
    indicatorClinicalCitationsLabel: "임상 인용",
    indicatorClinicalCitationsTitle:
      "이 논문을 인용한 임상 문헌(가이드라인, 임상시험)의 수(NIH iCite 기준). 생의학 논문에만 해당.",
    indicatorClinical: "임상 문헌",
    indicatorClinicalTitle:
      "NIH iCite는 이 논문을 임상 문헌(가이드라인 또는 임상 연구)으로 분류합니다.",
    provLedgerTitle: "출처 검증표",
    provLedgerNote:
      "이 문서가 얼마나 검증 가능한지를 보여줍니다. 각 줄은 표시된 항목을 각자의 분모와 함께 셉니다. 연구자에 대한 평가가 아니며 결코 점수가 아닙니다.",
    provLedgerIdentifier: "식별자로 대조됨 (ORCID / OpenAlex)",
    provLedgerClaimed: "DOI로 추가됨 (본인 주장)",
    provLedgerSelfEntered: "직접 입력",
    provLedgerNameMatched: "이름만으로 대조됨",
    provLedgerOther: "기타 귀속",
    provLedgerVerified: "신뢰할 수 있는 기관이 증명한 직위·학력·수상",
    provLedgerPid: "영구 식별자로 확인 가능 (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "출처에 근거한 논문 중 본인이 확인한 것",
    provLedgerRetracted: "표시된 철회 논문",
    provLedgerOf: "{total}건 중 {n}건 ({pct})",
    collabLine: "공저자 국가 {countries}개 · 국제 공동 연구 비율 {pct}",
    collabLineOne: "공저자 국가 1개 · 국제 공동 연구 비율 {pct}",
    collabTop: "가장 많은 국가: {list}",
    collabContext: "OpenAlex 소속 데이터 기준; n = {n}",
    creditRolesLabel: "역할:",
    creditRolesSelfTitle: "본인 신고",
    creditRolesCrossrefTitle: "출판사 메타데이터 기준 (Crossref)",
    creditRoles: {
      conceptualization: "개념화",
      "data-curation": "데이터 큐레이션",
      "formal-analysis": "형식 분석",
      "funding-acquisition": "연구비 확보",
      investigation: "조사",
      methodology: "방법론",
      "project-administration": "프로젝트 관리",
      resources: "자원 제공",
      software: "소프트웨어",
      supervision: "지도·감독",
      validation: "검증",
      visualization: "시각화",
      "writing-original-draft": "초고 작성",
      "writing-review-editing": "검토 및 편집",
    },
    careerContextLabel: "경력 배경 (본인 신고)",
    careerKindCareerBreak: "경력 단절",
    careerKindPartTime: "시간제 근무",
    careerKindClinicalDuties: "연구와 병행한 임상 업무",
    careerKindCaring: "돌봄 책임",
    careerKindMilitary: "군 복무",
    careerKindOther: "기타",
    careerFirstPublication: "첫 출판: {year} (활동 {n}년)",
    degreeBachelor: "학사",
    degreeMaster: "석사",
    degreePhd: "박사",
    degreePostdoc: "박사후",
    degreeClinicalFellow: "임상 펠로우",
    degreeOther: "기타",
    superviseeBachelor: "학부생",
    superviseeMaster: "석사과정생",
    superviseePhd: "박사과정생",
    superviseePostdoc: "박사후연구원",
    superviseeClinicalFellow: "임상 펠로우",
    superviseeOther: "지도 학생",
    supervisionRolePrimary: "주지도교수",
    supervisionRoleCo: "공동지도교수",
    supervisionRoleCommittee: "심사위원",
    supervisionRoleMentor: "멘토",
    supervisionStatusOngoing: "진행 중",
    supervisionStatusCompleted: "완료",
    supervisionStatusDiscontinued: "중단",
    supervisionNow: "현재: {position}",
    supervisionSummaryTotal: "지도 {n}명",
    supervisionSummaryCompleted: "{n}명 완료",
    dataLinksLabel: "데이터",
    codeLinksLabel: "코드",
    replicatedLabel: "재현됨: 연구 {n}건",
    replicatedOfLabel: "재현 대상:",
    outcomeSuccess: "성공",
    outcomeFailure: "실패",
    outcomeMixed: "혼합",
    outcomeInformativeFailure: "유의미한 실패",
    softwareRepository: "소스 코드",
    softwareVersion: "버전 {version}",
    softwareLicense: "라이선스: {license}",
    readerLinkLabel: "심사자 보기",
    readerLinkTitle: "소유자 데이터에 담긴 출처·검증·맥락 신호를 표시합니다",
    readerBannerText:
      "심사자 보기: 소유자 데이터에 담긴 출처·검증·맥락 신호를 표시합니다. 여기에 있는 것은 어느 것도 점수가 아닙니다.",
    readerBannerBack: "기본 페이지로 돌아가기",
    provMatchOrcid: "ORCID iD로 소유자와 매칭됨",
    provMatchOpenAlexId: "OpenAlex 저자 ID로 소유자와 매칭됨",
    provMatchBoth: "ORCID iD와 OpenAlex 저자 ID로 소유자와 매칭됨",
    provMatchClaimed: "소유자가 DOI로 추가함 — 레코드에 식별자 일치 없음",
    provSourceOf: "{source}의 레코드",
    provSourceManual: "소유자가 직접 입력",
    provEnriched: "메타데이터를 Crossref에서 보완함",
    provUnderReview: "소유자 검토 대상으로 표시됨",
    provLastVerified: "최근 확인 {date}",
    provLabelClaimed: "본인 주장",
    provLabelManual: "수동",
    selfAuthorTail: "{name} 포함 (저자 {count}명 중 {position}번째)",
  },
  "ru-RU": {
    hankoCredit:
      "Названия разделов выписаны кистью штрих за штрихом · порядок черт {kanjivg} (CC BY-SA 3.0) · кисть Yuji Boku (SIL OFL)",
    refManagerNote:
      "Сохраните эти публикации в менеджер ссылок (Zotero, Mendeley…) — коннектор вашего браузера обнаружит их.",
    researchAreasLabel: "Области исследований",
    citeLabel: "Цитировать",
    abstractLabel: "Аннотация",
    fullTextLabel: "Полный текст",
    badgeFeatured: "Избранное",
    badgeFeaturedTitle: "Избранная / рекомендуемая публикация",
    subscribeLabel: "Подписаться",
    subscribeHint: "Добавьте этот URL ленты в свой RSS-ридер:",
    filterLabel: "Фильтр",
    filterAll: "Все",
    filterSince: "С {year}",
    filterOpenAccess: "Открытый доступ",
    filterTypeArticle: "Статьи",
    filterTypePreprint: "Препринты",
    filterTypeReview: "Обзоры",
    filterTypeConference: "Конференции",
    filterTypeBook: "Книги",
    filterTypeDataset: "Наборы данных",
    badgeArchived: "Архивировано",
    badgeArchivedTitle: "Архивировано Software Heritage — постоянный снимок исходного кода",
    publicEvaluationsPrefix: "Публично оценено:",
    coauthorsHeading: "Соавторы в SigmaCV",
    datePresent: "наст. время",
    dateUntil: "до {year}",
    chartPublicationsPerYear: "Публикации / год",
    chartCitationsPerYear: "Цитирования / год",
    authorshipCaption: "Авторство (рецензируемые)",
    authorshipCorrespondingNote: "Данные об авторе для корреспонденции (OpenAlex) часто неполны.",
    provClassificationNote: "Классификация «рецензируемое/препринт» является эвристической.",
    provGeneratedFrom: "Сформировано из",
    provOn: "от",
    provRecords: "записей",
    provHidden: "скрыто",
    provCorrected: "исправлено",
    sourceManualEntries: "ручные записи",
    sourceDerived: "производные",
    cvFallbackTitle: "Резюме",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Открытый доступ ({status})",
    openAccessLabel: "Открытый доступ",
    researchSummaryHeading: "Сводка исследований",
    whatsNewLabel: "Недавно добавлено",
    outputSummaryLabel: "Научная продукция",
    badgeRetracted: "Отозвано",
    badgeRetractedTitle: "Эта работа была отозвана (по данным Crossref / Retraction Watch)",
    badgeCitations: "{n} цитирований",
    badgeCitationsTitle:
      "Сырое число цитирований — без нормализации по области (зависит от области и возраста)",
    verifiedByText: "подтверждено {org}",
    verifiedGenericText: "подтверждено через ORCID",
    badgeVerified: "Подтверждено",
    badgeVerifiedTitle:
      "Подтверждено организацией через ORCID — внесено доверенной организацией, а не самим владельцем записи",
    badgeVerifiedByTitle:
      "Подтверждено {org} через ORCID — внесено организацией, а не самим владельцем записи",
    metric2yr: "Средняя цитируемость за 2 года",
    metricFwci: "Средний FWCI работы",
    metricHIndex: "h-индекс",
    metricI10: "i10-индекс",
    metricWorks: "Работы",
    metricCitations: "Цитирования",
    metricContextFwci: "1,0 = среднемировой уровень для области и года",
    metricContext2yr: "цитируемость за 2 года — без нормализации по области (зависит от области)",
    metricFwciCoverage: "среднее по {n} работам с FWCI",
    metricRcr: "Средний RCR",
    metricContextRcr:
      "1,0 = среднее для статей, финансируемых NIH; только биомедицинские работы (PMID)",
    metricContextHIndex: "без нормализации по области; зависит от длительности карьеры и области",
    metricContextI10:
      "работы с ≥10 цитированиями — без нормализации по области; растёт с длительностью карьеры",
    metricContextWorks:
      "необработанное число проиндексированных работ — зависит от охвата базы; не мера качества",
    metricContextCitations:
      "необработанная сумма — без нормализации по области (зависит от области и длительности карьеры)",
    metricRcrCoverage: "среднее по {n} работам с RCR",
    metricSmallN: "малая выборка — интерпретируйте осторожно",
    roleFirst: "Первый автор",
    roleSecond: "Второй автор",
    roleThird: "Третий автор",
    roleMiddle: "k-й автор",
    roleSecondLast: "Предпоследний автор",
    roleLast: "Последний автор",
    roleCorresponding: "Автор для корреспонденции",
    madeWith: "Создано с помощью",
    liveVersionLabel: "Онлайн-версия",
    livingNote: "Обновлено {date} · живое резюме, обновляется автоматически",
    rorRecordTitle: "Запись организации в ROR",
    institutionSiteTitle: "Сайт организации",
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) — нормированная по области частота цитирования; 1,0 = средняя статья, финансируемая NIH. Только биомедицинские работы.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) — цитирования относительно работ той же области, типа и года; 1,0 = среднее.",
    indicatorClinicalCitations: "цитируется в {n} клинических статьях",
    indicatorClinicalCitationOne: "цитируется в {n} клинической статье",
    indicatorClinicalCitationsLabel: "Клинические цитирования",
    indicatorClinicalCitationsTitle:
      "Число клинических статей (руководства, клинические испытания), цитирующих эту работу, по данным NIH iCite. Только биомедицинские работы.",
    indicatorClinical: "Клиническая статья",
    indicatorClinicalTitle:
      "NIH iCite относит эту работу к клиническим статьям (руководство или клиническое исследование).",
    provLedgerTitle: "Реестр происхождения данных",
    provLedgerNote:
      "Насколько проверяем этот документ: каждая строка считает показанные записи с собственным знаменателем. Это не оценка исследователя и никогда не балл.",
    provLedgerIdentifier: "Сопоставлены по идентификатору (ORCID / OpenAlex)",
    provLedgerClaimed: "Добавлены по DOI (заявлены владельцем)",
    provLedgerSelfEntered: "Введены вручную",
    provLedgerNameMatched: "Сопоставлены только по имени",
    provLedgerOther: "Иная атрибуция",
    provLedgerVerified: "Должности, образование и награды, подтверждённые доверенной организацией",
    provLedgerPid: "Разрешимы по постоянному идентификатору (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Публикации из источников, подтверждённые владельцем",
    provLedgerRetracted: "Показанные отозванные работы",
    provLedgerOf: "{n} из {total} ({pct})",
    collabLine: "Соавторы из {countries} стран · {pct} работ международные",
    collabLineOne: "Соавторы из одной страны · {pct} работ международные",
    collabTop: "чаще всего {list}",
    collabContext: "по данным OpenAlex об аффилиациях; n = {n}",
    creditRolesLabel: "Роли:",
    creditRolesSelfTitle: "Указано автором",
    creditRolesCrossrefTitle: "По метаданным издателя (Crossref)",
    creditRoles: {
      conceptualization: "Концептуализация",
      "data-curation": "Курирование данных",
      "formal-analysis": "Формальный анализ",
      "funding-acquisition": "Привлечение финансирования",
      investigation: "Исследование",
      methodology: "Методология",
      "project-administration": "Администрирование проекта",
      resources: "Ресурсы",
      software: "Программное обеспечение",
      supervision: "Научное руководство",
      validation: "Валидация",
      visualization: "Визуализация",
      "writing-original-draft": "Написание черновика",
      "writing-review-editing": "Рецензирование и редактирование",
    },
    careerContextLabel: "Контекст карьеры (по заявлению автора)",
    careerKindCareerBreak: "Перерыв в карьере",
    careerKindPartTime: "Неполная занятость",
    careerKindClinicalDuties: "Клиническая работа параллельно с исследованиями",
    careerKindCaring: "Обязанности по уходу",
    careerKindMilitary: "Военная служба",
    careerKindOther: "Другое",
    careerFirstPublication: "Первая публикация: {year} ({n} лет активности)",
    degreeBachelor: "Бакалавриат",
    degreeMaster: "Магистратура",
    degreePhd: "Аспирантура (PhD)",
    degreePostdoc: "Постдок",
    degreeClinicalFellow: "Клинический фелло",
    degreeOther: "Другое",
    superviseeBachelor: "Студент бакалавриата",
    superviseeMaster: "Магистрант",
    superviseePhd: "Аспирант",
    superviseePostdoc: "Постдокторант",
    superviseeClinicalFellow: "Клинический фелло",
    superviseeOther: "Подопечный",
    supervisionRolePrimary: "основной руководитель",
    supervisionRoleCo: "соруководитель",
    supervisionRoleCommittee: "член комиссии",
    supervisionRoleMentor: "наставник",
    supervisionStatusOngoing: "в процессе",
    supervisionStatusCompleted: "завершено",
    supervisionStatusDiscontinued: "прервано",
    supervisionNow: "сейчас: {position}",
    supervisionSummaryTotal: "{n} под руководством",
    supervisionSummaryCompleted: "{n} завершено",
    dataLinksLabel: "Данные",
    codeLinksLabel: "Код",
    replicatedLabel: "Реплицировано: {n} исследований",
    replicatedOfLabel: "Репликация:",
    outcomeSuccess: "успешная",
    outcomeFailure: "неудачная",
    outcomeMixed: "смешанная",
    outcomeInformativeFailure: "информативная неудача",
    softwareRepository: "Исходный код",
    softwareVersion: "Версия {version}",
    softwareLicense: "Лицензия: {license}",
    readerLinkLabel: "Режим эксперта",
    readerLinkTitle:
      "Показать признаки происхождения, подтверждения и контекста из данных владельца",
    readerBannerText:
      "Режим эксперта: показывает признаки происхождения, подтверждения и контекста из данных владельца. Ничто здесь не является оценкой.",
    readerBannerBack: "Вернуться к обычной странице",
    provMatchOrcid: "Сопоставлено с владельцем по ORCID iD",
    provMatchOpenAlexId: "Сопоставлено с владельцем по ID автора OpenAlex",
    provMatchBoth: "Сопоставлено с владельцем по ORCID iD и ID автора OpenAlex",
    provMatchClaimed: "Добавлено владельцем по DOI — совпадения идентификатора в записи нет",
    provSourceOf: "Запись из {source}",
    provSourceManual: "Введено владельцем вручную",
    provEnriched: "метаданные дополнены из Crossref",
    provUnderReview: "отмечено для проверки владельцем",
    provLastVerified: "последняя проверка {date}",
    provLabelClaimed: "Заявлено",
    provLabelManual: "Вручную",
    selfAuthorTail: "в т. ч. {name}, автор {position} из {count}",
  },
};

/** Localized rendered-CV strings (falls back to English for unknown locales). */
export function renderStrings(locale: string): RenderStrings {
  return RENDER_I18N[asLocale(locale)];
}

/** Map a metric key to its localized label. */
export function metricLabel(locale: string, key: string): string {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    "2yr_mean_citedness": s.metric2yr,
    fwci_mean: s.metricFwci,
    rcr_mean: s.metricRcr,
    h_index: s.metricHIndex,
    i10_index: s.metricI10,
    works_count: s.metricWorks,
    cited_by_count: s.metricCitations,
  };
  return map[key] ?? key;
}

/**
 * Map a metric key to its localized responsible-reading context (or undefined for
 * an unknown key). EVERY catalog metric carries one: the field-normalised measures
 * get their interpretation anchor, and the author-level counts (h-index, i10,
 * works, citations) get a short neutral caveat — so the DORA/CoARA caution that
 * the owner saw in the picker also reaches the READER of the PDF / public page,
 * rather than living only owner-side (`metricHints`).
 */
export function metricContext(locale: string, key: string): string | undefined {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    fwci_mean: s.metricContextFwci,
    rcr_mean: s.metricContextRcr,
    "2yr_mean_citedness": s.metricContext2yr,
    h_index: s.metricContextHIndex,
    i10_index: s.metricContextI10,
    works_count: s.metricContextWorks,
    cited_by_count: s.metricContextCitations,
  };
  return map[key];
}

/**
 * Localized "mean over N works with FWCI" coverage note. Returns undefined when
 * N is not a positive number, so callers can omit it cleanly.
 */
export function metricCoverageNote(locale: string, n: number | undefined): string | undefined {
  if (typeof n !== "number" || n <= 0) return undefined;
  return renderStrings(locale).metricFwciCoverage.replace("{n}", String(n));
}

/** Localized "mean over N works with RCR" coverage note (RCR counterpart of
 *  {@link metricCoverageNote}). Undefined when N is not a positive number. */
export function metricRcrCoverageNote(locale: string, n: number | undefined): string | undefined {
  if (typeof n !== "number" || n <= 0) return undefined;
  return renderStrings(locale).metricRcrCoverage.replace("{n}", String(n));
}

/** Localized small-sample caveat, appended to a field-normalized coverage note
 *  when the work count is below the reliability threshold (see render/metrics). */
export function metricSmallNNote(locale: string): string {
  return renderStrings(locale).metricSmallN;
}

/** Map an authorship role to its localized label. */
export function authorshipRoleLabel(locale: string, role: string): string {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    first: s.roleFirst,
    second: s.roleSecond,
    third: s.roleThird,
    middle: s.roleMiddle,
    "second-last": s.roleSecondLast,
    last: s.roleLast,
    corresponding: s.roleCorresponding,
  };
  return map[role] ?? role;
}

// ─── Structured supervision record labels ────────────────────────────────────
// Shared by the renderers (the two-line record + the summary line), the editor's
// selects and the narrative-evidence extractor, so one vocabulary → one label.

/** Localized degree-level label ("PhD", "Master's", …). */
export function degreeLabel(rs: RenderStrings, level: DegreeLevel): string {
  const map: Record<DegreeLevel, string> = {
    bachelor: rs.degreeBachelor,
    master: rs.degreeMaster,
    phd: rs.degreePhd,
    postdoc: rs.degreePostdoc,
    "clinical-fellow": rs.degreeClinicalFellow,
    other: rs.degreeOther,
  };
  return map[level];
}

/** The degree-level NOUN that stands in for a hidden supervisee name
 *  ("PhD student"); the generic "Supervisee" when the level is unknown. */
export function superviseeNoun(rs: RenderStrings, level: DegreeLevel | undefined): string {
  const map: Record<DegreeLevel, string> = {
    bachelor: rs.superviseeBachelor,
    master: rs.superviseeMaster,
    phd: rs.superviseePhd,
    postdoc: rs.superviseePostdoc,
    "clinical-fellow": rs.superviseeClinicalFellow,
    other: rs.superviseeOther,
  };
  return level ? map[level] : rs.superviseeOther;
}

/** Localized label of the owner's supervision role ("primary supervisor", …). */
export function supervisionRoleLabel(rs: RenderStrings, role: SupervisionRole): string {
  const map: Record<SupervisionRole, string> = {
    primary: rs.supervisionRolePrimary,
    "co-supervisor": rs.supervisionRoleCo,
    committee: rs.supervisionRoleCommittee,
    mentor: rs.supervisionRoleMentor,
  };
  return map[role];
}

/** Localized status term ("ongoing" / "completed" / "discontinued"). */
export function supervisionStatusLabel(rs: RenderStrings, status: SupervisionStatus): string {
  const map: Record<SupervisionStatus, string> = {
    ongoing: rs.supervisionStatusOngoing,
    completed: rs.supervisionStatusCompleted,
    discontinued: rs.supervisionStatusDiscontinued,
  };
  return map[status];
}
