// Demo deck for NASA Space Apps 2026. Written with AI assistance (Anthropic Claude).
// Requires the pptxgenjs npm package. applyTheme comes from a helper available in the authoring environment;
// remove that line (and the require) to build elsewhere. The PDF and PPTX in this folder are already generated.
const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require("/root/.claude/skills/synced/dc6e0d94-7684-4022-bdb7-f370943d7fb2_463554e8-24a8-4946-8990-901031163cd7/pptx/scripts/apply_theme.js");

const FIG = (f) => path.join(__dirname, "..", "figures", f);
const THEME = {
  name: "Raizes Trend Detective", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "061713", lt1: "E8F3EC", dk2: "0A2720", lt2: "9FB8AA",
    accent1: "7FD99A", accent2: "F3B267", accent3: "D97742", accent4: "CFEDD9", accent5: "2E5A3E", accent6: "3D7A8C",
    hlink: "7FD99A", folHlink: "CFEDD9" },
};
const REPO = "github.com/iMilena/raizes-trend-detective";
const PAGES = "imilena.github.io/raizes-trend-detective";
const TEAM = "Team Raízes do Futuro: Milena Calasans, Maria Clara Bastos, Talyta Silva";
const CH = "Challenge: Be An Earth System Trend Detective!";

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = "Raízes do Futuro: Island Trend Detective";
  pres.author = "Raízes do Futuro";
  const C = pres.SchemeColor;

  pres.defineSlideMaster({
    title: "TITLE_ONLY",
    background: { color: "061713" },
    objects: [
      { text: { text: `${TEAM}  ·  ${CH}`, options: { x: 0.5, y: 5.22, w: 8.3, h: 0.28, fontSize: 9, color: C.background2, margin: 0 } } },
    ],
    slideNumber: { x: 9.1, y: 5.22, w: 0.4, h: 0.28, fontSize: 9, color: C.background2, align: "right" },
    placeholders: [],
  });
  pres.defineSlideMaster({
    title: "TITLE_ONLY_PH",
    background: { color: "061713" },
    objects: [
      { text: { text: `${TEAM}  ·  ${CH}`, options: { x: 0.5, y: 5.22, w: 8.3, h: 0.28, fontSize: 9, color: C.background2, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.7, fontFace: "Cambria", fontSize: 28, bold: true, color: C.background1, margin: 0, valign: "top", align: "left" }, text: "" } },
    ],
    slideNumber: { x: 9.1, y: 5.22, w: 0.4, h: 0.28, fontSize: 9, color: C.background2, align: "right" },
  });

  const card = (s, x, y, w, h, name) => s.addShape(pres.shapes.ROUNDED_RECTANGLE,
    { x, y, w, h, fill: { color: C.text2 }, line: { color: "14342B", width: 0.75 }, rectRadius: 0.12, objectName: name });
  const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, ...o });

  // 1. Title
  pres.addSection({ title: "Intro" });
  let s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Intro" });
  txt(s, "NASA SPACE APPS CHALLENGE 2026", { x: 0.5, y: 0.6, w: 9, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 3 });
  txt(s, "Raízes do Futuro:\nIsland Trend Detective", { x: 0.5, y: 1.05, w: 9, h: 1.6, fontFace: "Cambria", fontSize: 44, bold: true, color: C.background1, valign: "top" });
  txt(s, "A live tool that turns 45 years of NASA data into four answers for any place. Case study: heat risk for the waste collectors of Boipeba Island, Brazil.",
    { x: 0.5, y: 2.75, w: 8.2, h: 0.75, fontSize: 18, color: C.accent4 });
  card(s, 0.5, 3.75, 9, 1.2, "team card");
  txt(s, [
    { text: "Team: ", options: { bold: true, color: C.accent1 } }, { text: "Raízes do Futuro", options: { breakLine: true } },
    { text: "Members: ", options: { bold: true, color: C.accent1 } }, { text: "Milena Calasans, Maria Clara Bastos, Talyta Silva", options: { breakLine: true } },
    { text: "Challenge: ", options: { bold: true, color: C.accent1 } }, { text: "Be An Earth System Trend Detective!" },
  ], { x: 0.75, y: 3.85, w: 8.5, h: 1.0, fontSize: 15, color: C.background1, valign: "middle" });

  // 2. Context + four questions
  s = pres.addSlide({ masterName: "TITLE_ONLY_PH", sectionTitle: "Intro" });
  s.addText("A live trend detective, tested on our island", { placeholder: "title" });
  txt(s, "Our tool lets anyone pick a place and get four answers from 45 years of NASA POWER data. We tested it on Boipeba, Brazil, where Raízes do Futuro (UNICEF Brazil Youth Challenge Blockchain 2026 winner) runs community waste collection outdoors.",
    { x: 0.5, y: 1.0, w: 9, h: 0.85, fontSize: 15, color: C.accent4 });
  const Q = [["WHAT", "Dangerous heat\nfor workers", C.accent3], ["WHERE", "18 of 18 cells\nwarming", C.accent1],
             ["HOW MUCH", "64 → 132 days\nof risky heat", C.accent2], ["SINCE WHEN", "Shift after 2018,\np < 0.05", C.accent1]];
  Q.forEach(([q, a, col], i) => {
    const x = 0.5 + i * 2.3;
    card(s, x, 2.1, 2.1, 2.0, `question ${i + 1}`);
    txt(s, q, { x: x + 0.2, y: 2.3, w: 1.7, h: 0.35, fontSize: 13, bold: true, color: C.background2, charSpacing: 2 });
    txt(s, a, { x: x + 0.2, y: 2.8, w: 1.8, h: 1.2, fontSize: 19, bold: true, color: col, valign: "top" });
  });
  txt(s, "Statistics: Mann-Kendall (autocorrelation-corrected), Theil-Sen slopes, Pettitt change points, false discovery rate across the map.",
    { x: 0.5, y: 4.35, w: 9, h: 0.5, fontSize: 12, color: C.background2 });

  // 3. Live tool
  pres.addSection({ title: "Solution" });
  s = pres.addSlide({ masterName: "TITLE_ONLY_PH", sectionTitle: "Solution" });
  s.addText("The tool: any place, four answers, in seconds", { placeholder: "title" });
  const th = 3.95, tw = th * 1344 / 1160;
  s.addImage({ path: FIG("09_live_tool_screenshot.png"), x: 0.5, y: 1.0, w: tw, h: th, altText: "Screenshot of the live trend detective showing four answers and a trend chart for Boipeba" });
  txt(s, [
    { text: "How it works", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "Click the map or a preset", options: { bullet: true, breakLine: true } },
    { text: "The page calls the NASA POWER API live", options: { bullet: true, breakLine: true } },
    { text: "Tests run in the browser", options: { bullet: true, breakLine: true } },
    { text: "\"Scan the area\" maps 9 cells (where)", options: { bullet: true, breakLine: true } },
    { text: "Heat calendar for outdoor work, any place", options: { bullet: true, breakLine: true } },
    { text: "Downloadable report and CSV", options: { bullet: true } },
  ], { x: 0.5 + tw + 0.3, y: 1.05, w: 9.5 - (0.5 + tw + 0.3), h: 3.0, fontSize: 13, color: C.background1, valign: "top", paraSpaceAfter: 5 });
  txt(s, "Screenshot of the live tool (Boipeba, air temperature).", { x: 0.5 + tw + 0.3, y: 4.2, w: 9.5 - (0.5 + tw + 0.3), h: 0.6, fontSize: 10, color: C.background2, valign: "top" });

  // 4. Heat risk
  pres.addSection({ title: "Findings" });
  s = pres.addSlide({ masterName: "TITLE_ONLY_PH", sectionTitle: "Findings" });
  s.addText("Boipeba: dangerous heat for collectors doubled", { placeholder: "title" });
  s.addImage({ path: FIG("06_heat_days_boipeba.png"), x: 0.5, y: 1.0, w: 6.3, h: 6.3 * 991 / 2088, altText: "Days per year with heat index at or above 32 C, doubling after 2018" });
  [["64 → 132", "days a year with heat index ≥ 32 °C (NWS extreme caution)", C.accent3],
   ["+37", "days per decade, p = 0.005; change point after 2018", C.accent2]].forEach(([n, l, col], i) => {
    const y = 1.0 + i * 1.95;
    card(s, 7.05, y, 2.45, 1.75, `stat ${i + 1}`);
    txt(s, n, { x: 7.25, y: y + 0.15, w: 2.1, h: 0.65, fontSize: 28, bold: true, color: col });
    txt(s, l, { x: 7.25, y: y + 0.85, w: 2.1, h: 0.8, fontSize: 12, color: C.background1, valign: "top" });
  });
  txt(s, "Heat index from NASA POWER hourly temperature and humidity, 2001 to 2025. Mean daily maximum also rose 1.4 °C since the 1980s.",
    { x: 0.5, y: 4.35, w: 6.3, h: 0.6, fontSize: 12, color: C.accent4 });

  // 5. Heat calendar -> schedule
  s = pres.addSlide({ masterName: "TITLE_ONLY_PH", sectionTitle: "Findings" });
  s.addText("From data to a collection schedule", { placeholder: "title" });
  const ch = 3.55, cw = ch * 2097 / 1156;
  s.addImage({ path: FIG("08_heat_calendar_boipeba.png"), x: 0.5, y: 1.0, w: Math.min(cw, 6.6), h: Math.min(cw, 6.6) * 1156 / 2097, altText: "Heat calendar by month and hour, 2001-2010 vs 2016-2025" });
  card(s, 7.3, 1.0, 2.2, 3.9, "schedule card");
  txt(s, [
    { text: "Risky season", options: { bold: true, color: C.accent3, breakLine: true } },
    { text: "Dec to Apr → Nov to May", options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "Noon, Feb and Mar", options: { bold: true, color: C.accent2, breakLine: true } },
    { text: "3 in 4 days at extreme caution (was 1 in 2)", options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "Rule for Raízes", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "Finish routes by 8 a.m. (Feb to Apr), 9 a.m. (rest of season)" },
  ], { x: 7.45, y: 1.15, w: 1.95, h: 3.65, fontSize: 12, color: C.background1, valign: "top" });

  // 6. Where + honesty
  s = pres.addSlide({ masterName: "TITLE_ONLY_PH", sectionTitle: "Findings" });
  s.addText("Where, and honest about limits", { placeholder: "title" });
  const mh = 3.3, mw = mh * 1731 / 1505;
  s.addImage({ path: FIG("03_map_temperature_trend.png"), x: 0.5, y: 1.0, w: mw, h: mh, altText: "Map of warming trends, all cells significant" });
  txt(s, [{ text: "Where: ", options: { bold: true, color: C.accent3 } }, { text: "warming is significant in 18 of 18 unique cells of the coast, +0.19 to +0.40 °C per decade." }],
    { x: 0.5, y: 4.4, w: mw, h: 0.65, fontSize: 12, color: C.background1, valign: "top" });
  card(s, 0.5 + mw + 0.3, 1.0, 9.5 - (0.5 + mw + 0.3), 3.9, "limits card");
  txt(s, [
    { text: "What we flag, not claim", options: { bold: true, color: C.accent2, fontSize: 15, breakLine: true } },
    { text: "Rainfall halves in the product (1,876 → 907 mm/yr): needs GPM IMERG and gauge checks", options: { bullet: true, breakLine: true } },
    { text: "Reanalysis cells mix island, sea and mainland, so real heat on land is likely higher", options: { bullet: true, breakLine: true } },
    { text: "Duplicate grid cells counted once; trends are not forecasts", options: { bullet: true } },
  ], { x: 0.5 + mw + 0.5, y: 1.15, w: 9.5 - (0.5 + mw + 0.5) - 0.2, h: 3.6, fontSize: 13, color: C.background1, valign: "top", paraSpaceAfter: 6 });

  // 7. Impact + next steps
  pres.addSection({ title: "Impact" });
  s = pres.addSlide({ masterName: "TITLE_ONLY_PH", sectionTitle: "Impact" });
  s.addText("Impact: safer work, smarter funding, any place", { placeholder: "title" });
  const A = [["Protect outdoor workers", "Heat-aware collection calendar and a pause rule when heat index passes 32 °C.", C.accent3],
             ["Evidence for the Children's Fund", "NASA-backed trends, with uncertainty, to guide partners and funders.", C.accent1],
             ["Open for every community", "Any place: heat calendar and a downloadable report for grants, city halls and ESG.", C.accent2]];
  A.forEach(([h, b, col], i) => {
    const y = 1.0 + i * 1.12;
    card(s, 0.5, y, 5.6, 0.98, `action ${i + 1}`);
    s.addShape(pres.shapes.OVAL, { x: 0.7, y: y + 0.29, w: 0.4, h: 0.4, fill: { color: col }, line: { color: col }, objectName: `dot ${i + 1}` });
    txt(s, h, { x: 1.3, y: y + 0.1, w: 4.65, h: 0.35, fontSize: 15, bold: true, color: col });
    txt(s, b, { x: 1.3, y: y + 0.45, w: 4.65, h: 0.48, fontSize: 12, color: C.background1, valign: "top" });
  });
  card(s, 6.4, 1.0, 3.1, 3.3, "links card");
  txt(s, [
    { text: "NASA data", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "NASA POWER API (monthly, daily, hourly): T2M, T2M_MAX, PRECTOTCORR, RH2M", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Try it and see the code", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: PAGES, options: { breakLine: true, color: C.accent4 } },
    { text: REPO, options: { color: C.accent4 } },
  ], { x: 6.6, y: 1.15, w: 2.8, h: 3.05, fontSize: 12, color: C.background1, valign: "top" });
  txt(s, "AI disclosure: code, tool, charts and drafts made with AI assistance (Claude), reviewed by the team. Data are NASA POWER values. No NASA logo used.",
    { x: 0.5, y: 4.45, w: 9, h: 0.55, fontSize: 10, color: C.background2 });

  const out = path.join(__dirname, "raizes_trend_detective_demo.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
