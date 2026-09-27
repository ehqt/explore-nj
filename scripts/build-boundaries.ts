// Builds the county and municipal boundary data from U.S. Census Bureau sources.
// Run by hand when the Census publishes new boundaries (about once a year):
//   npm run boundaries
// Outputs are committed under public/data/boundaries/ so normal builds need no downloads.
//
// Sources (all public domain):
// - Boundaries: Census TIGER/Line county subdivisions for NJ (in New Jersey every
//   county subdivision is a municipality), at full detail so "which town is this
//   address in?" gets the right answer near borders. TIGER boundaries run out into
//   rivers, bays and the ocean, so large water bodies (TIGER area hydrography) are
//   cut out, leaving shoreline-clipped shapes.
// - County names: Census cartographic boundary file (same codes).
// - Population: 2020 Census redistricting data (P.L. 94-171), table P1.
// - Wikipedia links: Wikidata, matched on the Census GNIS code, never on names.

import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import mapshaper from 'mapshaper';
import { ROOT } from './lib/content.ts';

const BOUNDARY_YEAR = 2025;
const BOUNDARY_URL = `https://www2.census.gov/geo/tiger/TIGER${BOUNDARY_YEAR}/COUSUB/tl_${BOUNDARY_YEAR}_34_cousub.zip`;
const NAMES_URL = `https://www2.census.gov/geo/tiger/GENZ${BOUNDARY_YEAR}/shp/cb_${BOUNDARY_YEAR}_34_cousub_500k.zip`;
const waterUrl = (county: string) =>
  `https://www2.census.gov/geo/tiger/TIGER${BOUNDARY_YEAR}/AREAWATER/tl_${BOUNDARY_YEAR}_34${county}_areawater.zip`;
const NJ_COUNTY_CODES = ['001', '003', '005', '007', '009', '011', '013', '015', '017', '019', '021', '023', '025', '027', '029', '031', '033', '035', '037', '039', '041'];
// Water bodies smaller than this stay part of their town (ponds, narrow creeks).
const MIN_WATER_AREA_M2 = 500_000;
// Simplification tolerance: borders stay within about this many meters of the Census line.
const SIMPLIFY_METERS = 15;
const PL_URL =
  'https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/New_Jersey/nj2020.pl.zip';
const NJ_POPULATION_2020 = 9_288_994;
const USER_AGENT = 'ExploreNJ/1.0 (+https://github.com/ehqt/explore-nj)';

// Municipalities merged since the 2020 Census: [absorbed GEOID, surviving GEOID, note].
const MERGERS: [string, string, string][] = [
  ['3400758920', '3400758770', 'Includes the former Pine Valley borough, which merged into Pine Hill in 2022.'],
];

// Census LSAD codes for NJ county subdivisions. Princeton (00) is a consolidated municipality.
const TYPES: Record<string, string> = {
  '21': 'borough',
  '25': 'city',
  '43': 'town',
  '44': 'township',
  '47': 'village',
  '00': 'municipality',
};

const CACHE = join(ROOT, '.cache', 'census');
const OUT = join(ROOT, 'public', 'data', 'boundaries');

function download(url: string): string {
  mkdirSync(CACHE, { recursive: true });
  const zip = join(CACHE, url.split('/').pop()!);
  if (!existsSync(zip)) {
    console.log(`Downloading ${url}`);
    execFileSync('curl', ['-sSfL', '-A', USER_AGENT, '-o', zip, url], { stdio: 'inherit' });
  }
  execFileSync('unzip', ['-o', '-q', zip, '-d', CACHE]);
  return CACHE;
}

async function readPopulation(): Promise<Map<string, number>> {
  download(PL_URL);
  // The geographic header links each record number to a GEOID; segment 1 holds table P1.
  const recordToGeoid = new Map<string, string>();
  const geoLines = createInterface({ input: createReadStream(join(CACHE, 'njgeo2020.pl'), 'latin1') });
  for await (const line of geoLines) {
    const f = line.split('|');
    // Summary level 060 = county subdivision; component 00 = the whole area.
    if (f[2] === '060' && f[4] === '00') recordToGeoid.set(f[7], f[9]);
  }
  const population = new Map<string, number>();
  const dataLines = createInterface({ input: createReadStream(join(CACHE, 'nj000012020.pl'), 'latin1') });
  for await (const line of dataLines) {
    const f = line.split('|');
    const geoid = recordToGeoid.get(f[4]);
    if (geoid) population.set(geoid, Number(f[5]));
  }
  return population;
}

async function sparql(query: string): Promise<Record<string, { value: string }>[]> {
  const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`Wikidata query failed: HTTP ${res.status}`);
  return ((await res.json()) as { results: { bindings: Record<string, { value: string }>[] } }).results.bindings;
}

interface Link {
  wikidata: string;
  wikipedia: string;
}

/** Wikidata items keyed by `key`, preferring the item that has an English Wikipedia article. */
async function wikidataLinks(property: string, values: string[]): Promise<Map<string, Link>> {
  const rows = await sparql(`SELECT ?item ?code ?article WHERE {
    VALUES ?code { ${values.map((v) => `"${v}"`).join(' ')} }
    ?item wdt:${property} ?code .
    ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  }`);
  const links = new Map<string, Link>();
  for (const r of rows) {
    const code = r.code.value;
    if (links.has(code)) throw new Error(`Wikidata has more than one article-bearing item for ${property} ${code}`);
    links.set(code, { wikidata: r.item.value.split('/').pop()!, wikipedia: r.article.value });
  }
  return links;
}

type Position = [number, number];
interface Feature {
  properties: Record<string, string | number>;
  geometry: { type: string; coordinates: unknown };
}

function bbox(coords: unknown): [number, number, number, number] {
  const box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c: unknown) => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [x, y] = c as Position;
      box[0] = Math.min(box[0], x);
      box[1] = Math.min(box[1], y);
      box[2] = Math.max(box[2], x);
      box[3] = Math.max(box[3], y);
    } else if (Array.isArray(c)) c.forEach(walk);
  };
  walk(coords);
  return box.map((n) => Math.round(n * 1e5) / 1e5) as [number, number, number, number];
}

async function run(commands: string, input: Record<string, string>): Promise<Record<string, string>> {
  return (await mapshaper.applyCommands(commands, input)) as Record<string, string>;
}

// 1. Boundaries. Mapshaper simplifies each shared border once, so neighboring towns never
//    develop gaps or overlaps, and holes (towns inside towns) survive.
download(BOUNDARY_URL);
download(NAMES_URL);
for (const c of NJ_COUNTY_CODES) download(waterUrl(c));
const townsShp = join(CACHE, `tl_${BOUNDARY_YEAR}_34_cousub.shp`);
const waterShps = NJ_COUNTY_CODES.map((c) => join(CACHE, `tl_${BOUNDARY_YEAR}_34${c}_areawater.shp`));

const countyNames = new Map(
  (JSON.parse(
    (await run(`-i ${join(CACHE, `cb_${BOUNDARY_YEAR}_34_cousub_500k.shp`)} -o format=json out.json`, {}))['out.json'],
  ) as { COUNTYFP: string; NAMELSADCO: string }[]).map((r) => [r.COUNTYFP, r.NAMELSADCO]),
);

const out = await run(
  `-i ${waterShps.join(' ')} combine-files \
   -merge-layers force name=water \
   -filter 'this.area > ${MIN_WATER_AREA_M2}' \
   -i ${townsShp} name=towns \
   -filter 'COUSUBFP !== "00000"' \
   -erase water \
   -proj wgs84 \
   -simplify interval=${SIMPLIFY_METERS} keep-shapes \
   -clean \
   -filter-fields GEOID,NAME,LSAD,COUNTYFP,COUSUBNS \
   -dissolve COUNTYFP + name=counties \
   -dissolve target=towns + name=state \
   -points target=towns inner + name=town-labels \
   -points target=counties inner + name=county-labels \
   -o target=towns,counties,state,town-labels,county-labels format=geojson geojson-type=FeatureCollection precision=0.0001`,
  {},
);

// The shading outside New Jersey only needs a rough outline, so it's made in a separate
// run: simplifying it alongside the towns would also coarsen the town borders it shares.
const mask = await run(
  `-i state.json \
   -simplify interval=250 \
   -filter-islands min-area=5km2 remove-empty \
   -filter-slivers min-area=5km2 \
   -rectangle bbox=-80,37.6,-69.5,42.6 + name=frame \
   -erase target=frame source=state \
   -o target=frame format=geojson geojson-type=FeatureCollection precision=0.001 mask.json`,
  { 'state.json': out['state.json'] },
);

const read = (name: string) => JSON.parse(out[`${name}.json`]) as { features: Feature[] };
const towns = read('towns').features;
const counties = read('counties').features;
const townLabels = read('town-labels').features;
const countyLabels = read('county-labels').features;

// 2. Population and links.
const population = await readPopulation();
for (const [from, to] of MERGERS) {
  population.set(to, (population.get(to) ?? 0) + (population.get(from) ?? 0));
  population.delete(from);
}
const townLinks = await wikidataLinks(
  'P590',
  towns.map((t) => String(Number(t.properties.COUSUBNS))),
);
const countyLinks = await wikidataLinks(
  'P882',
  counties.map((c) => `34${c.properties.COUNTYFP}`),
);

// 3. Build the lookup tables the app uses for cards, labels and fly-to.
const problems: string[] = [];
const labelFor = (features: Feature[], key: string) =>
  new Map(features.map((f) => [String(f.properties[key]), (f.geometry.coordinates as number[]).map((n) => Math.round(n * 1e5) / 1e5)]));
const townLabelById = labelFor(townLabels, 'GEOID');
const countyLabelById = labelFor(countyLabels, 'COUNTYFP');

const townTable: Record<string, unknown> = {};
for (const t of towns) {
  const p = t.properties;
  const id = String(p.GEOID);
  const type = TYPES[String(p.LSAD)];
  const pop = population.get(id);
  const link = townLinks.get(String(Number(p.COUSUBNS)));
  if (!type) problems.push(`${p.NAME}: unknown municipality type code ${p.LSAD}`);
  if (pop === undefined) problems.push(`${p.NAME}: no 2020 population`);
  if (!link) problems.push(`${p.NAME}: no Wikidata item with an English Wikipedia article`);
  townTable[id] = {
    name: p.NAME,
    type,
    county: `34${p.COUNTYFP}`,
    population: pop,
    population_note: MERGERS.find(([, to]) => to === id)?.[2],
    wikidata: link?.wikidata,
    wikipedia: link?.wikipedia,
    label: townLabelById.get(id),
    bbox: bbox(t.geometry.coordinates),
  };
  t.properties = { id };
}

const countyTable: Record<string, unknown> = {};
for (const c of counties) {
  const fp = String(c.properties.COUNTYFP);
  const id = `34${fp}`;
  const members = Object.entries(townTable).filter(([, t]) => (t as { county: string }).county === id);
  const link = countyLinks.get(id);
  if (!link) problems.push(`${countyNames.get(fp)}: no Wikidata item with an English Wikipedia article`);
  countyTable[id] = {
    name: countyNames.get(fp),
    population: members.reduce((sum, [, t]) => sum + ((t as { population?: number }).population ?? 0), 0),
    municipalities: members.length,
    wikidata: link?.wikidata,
    wikipedia: link?.wikipedia,
    label: countyLabelById.get(fp),
    bbox: bbox(c.geometry.coordinates),
  };
  c.properties = { id };
}

// 4. Checks. The counts come from the data; the totals must reconcile.
const totalPopulation = Object.values(townTable).reduce((s: number, t) => s + ((t as { population?: number }).population ?? 0), 0);
if (totalPopulation !== NJ_POPULATION_2020) {
  problems.push(`municipal populations add up to ${totalPopulation}, not the 2020 state total of ${NJ_POPULATION_2020}`);
}
if (counties.length !== 21) problems.push(`expected 21 counties, got ${counties.length}`);
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const collection = (features: Feature[]) => JSON.stringify({ type: 'FeatureCollection', features });
writeFileSync(join(OUT, 'municipalities.geojson'), collection(towns));
writeFileSync(join(OUT, 'counties.geojson'), collection(counties));
writeFileSync(join(OUT, 'outside-nj.geojson'), mask['mask.json']);
writeFileSync(join(OUT, 'municipalities.json'), JSON.stringify(townTable));
writeFileSync(join(OUT, 'counties.json'), JSON.stringify(countyTable));
writeFileSync(
  join(OUT, 'meta.json'),
  JSON.stringify(
    {
      boundaries: `U.S. Census Bureau TIGER/Line ${BOUNDARY_YEAR}: county subdivisions, with water areas over ${MIN_WATER_AREA_M2 / 1e6} km² removed, simplified to about ${SIMPLIFY_METERS} m`,
      boundaries_url: BOUNDARY_URL,
      population: '2020 Census, P.L. 94-171 redistricting data, table P1',
      population_url: PL_URL,
      links: 'Wikidata, matched on Census GNIS codes',
      municipalities: towns.length,
      counties: counties.length,
      state_population_2020: NJ_POPULATION_2020,
      built: new Date().toISOString().slice(0, 10),
    },
    null,
    2,
  ),
);
console.log(`Wrote ${towns.length} municipalities and ${counties.length} counties to public/data/boundaries/`);
