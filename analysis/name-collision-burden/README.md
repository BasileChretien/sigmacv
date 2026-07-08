# Name-collision burden in OpenAlex — analysis code

Code to measure, over the full population of ORCID-bearing authors in three
name-origin strata, how many distinct OpenAlex author identities share each
researcher's normalized name, under three matching strategies: full name; full name
restricted to ORCID-bearing entities (a lower bound on distinct real people); and
first-initial-plus-surname (the legacy worst case).

The input is the public **OpenAlex** authors snapshot (<https://openalex.org>). No
OpenAlex data are redistributed here — this folder contains only the analysis code.

## Input

The authors entities of an OpenAlex data snapshot, as the gzipped JSON-Lines
partitions OpenAlex publishes (e.g. `.../data/authors/updated_date=*/part_*.gz`).
See <https://docs.openalex.org/download-all-data/openalex-snapshot>.

## Configuration

Each script reads three paths from environment variables (with local defaults):

| Variable      | Meaning                                             | Default                            |
| ------------- | --------------------------------------------------- | ---------------------------------- |
| `OA_SNAPSHOT` | the snapshot's `data/authors` directory (input)     | `./openalex-snapshot/data/authors` |
| `OA_WORK`     | scratch dir for intermediate Parquet / DuckDB files | `./build`                          |
| `OA_OUT`      | output dir for result tables, the figure, and JSON  | `./out`                            |

## Requirements

- Python 3.12+ with `duckdb`, `matplotlib`, `numpy`.
- R 4.x with `MASS` (optionally `data.table`, `jsonlite`).

## Reproducibility

- **Snapshot.** The reported figures use the **March 2026 monthly OpenAlex authors snapshot**, the
  OpenAlex full-dataset release published in March 2026 (download instructions:
  <https://docs.openalex.org/download-all-data/openalex-snapshot>). OpenAlex ships each release in
  dated `updated_date=*` partition directories; record the release you download so the exact input
  is pinned. The fingerprint below is the **output of steps 1–2 on that snapshot in our run**, not
  an OpenAlex release note: after deduplication by author id it yields ~113.6 million author
  entities, ~8.15 million (7.2%) carrying an ORCID iD. A re-run on the same release should
  reproduce these up to OpenAlex's month-to-month drift.
- **Compute.** The scripts run DuckDB with 8 threads and a 16 GB memory limit (see the `PRAGMA`
  settings near the top of each Python script; lower them for a smaller machine). Extracting and
  aggregating the full authors snapshot takes roughly one to one-and-a-half hours on a
  workstation; the full-population regressions (`05`, `11`) run in a few minutes each in R.
- **Determinism.** All counts and statistics are exact functions of the snapshot; the only
  randomness is the 50,000-per-stratum subsample used for the figure (`03`, `07`), drawn with a
  fixed hash ordering, which does not affect any reported number.

## Pipeline (run in order)

1. `01_extract_authors.py` — read the snapshot partitions into per-partition Parquet (id, name, orcid, works_count, last-known-institution country).
2. `02_aggregate.py` — deduplicate by author id, normalize names, and build the per-name collision aggregations.
3. `03_census_stats.py` — per-stratum medians, percentiles, threshold shares, and rank-biserial effect sizes; writes a 50,000-per-stratum subsample (for the figure) and a summary JSON.
4. `04_export_for_regression.py` — export the census to a CSV for R.
5. `05_regression.R` — full-population negative-binomial (and Poisson) productivity-adjusted regression; writes the incidence-rate ratios.
6. `06_orcid_distinct_robustness.py` — recompute the ORCID-restricted metric deduplicating by distinct ORCID iD string (robustness check).
7. `07_figure.py` — render the three-panel box-plot figure from the subsample.

## Sensitivity analyses

These test the two main threats to the interpretation (that affiliation country is a weak proxy
for name origin, and that the gap is a field-composition or cohort artifact). They reuse the
intermediate tables from steps 1–3, so run those first.

8. `08_surname_sensitivity.py` — reclassify the whole ORCID-bearing population by romanized
   surname (East-Asian vs not), independent of country; recompute the collision contrast and
   cross-tabulate surname-origin against the country strata (diaspora leakage). Reads the
   `authors`/`agg_full`/`agg_init` tables from step 2.
9. `09_field_extract.py` — extract a discipline (top-scored level-0 OpenAlex concept) and a
   career-stage proxy (first active year) per author from the snapshot. Needs `OA_SNAPSHOT`.
10. `10_field_join.py` — left-join the census (step 3's `census_full.parquet`) to the field /
    first-active-year extract, producing `census_field.csv`.
11. `11_field_regression.R` — re-fit the productivity-adjusted Poisson regression with field and
    career age added, reporting the East-Asian incidence-rate ratio before and after adjustment.

## Name-origin strata (proxied by last-known-institution country)

- **East Asian:** JP, CN, KR, TW, HK
- **Anglophone:** US, GB, AU, CA, NZ, IE
- **Other** (continental-European and Brazilian, Latin-script): FR, DE, ES, IT, PT, NL, SE, PL, BR

Country is a deliberately coarse proxy for name origin and is used only at the
aggregate level; no result is attached to any identifiable individual.

## License

Apache-2.0 (same as the repository).
