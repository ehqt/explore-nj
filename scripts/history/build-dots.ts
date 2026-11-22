// Builds the "Who lives here" dot maps: one dot per 50 residents, colored by race and Hispanic origin,
// for 1970-2020. Writes public/data/history/dots/<year>.bin (packed coordinates) and dots.json (index).
// Run: npm run history:dots   (after scripts/history/fetch-phase2.sh and fetch-phase2b.sh)
//
// Sources (IPUMS NHGIS):
// - 1990-2020: CW7, Persons by Hispanic or Latino Origin by Race, standardized to 2010 block groups,
//   placed in 2010 Census block groups (TIGER/Line).
// - 1980: CV4, Persons by Hispanic or Latino Origin by Race, 1980 census tracts.
// - 1970: B18, Persons by Race, 1970 census tracts. The 1970 tables don't separate Hispanic origin.
// Tracts in 1970 and 1980 didn't cover the whole state; untracted areas are written to
// <year>-no-data.geojson and shown as "no data for this decade".
// Dots are placed at random (with a fixed seed) inside each area, after clipping areas to land.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import mapshaper from 'mapshaper';
import { ROOT } from '../lib/content.ts';

const CACHE = join(ROOT, '.cache', 'history');
const SHAPES = join(CACHE, 'shapes');
const OUT = join(ROOT, 'public', 'data', 'history', 'dots');
const PER_DOT = 50;
const CATEGORIES = ['white', 'black', 'hispanic', 'asian', 'other'] as const;
type Cat = (typeof CATEGORIES)[number];

// --- Unpack sources if needed. ---
function unzip(zip: string, dir: string) {
  if (!existsSync(dir)) execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
}
const nhgisDir = join(CACHE, 'nhgis');
const shapeZip = readdirSync(nhgisDir).find((f) => /_shape\.zip$/.test(f));
if (!shapeZip) throw new Error('No NHGIS shapefile download; run sh scripts/history/fetch-phase2b.sh');
unzip(join(nhgisDir, shapeZip), join(SHAPES, 'nhgis'));
const inner = (year: number) => {
  const sub = readdirSync(join(SHAPES, 'nhgis')).find((d) => !d.includes('.'))!;
  const zip = readdirSync(join(SHAPES, 'nhgis', sub)).find((f) => f.endsWith(`tract_${year}.zip`))!;
  const dir = join(SHAPES, `tract${year}`);
  unzip(join(SHAPES, 'nhgis', sub, zip), dir);
  return join(dir, `US_tract_${year}.shp`);
};
unzip(join(CACHE, 'tiger', 'tl_2010_34_bg10.zip'), join(SHAPES, 'bg2010'));
for (const f of readdirSync(nhgisDir)) if (/_csv\.zip$/.test(f)) unzip(join(nhgisDir, f), join(nhgisDir, f.replace('.zip', '')));

// --- CSV helpers (header row, then a row of labels). ---
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
/** The newest extract file with this suffix that has the given column. */
function readTable(suffix: string, needs: string): { get: (r: string[], c: string) => string; rows: string[][]; has: (c: string) => boolean } {
  for (const d of readdirSync(nhgisDir).sort().reverse()) {
    const p = join(nhgisDir, d, d.replace(/_csv(\.zip)?$/, '') + suffix);
    const nested = join(nhgisDir, d, d, d.replace(/_csv$/, '') + suffix);
    for (const file of [p, nested]) {
      if (!existsSync(file)) continue;
      const [head, , ...rows] = parseCsv(readFileSync(file, 'latin1'));
      if (!head.includes(needs)) continue;
      const col = new Map(head.map((h, i) => [h, i]));
      return { rows, get: (r, c) => r[col.get(c) ?? -1] ?? '', has: (c) => col.has(c) };
    }
  }
  throw new Error(`No NHGIS file ending ${suffix} with column ${needs}; run sh scripts/history/fetch-phase2b.sh`);
}
const n = (s: string) => (s === '' ? 0 : Number(s));

// --- Counts per area, by year and category. ---
type Counts = Map<string, Record<Cat, number>>;
const zero = (): Record<Cat, number> => ({ white: 0, black: 0, hispanic: 0, asian: 0, other: 0 });
const byYear = new Map<number, Counts>();

// 1990-2020 on 2010 block groups (key: county+tract+block group = GEOID10 without the state).
const bg = readTable('_ts_geog2010_blck_grp.csv', 'CW7AA2010');
const CW7: Record<string, Cat> = { AA: 'white', AB: 'black', AC: 'other', AD: 'asian', AE: 'other', AF: 'other' };
for (const year of [1990, 2000, 2010, 2020]) {
  const counts: Counts = new Map();
  for (const r of bg.rows) {
    const key = `34${bg.get(r, 'COUNTYA')}${bg.get(r, 'TRACTA')}${bg.get(r, 'BLCK_GRPA')}`;
    const c = zero();
    for (const s of ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL']) {
      const v = n(bg.get(r, `CW7${s}${year}`));
      c[CW7[s] ?? 'hispanic'] += v;
    }
    counts.set(key, c);
  }
  byYear.set(year, counts);
}
// 1970 and 1980 on that year's tracts (key: the tract's GIS join code).
const tr = readTable('_ts_nominal_tract.csv', 'CV4AA1980');
{
  const c1980: Counts = new Map(), c1970: Counts = new Map();
  const CV4: Record<string, Cat> = { AA: 'white', AB: 'black', AC: 'asian', AD: 'other', AE: 'other' };
  const B18: Record<string, Cat> = { AA: 'white', AB: 'black', AC: 'other', AD: 'asian', AE: 'other' };
  for (const r of tr.rows) {
    const g80 = tr.get(r, 'GJOIN1980');
    if (g80) {
      const c = c1980.get(g80) ?? zero();
      for (const s of ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ']) c[CV4[s] ?? 'hispanic'] += n(tr.get(r, `CV4${s}1980`));
      c1980.set(g80, c);
    }
    const g70 = tr.get(r, 'GJOIN1970');
    if (g70) {
      const c = c1970.get(g70) ?? zero();
      for (const s of ['AA', 'AB', 'AC', 'AD', 'AE']) c[B18[s]] += n(tr.get(r, `B18${s}1970`));
      c1970.set(g70, c);
    }
  }
  byYear.set(1980, c1980);
  byYear.set(1970, c1970);
}

// --- Shapes, clipped to land (the dissolved municipal boundaries are shoreline-clipped). ---
const land = readFileSync(join(ROOT, 'public', 'data', 'boundaries', 'municipalities.geojson'), 'utf8');
async function shapes(shp: string, filter: string, idField: string): Promise<{ type: string; features: { properties: Record<string, string>; geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] }> {
  const out = (await mapshaper.applyCommands(
    `-i "${shp}" ${filter} -proj wgs84 -i land.json name=land -dissolve2 -target 1 -clip land -each 'id=${idField}' -filter-fields id -o out.json format=geojson precision=0.00001`,
    { 'land.json': land },
  )) as Record<string, string>;
  return JSON.parse(out['out.json']);
}
const geoms = new Map<number, Awaited<ReturnType<typeof shapes>>>();
console.log('Clipping 2010 block groups to land...');
const bgShapes = await shapes(join(SHAPES, 'bg2010', 'tl_2010_34_bg10.shp'), '', 'GEOID10');
for (const y of [1990, 2000, 2010, 2020]) geoms.set(y, bgShapes);
for (const y of [1970, 1980]) {
  console.log(`Clipping ${y} tracts to land...`);
  geoms.set(y, await shapes(inner(y), `-filter "NHGISST==='340'"`, 'GISJOIN'));
}

// --- Dots. ---
let seed = 20261122;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const BBOX = [-75.6, 38.9, -73.88, 41.36]; // NJ, with a margin
const qx = (x: number) => Math.round(((x - BBOX[0]) / (BBOX[2] - BBOX[0])) * 65535);
const qy = (y: number) => Math.round(((y - BBOX[1]) / (BBOX[3] - BBOX[1])) * 65535);

type Ring = number[][];
const inRing = (x: number, y: number, ring: Ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
function polygons(g: { type: string; coordinates: unknown }): Ring[][] {
  return g.type === 'Polygon' ? [g.coordinates as Ring[]] : (g.coordinates as Ring[][]);
}
function randomPoint(polys: Ring[][]): [number, number] | null {
  let box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of polys) for (const [x, y] of p[0]) box = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)];
  for (let tries = 0; tries < 500; tries++) {
    const x = box[0] + rand() * (box[2] - box[0]), y = box[1] + rand() * (box[3] - box[1]);
    if (polys.some((p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h)))) return [x, y];
  }
  return null;
}

mkdirSync(OUT, { recursive: true });
const index: Record<string, { file: string; counts: Record<Cat, number>; people: Record<Cat, number>; no_data?: string }> = {};
const problems: string[] = [];
for (const year of [1970, 1980, 1990, 2000, 2010, 2020]) {
  const counts = byYear.get(year)!;
  const fc = geoms.get(year)!;
  const pts: Record<Cat, number[]> = { white: [], black: [], hispanic: [], asian: [], other: [] };
  const people = zero();
  let unmatched = 0;
  const matched = new Set<string>();
  for (const f of fc.features) {
    const id = f.properties.id;
    const c = counts.get(id);
    if (!c) { unmatched++; continue; }
    matched.add(id);
    const polys = polygons(f.geometry);
    for (const cat of CATEGORIES) {
      people[cat] += c[cat];
      // Stochastic rounding keeps the statewide dot count true to the totals.
      const exact = c[cat] / PER_DOT;
      const k = Math.floor(exact) + (rand() < exact - Math.floor(exact) ? 1 : 0);
      for (let i = 0; i < k; i++) {
        const p = randomPoint(polys);
        if (p) pts[cat].push(qx(p[0]), qy(p[1]));
      }
    }
  }
  // People in areas with no shape (rare; e.g. a tract that's all water after clipping) are reported.
  let lost = 0;
  for (const [id, c] of counts) if (!matched.has(id)) lost += CATEGORIES.reduce((s, k) => s + c[k], 0);
  const total = CATEGORIES.reduce((s, k) => s + people[k], 0);
  if (lost / (total + lost) > 0.002) problems.push(`${year}: ${lost} people in areas with no shape`);
  const buf = Buffer.concat(CATEGORIES.map((k) => Buffer.from(new Uint16Array(pts[k]).buffer)));
  writeFileSync(join(OUT, `${year}.bin`), buf);
  index[year] = {
    file: `${year}.bin`,
    counts: Object.fromEntries(CATEGORIES.map((k) => [k, pts[k].length / 2])) as Record<Cat, number>,
    people: Object.fromEntries(CATEGORIES.map((k) => [k, Math.round(people[k])])) as Record<Cat, number>,
  };
  console.log(`${year}: ${Math.round(total).toLocaleString()} people, ${(buf.length / 4).toLocaleString()} dots; ${lost} people not placed`);
}

// --- Untracted areas in 1970 and 1980: NJ land minus that year's tracts. ---
for (const year of [1970, 1980]) {
  const out = (await mapshaper.applyCommands(
    `-i land.json -dissolve2 -i tracts.json name=tracts -dissolve2 -target 1 -erase tracts -filter-slivers min-area=1km2 -simplify 10% keep-shapes -o out.json format=geojson precision=0.0001`,
    { 'land.json': land, 'tracts.json': JSON.stringify(geoms.get(year)) },
  )) as Record<string, string>;
  writeFileSync(join(OUT, `${year}-no-data.geojson`), out['out.json']);
  index[year].no_data = `${year}-no-data.geojson`;
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
writeFileSync(
  join(OUT, 'dots.json'),
  JSON.stringify({
    per_dot: PER_DOT,
    bbox: BBOX,
    categories: CATEGORIES,
    years: index,
    notes: {
      1970: 'The 1970 census tables used here don’t separate Hispanic origin; Hispanic residents are counted in their race group.',
      1980: 'Asian includes American Indian and Pacific Islander residents in 1980.',
    },
    source: 'IPUMS NHGIS (tables CW7, CV4, B18; 1970 and 1980 tract boundaries); U.S. Census Bureau TIGER/Line 2010 block groups.',
  }),
);
console.log('Wrote public/data/history/dots/');
