# Space Apps 2026: textos para copiar e colar no formulário

Desafio: **Be An Earth System Trend Detective!** · Time: **Raízes do Futuro**

Time: Milena Calasans, Maria Clara Bastos e Talyta Silva.

Antes de colar: troque `iMilena/raizes-trend-detective` pelo endereço real do repositório, se for outro.
Tudo abaixo do item 1 está em inglês, como pede o formulário. A lista de conferência final está no fim deste arquivo.

---

## 1. Project Name

Raízes do Futuro: Island Trend Detective

---

## 2. High-Level Summary (até 1.500 caracteres)

Raízes do Futuro: Island Trend Detective is a live web tool that turns 45 years of NASA POWER data into four answers for any place on Earth: what is changing, where, how much, and whether the change is statistically significant. Pick a point on the map and the page calls the NASA POWER API, runs Mann-Kendall tests with autocorrelation correction, Theil-Sen slopes, Pettitt change-point detection and false discovery rate control across neighbouring cells, and explains the result in plain language. It also builds an hourly heat calendar for outdoor work and a downloadable report for any place. We tested it on Boipeba Island, Brazil, where our community recycling project works outdoors. The answer: days when the heat index reaches 32 °C, the level of extreme caution for outdoor work, doubled from 64 to 132 a year, with a shift after 2018. Warming is significant across the whole coast. We turned the hourly heat calendar into a safer collection schedule and flag a possible drying signal openly instead of claiming it. It matters because climate data rarely reaches the small communities that live with it, and this tool works for any of them.

---

## 3. Demo link

Slides em PDF (7 páginas): `https://github.com/iMilena/raizes-trend-detective/blob/main/slides/raizes_trend_detective_demo.pdf`

(Alternativa: subir o PDF no Google Drive com "qualquer pessoa com o link pode ver" e colar esse link.)

---

## 4. Final Project link

Página do projeto com a ferramenta ao vivo (GitHub Pages): `https://imilena.github.io/raizes-trend-detective/`
Repositório: `https://github.com/iMilena/raizes-trend-detective`

---

## 5. Project Details

**What it does**
Raízes do Futuro: Island Trend Detective is a live, open web tool. Anyone clicks a place on the map (or types coordinates), chooses a NASA POWER variable (air temperature, daily maximum, rainfall, humidity, wind or solar radiation) and gets four answers in seconds:
- What is changing: the direction of the trend, in plain language.
- How much: Theil-Sen slope per decade with a 95% confidence interval, plus first and last decade means.
- Is it significant: Mann-Kendall test with the Hamed and Rao (1998) correction for autocorrelation.
- Since when: Pettitt change-point test.
"Scan the area" tests 9 neighbouring NASA POWER cells and colours them on the map, with Benjamini-Hochberg false discovery rate control, to answer where.
"Build heat calendar" downloads 10 years of NASA POWER hourly temperature and humidity for the chosen place, computes the heat index and compares 2001 to 2005 with 2021 to 2025: how many days reach 32 °C (extreme caution for outdoor work), in which months and from which hour, with a suggested work schedule.
"Download report" produces a one-page report (four answers, chart, heat calendar, method, limits and NASA data links) that a community can attach to a grant application or send to its city hall, and "Download data" exports the annual series as CSV.

**Case study: Boipeba Island, Bahia, Brazil**
Raízes do Futuro, winner of the UNICEF Brazil Youth Challenge Blockchain 2026, runs community waste collection on Boipeba, on foot and by boat. Using NASA POWER monthly, daily and hourly data we found:
- Dangerous heat for outdoor work doubled: days with heat index at or above 32 °C (NWS "extreme caution") went from 64 to 132 a year (+37 days per decade, 95% CI +13 to +60, p = 0.005), with a change point after 2018.
- The risky season grew from December to April to November to May. At noon in February and March, 3 in 4 days now reach extreme caution, against about 1 in 2 in 2001 to 2010.
- Mean daily maximum rose from 28.3 °C (1981 to 1990) to 29.6 °C (2016 to 2025), +0.38 °C per decade. Hot days above the 1981 to 2010 90th percentile went from 24 to 110 a year, with a change point after 2004.
- Where: warming is significant in all 18 unique NASA POWER cells of the Baixo Sul coast (+0.19 to +0.40 °C per decade).

**Being honest about uncertainty**
NASA POWER shows annual rainfall at Boipeba falling from about 1,880 mm to about 910 mm. Reanalysis rainfall trends can carry artifacts, so we flag it as a signal to confirm with GPM IMERG and local gauges. Reanalysis cells (0.5° x 0.625°) mix island, sea and mainland and smooth the daily heat peak, so real heat on land is likely higher than shown. Duplicate grid cells are counted once. Trends are not forecasts.

**Benefits and expected impact**
- Safer work: the hourly heat calendar becomes the collection schedule (finish routes by 8 a.m. from February to April and by 9 a.m. in the rest of the risky season, November to May) and a pause rule when the heat index forecast passes 32 °C.
- Better funding decisions: NASA-backed trends, with stated uncertainty, help the project's Children's Fund and its partners prioritise climate adaptation for children's health and education.
- Open for every community: the tool runs for any coordinates in a browser, with no installation and no login. Any cooperative, school or city hall can build its own heat calendar and download a report for grant applications, adaptation plans or ESG reporting today.
- Next steps: validate rainfall with GPM IMERG, add sea surface temperature and sea level for coastal sites, and relate rainfall to the waste reaching mangroves and beaches using the project's collection records.

**What already exists and what is new**
Climate trend tools already exist, mostly for researchers: the KNMI Climate Explorer computes trends and significance for any location, NOAA Climate at a Glance publishes regional time series, and Google Earth Engine or Climate Engine run Mann-Kendall and Sen's slope with an account and code. Our tool brings the same statistical rigour to any community without login or code, answers all four challenge questions plus "since when" in plain language, and turns the result into a concrete decision: when it is safe to work outdoors.

**Tools and languages**
JavaScript, HTML and CSS (live tool, statistics in the browser), Leaflet and OpenStreetMap (map), Python with NumPy, SciPy and Matplotlib (offline analysis and charts), NASA POWER API, GitHub and GitHub Pages, PptxGenJS (slides).

---

## 6. Use of Artificial Intelligence ("Super Intelligence")

Opções para marcar: **código**, **texto**, **visualizações/gráficos** (dados: NÃO, os dados são da NASA POWER). Texto sugerido:

We used an AI assistant (Anthropic Claude) to help write the Python analysis code, the JavaScript live tool, the chart code, the project web page, the slides and first drafts of the project texts. The team reviewed and edited all of it. AI use is flagged in the code headers, in the page metadata, in the README and in a visible note on every chart. The data are NASA POWER values and were not generated by AI. No AI-generated image or video was used, and no NASA logo or mark appears in any material.

---

## 7. NASA Data

- **NASA POWER (Prediction Of Worldwide Energy Resources), Monthly API**: T2M, T2M_MAX, PRECTOTCORR, RH2M (plus WS2M and ALLSKY_SFC_SW_DWN in the live tool), 1981 to 2025.
  https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,T2M_MAX,PRECTOTCORR,RH2M&community=AG&longitude=-38.93&latitude=-13.62&start=1981&end=2025&format=JSON
- **NASA POWER Daily API**: T2M, T2M_MAX, T2M_MIN, RH2M, PRECTOTCORR, 1981 to 2025.
  https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR&community=AG&longitude=-38.93&latitude=-13.62&start=19810101&end=20251231&format=JSON
- **NASA POWER Hourly API**: T2M, RH2M in local solar time, 2001 to 2025 (one request per year).
  https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M&community=AG&longitude=-38.93&latitude=-13.62&time-standard=LST&start=20250101&end=20251231&format=JSON
- **NASA POWER Data Access Viewer**: https://power.larc.nasa.gov/data-access-viewer/
- **NASA POWER Documentation**: https://power.larc.nasa.gov/docs/

---

## 8. Space Agency Partner and Other Data, Tools, Resources (opcional)

- NumPy: https://numpy.org
- SciPy: https://scipy.org
- Matplotlib: https://matplotlib.org
- PptxGenJS: https://gitbrent.github.io/PptxGenJS/
- Leaflet: https://leafletjs.com · OpenStreetMap: https://www.openstreetmap.org/copyright
- KNMI Climate Explorer (related tool): https://climexp.knmi.nl
- NOAA Climate at a Glance (related tool): https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/
- NOAA/NWS heat index equation (Rothfusz): https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
- Pettitt, A. N. (1979). A non-parametric approach to the change-point problem. Applied Statistics, 28, 126 to 135.
- Hamed, K. H. and Rao, A. R. (1998). A modified Mann-Kendall trend test for autocorrelated data. Journal of Hydrology, 204, 182 to 196.
- Benjamini, Y. and Hochberg, Y. (1995). Controlling the false discovery rate. Journal of the Royal Statistical Society B, 57, 289 to 300.

---

## Conferência final (em português)

**Publicar**
1. Criar o repositório público e subir a pasta inteira.
2. Settings > Pages > Deploy from a branch, branch `main`, pasta `/ (root)`.
3. Esperar 1 a 2 minutos e abrir `https://imilena.github.io/raizes-trend-detective/`.

**Testar a página numa janela anônima**
- Clicar no mapa e em "Investigate": as quatro respostas e o gráfico aparecem.
- Clicar em "Scan the area": 9 quadrados coloridos aparecem no mapa.
- Clicar em "Build heat calendar": em uns 20 segundos aparece o calendário de calor.
- Clicar em "Download report" e abrir o arquivo baixado.
- Abrir o link do PDF dos slides: precisa abrir sem login.

**Antes de clicar em "Submit for Judging"**
- Nenhuma imagem nem voz de menores de 18 anos.
- As três integrantes confirmadas no Universal Event.
- Marcar as caixas de Termos e "Confirm All Work is Original".
- No uso de IA, marcar código, texto e gráficos (dados não).
- Clicar em Submit for Judging e conferir o banner de confirmação. Dá para reenviar até 23:59; vale o último envio.
- Ativar o "Lock" enquanto edita.
