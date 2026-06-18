"""04 - Export the census to a CSV for the R regression (05)."""
import duckdb, os


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


WORK = os.environ.get("OA_WORK", "./build")
con = duckdb.connect()
con.execute("PRAGMA threads=8")
con.execute(f"""COPY (
  SELECT grp, wc, m_orcid, m_full, m_init
  FROM read_parquet('{_q(WORK)}/census_full.parquet')
) TO '{_q(WORK)}/census_for_r.csv' (HEADER)""")
n = con.execute(f"SELECT count(*) FROM read_parquet('{_q(WORK)}/census_full.parquet')").fetchone()[0]
print(f"exported {n} rows -> census_for_r.csv")
