# Raízes do Futuro: Island Trend Detective

**NASA Space Apps Challenge 2026 · Challenge: Be An Earth System Trend Detective!**
Team **Raízes do Futuro**: Milena Calasans, Maria Clara Bastos, Talyta Silva

A live web tool that turns 45 years of NASA POWER data into four answers for any place on Earth: **what** is changing,
**where**, **how much**, and **is the change statistically significant**, plus **since when**. It also builds an hourly
heat calendar for outdoor work and a downloadable report. Case study: heat risk for the community waste collectors of
Boipeba Island (Cairu, Bahia, Brazil).

- **Live tool and full story:** https://imilena.github.io/raizes-trend-detective/ (or open `index.html` in a browser with internet access)
- **Demo slides (7 pages):** [`slides/raizes_trend_detective_demo.pdf`](slides/raizes_trend_detective_demo.pdf)

## The live tool

Everything runs in the browser: the page calls the NASA POWER API directly (no server, no login, no installation)
and runs the same statistics as the Python code, implemented in JavaScript.

| Feature | What it does |
|---|---|
| **Investigate** | Pick a place (map click, preset or coordinates), a variable and a period. Downloads monthly NASA POWER data, builds annual means or totals and answers: what (direction), how much (Theil-Sen slope per decade with 95% CI, first vs last decade), significant? (Mann-Kendall with Hamed-Rao correction), since when (Pettitt change point). Shows a chart and a plain-language verdict. |
| **Scan the area** | Tests 9 neighbouring NASA POWER cells (0.5° x 0.625° apart), colours them on the map and applies Benjamini-Hochberg false discovery rate control: the "where" answer. |
| **Build heat calendar** | Downloads 10 years of NASA POWER hourly temperature and humidity, computes the heat index and compares 2001 to 2005 with 2021 to 2025: days per year at or above 32 °C, risky months, a month by hour heat map and a suggested time limit for heavy outdoor work in each month. |
| **Download report** | One-page HTML report (four answers, chart, heat calendar if built, method, limits, NASA data links). Opens in any browser and can be printed to PDF, for grant applications, city halls or ESG reports. |
| **Download data (CSV)** | The annual series with its NASA POWER source URL in the header. |

Variables available: air temperature (`T2M`), daily maximum (`T2M_MAX`), precipitation (`PRECTOTCORR`), relative
humidity (`RH2M`), wind speed (`WS2M`) and surface solar radiation (`ALLSKY_SFC_SW_DWN`).

## Key findings: Boipeba Island

| Indicator | Theil-Sen trend per decade (95% CI) | Before | After | Mann-Kendall p |
|---|---|---|---|---|
| Days with heat index >= 32 °C (2001 to 2025) | +37 (+13 to +60) | 64 / yr (to 2018) | 132 / yr (2019 on) | 0.005 |
| Hot days above the 1981-2010 90th percentile | +31 (+20 to +41) | 24 / yr (to 2004) | 110 / yr (2005 on) | < 0.001 |
| Mean air temperature, 2 m (1981-90 vs 2016-25) | +0.26 °C (+0.20 to +0.33) | 25.3 °C | 26.2 °C | < 0.001 |
| Mean daily maximum (1981-90 vs 2016-25) | +0.38 °C (+0.27 to +0.48) | 28.3 °C | 29.6 °C | < 0.001 |
| Very hot months per year (1981-90 vs 2016-25) | +1.4 (+0.8 to +1.9) | 0.7 | 6.8 | < 0.001 |
| Relative humidity (1981-90 vs 2016-25) | -0.7 pp (-0.9 to -0.5) | 80.8 % | 78.1 % | < 0.001 |
| Annual rainfall (needs validation) | -263 mm (-325 to -202) | 1,876 mm | 907 mm | < 0.001 |

"Before" and "After" are split at the Pettitt change point for the first two rows and at the first and last decades for the others.

- **Heat calendar (2001-2010 vs 2016-2025):** the risky season grew from December to April to November to May. At noon in February and March, 3 in 4 days now reach extreme caution, against about 1 in 2 before. Suggested schedule for the project: finish collection routes by 8 a.m. from February to April and by 9 a.m. in the rest of the risky season.
- **Where:** warming is significant in **18 of 18** unique NASA POWER cells of the Baixo Sul coast (+0.19 to +0.40 °C per decade); rainfall decreases significantly in **15 of 18**, after false discovery rate control.
- **Rainfall:** reported as a signal that still needs confirmation against GPM IMERG and local gauges, because reanalysis precipitation trends can carry artifacts.

## Methods

- **Trend:** Mann-Kendall test with the Hamed and Rao (1998) variance correction for serial autocorrelation, on annual series.
- **Magnitude:** Theil-Sen slope with 95% confidence interval, plus decade means.
- **Since when:** Pettitt (1979) change-point test.
- **Where:** Benjamini-Hochberg false discovery rate (q = 0.05) across unique grid cells; requested points that fall in the same NASA POWER cell return identical series and are counted once.
- **Heat index:** NOAA/NWS Rothfusz regression with the standard adjustments, from NASA POWER hourly `T2M` and `RH2M` in local solar time; 32 °C is the NWS "extreme caution" level. A month is "risky" when at least 20% of its days reach 32 °C at some hour.
- **Hot day:** daily maximum above the 1981 to 2010 90th percentile of a 31-day window centred on that calendar day.
- **Very hot month:** monthly mean of daily maximum above the 1981 to 2010 90th percentile for that calendar month.

## Limitations

- NASA POWER meteorology comes from reanalysis on a 0.5° x 0.625° grid: one cell can mix island, sea and mainland and smooths daily heat peaks, so real heat on land is likely higher than shown (no "danger" days at 41 °C appear in the data).
- Reanalysis rainfall trends can include artifacts from changes in the observing system; we flag them rather than claim them.
- The tool's heat calendar compares two 5-year windows: it describes change, it is not a significance test.
- Trends describe 1981 to 2025 and are not forecasts.

## How to reproduce the offline analysis

```bash
pip install -r requirements.txt
python analysis/fetch_power.py           # optional: data/ already includes the downloaded NASA POWER data
python analysis/trend_analysis.py        # monthly trends and grid -> data/results.json, data/boipeba_annual.csv
python analysis/make_figures.py          # figures 01 to 05
python analysis/heat_and_changepoint.py  # heat index, hot days, change points -> data/heat_results.json
python analysis/make_figures_heat.py     # figures 06 to 08
```

`heat_and_changepoint.py` reads `data/boipeba_annual.csv`, so run `trend_analysis.py` first.

## Publishing the page (GitHub Pages)

1. Push this folder to a public repository (for example `iMilena/raizes-trend-detective`).
2. In the repository: Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The page is served at `https://<user>.github.io/<repository>/`. Open it in a private window to check that it needs no login.

## Repository

```
index.html                           live tool and project page
analysis/stats.py                    shared statistics (Mann-Kendall, Theil-Sen, FDR)
analysis/fetch_power.py              downloads all NASA POWER series used offline
analysis/trend_analysis.py           monthly trends for Boipeba and the Baixo Sul grid
analysis/heat_and_changepoint.py     heat index, hot days, heat calendar, Pettitt change points
analysis/make_figures.py             figures 01 to 05
analysis/make_figures_heat.py        figures 06 to 08
data/nasa_power_baixosul.json        NASA POWER monthly data (Boipeba monthly, grid annual)
data/nasa_power_boipeba_daily_hourly.json  NASA POWER daily 1981-2025 and hourly 2001-2025 for Boipeba
data/boipeba_annual.csv              annual indicators for Boipeba
data/results.json                    trend results (Boipeba and grid)
data/heat_results.json               heat, hot days and change-point results
figures/                             charts used in the page and slides (09 is a screenshot of the live tool)
slides/raizes_trend_detective_demo.pdf / .pptx   demo slides
slides/build_deck.js                 script that generated the slides (PptxGenJS)
SUBMISSION.md                        texts for the Space Apps submission form
```

## NASA data

- NASA POWER Monthly API (`T2M`, `T2M_MAX`, `PRECTOTCORR`, `RH2M`; the tool also uses `WS2M` and `ALLSKY_SFC_SW_DWN`):
  https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,T2M_MAX,PRECTOTCORR,RH2M&community=AG&longitude=-38.93&latitude=-13.62&start=1981&end=2025&format=JSON
- NASA POWER Daily API:
  https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR&community=AG&longitude=-38.93&latitude=-13.62&start=19810101&end=20251231&format=JSON
- NASA POWER Hourly API (one request per year):
  https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M&community=AG&longitude=-38.93&latitude=-13.62&time-standard=LST&start=20250101&end=20251231&format=JSON
- NASA POWER Data Access Viewer: https://power.larc.nasa.gov/data-access-viewer/
- NASA POWER documentation: https://power.larc.nasa.gov/docs/

## Related tools

Climate trend tools already exist, mostly for researchers: the KNMI Climate Explorer computes trends and significance
for any location; NOAA Climate at a Glance publishes regional time series; Google Earth Engine and Climate Engine run
Mann-Kendall and Sen's slope on maps with an account and code. Our contribution is to bring the same rigour to any
community without login or code, answer all four challenge questions plus "since when" in plain language, and turn the
result into a concrete decision: when it is safe to work outdoors.

## Roadmap

- Add a "Climate" panel to the Raízes do Futuro project dashboard, refreshed yearly from the NASA POWER API.
- Validate rainfall with GPM IMERG and add sea surface temperature and sea level for coastal sites (Earthdata Login).
- Combine the heat calendar with a daily heat forecast so the pause rule works in practice.
- Relate rainfall and heat to the waste reaching mangroves and beaches using the project's collection records.

## AI disclosure

The analysis code, the live tool, the project page, the chart code, the slides and the first drafts of the texts were
produced with the help of an AI assistant (Anthropic Claude) and reviewed by the team. AI use is flagged in code headers,
page metadata and a visible note on every chart. The data are NASA POWER values, not AI generated. No AI-generated image
or video is used, and no NASA logo or mark appears in any material.

## About Raízes do Futuro

Raízes do Futuro, winner of the UNICEF Brazil Youth Challenge Blockchain 2026, organises validated waste collection on
Boipeba, splits recycling revenue by smart contract and directs part of it to a Children's Fund for health and education.
This Trend Detective adds a climate layer to the project.

Map tiles © OpenStreetMap contributors; map library Leaflet. License: MIT.
