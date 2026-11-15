"""
Heat-risk and change-point figures. Reads data/heat_results.json.
AI disclosure: written with the help of an AI assistant (Anthropic Claude); every figure says so.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG = os.path.join(ROOT, "figures")
r = json.load(open(os.path.join(ROOT, "data", "heat_results.json")))

BG, INK, MUTED = "#061713", "#e8f3ec", "#9fb8aa"
MINT, DAWN, CLAY, FOAM = "#7fd99a", "#f3b267", "#d97742", "#cfedd9"
NOTE = "Data: NASA POWER (power.larc.nasa.gov). Chart made with code written with AI assistance (Claude)."
plt.rcParams.update({
    "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG, "text.color": INK,
    "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": MUTED, "axes.edgecolor": "#1d3d33",
    "font.family": "DejaVu Sans", "font.size": 12, "axes.spines.top": False, "axes.spines.right": False,
})


def finish(fig, name, y=0.01):
    fig.text(0.01, y, NOTE, fontsize=8.5, color=MUTED)
    fig.savefig(os.path.join(FIG, name), dpi=200, bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)


def bars_with_changepoint(res, title, ylabel, fname, color_after, label_fmt):
    yrs, v = np.array(res["years"]), np.array(res["values"])
    cp = res["changepoint_last_year_before"]
    fig, ax = plt.subplots(figsize=(10, 4.8))
    ax.bar(yrs, v, color=[color_after if y > cp else "#2e5a3e" for y in yrs], width=0.8)
    ax.hlines(res["mean_before"], yrs[0] - 0.4, cp + 0.4, color=FOAM, lw=2.2, ls="--")
    ax.hlines(res["mean_after"], cp + 0.6, yrs[-1] + 0.4, color=FOAM, lw=2.2, ls="--")
    ax.axvline(cp + 0.5, color=MUTED, lw=1, ls=":")
    ax.text(cp + 0.8, max(v) * 1.02, f"change point after {cp} (Pettitt p = {res['changepoint_p']:.3f})",
            color=FOAM, fontsize=10.5)
    ax.text(yrs[0], res["mean_before"] + max(v) * 0.03, label_fmt.format(res["mean_before"]), color=FOAM, fontsize=11)
    ax.text(yrs[-1], res["mean_after"] + max(v) * 0.03, label_fmt.format(res["mean_after"]), color=FOAM, fontsize=11, ha="right",
            bbox=dict(boxstyle="round,pad=0.2", fc=BG, ec="none", alpha=0.85))
    ax.set_ylim(0, max(v) * 1.12)
    ax.set_ylabel(ylabel)
    ax.set_title(title, loc="left", fontsize=16, fontweight="bold")
    ax.grid(axis="y", color="#14342b", lw=0.8)
    finish(fig, fname)


bars_with_changepoint(r["heat_index"]["days_extreme_caution_32C"],
                      "Days when heat index reaches 32 °C (outdoor work 'extreme caution')",
                      "days per year", "06_heat_days_boipeba.png", CLAY, "{:.0f} days/yr")
bars_with_changepoint(r["hot_days_tmax_p90"],
                      "Hot days since 1981 (above the 1981-2010 90th percentile)",
                      "days per year", "07_hot_days_changepoint.png", DAWN, "{:.0f} days/yr")

# heat calendar: month x hour
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
H0, H1 = 6, 19
fig, axes = plt.subplots(1, 2, figsize=(12, 5.2), sharey=True)
for ax, key, ttl in zip(axes, ["2001_2010", "2016_2025"], ["2001 to 2010", "2016 to 2025"]):
    a = np.array(r["heat_hour_profile_share_ge32"][key])[:, H0:H1] * 100
    im = ax.imshow(a, cmap="YlOrRd", vmin=0, vmax=80, aspect="auto")
    ax.set_xticks(range(0, H1 - H0, 2))
    ax.set_xticklabels([f"{h}h" for h in range(H0, H1, 2)])
    ax.set_yticks(range(12))
    ax.set_yticklabels(MONTHS)
    ax.set_title(ttl, fontsize=14, fontweight="bold", color=INK)
    for i in range(12):
        for j in range(H1 - H0):
            if a[i, j] >= 20:
                ax.text(j, i, f"{a[i, j]:.0f}", ha="center", va="center", fontsize=8,
                        color="black" if a[i, j] < 60 else "white")
    ax.set_xlabel("local solar time")
cb = fig.colorbar(im, ax=axes, shrink=0.85, pad=0.02)
cb.set_label("% of days with heat index >= 32 °C at that hour", color=MUTED)
fig.suptitle("When is it risky to collect? Heat calendar for Boipeba", x=0.06, ha="left", fontsize=16, fontweight="bold", color=INK)
finish(fig, "08_heat_calendar_boipeba.png", y=-0.03)
print("ok")
