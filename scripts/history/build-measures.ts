// Builds public/data/history/measures.json: town measures by census year (1970-2020) and the latest
// American Community Survey 5-year period, plus each town's top countries of birth.
// Source: IPUMS NHGIS time series tables for NJ county subdivisions (= municipalities), downloaded by
// scripts/history/fetch-phase2.sh into .cache/history/nhgis/. Run: npm run history:measures
//
// NHGIS keeps one row per historical municipality; rows for renamed or merged towns are mapped onto
// today's towns with HISTORIC_CODES below. Counts are added together; a median can't be combined, so
// a median for a year that two former towns both report is left out ("not available").

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.ts';
import { MERGED } from './crosswalk.ts';

const NHGIS = join(ROOT, '.cache', 'history', 'nhgis');
const OUT = join(ROOT, 'public', 'data', 'history');
const problems: string[] = [];

/** NHGIS integrated codes (34 + county + code) of former towns → today's GEOID. */
const HISTORIC_CODES: Record<string, string> = {
  '34003055': '3400321300', // East Paterson borough → Elmwood Park (renamed 1973)
  '3401309265': '3401309250', // Caldwell (older code) → Caldwell borough
  '3401321850': '3401321840', // Essex Fells (older code)
  '3401326620': '3401326610', // Glen Ridge (older code)
  '3401352630': '3401352620', // North Caldwell (older code)
  '34013085': '3401313045', // Orange city → City of Orange township
  '3402160915': '3402160900', // Princeton township → Princeton (consolidated 2013)
  '3402177210': '3402163850', // Washington township (Mercer) → Robbinsville (renamed 2007)
  '34023045': '3402354705', // Madison township → Old Bridge (renamed 1975)
  '34025150': '3402500070', // Matawan township → Aberdeen (renamed 1978)
  '34025180': '3402573020', // New Shrewsbury → Tinton Falls (renamed 1975)
  '3402568670': '3402537560', // South Belmar → Lake Como (renamed 2005)
  '3402756520': '3402741362', // Passaic township → Long Hill (renamed 1992)
  '3402918130': '3402973125', // Dover township → Toms River (renamed 2006)
  '34029165': '3402903050', // Union township (Ocean) → Barnegat (renamed 1977)
  '3403179820': '3403182423', // West Paterson → Woodland Park (renamed 2008)
  '34033065': '3403310610', // Upper Penns Neck → Carneys Point (renamed 1975)
  '3404155650': '3404129820', // Pahaquarry → Hardwick (consolidated 1997)
};
for (const [from, to] of MERGED) HISTORIC_CODES[from] = to;

const towns: Record<string, { name: string; population: number }> = JSON.parse(
  readFileSync(join(ROOT, 'public', 'data', 'boundaries', 'municipalities.json'), 'utf8'),
);
const population: { years: number[]; towns: Record<string, (number | null)[]>; area_sq_mi: Record<string, number> } = JSON.parse(
  readFileSync(join(OUT, 'population.json'), 'utf8'),
);

// --- Read the extract (the CSV has a header row, then a row of labels). ---
const dir = readdirSync(NHGIS).find((d) => /^nhgis\d+_csv$/.test(d) && existsSync(join(NHGIS, d)));
if (!dir) throw new Error(`No NHGIS extract in ${NHGIS}; run sh scripts/history/fetch-phase2.sh`);
const file = readdirSync(join(NHGIS, dir)).find((f) => f.endsWith('_ts_nominal_cty_sub.csv'))!;
const codebook = readFileSync(join(NHGIS, dir, file.replace('.csv', '_codebook.txt')), 'latin1');

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const [head, , ...body] = parseCsv(readFileSync(join(NHGIS, dir, file), 'latin1'));
const col = new Map(head.map((h, i) => [h, i]));

/** Source rows grouped by today's town. */
const rowsByTown = new Map<string, string[][]>();
for (const r of body) {
  const code = `34${r[col.get('COUNTYFP')!]}${r[col.get('CTY_SUBA')!]}`;
  if (code.endsWith('00000')) continue; // "County subdivisions not defined": water areas, no people
  const id = HISTORIC_CODES[code] ?? code;
  if (!towns[id]) {
    problems.push(`NHGIS row ${code} (${r[col.get('CTY_SUB')!]}) has no town today`);
    continue;
  }
  rowsByTown.set(id, [...(rowsByTown.get(id) ?? []), r]);
}
for (const id of Object.keys(towns)) if (!rowsByTown.has(id)) problems.push(`No NHGIS rows for ${towns[id].name}`);

// Periods: census years, then the latest ACS 5-year period in the file.
const acsCodes = [...head.join(' ').matchAll(/AR5AA(\d{3})\b/g)].map((m) => m[1]).sort();
const ACS = acsCodes.at(-1)!; // e.g. "245" = 2020-2024
const acsLabel = `${2000 + Number(ACS.slice(0, 2)) - 4}–${2000 + Number(ACS.slice(0, 2))}`;
const PERIODS = [
  ...['1970', '1980', '1990', '2000', '2010', '2020'].map((k) => ({ key: k, label: k, acs: false })),
  { key: ACS, label: acsLabel, acs: true },
];

const num = (r: string[], name: string): number | null => {
  const i = col.get(name);
  if (i === undefined || r[i] === '' || r[i] === undefined) return null;
  const v = Number(r[i]);
  return Number.isFinite(v) ? v : null;
};
/** Sum of a count over a town's source rows (null if no row reports it). Margins of error add in quadrature. */
function count(id: string, name: string): { v: number; moe: number | null } | null {
  let v: number | null = null, moe2: number | null = null;
  for (const r of rowsByTown.get(id) ?? []) {
    const x = num(r, name);
    if (x === null) continue;
    v = (v ?? 0) + x;
    const m = num(r, `${name}M`);
    if (m !== null) moe2 = (moe2 ?? 0) + m * m;
  }
  return v === null ? null : { v, moe: moe2 === null ? null : Math.sqrt(moe2) };
}
function median(id: string, name: string): { v: number; moe: number | null } | null {
  const found = (rowsByTown.get(id) ?? []).map((r) => ({ v: num(r, name), moe: num(r, `${name}M`) })).filter((x) => x.v !== null);
  return found.length === 1 ? (found[0] as { v: number; moe: number | null }) : null;
}
// A proportion's margin of error (Census Bureau ACS handbook formula for a derived proportion).
const propMoe = (n: { v: number; moe: number | null }, d: { v: number; moe: number | null }) => {
  if (n.moe === null || d.moe === null || d.v === 0) return null;
  const p = n.v / d.v;
  const r = n.moe ** 2 - p ** 2 * d.moe ** 2;
  return Math.sqrt(r >= 0 ? r : n.moe ** 2 + p ** 2 * d.moe ** 2) / d.v;
};
/** Coefficient of variation over 30% means "too uncertain to map" (spec rule). */
const unreliable = (v: number, moe: number | null) => moe !== null && v !== 0 && moe / 1.645 / Math.abs(v) > 0.3;

type Series = { values: (number | null)[]; flagged: number[] };
const metrics: Record<string, Record<string, Series>> = {
  median_age: {}, per_household: {}, pct_foreign_born: {}, homes_per_sq_mi: {}, pct_owner: {},
};
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const popIndex = (year: string) => population.years.indexOf(Number(year));

for (const id of Object.keys(towns)) {
  const series = Object.fromEntries(Object.keys(metrics).map((m) => [m, { values: [] as (number | null)[], flagged: [] as number[] }]));
  PERIODS.forEach((p, i) => {
    const k = p.key;
    // Median age
    const age = median(id, `D13AA${k}`);
    series.median_age.values.push(age ? age.v : null);
    if (age && unreliable(age.v, age.moe)) series.median_age.flagged.push(i);
    // Residents per household: all residents (census count, or ACS native + foreign-born) ÷ households
    const hh = count(id, `AR5AA${k}`);
    let people: number | null = null;
    if (!p.acs) people = population.towns[id]?.[popIndex(k)] ?? null;
    else {
      const a = count(id, `AT5AA${k}`), b = count(id, `AT5AB${k}`);
      people = a && b ? a.v + b.v : null;
    }
    series.per_household.values.push(hh && people && hh.v > 0 ? round(people / hh.v, 2) : null);
    // Share born abroad
    const nat = count(id, `AT5AA${k}`), fb = count(id, `AT5AB${k}`);
    if (nat && fb && nat.v + fb.v > 0) {
      const total = { v: nat.v + fb.v, moe: nat.moe !== null && fb.moe !== null ? Math.hypot(nat.moe, fb.moe) : null };
      series.pct_foreign_born.values.push(round((100 * fb.v) / total.v));
      const moe = propMoe(fb, total);
      if (moe !== null && unreliable(fb.v / total.v, moe)) series.pct_foreign_born.flagged.push(i);
    } else series.pct_foreign_born.values.push(null);
    // Homes per square mile
    const hu = count(id, `A41AA${k}`);
    series.homes_per_sq_mi.values.push(hu ? Math.round(hu.v / population.area_sq_mi[id]) : null);
    // Share of occupied homes lived in by their owners
    const own = count(id, `B37AA${k}`), rent = count(id, `B37AB${k}`);
    if (own && rent && own.v + rent.v > 0) {
      const occ = { v: own.v + rent.v, moe: own.moe !== null && rent.moe !== null ? Math.hypot(own.moe, rent.moe) : null };
      series.pct_owner.values.push(round((100 * own.v) / occ.v));
      const moe = propMoe(own, occ);
      if (moe !== null && unreliable(own.v / occ.v, moe)) series.pct_owner.flagged.push(i);
    } else series.pct_owner.values.push(null);
  });
  for (const m of Object.keys(metrics)) metrics[m][id] = series[m];
}

// --- Countries of birth: 2000 census (AK5) and the latest ACS period (D10). ---
function leafSeries(table: string): Map<string, string> {
  const section = codebook.split(/\nTable \d+: /).find((s) => s.startsWith(`(${table})`)) ?? '';
  const labels = [...section.matchAll(/Time series (\w\w): Persons: Foreign born ~ (.+)/g)].map((m) => [m[1], m[2].trim()] as const);
  const leaves = new Map<string, string>();
  for (const [code, label] of labels) {
    if (labels.some(([, other]) => other.startsWith(`${label}--`))) continue; // a region, not a country
    const name = label
      .split('--')
      .at(-1)!
      .replace(/\s*\[.*?\]\s*/g, '')
      .replace(/^United Kingdom, excluding England and Scotland$/, 'United Kingdom (other)')
      .replace(/, excluding .*$/, '')
      .trim();
    if (/^Other |n\.e\.c\.|, not specified|^Born at sea/i.test(name)) continue;
    leaves.set(`${table}${code}`, name);
  }
  if (!leaves.size) problems.push(`No countries found for table ${table}`);
  return leaves;
}
const TOP = 5;
const birthplace: Record<string, Record<string, [string, number][]>> = {};
for (const [table, period] of [['AK5', '2000'], ['D10', ACS]] as const) {
  const leaves = leafSeries(table);
  for (const id of Object.keys(towns)) {
    const list: [string, number][] = [];
    for (const [code, name] of leaves) {
      const c = count(id, `${code}${period}`);
      if (!c || c.v <= 0) continue;
      if (period === ACS && unreliable(c.v, c.moe)) continue; // too uncertain to name
      list.push([name, c.v]);
    }
    list.sort((a, b) => b[1] - a[1]);
    (birthplace[id] ??= {})[period] = list.slice(0, TOP);
  }
}

// --- Checks ---
const glen = metrics.median_age['3401326610'];
if (!glen || glen.values.every((v) => v === null)) problems.push('Glen Ridge has no median ages; column names may have changed');
for (const [m, byTown] of Object.entries(metrics)) {
  const filled = Object.values(byTown).filter((s) => s.values.some((v) => v !== null)).length;
  if (filled < 560) problems.push(`${m}: only ${filled} towns have any values`);
}
if (problems.length) {
  console.error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

writeFileSync(
  join(OUT, 'measures.json'),
  JSON.stringify({
    periods: PERIODS,
    metrics,
    birthplace: { periods: ['2000', ACS], towns: birthplace },
    rule: 'ACS values whose coefficient of variation is above 30% are flagged (greyed out) and countries below that bar are not named.',
    sources: [
      {
        name: 'IPUMS NHGIS time series tables (D13, AR5, AT5, A41, B37, AK5, D10), county subdivisions, New Jersey',
        citation: 'Steven Manson, Jonathan Schroeder, David Van Riper, Katherine Knowles, Tracy Kugler, Finn Roberts, and Steven Ruggles. IPUMS National Historical Geographic Information System. Minneapolis, MN: IPUMS.',
        url: 'https://www.nhgis.org/',
      },
    ],
  }),
);
const flagged = Object.values(metrics).reduce((s, byTown) => s + Object.values(byTown).reduce((t, x) => t + x.flagged.length, 0), 0);
console.log(`Wrote measures for ${Object.keys(towns).length} towns, ${PERIODS.length} periods (latest ACS ${acsLabel}); ${flagged} values flagged as too uncertain.`);
