/**
 * Namesake-ambiguity benchmark (SigmaCV tool/infrastructure paper, "P1").
 * --------------------------------------------------------------------------
 * Measures the NAME-COLLISION BURDEN on *public* OpenAlex metadata: for
 * ORCID-bearing author profiles sampled across name-origin strata, how many
 * DISTINCT OpenAlex author identities share the same printed display name and
 * would therefore be conflated by name-string attribution. Identifier matching
 * collapses that set to one.
 *
 * SCOPE / ETHICS BOUNDARY (deliberate):
 *   - Public bibliographic metadata ONLY. No human-subjects data, no consent
 *     events, no account-holder adjudications.
 *   - This is a MECHANICAL property of two matching strategies (a *design
 *     justification* for SigmaCV's identifier-only rule). It makes NO claim
 *     about a real attribution-ERROR rate, and computes NO h-index distortion.
 *   - The adjudicated error rate, its bibliometric distortion, and its equity
 *     dimensions are the separate, consent-based, IRB-governed Study 2
 *     (docs/preregistration/study-2-disambiguation-error.md) — NOT this script.
 *
 * Reproducibility: OpenAlex `sample` + a fixed `seed` make the draw
 * reproducible *for a given index snapshot*; counts drift as the index grows,
 * so results are stamped with a snapshot date. Re-run: `npx tsx
 * scripts/benchmark-namesake-ambiguity.ts` (add `--smoke` for a tiny run).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAILTO =
  process.env.OPENALEX_MAILTO ?? "chretien.basile.jean.bernard.u4@s.mail.nagoya-u.ac.jp";
const UA = `SigmaCV-namesake-benchmark (mailto:${MAILTO})`;
const API = "https://api.openalex.org";
const SEED = 42;
const SNAPSHOT_DATE = "2026-06-11"; // stamp the OpenAlex snapshot (counts drift)
const OUT_DIR = join("docs", "paper", "benchmark");
const POLITE_DELAY_MS = 120;

const SMOKE = process.argv.includes("--smoke");
const PER_GROUP = SMOKE ? 8 : 130;

/** Pre-specified sampling strata, by last-known-institution country (a coarse
 *  but reproducible proxy for romanization pressure on the printed name). */
const GROUPS: { label: string; key: string; countries: string[] }[] = [
  {
    label: "East Asian (JP/CN/KR/TW/HK)",
    key: "east_asian",
    countries: ["jp", "cn", "kr", "tw", "hk"],
  },
  {
    label: "Anglophone (US/GB/AU/CA/NZ/IE)",
    key: "anglophone",
    countries: ["us", "gb", "au", "ca", "nz", "ie"],
  },
  {
    label: "Other European (FR/DE/ES/IT/PT/NL/SE/PL/BR)",
    key: "other_european",
    countries: ["fr", "de", "es", "it", "pt", "nl", "se", "pl", "br"],
  },
];

/** Han, Hiragana, Katakana, Hangul — presence ⇒ a non-Latin original-script name. */
const CJK_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/u;

interface OAAuthor {
  id: string;
  display_name?: string;
  display_name_alternatives?: string[];
  works_count?: number;
  last_known_institutions?: { country_code?: string | null }[];
}
interface OAList<T> {
  meta?: { count?: number };
  results?: T[];
}

interface Row {
  group: string;
  openalex_id: string;
  display_name: string;
  country: string;
  works_count: number;
  /** true if any original-script alternative name contains CJK characters. */
  cjk_script: boolean;
  /** distinct OpenAlex author profiles sharing the name (all, the real burden). */
  namesake_all: number;
  /** conservative variant: only ORCID-bearing namesakes. */
  namesake_orcid: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function oaGet<T>(pathAndQuery: string): Promise<T> {
  const url = `${API}${pathAndQuery}${pathAndQuery.includes("?") ? "&" : "?"}mailto=${encodeURIComponent(MAILTO)}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
      if (res.status === 429 || res.status >= 500) throw new Error(`status ${res.status}`);
      if (!res.ok) throw new Error(`status ${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(500 * 2 ** attempt); // backoff: 0.5s, 1s, 2s, 4s
    }
  }
  throw new Error("unreachable");
}

/** Count distinct OpenAlex author profiles whose display name matches `name`
 *  under OpenAlex token-based name search (the set name-attribution conflates). */
async function namesakeCount(name: string, orcidOnly: boolean): Promise<number> {
  const filter = orcidOnly
    ? `display_name.search:${encodeURIComponent(name)},has_orcid:true`
    : `display_name.search:${encodeURIComponent(name)}`;
  const data = await oaGet<OAList<unknown>>(`/authors?filter=${filter}&per-page=1`);
  return data.meta?.count ?? 0;
}

async function sampleGroup(countries: string[], k: number): Promise<OAAuthor[]> {
  const filter = `has_orcid:true,last_known_institutions.country_code:${countries.join("|")}`;
  const select = "id,display_name,display_name_alternatives,works_count,last_known_institutions";
  const data = await oaGet<OAList<OAAuthor>>(
    `/authors?filter=${filter}&sample=${k}&seed=${SEED}&per-page=${k}&select=${select}`,
  );
  return data.results ?? [];
}

// ---- aggregation helpers --------------------------------------------------

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const vlo = sorted[lo] ?? 0;
  const vhi = sorted[hi] ?? vlo;
  if (lo === hi) return vlo;
  return vlo + (vhi - vlo) * (pos - lo);
}

interface Summary {
  group: string;
  n: number;
  cjk_n: number;
  mean: number;
  min: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  p99: number;
  max: number;
  pct_ge2: number;
  pct_ge10: number;
  pct_ge100: number;
  cjk_median: number | null;
  non_cjk_median: number | null;
}

function summarize(group: string, rows: Row[]): Summary {
  const vals = rows.map((r) => r.namesake_all).sort((a, b) => a - b);
  const n = vals.length;
  const pct = (pred: (v: number) => boolean) =>
    n === 0 ? 0 : Math.round((100 * vals.filter(pred).length) / n);
  const cjkVals = rows
    .filter((r) => r.cjk_script)
    .map((r) => r.namesake_all)
    .sort((a, b) => a - b);
  const nonCjkVals = rows
    .filter((r) => !r.cjk_script)
    .map((r) => r.namesake_all)
    .sort((a, b) => a - b);
  return {
    group,
    n,
    cjk_n: cjkVals.length,
    mean: n ? Math.round(vals.reduce((a, b) => a + b, 0) / n) : 0,
    min: vals[0] ?? 0,
    p10: Math.round(quantile(vals, 0.1)),
    p25: Math.round(quantile(vals, 0.25)),
    median: Math.round(quantile(vals, 0.5)),
    p75: Math.round(quantile(vals, 0.75)),
    p90: Math.round(quantile(vals, 0.9)),
    p99: Math.round(quantile(vals, 0.99)),
    max: vals[n - 1] ?? 0,
    pct_ge2: pct((v) => v >= 2),
    pct_ge10: pct((v) => v >= 10),
    pct_ge100: pct((v) => v >= 100),
    cjk_median: cjkVals.length ? Math.round(quantile(cjkVals, 0.5)) : null,
    non_cjk_median: nonCjkVals.length ? Math.round(quantile(nonCjkVals, 0.5)) : null,
  };
}

// ---- figure (hand-authored SVG box plot, log10 x-axis) --------------------

function svgFigure(summaries: Summary[]): string {
  const W = 720;
  const rowH = 92;
  const padL = 210;
  const padR = 40;
  const padT = 56;
  const H = padT + summaries.length * rowH + 64;
  const plotW = W - padL - padR;
  const xmax = Math.max(10, ...summaries.map((s) => s.max));
  const logMax = Math.log10(xmax);
  const x = (v: number) => padL + (Math.log10(Math.max(1, v)) / logMax) * plotW;

  const ticks = [1, 10, 100, 1000, 10000].filter((t) => t <= xmax * 1.2);
  const gridlines = ticks
    .map(
      (t) =>
        `<line x1="${x(t).toFixed(1)}" y1="${padT - 8}" x2="${x(t).toFixed(1)}" y2="${H - 48}" stroke="#e5e7eb" stroke-width="1"/>` +
        `<text x="${x(t).toFixed(1)}" y="${H - 30}" font-size="12" fill="#6b7280" text-anchor="middle">${t.toLocaleString("en-US")}</text>`,
    )
    .join("");

  const boxes = summaries
    .map((s, i) => {
      const cy = padT + i * rowH + rowH / 2 - 8;
      const x25 = x(s.p25);
      const x75 = x(s.p75);
      const xMed = x(s.median);
      const xMin = x(Math.max(1, s.min));
      const xMax = x(s.max);
      const xp10 = x(s.p10);
      const xp90 = x(s.p90);
      const half = 16;
      return [
        // whisker p10..p90
        `<line x1="${xp10.toFixed(1)}" y1="${cy}" x2="${xp90.toFixed(1)}" y2="${cy}" stroke="#475569" stroke-width="1.5"/>`,
        `<line x1="${xp10.toFixed(1)}" y1="${cy - 8}" x2="${xp10.toFixed(1)}" y2="${cy + 8}" stroke="#475569" stroke-width="1.5"/>`,
        `<line x1="${xp90.toFixed(1)}" y1="${cy - 8}" x2="${xp90.toFixed(1)}" y2="${cy + 8}" stroke="#475569" stroke-width="1.5"/>`,
        // IQR box
        `<rect x="${x25.toFixed(1)}" y="${cy - half}" width="${Math.max(1, x75 - x25).toFixed(1)}" height="${2 * half}" fill="#93c5fd" fill-opacity="0.55" stroke="#2563eb" stroke-width="1.5"/>`,
        // median
        `<line x1="${xMed.toFixed(1)}" y1="${cy - half}" x2="${xMed.toFixed(1)}" y2="${cy + half}" stroke="#1e3a8a" stroke-width="2.5"/>`,
        // max marker (the tail — the catastrophic conflation)
        `<circle cx="${xMax.toFixed(1)}" cy="${cy}" r="3" fill="#dc2626"/>`,
        // labels
        `<text x="${padL - 14}" y="${cy - 4}" font-size="13" fill="#111827" text-anchor="end" font-weight="600">${s.group.split(" (")[0] ?? s.group}</text>`,
        `<text x="${padL - 14}" y="${cy + 13}" font-size="11" fill="#6b7280" text-anchor="end">n=${s.n} · median ${s.median.toLocaleString("en-US")} · max ${s.max.toLocaleString("en-US")}</text>`,
        `<text x="${(xMin - 6).toFixed(1)}" y="${cy + 4}" font-size="10" fill="#94a3b8" text-anchor="end">${s.min}</text>`,
      ].join("");
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter, Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${padL}" y="28" font-size="16" fill="#111827" font-weight="700">Name-collision burden by name-origin stratum</text>
  <text x="${padL}" y="46" font-size="12" fill="#6b7280">Distinct OpenAlex author identities sharing one printed name (log scale). ORCID-bearing authors, OpenAlex ${SNAPSHOT_DATE}.</text>
  ${gridlines}
  ${boxes}
  <text x="${padL + plotW / 2}" y="${H - 8}" font-size="12" fill="#374151" text-anchor="middle">distinct namesakes conflated by name-string attribution (1 = unambiguous; box = IQR, whisker = p10–p90, ● = max)</text>
</svg>`;
}

// ---- main -----------------------------------------------------------------

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  console.log(
    `[namesake] snapshot ${SNAPSHOT_DATE} · seed ${SEED} · ${PER_GROUP}/group${SMOKE ? " (SMOKE)" : ""}`,
  );
  const rows: Row[] = [];

  for (const g of GROUPS) {
    const authors = await sampleGroup(g.countries, PER_GROUP);
    console.log(`[namesake] ${g.key}: sampled ${authors.length}`);
    let done = 0;
    for (const a of authors) {
      const name = (a.display_name ?? "").trim();
      if (!name) continue;
      const alts = (a.display_name_alternatives ?? []).join(" ");
      const cjk = CJK_RE.test(name) || CJK_RE.test(alts);
      const country = a.last_known_institutions?.[0]?.country_code ?? "";
      try {
        const namesake_all = await namesakeCount(name, false);
        await sleep(POLITE_DELAY_MS);
        const namesake_orcid = await namesakeCount(name, true);
        await sleep(POLITE_DELAY_MS);
        rows.push({
          group: g.key,
          openalex_id: a.id.replace("https://openalex.org/", ""),
          display_name: name,
          country,
          works_count: a.works_count ?? 0,
          cjk_script: cjk,
          namesake_all,
          namesake_orcid,
        });
      } catch (err) {
        console.warn(`[namesake] skip "${name}": ${(err as Error).message}`); // fail-soft per author
      }
      if (++done % 25 === 0) console.log(`[namesake]   ${g.key} ${done}/${authors.length}`);
    }
  }

  const summaries = GROUPS.map((g) =>
    summarize(
      g.label,
      rows.filter((r) => r.group === g.key),
    ),
  );
  const overall = summarize("All strata", rows);

  await mkdir(OUT_DIR, { recursive: true });

  // raw rows (public OpenAlex data) as CSV
  const csv = [
    "group,openalex_id,display_name,country,works_count,cjk_script,namesake_all,namesake_orcid",
    ...rows.map((r) =>
      [
        r.group,
        r.openalex_id,
        `"${r.display_name.replace(/"/g, '""')}"`,
        r.country,
        r.works_count,
        r.cjk_script,
        r.namesake_all,
        r.namesake_orcid,
      ].join(","),
    ),
  ].join("\n");
  await writeFile(join(OUT_DIR, "namesake-raw.csv"), csv, "utf8");

  const results = {
    metadata: {
      script: "scripts/benchmark-namesake-ambiguity.ts",
      data_source: "OpenAlex /authors (public)",
      snapshot_date: SNAPSHOT_DATE,
      seed: SEED,
      per_group: PER_GROUP,
      started_at: startedAt,
      total_authors: rows.length,
      metric:
        "namesake_all = distinct OpenAlex author profiles matching the display name under token-based search (includes self)",
      ethics_boundary:
        "Public metadata only; mechanical method-comparison, NOT an adjudicated error rate. Error rate + equity = consent-based Study 2.",
    },
    by_group: summaries,
    overall,
  };
  await writeFile(join(OUT_DIR, "namesake-results.json"), JSON.stringify(results, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "namesake-figure.svg"), svgFigure(summaries), "utf8");

  console.log("\n[namesake] === median (p90 / max) name-collision burden ===");
  for (const s of [...summaries, overall]) {
    console.log(
      `  ${(s.group.split(" (")[0] ?? s.group).padEnd(16)} n=${String(s.n).padStart(3)}  median=${String(s.median).padStart(5)}  p90=${String(s.p90).padStart(5)}  max=${String(s.max).padStart(6)}  ≥100:${s.pct_ge100}%`,
    );
  }
  console.log(
    `\n[namesake] wrote ${OUT_DIR}/{namesake-results.json, namesake-raw.csv, namesake-figure.svg}`,
  );
}

main().catch((err) => {
  console.error("[namesake] FAILED:", err);
  process.exit(1);
});
