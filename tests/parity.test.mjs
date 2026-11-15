/* Parity test: js/stats.js on data/boipeba_annual.csv must reproduce data/results.json
   (computed by analysis/trend_analysis.py) and the numbers quoted in the submission.
   Run: node tests/parity.test.mjs          (offline, uses the CSV)
        node tests/parity.test.mjs --live   (also downloads NASA POWER monthly data and checks fetchAnnual)
   Code written with AI assistance (Anthropic Claude). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { analyse, fetchAnnual } from "../js/stats.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csv = readFileSync(join(root, "data/boipeba_annual.csv"), "utf8").trim().split(/\r?\n/);
const head = csv[0].split(",");
const rows = csv.slice(1).map(l => l.split(",").map(Number));
const col = name => rows.map(r => r[head.indexOf(name)]);
const years = col("year");
const results = JSON.parse(readFileSync(join(root, "data/results.json"), "utf8")).boipeba;

let fails = 0, total = 0;
const ok = (cond, msg) => { total++; console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const r2 = x => (Math.round(x * 100) / 100).toFixed(2);

function check(label, column, ref, expect) {
  console.log(`\n${label} (${years[0]} to ${years.at(-1)}, n = ${years.length})`);
  const a = analyse(years, col(column));
  const dec = a.sen.slope * 10, lo = a.sen.lo * 10, hi = a.sen.hi * 10, cp = years[a.pt.k];
  console.log(`  Theil-Sen ${dec.toFixed(3)} per decade, 95% CI ${lo.toFixed(3)} to ${hi.toFixed(3)}, MK p = ${a.mk.p.toExponential(2)}, Pettitt: after ${cp} (p = ${a.pt.p.toExponential(2)})`);
  ok(near(dec, ref.slope_per_decade, 1e-3), `slope equals Python within 0.001 (CSV is rounded to 3 decimals) (${ref.slope_per_decade.toFixed(4)})`);
  ok(near(lo, ref.ci95_per_decade[0], 1e-3) && near(hi, ref.ci95_per_decade[1], 1e-3), "95% CI equals Python within 0.001");
  ok(near(a.mk.S, ref.S, 0), `Mann-Kendall S equals Python (${ref.S})`);
  ok(near(a.mk.z, ref.z, 1e-3), `Mann-Kendall z equals Python (${ref.z.toFixed(3)})`);
  expect(a, { dec, lo, hi, cp });
}

check("T2M annual mean", "T2M_mean_C", results.T2M_mean_C, (a, { dec, lo, hi, cp }) => {
  ok(r2(dec) === "0.26", `shown as +0.26 °C per decade (got ${r2(dec)})`);
  ok(r2(lo) === "0.20" && r2(hi) === "0.33", `CI shown as +0.20 to +0.33 (got ${r2(lo)} to ${r2(hi)})`);
  ok(a.mk.p < 0.001, "Mann-Kendall p < 0.001");
  ok(a.pt.p < 0.05 && cp === 1997, `change point after 1997 (got after ${cp})`);
});
check("PRECTOTCORR annual total", "precip_total_mm", results.precip_total_mm, (a, { dec, cp }) => {
  ok(Math.round(dec) === -263, `shown as -263 mm per decade (got ${Math.round(dec)})`);
  ok(a.mk.p < 0.001, "Mann-Kendall p < 0.001");
  ok(a.pt.p < 0.05 && cp === 2005, `change point after 2005 (got after ${cp})`);
});

if (process.argv.includes("--live")) {
  console.log("\nLive: fetchAnnual() against NASA POWER monthly API, Boipeba (-13.62, -38.93)");
  for (const [v, column, tol] of [["T2M", "T2M_mean_C", 0.01], ["PRECTOTCORR", "precip_total_mm", 1]]) {
    const r = await fetchAnnual(-13.62, -38.93, v, 1981, 2025);
    const ref = col(column);
    const maxDiff = Math.max(...r.vals.map((x, i) => Math.abs(x - ref[i])));
    ok(r.years.length === 45 && maxDiff <= tol, `${v}: 45 complete years, max difference to CSV ${maxDiff.toFixed(4)}`);
    const a = analyse(r.years, r.vals);
    console.log(`  ${v}: ${(a.sen.slope * 10).toFixed(3)} per decade, after ${r.years[a.pt.k]}`);
  }
}

console.log(`\n${total - fails} of ${total} checks passed`);
process.exit(fails ? 1 : 0);
