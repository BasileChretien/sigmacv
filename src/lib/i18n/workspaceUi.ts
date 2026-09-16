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
  /** Page estimate of the narrative sections against the layout's limit;
   *  "{pages}" and "{limit}" substituted. The second when over the limit. */
  hpPages: string;
  hpPagesOver: string;
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
  /** Panel title — inside the "Open access" tab, it says what the list is: things
   *  the owner can act on (a position to link, a paper to deposit, a choice open). */
  wlTitle: string;
  /** Owner-only framing: help, not a verdict; never on the CV or public page. */
  wlIntro: string;
  /** Group (a): current positions without a ROR record. No count: the list is below. */
  wlPositionsHeading: string;
  /** The one thing that resolves it: the organisation added to the position on
   *  ORCID, picked up at the next sync. No picker exists in the editor — say so. */
  wlPositionsHelp: string;
  /** Group (b): countable works with no open copy found. No count, no share. */
  wlClosedHeading: string;
  /** Help under the closed works — a deposit MAY be possible; never a verdict. */
  wlClosedHelp: string;
  wlStateOpenCc: string;
  wlStateOpenOther: string;
  wlStateClosed: string;
  wlStateUnknown: string;
  /** Open Policy Finder link text (journal policy by name). */
  wlPolicyLink: string;
  /** Funder NAMES printed on the work, as context only; {names}. */
  wlFunders: string;
  /** Publisher policy line when OA.Works records a permission; {versions} = an or-list of versions. */
  wlArchivingAllowed: string;
  /** Repository kinds as OA.Works words them (untranslated); {locations} = an or-list. */
  wlArchivingWhere: string;
  /** Publisher policy line when OA.Works records no permission — a record, never a verdict. */
  wlArchivingNotAllowed: string;
  /** Version label: submitted manuscript. */
  wlArchivingVersionSubmitted: string;
  /** Version label: author accepted manuscript. */
  wlArchivingVersionAccepted: string;
  /** Version label: version of record. */
  wlArchivingVersionPublished: string;
  /** Version label when the record names none. */
  wlArchivingVersionUnstated: string;
  /** Embargo with OA.Works' own end date for this article; {duration} (Intl, months), {date} (ISO). Never "expired". */
  wlArchivingEmbargo: string;
  /** Embargo without an end date; {duration}. */
  wlArchivingEmbargoDuration: string;
  /** Embargo of zero months. */
  wlArchivingNoEmbargo: string;
  /** Licence of the deposited copy as recorded; {licence}. */
  wlArchivingLicence: string;
  /** Lead-in to the publisher's required statement, quoted verbatim below it. */
  wlArchivingStatement: string;
  /** The record's own update date and SigmaCV's retrieval date; {updated}, {retrieved}. */
  wlArchivingDates: string;
  /** Retrieval date when the record carries no update date; {retrieved}. */
  wlArchivingRetrieved: string;
  /** Link text: the archived copy of the publisher's policy. */
  wlArchivingPolicyLink: string;
  /** Footer under the closed works when any rights line shows: dated records, unverifiable statutory conditions, not legal advice. */
  wlArchivingDisclaimer: string;
  /** A statutory secondary-publication right that MAY also apply; {country}, {instrument}, {statements}. */
  wlStatutoryAuthorRight: string;
  /** A statutory repository-deposit requirement (an obligation, not an option) that MAY also apply; {country}, {instrument}, {statements}. */
  wlStatutoryDepositRequirement: string;
  /** A national open-access policy (no statute) that MAY also apply; {country}, {instrument}, {statements}. */
  wlStatutoryFundingPolicy: string;
  /** Verified statutory entry; {date} = the table's lastVerified. */
  wlStatutoryRecorded: string;
  /** Unverified statutory entry — never a date. */
  wlStatutoryPending: string;
  /** Link text: the legal text. */
  wlStatutorySourceLink: string;
  /** Link text: a policy document where no statute exists (Japan). */
  wlStatutoryPolicyLink: string;
  /** Link text: the guidance page quoting or explaining the text. */
  wlStatutoryGuidanceLink: string;
  /** Action: deposit the accepted manuscript; {destination}. */
  wlDepositAccepted: string;
  /** Action: deposit the published version, which the recorded policy allows; {destination}. */
  wlDepositPublished: string;
  /** Action: deposit the submitted manuscript, the only version the recorded policy allows; {destination}. */
  wlDepositSubmitted: string;
  /** Action with no usable record: the accepted manuscript, not the publisher's PDF, if the journal's policy allows it; {destination}. */
  wlDepositUnrecorded: string;
  /** Action when the record allows no deposit there: only if the publishing agreement allows it; {destination}. */
  wlDepositIfAgreement: string;
  /** The same when a statutory rule is shown above the work; {destination}. */
  wlDepositIfRightOrAgreement: string;
  /** One action line: {action} (the link) and its {reason}. */
  wlDepositLine: string;
  /** Reason: the work names a funder with a confirmed repository; {funder}. */
  wlDepositBecauseFunder: string;
  /** Reason: OpenAlex lists some of the owner's works in that repository; {repository}. */
  wlDepositBecauseOwn: string;
  /** Reason: the national repository of the affiliation country on the paper; {country}. */
  wlDepositBecausePaperCountry: string;
  /** Reason: the national repository of the current affiliation's country; {country}. */
  wlDepositBecauseCurrentCountry: string;
  /** Zenodo's reason when no national repository is known for the paper's country; {country}. */
  wlDepositBecauseNoRepositoryPaper: string;
  /** Zenodo's reason when none is known for the current affiliation's country; {country}. */
  wlDepositBecauseNoRepositoryCurrent: string;
  /** Zenodo's reason when the paper records no affiliation country. */
  wlDepositBecauseNoAffiliation: string;
  /** Zenodo's reason among other places: open to anyone. */
  wlDepositZenodoAny: string;
  /** ShareYourPaper's description among other places. */
  wlDepositShareYourPaper: string;
  /** Form note: the licence the recorded policy asks for; {licence}. */
  wlDepositFormLicence: string;
  /** Form note: keep the file under embargo until the recorded end; {date}. */
  wlDepositFormEmbargoDate: string;
  /** Form note: the embargo as a duration after publication; {duration}. */
  wlDepositFormEmbargoDuration: string;
  /** Form note for Zenodo: the publisher's DOI goes under related works, not as the deposit's own (Zenodo's form labels are English). */
  wlDepositZenodoDoi: string;
  /** Form note for HAL: paste the DOI where the form loads metadata from an identifier. HAL ignores a DOI in the link (checked 2026-09-15). Only HAL's French labels were read, so fr-FR quotes them and the other locales describe the box. */
  wlDepositHalDoi: string;
  /** Disclosure summary listing the remaining places. */
  wlDepositOtherPlaces: string;
  /** Button: copy the work's DOI to paste into a deposit form. */
  wlDepositCopyDoi: string;
  /** Button state after copying; also announced once in the panel's status region. */
  wlDepositDoiCopied: string;
  /** Summary of the one disclosure under a closed work: the OA.Works record, the
   *  statutory rule, the form notes, the other places. */
  wlRowDetails: string;
  /** Hidden note every external link is described by (WCAG: a new tab is a change of context). */
  wlOpensNewTab: string;
  /** Why the deposit is allowed today — the publisher's permission: {version}, {date} = the record's date. */
  wlWhyPublisher: string;
  /** … and its embargo ended on {date}. */
  wlWhyEmbargoEnded: string;
  /** … and it set no embargo. */
  wlWhyNoEmbargo: string;
  /** … or the statutory right: {instrument}, {country}, {duration} = its delay, {date} = when it ran out. */
  wlWhyStatute: string;
  /** The same for a right that sets no delay. */
  wlWhyStatuteNoDelay: string;
  /** The deposit chip on a publication row: `{destination}` = the route's name. */
  wlChipDeposit: string;
  /** The same when the publisher's record allows no deposit outright. */
  wlChipDepositIf: string;
  /** The chip's hint: it opens the Open access tab at this work. */
  wlChipHint: string;
  /** Legend of the choice between the two affiliations. */
  wlDepositBasisLabel: string;
  /** Choice: route by the affiliation printed on each paper (default). */
  wlDepositBasisPaper: string;
  /** Choice: route by the owner's current affiliation; {country}. */
  wlDepositBasisCurrent: string;
  /** One line above the closed works: links open in a new tab, the DOI helps fill the form, the file is the author's choice. */
  wlDepositHelp: string;
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
  // ── Owner worklist: institution listing (a status line, never a gap) ─────
  /** First row: whether the CV is listed under its current affiliations. */
  wlListingHeading: string;
  /** Voluntary, absence means nothing, withdrawal immediate — under the heading. */
  wlListingHelp: string;
  /** Not yet listed; {institution} = the names joined. */
  wlListingUnlisted: string;
  /** On the institution's page but not in its OAI-PMH set; {institution}. */
  wlListingPageOnly: string;
  /** In the institution's OAI-PMH set but not on its page; {institution}. */
  wlListingSetOnly: string;
  /** The consent button — names the institution(s); {institution}. */
  wlListingListMe: string;
  /** The consent button while no institution is ticked yet (disabled). */
  wlListingListMeNone: string;
  /** Listed; {institution} = the names joined. */
  wlListingListed: string;
  /** The worklist's "Search indexing" row: heading, help, and the three states. */
  wlIndexingHeading: string;
  wlIndexingHelp: string;
  wlIndexingUndecided: string;
  wlIndexingOff: string;
  wlIndexingOn: string;
  /** Opens the Publish menu at the institution sub-section. */
  wlListingChange: string;
  /** Shown instead of the button while the page is unpublished or not indexable. */
  wlListingNeedsPage: string;
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
    wlTitle: "What you can act on",
    wlIntro:
      "For you only — help with the record, not a verdict. Nothing here appears on your CV or your public page.",
    wlPositionsHeading: "Current positions without an institution record",
    wlPositionsHelp:
      "No ROR record was matched. Add the organisation to this position on ORCID, then sync again.",
    wlClosedHeading: "Papers you can deposit now",
    wlClosedHelp:
      "SigmaCV found no open copy, and the publisher's policy or the law lets you deposit a version today.",
    wlStateOpenCc: "Open, Creative Commons licence",
    wlStateOpenOther: "Open, other or unknown licence",
    wlStateClosed: "No open copy found",
    wlStateUnknown: "Unknown",
    wlPolicyLink: "Check the journal's policy (Open Policy Finder)",
    wlFunders: "Funders named on the work: {names}",
    wlArchivingAllowed:
      "Publisher policy recorded by OA.Works: self-archiving allowed — {versions}.",
    wlArchivingWhere: "Where: {locations}.",
    wlArchivingNotAllowed:
      "Publisher policy recorded by OA.Works: no self-archiving permission recorded for this article.",
    wlArchivingVersionSubmitted: "submitted manuscript",
    wlArchivingVersionAccepted: "accepted manuscript",
    wlArchivingVersionPublished: "published version",
    wlArchivingVersionUnstated: "version not stated",
    wlArchivingEmbargo: "Embargo: {duration}, ending {date}.",
    wlArchivingEmbargoDuration: "Embargo: {duration} after publication.",
    wlArchivingNoEmbargo: "No embargo.",
    wlArchivingLicence: "Licence for the deposited copy: {licence}.",
    wlArchivingStatement: "Statement the publisher asks you to include:",
    wlArchivingDates: "OA.Works record updated {updated}; retrieved {retrieved}.",
    wlArchivingRetrieved: "Retrieved from OA.Works {retrieved}; the record gives no update date.",
    wlArchivingPolicyLink: "archived copy of the publisher's policy",
    wlArchivingDisclaimer:
      "Publisher policies change, and an OA.Works record can be several years old — check its date. A statutory right depends on conditions SigmaCV cannot see: whether the work or your institution was publicly funded, how often the journal appears, your co-authors' agreement, the discipline. Your signed publishing agreement may allow more or less than the journal's general policy. This is information, not legal advice; ask your library before depositing.",
    wlStatutoryAuthorRight:
      "May also apply — secondary-publication right ({country}), {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "May also apply — statutory repository-deposit requirement ({country}), {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "May also apply — national open-access policy ({country}), {instrument}: {statements}.",
    wlStatutoryRecorded: "Recorded on {date}.",
    wlStatutoryPending: "Drafted and not yet confirmed against the legal text.",
    wlStatutorySourceLink: "legal text",
    wlStatutoryPolicyLink: "policy text",
    wlStatutoryGuidanceLink: "guidance",
    wlDepositAccepted: "Deposit the accepted manuscript in {destination}",
    wlDepositPublished: "Deposit the published version in {destination}",
    wlDepositSubmitted: "Deposit the submitted manuscript in {destination}",
    wlDepositUnrecorded:
      "Deposit your accepted manuscript, not the publisher's PDF, in {destination} if the journal's policy allows it",
    wlDepositIfAgreement: "Deposit in {destination} only if your publishing agreement allows it",
    wlDepositIfRightOrAgreement:
      "Deposit in {destination} only if a right shown above or your publishing agreement allows it",
    wlDepositLine: "{action} — {reason}",
    wlDepositBecauseFunder:
      "because this work names {funder} (a co-author may already have submitted it)",
    wlDepositBecauseOwn: "because OpenAlex lists some of your works in {repository}",
    wlDepositBecausePaperCountry: "because of your affiliation on this paper ({country})",
    wlDepositBecauseCurrentCountry: "because of your current affiliation ({country})",
    wlDepositBecauseNoRepositoryPaper:
      "because SigmaCV doesn't know of a national repository for your affiliation on this paper ({country})",
    wlDepositBecauseNoRepositoryCurrent:
      "because SigmaCV doesn't know of a national repository for your current affiliation ({country})",
    wlDepositBecauseNoAffiliation:
      "because no affiliation country is recorded for you on this paper",
    wlDepositZenodoAny: "open to any researcher",
    wlDepositShareYourPaper:
      "checks the publisher's permission and the file you upload, then deposits it in Zenodo",
    wlDepositFormLicence: "In the form, set the licence to {licence}.",
    wlDepositFormEmbargoDate: "Keep the file under embargo until {date}.",
    wlDepositFormEmbargoDuration: "Keep the file under embargo for {duration} after publication.",
    wlDepositZenodoDoi:
      "In Zenodo, answer “No” to “Do you already have a DOI for this upload?” and add this DOI under “Related works”.",
    wlDepositHalDoi:
      "In HAL's form, paste this DOI into the box that loads metadata from an identifier and fetch the metadata: HAL fills in the form from it.",
    wlDepositOtherPlaces: "Other places",
    wlDepositCopyDoi: "Copy DOI",
    wlDepositDoiCopied: "DOI copied",
    wlRowDetails: "Policy record, rights and form notes",
    wlOpensNewTab: "Opens in a new tab",
    wlWhyPublisher: "Allowed by the publisher's policy: {version}, as OA.Works recorded on {date}.",
    wlWhyEmbargoEnded: "The embargo ended on {date}.",
    wlWhyNoEmbargo: "No embargo.",
    wlWhyStatute:
      "Allowed by law — {instrument} ({country}): the accepted manuscript, {duration} after publication (since {date}), under the conditions in the record below.",
    wlWhyStatuteNoDelay:
      "Allowed by law — {instrument} ({country}): the accepted manuscript once the publisher has accepted it, under the conditions in the record below.",
    wlChipDeposit: "Deposit in {destination}",
    wlChipDepositIf: "Deposit in {destination} if allowed",
    wlChipHint: "Opens this work in the Open access tab",
    wlDepositBasisLabel: "Suggest places by",
    wlDepositBasisPaper: "the affiliation on each paper",
    wlDepositBasisCurrent: "your current affiliation ({country})",
    wlDepositHelp:
      "Each link opens the repository in a new tab (its deposit form where SigmaCV knows it). Copy the DOI to fill in the paper's details. Which file you upload is your choice; the journal's policy says which versions it allows.",
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
    wlListingHeading: "Institution listing",
    wlListingHelp:
      "A status line, not a task: listing is voluntary and absence means nothing. Withdraw at any time from the Publish menu, with immediate effect.",
    wlListingUnlisted: "You are not yet listed under {institution}.",
    wlListingPageOnly: "Listed on {institution}'s page; not in its repository set.",
    wlListingSetOnly: "In {institution}'s repository set; not on its page.",
    wlListingListMe: "List me under {institution}",
    wlListingListMeNone: "List me under the institutions I tick",
    wlListingListed: "Listed under {institution}.",
    wlIndexingHeading: "Search indexing",
    wlIndexingHelp:
      "Whether search engines may list your public page. Off until you choose; nothing is decided by silence.",
    wlIndexingUndecided: "Not decided yet — your page is not indexed.",
    wlIndexingOff: "Off — you chose not now; your page is not indexed.",
    wlIndexingOn: "On — search engines may index your page.",
    wlListingChange: "Change",
    wlListingNeedsPage:
      "Listing needs a published page with search indexing on — both are in the Publish menu.",
    hpInfoTitle: "For your eyes only",
    hpPages: "Narrative sections: ≈ {pages} of {limit} pages in the funder's template.",
    hpPagesOver: "Narrative sections: ≈ {pages} pages, over the funder's limit of {limit}.",
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
    wlTitle: "您可以处理的事项",
    wlIntro:
      "仅供您本人查看——这是对您记录的帮助，不是评判。这里的内容不会出现在您的简历或公开页面上。",
    wlPositionsHeading: "没有机构记录的当前职位",
    wlPositionsHelp: "未匹配到 ROR 记录。请在 ORCID 上为该职位添加所属组织，然后重新同步。",
    wlClosedHeading: "现在可以存缴的论文",
    wlClosedHelp: "SigmaCV 未找到开放版本，而出版社政策或法律允许您今天存入一个版本。",
    wlStateOpenCc: "开放，知识共享（CC）许可",
    wlStateOpenOther: "开放，其他或未知许可",
    wlStateClosed: "未找到开放副本",
    wlStateUnknown: "未知",
    wlPolicyLink: "查看期刊政策（Open Policy Finder）",
    wlFunders: "作品上列出的资助方：{names}",
    wlArchivingAllowed: "出版方政策（据 OA.Works 记录）：允许自存档（{versions}）。",
    wlArchivingWhere: "存放位置：{locations}。",
    wlArchivingNotAllowed: "出版方政策（据 OA.Works 记录）：未记录本文的自存档许可。",
    wlArchivingVersionSubmitted: "投稿稿",
    wlArchivingVersionAccepted: "最终审定稿",
    wlArchivingVersionPublished: "出版版本",
    wlArchivingVersionUnstated: "未注明版本",
    wlArchivingEmbargo: "禁锢期：{duration}，至 {date}。",
    wlArchivingEmbargoDuration: "禁锢期：出版后 {duration}。",
    wlArchivingNoEmbargo: "无禁锢期。",
    wlArchivingLicence: "存缴副本的许可协议：{licence}。",
    wlArchivingStatement: "出版方要求附上的声明：",
    wlArchivingDates: "OA.Works 记录更新于 {updated}；获取于 {retrieved}。",
    wlArchivingRetrieved: "于 {retrieved} 获取自 OA.Works；该记录未注明更新日期。",
    wlArchivingPolicyLink: "出版方政策（存档副本）",
    wlArchivingDisclaimer:
      "出版方政策会变化，OA.Works 的记录可能已有数年之久——请查看其日期。法定权利取决于 SigmaCV 无法核实的条件：该研究或您所在机构是否获得公共资助、期刊的出版频率、合著者是否同意、所属学科。您签署的出版协议允许的范围可能比期刊的一般政策更宽或更窄。以上仅供参考，并非法律意见；存缴前请咨询您所在机构的图书馆。",
    wlStatutoryAuthorRight: "也可能适用——二次出版权（{country}），{instrument}：{statements}。",
    wlStatutoryDepositRequirement:
      "也可能适用——法律规定的知识库存缴要求（{country}），{instrument}：{statements}。",
    wlStatutoryFundingPolicy:
      "也可能适用——国家开放获取政策（{country}），{instrument}：{statements}。",
    wlStatutoryRecorded: "记录日期 {date}。",
    wlStatutoryPending: "已起草，尚未与法律文本核对。",
    wlStatutorySourceLink: "法律文本",
    wlStatutoryPolicyLink: "政策文本",
    wlStatutoryGuidanceLink: "指南",
    wlDepositAccepted: "将最终审定稿存缴至 {destination}",
    wlDepositPublished: "将出版版本存缴至 {destination}",
    wlDepositSubmitted: "将投稿稿存缴至 {destination}",
    wlDepositUnrecorded: "若期刊政策允许，将您的最终审定稿（而非出版方 PDF）存缴至 {destination}",
    wlDepositIfAgreement: "仅在您的出版协议允许时存缴至 {destination}",
    wlDepositIfRightOrAgreement: "仅在上方所示权利或您的出版协议允许时存缴至 {destination}",
    wlDepositLine: "{action}——{reason}",
    wlDepositBecauseFunder: "因为本文列出了资助方 {funder}（可能已有合著者提交）",
    wlDepositBecauseOwn: "因为 OpenAlex 显示您的部分作品在 {repository} 中",
    wlDepositBecausePaperCountry: "因为您在本文上的署名单位位于{country}",
    wlDepositBecauseCurrentCountry: "因为您目前的单位位于{country}",
    wlDepositBecauseNoRepositoryPaper:
      "因为 SigmaCV 暂未收录您在本文上署名单位所在国（{country}）的国家知识库",
    wlDepositBecauseNoRepositoryCurrent:
      "因为 SigmaCV 暂未收录您目前单位所在国（{country}）的国家知识库",
    wlDepositBecauseNoAffiliation: "因为本文未记录您的单位所在国家",
    wlDepositZenodoAny: "面向所有研究人员开放",
    wlDepositShareYourPaper: "核查出版方许可和您上传的文件，然后存缴至 Zenodo",
    wlDepositFormLicence: "在表单中将许可协议设为 {licence}。",
    wlDepositFormEmbargoDate: "将文件设为禁锢期，直至 {date}。",
    wlDepositFormEmbargoDuration: "将文件设为出版后禁锢 {duration}。",
    wlDepositZenodoDoi:
      "在 Zenodo 中，对“Do you already have a DOI for this upload?”选择“No”，并在“Related works”中添加此 DOI。",
    wlDepositHalDoi:
      "在 HAL 的表单中，将此 DOI 粘贴到通过标识符加载元数据的输入框，并获取元数据：HAL 会据此填写表单。",
    wlDepositOtherPlaces: "其他存缴去处",
    wlDepositCopyDoi: "复制 DOI",
    wlDepositDoiCopied: "已复制 DOI",
    wlRowDetails: "政策记录、权利与表单说明",
    wlOpensNewTab: "在新标签页中打开",
    wlWhyPublisher: "出版社政策允许：{version}，据 OA.Works 于 {date} 的记录。",
    wlWhyEmbargoEnded: "禁运期已于 {date} 结束。",
    wlWhyNoEmbargo: "无禁运期。",
    wlWhyStatute:
      "法律允许 — {instrument}（{country}）：接受稿，出版 {duration} 后（自 {date} 起），须符合下方记录中的条件。",
    wlWhyStatuteNoDelay:
      "法律允许 — {instrument}（{country}）：出版社接受后即可存入接受稿，须符合下方记录中的条件。",
    wlChipDeposit: "存入 {destination}",
    wlChipDepositIf: "如获许可，存入 {destination}",
    wlChipHint: "在“开放获取”标签页中打开此作品",
    wlDepositBasisLabel: "推荐依据",
    wlDepositBasisPaper: "各篇论文上的署名单位",
    wlDepositBasisCurrent: "您目前的单位（{country}）",
    wlDepositHelp:
      "每个链接都会在新标签页中打开相应知识库（若 SigmaCV 已知其存缴表单，则直接打开）。复制 DOI 以填写论文信息。上传哪个文件由您决定；期刊政策会说明允许哪些版本。",
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
    wlListingHeading: "机构列入",
    wlListingHelp:
      "这只是状态说明，不是待办事项：列入完全自愿，未列入不代表任何含义。可随时在“发布”菜单中撤回，立即生效。",
    wlListingUnlisted: "你尚未列入 {institution}。",
    wlListingPageOnly: "已显示在 {institution} 的页面上；尚未加入其资料库集合。",
    wlListingSetOnly: "已加入 {institution} 的资料库集合；尚未显示在其页面上。",
    wlListingListMe: "将我列入 {institution}",
    wlListingListMeNone: "将我列入我勾选的机构",
    wlListingListed: "已列入 {institution}。",
    wlIndexingHeading: "搜索引擎收录",
    wlIndexingHelp: "搜索引擎是否可以收录您的公开页面。在您选择之前保持关闭；沉默不作为决定。",
    wlIndexingUndecided: "尚未决定——您的页面未被收录。",
    wlIndexingOff: "关闭——您选择了暂不；您的页面未被收录。",
    wlIndexingOn: "开启——搜索引擎可以收录您的页面。",
    wlListingChange: "更改",
    wlListingNeedsPage: "列入需要已发布且开启搜索索引的页面——两者都在“发布”菜单中。",
    hpInfoTitle: "仅供您本人查看",
    hpPages: "叙述部分：按资助机构模板约 {pages} / {limit} 页。",
    hpPagesOver: "叙述部分：约 {pages} 页，超出资助机构 {limit} 页的限制。",
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
    wlTitle: "Lo que puedes hacer",
    wlIntro:
      "Solo para ti: una ayuda para tu registro, no un veredicto. Nada de esto aparece en tu CV ni en tu página pública.",
    wlPositionsHeading: "Puestos actuales sin registro de institución",
    wlPositionsHelp:
      "No se encontró un registro ROR. Añade la organización a este puesto en ORCID y vuelve a sincronizar.",
    wlClosedHeading: "Artículos que puede depositar ahora",
    wlClosedHelp:
      "SigmaCV no encontró ninguna copia abierta, y la política de la editorial o la ley le permiten depositar una versión hoy.",
    wlStateOpenCc: "Abierto, licencia Creative Commons",
    wlStateOpenOther: "Abierto, otra licencia o licencia desconocida",
    wlStateClosed: "No se encontró copia abierta",
    wlStateUnknown: "Desconocido",
    wlPolicyLink: "Consultar la política de la revista (Open Policy Finder)",
    wlFunders: "Financiadores nombrados en el trabajo: {names}",
    wlArchivingAllowed:
      "Política de la editorial según OA.Works: autoarchivo permitido ({versions}).",
    wlArchivingWhere: "Dónde: {locations}.",
    wlArchivingNotAllowed:
      "Política de la editorial según OA.Works: no consta ningún permiso de autoarchivo para este artículo.",
    wlArchivingVersionSubmitted: "manuscrito enviado",
    wlArchivingVersionAccepted: "manuscrito aceptado",
    wlArchivingVersionPublished: "versión publicada",
    wlArchivingVersionUnstated: "versión no indicada",
    wlArchivingEmbargo: "Embargo: {duration}, hasta el {date}.",
    wlArchivingEmbargoDuration: "Embargo: {duration} tras la publicación.",
    wlArchivingNoEmbargo: "No hay embargo.",
    wlArchivingLicence: "Licencia de la copia depositada: {licence}.",
    wlArchivingStatement: "Texto que la editorial pide incluir:",
    wlArchivingDates: "Registro de OA.Works actualizado el {updated}; consultado el {retrieved}.",
    wlArchivingRetrieved:
      "Consultado en OA.Works el {retrieved}; el registro no indica fecha de actualización.",
    wlArchivingPolicyLink: "copia archivada de la política de la editorial",
    wlArchivingDisclaimer:
      "Las políticas editoriales cambian y un registro de OA.Works puede tener varios años: comprueba su fecha. Un derecho previsto por la ley depende de condiciones que SigmaCV no puede comprobar: si el trabajo o tu institución recibieron financiación pública, la periodicidad de la revista, el consentimiento de tus coautores, la disciplina. El contrato de publicación que firmaste puede permitir más o menos que la política general de la revista. Esto es información, no asesoramiento jurídico; consulta a tu biblioteca antes de depositar.",
    wlStatutoryAuthorRight:
      "Podría aplicarse también el derecho de publicación secundaria ({country}), {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "Podría aplicarse también el requisito legal de depósito en repositorio ({country}), {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "Podría aplicarse también la política nacional de acceso abierto ({country}), {instrument}: {statements}.",
    wlStatutoryRecorded: "Registrado el {date}.",
    wlStatutoryPending: "Redactado y aún sin contrastar con el texto legal.",
    wlStatutorySourceLink: "texto legal",
    wlStatutoryPolicyLink: "texto de la política",
    wlStatutoryGuidanceLink: "guía",
    wlDepositAccepted: "Deposita el manuscrito aceptado en {destination}",
    wlDepositPublished: "Deposita la versión publicada en {destination}",
    wlDepositSubmitted: "Deposita el manuscrito enviado en {destination}",
    wlDepositUnrecorded:
      "Deposita en {destination} tu manuscrito aceptado (no el PDF de la editorial) si la política de la revista lo permite",
    wlDepositIfAgreement: "Deposita en {destination} solo si tu contrato de publicación lo permite",
    wlDepositIfRightOrAgreement:
      "Deposita en {destination} solo si un derecho indicado arriba o tu contrato de publicación lo permite",
    wlDepositLine: "{action}, {reason}",
    wlDepositBecauseFunder:
      "porque este trabajo menciona a {funder} (puede que un coautor ya lo haya enviado)",
    wlDepositBecauseOwn: "porque OpenAlex registra algunos de tus trabajos en {repository}",
    wlDepositBecausePaperCountry: "porque tu afiliación en este artículo está en {country}",
    wlDepositBecauseCurrentCountry: "porque tu afiliación actual está en {country}",
    wlDepositBecauseNoRepositoryPaper:
      "porque SigmaCV no conoce ningún repositorio nacional para tu afiliación en este artículo ({country})",
    wlDepositBecauseNoRepositoryCurrent:
      "porque SigmaCV no conoce ningún repositorio nacional para tu afiliación actual ({country})",
    wlDepositBecauseNoAffiliation:
      "porque no consta ningún país de afiliación tuyo en este artículo",
    wlDepositZenodoAny: "abierto a cualquier investigador",
    wlDepositShareYourPaper:
      "que comprueba el permiso de la editorial y el archivo que subes, y luego lo deposita en Zenodo",
    wlDepositFormLicence: "En el formulario, elige la licencia {licence}.",
    wlDepositFormEmbargoDate: "Mantén el archivo bajo embargo hasta el {date}.",
    wlDepositFormEmbargoDuration:
      "Mantén el archivo bajo embargo durante {duration} tras la publicación.",
    wlDepositZenodoDoi:
      "En Zenodo, responde «No» a «Do you already have a DOI for this upload?» y añade este DOI en «Related works».",
    wlDepositHalDoi:
      "En el formulario de HAL, pega este DOI en la casilla que carga los metadatos a partir de un identificador y recupera los metadatos: HAL rellena el formulario con ellos.",
    wlDepositOtherPlaces: "Otros lugares",
    wlDepositCopyDoi: "Copiar DOI",
    wlDepositDoiCopied: "DOI copiado",
    wlRowDetails: "Registro de la política, derechos y notas para el formulario",
    wlOpensNewTab: "Se abre en una pestaña nueva",
    wlWhyPublisher:
      "Permitido por la política de la editorial: {version}, según el registro de OA.Works del {date}.",
    wlWhyEmbargoEnded: "El embargo terminó el {date}.",
    wlWhyNoEmbargo: "Sin embargo.",
    wlWhyStatute:
      "Permitido por la ley — {instrument} ({country}): el manuscrito aceptado, {duration} después de la publicación (desde el {date}), en las condiciones del registro de abajo.",
    wlWhyStatuteNoDelay:
      "Permitido por la ley — {instrument} ({country}): el manuscrito aceptado en cuanto la editorial lo acepta, en las condiciones del registro de abajo.",
    wlChipDeposit: "Depositar en {destination}",
    wlChipDepositIf: "Depositar en {destination} si está permitido",
    wlChipHint: "Abre este trabajo en la pestaña Acceso abierto",
    wlDepositBasisLabel: "Sugerir lugares según",
    wlDepositBasisPaper: "la afiliación de cada artículo",
    wlDepositBasisCurrent: "tu afiliación actual ({country})",
    wlDepositHelp:
      "Cada enlace abre el repositorio en una pestaña nueva (su formulario de depósito cuando SigmaCV lo conoce). Copia el DOI para rellenar los datos del artículo. Qué archivo subir lo decides tú; la política de la revista indica qué versiones permite.",
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
    wlListingHeading: "Inclusión en la institución",
    wlListingHelp:
      "Una línea de estado, no una tarea: figurar es voluntario y no figurar no significa nada. Retíralo cuando quieras desde el menú Publicar, con efecto inmediato.",
    wlListingUnlisted: "Todavía no figuras bajo {institution}.",
    wlListingPageOnly:
      "Figuras en la página de {institution}; no en su conjunto para repositorios.",
    wlListingSetOnly: "Figuras en el conjunto para repositorios de {institution}; no en su página.",
    wlListingListMe: "Listarme bajo {institution}",
    wlListingListMeNone: "Listarme bajo las instituciones que marque",
    wlListingListed: "Figuras bajo {institution}.",
    wlIndexingHeading: "Indexación en buscadores",
    wlIndexingHelp:
      "Si los motores de búsqueda pueden listar tu página pública. Desactivada hasta que elijas; nada se decide por silencio.",
    wlIndexingUndecided: "Sin decidir todavía: tu página no está indexada.",
    wlIndexingOff: "Desactivada: elegiste «ahora no»; tu página no está indexada.",
    wlIndexingOn: "Activada: los motores de búsqueda pueden indexar tu página.",
    wlListingChange: "Cambiar",
    wlListingNeedsPage:
      "Para figurar hace falta una página publicada con la indexación activada; ambas cosas están en el menú Publicar.",
    hpInfoTitle: "Solo para ti",
    hpPages: "Secciones narrativas: ≈ {pages} de {limit} páginas en la plantilla del financiador.",
    hpPagesOver:
      "Secciones narrativas: ≈ {pages} páginas, por encima del límite de {limit} del financiador.",
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
    wlTitle: "Ce que vous pouvez faire",
    wlIntro:
      "Pour vous seulement — une aide pour votre dossier, pas un verdict. Rien de ceci n’apparaît sur votre CV ni sur votre page publique.",
    wlPositionsHeading: "Postes actuels sans fiche d’institution",
    wlPositionsHelp:
      "Aucune fiche ROR n’a été trouvée. Ajoutez l’organisation à ce poste sur ORCID, puis synchronisez de nouveau.",
    wlClosedHeading: "Articles que vous pouvez déposer maintenant",
    wlClosedHelp:
      "SigmaCV n’a trouvé aucune copie ouverte, et la politique de l’éditeur ou la loi vous permettent d’en déposer une version aujourd’hui.",
    wlStateOpenCc: "Ouvert, licence Creative Commons",
    wlStateOpenOther: "Ouvert, autre licence ou licence inconnue",
    wlStateClosed: "Aucune copie ouverte trouvée",
    wlStateUnknown: "Inconnu",
    wlPolicyLink: "Consulter la politique de la revue (Open Policy Finder)",
    wlFunders: "Financeurs nommés sur le travail : {names}",
    wlArchivingAllowed:
      "Politique de l'éditeur selon OA.Works : auto-archivage autorisé — {versions}.",
    wlArchivingWhere: "Où : {locations}.",
    wlArchivingNotAllowed:
      "Politique de l'éditeur selon OA.Works : aucune autorisation d'auto-archivage enregistrée pour cet article.",
    wlArchivingVersionSubmitted: "manuscrit soumis",
    wlArchivingVersionAccepted: "manuscrit accepté",
    wlArchivingVersionPublished: "version éditeur",
    wlArchivingVersionUnstated: "version non précisée",
    wlArchivingEmbargo: "Embargo : {duration}, jusqu'au {date}.",
    wlArchivingEmbargoDuration: "Embargo : {duration} après publication.",
    wlArchivingNoEmbargo: "Pas d'embargo.",
    wlArchivingLicence: "Licence de la copie déposée : {licence}.",
    wlArchivingStatement: "Mention que l'éditeur demande d'inclure :",
    wlArchivingDates: "Fiche OA.Works mise à jour le {updated} ; consultée le {retrieved}.",
    wlArchivingRetrieved:
      "Consultée sur OA.Works le {retrieved} ; la fiche n'indique pas de date de mise à jour.",
    wlArchivingPolicyLink: "copie archivée de la politique de l'éditeur",
    wlArchivingDisclaimer:
      "Les politiques des éditeurs évoluent et une fiche OA.Works peut dater de plusieurs années : vérifiez sa date. Un droit prévu par la loi dépend de conditions que SigmaCV ne peut pas vérifier : le financement public du travail ou de votre établissement, la périodicité de la revue, l'accord de vos coauteurs, la discipline. Le contrat d'édition que vous avez signé peut prévoir plus ou moins que la politique générale de la revue. Ces éléments sont donnés à titre d'information et ne constituent pas un conseil juridique ; renseignez-vous auprès de votre bibliothèque avant tout dépôt.",
    wlStatutoryAuthorRight:
      "Peut aussi s'appliquer — droit d'exploitation secondaire ({country}), {instrument} : {statements}.",
    wlStatutoryDepositRequirement:
      "Peut aussi s'appliquer — obligation légale de dépôt en archive ouverte ({country}), {instrument} : {statements}.",
    wlStatutoryFundingPolicy:
      "Peut aussi s'appliquer — politique nationale d'accès ouvert ({country}), {instrument} : {statements}.",
    wlStatutoryRecorded: "Enregistré le {date}.",
    wlStatutoryPending: "Rédigé, pas encore vérifié au regard du texte de loi.",
    wlStatutorySourceLink: "texte de loi",
    wlStatutoryPolicyLink: "texte de la politique",
    wlStatutoryGuidanceLink: "guide",
    wlDepositAccepted: "Déposer le manuscrit accepté dans {destination}",
    wlDepositPublished: "Déposer la version éditeur dans {destination}",
    wlDepositSubmitted: "Déposer le manuscrit soumis dans {destination}",
    wlDepositUnrecorded:
      "Déposer votre manuscrit accepté, et non le PDF de l'éditeur, dans {destination} si la politique de la revue le permet",
    wlDepositIfAgreement:
      "Déposer dans {destination} seulement si votre contrat d'édition le permet",
    wlDepositIfRightOrAgreement:
      "Déposer dans {destination} seulement si un droit indiqué ci-dessus ou votre contrat d'édition le permet",
    wlDepositLine: "{action} — {reason}",
    wlDepositBecauseFunder:
      "car ce travail mentionne {funder} (un coauteur l'a peut-être déjà déposé)",
    wlDepositBecauseOwn: "car OpenAlex signale certains de vos travaux dans {repository}",
    wlDepositBecausePaperCountry:
      "en raison de votre affiliation indiquée dans cet article ({country})",
    wlDepositBecauseCurrentCountry: "en raison de votre affiliation actuelle ({country})",
    wlDepositBecauseNoRepositoryPaper:
      "car SigmaCV ne connaît aucune archive ouverte nationale pour votre affiliation indiquée dans cet article ({country})",
    wlDepositBecauseNoRepositoryCurrent:
      "car SigmaCV ne connaît aucune archive ouverte nationale pour votre affiliation actuelle ({country})",
    wlDepositBecauseNoAffiliation:
      "car aucun pays d'affiliation n'est enregistré pour vous sur cet article",
    wlDepositZenodoAny: "ouvert à tout chercheur",
    wlDepositShareYourPaper:
      "vérifie l'autorisation de l'éditeur et le fichier que vous envoyez, puis le dépose dans Zenodo",
    wlDepositFormLicence: "Dans le formulaire, choisissez la licence {licence}.",
    wlDepositFormEmbargoDate: "Gardez le fichier sous embargo jusqu'au {date}.",
    wlDepositFormEmbargoDuration:
      "Gardez le fichier sous embargo pendant {duration} après la publication.",
    wlDepositZenodoDoi:
      "Dans Zenodo, répondez « No » à « Do you already have a DOI for this upload? » et ajoutez ce DOI dans « Related works ».",
    wlDepositHalDoi:
      "Dans le formulaire de HAL, collez ce DOI sous « Chargez les métadonnées à partir d'un identifiant » puis cliquez sur « Récupérer les métadonnées » : HAL remplit le formulaire à partir de ces informations.",
    wlDepositOtherPlaces: "Autres lieux de dépôt",
    wlDepositCopyDoi: "Copier le DOI",
    wlDepositDoiCopied: "DOI copié",
    wlRowDetails: "Politique enregistrée, droits et notes pour le formulaire",
    wlOpensNewTab: "S’ouvre dans un nouvel onglet",
    wlWhyPublisher:
      "Autorisé par la politique de l’éditeur : {version}, selon la fiche OA.Works du {date}.",
    wlWhyEmbargoEnded: "L’embargo a pris fin le {date}.",
    wlWhyNoEmbargo: "Sans embargo.",
    wlWhyStatute:
      "Autorisé par la loi — {instrument} ({country}) : le manuscrit accepté, {duration} après la publication (depuis le {date}), aux conditions de la fiche ci-dessous.",
    wlWhyStatuteNoDelay:
      "Autorisé par la loi — {instrument} ({country}) : le manuscrit accepté dès son acceptation par l’éditeur, aux conditions de la fiche ci-dessous.",
    wlChipDeposit: "Déposer dans {destination}",
    wlChipDepositIf: "Déposer dans {destination} si c’est permis",
    wlChipHint: "Ouvre ce travail dans l’onglet Accès ouvert",
    wlDepositBasisLabel: "Proposer des lieux selon",
    wlDepositBasisPaper: "l'affiliation de chaque article",
    wlDepositBasisCurrent: "votre affiliation actuelle ({country})",
    wlDepositHelp:
      "Chaque lien ouvre l'archive dans un nouvel onglet (son formulaire de dépôt quand SigmaCV le connaît). Copiez le DOI pour renseigner les informations de l'article. Le choix du fichier vous revient ; la politique de la revue indique quelles versions elle autorise.",
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
    wlListingHeading: "Inscription auprès de l'établissement",
    wlListingHelp:
      "Une ligne d'état, pas une tâche : figurer est volontaire et ne pas figurer ne signifie rien. Retirez-vous à tout moment depuis le menu Publier, avec effet immédiat.",
    wlListingUnlisted: "Vous ne figurez pas encore sous {institution}.",
    wlListingPageOnly:
      "Vous figurez sur la page de {institution} ; pas dans son ensemble pour les dépôts.",
    wlListingSetOnly:
      "Vous figurez dans l'ensemble pour les dépôts de {institution} ; pas sur sa page.",
    wlListingListMe: "Me lister sous {institution}",
    wlListingListMeNone: "Me lister sous les établissements cochés",
    wlListingListed: "Vous figurez sous {institution}.",
    wlIndexingHeading: "Indexation par les moteurs de recherche",
    wlIndexingHelp:
      "Si les moteurs de recherche peuvent référencer votre page publique. Désactivée tant que vous n'avez pas choisi ; rien n'est décidé par le silence.",
    wlIndexingUndecided: "Pas encore décidé — votre page n'est pas indexée.",
    wlIndexingOff:
      "Désactivée — vous avez choisi « pas maintenant » ; votre page n'est pas indexée.",
    wlIndexingOn: "Activée — les moteurs de recherche peuvent indexer votre page.",
    wlListingChange: "Modifier",
    wlListingNeedsPage:
      "Figurer suppose une page publiée avec l'indexation activée — les deux se trouvent dans le menu Publier.",
    hpInfoTitle: "Pour vous seulement",
    hpPages: "Sections narratives : ≈ {pages} pages sur {limit} dans le modèle du financeur.",
    hpPagesOver:
      "Sections narratives : ≈ {pages} pages, au-delà de la limite de {limit} du financeur.",
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
    wlTitle: "Was Sie tun können",
    wlIntro:
      "Nur für Sie — eine Hilfe für Ihren Datensatz, kein Urteil. Nichts davon erscheint in Ihrem Lebenslauf oder auf Ihrer öffentlichen Seite.",
    wlPositionsHeading: "Aktuelle Positionen ohne Institutionsdatensatz",
    wlPositionsHelp:
      "Es wurde kein ROR-Datensatz zugeordnet. Ergänzen Sie die Organisation bei dieser Position auf ORCID und synchronisieren Sie erneut.",
    wlClosedHeading: "Artikel, die Sie jetzt hinterlegen können",
    wlClosedHelp:
      "SigmaCV hat keine offene Kopie gefunden, und die Verlagsrichtlinie oder das Gesetz erlauben Ihnen, heute eine Fassung zu hinterlegen.",
    wlStateOpenCc: "Offen, Creative-Commons-Lizenz",
    wlStateOpenOther: "Offen, andere oder unbekannte Lizenz",
    wlStateClosed: "Keine offene Kopie gefunden",
    wlStateUnknown: "Unbekannt",
    wlPolicyLink: "Richtlinie der Zeitschrift prüfen (Open Policy Finder)",
    wlFunders: "Auf der Arbeit genannte Förderer: {names}",
    wlArchivingAllowed: "Verlagsrichtlinie laut OA.Works: Selbstarchivierung erlaubt – {versions}.",
    wlArchivingWhere: "Wo: {locations}.",
    wlArchivingNotAllowed:
      "Verlagsrichtlinie laut OA.Works: Für diesen Artikel ist keine Erlaubnis zur Selbstarchivierung verzeichnet.",
    wlArchivingVersionSubmitted: "eingereichte Manuskriptversion",
    wlArchivingVersionAccepted: "akzeptierte Manuskriptversion",
    wlArchivingVersionPublished: "Verlagsversion",
    wlArchivingVersionUnstated: "Version nicht angegeben",
    wlArchivingEmbargo: "Embargo: {duration}, bis {date}.",
    wlArchivingEmbargoDuration: "Embargo: {duration} nach Veröffentlichung.",
    wlArchivingNoEmbargo: "Kein Embargo.",
    wlArchivingLicence: "Lizenz der archivierten Fassung: {licence}.",
    wlArchivingStatement: "Vom Verlag gewünschter Vermerk:",
    wlArchivingDates: "OA.Works-Eintrag aktualisiert am {updated}; abgerufen am {retrieved}.",
    wlArchivingRetrieved:
      "Am {retrieved} von OA.Works abgerufen; der Eintrag nennt kein Aktualisierungsdatum.",
    wlArchivingPolicyLink: "archivierte Kopie der Verlagsrichtlinie",
    wlArchivingDisclaimer:
      "Verlagsrichtlinien ändern sich, und ein OA.Works-Eintrag kann mehrere Jahre alt sein – prüfen Sie dessen Datum. Ein gesetzliches Recht hängt von Bedingungen ab, die SigmaCV nicht prüfen kann: ob die Arbeit oder Ihre Einrichtung öffentlich gefördert wurde, wie oft die Zeitschrift erscheint, die Zustimmung Ihrer Mitautorinnen und Mitautoren, das Fachgebiet. Ihr Verlagsvertrag kann mehr oder weniger erlauben als die allgemeine Richtlinie der Zeitschrift. Dies dient der Information und ist keine Rechtsberatung; wenden Sie sich vor der Ablage an Ihre Bibliothek.",
    wlStatutoryAuthorRight:
      "Möglicherweise ebenfalls anwendbar – Zweitveröffentlichungsrecht ({country}), {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "Möglicherweise ebenfalls anwendbar – gesetzliche Vorgabe zur Ablage in einem Repositorium ({country}), {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "Möglicherweise ebenfalls anwendbar – nationale Open-Access-Richtlinie ({country}), {instrument}: {statements}.",
    wlStatutoryRecorded: "Stand: {date}.",
    wlStatutoryPending: "Entwurf, noch nicht mit dem Gesetzestext abgeglichen.",
    wlStatutorySourceLink: "Gesetzestext",
    wlStatutoryPolicyLink: "Richtlinientext",
    wlStatutoryGuidanceLink: "Erläuterungen",
    wlDepositAccepted: "Akzeptierte Manuskriptversion in {destination} ablegen",
    wlDepositPublished: "Verlagsversion in {destination} ablegen",
    wlDepositSubmitted: "Eingereichte Manuskriptversion in {destination} ablegen",
    wlDepositUnrecorded:
      "Ihr akzeptiertes Manuskript, nicht das Verlags-PDF, in {destination} ablegen, sofern die Richtlinie der Zeitschrift es erlaubt",
    wlDepositIfAgreement: "In {destination} nur ablegen, wenn Ihr Verlagsvertrag es erlaubt",
    wlDepositIfRightOrAgreement:
      "In {destination} nur ablegen, wenn ein oben genanntes Recht oder Ihr Verlagsvertrag es erlaubt",
    wlDepositLine: "{action} – {reason}",
    wlDepositBecauseFunder:
      "weil diese Arbeit {funder} nennt (vielleicht hat eine Mitautorin oder ein Mitautor sie bereits eingereicht)",
    wlDepositBecauseOwn: "weil OpenAlex einige Ihrer Arbeiten in {repository} führt",
    wlDepositBecausePaperCountry:
      "wegen Ihrer in diesem Artikel angegebenen Affiliation ({country})",
    wlDepositBecauseCurrentCountry: "wegen Ihrer aktuellen Affiliation ({country})",
    wlDepositBecauseNoRepositoryPaper:
      "weil SigmaCV kein nationales Repositorium für Ihre in diesem Artikel angegebene Affiliation ({country}) kennt",
    wlDepositBecauseNoRepositoryCurrent:
      "weil SigmaCV kein nationales Repositorium für Ihre aktuelle Affiliation ({country}) kennt",
    wlDepositBecauseNoAffiliation:
      "weil auf diesem Artikel kein Land Ihrer Affiliation verzeichnet ist",
    wlDepositZenodoAny: "offen für alle Forschenden",
    wlDepositShareYourPaper:
      "prüft die Erlaubnis des Verlags und die hochgeladene Datei und legt den Artikel dann in Zenodo ab",
    wlDepositFormLicence: "Wählen Sie im Formular die Lizenz {licence}.",
    wlDepositFormEmbargoDate: "Setzen Sie für die Datei ein Embargo bis {date}.",
    wlDepositFormEmbargoDuration:
      "Setzen Sie das Embargo für die Datei auf {duration} nach der Veröffentlichung.",
    wlDepositZenodoDoi:
      "Antworten Sie in Zenodo auf „Do you already have a DOI for this upload?“ mit „No“ und fügen Sie diese DOI unter „Related works“ hinzu.",
    wlDepositHalDoi:
      "Fügen Sie diese DOI im HAL-Formular in das Feld ein, das Metadaten aus einer Kennung lädt, und rufen Sie die Metadaten ab: HAL füllt das Formular damit aus.",
    wlDepositOtherPlaces: "Weitere Ablageorte",
    wlDepositCopyDoi: "DOI kopieren",
    wlDepositDoiCopied: "DOI kopiert",
    wlRowDetails: "Aufgezeichnete Policy, Rechte und Hinweise zum Formular",
    wlOpensNewTab: "Öffnet sich in einem neuen Tab",
    wlWhyPublisher:
      "Erlaubt durch die Verlagsrichtlinie: {version}, laut OA.Works-Eintrag vom {date}.",
    wlWhyEmbargoEnded: "Das Embargo endete am {date}.",
    wlWhyNoEmbargo: "Kein Embargo.",
    wlWhyStatute:
      "Erlaubt durch Gesetz — {instrument} ({country}): das akzeptierte Manuskript, {duration} nach der Veröffentlichung (seit {date}), unter den Bedingungen im Eintrag unten.",
    wlWhyStatuteNoDelay:
      "Erlaubt durch Gesetz — {instrument} ({country}): das akzeptierte Manuskript, sobald der Verlag es angenommen hat, unter den Bedingungen im Eintrag unten.",
    wlChipDeposit: "In {destination} hinterlegen",
    wlChipDepositIf: "In {destination} hinterlegen, falls erlaubt",
    wlChipHint: "Öffnet diese Arbeit im Tab „Open Access“",
    wlDepositBasisLabel: "Ablageorte vorschlagen nach",
    wlDepositBasisPaper: "der Affiliation auf dem jeweiligen Artikel",
    wlDepositBasisCurrent: "Ihrer aktuellen Affiliation ({country})",
    wlDepositHelp:
      "Jeder Link öffnet das Repositorium in einem neuen Tab (sein Ablageformular, wo SigmaCV es kennt). Kopieren Sie die DOI, um dort die Angaben zum Artikel einzutragen. Welche Datei Sie hochladen, entscheiden Sie; die Richtlinie der Zeitschrift sagt, welche Versionen sie erlaubt.",
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
    wlListingHeading: "Auflistung bei der Einrichtung",
    wlListingHelp:
      "Eine Statuszeile, keine Aufgabe: Die Auflistung ist freiwillig, und ihr Fehlen bedeutet nichts. Jederzeit im Menü Veröffentlichen zurücknehmbar, mit sofortiger Wirkung.",
    wlListingUnlisted: "Sie sind noch nicht unter {institution} aufgeführt.",
    wlListingPageOnly:
      "Auf der Seite von {institution} aufgeführt; nicht in deren Set für Repositorien.",
    wlListingSetOnly: "Im Set für Repositorien von {institution}; nicht auf deren Seite.",
    wlListingListMe: "Mich unter {institution} aufführen",
    wlListingListMeNone: "Mich unter den angekreuzten Einrichtungen aufführen",
    wlListingListed: "Aufgeführt unter {institution}.",
    wlIndexingHeading: "Suchmaschinen-Indexierung",
    wlIndexingHelp:
      "Ob Suchmaschinen Ihre öffentliche Seite listen dürfen. Aus, bis Sie sich entscheiden; Schweigen entscheidet nichts.",
    wlIndexingUndecided: "Noch nicht entschieden – Ihre Seite ist nicht indexiert.",
    wlIndexingOff: "Aus – Sie haben „jetzt nicht“ gewählt; Ihre Seite ist nicht indexiert.",
    wlIndexingOn: "An – Suchmaschinen dürfen Ihre Seite indexieren.",
    wlListingChange: "Ändern",
    wlListingNeedsPage:
      "Die Auflistung setzt eine veröffentlichte Seite mit eingeschalteter Suchindexierung voraus – beides im Menü Veröffentlichen.",
    hpInfoTitle: "Nur für Sie",
    hpPages: "Narrative Abschnitte: ≈ {pages} von {limit} Seiten in der Vorlage des Förderers.",
    hpPagesOver:
      "Narrative Abschnitte: ≈ {pages} Seiten, über der Grenze des Förderers von {limit}.",
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
    wlTitle: "対応できる項目",
    wlIntro:
      "あなただけに表示 — 記録を整えるための手助けであり、評価ではありません。ここの内容は CV にも公開ページにも表示されません。",
    wlPositionsHeading: "機関レコードのない現在の職位",
    wlPositionsHelp:
      "ROR レコードが見つかりませんでした。ORCID でこの職位に組織を追加し、もう一度同期してください。",
    wlClosedHeading: "今すぐ登録できる論文",
    wlClosedHelp:
      "SigmaCV はオープンな版を見つけられませんでしたが、出版社のポリシーまたは法律により、今日いずれかの版を登録できます。",
    wlStateOpenCc: "オープン、クリエイティブ・コモンズ・ライセンス",
    wlStateOpenOther: "オープン、その他または不明のライセンス",
    wlStateClosed: "オープンな複製は見つかりませんでした",
    wlStateUnknown: "不明",
    wlPolicyLink: "学術誌のポリシーを確認（Open Policy Finder）",
    wlFunders: "業績に記載された助成機関：{names}",
    wlArchivingAllowed: "OA.Works が記録する出版社ポリシー：セルフアーカイブ可（{versions}）。",
    wlArchivingWhere: "登録先：{locations}。",
    wlArchivingNotAllowed:
      "OA.Works が記録する出版社ポリシー：この論文についてセルフアーカイブの許諾は記録されていません。",
    wlArchivingVersionSubmitted: "投稿原稿",
    wlArchivingVersionAccepted: "著者最終稿",
    wlArchivingVersionPublished: "出版社版",
    wlArchivingVersionUnstated: "版の記載なし",
    wlArchivingEmbargo: "エンバーゴ：{duration}（{date} まで）。",
    wlArchivingEmbargoDuration: "エンバーゴ：出版後 {duration}。",
    wlArchivingNoEmbargo: "エンバーゴなし。",
    wlArchivingLicence: "登録する版のライセンス：{licence}。",
    wlArchivingStatement: "出版社が記載を求める文言：",
    wlArchivingDates: "OA.Works の記録更新日 {updated}、取得日 {retrieved}。",
    wlArchivingRetrieved: "{retrieved} に OA.Works から取得。記録に更新日の記載はありません。",
    wlArchivingPolicyLink: "出版社ポリシー（アーカイブ版）",
    wlArchivingDisclaimer:
      "出版社のポリシーは変わることがあり、OA.Works の記録が数年前のものである場合もあります。日付を確認してください。法律上の権利は、SigmaCV では確認できない条件（研究またはご所属機関が公的資金を受けているか、雑誌の刊行頻度、共著者の同意、分野など）に左右されます。署名済みの出版契約の内容は、雑誌の一般的なポリシーより広いことも狭いこともあります。これは情報提供であり、法的助言ではありません。登録の前に所属機関の図書館にご相談ください。",
    wlStatutoryAuthorRight:
      "二次出版権（{country}）も適用される可能性があります。{instrument}：{statements}。",
    wlStatutoryDepositRequirement:
      "リポジトリへの登録を求める法律上の規定（{country}）も適用される可能性があります。{instrument}：{statements}。",
    wlStatutoryFundingPolicy:
      "国のオープンアクセス方針（{country}）も適用される可能性があります。{instrument}：{statements}。",
    wlStatutoryRecorded: "{date} 時点の記録。",
    wlStatutoryPending: "草案段階で、法令本文との照合はまだ済んでいません。",
    wlStatutorySourceLink: "法令本文",
    wlStatutoryPolicyLink: "方針本文",
    wlStatutoryGuidanceLink: "解説",
    wlDepositAccepted: "著者最終稿を {destination} に登録する",
    wlDepositPublished: "出版社版を {destination} に登録する",
    wlDepositSubmitted: "投稿原稿を {destination} に登録する",
    wlDepositUnrecorded:
      "雑誌のポリシーが認める場合に、出版社の PDF ではなく著者最終稿を {destination} に登録する",
    wlDepositIfAgreement: "出版契約が認める場合に限り {destination} に登録する",
    wlDepositIfRightOrAgreement:
      "上記の権利または出版契約が認める場合に限り {destination} に登録する",
    wlDepositLine: "{action}（{reason}）",
    wlDepositBecauseFunder:
      "この論文に {funder} が記載されているため。共著者がすでに登録している場合があります",
    wlDepositBecauseOwn:
      "OpenAlex によると、あなたの論文の一部が {repository} に登録されているため",
    wlDepositBecausePaperCountry: "この論文でのご所属機関が{country}にあるため",
    wlDepositBecauseCurrentCountry: "現在のご所属機関が{country}にあるため",
    wlDepositBecauseNoRepositoryPaper:
      "この論文でのご所属の国が{country}で、SigmaCV がその国のリポジトリを把握していないため",
    wlDepositBecauseNoRepositoryCurrent:
      "現在のご所属の国が{country}で、SigmaCV がその国のリポジトリを把握していないため",
    wlDepositBecauseNoAffiliation: "この論文にあなたの所属国が記録されていないため",
    wlDepositZenodoAny: "どの研究者も利用可能",
    wlDepositShareYourPaper:
      "出版社の許諾とアップロードするファイルを確認し、Zenodo に登録するサービス",
    wlDepositFormLicence: "登録フォームでライセンスを {licence} に設定してください。",
    wlDepositFormEmbargoDate: "ファイルは {date} まで非公開（エンバーゴ）にしてください。",
    wlDepositFormEmbargoDuration:
      "ファイルは出版後 {duration}間、非公開（エンバーゴ）にしてください。",
    wlDepositZenodoDoi:
      "Zenodo では「Do you already have a DOI for this upload?」に「No」と答え、この DOI を「Related works」に追加してください。",
    wlDepositHalDoi:
      "HAL の登録フォームでは、識別子からメタデータを読み込む欄にこの DOI を貼り付けて、メタデータを取得してください。HAL がその情報でフォームを入力します。",
    wlDepositOtherPlaces: "その他の登録先",
    wlDepositCopyDoi: "DOI をコピー",
    wlDepositDoiCopied: "DOI をコピーしました",
    wlRowDetails: "ポリシーの記録、権利、フォームの注記",
    wlOpensNewTab: "新しいタブで開きます",
    wlWhyPublisher: "出版社のポリシーで許可：{version}（OA.Works の {date} の記録による）。",
    wlWhyEmbargoEnded: "エンバーゴは {date} に終了しました。",
    wlWhyNoEmbargo: "エンバーゴなし。",
    wlWhyStatute:
      "法律で許可 — {instrument}（{country}）：受理原稿を出版から {duration} 後（{date} 以降）、下記の記録の条件のもとで。",
    wlWhyStatuteNoDelay:
      "法律で許可 — {instrument}（{country}）：出版社の受理後すぐに受理原稿を、下記の記録の条件のもとで。",
    wlChipDeposit: "{destination} に登録",
    wlChipDepositIf: "許可されていれば {destination} に登録",
    wlChipHint: "この論文を「オープンアクセス」タブで開きます",
    wlDepositBasisLabel: "登録先の提案基準",
    wlDepositBasisPaper: "各論文での所属",
    wlDepositBasisCurrent: "現在の所属（{country}）",
    wlDepositHelp:
      "各リンクは新しいタブでリポジトリを開きます（SigmaCV が把握している場合は登録フォーム）。DOI をコピーして論文情報を入力してください。アップロードするファイルはご自身でお選びください（どの版が認められるかは雑誌のポリシーに記載されています）。",
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
    wlListingHeading: "機関への掲載",
    wlListingHelp:
      "これは状態の表示であり、作業項目ではありません。掲載は任意で、掲載がないことは何も意味しません。「公開」メニューからいつでも取り下げられ、即時に反映されます。",
    wlListingUnlisted: "{institution} の下にはまだ掲載されていません。",
    wlListingPageOnly:
      "{institution} のページには掲載されていますが、そのリポジトリ用セットには入っていません。",
    wlListingSetOnly:
      "{institution} のリポジトリ用セットには入っていますが、そのページには掲載されていません。",
    wlListingListMe: "{institution} の下に掲載する",
    wlListingListMeNone: "チェックした機関の下に掲載する",
    wlListingListed: "{institution} の下に掲載済みです。",
    wlIndexingHeading: "検索エンジンの索引",
    wlIndexingHelp:
      "検索エンジンがあなたの公開ページを掲載できるかどうか。選択するまでオフのままで、沈黙は決定になりません。",
    wlIndexingUndecided: "未決定 — あなたのページは索引されていません。",
    wlIndexingOff: "オフ — 「今はしない」を選びました。あなたのページは索引されていません。",
    wlIndexingOn: "オン — 検索エンジンがあなたのページを索引できます。",
    wlListingChange: "変更",
    wlListingNeedsPage:
      "掲載には、検索インデックスを有効にした公開済みページが必要です。どちらも「公開」メニューにあります。",
    hpInfoTitle: "あなただけに表示",
    hpPages: "ナラティブのセクション：助成機関のテンプレートで約 {pages} / {limit} ページ。",
    hpPagesOver:
      "ナラティブのセクション：約 {pages} ページ、助成機関の上限 {limit} ページを超えています。",
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
    wlTitle: "O que você pode fazer",
    wlIntro:
      "Somente para você: uma ajuda para o seu registro, não um veredito. Nada disto aparece no seu CV nem na sua página pública.",
    wlPositionsHeading: "Cargos atuais sem registro de instituição",
    wlPositionsHelp:
      "Nenhum registro ROR foi encontrado. Adicione a organização a este cargo no ORCID e sincronize novamente.",
    wlClosedHeading: "Artigos que você pode depositar agora",
    wlClosedHelp:
      "O SigmaCV não encontrou nenhuma cópia aberta, e a política da editora ou a lei permitem depositar uma versão hoje.",
    wlStateOpenCc: "Aberto, licença Creative Commons",
    wlStateOpenOther: "Aberto, outra licença ou licença desconhecida",
    wlStateClosed: "Nenhuma cópia aberta encontrada",
    wlStateUnknown: "Desconhecido",
    wlPolicyLink: "Consultar a política da revista (Open Policy Finder)",
    wlFunders: "Financiadores nomeados no trabalho: {names}",
    wlArchivingAllowed:
      "Política da editora segundo o OA.Works: autoarquivamento permitido — {versions}.",
    wlArchivingWhere: "Onde: {locations}.",
    wlArchivingNotAllowed:
      "Política da editora segundo o OA.Works: nenhuma permissão de autoarquivamento registrada para este artigo.",
    wlArchivingVersionSubmitted: "manuscrito submetido",
    wlArchivingVersionAccepted: "manuscrito aceito",
    wlArchivingVersionPublished: "versão publicada",
    wlArchivingVersionUnstated: "versão não indicada",
    wlArchivingEmbargo: "Embargo: {duration}, até {date}.",
    wlArchivingEmbargoDuration: "Embargo: {duration} após a publicação.",
    wlArchivingNoEmbargo: "Sem embargo.",
    wlArchivingLicence: "Licença da cópia depositada: {licence}.",
    wlArchivingStatement: "Texto que a editora pede que seja incluído:",
    wlArchivingDates: "Registro do OA.Works atualizado em {updated}; consultado em {retrieved}.",
    wlArchivingRetrieved:
      "Consultado no OA.Works em {retrieved}; o registro não indica data de atualização.",
    wlArchivingPolicyLink: "cópia arquivada da política da editora",
    wlArchivingDisclaimer:
      "As políticas das editoras mudam, e um registro do OA.Works pode ter vários anos — confira a data. Um direito previsto em lei depende de condições que o SigmaCV não tem como verificar: se o trabalho ou sua instituição recebeu financiamento público, a periodicidade da revista, o consentimento dos seus coautores, a área. O contrato de publicação que você assinou pode permitir mais ou menos do que a política geral da revista. Isto é informação, não orientação jurídica; consulte sua biblioteca antes de depositar.",
    wlStatutoryAuthorRight:
      "Também pode se aplicar — direito de publicação secundária ({country}), {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "Também pode se aplicar — exigência legal de depósito em repositório ({country}), {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "Também pode se aplicar — política nacional de acesso aberto ({country}), {instrument}: {statements}.",
    wlStatutoryRecorded: "Registrado em {date}.",
    wlStatutoryPending: "Redigido e ainda não conferido com o texto legal.",
    wlStatutorySourceLink: "texto legal",
    wlStatutoryPolicyLink: "texto da política",
    wlStatutoryGuidanceLink: "guia",
    wlDepositAccepted: "Deposite o manuscrito aceito em {destination}",
    wlDepositPublished: "Deposite a versão publicada em {destination}",
    wlDepositSubmitted: "Deposite o manuscrito submetido em {destination}",
    wlDepositUnrecorded:
      "Deposite seu manuscrito aceito, não o PDF da editora, em {destination} se a política da revista permitir",
    wlDepositIfAgreement:
      "Deposite em {destination} somente se seu contrato de publicação permitir",
    wlDepositIfRightOrAgreement:
      "Deposite em {destination} somente se um direito indicado acima ou seu contrato de publicação permitir",
    wlDepositLine: "{action} — {reason}",
    wlDepositBecauseFunder: "porque este trabalho cita {funder} (um coautor pode já tê-lo enviado)",
    wlDepositBecauseOwn: "porque o OpenAlex lista alguns dos seus trabalhos em {repository}",
    wlDepositBecausePaperCountry: "por causa da sua afiliação neste artigo ({country})",
    wlDepositBecauseCurrentCountry: "por causa da sua afiliação atual ({country})",
    wlDepositBecauseNoRepositoryPaper:
      "porque o SigmaCV não conhece nenhum repositório nacional para sua afiliação neste artigo ({country})",
    wlDepositBecauseNoRepositoryCurrent:
      "porque o SigmaCV não conhece nenhum repositório nacional para sua afiliação atual ({country})",
    wlDepositBecauseNoAffiliation:
      "porque nenhum país de afiliação está registrado para você neste artigo",
    wlDepositZenodoAny: "aberto a qualquer pesquisador",
    wlDepositShareYourPaper:
      "verifica a permissão da editora e o arquivo que você envia e depois o deposita no Zenodo",
    wlDepositFormLicence: "No formulário, escolha a licença {licence}.",
    wlDepositFormEmbargoDate: "Mantenha o arquivo sob embargo até {date}.",
    wlDepositFormEmbargoDuration:
      "Mantenha o arquivo sob embargo por {duration} após a publicação.",
    wlDepositZenodoDoi:
      "No Zenodo, responda “No” à pergunta “Do you already have a DOI for this upload?” e adicione este DOI em “Related works”.",
    wlDepositHalDoi:
      "No formulário do HAL, cole este DOI no campo que carrega metadados a partir de um identificador e recupere os metadados: o HAL preenche o formulário com eles.",
    wlDepositOtherPlaces: "Outros lugares",
    wlDepositCopyDoi: "Copiar DOI",
    wlDepositDoiCopied: "DOI copiado",
    wlRowDetails: "Registro da política, direitos e notas para o formulário",
    wlOpensNewTab: "Abre em uma nova aba",
    wlWhyPublisher:
      "Permitido pela política da editora: {version}, segundo o registro do OA.Works de {date}.",
    wlWhyEmbargoEnded: "O embargo terminou em {date}.",
    wlWhyNoEmbargo: "Sem embargo.",
    wlWhyStatute:
      "Permitido por lei — {instrument} ({country}): o manuscrito aceito, {duration} após a publicação (desde {date}), nas condições do registro abaixo.",
    wlWhyStatuteNoDelay:
      "Permitido por lei — {instrument} ({country}): o manuscrito aceito assim que a editora o aceita, nas condições do registro abaixo.",
    wlChipDeposit: "Depositar em {destination}",
    wlChipDepositIf: "Depositar em {destination} se permitido",
    wlChipHint: "Abre este trabalho na aba Acesso aberto",
    wlDepositBasisLabel: "Sugerir lugares com base em",
    wlDepositBasisPaper: "a afiliação de cada artigo",
    wlDepositBasisCurrent: "sua afiliação atual ({country})",
    wlDepositHelp:
      "Cada link abre o repositório em uma nova aba (ou direto o formulário de depósito, quando o SigmaCV o conhece). Copie o DOI para preencher os dados do artigo. Qual arquivo enviar é escolha sua; a política da revista indica quais versões permite.",
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
    wlListingHeading: "Listagem na instituição",
    wlListingHelp:
      "Uma linha de status, não uma tarefa: aparecer é voluntário e não aparecer não significa nada. Retire a qualquer momento no menu Publicar, com efeito imediato.",
    wlListingUnlisted: "Você ainda não está listado sob {institution}.",
    wlListingPageOnly:
      "Você aparece na página de {institution}; não no conjunto dela para repositórios.",
    wlListingSetOnly:
      "Você aparece no conjunto de {institution} para repositórios; não na página dela.",
    wlListingListMe: "Listar-me sob {institution}",
    wlListingListMeNone: "Listar-me sob as instituições que eu marcar",
    wlListingListed: "Listado sob {institution}.",
    wlIndexingHeading: "Indexação em buscadores",
    wlIndexingHelp:
      "Se os mecanismos de busca podem listar sua página pública. Desligada até você escolher; nada é decidido por silêncio.",
    wlIndexingUndecided: "Ainda não decidido — sua página não está indexada.",
    wlIndexingOff: "Desligada — você escolheu «agora não»; sua página não está indexada.",
    wlIndexingOn: "Ligada — os mecanismos de busca podem indexar sua página.",
    wlListingChange: "Alterar",
    wlListingNeedsPage:
      "A listagem exige uma página publicada com a indexação de busca ativada — ambas estão no menu Publicar.",
    hpInfoTitle: "Somente para você",
    hpPages: "Seções narrativas: ≈ {pages} de {limit} páginas no modelo do financiador.",
    hpPagesOver: "Seções narrativas: ≈ {pages} páginas, acima do limite de {limit} do financiador.",
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
    wlTitle: "Cosa puoi fare",
    wlIntro:
      "Solo per te: un aiuto per il tuo profilo, non un verdetto. Nulla di questo compare nel tuo CV né nella tua pagina pubblica.",
    wlPositionsHeading: "Posizioni attuali senza scheda dell’istituzione",
    wlPositionsHelp:
      "Nessuna scheda ROR è stata trovata. Aggiungi l’organizzazione a questa posizione su ORCID, poi sincronizza di nuovo.",
    wlClosedHeading: "Articoli che puoi depositare ora",
    wlClosedHelp:
      "SigmaCV non ha trovato alcuna copia aperta, e la politica dell’editore o la legge ti permettono di depositarne una versione oggi.",
    wlStateOpenCc: "Aperto, licenza Creative Commons",
    wlStateOpenOther: "Aperto, altra licenza o licenza sconosciuta",
    wlStateClosed: "Nessuna copia aperta trovata",
    wlStateUnknown: "Sconosciuto",
    wlPolicyLink: "Verifica la politica della rivista (Open Policy Finder)",
    wlFunders: "Finanziatori indicati sul lavoro: {names}",
    wlArchivingAllowed:
      "Politica dell'editore secondo OA.Works: autoarchiviazione consentita — {versions}.",
    wlArchivingWhere: "Dove: {locations}.",
    wlArchivingNotAllowed:
      "Politica dell'editore secondo OA.Works: nessun permesso di autoarchiviazione registrato per questo articolo.",
    wlArchivingVersionSubmitted: "manoscritto inviato",
    wlArchivingVersionAccepted: "manoscritto accettato",
    wlArchivingVersionPublished: "versione editoriale",
    wlArchivingVersionUnstated: "versione non indicata",
    wlArchivingEmbargo: "Embargo: {duration}, fino al {date}.",
    wlArchivingEmbargoDuration: "Embargo: {duration} dalla pubblicazione.",
    wlArchivingNoEmbargo: "Nessun embargo.",
    wlArchivingLicence: "Licenza della copia depositata: {licence}.",
    wlArchivingStatement: "Dicitura che l'editore chiede di riportare:",
    wlArchivingDates: "Scheda OA.Works aggiornata il {updated}; consultata il {retrieved}.",
    wlArchivingRetrieved:
      "Consultata su OA.Works il {retrieved}; la scheda non indica una data di aggiornamento.",
    wlArchivingPolicyLink: "copia archiviata della politica dell'editore",
    wlArchivingDisclaimer:
      "Le politiche degli editori cambiano e una scheda OA.Works può risalire a diversi anni fa: controllane la data. Un diritto previsto dalla legge dipende da condizioni che SigmaCV non può verificare: se la ricerca o il tuo ente hanno ricevuto finanziamenti pubblici, la periodicità della rivista, il consenso dei tuoi coautori, la disciplina. Il contratto di pubblicazione che hai firmato può consentire più o meno di quanto preveda la politica generale della rivista. Queste sono informazioni, non una consulenza legale; chiedi alla tua biblioteca prima di depositare.",
    wlStatutoryAuthorRight:
      "Potrebbe applicarsi anche — diritto di pubblicazione secondaria ({country}), {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "Potrebbe applicarsi anche — requisito di legge di deposito in un archivio aperto ({country}), {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "Potrebbe applicarsi anche — politica nazionale di accesso aperto ({country}), {instrument}: {statements}.",
    wlStatutoryRecorded: "Registrato il {date}.",
    wlStatutoryPending: "Bozza, non ancora confrontata con il testo di legge.",
    wlStatutorySourceLink: "testo di legge",
    wlStatutoryPolicyLink: "testo della politica",
    wlStatutoryGuidanceLink: "guida",
    wlDepositAccepted: "Deposita il manoscritto accettato in {destination}",
    wlDepositPublished: "Deposita la versione editoriale in {destination}",
    wlDepositSubmitted: "Deposita il manoscritto inviato in {destination}",
    wlDepositUnrecorded:
      "Deposita il tuo manoscritto accettato, non il PDF dell'editore, in {destination} se la politica della rivista lo consente",
    wlDepositIfAgreement:
      "Deposita in {destination} solo se il tuo contratto di pubblicazione lo consente",
    wlDepositIfRightOrAgreement:
      "Deposita in {destination} solo se un diritto indicato sopra o il tuo contratto di pubblicazione lo consente",
    wlDepositLine: "{action} — {reason}",
    wlDepositBecauseFunder:
      "perché questo lavoro cita {funder} (un coautore potrebbe averlo già inviato)",
    wlDepositBecauseOwn: "perché OpenAlex elenca alcuni tuoi lavori in {repository}",
    wlDepositBecausePaperCountry: "per la tua affiliazione indicata in questo articolo ({country})",
    wlDepositBecauseCurrentCountry: "per la tua affiliazione attuale ({country})",
    wlDepositBecauseNoRepositoryPaper:
      "perché SigmaCV non conosce alcun archivio aperto nazionale per la tua affiliazione indicata in questo articolo ({country})",
    wlDepositBecauseNoRepositoryCurrent:
      "perché SigmaCV non conosce alcun archivio aperto nazionale per la tua affiliazione attuale ({country})",
    wlDepositBecauseNoAffiliation:
      "perché su questo articolo non è registrato alcun paese della tua affiliazione",
    wlDepositZenodoAny: "aperto a qualsiasi ricercatore",
    wlDepositShareYourPaper:
      "verifica il permesso dell'editore e il file che carichi, poi lo deposita su Zenodo",
    wlDepositFormLicence: "Nel modulo, scegli la licenza {licence}.",
    wlDepositFormEmbargoDate: "Tieni il file sotto embargo fino al {date}.",
    wlDepositFormEmbargoDuration:
      "Tieni il file sotto embargo per {duration} dopo la pubblicazione.",
    wlDepositZenodoDoi:
      "Su Zenodo, rispondi “No” a “Do you already have a DOI for this upload?” e aggiungi questo DOI in “Related works”.",
    wlDepositHalDoi:
      "Nel modulo di HAL, incolla questo DOI nel campo che carica i metadati da un identificativo e recupera i metadati: HAL compila il modulo con questi dati.",
    wlDepositOtherPlaces: "Altri archivi",
    wlDepositCopyDoi: "Copia DOI",
    wlDepositDoiCopied: "DOI copiato",
    wlRowDetails: "Politica registrata, diritti e note per il modulo",
    wlOpensNewTab: "Si apre in una nuova scheda",
    wlWhyPublisher:
      "Consentito dalla politica dell’editore: {version}, secondo la scheda OA.Works del {date}.",
    wlWhyEmbargoEnded: "L’embargo è terminato il {date}.",
    wlWhyNoEmbargo: "Nessun embargo.",
    wlWhyStatute:
      "Consentito dalla legge — {instrument} ({country}): il manoscritto accettato, {duration} dopo la pubblicazione (dal {date}), alle condizioni della scheda qui sotto.",
    wlWhyStatuteNoDelay:
      "Consentito dalla legge — {instrument} ({country}): il manoscritto accettato appena l’editore lo accetta, alle condizioni della scheda qui sotto.",
    wlChipDeposit: "Depositare in {destination}",
    wlChipDepositIf: "Depositare in {destination} se consentito",
    wlChipHint: "Apre questo lavoro nella scheda Accesso aperto",
    wlDepositBasisLabel: "Suggerisci archivi in base a",
    wlDepositBasisPaper: "l'affiliazione di ciascun articolo",
    wlDepositBasisCurrent: "la tua affiliazione attuale ({country})",
    wlDepositHelp:
      "Ogni link apre l'archivio in una nuova scheda (il suo modulo di deposito, quando SigmaCV lo conosce). Copia il DOI per compilare i dati dell'articolo. Quale file caricare lo scegli tu; la politica della rivista indica quali versioni consente.",
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
    wlListingHeading: "Elenco presso l'istituzione",
    wlListingHelp:
      "Una riga di stato, non un compito: comparire è volontario e non comparire non significa nulla. Ritirati in qualsiasi momento dal menu Pubblica, con effetto immediato.",
    wlListingUnlisted: "Non compari ancora sotto {institution}.",
    wlListingPageOnly:
      "Compari sulla pagina di {institution}; non nel suo insieme per i repository.",
    wlListingSetOnly:
      "Compari nell'insieme per i repository di {institution}; non sulla sua pagina.",
    wlListingListMe: "Elencami sotto {institution}",
    wlListingListMeNone: "Elencami sotto le istituzioni che spunto",
    wlListingListed: "Elencato sotto {institution}.",
    wlIndexingHeading: "Indicizzazione nei motori di ricerca",
    wlIndexingHelp:
      "Se i motori di ricerca possono elencare la tua pagina pubblica. Disattivata finché non scegli; nulla è deciso dal silenzio.",
    wlIndexingUndecided: "Non ancora deciso — la tua pagina non è indicizzata.",
    wlIndexingOff: "Disattivata — hai scelto «non ora»; la tua pagina non è indicizzata.",
    wlIndexingOn: "Attivata — i motori di ricerca possono indicizzare la tua pagina.",
    wlListingChange: "Modifica",
    wlListingNeedsPage:
      "Per comparire serve una pagina pubblicata con l'indicizzazione attiva — entrambe nel menu Pubblica.",
    hpInfoTitle: "Solo per te",
    hpPages: "Sezioni narrative: ≈ {pages} di {limit} pagine nel modello del finanziatore.",
    hpPagesOver:
      "Sezioni narrative: ≈ {pages} pagine, oltre il limite di {limit} del finanziatore.",
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
    wlTitle: "할 수 있는 일",
    wlIntro:
      "본인에게만 표시 — 기록을 정리하는 데 도움을 주는 것이지 판정이 아닙니다. 여기의 내용은 CV나 공개 페이지에 나타나지 않습니다.",
    wlPositionsHeading: "기관 레코드가 없는 현재 직위",
    wlPositionsHelp:
      "일치하는 ROR 레코드가 없습니다. ORCID에서 이 직위에 기관을 추가한 뒤 다시 동기화하세요.",
    wlClosedHeading: "지금 기탁할 수 있는 논문",
    wlClosedHelp:
      "SigmaCV가 공개된 사본을 찾지 못했으며, 출판사 정책이나 법률에 따라 오늘 한 버전을 기탁할 수 있습니다.",
    wlStateOpenCc: "공개, 크리에이티브 커먼즈 라이선스",
    wlStateOpenOther: "공개, 기타 또는 알 수 없는 라이선스",
    wlStateClosed: "공개 사본을 찾지 못함",
    wlStateUnknown: "알 수 없음",
    wlPolicyLink: "학술지 정책 확인 (Open Policy Finder)",
    wlFunders: "연구물에 명시된 지원 기관: {names}",
    wlArchivingAllowed: "OA.Works에 기록된 출판사 정책: 셀프 아카이빙 허용({versions}).",
    wlArchivingWhere: "기탁처: {locations}.",
    wlArchivingNotAllowed:
      "OA.Works에 기록된 출판사 정책: 이 논문에 대한 셀프 아카이빙 허가가 기록되어 있지 않습니다.",
    wlArchivingVersionSubmitted: "투고 원고",
    wlArchivingVersionAccepted: "게재 승인 원고",
    wlArchivingVersionPublished: "출판사 최종본",
    wlArchivingVersionUnstated: "버전 명시 없음",
    wlArchivingEmbargo: "엠바고: {duration}, {date}까지.",
    wlArchivingEmbargoDuration: "엠바고: 출판 후 {duration}.",
    wlArchivingNoEmbargo: "엠바고 없음.",
    wlArchivingLicence: "기탁본의 라이선스: {licence}.",
    wlArchivingStatement: "출판사가 포함하도록 요청하는 문구:",
    wlArchivingDates: "OA.Works 기록 갱신일 {updated}, 조회일 {retrieved}.",
    wlArchivingRetrieved: "OA.Works 조회일 {retrieved}(기록에 갱신일 없음).",
    wlArchivingPolicyLink: "출판사 정책(보관본)",
    wlArchivingDisclaimer:
      "출판사 정책은 바뀔 수 있으며, OA.Works 기록은 여러 해 전의 것일 수 있습니다. 날짜를 확인하세요. 법적 권리는 SigmaCV가 확인할 수 없는 조건(연구 또는 소속 기관의 공적 자금 지원 여부, 학술지 발행 주기, 공저자의 동의, 학문 분야 등)에 달려 있습니다. 서명한 출판 계약은 학술지의 일반 정책보다 더 많이 또는 더 적게 허용할 수 있습니다. 이는 정보 제공일 뿐 법률 자문이 아닙니다. 기탁하기 전에 소속 기관 도서관에 문의하세요.",
    wlStatutoryAuthorRight:
      "2차 출판권({country})도 적용될 수 있습니다. {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "리포지터리 기탁에 관한 법적 요건({country})도 적용될 수 있습니다. {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "국가 오픈 액세스 정책({country})도 적용될 수 있습니다. {instrument}: {statements}.",
    wlStatutoryRecorded: "{date} 기준 기록.",
    wlStatutoryPending: "초안이며 아직 법령 원문과 대조하지 않았습니다.",
    wlStatutorySourceLink: "법령 원문",
    wlStatutoryPolicyLink: "정책 원문",
    wlStatutoryGuidanceLink: "안내",
    wlDepositAccepted: "게재 승인 원고를 {destination}에 기탁하기",
    wlDepositPublished: "출판사 최종본을 {destination}에 기탁하기",
    wlDepositSubmitted: "투고 원고를 {destination}에 기탁하기",
    wlDepositUnrecorded:
      "학술지 정책이 허용하면 출판사 PDF가 아닌 게재 승인 원고를 {destination}에 기탁하기",
    wlDepositIfAgreement: "출판 계약이 허용하는 경우에만 {destination}에 기탁하기",
    wlDepositIfRightOrAgreement:
      "위에 표시된 권리나 출판 계약이 허용하는 경우에만 {destination}에 기탁하기",
    wlDepositLine: "{action} — {reason}",
    wlDepositBecauseFunder:
      "이 논문에 {funder}이(가) 명시되어 있기 때문(공저자가 이미 제출했을 수 있음)",
    wlDepositBecauseOwn: "OpenAlex에 따르면 내 논문 일부가 {repository}에 있기 때문",
    wlDepositBecausePaperCountry: "이 논문의 소속 기관이 {country}에 있기 때문",
    wlDepositBecauseCurrentCountry: "현재 소속 기관이 {country}에 있기 때문",
    wlDepositBecauseNoRepositoryPaper:
      "이 논문의 소속 국가({country})에 대해 SigmaCV가 아는 국가 리포지터리가 없기 때문",
    wlDepositBecauseNoRepositoryCurrent:
      "현재 소속 국가({country})에 대해 SigmaCV가 아는 국가 리포지터리가 없기 때문",
    wlDepositBecauseNoAffiliation: "이 논문에 소속 국가가 기록되어 있지 않기 때문",
    wlDepositZenodoAny: "모든 연구자에게 열려 있음",
    wlDepositShareYourPaper: "출판사 허가와 업로드한 파일을 확인한 뒤 Zenodo에 기탁해 주는 서비스",
    wlDepositFormLicence: "기탁 양식에서 라이선스를 {licence}(으)로 설정하세요.",
    wlDepositFormEmbargoDate: "파일을 {date}까지 비공개(엠바고)로 두세요.",
    wlDepositFormEmbargoDuration: "파일을 출판 후 {duration} 동안 비공개(엠바고)로 두세요.",
    wlDepositZenodoDoi:
      "Zenodo에서 “Do you already have a DOI for this upload?”에 “No”로 답하고 이 DOI를 “Related works”에 추가하세요.",
    wlDepositHalDoi:
      "HAL 기탁 양식에서 식별자로 메타데이터를 불러오는 칸에 이 DOI를 붙여 넣고 메타데이터를 가져오세요. HAL이 그 정보로 양식을 채웁니다.",
    wlDepositOtherPlaces: "다른 기탁처",
    wlDepositCopyDoi: "DOI 복사",
    wlDepositDoiCopied: "DOI 복사됨",
    wlRowDetails: "정책 기록, 권리, 양식 안내",
    wlOpensNewTab: "새 탭에서 열립니다",
    wlWhyPublisher: "출판사 정책으로 허용: {version}, OA.Works의 {date} 기록 기준.",
    wlWhyEmbargoEnded: "엠바고는 {date}에 끝났습니다.",
    wlWhyNoEmbargo: "엠바고 없음.",
    wlWhyStatute:
      "법률로 허용 — {instrument}({country}): 게재 후 {duration}이 지난 수락 원고({date}부터), 아래 기록의 조건에 따라.",
    wlWhyStatuteNoDelay:
      "법률로 허용 — {instrument}({country}): 출판사가 수락한 즉시 수락 원고를, 아래 기록의 조건에 따라.",
    wlChipDeposit: "{destination}에 기탁",
    wlChipDepositIf: "허용되는 경우 {destination}에 기탁",
    wlChipHint: "이 저작물을 오픈 액세스 탭에서 엽니다",
    wlDepositBasisLabel: "기탁처 추천 기준",
    wlDepositBasisPaper: "각 논문의 소속",
    wlDepositBasisCurrent: "현재 소속({country})",
    wlDepositHelp:
      "각 링크는 새 탭에서 리포지터리를 엽니다(SigmaCV가 아는 경우 기탁 양식). DOI를 복사해 논문 정보를 입력하세요. 어떤 파일을 올릴지는 직접 선택하세요(허용되는 버전은 학술지 정책에 나와 있습니다).",
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
    wlListingHeading: "기관 등재",
    wlListingHelp:
      "상태 표시일 뿐 할 일이 아닙니다. 등재는 자발적이며 등재되지 않았다는 것은 아무 의미도 없습니다. 언제든지 게시 메뉴에서 철회할 수 있으며 즉시 반영됩니다.",
    wlListingUnlisted: "아직 {institution} 아래에 등재되지 않았습니다.",
    wlListingPageOnly:
      "{institution} 페이지에는 표시되지만, 해당 기관의 리포지토리 세트에는 포함되어 있지 않습니다.",
    wlListingSetOnly:
      "{institution}의 리포지토리 세트에는 포함되어 있지만, 해당 기관의 페이지에는 표시되지 않습니다.",
    wlListingListMe: "{institution} 아래에 등재",
    wlListingListMeNone: "체크한 기관 아래에 등재",
    wlListingListed: "{institution} 아래에 등재됨.",
    wlIndexingHeading: "검색 엔진 색인",
    wlIndexingHelp:
      "검색 엔진이 귀하의 공개 페이지를 목록에 올릴 수 있는지 여부입니다. 선택하기 전까지는 꺼져 있으며, 침묵은 결정이 아닙니다.",
    wlIndexingUndecided: "아직 결정되지 않음 — 귀하의 페이지는 색인되지 않았습니다.",
    wlIndexingOff: "꺼짐 — '지금은 안 함'을 선택했습니다. 귀하의 페이지는 색인되지 않았습니다.",
    wlIndexingOn: "켜짐 — 검색 엔진이 귀하의 페이지를 색인할 수 있습니다.",
    wlListingChange: "변경",
    wlListingNeedsPage:
      "등재하려면 검색 색인이 켜진 게시된 페이지가 필요합니다. 둘 다 게시 메뉴에 있습니다.",
    hpInfoTitle: "본인에게만 표시",
    hpPages: "내러티브 부분: 지원기관 서식 기준 약 {pages} / {limit}쪽.",
    hpPagesOver: "내러티브 부분: 약 {pages}쪽, 지원기관 제한 {limit}쪽 초과.",
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
    wlTitle: "Что вы можете сделать",
    wlIntro:
      "Только для вас — помощь с вашей записью, а не вердикт. Ничего из этого не появляется в вашем CV или на публичной странице.",
    wlPositionsHeading: "Текущие должности без записи об организации",
    wlPositionsHelp:
      "Запись ROR не найдена. Добавьте организацию к этой должности в ORCID и синхронизируйте снова.",
    wlClosedHeading: "Статьи, которые вы можете разместить сейчас",
    wlClosedHelp:
      "SigmaCV не нашёл открытой копии, а политика издателя или закон позволяют вам разместить одну из версий уже сегодня.",
    wlStateOpenCc: "Открыто, лицензия Creative Commons",
    wlStateOpenOther: "Открыто, другая или неизвестная лицензия",
    wlStateClosed: "Открытая копия не найдена",
    wlStateUnknown: "Неизвестно",
    wlPolicyLink: "Проверить политику журнала (Open Policy Finder)",
    wlFunders: "Спонсоры, указанные в работе: {names}",
    wlArchivingAllowed:
      "Политика издателя по данным OA.Works: самоархивирование разрешено — {versions}.",
    wlArchivingWhere: "Где: {locations}.",
    wlArchivingNotAllowed:
      "Политика издателя по данным OA.Works: разрешение на самоархивирование для этой статьи не зафиксировано.",
    wlArchivingVersionSubmitted: "поданная рукопись",
    wlArchivingVersionAccepted: "принятая к публикации рукопись",
    wlArchivingVersionPublished: "опубликованная версия",
    wlArchivingVersionUnstated: "версия не указана",
    wlArchivingEmbargo: "Эмбарго: {duration}, до {date}.",
    wlArchivingEmbargoDuration: "Эмбарго: {duration} после публикации.",
    wlArchivingNoEmbargo: "Без эмбарго.",
    wlArchivingLicence: "Лицензия размещаемой копии: {licence}.",
    wlArchivingStatement: "Текст, который издатель просит указать:",
    wlArchivingDates: "Запись OA.Works обновлена {updated}; получена {retrieved}.",
    wlArchivingRetrieved:
      "Запись получена из OA.Works {retrieved}; дата обновления в ней не указана.",
    wlArchivingPolicyLink: "архивная копия политики издателя",
    wlArchivingDisclaimer:
      "Политики издателей меняются, а запись OA.Works может быть сделана несколько лет назад — проверьте её дату. Право, предусмотренное законом, зависит от условий, которые SigmaCV проверить не может: государственного финансирования исследования или вашей организации, периодичности журнала, согласия соавторов, научной области. Подписанный вами издательский договор может разрешать больше или меньше, чем общая политика журнала. Это информация, а не юридическая консультация; перед размещением в репозитории обратитесь в свою библиотеку.",
    wlStatutoryAuthorRight:
      "Также может применяться — право на вторичную публикацию ({country}), {instrument}: {statements}.",
    wlStatutoryDepositRequirement:
      "Также может применяться — законодательное требование о размещении в репозитории ({country}), {instrument}: {statements}.",
    wlStatutoryFundingPolicy:
      "Также может применяться — национальная политика открытого доступа ({country}), {instrument}: {statements}.",
    wlStatutoryRecorded: "Запись от {date}.",
    wlStatutoryPending: "Черновик, ещё не сверен с текстом закона.",
    wlStatutorySourceLink: "текст закона",
    wlStatutoryPolicyLink: "текст политики",
    wlStatutoryGuidanceLink: "разъяснения",
    wlDepositAccepted: "Разместить принятую к публикации рукопись в {destination}",
    wlDepositPublished: "Разместить опубликованную версию в {destination}",
    wlDepositSubmitted: "Разместить поданную рукопись в {destination}",
    wlDepositUnrecorded:
      "Разместить свою принятую рукопись, а не PDF издателя, в {destination}, если политика журнала это допускает",
    wlDepositIfAgreement:
      "Разместить в {destination}, только если это допускает ваш издательский договор",
    wlDepositIfRightOrAgreement:
      "Разместить в {destination}, только если это допускает указанное выше право или ваш издательский договор",
    wlDepositLine: "{action} — {reason}",
    wlDepositBecauseFunder:
      "так как в этой работе указана финансирующая организация {funder} (возможно, соавтор уже подал рукопись)",
    wlDepositBecauseOwn:
      "так как, по данным OpenAlex, некоторые ваши работы размещены в {repository}",
    wlDepositBecausePaperCountry: "так как страна вашей аффилиации в этой статье — {country}",
    wlDepositBecauseCurrentCountry: "так как страна вашей текущей аффилиации — {country}",
    wlDepositBecauseNoRepositoryPaper:
      "так как SigmaCV не знает национального репозитория для страны вашей аффилиации в этой статье ({country})",
    wlDepositBecauseNoRepositoryCurrent:
      "так как SigmaCV не знает национального репозитория для страны вашей текущей аффилиации ({country})",
    wlDepositBecauseNoAffiliation: "так как в этой статье не указана страна вашей аффилиации",
    wlDepositZenodoAny: "открыт для любого исследователя",
    wlDepositShareYourPaper:
      "проверяет разрешение издателя и загружаемый вами файл, затем размещает статью в Zenodo",
    wlDepositFormLicence: "В форме выберите лицензию {licence}.",
    wlDepositFormEmbargoDate: "Держите файл под эмбарго до {date}.",
    wlDepositFormEmbargoDuration: "Держите файл под эмбарго {duration} после публикации.",
    wlDepositZenodoDoi:
      "В Zenodo ответьте «No» на вопрос «Do you already have a DOI for this upload?» и добавьте этот DOI в раздел «Related works».",
    wlDepositHalDoi:
      "В форме HAL вставьте этот DOI в поле загрузки метаданных по идентификатору и получите метаданные: HAL заполнит форму на их основе.",
    wlDepositOtherPlaces: "Другие места размещения",
    wlDepositCopyDoi: "Копировать DOI",
    wlDepositDoiCopied: "DOI скопирован",
    wlRowDetails: "Запись о политике, права и заметки к форме",
    wlOpensNewTab: "Откроется в новой вкладке",
    wlWhyPublisher: "Разрешено политикой издателя: {version}, по записи OA.Works от {date}.",
    wlWhyEmbargoEnded: "Эмбарго закончилось {date}.",
    wlWhyNoEmbargo: "Без эмбарго.",
    wlWhyStatute:
      "Разрешено законом — {instrument} ({country}): принятая рукопись через {duration} после публикации (с {date}), на условиях записи ниже.",
    wlWhyStatuteNoDelay:
      "Разрешено законом — {instrument} ({country}): принятая рукопись сразу после принятия издателем, на условиях записи ниже.",
    wlChipDeposit: "Разместить в {destination}",
    wlChipDepositIf: "Разместить в {destination}, если это разрешено",
    wlChipHint: "Открывает эту работу на вкладке «Открытый доступ»",
    wlDepositBasisLabel: "Предлагать места по",
    wlDepositBasisPaper: "аффилиации в каждой статье",
    wlDepositBasisCurrent: "вашей текущей аффилиации ({country})",
    wlDepositHelp:
      "Каждая ссылка открывает репозиторий в новой вкладке (его форму размещения, если SigmaCV её знает). Скопируйте DOI, чтобы заполнить данные статьи. Какой файл загрузить, решаете вы; какие версии допустимы, указано в политике журнала.",
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
    wlListingHeading: "Указание под организацией",
    wlListingHelp:
      "Строка состояния, а не задача: указание добровольно, а его отсутствие ничего не значит. Отзовите в любой момент в меню «Публикация», с немедленным эффектом.",
    wlListingUnlisted: "Вы ещё не указаны под {institution}.",
    wlListingPageOnly:
      "Вы указаны на странице организации {institution}, но не в её наборе для репозиториев.",
    wlListingSetOnly:
      "Вы указаны в наборе для репозиториев организации {institution}, но не на её странице.",
    wlListingListMe: "Указать меня под {institution}",
    wlListingListMeNone: "Указать меня под отмеченными организациями",
    wlListingListed: "Указано под {institution}.",
    wlIndexingHeading: "Индексация поисковыми системами",
    wlIndexingHelp:
      "Могут ли поисковые системы показывать вашу публичную страницу. Выключено, пока вы не решите; молчание ничего не решает.",
    wlIndexingUndecided: "Ещё не решено — ваша страница не индексируется.",
    wlIndexingOff: "Выключено — вы выбрали «не сейчас»; ваша страница не индексируется.",
    wlIndexingOn: "Включено — поисковые системы могут индексировать вашу страницу.",
    wlListingChange: "Изменить",
    wlListingNeedsPage:
      "Для указания нужна опубликованная страница с включённой индексацией — и то и другое в меню «Публикация».",
    hpInfoTitle: "Только для вас",
    hpPages: "Нарративные разделы: ≈ {pages} из {limit} страниц в шаблоне фонда.",
    hpPagesOver: "Нарративные разделы: ≈ {pages} страниц, сверх лимита фонда в {limit}.",
    hpSelfRef:
      "Около {pct} ссылок в ваших статьях указывают на ваши собственные работы (n = {n}). Некоторые комиссии обращают на это внимание; в вашем резюме это нигде не отображается.",
  },
};

/** Workspace strings for a UI locale (falls back to en-US). */
export function workspaceUi(locale: string): WorkspaceUiStrings {
  return WORKSPACE_UI[asLocale(locale)];
}
