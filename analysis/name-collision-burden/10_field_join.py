"""10 - Join the census to the extracted field + first-active-year.

Produces the table the field/career-adjusted regression (11) reads: the per-author census
(stratum, work count, the three collision counts) left-joined to the discipline and first active
year from 09. Authors with no level-0 concept get field 'Unknown'; authors with no recorded
activity year keep a missing first_year (dropped by the extended model in 11).
"""
import duckdb, os


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


WORK = os.environ.get("OA_WORK", "./build")
con = duckdb.connect()
con.execute("PRAGMA threads=8")
con.execute(f"PRAGMA temp_directory='{_q(WORK)}/tmp'")
con.execute("PRAGMA memory_limit='16GB'")

con.execute(f"""COPY (
  SELECT c.grp, c.wc, c.m_orcid, c.m_full, c.m_init,
         COALESCE(f.field, 'Unknown') AS field,
         f.first_year
  FROM read_parquet('{_q(WORK)}/census_full.parquet') c
  LEFT JOIN read_parquet('{_q(WORK)}/parts_field/*.parquet') f ON f.aid = c.aid
) TO '{_q(WORK)}/census_field.csv' (HEADER)""")

r = con.execute(f"""SELECT count(*), count(*) FILTER (WHERE field <> 'Unknown'), count(first_year)
                    FROM read_csv_auto('{_q(WORK)}/census_field.csv')""").fetchone()
print(f"joined rows={r[0]:,}  field-known={100*r[1]/r[0]:.1f}%  first_year-known={100*r[2]/r[0]:.1f}%")
print("DONE -> census_field.csv")
