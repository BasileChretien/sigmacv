# Name-collision burden benchmark (tool-paper §3.5)

Public-data benchmark that substantiates SigmaCV's load-bearing design rule —
**attribute the account holder by persistent identifier (ORCID / OpenAlex ID),
never by name string** (paper principle P2).

## What it measures

For ORCID-bearing researchers sampled across name-origin strata, **how many
distinct OpenAlex author identities share the researcher's printed name** and would
therefore be conflated by any name-string attribution. Identifier matching
collapses that set to one. This is a _mechanical property of the matching strategy_
— **not** an attribution-error rate.

## Ethics / scope boundary (deliberate)

- **Public OpenAlex metadata only.** No human subjects, no consent events, no
  account-holder adjudications.
- It makes **no** claim about a real attribution-_error_ rate and computes **no**
  bibliometric (e.g. h-index) distortion.
- The adjudicated error rate, its bibliometric distortion, and its **equity**
  dimensions are the separate, consent-based, IRB-governed **Study 2**
  ([`../../preregistration/study-2-disambiguation-error.md`](../../preregistration/study-2-disambiguation-error.md)).
  This benchmark sets that study up; it does not pre-empt it.

## Reproduce

```bash
npx tsx scripts/benchmark-namesake-ambiguity.ts          # full run (130/group)
npx tsx scripts/benchmark-namesake-ambiguity.ts --smoke  # tiny run (8/group)
# OPENALEX_MAILTO is read from the environment for the polite pool (falls back to
# the maintainer contact). Outputs overwrite the files in this directory.
```

`sample` + a fixed `seed` make the draw reproducible **for a given OpenAlex index
snapshot**; counts drift as the index grows, so results are stamped with a snapshot
date (`SNAPSHOT_DATE` in the script).

## Files

| File                    | Contents                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `namesake-results.json` | Aggregates per stratum + overall (median, IQR, p90, p99, max, %≥2/≥10/≥100) + run metadata                     |
| `namesake-raw.csv`      | Per-author rows (group, OpenAlex id, name, country, works, CJK-script flag, namesake counts) — all public data |
| `namesake-figure.svg`   | Figure 1 (box plot, log scale)                                                                                 |
| `run.log`               | Console log of the run that produced the committed results                                                     |

## Headline result (OpenAlex 2026-06-11, n = 390)

| Stratum                        | Median namesakes |    Max | ≥100 namesakes |
| ------------------------------ | ---------------: | -----: | -------------: |
| East Asian (JP/CN/KR/TW/HK)    |               13 | 15,833 |            30% |
| Anglophone (US/GB/AU/CA/NZ/IE) |                2 |  4,369 |             6% |
| Other European (FR/DE/…/BR)    |                2 |  4,369 |             3% |

The country strata are a coarse proxy for name origin; romanized East-Asian names
held at Western institutions leak into the Western strata's tails, so the
between-group gap is a **conservative** lower bound. See paper §3.5 for full
interpretation and limitations.
