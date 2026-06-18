"""02 - Deduplicate, normalize names, and build per-name collision aggregations.

A name is normalized by lower-casing, accent-folding, whitespace-collapsing, and
trimming; tokens are kept in printed order. The initial form is the first character
of the normalized name plus its final whitespace-delimited token. Author entities are
deduplicated by OpenAlex author id; rows with no id or no name, and names shorter than
three characters, are dropped.
"""
import duckdb, os


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


WORK = os.environ.get("OA_WORK", "./build")
PARTS = f"{WORK}/parts/*.parquet"
DB = f"{WORK}/analyze.duckdb"

con = duckdb.connect(DB)
con.execute("PRAGMA threads=8")
con.execute(f"PRAGMA temp_directory='{_q(WORK)}/tmp'")
con.execute("PRAGMA memory_limit='16GB'")

con.execute(f"""
CREATE OR REPLACE TABLE authors AS
WITH base AS (
  SELECT aid, any_value(name) AS name, any_value(orcid) AS orcid,
         any_value(wc) AS wc, any_value(country) AS country
  FROM read_parquet('{_q(PARTS)}')
  WHERE aid IS NOT NULL AND name IS NOT NULL
  GROUP BY aid),
norm AS (
  SELECT aid, orcid, wc, country, name,
         trim(regexp_replace(lower(strip_accents(name)), '\\s+', ' ', 'g')) AS nfull
  FROM base)
SELECT aid, (orcid IS NOT NULL) AS has_orcid, COALESCE(wc,0) AS wc, country, nfull,
       CASE WHEN position(' ' IN nfull) > 0
            THEN substr(nfull,1,1) || ' ' || regexp_extract(nfull, '([^ ]+)$', 1)
            ELSE nfull END AS ninit
FROM norm WHERE length(nfull) >= 3
""")

con.execute("""CREATE OR REPLACE TABLE agg_full AS
  SELECT nfull AS nm, count(*) AS n_all, count(*) FILTER (WHERE has_orcid) AS n_orcid
  FROM authors GROUP BY nfull""")
con.execute("""CREATE OR REPLACE TABLE agg_init AS
  SELECT ninit AS nm, count(*) AS n_all FROM authors GROUP BY ninit""")

n = con.execute("SELECT count(*), count(*) FILTER (WHERE has_orcid) FROM authors").fetchone()
print(f"authors={n[0]:,} orcid={n[1]:,} ({round(100*n[1]/max(n[0],1),3)}%)")
print(f"DONE -> agg_full, agg_init in {DB}")
