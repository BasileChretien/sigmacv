"""08 - Sensitivity: reclassify by romanized-surname origin instead of affiliation country.

Reviewer concern: affiliation country is a coarse proxy for name origin. To test the proxy
directly, this script reclassifies the entire ORCID-bearing population by romanized surname
(East-Asian vs not), independent of country, and (a) recomputes the collision contrast and
(b) cross-tabulates surname-origin against the country strata to quantify the proxy's noise
(diaspora leakage).

A surname is the final whitespace-delimited token of the normalized name (OpenAlex romanizes
East-Asian names in given-family order). The East-Asian set is the most common romanized Chinese
(pinyin + Cantonese), Korean, and Japanese surnames. The set is deliberately broad; ambiguous
homographs (Lee, Park, Han, Yang...) add Western false positives that *dilute* the East-Asian
group, so any surviving contrast is conservative.

Reads the `authors`, `agg_full`, and `agg_init` tables built by 02_aggregate.py.
"""
import duckdb, os, json


def _q(path: str) -> str:
    """Escape a filesystem path for use inside a single-quoted SQL string literal."""
    return path.replace("'", "''")


WORK = os.environ.get("OA_WORK", "./build")
OUT = os.environ.get("OA_OUT", "./out")
os.makedirs(OUT, exist_ok=True)
DB = f"{WORK}/analyze.duckdb"

con = duckdb.connect(DB)
con.execute("PRAGMA threads=8")
con.execute(f"PRAGMA temp_directory='{_q(WORK)}/tmp'")
con.execute("PRAGMA memory_limit='16GB'")

EA_SURNAMES = set("""
wang li zhang liu chen yang huang zhao wu zhou xu sun ma zhu hu guo he gao lin luo zheng liang
xie song tang han feng deng cao peng zeng xiao tian dong pan yuan cai jiang yu du ye cheng wei su
lu ding ren yao shen zhong cui tan fan liao zou xiong jin hao kong bai mao qiu qin shi gu hou shao
meng long wan duan lei qian yin qiao gong wen fang lai niu jia xia fu zhan tong hua kang ji mu lv lyu
kim lee park choi jung jeong kang cho jo yoon yun jang lim im oh seo shin kwon hwang ahn yoo hong
jeon ko moon son bae baek heo nam noh ha koo min
sato suzuki takahashi tanaka watanabe ito yamamoto nakamura kobayashi kato yoshida yamada sasaki
yamaguchi matsumoto inoue kimura hayashi shimizu saito yamazaki mori abe ikeda hashimoto yamashita
ishikawa nakajima maeda fujita ogawa goto okada hasegawa murakami kondo ishii sakamoto endo aoki
fujii nishimura fukuda ota miura fujiwara okamoto matsuda nakagawa nakano harada ono tamura takeuchi
kaneko wada nakayama ishida ueda morita hara shibata sakai kudo yokoyama miyazaki miyamoto uchida
takagi ando taniguchi maruyama imai takada fujimoto takeda murata ueno sugiyama masuda hirano
kojima chiba kubo matsui sakurai kinoshita noguchi matsuo nomura kikuchi sano sugimoto arai
wong chan lam cheung lau leung yip tsang chow ng ho fong mak kwok tsui yeung chu chiu
""".split())
inlist = ",".join("'" + s + "'" for s in sorted(EA_SURNAMES))
print(f"East-Asian surname set: {len(EA_SURNAMES)} surnames")

EA = ("JP", "CN", "KR", "TW", "HK")
AN = ("US", "GB", "AU", "CA", "NZ", "IE")
OT = ("FR", "DE", "ES", "IT", "PT", "NL", "SE", "PL", "BR")

con.execute(f"""CREATE OR REPLACE TEMP TABLE cls AS
WITH base AS (
  SELECT a.aid, a.country, regexp_extract(a.nfull, '([^ ]+)$', 1) AS surname,
         af.n_orcid AS m_orcid, af.n_all AS m_full, ai.n_all AS m_init
  FROM authors a
  JOIN agg_full af ON af.nm = a.nfull
  JOIN agg_init ai ON ai.nm = a.ninit
  WHERE a.has_orcid)
SELECT *, (surname IN ({inlist})) AS ea_surname FROM base""")

out = {}
for col, key in [("m_orcid", "orcid"), ("m_full", "full"), ("m_init", "init")]:
    out[key] = {}
    for flag in (True, False):
        r = con.execute(f"""SELECT count(*), median({col}), quantile_cont({col},0.25), quantile_cont({col},0.75),
            100.0*count(*) FILTER (WHERE {col}>=2)/count(*),
            100.0*count(*) FILTER (WHERE {col}>=100)/count(*)
            FROM cls WHERE ea_surname={'true' if flag else 'false'}""").fetchone()
        out[key]["ea_surname" if flag else "other"] = dict(n=r[0], median=r[1], q1=r[2], q3=r[3],
                                                           pct2=round(r[4], 1), pct100=round(r[5], 2))

def rbis(col):  # East-Asian-surnamed vs the rest; negative => EA-surnamed higher
    q = f"""WITH rn AS (SELECT ea_surname, {col} AS v, row_number() OVER (ORDER BY {col}) AS rn FROM cls),
        ar AS (SELECT ea_surname, avg(rn) OVER (PARTITION BY v) AS arank FROM rn)
        SELECT sum(arank) FILTER (WHERE ea_surname), count(*) FILTER (WHERE ea_surname),
               count(*) FILTER (WHERE NOT ea_surname) FROM ar"""
    R, na, nb = con.execute(q).fetchone()
    U = R - na * (na + 1) / 2.0
    return round(1 - 2 * U / (na * nb), 3)
out["effect"] = {k: rbis(c) for c, k in [("m_orcid", "orcid"), ("m_full", "full"), ("m_init", "init")]}

# Proxy validation: country stratum x surname-origin (diaspora leakage).
con.execute(f"""CREATE OR REPLACE TEMP TABLE strata AS
SELECT CASE WHEN country IN {EA} THEN 'east_asian' WHEN country IN {AN} THEN 'anglophone'
            WHEN country IN {OT} THEN 'other' ELSE 'out_of_list' END AS grp, ea_surname FROM cls""")
xt = con.execute("""SELECT grp, count(*) AS n, 100.0*count(*) FILTER (WHERE ea_surname)/count(*) AS pct_ea
                    FROM strata GROUP BY grp""").fetchall()
out["crosstab_pct_ea_surname_by_country_stratum"] = {g: dict(n=n, pct_ea_surname=round(p, 2)) for g, n, p in xt}

json.dump(out, open(f"{OUT}/surname-sensitivity.json", "w"), indent=2, default=float)
print("DONE -> surname-sensitivity.json")
