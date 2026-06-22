"""09 - Extract a discipline and a career-stage proxy per author for the field/career check.

For the field/career-adjusted sensitivity regression (reviewer concern: is the gap a
field-composition or cohort artifact?), extract for every author a discipline (the top-scored
level-0 OpenAlex concept) and a career-stage proxy (first active year = the minimum year in
counts_by_year), straight from the snapshot partitions. Resumable: a partition whose Parquet
already exists is skipped.

The columns are forced (rather than inferred) because low-activity authors have an empty
`topics`/`x_concepts` list, which would otherwise make schema inference resolve the field to NULL.
"""
import duckdb, time, os, glob


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


SNAPSHOT = os.environ.get("OA_SNAPSHOT", "./openalex-snapshot/data/authors")
WORK = os.environ.get("OA_WORK", "./build")
PARTS = os.path.join(WORK, "parts_field")
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
    outpq = os.path.join(PARTS, f"f_{nm}.parquet").replace("\\", "/")
    if os.path.exists(outpq):
        done += 1
        continue
    gz = pdir.replace("\\", "/").rstrip("/") + "/*.gz"
    t = time.time()
    con.execute(f"""COPY (
      SELECT regexp_replace(id, '^https://openalex.org/', '') AS aid,
             list_filter(x_concepts, c -> c."level" = 0)[1].display_name AS field,
             list_min([c."year" for c in counts_by_year]) AS first_year
      FROM read_json('{_q(gz)}', format='newline_delimited',
             maximum_object_size=50000000, ignore_errors=true,
             columns={{'id': 'VARCHAR',
                       'x_concepts': 'STRUCT(display_name VARCHAR, "level" BIGINT, score DOUBLE)[]',
                       'counts_by_year': 'STRUCT("year" BIGINT)[]'}})
    ) TO '{_q(outpq)}' (FORMAT parquet, COMPRESSION zstd)""")
    done += 1
    print(f"[{done}/{len(parts)}] {nm} {round(time.time()-t,1)}s")

n = con.execute(f"SELECT count(*), count(field), count(first_year) FROM '{_q(PARTS)}/*.parquet'").fetchone()
print(f"DONE: rows={n[0]:,} field={n[1]:,} first_year={n[2]:,} in {round(time.time()-t0,1)}s")
