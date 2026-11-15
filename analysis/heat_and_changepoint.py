"""
Heat risk for outdoor work and change-point detection, Boipeba Island.

- Heat index (NOAA/NWS Rothfusz regression with Steadman below 80 F and the
  standard adjustments) from NASA POWER hourly T2M and RH2M, 2001 to 2025, local solar time.
- Days per year whose maximum heat index reaches NWS "extreme caution" (>= 32 C)
  and "danger" (>= 41 C).
- Hour by month profile: share of days on which the heat index is >= 32 C at each hour,
  2001 to 2010 vs 2016 to 2025, giving a safe-work window per month.
- Daily hot days since 1981: days with T2M_MAX above the 1981 to 2010 90th percentile
  of a 31-day window centred on that calendar day.
- Pettitt change-point test on the annual series.

AI disclosure: written with the help of an AI assistant (Anthropic Claude).
"""
import json
import os
from datetime import date, timedelta

import numpy as np

from stats import mann_kendall, sen_slope  # same statistics as the main analysis

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
raw = json.load(open(os.path.join(DATA, "nasa_power_boipeba_daily_hourly.json"), encoding="utf-8"))


def heat_index_c(t_c, rh):
    t = np.asarray(t_c) * 9 / 5 + 32
    rh = np.asarray(rh)
    simple = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + rh * 0.094)
    hi = (-42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 6.83783e-3 * t ** 2
          - 5.481717e-2 * rh ** 2 + 1.22874e-3 * t ** 2 * rh + 8.5282e-4 * t * rh ** 2 - 1.99e-6 * t ** 2 * rh ** 2)
    adj1 = ((13 - rh) / 4) * np.sqrt(np.clip((17 - np.abs(t - 95)) / 17, 0, None))
    hi = np.where((rh < 13) & (t >= 80) & (t <= 112), hi - adj1, hi)
    adj2 = ((rh - 85) / 10) * ((87 - t) / 5)
    hi = np.where((rh > 85) & (t >= 80) & (t <= 87), hi + adj2, hi)
    use_full = (simple + t) / 2 >= 80
    out = np.where(use_full, hi, simple)
    return (out - 32) * 5 / 9


def pettitt(x):
    x = np.asarray(x, dtype=float)
    n = len(x)
    u = np.array([np.sum(np.sign(x[t + 1:, None] - x[None, :t + 1])) for t in range(n - 1)])
    # U_t = sum_{i<=t} sum_{j>t} sign(x_j - x_i)
    k = int(np.argmax(np.abs(u)))
    K = abs(u[k])
    p = 2 * np.exp(-6 * K ** 2 / (n ** 3 + n ** 2))
    return k, float(min(p, 1.0))


def summarize(series, years):
    s, lo, hi = sen_slope(series)
    mk = mann_kendall(series)
    k, pp = pettitt(series)
    return {"slope_per_decade": s * 10, "ci95_per_decade": [lo * 10, hi * 10], "p": mk["p"], "tau": mk["tau"],
            "changepoint_last_year_before": years[k], "changepoint_p": pp,
            "mean_before": float(np.mean(series[:k + 1])), "mean_after": float(np.mean(series[k + 1:])),
            "values": [float(v) for v in series], "years": years}


res = {}

# ------------------------------------------------ hourly heat index
hyears = sorted(int(y) for y in raw["hourly"])
days_ec, days_danger, hi_max_mean = [], [], []
prof = {"2001_2010": np.zeros((12, 24)), "2016_2025": np.zeros((12, 24))}
cnt = {"2001_2010": np.zeros((12, 1)), "2016_2025": np.zeros((12, 1))}
for y in hyears:
    h = raw["hourly"][str(y)]
    T, RH = np.array(h["T2M"]), np.array(h["RH2M"])
    hi = heat_index_c(T, RH).reshape(-1, 24)  # days x hours (local solar time, from 00h)
    dmax = hi.max(axis=1)
    days_ec.append(int((dmax >= 32).sum()))
    days_danger.append(int((dmax >= 41).sum()))
    hi_max_mean.append(float(dmax.mean()))
    period = "2001_2010" if y <= 2010 else "2016_2025" if y >= 2016 else None
    if period:
        d0 = date(y, 1, 1)
        months = np.array([(d0 + timedelta(days=i)).month - 1 for i in range(hi.shape[0])])
        for m in range(12):
            sel = hi[months == m]
            prof[period][m] += (sel >= 32).sum(axis=0)
            cnt[period][m] += sel.shape[0]

res["heat_index"] = {
    "days_extreme_caution_32C": summarize(days_ec, hyears),
    "days_danger_41C": summarize(days_danger, hyears),
    "mean_daily_max_heat_index_C": summarize(hi_max_mean, hyears),
}
share = {k: (prof[k] / cnt[k]).round(3).tolist() for k in prof}
res["heat_hour_profile_share_ge32"] = share
# safe window: hours where fewer than 20% of days reach 32 C, recent decade
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
windows = {}
for k in share:
    arr = np.array(share[k])
    w = {}
    for m in range(12):
        risky = [hh for hh in range(24) if arr[m, hh] >= 0.2]
        w[MONTHS[m]] = [min(risky), max(risky) + 1] if risky else None
    windows[k] = w
res["risky_hours_share_ge20pct"] = windows

# ------------------------------------------------ daily hot days since 1981
d = raw["daily"]
start = date(1981, 1, 1)
dates = [start + timedelta(days=i) for i in range(len(d["T2M_MAX"]))]
tmax = np.array(d["T2M_MAX"])
doy = np.array([min(x.timetuple().tm_yday, 365) for x in dates])
yrs = np.array([x.year for x in dates])
base_mask = (yrs >= 1981) & (yrs <= 2010)
thr = np.zeros(366)
for k in range(1, 366):
    win = np.abs(((doy - k + 182) % 365) - 182) <= 15
    thr[k] = np.percentile(tmax[base_mask & win], 90)
hot = tmax > thr[doy]
dyears = list(range(1981, 2026))
hot_days = [int(hot[yrs == y].sum()) for y in dyears]
res["hot_days_tmax_p90"] = summarize(hot_days, dyears)

# ------------------------------------------------ change points on the monthly-based annual series
# (needs data/boipeba_annual.csv, written by trend_analysis.py)
ann = {}
import csv
rows = list(csv.DictReader(open(os.path.join(DATA, "boipeba_annual.csv"), encoding="utf-8")))
for c in ("T2M_mean_C", "T2M_MAX_mean_C", "hot_months_count", "precip_total_mm"):
    ann[c] = summarize([float(r[c]) for r in rows], dyears)
res["annual_changepoints"] = ann

json.dump(res, open(os.path.join(DATA, "heat_results.json"), "w"), indent=1)

def line(name, r):
    print(f"{name:34s} slope/dec={r['slope_per_decade']:+.2f} CI=[{r['ci95_per_decade'][0]:+.2f},{r['ci95_per_decade'][1]:+.2f}] p={r['p']:.4f} "
          f"| change after {r['changepoint_last_year_before']} (p={r['changepoint_p']:.4f}): {r['mean_before']:.2f} -> {r['mean_after']:.2f}")

for k, r in res["heat_index"].items():
    line(k, r)
line("hot_days_tmax_p90", res["hot_days_tmax_p90"])
for k, r in ann.items():
    line(k, r)
print("risky hours recent:", windows["2016_2025"])
print("risky hours early:", windows["2001_2010"])
