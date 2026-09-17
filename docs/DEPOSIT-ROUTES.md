# Deposit routes — maintainer note

The worklist's deposit action (editor-only) turns each closed journal article into **one place to deposit** — a verb, a destination link and a one-clause reason — with the other places behind a disclosure. The routes are built by `src/lib/archiving/depositRoutes.ts` from stored fields and the committed tables in `src/lib/archiving/repositoryDirectory.ts`. Nothing here is public: no route, table or stored input reaches the public page, a public download, the OAI feed, a frozen version or the anonymous preview (`tests/funders-not-public.test.ts`).

## The rule stack (the order is the rule, never a score)

1. **funder** — a confirmed funder repository for a funder the work names (`meta.funders`, joined to FundRef through the owner's funder crosswalk). Reason: "because this work names _funder_ (a co-author may already have submitted it)" — the funder on a paper may be a co-author's grant.
2. **own, open** — HAL, Zenodo or arXiv, when OpenAlex lists some of the owner's works there (`owner.depositRepositories`). Reason: "because OpenAlex lists some of your works in _repository_". The number of works orders the list and is never shown or stored.
3. **national** — the national repository of the affiliation country: the country printed on the owner's authorship of the paper (`meta.workCountries`) by default, or the owner's current affiliation (the `Institution` table's ROR country for the first visible current position) when they choose it. Reason names the country.
4. **own, other** — any other repository OpenAlex lists the owner's works in, with the same reason. It comes after the national rule: a co-author's institutional repository reaches that list as easily as the owner's own, and may not take the owner's deposit.
5. **zenodo** — always last and open to anyone. When nothing came before, the reason says why: no national repository on record for the country, or no affiliation country on the paper.

A destination reached by an earlier rule is not repeated. ShareYourPaper (`https://shareyourpaper.org/<DOI>`: it checks the publisher's permission and the uploaded file, then deposits in Zenodo) is always listed among the other places, never as the one action. The block is shown for **journal articles only** (the works OA.Works records a policy for), and the choice to follow the current affiliation appears only when it would change at least one work's action.

## What the action says — never beyond the publisher's record

| OA.Works record (`meta.selfArchiving`)       | Action                                                                                                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| none (not looked up, no record, call failed) | "Deposit your accepted manuscript, not the publisher's PDF, in _X_ if the journal's policy allows it"                                                                                                              |
| self-archiving not allowed                   | "Deposit in _X_ only if your publishing agreement allows it" — "…only if a right shown above or your publishing agreement…" when an author's statutory right shows (not a deposit requirement or funding guidance) |
| allowed, but only in places _X_ is not       | the same "only if" wording                                                                                                                                                                                         |
| allowed                                      | the version the record allows, the publisher's own first: published version, then accepted manuscript, then submitted manuscript                                                                                   |
| any record, funder route                     | "Deposit the accepted manuscript in _X_" — the funder's policy is why the place is offered                                                                                                                         |

**Places and OA.Works' location vocabulary** (`placeFitsLocations`): every place fits "Any Repository" and "Any Website"; **HAL** fits an institutional repository (through its portals) and any non-commercial repository; **Zenodo** a "Non-commercial Repository" or a general repository; **arXiv** a subject repository or a preprint server; any other place only the "any" kinds. No recorded location means no constraint.

**Under the action**, what the record asks of the form: the licence ("In the form, set the licence to …" — Zenodo's form preselects CC BY), and the embargo while it runs (an end date still ahead, or a duration after publication when only the months are recorded). Not for a funder repository, which sets the release itself. For Zenodo, when the work has a DOI: answer "No" to "Do you already have a DOI for this upload?" and add the DOI under "Related works" — otherwise the deposit takes the publisher's DOI as its own. Zenodo's form is in English, so every locale quotes its labels in English. For HAL, when the work has a DOI: paste it into the box at the start of the form's metadata section that loads metadata from an identifier — “Chargez les métadonnées à partir d'un identifiant”, then “Récupérer les métadonnées”, in HAL's French interface — and HAL fills in the form from it. HAL ignores a DOI passed in the link (`https://hal.science/submit?doi=…` opens an empty form; checked on 2026-09-15 in a signed-in session), so the link stays the bare form and the Copy DOI button carries the DOI. Only the French labels were read, so the French note quotes them and the other locales describe the box.

The "Check the journal's policy" search link on a closed row shows whenever OA.Works gives no link to the publisher's policy.

## Where "own" comes from

The owner sync (`archiving/depositRepositoriesPass.ts`, never the anonymous preview) makes two small OpenAlex calls, at most once a week per owner (`openalex/repositories.ts`): the owner's works with any repository location **grouped by location source**, then one batched `/sources` lookup keeping the sources OpenAlex types `repository`. Both calls share one 8-second wall-clock budget with no retries, and the second is not started once the first has spent it: the owner sync — and the paced cron resync — wait on this pass. Then `ownerDepositRepositories` drops the non-deposit sources, merges HAL portals (a homepage on `hal.science`, `*.archives-ouvertes.fr` or a `hal.`/`hal-` host) into HAL, prefers a known deposit form to a homepage, keeps a repository only when it holds at least two of the owner's works, and keeps at most three. OpenAlex's location `version` and `is_oa` were checked and are not usable filters: on a real CV nearly every repository location says `submittedVersion`, and HAL records are mostly closed notices.

Known limitation: a repository can hold an owner's works because a **co-author** deposited them there, and a HAL record may be a notice without a file. The reason says only what OpenAlex lists; repositories other than HAL, Zenodo and arXiv rank after the national rule for that reason.

## Tables

All read on 2026-09-15.

### Known deposit forms

| OpenAlex source | Destination | Link                           | Checked                                               |
| --------------- | ----------- | ------------------------------ | ----------------------------------------------------- |
| `S4306402512`   | HAL         | https://hal.science/submit     | 200                                                   |
| `S4306400562`   | Zenodo      | https://zenodo.org/uploads/new | 403 to automated reading; the login form in a browser |
| `S4306400194`   | arXiv       | https://arxiv.org/submit       | 200, redirects to the arXiv login                     |

### Non-deposit sources (typed `repository` by OpenAlex, never offered)

PubMed `S4306525036`, PubMed Central `S2764455111`, Europe PMC `S4306400806`, DOAJ `S4306401280`, IRDB `S7407056385`, LA Referencia `S4306402641`, RePEc `S4306401271`, Dialnet `S4306401293`, CyberLeninka `S4306401404`, OSTI `S4306402487`, OpenGrey `S4377196900`, RCAAP `S4306402433`, Figshare `S4377196282`, GBIF `S4398183272`, DiSSCo `S7407053449`, Harvard Dataverse `S4377196806`, DANS `S4306401843`, NAKALA `S7407051768`, Gallica `S4406923039`. Ids and names were read off OpenAlex's most frequent repository sources and a real CV.

Preprint servers, too: medRxiv `S3005729997` and `S4306400573`, bioRxiv `S4306402567`, SSRN `S4210172589`, Preprints.org `S6309402219`, Research Square `S4306525896` (all typed `repository`, read off OpenAlex). medRxiv and bioRxiv take no manuscript of a paper already accepted or published, and SSRN and Research Square are commercially owned, so none is offered as the place a published paper goes.

Add a source here when it shows up as a "place" and takes no author deposit of a published paper.

### National repositories

| Code | Destination | Source               | Status   |
| ---- | ----------- | -------------------- | -------- |
| `FR` | HAL         | https://hal.science/ | verified |

Add a country only with a cited national repository that accepts any researcher of that country.

### Funder repositories

| FundRef DOI          | Funder                              | Destination            | Link                        | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------- | ---------------------- | --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `10.13039/100000002` | National Institutes of Health (NIH) | PubMed Central (NIHMS) | https://www.nihms.nih.gov/  | verified | The site itself (nih.gov) is the NIH Manuscript Submission system ("Sign in - NIHMS", "Manuscript Submission", "Public Access").                                                                                                                                                                                                                                                                                                                                           |
| `10.13039/100010269` | Wellcome                            | Europe PMC plus        | https://plus.europepmc.org/ | verified | Wellcome's “Depositing your Wellcome-funded research” page (https://wellcome.org/research-funding/guidance/open-access-guidance/depositing-your-wellcome-funded-research, read in a browser on 2026-09-15 — wellcome.org refuses automated reading) names Europe PMC plus for self-archiving the Author Accepted Manuscript, under CC BY, on publication, never the publisher's PDF; Europe PMC plus takes accepted manuscripts of research funded by a Europe PMC funder. |

A `maintainer-pending` entry is recorded but **never routed to**: confirm it on the funder's own page, then set `verifiedBy: "maintainer"` and `lastVerified`.

UKRI is deliberately absent: its policy asks for a repository without naming one, so the own / national / Zenodo rules apply.

## Already in a repository — the copies the owner sync finds

OpenAlex, whose word "no open copy" was, misses deposits routinely: on one CV read on 2026-09-16, 17 of 51 closed articles had a HAL record it did not know — 3 with a file (one since 2021), 14 notices without one — and Unpaywall saw none of them either. So the owner sync (`archiving/repositoryCopiesPass.ts`, never the anonymous preview) asks the repositories themselves, for every journal article with a DOI in the two lists — the ones OpenAlex calls closed first, then the ones open at the publisher only: HAL for every work due (fast, and where nearly every copy was), a few calls at a time within half the budget, then Europe PMC and OpenAIRE in order for the works HAL did not settle with a **file**, while the budget lasts. What they answer is stored on the item as `meta.repositoryCopies` (source, id, link, whether a file is open on it, the host's name, the date recorded) with the same attempt / answer stamps as the OA.Works record, and is stripped from every public surface with it (`tests/repository-copies-fields.test.ts`).

| Source     | Call (keyless; the `mailto` travels in the User-Agent)                                        | A copy is                                                                                                                                                                  | A file is                               |
| ---------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| HAL        | `api.archives-ouvertes.fr/search/?q=doiId_s:"<doi>"`                                          | each record for the DOI, the ones with a file first                                                                                                                        | `openAccess_bool`                       |
| Europe PMC | `www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:<doi>`                             | a result with `inEPMC` = Y and a PMCID                                                                                                                                     | always — the full text is in Europe PMC |
| OpenAIRE   | `api.openaire.eu/graph/v1/researchProducts?pid=<doi>` (with the access token when configured) | a record OpenAIRE marks green — a copy is open in a repository it harvests — pointed at the OpenAIRE record page (its instances do not say which page is the repository's) | always (green = a file in a repository) |

Bounds: one sync answers for the whole CV — every work due is queued, no cap, and the budget is 25 seconds. HAL is asked for every work due, four calls at a time, within half the budget (a hanging HAL cannot starve the rest); then Europe PMC → OpenAIRE, four works at a time, for the works HAL did not settle with a file, while the budget lasts; never-examined works first, then the ones answered longest ago; a work answered within 7 days is not asked again; at most 3 copies kept per source and 8 per work. Zenodo is not asked: OpenAIRE harvests it, and it found nothing on 51 DOIs at a second per call. What is stored is settled source by source: a source that answered this sync (copies, or none) replaces what it said before; a source that failed, or was not reached before the budget ran out, keeps its stored copies. A work is answered — and not asked again within the window — when a file was found or every source answered; otherwise only the attempt is stamped and the work returns behind the never-examined ones, its notices already stored. (Before, one source after another of one work before the next, 20 works per sync: 7 of 52 reached in 12 s, then a fifth of a 105-work CV per sync — several syncs to a correct tab, which is no correct tab.)

What the worklist does with them:

- **A copy with a file anywhere** — the paper is open in a repository, whatever OpenAlex says: it leaves both lists of the Open access tab (`inRepositoryAlready` in `depositNow.ts`). It is the only ground on which a closed paper is dropped without a deposit.
- **A HAL notice without a file** — the HAL route goes to that notice instead of the deposit form (`DepositRoute.notice`), a fresh deposit would duplicate it. The action reads "Add the _version_ to your HAL notice hal-…" with the version the ground allows, and the form note says why; the paste-the-DOI note is not shown. The notice page counts as HAL for the record's locations and the per-paper chips (`placeKindOf`).
- **Never asked** — a work with a DOI and neither stamp (`copiesUnchecked`: no attempt, no answer) sits in a closed third fold, "Papers not checked yet", by title only: no action, and the claim "no open copy found" is never made before a sync asked. A work the sync did ask stays in the lists even when a source failed or the budget cut the last one: HAL answered in phase 1 and its notices are stored.
- A notice in Europe PMC or OpenAIRE without a file changes nothing: none of them takes a file added to someone else's record.

Known limitations: `openAccess_bool` is HAL's own word for an open file on the record; OpenAIRE's green, like a HAL record under the DOI, counts a preprint-server copy as a copy; OpenAIRE's access rights lag the repositories they harvest; a source that throws or fails is a failure of that source alone (retried later), never of the sync; the pass runs only on a sync, and one sync covers a CV; a work a spent budget never reached sits in the "not checked yet" fold until a sync has asked. OpenAIRE's anonymous quota is 60 calls an hour per address — the pass sends the cached access token (`openaire/auth.ts`, `OPENAIRE_REFRESH_TOKEN`), and a failed source never withdraws a paper from the lists.

## Analytics

A click on any place sends one cookieless Plausible event, `Deposit route`, with a single property `kind` (`funder`, `own`, `national`, `zenodo` or `shareyourpaper`) — never the DOI, the destination or anything about the person (`src/lib/analytics/track.ts`). To see it in Plausible, add a custom-event goal named `Deposit route` and the custom property `kind`.

Plausible's **outbound-link tracking** is switched on for this site (read off the live `pa-*.js` configuration on 2026-09-15), and its event carries the clicked URL — which, for the ShareYourPaper link, holds the paper's DOI. The init script's `transformRequest` (`src/lib/analytics/plausibleInit.ts`) keeps only the origin of every outbound URL before the request leaves the browser, so only the destination is recorded.
