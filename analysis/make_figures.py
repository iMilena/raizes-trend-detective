"""
Figures for Raizes do Futuro: Island Trend Detective.
Reads data/boipeba_annual.csv and data/results.json, writes figures/*.png.

AI disclosure: written with the help of an AI assistant (Anthropic Claude).
Every figure carries a visible note saying so.
"""
import csv
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA, FIG = os.path.join(ROOT, "data"), os.path.join(ROOT, "figures")
os.makedirs(FIG, exist_ok=True)

BG, PANEL, INK, MUTED = "#061713", "#0a2720", "#e8f3ec", "#9fb8aa"
MINT, DAWN, CLAY, FOAM = "#7fd99a", "#f3b267", "#d97742", "#cfedd9"
NOTE = "Data: NASA POWER (power.larc.nasa.gov). Chart made with code written with AI assistance (Claude)."

plt.rcParams.update({
    "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG,
    "text.color": INK, "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.edgecolor": "#1d3d33", "font.family": "DejaVu Sans", "font.size": 12,
    "axes.spines.top": False, "axes.spines.right": False,
})

rows = list(csv.DictReader(open(os.path.join(DATA, "boipeba_annual.csv"), encoding="utf-8")))
years = np.array([int(r["year"]) for r in rows])
col = lambda c: np.array([float(r[c]) for r in rows])
res = json.load(open(os.path.join(DATA, "results.json")))
B = res["boipeba"]


def sen_line(key, y):
    s = B[key]["slope_per_decade"] / 10
    mid_x, mid_y = np.median(years), np.median(y)
    return mid_y + s * (years - mid_x)


def finish(fig, name, y=0.01):
    fig.text(0.01, y, NOTE, fontsize=8.5, color=MUTED)
    fig.savefig(os.path.join(FIG, name), dpi=200, bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)


# 1. temperature
fig, ax = plt.subplots(figsize=(10, 5))
for key, c, lab in (("T2M_MAX_mean_C", DAWN, "Mean daily maximum"), ("T2M_mean_C", MINT, "Mean air temperature (2 m)")):
    y = col(key)
    ax.plot(years, y, color=c, lw=1.6, marker="o", ms=3.5, label=lab)
    ax.plot(years, sen_line(key, y), color=c, lw=2.4, ls="--", alpha=0.9)
    r = B[key]
    ax.annotate(f"{r['slope_per_decade']:+.2f} °C/decade  (p < 0.001)", (years[-1], sen_line(key, y)[-1]),
                xytext=(8, 0), textcoords="offset points", color=c, fontsize=11, va="center", fontweight="bold")
ax.set_ylabel("°C")
ax.set_xlim(1980, 2036)
ax.set_title("Boipeba Island is getting hotter (1981 to 2025)", loc="left", fontsize=16, fontweight="bold", color=INK)
ax.legend(frameon=False, loc="upper left")
ax.grid(axis="y", color="#14342b", lw=0.8)
finish(fig, "01_temperature_boipeba.png")

# 2. hot months
fig, ax = plt.subplots(figsize=(10, 4.6))
h = col("hot_months_count")
ax.bar(years, h, color=[CLAY if v >= 6 else DAWN if v >= 3 else "#2e5a3e" for v in h], width=0.8)
ax.set_ylabel("months per year")
ax.set_ylim(0, 12.5)
ax.set_title("Months hotter than the 1981 to 2010 '1 in 10' level", loc="left", fontsize=16, fontweight="bold")
r = B["hot_months_count"]
ax.text(1981, 11.3, f"1981 to 1990: {r['mean_1981_1990']:.1f} per year    2016 to 2025: {r['mean_2016_2025']:.1f} per year",
        color=FOAM, fontsize=12)
ax.grid(axis="y", color="#14342b", lw=0.8)
finish(fig, "02_hot_months_boipeba.png")

# 3 & 4. grid maps
grid = res["grid"]
lats = sorted({g["lat"] for g in grid}, reverse=True)
lons = sorted({g["lon"] for g in grid})


def grid_map(param, title, unit, cmap, fname, fmt):
    M = np.full((len(lats), len(lons)), np.nan)
    S = np.zeros_like(M, dtype=bool)
    for g in grid:
        i, j = lats.index(g["lat"]), lons.index(g["lon"])
        M[i, j] = g[param]["slope_per_decade"]
        S[i, j] = g[param]["fdr_significant"]
    fig, ax = plt.subplots(figsize=(6.8, 7.2))
    vmax = np.nanmax(np.abs(M))
    norm = TwoSlopeNorm(vcenter=0, vmin=-vmax, vmax=vmax)
    im = ax.imshow(M, cmap=cmap, norm=norm, extent=[lons[0] - .25, lons[-1] + .25, lats[-1] - .25, lats[0] + .25])
    for g in grid:
        v = g[param]["slope_per_decade"]
        ax.text(g["lon"], g["lat"] + 0.06, fmt.format(v), ha="center", va="center", fontsize=10, color="#0b0b0b", fontweight="bold")
        if not g[param]["fdr_significant"]:
            ax.text(g["lon"], g["lat"] - 0.12, "not significant", ha="center", va="center", fontsize=7.5, color="#0b0b0b")
    ax.plot(-38.93, -13.62, marker="*", ms=20, color="white", mec="black", mew=1.2)
    ax.annotate("Boipeba", (-38.93, -13.62), xytext=(16, -3), textcoords="offset points",
                color="white", fontsize=12, fontweight="bold",
                bbox=dict(boxstyle="round,pad=0.25", fc="#061713", ec="white", lw=0.8),
                va="center")
    ax.set_xlabel("longitude")
    ax.set_ylabel("latitude")
    ax.set_title(title, loc="left", fontsize=14, fontweight="bold")
    cb = fig.colorbar(im, ax=ax, shrink=0.75, pad=0.02)
    cb.set_label(unit, color=MUTED)
    cb.ax.yaxis.set_tick_params(color=MUTED)
    fig.text(0.01, -0.035, f"All cells significant unless marked. Significance: Benjamini-Hochberg FDR (q = 0.05) over {res['unique_cells']} unique NASA POWER cells (0.5 x 0.625 deg);\npoints in the same cell share values.",
             fontsize=8.5, color=MUTED)
    finish(fig, fname, y=-0.06)


grid_map("T2M", "Where: warming trend across the Baixo Sul coast", "°C per decade", "RdBu_r",
         "03_map_temperature_trend.png", "{:+.2f}")
grid_map("PRECTOTCORR", "Where: rainfall trend (needs validation)", "mm per year, per decade", "BrBG",
         "04_map_precip_trend.png", "{:+.0f}")

# 5. precipitation with caveat
fig, ax = plt.subplots(figsize=(10, 4.8))
y = col("precip_total_mm")
ax.bar(years, y, color="#3d7a8c", width=0.8)
ax.plot(years, sen_line("precip_total_mm", y), color=FOAM, lw=2.4, ls="--")
r = B["precip_total_mm"]
ax.set_ylabel("mm per year")
ax.set_title("Rainfall signal: drier in the product, to be confirmed", loc="left", fontsize=16, fontweight="bold")
ax.text(1981, max(y) * 1.02, f"Theil-Sen {r['slope_per_decade']:+.0f} mm per decade (p < 0.001). Reanalysis rainfall trends can carry"
        " artifacts: next step is a cross-check with GPM IMERG and local gauges.", color=FOAM, fontsize=9.5)
ax.set_ylim(0, max(y) * 1.12)
ax.grid(axis="y", color="#14342b", lw=0.8)
finish(fig, "05_precip_boipeba.png")
print("figures ok:", sorted(os.listdir(FIG)))
