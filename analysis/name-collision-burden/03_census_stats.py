"""03 - Per-stratum collision statistics, effect sizes, subsample, summary JSON.

Enumerates every ORCID-bearing author in the three name-origin strata and reports, for
each metric, the exact population median / IQR / p90 and the share colliding with at
least 2, 10, and 100 identities, plus the rank-biserial effect size (East Asian vs each
comparison stratum). Writes a 50,000-per-stratum subsample for the figure.
"""
import duckdb, os, json

WORK = os.environ.get("OA_WORK", "./build")
OUT = os.environ.get("OA_OUT", "./out")
os.makedirs(OUT, exist_ok=True)
DB = f"{WORK}/analyze.duckdb"

con = duckdb.connect(DB)
con.execute("PRAGMA threads=8")
con.execute(f"PRAGMA temp_directory='{WORK}/tmp'")
con.execute("PRAGMA memory_limit='16GB'")

EA = ("JP", "CN", "KR", "TW", "HK")
AN = ("US", "GB", "AU", "CA", "NZ", "IE")
OT = ("FR", "DE", "ES", "IT", "PT", "NL", "SE", "PL", "BR")
inlist = ",".join(repr(c) for c in (EA + AN + OT))

con.execute(f"""
CREATE OR REPLACE TABLE census AS
SELECT CASE WHEN a.country IN {EA} THEN 'east_asian'
            WHEN a.country IN {AN} THEN 'anglophone' ELSE 'other' END AS grp,
       a.aid, a.wc, af.n_all AS m_full, af.n_orcid AS m_orcid, ai.n_all AS m_init
FROM authors a
JOIN agg_full af ON af.nm = a.nfull
JOIN agg_init ai ON ai.nm = a.ninit
WHERE a.has_orcid AND a.country IN ({inlist})
""")
sizes = dict(con.execute("SELECT grp, count(*) FROM census GROUP BY grp").fetchall())

metrics = [("orcid", "m_orcid"), ("full", "m_full"), ("init", "m_init")]
summary = {"sizes": sizes}
for g in ("east_asian", "anglophone", "other"):
    summary[g] = {}
    for key, m in metrics:
        r = con.execute(f"""SELECT count(*), median({m}), quantile_cont({m},0.25), quantile_cont({m},0.75),
            quantile_cont({m},0.9), max({m}), avg({m}),
            100.0*count(*) FILTER (WHERE {m}>=2)/count(*),
            100.0*count(*) FILTER (WHERE {m}>=10)/count(*),
            100.0*count(*) FILTER (WHERE {m}>=100)/count(*)
            FROM census WHERE grp='{g}'""").fetchone()
        summary[g][key] = dict(n=r[0], median=round(r[1], 1), q1=round(r[2], 1), q3=round(r[3], 1),
                               p90=round(r[4], 1), max=int(r[5]), mean=round(r[6], 1),
                               pct2=round(r[7], 1), pct10=round(r[8], 1), pct100=round(r[9], 2))

def rbis(m, gB):  # East Asian vs gB; negative => East Asian higher
    q = f"""WITH u AS (SELECT grp, {m} AS v FROM census WHERE grp IN ('east_asian','{gB}')),
        rn AS (SELECT grp, v, row_number() OVER (ORDER BY v) AS rn FROM u),
        ar AS (SELECT grp, avg(rn) OVER (PARTITION BY v) AS arank FROM rn)
        SELECT sum(arank) FILTER (WHERE grp='east_asian'), count(*) FILTER (WHERE grp='east_asian'),
               count(*) FILTER (WHERE grp='{gB}') FROM ar"""
    R, na, nb = con.execute(q).fetchone()
    U = R - na * (na + 1) / 2.0
    return round(1 - 2 * U / (na * nb), 3)

summary["effect"] = {}
for key, m in metrics:
    summary["effect"][key] = dict(ea_vs_anglophone=rbis(m, "anglophone"), ea_vs_other=rbis(m, "other"))

con.execute(f"""COPY (
  SELECT "group", openalex_id, works_count, namesake_full, namesake_full_orcid, namesake_initial FROM (
    SELECT grp AS "group", aid AS openalex_id, wc AS works_count, m_full AS namesake_full,
           m_orcid AS namesake_full_orcid, m_init AS namesake_initial,
           row_number() OVER (PARTITION BY grp ORDER BY hash(aid)) AS rk FROM census)
  WHERE rk <= 50000
) TO '{OUT}/namesake-subsample.csv' (HEADER)""")
con.execute(f"COPY census TO '{WORK}/census_full.parquet' (FORMAT parquet, COMPRESSION zstd)")
json.dump(summary, open(f"{OUT}/namesake-summary.json", "w"), indent=2)
print("DONE -> namesake-summary.json, namesake-subsample.csv")
