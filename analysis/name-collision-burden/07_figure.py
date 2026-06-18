"""07 - Three-panel box-plot figure of the name-collision burden by stratum.

Renders one panel per matching strategy (ORCID-restricted, full name, initial+surname)
on a shared logarithmic x-axis, from the 50,000-per-stratum subsample written by 03.
"""
import os, sys, collections

try:
    import duckdb
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
except Exception as e:
    print("missing dependency:", e)
    sys.exit(3)

OUT = os.environ.get("OA_OUT", "./out")
csv = f"{OUT}/namesake-subsample.csv"

con = duckdb.connect()
rows = con.execute(
    f'SELECT "group" g, namesake_full f, namesake_full_orcid o, namesake_initial i '
    f"FROM read_csv_auto('{csv}')"
).fetchall()
data = collections.defaultdict(lambda: {"f": [], "o": [], "i": []})
for g, f, o, i in rows:
    data[g]["f"].append(f); data[g]["o"].append(o); data[g]["i"].append(i)

strata = ["east_asian", "anglophone", "other"]
labels = {"east_asian": "East-Asian", "anglophone": "Anglophone", "other": "Other"}
metrics = [("o", "Full name, ORCID-restricted\n(distinct real people)"),
           ("f", "Full name, all entities\n(upper bound)"),
           ("i", "Initial + surname\n(legacy worst case)")]

fig, axes = plt.subplots(1, 3, figsize=(11, 3.6), sharey=True)
for ax, (mk, mt) in zip(axes, metrics):
    bd = [np.clip(np.array(data[s][mk], dtype=float), 1, None) for s in strata]
    bp = ax.boxplot(bd, vert=False, showfliers=False, widths=0.62, patch_artist=True,
                    medianprops=dict(color="#1e3a8a", linewidth=2.2),
                    whiskerprops=dict(color="#475569"), capprops=dict(color="#475569"))
    for patch, s in zip(bp["boxes"], strata):
        patch.set_facecolor("#93c5fd" if s == "east_asian" else "#d1d5db")
        patch.set_edgecolor("#2563eb" if s == "east_asian" else "#6b7280")
    ax.set_xscale("log")
    ax.set_yticks(range(1, len(strata) + 1)); ax.set_yticklabels([labels[s] for s in strata])
    ax.set_title(mt, fontsize=9.5)
    ax.set_xlabel("author entities sharing the name (log scale)", fontsize=8.5)
    ax.grid(axis="x", which="both", color="#eef2f7", linewidth=0.7)
fig.suptitle("Name-collision burden by name-origin stratum (OpenAlex; 50,000-per-stratum "
             "subsample shown; box = IQR, whisker = 1.5x IQR)", fontsize=10)
fig.tight_layout(rect=[0, 0, 1, 0.93])
fig.savefig(f"{OUT}/namesake-figure.svg")
fig.savefig(f"{OUT}/namesake-figure.png", dpi=200)
print("DONE -> namesake-figure.svg, namesake-figure.png")
