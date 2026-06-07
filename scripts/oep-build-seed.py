#!/usr/bin/env python3
"""
Build the Open Editors Plus seed for SigmaCV.

Reads the OEP parquet (editorial-board scrape, ~922k rows) and emits a compact,
gzip-compressed NDJSON of ONLY the rows that carry an ORCID — the subset the app
can actually attribute to a researcher. Deduped on (orcid, journal, role).

Output is what `scripts/oep-import.mjs` loads into the OepEditorialRole table.

Usage:
    python scripts/oep-build-seed.py [SRC_PARQUET] [OUT_NDJSON_GZ]
Defaults:
    SRC = Open_editors_plus/openeditors_plus_2026.parquet
    OUT = prisma/seed-data/oep-editorial-roles.ndjson.gz
"""
import gzip
import json
import os
import sys

import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    ROOT, "Open_editors_plus", "openeditors_plus_2026.parquet"
)
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    ROOT, "prisma", "seed-data", "oep-editorial-roles.ndjson.gz"
)

ORCID_RE = None  # we trust OEP's bare form, but normalize defensively below.


def norm_orcid(v):
    if not v:
        return None
    s = str(v).strip()
    # Strip a URL prefix if present, keep the 0000-0000-0000-000X core.
    s = s.replace("https://orcid.org/", "").replace("http://orcid.org/", "").strip("/")
    s = s.strip()
    return s or None


def clean(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    cols = ["orcid", "journal", "role", "role_std", "publisher", "issn_l"]
    table = pq.read_table(SRC, columns=cols)
    rows = table.to_pylist()

    seen = set()
    written = 0
    total = len(rows)
    with gzip.open(OUT, "wt", encoding="utf-8", compresslevel=9) as f:
        for r in rows:
            orcid = norm_orcid(r.get("orcid"))
            journal = clean(r.get("journal"))
            role = clean(r.get("role")) or clean(r.get("role_std"))
            if not orcid or not journal or not role:
                continue
            key = (orcid, journal.lower(), role.lower())
            if key in seen:
                continue
            seen.add(key)
            rec = {
                "orcid": orcid,
                "journal": journal,
                "role": role,
                "roleStd": clean(r.get("role_std")),
                "publisher": clean(r.get("publisher")),
                "issn": clean(r.get("issn_l")),
            }
            f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")))
            f.write("\n")
            written += 1

    size = os.path.getsize(OUT)
    distinct = len({k[0] for k in seen})
    print(f"source rows      : {total}")
    print(f"written (orcid)  : {written}")
    print(f"distinct ORCIDs  : {distinct}")
    print(f"output           : {OUT}")
    print(f"output size      : {size/1e6:.1f} MB (gzip)")


if __name__ == "__main__":
    main()
