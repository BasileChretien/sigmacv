"""06 - Robustness: does the ORCID-restricted metric survive deduplicating by distinct
ORCID iD string rather than by OpenAlex author entity?

Recomputes the real-person metric both ways (distinct ORCID strings vs. ORCID-bearing
entities) per stratum, straight from the extracted partitions, and reports both so the
two can be compared.
"""
import duckdb, os, json


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


WORK = os.environ.get("OA_WORK", "./build")
OUT = os.environ.get("OA_OUT", "./out")
os.makedirs(OUT, exist_ok=True)
PARTS = f"{WORK}/parts/*.parquet"

con = duckdb.connect()
con.execute("PRAGMA threads=8")
con.execute(f"PRAGMA temp_directory='{_q(WORK)}/tmp'")
con.execute("PRAGMA memory_limit='16GB'")

EA = ("JP", "CN", "KR", "TW", "HK")
AN = ("US", "GB", "AU", "CA", "NZ", "IE")
OT = ("FR", "DE", "ES", "IT", "PT", "NL", "SE", "PL", "BR")

con.execute(f"""CREATE TABLE a2 AS
WITH base AS (
  SELECT aid, any_value(name) AS name, any_value(orcid) AS orcid,
         any_value(wc) AS wc, any_value(country) AS country
  FROM read_parquet('{_q(PARTS)}')
  WHERE aid IS NOT NULL AND name IS NOT NULL
  GROUP BY aid),
norm AS (
  SELECT aid, orcid, COALESCE(wc,0) AS wc, country,
         trim(regexp_replace(lower(strip_accents(name)), '\\s+', ' ', 'g')) AS nfull
  FROM base)
SELECT * FROM norm WHERE length(nfull) >= 3""")

con.execute("""CREATE TABLE agg AS SELECT nfull AS nm,
  count(DISTINCT orcid) FILTER (WHERE orcid IS NOT NULL) AS n_distinct,
  count(*)              FILTER (WHERE orcid IS NOT NULL) AS n_entity
  FROM a2 GROUP BY nfull""")

con.execute(f"""CREATE TABLE focal AS
SELECT CASE WHEN a.country IN {EA} THEN 'east_asian'
            WHEN a.country IN {AN} THEN 'anglophone' ELSE 'other' END AS grp,
       a.aid, g.n_distinct, g.n_entity
FROM a2 a JOIN agg g ON g.nm = a.nfull
WHERE a.orcid IS NOT NULL AND a.country IN {EA + AN + OT}""")
sizes = dict(con.execute("SELECT grp, count(*) FROM focal GROUP BY grp").fetchall())

out = {"sizes": sizes}
for col in ("n_distinct", "n_entity"):
    out[col] = {}
    for grp in ("east_asian", "anglophone", "other"):
        r = con.execute(f"""SELECT count(*), median({col}), quantile_cont({col},0.25), quantile_cont({col},0.75),
            quantile_cont({col},0.9),
            100.0*count(*) FILTER (WHERE {col}>=2)/NULLIF(count(*),0),
            100.0*count(*) FILTER (WHERE {col}>=10)/NULLIF(count(*),0),
            100.0*count(*) FILTER (WHERE {col}>=100)/NULLIF(count(*),0)
            FROM focal WHERE grp='{grp}'""").fetchone()
        if not r[0]:  # empty stratum
            out[col][grp] = dict(n=0)
            continue
        out[col][grp] = dict(n=r[0], median=r[1], q1=r[2], q3=r[3], p90=r[4],
                             pct2=round(r[5], 1), pct10=round(r[6], 1), pct100=round(r[7], 2))

def rbis(col, gB):
    q = f"""WITH u AS (SELECT grp, {col} AS v FROM focal WHERE grp IN ('east_asian','{gB}')),
        rn AS (SELECT grp, v, row_number() OVER (ORDER BY v) AS rn FROM u),
        ar AS (SELECT grp, avg(rn) OVER (PARTITION BY v) AS arank FROM rn)
        SELECT sum(arank) FILTER (WHERE grp='east_asian'), count(*) FILTER (WHERE grp='east_asian'),
               count(*) FILTER (WHERE grp='{gB}') FROM ar"""
    R, na, nb = con.execute(q).fetchone()
    if not na or not nb:  # an empty stratum has no defined effect size
        return None
    U = R - na * (na + 1) / 2.0
    return round(1 - 2 * U / (na * nb), 3)

out["effect_distinct"] = {"ea_vs_anglophone": rbis("n_distinct", "anglophone"),
                          "ea_vs_other": rbis("n_distinct", "other")}
json.dump(out, open(f"{OUT}/orcid-distinct-robustness.json", "w"), indent=2, default=float)
print("DONE -> orcid-distinct-robustness.json")
