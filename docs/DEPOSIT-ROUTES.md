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

**Under the action**, what the record asks of the form: the licence ("In the form, set the licence to …" — Zenodo's form preselects CC BY), and the embargo while it runs (an end date still ahead, or a duration after publication when only the months are recorded). Not for a funder repository, which sets the release itself. For Zenodo, when the work has a DOI: answer "No" to "Do you already have a DOI for this upload?" and add the DOI under "Related works" — otherwise the deposit takes the publisher's DOI as its own. Zenodo's form is in English, so every locale quotes its labels in English.

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

## Analytics

A click on any place sends one cookieless Plausible event, `Deposit route`, with a single property `kind` (`funder`, `own`, `national`, `zenodo` or `shareyourpaper`) — never the DOI, the destination or anything about the person (`src/lib/analytics/track.ts`). To see it in Plausible, add a custom-event goal named `Deposit route` and the custom property `kind`.

Plausible's **outbound-link tracking** is switched on for this site (read off the live `pa-*.js` configuration on 2026-09-15), and its event carries the clicked URL — which, for the ShareYourPaper link, holds the paper's DOI. The init script's `transformRequest` (`src/lib/analytics/plausibleInit.ts`) keeps only the origin of every outbound URL before the request leaves the browser, so only the destination is recorded.
