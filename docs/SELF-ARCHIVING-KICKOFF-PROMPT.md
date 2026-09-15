# Kickoff prompt — "deposit this paper": self-archiving rights + routed deposit

Copy everything in the fenced block below into a fresh Claude Code session (run from
the repo root `C:\R_git\SigmaCV`, on an up-to-date `main`). The research behind it was
done on 2026-09-15 with three verification agents; every external fact below was read
from the live API or the cited page that day. Items marked UNVERIFIED were not.

```
You are working on SigmaCV (C:\R_git\SigmaCV) — a free, open-source academic-CV
builder (Next.js 16 / React 19.2 / TypeScript / Prisma / Vitest, deployed at
sigmacv.org, single maintainer: Basile Chrétien, pharmacologist, French, PhD
candidate at Nagoya). Read CLAUDE.md, src/CLAUDE.md, src/lib/CLAUDE.md and
src/lib/cv/CLAUDE.md first. Then read this whole prompt before touching code.

GOAL OF THE PROGRAMME
Help the researcher put a legal copy of each closed paper in the right open
repository. Three PRs, in order; do PR1 fully (merged + deployed) before PR2.
  PR1  "rights line": for every closed work in the owner worklist, state the
       publisher's self-archiving policy as recorded by a named source on a
       named date (version allowed, embargo end, allowed repository kinds,
       licence, publisher deposit statement), plus a statutory line for the
       affiliation's country where a secondary-publication right exists.
  PR2  "destination": turn each such row into ONE action — verb + destination
       link + one-clause reason — routed by the affiliation printed on the
       paper (switchable to the current affiliation), with the DOI carried.
  PR3  (NOT in scope; decision pending) on-behalf deposit into HAL via SWORD.
       Do not build it. Leave a short "next" note in docs/ if useful.

WHY (the owner's framing, keep it)
HAL because the owner is French, but the right platform per author: funder
repository when one is named, the author's own repositories (where their
works already sit), the national one (France -> HAL), else Zenodo. The user
should reach the deposit form in one or two clicks; choosing the correct file
(accepted manuscript, not the publisher PDF) is the author's step by nature.

NON-NEGOTIABLE DESIGN CONSTRAINTS (from the 2026-09-07/08 panels; tests enforce them)
- "Actions, never states." A worklist row = identifier + named verb +
  destination link + one-clause reason. No totals, no N-of-M, no percentage,
  no "coverage", never a verdict. See src/lib/cv/worklist.ts module comment
  ("No compliance state exists anywhere in this module, by design").
- Banned vocabulary in every locale on worklist keys (tests/funding-i18n.test.ts,
  tests/funder-oa-policies.test.ts, tests/institution-prompt-i18n.test.ts):
  compliant, non-compliant, compliance, overdue, violation, mandate/mandatory,
  percent/%, and their translations. Read those tests before writing copy.
- Facts sit BESIDE the work; whether a policy applies is the owner's
  judgement. Every fact carries its source and its "recorded on" date.
  Model: src/lib/funders/oaPolicies.ts (committed hand-verified table,
  `verifiedBy: "maintainer" | "maintainer-pending"`, `lastVerified`, own-domain
  policy URL) + docs/FUNDER-OA-POLICIES.md. Reuse that pattern for the
  statutory table.
- Editor-only. Nothing from this programme is rendered on the public page,
  in any export, in OAI-PMH, in the anonymous preview or in frozen versions.
  `meta.funders` is already stripped from every public surface — keep the new
  fields out of the public projection the same way (src/lib/cv/publicProjection.ts).
- External clients: src/lib/<source>/client.ts, through src/lib/http.ts
  (`resilientFetch`: timeout + bounded retry), polite User-Agent/mailto, unit-
  tested with mocked fetch, FAIL-SOFT: a hiccup never breaks a sync.
- Data minimisation: store only what the row prints. Never a gated field.
- Adding an i18n key forces a value in ALL TEN locales (en-US, zh-CN, es-ES,
  fr-FR, de-DE, ja-JP, pt-BR, it-IT, ko-KR, ru-RU) — TypeScript fails otherwise.
  Non-English copy: initial translation flagged for native review; run a
  native-quality copy-review agent over the ten strings before merging (the
  2026-09-15 review rewrote 8 of 10 machine drafts — expect the same).
- Coverage gate on src/lib/**: stmts 98 / branches 87 / funcs 99 / lines 99
  (`npm run coverage`). Unreachable defensive branches: `/* v8 ignore next N -- reason */`.
- After changing src/lib/canonical/schema.ts: `npm run gen:schema` and commit
  public/schema/cv/v2.json (tests/cv-json-schema.test.ts fails otherwise).
- CHANGELOG.md `[Unreleased]` entry per PR, in the repo's narrative style
  (what the reader could not do before, what changed, why).

WHERE THE CODE IS (verified 2026-09-15 on main defd32e)
- Worklist logic: src/lib/cv/worklist.ts — `openAccessStates(cv)` returns rows
  {itemId,title,year,state,license,venue,funderNames}; state
  "no-open-copy-found" = `meta.oaIsOpen === false` (via `countableWorks`).
  UI: src/components/WorklistPanel.tsx (`closed` rows ~line 109; funder policy
  sentence via `funderOaPolicy(row.fundrefDoi)` ~line 263). Strings:
  src/lib/i18n/workspaceUi.ts keys `wl*` (e.g. wlOaSummary, wlFunders).
- Per-work stored fields (src/lib/canonical/schema.ts, item `meta`): oaStatus,
  oaIsOpen, oaUrl, license, pmid, funders[{id,name,awardId}],
  workInstitutions (the OWNER's own affiliation ROR ids on that paper, from
  build.ts `selfWorkInstitutions`), plus the usual csl. ISSN is NOT stored.
- Build: src/lib/canonical/build.ts ~line 2075-2100 (where oaStatus/oaIsOpen/
  oaUrl/license/pmid are set from the OpenAlex work; `workOaUrl` ~1672).
  OpenAlex types: src/lib/openalex/types.ts (`OpenAlexWork.open_access`,
  `primary_location`, `best_oa_location`; `OpenAlexSource.issn_l`,
  `OpenAlexSource.type`; the `locations[]` array is NOT typed/selected yet —
  check src/lib/openalex/client.ts `select` list before relying on it).
- Sync carry-over: src/lib/cv/sync.ts — works OpenAlex returns are rebuilt from
  source; manual / DOI-claimed items are carried (`carryOverUserItems`) and keep
  their previous meta. Follow the `funders` precedent for the new field.
- Funder policies: src/lib/funders/oaPolicies.ts (+ crosswalk.ts, join.ts).
- Current positions / ROR: src/lib/cv/currentPositions.ts (`positionRorId`),
  src/lib/ror/id.ts (`bareRorId`).

VERIFIED EXTERNAL FACTS (2026-09-15)

1. Rights source A — OA.Works permissions API (use FIRST)
   GET https://bg.api.oa.works/permissions/<doi>   (also /permissions/<issn>,
   and ?affiliation=<ROR id> adds the institution's policy). No auth; no
   documented rate limit (UNVERIFIED — be polite: one call per closed work per
   sync, cache by ISSN+publisher in memory for the run). Verified live on
   10.1016/j.cell.2020.01.001. Response: top-level `best_permission` and
   `all_permissions[]`. `best_permission` fields:
     can_archive (bool), version ("acceptedVersion"), versions[]
     ("acceptedVersion","submittedVersion"), licence, licences[{type}],
     locations[] ("Institutional Repository","Non-commercial Subject
     Repository", ...), embargo_months (int), embargo_end (ISO date computed
     for THIS DOI), deposit_statement (publisher-required text),
     copyright_owner/name/year, issuer{type: journal|Publisher|affiliation,
     id[ISSN], has_policy, parent_policy, journal_oa_type},
     provenance{archiving_policy[], author_rights, embargo, faq, ...},
     score, meta{added, updated, monitoring, contributors}.
   Show `meta.updated` as the "recorded on" date (it can be years old — say
   so). Data licence: public domain (Zenodo record 3813854). Project status:
   alive, chosen by cOAlition S for the Journal Checker Tool, but little
   visible activity since 2021 — hence fail-soft and dated.
   The old api.openaccessbutton.org host is GONE (Open Access Button shut
   2025-11-18). Do not use it.

2. Rights source B — Jisc Open policy finder (Sherpa Romeo successor; SECOND,
   only after a key exists)
   Base https://api.openpolicyfinder.jisc.ac.uk ; object retrieval
   /retrieve?item-type=publication&filter=[["issn","equals","0092-8674"]] ;
   key in header `x-api-key`; key requested by email to help@jisc.ac.uk,
   subject "Open policy finder API request" (name, email, organisation,
   purpose). Data CC BY-NC-ND 4.0: displaying a policy with attribution and a
   link to the record is fine; a DERIVED value (computed embargo date) is the
   ND grey zone — compute dates from OA.Works or your own arithmetic, not by
   editing a Jisc value, and ask Jisc when requesting the key. Response
   schema: publisher_policy.permitted_oa[] {article_version:
   submitted|accepted|published, embargo{amount,units}, location.location[]
   (institutional_repository, subject_repository, any_repository,
   named_repository...), license[], conditions[], prerequisites,
   public_notes}, every enum with a sibling *_phrases array;
   workflow_dates.policy_last_reviewed. Legacy v2.sherpa.ac.uk was switched
   off end of July 2026 — never target it. Because this source is ISSN-keyed,
   PR1 must start storing ISSN per work (OpenAlex `primary_location.source.issn_l`).
   The OWNER must request the key (🙋 item) — the code ships dormant without
   `OPF_API_KEY`, like the EPO client.

3. Statutory secondary-publication rights (show as "may also apply", never
   as the verdict — the conditions are not derivable from metadata)
   FR  Code de la recherche art. L533-4 (loi 2016-1321 art. 30): research
       >=50% publicly funded; periodical >=1/yr; accepted manuscript ("version
       finale acceptée pour publication"); after 6 months (STM) / 12 months
       (SHS) from first online publication; co-authors' agreement; non-
       commercial reuse; "d'ordre public", contrary clauses "réputées non
       écrites". https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033205794
       Guidance: https://www.ouvrirlascience.fr/guide-application-loi-republique-numerique-article-30-ecrits-scientifiques-version-courte/
   DE  §38(4) UrhG (since 2014-01-01): >=50% public funding; periodical >=2/yr;
       accepted manuscript; 12 months; non-commercial; contrary agreement
       "unwirksam". https://www.gesetze-im-internet.de/urhg/__38.html
   AT  §37a UrhG (2015-10-01): as DE, 12 months. https://www.jusline.at/gesetz/urhg/paragraf/37a
   NL  Art. 25fa Auteurswet ("Taverne", 2015): short scientific work funded
       wholly or partly by Dutch public funds; "reasonable period", applied as
       6 months; universities deposit the published version.
       https://www.openaccess.nl/en/policies/open-access-in-dutch-copyright-law-taverne-amendment
   BE  Code de droit économique art. XI.196 §2/1 (law of 2018-09-05): >=50%
       public funding; manuscript; 12 months SHS / 6 months other sciences;
       imperative, applies whatever the chosen law; retroactive.
       https://www.kuleuven.be/open-science/what-is-open-science/scholarly-publishing-and-open-access/open-access-kuleuven/belgian-oa-legislation
   BG  Copyright Act art. 60(2)-(4) (2023): publicly funded research; no
       embargo; non-commercial; contrary agreements void. (Source: KR21
       position paper 2026-01, annex.)
   ES  Ley 14/2011 art. 37 as amended by Ley 17/2022 (2022-09-07): a deposit
       OBLIGATION for publicly funded research, final accepted version,
       simultaneous with publication — an obligation, not an author right;
       phrase it as such. https://www.boe.es/buscar/act.php?id=BOE-A-2022-14581
   IT  no author right (DL 91/2013 art. 4 obliges funders only; SPR bill pending).
   JP  no statute; Cabinet Office policy (2024-02-16): immediate OA of AAM or
       VoR in institutional repositories for competitive funds awarded from
       FY2025 (KAKENHI, JST, AMED). https://www.lib.kyushu-u.ac.jp/en/services/open/mandate
   Commit these as a table in the oaPolicies.ts style (country code key,
   statement phrases, source URL, lastVerified 2026-09-15, verifiedBy
   "maintainer" — the URLs above were read that day; if you cannot fetch one,
   mark that entry "maintainer-pending"). Country of a work = country of
   `meta.workInstitutions` ROR(s) (ROR -> country: src/lib/ror/ has the
   client; OpenAlex authorships also carry `countries[]`, see types.ts).
   Funder overlay already exists (oaPolicies.ts): UKRI/Wellcome/cOAlition S
   rights-retention = CC BY accepted manuscript, no embargo — keep showing it
   as the funder sentence, do not merge it into the publisher line.

4. Routing signal (for PR2)
   OpenAlex institution `repositories` is NOT usable alone: of 12 tested,
   Caen (I98702875), Nagoya (I60134161) and São Paulo (I17974374) are `[]`,
   and HAL is a single national source attributed to CNRS (S4306402512,
   2.27M works, homepage hal.science) with stray near-empty portal records;
   populated lists mix journals, thesis servers and Dataverse. Reliable:
   work-level `locations[]` where `source.type == "repository"` (e.g. 19,923
   Caen works carry a HAL location). Zenodo = S4306400562.
   Rule stack, in order, each row printing its one-clause reason:
     a) funder repository when the funder table names one (NIH -> PubMed
        Central via NIHMS; Wellcome/UKRI -> Europe PMC) — "because this work
        names <funder>";
     b) a repository where the author's OTHER works already sit (repository-
        type locations across the CV, by frequency) — "because 12 of your
        works are already in HAL";
     c) national repository by affiliation country (FR -> HAL; extend only
        with a cited source per country) — "because your affiliation on this
        paper is <institution> (France)";
     d) the institution's own `repositories` entries, if any look like an
        institutional archive (name heuristic; show the name, never guess) —
        "because <institution> lists <repository>";
     e) fallback Zenodo — "because no repository was found for <institution>".
   Affiliation on the paper is the default (`meta.workInstitutions`); offer
   the current affiliation (`positionRorId` of the latest visible position)
   as the alternative when it differs. No affiliation -> (e) with the reason.

5. Deposit links (for PR2; what each platform actually supports)
   HAL: web deposit imports metadata from a DOI ("Upload a file and/or add a
     DOI"); NO documented `?doi=` URL parameter (UNVERIFIED — hal.science is
     behind a bot wall; test by hand once and record the result). Link to
     https://hal.science/submit with the DOI copied to the clipboard.
     SWORD: https://api.archives-ouvertes.fr/sword/ (HTTP Basic, depositor
     account; `On-Behalf-Of: ORCID|0000-...`; `X-Allow-Completion: idext`
     makes HAL fetch Crossref metadata) — PR3 material only.
   DSpace 7/8: prefilled import route exists in code:
     <repo>/import-external?sourceId=crossref&query=<DOI>&entity=Publication
     (login required; `sourceId` is instance config, "crossref" is the
     default name). Use when the repository homepage is detectably DSpace
     (UNVERIFIED how to detect from OpenAlex data — start with a small
     committed map of known DSpace repositories, or skip detection in PR2).
   EPrints: import screen can be pre-populated by GET
     cgi/users/home?screen=Import&format=DOI&data=<DOI> but still needs a click.
   Zenodo: no DOI import in the web form; link https://zenodo.org/uploads/new
     with the DOI copied. (OAuth deposit possible later; out of scope.)
   ShareYourPaper: https://shareyourpaper.org/<DOI> — no login, checks
     permission and deposits into Zenodo; libraries harvest. Offer it as the
     universal option on every row.
   Europe PMC plus / NIHMS: web only; NIHMS "Populate from DOI" exists; link
     https://www.nihms.nih.gov/ and https://plus.europepmc.org/ with the DOI
     copied. arXiv: no third-party path; never suggest a proxy.
   IRIS (Italy), JAIRO Cloud/WEKO3 (Japan): DOI import inside the form, no
     prefill URL; link the repository homepage with the DOI copied.
   Dissemin (the prior art that deposited into HAL on behalf of ORCID users)
   closed on 2025-01-01; do not link it.

PR1 — SCOPE, EXACTLY
1. Client src/lib/oaworks/client.ts: `fetchSelfArchivingPermission(doi, rorId?)`
   -> a small typed subset {canArchive, versions[], embargoMonths?,
   embargoEnd?, locations[], licence?, depositStatement?, issuerIssn?,
   recordedOn?, sourceUrl} or undefined. Validate with Zod at the boundary;
   bound string lengths; drop anything not printed. Mocked-fetch tests
   (200 with best_permission, 200 without, 404, 5xx, malformed JSON, timeout).
2. Schema: item `meta.selfArchiving` (optional, that subset + `source:
   "oa.works"`, `retrievedAt`), `meta.issn` (issn_l from primary_location.source),
   and — only if `locations[]` can be selected cheaply — `meta.repositoryLocations`
   [{sourceId, name}] bounded to 5, for PR2's rule (b). Zod with `.catch(undefined)`
   per-entry degradation like `funders`. gen:schema + commit v2.json. Strip all
   three from the public projection and every export except the owner's own
   JSON/GDPR export (mirror how `funders` is handled — grep for it).
3. Build/sync: populate at sync for works OpenAlex returned with
   `oaIsOpen === false` and a DOI (one OA.Works call each, fail-soft, sequential
   with the existing politeness pattern; carried items keep their previous
   value; a re-sync refreshes it). Do not call OA.Works from the anonymous
   preview build or the public resync of a CV whose owner never opened the
   worklist? — NO: keep it simple and honest: call it in the ordinary owner
   sync only (src/lib/cv/sync.ts path used by /api/cv/sync), never in
   /api/preview/render. Document that in the module comment.
4. Statutory table src/lib/funders/statutoryArchiving.ts (or src/lib/archiving/
   — pick one folder for the programme and say why in its CLAUDE.md):
   entries above, keyed by ISO country code, `statements[]`, `sourceUrl`,
   `verifiedBy`, `lastVerified`; a test mirrors tests/funder-oa-policies.test.ts
   (own-domain URLs, ISO dates, banned vocabulary, docs listing).
   Add docs/STATUTORY-ARCHIVING-RIGHTS.md listing every entry for the
   maintainer to re-verify, like docs/FUNDER-OA-POLICIES.md.
5. Worklist: extend `OpenAccessRow` with `selfArchiving?` and
   `statutory?: {countryCode, ...}` derived ONLY from stored fields; UI in
   WorklistPanel.tsx under each closed row: one publisher-policy sentence,
   one statutory sentence when the country has an entry, the existing funder
   sentence unchanged. Sentences are built from i18n templates with named
   placeholders ({source}, {date}, {version}, {embargoEnd}, {locations},
   {licence}); the deposit statement, if any, is quoted verbatim in a
   <blockquote> (publisher text; not translated). A footer line carries the
   disclaimer below. Keys in workspaceUi.ts, ten locales.
6. Disclaimer (adapt per locale, keep the substance):
   "Self-archiving permission as recorded by OA.Works (updated {date}),
   retrieved {retrievedAt}. Publisher policies change and this journal's record
   may be outdated. Statutory rights shown for {country} depend on conditions
   SigmaCV cannot verify — public-funding share, co-author agreement,
   discipline — and your signed publishing agreement may grant more. This is
   information, not legal advice; check with your library before depositing."
7. Tests: client (mocked fetch), schema round-trip + public-projection strip,
   worklist derivation (closed with permission / closed without / carried
   item / no DOI), statutory table invariants, i18n ban across all wl keys
   (extend the existing tests, don't fork them), a source-grep test that
   /api/preview/render never imports the oaworks client.
8. Verification loop: `npm run typecheck` -> `npm run coverage` (on Windows
   the two bash backup-script test files fail regardless and Vitest then hides
   the coverage table: run `npx vitest run --coverage --exclude
   tests/verify-backup-script.test.ts --exclude tests/offsite-backup-script.test.ts`
   to read the gate; CI on Linux runs everything). Browser-verify the worklist
   on the dev server with a CV that has closed works (the owner's own).

PR2 — SCOPE (after PR1 is merged AND deployed)
1. Pure src/lib/archiving/depositRoutes.ts: `depositRoutes(cv, item, {affiliation:
   "paper" | "current"})` -> ordered candidates [{kind: funder|own|national|
   institution|zenodo|shareyourpaper, name, href, reasonKey, reasonParams,
   doi}] applying the rule stack above; a national table with one entry (FR ->
   HAL, source: hal.science + the L533-4 guidance) and the structure to add
   more; the funder->repository map next to the funder table (NIH ->
   https://www.nihms.nih.gov/, Wellcome/UKRI -> https://plus.europepmc.org/).
   Never a score; the order IS the rule and the reason says which rule fired.
2. UI: under each closed row, ONE primary action ("Deposit the accepted
   manuscript in HAL — because ...") + "Other places" disclosure listing the
   remaining candidates + ShareYourPaper; a "Copy DOI" affordance; the
   affiliation switch when paper != current. Verb + destination + reason, ten
   locales, no totals anywhere.
3. Plausible event `Deposit route` with {kind} only (never the DOI, never the
   repository name if it identifies the institution) — check
   src/lib/analytics/track.ts and the scrub in plausibleInit.ts first.
4. Tests for every rule branch and for the "no affiliation" path; i18n bans.

PROCESS (this repo's rules — follow them; they are in ~/.claude/rules and CLAUDE.md)
- One git worktree per PR off origin/main: `git fetch origin && git worktree
  add -b feat/<slug> ../SigmaCV-<slug> origin/main`; junction node_modules
  AND src/generated from the primary checkout (`cmd /c mklink /J`), remove
  both junctions BEFORE `git worktree remove`. Files are CRLF: patch scripts
  must normalise EOL; write multi-locale edits with a Node script, never
  shell heredocs. For a dev server from the worktree, add a launch.json entry
  in the PRIMARY checkout's .claude/launch.json (gitignored) with
  runtimeArgs ["run","dev","--prefix","C:/R_git/SigmaCV-<slug>","--","--webpack",
  "--port","30xx"] — forward slashes; Turbopack refuses a junctioned
  node_modules ("points out of the filesystem root"), webpack does not.
  Remove the entry when done.
- Before merging: run parallel adversarial review agents on the diff (a
  TypeScript/security reviewer looking for privacy leaks into public
  surfaces, a copy reviewer for the ten locales, a "panel vetoes" reviewer
  checking actions-not-states and the banned vocabulary) and apply what
  they find. The 2026-09-15 review caught a real `String.replace` `$&`
  expansion bug — expect findings.
- `gh pr create` with a full description; trigger CodeRabbit with
  `gh pr comment <n> --body "@coderabbitai review"` (auto-review is OFF; the
  local merge hook waits for its check; if it says "Head commit changed"
  after a later push, re-trigger once). Merge with `gh pr merge <n> --squash
  --delete-branch`.
- Deploy from PowerShell (the Bash tool cannot ssh):
  ssh root@sigmacv.org "cd /root/sigmacv && git log --oneline -1 && ./scripts/deploy.sh"
  then verify the live worklist. Update the memory note
  deployed-2026-08-19.md with the new hash.
- Record progress in memory (C:\Users\Basile\.claude\projects\C--R-git-SigmaCV\memory\):
  update self-archiving-routing-research-2026-09-15.md with what shipped.

🙋 OWNER ITEMS (list them at the end of PR1, do not attempt)
- Request the Jisc open policy finder API key (help@jisc.ac.uk, subject
  "Open policy finder API request"; ask whether non-profit display with
  attribution is fine) and set OPF_API_KEY on the server.
- Decide PR3 (HAL on-behalf deposit): contact CCSD about a SigmaCV depositor
  account and the On-Behalf-Of ORCID flow; it also requires each author's HAL
  account to be linked to their ORCID.
- Hand-test whether https://hal.science/submit accepts a DOI parameter and
  record the answer in docs/SELF-ARCHIVING-KICKOFF-PROMPT.md.

START with PR1 step 1 (the client + its tests), then the schema, then build,
then the tables, then the worklist UI. Ask the owner only for decisions the
prompt leaves open; otherwise continue as recommended.
```
