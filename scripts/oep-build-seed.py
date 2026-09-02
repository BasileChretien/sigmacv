#!/usr/bin/env python3
"""
Build the Open Editors Plus seed for SigmaCV.

Reads the OEP parquet (editorial-board scrape, ~922k rows) and emits a compact,
gzip-compressed NDJSON of every row the app can attribute to a researcher BY
IDENTIFIER, tagged with how strong that identifier is:

  scraped     the publisher printed this ORCID on the masthead   -> auto-include
  propagated  OEP inferred the ORCID from another row of the      -> candidate
              same unambiguous editor name
  openalex    no ORCID; OEP resolved an OpenAlex author ID by     -> candidate
              name+institution (oa_match_method name_ror/name_only)

Rows with no identifier at all are skipped -- the app never matches a name as
text. Emitting only the "scraped" tier (the previous behaviour) dropped roughly
two thirds of the dataset, worst of all for editors-in-chief, under two fifths
of whom carry a scraped ORCID.

Deduped on (orcid, openalexAuthorId, journal, role).

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


# OEP's own provenance column for an ORCID it inferred rather than scraped.
PROPAGATED_SOURCE = "propagated_name_unique"
# oa_match_method values that mean "resolved by name", not by identifier.
NAME_MATCH_METHODS = {"name_ror", "name_only"}


def classify(row, orcid):
    """Return (trust, openalex_author_id) for one OEP row, or (None, None).

    Trust reflects how the row was tied to a person, so the app can
    auto-include what a publisher actually printed and hold the rest for
    the user to confirm.
    """
    if orcid:
        source = (clean(row.get("orcid_source")) or "").lower()
        return ("propagated" if source == PROPAGATED_SOURCE else "scraped"), None
    author_id = clean(row.get("openalex_author_id"))
    method = (clean(row.get("oa_match_method")) or "").lower()
    if author_id and method in NAME_MATCH_METHODS:
        return "openalex", author_id
    return None, None


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    cols = ["orcid", "orcid_source", "openalex_author_id", "oa_match_method",
            "journal", "role", "role_std", "publisher", "issn_l"]
    table = pq.read_table(SRC, columns=cols)
    rows = table.to_pylist()

    seen = set()
    written = 0
    by_trust = {"scraped": 0, "propagated": 0, "openalex": 0}
    total = len(rows)
    with gzip.open(OUT, "wt", encoding="utf-8", compresslevel=9) as f:
        for r in rows:
            orcid = norm_orcid(r.get("orcid"))
            journal = clean(r.get("journal"))
            role = clean(r.get("role")) or clean(r.get("role_std"))
            if not journal or not role:
                continue

            trust, author_id = classify(r, orcid)
            if trust is None:
                continue  # no identifier -> never seeded

            key = (orcid or "", author_id or "", journal.lower(), role.lower())
            if key in seen:
                continue
            seen.add(key)
            by_trust[trust] += 1
            rec = {
                "orcid": orcid,
                "openalexAuthorId": author_id,
                "trust": trust,
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
    distinct = len({k[0] for k in seen if k[0]})
    print(f"source rows      : {total}")
    print(f"written          : {written}")
    for tier, n in by_trust.items():
        print(f"  {tier:<14} : {n}")
    print(f"distinct ORCIDs  : {distinct}")
    print(f"output           : {OUT}")
    print(f"output size      : {size/1e6:.1f} MB (gzip)")


if __name__ == "__main__":
    main()
