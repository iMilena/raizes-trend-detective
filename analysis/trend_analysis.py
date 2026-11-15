"""
Raizes do Futuro: Island Trend Detective
Trend analysis of NASA POWER data for Boipeba Island (Cairu, Bahia, Brazil)
and a 24-point grid over the Baixo Sul coast.

Methods
- Mann-Kendall trend test with the Hamed & Rao (1998) variance correction
  for serial autocorrelation (lags with significant autocorrelation only).
- Theil-Sen slope with a 95% confidence interval.
- Benjamini-Hochberg false discovery rate control across the grid (q = 0.05).

AI disclosure: this script was written with the help of an AI assistant
(Anthropic Claude) and reviewed by the team.

Usage: python analysis/trend_analysis.py
Input: data/nasa_power_baixosul.json  (see analysis/fetch_power.py)
Output: data/results.json, data/boipeba_annual.csv, figures/*.png
"""
import json
import math
import os
from collections import defaultdict

import numpy as np
from scipy import stats

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
FIG = os.path.join(ROOT, "figures")
os.makedirs(FIG, exist_ok=True)

BOIPEBA = "-13.62,-38.93"
YEARS = list(range(1981, 2026))
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


from stats import mann_kendall, sen_slope, bh_fdr  # noqa: E402


def trend(series, years=YEARS):
    s, lo, hi = sen_slope(series)
    mk = mann_kendall(series)
    first = float(np.mean(series[:10]))
    last = float(np.mean(series[-10:]))
    return {
        "slope_per_decade": s * 10, "ci95_per_decade": [lo * 10, hi * 10],
        "change_over_period": s * (years[-1] - years[0]),
        "mean_1981_1990": first, "mean_2016_2025": last,
        **mk,
    }


# ---------------------------------------------------------------- data
raw = json.load(open(os.path.join(DATA, "nasa_power_baixosul.json"), encoding="utf-8"))
data = raw["data"]
b = data[BOIPEBA]


def monthly(param):
    """dict year -> list of 12 monthly values for Boipeba."""
    out = defaultdict(list)
    for key, v in b[param].items():
        y, mth = int(key[:4]), int(key[4:])
        if mth <= 12:
            out[y].append(v)
    return out


t2m, tmax, pr, rh = monthly("T2M"), monthly("T2M_MAX"), monthly("PRECTOTCORR"), monthly("RH2M")

annual = {
    "T2M_mean_C": [float(np.mean(t2m[y])) for y in YEARS],
    "T2M_MAX_mean_C": [float(np.mean(tmax[y])) for y in YEARS],
    "precip_total_mm": [float(sum(v * d for v, d in zip(pr[y], DAYS))) for y in YEARS],
    "precip_rainy_AMJJ_mm": [float(sum(pr[y][i] * DAYS[i] for i in (3, 4, 5, 6))) for y in YEARS],
    "precip_dry_SON_mm": [float(sum(pr[y][i] * DAYS[i] for i in (8, 9, 10))) for y in YEARS],
    "RH2M_mean_pct": [float(np.mean(rh[y])) for y in YEARS],
}

# hot months: monthly mean daily max above the 1981-2010 90th percentile of that calendar month
base = {m: np.percentile([tmax[y][m] for y in range(1981, 2011)], 90) for m in range(12)}
annual["hot_months_count"] = [int(sum(tmax[y][m] > base[m] for m in range(12))) for y in YEARS]

with open(os.path.join(DATA, "boipeba_annual.csv"), "w", encoding="utf-8") as f:
    cols = list(annual)
    f.write("year," + ",".join(cols) + "\n")
    for i, y in enumerate(YEARS):
        f.write(str(y) + "," + ",".join(f"{annual[c][i]:.3f}" for c in cols) + "\n")

results = {"boipeba": {k: trend(v) for k, v in annual.items()}}

# ---------------------------------------------------------------- grid ("where")
grid = []
for key, v in data.items():
    if key == BOIPEBA:
        continue
    lat, lon = map(float, key.split(","))
    row = {"lat": lat, "lon": lon}
    for p in ("T2M", "PRECTOTCORR"):
        ser = [v[p][f"{y}13"] for y in YEARS]
        if p == "PRECTOTCORR":
            ser = [x * 365.25 for x in ser]  # mm/day annual mean -> mm/year
        row[p] = trend(ser)
    grid.append(row)
# NASA POWER meteorology sits on a 0.5 x 0.625 degree grid, so some requested
# points fall in the same cell and return identical series. FDR is applied to
# unique cells only, and duplicates inherit the result of their cell.
cell_id = {}
for g, (key, v) in zip(grid, [(k, v) for k, v in data.items() if k != BOIPEBA]):
    sig = tuple(v["T2M"][f"{y}13"] for y in YEARS) + tuple(v["PRECTOTCORR"][f"{y}13"] for y in YEARS)
    g["cell"] = cell_id.setdefault(sig, len(cell_id))
unique = {}
for g in grid:
    unique.setdefault(g["cell"], g)
for p in ("T2M", "PRECTOTCORR"):
    cells = list(unique.values())
    flags = bh_fdr([g[p]["p"] for g in cells])
    by_cell = {g["cell"]: fl for g, fl in zip(cells, flags)}
    for g in grid:
        g[p]["fdr_significant"] = by_cell[g["cell"]]
results["grid"] = grid
results["unique_cells"] = len(unique)
results["meta"] = {
    "source": raw["source"], "retrieved": raw["retrieved"],
    "boipeba_point": BOIPEBA, "years": [YEARS[0], YEARS[-1]],
    "methods": "Mann-Kendall (Hamed-Rao 1998 correction), Theil-Sen slope 95% CI, Benjamini-Hochberg FDR q=0.05",
}
json.dump(results, open(os.path.join(DATA, "results.json"), "w"), indent=2)

# ---------------------------------------------------------------- console summary
for k, r in results["boipeba"].items():
    print(f"{k:22s} slope/dec={r['slope_per_decade']:+.3f} CI=[{r['ci95_per_decade'][0]:+.3f},{r['ci95_per_decade'][1]:+.3f}] "
          f"p={r['p']:.4f} tau={r['tau']:+.2f} HR={r['hr_factor']:.2f}  {r['mean_1981_1990']:.2f} -> {r['mean_2016_2025']:.2f}")
print("unique cells:", len(unique))
for p in ("T2M", "PRECTOTCORR"):
    sig = sum(g[p]["fdr_significant"] for g in unique.values())
    sl = [g[p]["slope_per_decade"] for g in grid]
    print(p, f"FDR-significant {sig}/{len(unique)} unique cells  slope/dec range {min(sl):+.3f}..{max(sl):+.3f}")
