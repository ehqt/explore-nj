// Builds public/data/history/population.json: population of each of today's 564 municipalities,
// by decade 1940-2020 plus the latest Census estimate (July 1, 2025).
// Run: sh scripts/history/fetch.sh && npm run history
//
// Sources:
// - 1940-2000: NJ Department of Labor, "New Jersey Population Trends 1790 to 2000", Table 6
//   (US Censuses of Population and Housing).
// - 2010: Census Bureau subcounty estimates, Vintage 2020 (CENSUS2010POP column = the 2010 Census count).
// - 2020 and 2025: Census Bureau subcounty estimates, Vintage 2025 (2020 base and July 1, 2025 estimate);
//   the 2020 decade value is the 2020 Census count already in public/data/boundaries.
// Joins are on Census codes wherever the source has them; Table 6 has names only, so its rows are
// matched by name within county against the 2010 Census names, and every unmatched row fails the build.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.ts';
import { CORRECTIONS, EXTRA_2010, FORMER_NAMES, MERGED, NOTES } from './crosswalk.ts';

const CACHE = join(ROOT, '.cache', 'history');
const OUT = join(ROOT, 'public', 'data', 'history');
const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000];
const YEARS = [...DECADES, 2010, 2020, 2025];

const towns: Record<string, { name: string; county: string; population: number }> = JSON.parse(
  readFileSync(join(ROOT, 'public', 'data', 'boundaries', 'municipalities.json'), 'utf8'),
);
const counties: Record<string, { name: string }> = JSON.parse(
  readFileSync(join(ROOT, 'public', 'data', 'boundaries', 'counties.json'), 'utf8'),
);
const problems: string[] = [];

const norm = (s: string) =>
  s.toLowerCase().replace(/\*/g, '').replace(/[.'’]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

// Merged towns map to their successor; everything else maps to itself if it exists today.
const successor = new Map(MERGED.map(([from, to]) => [from, to]));
const today = (geoid: string) => successor.get(geoid) ?? geoid;

function readCsv(file: string): Record<string, string>[] {
  const [head, ...rows] = readFileSync(join(CACHE, file), 'latin1').trim().split(/\r?\n/);
  const cols = head.split(',');
  return rows.map((r) => {
    const f = r.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, f[i]]));
  });
}

// --- Census estimates files: county subdivisions (summary level 061) carry county + MCD codes. ---
const v2020 = readCsv('sub-est2020_34.csv').filter((r) => r.SUMLEV === '061');
const v2025 = readCsv('sub-est2025_34.csv').filter((r) => r.SUMLEV === '061');
const geoidOf = (r: Record<string, string>) => `34${r.COUNTY}${r.COUSUB}`;

const values = new Map<string, (number | null)[]>();
for (const id of Object.keys(towns)) values.set(id, YEARS.map(() => null));
const add = (geoid: string, year: number, n: number) => {
  const id = today(geoid);
  const row = values.get(id);
  if (!row) return problems.push(`${year}: no municipality today for code ${geoid}`);
  const i = YEARS.indexOf(year);
  row[i] = (row[i] ?? 0) + n;
};

// 2010 names by county, for matching Table 6 rows (names only) to codes.
const byName = new Map<string, string>();
for (const r of v2020) {
  add(geoidOf(r), 2010, Number(r.CENSUS2010POP));
  byName.set(`${r.COUNTY}|${norm(r.NAME)}`, geoidOf(r));
}
for (const [id, n] of EXTRA_2010) add(id, 2010, n);
for (const r of v2025) add(geoidOf(r), 2025, Number(r.POPESTIMATE2025));
for (const [id, t] of Object.entries(towns)) {
  // The boundary file already folds Pine Valley into Pine Hill for 2020.
  values.get(id)![YEARS.indexOf(2020)] = t.population;
}

// --- Table 6 (1940-2000), from the PDF's text layer. ---
execFileSync('pdftotext', ['-layout', join(CACHE, 'njsdcp3.pdf'), join(CACHE, 'njsdcp3.txt')]);
const lines = readFileSync(join(CACHE, 'njsdcp3.txt'), 'utf8').split('\n');
const countyCode = new Map(Object.entries(counties).map(([id, c]) => [norm(c.name.replace(/ County$/, '')), id.slice(2)]));
const countyTotals = new Map<string, number[]>();
let inTable = false;
let county: string | null = null;
let matched = 0;
for (const line of lines) {
  if (/Table 6\. New Jersey Resident Population by Municipality/.test(line)) inTable = true;
  else if (/Table 7\./.test(line)) inTable = false;
  if (!inTable) continue;
  const header = line.match(/^\s*([A-Z][A-Z ]+?) County\s*$/);
  if (header) {
    county = countyCode.get(norm(header[1])) ?? null;
    if (!county) problems.push(`Table 6: unknown county "${header[1]}"`);
    continue;
  }
  const m = line.match(/^\s*(\S.*?\S)\s{2,}((?:(?:[\d,]+|NA)\s+){6}(?:[\d,]+|NA))\s*$/);
  if (!m || !county || m[1] === 'MUNICIPALITY') continue;
  const nums = m[2].trim().split(/\s+/).map((v) => (v === 'NA' ? null : Number(v.replace(/,/g, ''))));
  const name = m[1];
  if (/ COUNTY$/.test(name)) {
    countyTotals.set(county, nums as number[]);
    continue;
  }
  const key = norm(name);
  const geoid = FORMER_NAMES[county]?.[key] ?? byName.get(`${county}|${key}`);
  if (!geoid) {
    problems.push(`Table 6: no match for "${name}" in county ${county}`);
    continue;
  }
  matched++;
  DECADES.forEach((year, i) => {
    if (nums[i] !== null) add(geoid, year, nums[i]!);
  });
}

for (const [id, year, right, wrong] of CORRECTIONS) {
  const row = values.get(id)!;
  const i = YEARS.indexOf(year);
  if (row[i] !== wrong) problems.push(`Correction for ${id} ${year} expected Table 6 value ${wrong}, found ${row[i]}`);
  row[i] = right;
  const totals = countyTotals.get(id.slice(2, 5));
  if (totals) totals[DECADES.indexOf(year)] += right - wrong;
}

// Towns that weren't separate municipalities yet print NA in Table 6 and stay null ("no data").

// --- Checks: county sums against Table 6's own county totals, state sums against published totals. ---
// Table 6 has a few small internal inconsistencies (town rows that don't add up to its county total by a
// handful of people). Those are reported as warnings; anything over 0.1% fails the build.
const warnings: string[] = [];
for (const [code, totals] of countyTotals) {
  DECADES.forEach((year, i) => {
    let sum = 0;
    for (const [id, row] of values) if (id.slice(2, 5) === code) sum += row[YEARS.indexOf(year)] ?? 0;
    if (sum === totals[i]) return;
    const msg = `${counties[`34${code}`].name} ${year}: towns sum to ${sum}, Table 6 county total is ${totals[i]} (${sum - totals[i] > 0 ? '+' : ''}${sum - totals[i]})`;
    (Math.abs(sum - totals[i]) / totals[i] <= 0.001 ? warnings : problems).push(msg);
  });
}
if (countyTotals.size !== 21) problems.push(`Table 6: found ${countyTotals.size} county totals, expected 21`);
const STATE: Record<number, number> = {
  1940: 4_160_165, 1950: 4_835_329, 1960: 6_066_782, 1970: 7_171_112, 1980: 7_365_011,
  1990: 7_730_188, 2000: 8_414_350, 2010: 8_791_894, 2020: 9_288_994,
};
const state = YEARS.map((year) => [...values.values()].reduce((s, row) => s + (row[YEARS.indexOf(year)] ?? 0), 0));
for (const [year, total] of Object.entries(STATE)) {
  const got = state[YEARS.indexOf(Number(year))];
  if (got === total) continue;
  const msg = `State ${year}: towns sum to ${got}, published total is ${total} (${got - total > 0 ? '+' : ''}${got - total})`;
  (Math.abs(got - total) / total <= 0.001 ? warnings : problems).push(msg);
}
if (warnings.length) console.warn(`${warnings.length} warning(s), small source inconsistencies:\n  ${warnings.join('\n  ')}`);

// --- Approximate land area (sq mi) from the shoreline-clipped boundaries, for density. ---
// Spherical polygon area; rings after the first are holes. Small ponds and creeks are still inside,
// so this is a little above the Census land area for some towns.
const R = 6_371_008.8;
const ringArea = (ring: number[][]) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
    sum += ((x2 - x1) * Math.PI / 180) * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180));
  }
  return Math.abs((sum * R * R) / 2);
};
const polyArea = (poly: number[][][]) => ringArea(poly[0]) - poly.slice(1).reduce((s, r) => s + ringArea(r), 0);
const shapes = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'boundaries', 'municipalities.geojson'), 'utf8'));
const area: Record<string, number> = {};
for (const f of shapes.features) {
  const g = f.geometry;
  const m2 = g.type === 'Polygon' ? polyArea(g.coordinates) : g.coordinates.reduce((s: number, p: number[][][]) => s + polyArea(p), 0);
  area[f.properties.id] = Math.round((m2 / 2_589_988.11) * 100) / 100;
}
for (const id of Object.keys(towns)) if (!(area[id] > 0)) problems.push(`No area for ${id}`);

console.log(`Table 6: matched ${matched} municipal rows`);
if (problems.length) {
  console.error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  join(OUT, 'population.json'),
  JSON.stringify({
    years: YEARS,
    estimate_years: [2025],
    state,
    towns: Object.fromEntries(values),
    area_sq_mi: area,
    corrections: CORRECTIONS.map(([id, year, right, wrong, source]) => ({ id, year, value: right, table_6_value: wrong, source })),
    source_inconsistencies: warnings,
    notes: NOTES,
    sources: [
      { years: '1940–2000', name: 'NJ Department of Labor, New Jersey Population Trends 1790 to 2000, Table 6', url: 'https://www.nj.gov/labor/labormarketinformation/assets/PDFs/census/2kpub/njsdcp3.pdf' },
      { years: '2010', name: 'U.S. Census Bureau, 2010 Census (via subcounty estimates, Vintage 2020)', url: 'https://www2.census.gov/programs-surveys/popest/datasets/2010-2020/cities/SUB-EST2020_34.csv' },
      { years: '2020', name: 'U.S. Census Bureau, 2020 Census redistricting data, table P1', url: 'https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/New_Jersey/nj2020.pl.zip' },
      { years: '2025', name: 'U.S. Census Bureau, subcounty population estimates, Vintage 2025 (July 1, 2025)', url: 'https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_34.csv' },
    ],
  }),
);
console.log(`Wrote ${Object.keys(towns).length} towns to public/data/history/population.json`);
