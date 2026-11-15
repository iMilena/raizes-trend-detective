/* Raízes do Futuro: Earth Trend Detective, globe and result panel.
   Click anywhere: outline the NASA POWER cell, download its annual series, answer what, how much,
   is it significant and since when. Statistics come from js/stats.js (same code as the Node tests).
   Code written with AI assistance (Anthropic Claude) and reviewed by the team. */
import { VARS, analyse, fetchAnnual, powerCell } from "./stats.js";
import { getJson } from "./power.js";

export const $ = id => document.getElementById(id);
export const BOIPEBA = { lat: -13.62, lon: -38.93, label: "Boipeba Island, Bahia, Brazil" };
export const state = { place: null, cell: null, v: "T2M", y0: 1981, y1: 2025, last: null, controller: null };
export const hooks = { onPlace: [], onResult: [] };   // later modules (scan, layers, heat) plug in here
const ESRI_ATTR = 'Imagery © <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community';
const mobile = () => matchMedia("(max-width: 760px)").matches;
export const fmt = (x, d) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d);
export const coordText = (lat, lon) => `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? "W" : "E"}`;
export const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- variable menu ---------- */
for (const [k, v] of Object.entries(VARS)) {
  const o = document.createElement("option"); o.value = k; o.textContent = `${v.label} (${v.unit}), ${k}`; $("variable").appendChild(o);
}

/* ---------- map ---------- */
export let map = null;
function webglOk() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } }
function initMap() {
  if (!window.maplibregl || !webglOk()) {
    $("map").innerHTML = '<p style="padding:90px 20px;color:#cfedd9;max-width:520px">The interactive globe needs WebGL, which this browser does not offer. You can still type coordinates in the search box: the analysis works without the map.</p>';
    return;
  }
  map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      projection: { type: "globe" },
      sources: {
        esri: { type: "raster", tileSize: 256, maxzoom: 19, attribution: ESRI_ATTR,
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"] },
        labels: { type: "raster", tileSize: 256, maxzoom: 19, attribution: "Labels © Esri (World Boundaries and Places)",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"] },
        cell: { type: "geojson", data: empty() },
      },
      layers: [
        { id: "space", type: "background", paint: { "background-color": "#04100d" } },
        { id: "esri", type: "raster", source: "esri" },
        { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.95 } },
        { id: "cell-fill", type: "fill", source: "cell", paint: { "fill-color": "#7fd99a", "fill-opacity": 0.12 } },
        { id: "cell-line", type: "line", source: "cell", paint: { "line-color": "#7fd99a", "line-width": 2.5 } },
      ],
    },
    center: [BOIPEBA.lon, BOIPEBA.lat], zoom: mobile() ? 1.4 : 2.1, minZoom: 0.6, maxZoom: 16,
    attributionControl: false, dragRotate: false, pitchWithRotate: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
  map.on("click", e => selectPlace(e.lngLat.lat, wrapLon(e.lngLat.lng), null, { fly: true }));
  map.on("error", e => { if (e?.error?.status) return; console.warn("map:", e?.error?.message || e); });
  const el = document.createElement("button");
  el.className = "pulse"; el.type = "button"; el.setAttribute("aria-label", "Boipeba Island case study: analyse this place");
  el.addEventListener("click", ev => { ev.stopPropagation(); goBoipeba(); });
  new maplibregl.Marker({ element: el }).setLngLat([BOIPEBA.lon, BOIPEBA.lat]).addTo(map);
}
const wrapLon = lon => ((((lon + 180) % 360) + 360) % 360) - 180;
export const empty = () => ({ type: "FeatureCollection", features: [] });
export const rect = (c, props = {}) => ({ type: "Feature", properties: props, geometry: { type: "Polygon",
  coordinates: [[[c.west, c.south], [c.east, c.south], [c.east, c.north], [c.west, c.north], [c.west, c.south]]] } });
export function setData(src, data) { if (!map) return; const s = map.getSource(src); if (s) s.setData(data); else map.once("load", () => map.getSource(src)?.setData(data)); }

let pick = null;
export function selectPlace(lat, lon, label, { fly = false, zoom = null } = {}) {
  lat = Math.max(-89.99, Math.min(89.99, lat));
  state.place = { lat, lon, label };
  state.cell = powerCell(lat, lon);
  $("panel-title").textContent = label || coordText(lat, lon);
  $("panel-cell").textContent = `${coordText(lat, lon)} · NASA POWER cell centred at ${state.cell.lat.toFixed(2)}, ${state.cell.lon.toFixed(3)} (0.5° x 0.625°)`;
  if (map) {
    setData("cell", { type: "FeatureCollection", features: [rect(state.cell)] });
    if (!pick) { const d = document.createElement("div"); d.className = "pick"; pick = new maplibregl.Marker({ element: d }); }
    pick.setLngLat([lon, lat]).addTo(map);
    if (fly) map.flyTo({ center: [lon, lat], zoom: zoom ?? Math.max(map.getZoom(), 6.2), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2200, essential: true });
  }
  setPanel(true);
  hooks.onPlace.forEach(f => f());
  run();
}
export function goBoipeba() { selectPlace(BOIPEBA.lat, BOIPEBA.lon, BOIPEBA.label, { fly: true, zoom: 8.6 }); }

/* ---------- panel ---------- */
export function setPanel(open) {
  const p = $("panel"); p.classList.toggle("collapsed", !open);
  const b = $("panel-toggle"); b.setAttribute("aria-expanded", String(open));
  b.setAttribute("aria-label", open ? "Hide results panel" : "Show results panel");
  $("panel-chev").style.transform = mobile() ? (open ? "rotate(90deg)" : "rotate(-90deg)") : (open ? "" : "rotate(180deg)");
}
$("panel-toggle").addEventListener("click", e => { e.stopPropagation(); setPanel($("panel").classList.contains("collapsed")); });
$("panel-head").addEventListener("click", e => { if (mobile() && e.target === e.currentTarget) setPanel($("panel").classList.contains("collapsed")); });
addEventListener("resize", () => setPanel(!$("panel").classList.contains("collapsed")));

export function status(msg, kind = "") { const s = $("status"); s.className = "status" + (kind ? " " + kind : ""); s.innerHTML = msg; }

/* ---------- analysis ---------- */
function readYears() {
  let y0 = Math.round(+$("y0").value) || 1981, y1 = Math.round(+$("y1").value) || 2025;
  y0 = Math.max(1981, Math.min(y0, 2015)); y1 = Math.max(y0 + 10, Math.min(y1, 2025));
  $("y0").value = y0; $("y1").value = y1; return { y0, y1 };
}
export const powerJson = signal => url => getJson(url, { signal });
async function run() {
  if (!state.place) return;
  state.controller?.abort();
  const ctl = state.controller = new AbortController();
  const v = state.v = $("variable").value; const { y0, y1 } = readYears(); state.y0 = y0; state.y1 = y1;
  const { place, cell } = state;
  clearAnswers();
  status(`Asking NASA POWER for ${y1 - y0 + 1} years of monthly ${v}…`, "load");
  try {
    const r = await fetchAnnual(cell.lat, cell.lon, v, y0, y1, powerJson(ctl.signal));
    if (ctl.signal.aborted) return;
    if (r.years.length < 10) {
      status(`NASA POWER has only ${r.years.length} complete year${r.years.length === 1 ? "" : "s"} of ${v} for this cell between ${y0} and ${y1}${r.skipped.length ? ` (${r.skipped.length} years have missing months)` : ""}. A trend test needs at least 10. Try another variable or period.`, "err");
      $("verdict").textContent = "Not enough data for a trend test here."; state.last = null; return;
    }
    const a = analyse(r.years, r.vals);
    state.last = { ...place, place: place.label || coordText(place.lat, place.lon), cell, v, years: r.years, vals: r.vals, a, url: r.url, skipped: r.skipped };
    show(state.last);
    status(`Done: ${r.years.length} complete years from NASA POWER${r.skipped.length ? `. Skipped incomplete years: ${r.skipped.join(", ")}` : ""}.`);
    hooks.onResult.forEach(f => f(state.last));
  } catch (e) {
    if (e.kind === "abort" || ctl.signal.aborted) return;
    status(esc(e.message), "err"); $("verdict").textContent = "No result for this place yet."; state.last = null;
  }
}
function clearAnswers() { for (const id of ["a-what", "a-much", "a-sig", "a-when"]) { $(id).textContent = "…"; $(id + "-s").textContent = ""; } $("chart").innerHTML = ""; }
$("variable").addEventListener("change", run);
$("y0").addEventListener("change", run);
$("y1").addEventListener("change", run);

function show(L) {
  const { years, a, v } = L, VV = VARS[v], dec = a.sen.slope * 10, sig = a.mk.p < 0.05, d = VV.dec, cp = a.pt.p < 0.05;
  $("a-what").textContent = sig ? (dec > 0 ? VV.up : VV.down) : "no clear trend";
  $("a-what").className = "big" + (sig ? " warm" : " neutral"); $("a-much").className = "big" + (sig ? " warm" : " neutral");
  $("a-what-s").textContent = `${VV.name}, ${years[0]} to ${years.at(-1)}`;
  $("a-much").textContent = `${fmt(dec, d)} ${VV.unit}`;
  $("a-much-s").textContent = `per decade (95% CI ${fmt(a.sen.lo * 10, d)} to ${fmt(a.sen.hi * 10, d)}); first ${a.w} yrs ${a.first.toFixed(d)} vs last ${a.w} yrs ${a.last.toFixed(d)}`;
  const ptxt = a.mk.p < 0.001 ? "p < 0.001" : `p = ${a.mk.p.toFixed(3)}`;
  $("a-sig").textContent = sig ? "Yes" : "No";
  $("a-sig-s").textContent = `${ptxt}, Mann-Kendall with Hamed-Rao autocorrelation correction`;
  $("a-when").textContent = cp ? `after ${years[a.pt.k]}` : "no break";
  $("a-when-s").textContent = cp ? `Pettitt p = ${a.pt.p < 0.001 ? "< 0.001" : a.pt.p.toFixed(3)}: ${a.pt.before.toFixed(d)} to ${a.pt.after.toFixed(d)} ${VV.unit}` : `Pettitt p = ${a.pt.p.toFixed(2)}`;
  const rain = v === "PRECTOTCORR" ? `<p class="flag"><strong>Signal to confirm.</strong> Rainfall trends from reanalysis can carry artifacts from changes in the observing system. Confirm with GPM IMERG or local rain gauges before acting on it.</p>` : "";
  $("verdict").innerHTML = (sig
    ? `At <strong>${esc(L.place)}</strong>, ${VV.name} shows a statistically significant trend of <strong>${fmt(dec, d)} ${VV.unit} per decade</strong>${cp ? `, with a shift after ${years[a.pt.k]}` : ""}.`
    : `At <strong>${esc(L.place)}</strong>, the change in ${VV.name} is not statistically significant: it cannot be told apart from year-to-year variability.`) + rain;
  drawChart($("chart"), L);
}

export function drawChart(svg, { years, vals, a, v }) {
  const W = 560, H = 320, L = 52, R = 10, T = 26, B = 34, VV = VARS[v];
  const mn = Math.min(...vals), mx = Math.max(...vals), pad = (mx - mn) * 0.15 || 1;
  const y0 = VV.agg === "sum" ? 0 : mn - pad, y1 = mx + pad;
  const X = i => L + (i + 0.5) * (W - L - R) / years.length, Y = val => T + (H - T - B) * (1 - (val - y0) / (y1 - y0));
  const bw = (W - L - R) / years.length * 0.75; let s = "";
  for (let g = 0; g <= 4; g++) { const val = y0 + (y1 - y0) * g / 4;
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(val)}" y2="${Y(val)}" stroke="#1d4a3c"/><text x="${L - 8}" y="${Y(val) + 4}" fill="#a9c2b4" font-size="14" text-anchor="end">${val.toFixed(VV.dec > 0 ? 1 : 0)}</text>`; }
  vals.forEach((val, i) => { const after = i > a.pt.k && a.pt.p < 0.05;
    s += `<rect x="${X(i) - bw / 2}" y="${Y(val)}" width="${bw}" height="${Math.max(H - B - Y(val), 0)}" fill="${after ? "#d97742" : "#4f8f67"}" rx="2"><title>${years[i]}: ${val.toFixed(VV.dec)} ${VV.unit}</title></rect>`; });
  const mid = (years.length - 1) / 2, medV = [...vals].sort((p, q) => p - q)[Math.floor(vals.length / 2)], ly = i => medV + a.sen.slope * (i - mid);
  s += `<line x1="${X(0)}" y1="${Y(ly(0))}" x2="${X(years.length - 1)}" y2="${Y(ly(years.length - 1))}" stroke="#cfedd9" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  if (a.pt.p < 0.05) { const xc = (X(a.pt.k) + X(a.pt.k + 1)) / 2; s += `<line x1="${xc}" x2="${xc}" y1="${T}" y2="${H - B}" stroke="#f3b267" stroke-width="1.5" stroke-dasharray="2 4"/>`; }
  years.forEach((y, i) => { if (y % (years.length > 30 ? 10 : 5) === 0) s += `<text x="${X(i)}" y="${H - B + 20}" fill="#a9c2b4" font-size="14" text-anchor="middle">${y}</text>`; });
  s += `<text x="${L}" y="16" fill="#a9c2b4" font-size="13">${VV.name} (${VV.unit}) · NASA POWER · chart code written with AI assistance</text>`;
  svg.innerHTML = s;
  svg.setAttribute("aria-label", `Annual ${VV.name} from ${years[0]} to ${years.at(-1)}, Theil-Sen trend ${fmt(a.sen.slope * 10, VV.dec)} ${VV.unit} per decade`);
}

/* ---------- search: "lat, lon" or a place name (Nominatim, only on submit, at most 1 request per second) ---------- */
let lastGeocode = 0; const geoCache = new Map();
async function geocode(q) {
  if (geoCache.has(q)) return geoCache.get(q);
  const wait = lastGeocode + 1100 - Date.now(); if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastGeocode = Date.now();
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, { headers: { "Accept-Language": "en" } });
  if (!r.ok) throw new Error("Place search is not available right now (HTTP " + r.status + "). Type coordinates instead, like -3.12, -60.02.");
  const j = await r.json(); const out = j[0] ? { lat: +j[0].lat, lon: +j[0].lon, label: j[0].display_name.split(",").slice(0, 3).join(",") } : null;
  geoCache.set(q, out); return out;
}
$("search").addEventListener("submit", async e => {
  e.preventDefault();
  const q = $("q").value.trim(); if (!q) return;
  const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m) {
    const lat = +m[1], lon = +m[2];
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) { setPanel(true); status("Latitude must be between -90 and 90 and longitude between -180 and 180.", "err"); return; }
    selectPlace(lat, lon, null, { fly: true }); return;
  }
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    const g = await geocode(q);
    if (!g) { setPanel(true); status(`No place found for "${esc(q)}". Try coordinates, like -3.12, -60.02.`, "err"); return; }
    selectPlace(g.lat, g.lon, g.label, { fly: true });
  } catch (err) { setPanel(true); status(esc(err.message), "err"); }
  finally { if (btn) btn.disabled = false; }
});
$("go-boipeba").addEventListener("click", goBoipeba);

/* ---------- start ---------- */
initMap();
setPanel(!mobile());
selectPlace(BOIPEBA.lat, BOIPEBA.lon, BOIPEBA.label);
if (mobile()) setPanel(false);
window.__trend = { state, selectPlace, map: () => map };   // used by the browser tests
