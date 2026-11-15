/* Raízes do Futuro: Earth Trend Detective, NASA GIBS layers on the globe.
   Base imagery switch (Esri World Imagery or GIBS true color), overlays with official legends,
   opacity, date and play. GIBS images are for viewing only: trend statistics always come from the
   NASA POWER series, never from image colours. Code written with AI assistance (Anthropic Claude). */
import { GIBS_LAYERS, GIBS_CHECKED, GIBS_CAPABILITIES } from "./gibs-layers.js";
import { $, map, esc } from "./app.js";

const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
const byKey = Object.fromEntries(GIBS_LAYERS.map(l => [l.key, l]));
const TRUE = GIBS_LAYERS.find(l => l.role === "base");
const OVER = GIBS_LAYERS.filter(l => l.role === "overlay");
const S = { base: "esri", overlay: "lst", opacity: 0.7, date: {}, step: "month", playing: false, labels: true };

/* ---------- dates (UTC, ISO yyyy-mm-dd) ---------- */
const iso = d => d.toISOString().slice(0, 10);
const D = s => new Date(s + "T00:00:00Z");
function addStep(s, step, n = 1) { const d = D(s);
  if (step === "day") d.setUTCDate(d.getUTCDate() + n); else if (step === "month") d.setUTCMonth(d.getUTCMonth() + n); else d.setUTCFullYear(d.getUTCFullYear() + n);
  return iso(d); }
const first = L => L.intervals[0][0], last = L => L.intervals.at(-1)[1];
const isAvail = (L, s) => L.intervals.some(([a, b]) => s >= a && s <= b);
/* nearest available date at or before s (then after), so a gap never shows an empty map */
function snap(L, s) {
  if (L.period === "P1M") s = s.slice(0, 8) + "01";
  if (s > last(L)) return last(L); if (s < first(L)) return first(L);
  if (isAvail(L, s)) return s;
  let best = null;
  for (const [a, b] of L.intervals) { if (b < s) best = b; else if (a > s) { if (!best || (D(a) - D(s)) < (D(s) - D(best))) best = a; break; } }
  return best || last(L);
}
const nice = (L, s) => L.period === "P1M" ? D(s).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
  : D(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const tileUrl = (L, s) => `${GIBS}/${L.id}/default/${s}/${L.tileMatrixSet}/{z}/{y}/{x}.${L.ext}`;

for (const L of GIBS_LAYERS) S.date[L.key] = snap(L, L.period === "P1D" ? addStep(L.defaultTime, "day", -1) : L.defaultTime);

/* ---------- panel markup ---------- */
$("go-boipeba").insertAdjacentHTML("beforebegin",
  `<button class="btn ghost" id="layers-btn" type="button" aria-expanded="false" aria-controls="layers"><svg class="i"><use href="#i-layers"/></svg><span>NASA layers</span></button>`);
$("app").insertAdjacentHTML("beforeend", `
<section class="layers" id="layers" aria-labelledby="layers-title" hidden>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
    <h2 id="layers-title">Layers</h2>
    <button class="icon-btn" id="layers-close" type="button" aria-label="Close layers"><svg class="i"><use href="#i-x"/></svg></button>
  </div>
  <fieldset><legend>Base imagery</legend>
    <label class="radio"><input type="radio" name="base" value="esri" checked> Esri World Imagery (sharp, mosaic)</label>
    <label class="radio"><input type="radio" name="base" value="gibs"> NASA GIBS true color, ${esc(nice(TRUE, S.date[TRUE.key]))}</label>
    <label class="radio"><input type="checkbox" id="labels-on" checked> Place labels</label>
  </fieldset>
  <fieldset><legend>NASA overlay</legend>
    <label class="radio"><input type="radio" name="over" value="none"> None</label>
    ${OVER.map(L => `<label class="radio"><input type="radio" name="over" value="${L.key}"${L.key === S.overlay ? " checked" : ""}> ${esc(L.title)}</label>`).join("")}
  </fieldset>
  <div id="over-controls">
    <label class="lbl" for="opacity" style="margin-top:10px">Opacity <span id="opacity-val"></span></label>
    <input id="opacity" type="range" min="0" max="1" step="0.05" value="${S.opacity}">
    <label class="lbl" for="ldate" style="margin-top:6px">Date</label>
    <div class="date-row">
      <button class="icon-btn" id="d-prev" type="button" aria-label="Previous date"><svg class="i"><use href="#i-left"/></svg></button>
      <input id="ldate" type="date">
      <button class="icon-btn" id="d-next" type="button" aria-label="Next date"><svg class="i"><use href="#i-chev"/></svg></button>
      <button class="icon-btn" id="d-play" type="button" aria-pressed="false" aria-label="Play through dates"><svg class="i" id="play-ico"><use href="#i-play"/></svg></button>
    </div>
    <label class="lbl" for="lstep" style="margin-top:8px">Play and step by</label>
    <select id="lstep"></select>
    <div class="legend-img" id="legend"></div>
    <p class="about" id="about"></p>
  </div>
  <p class="about">Images from NASA GIBS (<a href="https://gibs.earthdata.nasa.gov/">gibs.earthdata.nasa.gov</a>), layer list checked against the
    <a href="${GIBS_CAPABILITIES}">WMTS GetCapabilities</a> on ${GIBS_CHECKED}. They are for looking only: the trend numbers come from the NASA POWER series of the clicked cell.</p>
</section>`);

/* ---------- map layers ---------- */
function addLayers() {
  map.addSource("gibs-tc", { type: "raster", tileSize: 256, maxzoom: TRUE.maxzoom, tiles: [tileUrl(TRUE, S.date[TRUE.key])], attribution: "NASA GIBS" });
  map.addLayer({ id: "gibs-tc", type: "raster", source: "gibs-tc", layout: { visibility: "none" } }, "labels");
  for (const L of OVER) {
    map.addSource("gibs-" + L.key, { type: "raster", tileSize: 256, maxzoom: L.maxzoom, tiles: [tileUrl(L, S.date[L.key])], attribution: "NASA GIBS" });
    map.addLayer({ id: "gibs-" + L.key, type: "raster", source: "gibs-" + L.key, layout: { visibility: "none" },
      paint: { "raster-opacity": S.opacity, "raster-fade-duration": 250, "raster-resampling": "linear" } }, "labels");
  }
  apply();
}
function apply() {
  if (!map) return;
  map.setLayoutProperty("esri", "visibility", S.base === "esri" ? "visible" : "none");
  map.setLayoutProperty("gibs-tc", "visibility", S.base === "gibs" ? "visible" : "none");
  map.setLayoutProperty("labels", "visibility", S.labels ? "visible" : "none");
  for (const L of OVER) {
    const on = S.overlay === L.key;
    map.setLayoutProperty("gibs-" + L.key, "visibility", on ? "visible" : "none");
    map.setPaintProperty("gibs-" + L.key, "raster-opacity", S.opacity);
    if (on) map.getSource("gibs-" + L.key).setTiles([tileUrl(L, S.date[L.key])]);
  }
  ui();
}
function ui() {
  const L = byKey[S.overlay];
  $("over-controls").hidden = !L;
  $("opacity-val").textContent = Math.round(S.opacity * 100) + "%";
  if (L) {
    const inp = $("ldate"), s = S.date[L.key];
    inp.type = L.period === "P1M" ? "month" : "date";
    inp.min = L.period === "P1M" ? first(L).slice(0, 7) : first(L); inp.max = L.period === "P1M" ? last(L).slice(0, 7) : last(L);
    inp.value = L.period === "P1M" ? s.slice(0, 7) : s;
    const opts = L.period === "P1M" ? [["month", "Month"], ["year", "Year (same month)"]] : [["day", "Day"], ["month", "Month"], ["year", "Year (same day)"]];
    if (!opts.some(o => o[0] === S.step)) S.step = "month";
    $("lstep").innerHTML = opts.map(([v, t]) => `<option value="${v}"${v === S.step ? " selected" : ""}>${t}</option>`).join("");
    $("legend").innerHTML = L.legend ? `<img src="${L.legend}" alt="Colour scale for ${esc(L.title)}, from NASA GIBS" loading="lazy">` : "";
    $("about").textContent = L.about + ` Available ${nice(L, first(L))} to ${nice(L, last(L))}.`;
  }
  const base = S.base === "esri" ? "Base: Esri World Imagery" : `Base: NASA GIBS ${TRUE.id}, ${nice(TRUE, S.date[TRUE.key])}`;
  $("map-caption").innerHTML = L
    ? `<strong>${esc(L.title)}</strong>, ${esc(nice(L, S.date[L.key]))}. Source: NASA GIBS, layer <code>${L.id}</code>. ${base}.`
    : `${base}. No NASA overlay.`;
}

/* ---------- controls ---------- */
const setDate = s => { const L = byKey[S.overlay]; if (!L) return; S.date[L.key] = snap(L, s); apply(); };
document.querySelectorAll('input[name=base]').forEach(r => r.addEventListener("change", () => { S.base = r.value; apply(); }));
document.querySelectorAll('input[name=over]').forEach(r => r.addEventListener("change", () => { stop(); S.overlay = r.value; apply(); }));
$("labels-on").addEventListener("change", e => { S.labels = e.target.checked; apply(); });
$("opacity").addEventListener("input", e => { S.opacity = +e.target.value; apply(); });
$("ldate").addEventListener("change", e => { const v = e.target.value; if (v) setDate(v.length === 7 ? v + "-01" : v); });
$("lstep").addEventListener("change", e => { S.step = e.target.value; });
$("d-prev").addEventListener("click", () => { const L = byKey[S.overlay]; if (L) setDate(addStep(S.date[L.key], S.step, -1)); });
$("d-next").addEventListener("click", () => { const L = byKey[S.overlay]; if (L) setDate(addStep(S.date[L.key], S.step, 1)); });
function openLayers(open) { $("layers").hidden = !open; $("layers-btn").setAttribute("aria-expanded", String(open)); if (open) $("layers-close").focus(); }
$("layers-btn").addEventListener("click", () => openLayers($("layers").hidden));
$("layers-close").addEventListener("click", () => { openLayers(false); $("layers-btn").focus(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("layers").hidden) { openLayers(false); $("layers-btn").focus(); } });

/* play: step through dates, waiting for tiles before moving on; wraps to the start of the record */
let playTok = 0;
function stop() { S.playing = false; playTok++; $("d-play").setAttribute("aria-pressed", "false"); $("d-play").setAttribute("aria-label", "Play through dates"); $("play-ico").innerHTML = '<use href="#i-play"/>'; }
async function play() {
  const tok = ++playTok; S.playing = true;
  $("d-play").setAttribute("aria-pressed", "true"); $("d-play").setAttribute("aria-label", "Pause"); $("play-ico").innerHTML = '<use href="#i-pause"/>';
  while (S.playing && tok === playTok) {
    const L = byKey[S.overlay]; if (!L) break;
    let next = addStep(S.date[L.key], S.step, 1);
    if (next > last(L)) next = S.step === "year" ? first(L).slice(0, 4) + S.date[L.key].slice(4) : addStep(last(L), S.step, -24);
    setDate(next);
    await Promise.race([new Promise(r => map.once("idle", r)), new Promise(r => setTimeout(r, 5000))]);
    await new Promise(r => setTimeout(r, matchMedia("(prefers-reduced-motion: reduce)").matches ? 2500 : 900));
  }
}
$("d-play").addEventListener("click", () => S.playing ? stop() : play());

if (map) { if (map.loaded()) addLayers(); else map.once("load", addLayers); } else ui();
