"""01 - Extract OpenAlex author entities from a local snapshot.

Reads the gzipped JSON-Lines author partitions of an OpenAlex snapshot and writes one
Parquet file per partition with the few fields the analysis needs. Resumable: a
partition whose Parquet already exists is skipped.
"""
import duckdb, time, os, glob


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


SNAPSHOT = os.environ.get("OA_SNAPSHOT", "./openalex-snapshot/data/authors")
WORK = os.environ.get("OA_WORK", "./build")
PARTS = os.path.join(WORK, "parts")
os.makedirs(PARTS, exist_ok=True)
os.makedirs(os.path.join(WORK, "tmp"), exist_ok=True)

con = duckdb.connect()
con.execute("PRAGMA threads=8")
con.execute(f"PRAGMA temp_directory='{_q(WORK)}/tmp'")

parts = sorted(glob.glob(os.path.join(SNAPSHOT, "updated_date=*")))
print(f"{len(parts)} partitions under {SNAPSHOT}")
t0 = time.time()
done = 0
for pdir in parts:
    nm = os.path.basename(pdir).replace("updated_date=", "")
    outpq = os.path.join(PARTS, f"p_{nm}.parquet").replace("\\", "/")
    if os.path.exists(outpq):
        done += 1
        continue
    gz = pdir.replace("\\", "/").rstrip("/") + "/*.gz"
    t = time.time()
    # ignore_errors tolerates the rare malformed or oversized record in the public
    # snapshot so the multi-GB extraction does not abort on a single bad line; such
    # records are a negligible fraction and do not affect the aggregate statistics.
    con.execute(f"""
      COPY (
        SELECT regexp_replace(id, '^https://openalex.org/', '') AS aid,
               display_name AS name, orcid, works_count AS wc,
               try(last_known_institutions[1].country_code) AS country
        FROM read_json('{_q(gz)}', format='newline_delimited',
                       maximum_object_size=50000000, ignore_errors=true)
      ) TO '{_q(outpq)}' (FORMAT parquet, COMPRESSION zstd);
    """)
    done += 1
    print(f"[{done}/{len(parts)}] {nm} {round(time.time()-t,1)}s")

n = con.execute(f"SELECT count(*), count(orcid), count(country) FROM '{_q(PARTS)}/*.parquet'").fetchone()
print(f"DONE: rows={n[0]:,} orcid={n[1]:,} country={n[2]:,} in {round(time.time()-t0,1)}s")
