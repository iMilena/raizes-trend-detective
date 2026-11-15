"""
Download every NASA POWER series used by the offline analysis.

1. Monthly data, 1981 to 2025, for Boipeba and a 0.5 degree grid over the Baixo Sul coast
   -> data/nasa_power_baixosul.json (used by trend_analysis.py)
2. Daily data (1981 to 2025) and hourly data in local solar time (2001 to 2025) for Boipeba
   -> data/nasa_power_boipeba_daily_hourly.json (used by heat_and_changepoint.py)

The live tool in index.html does not need these files: it calls the API from the browser.

AI disclosure: written with the help of an AI assistant (Anthropic Claude).
"""
import json
import os
import time
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = ("https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,T2M_MAX,PRECTOTCORR,RH2M"
       "&community=AG&longitude={lon}&latitude={lat}&start=1981&end=2025&format=JSON")

points = [(-13.62, -38.93)]  # Boipeba
lat = -12.5
while lat >= -15.0:
    lon = -38.5
    while lon >= -40.0:
        points.append((lat, lon))
        lon -= 0.5
    lat -= 0.5

out = {}
for i, (la, lo) in enumerate(points):
    with urllib.request.urlopen(URL.format(lat=la, lon=lo), timeout=120) as r:
        p = json.load(r)["properties"]["parameter"]
    if i > 0:  # grid points: keep annual values only (key YYYY13)
        p = {k: {d: v for d, v in s.items() if d.endswith("13")} for k, s in p.items()}
    key = f"{la:g},{lo:g}"
    out[key] = p
    print("ok", key)
    time.sleep(0.5)

json.dump({"source": "NASA POWER API v2 monthly point, community AG, https://power.larc.nasa.gov/api/temporal/monthly/point",
           "retrieved": datetime.now(timezone.utc).isoformat(), "data": out},
          open(os.path.join(ROOT, "data", "nasa_power_baixosul.json"), "w"))


# ---------------------------------------------------------------- daily and hourly, Boipeba
LAT, LON = -13.62, -38.93
DAILY = ("https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR"
         f"&community=AG&longitude={LON}&latitude={LAT}&start=19810101&end=20251231&format=JSON")
HOURLY = ("https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M&community=AG"
          f"&longitude={LON}&latitude={LAT}&time-standard=LST&start={{y}}0101&end={{y}}1231&format=JSON")

with urllib.request.urlopen(DAILY, timeout=300) as r:
    d = json.load(r)["properties"]["parameter"]
dk = list(d["T2M"])
daily = {"start": dk[0], "dates": len(dk), **{p: [d[p][k] for k in dk] for p in d}}
print("ok daily", len(dk), "days")

hourly = {}
for y in range(2001, 2026):
    with urllib.request.urlopen(HOURLY.format(y=y), timeout=300) as r:
        h = json.load(r)["properties"]["parameter"]
    keys = list(h["T2M"])
    hourly[str(y)] = {"start": keys[0], "T2M": [h["T2M"][k] for k in keys], "RH2M": [h["RH2M"][k] for k in keys]}
    print("ok hourly", y)
    time.sleep(0.5)

json.dump({"source": {"daily": "https://power.larc.nasa.gov/api/temporal/daily/point (T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR, community AG)",
                      "hourly": "https://power.larc.nasa.gov/api/temporal/hourly/point (T2M,RH2M, community AG, time-standard LST)"},
           "point": [LAT, LON], "retrieved": datetime.now(timezone.utc).isoformat(), "daily": daily, "hourly": hourly},
          open(os.path.join(ROOT, "data", "nasa_power_boipeba_daily_hourly.json"), "w"))
