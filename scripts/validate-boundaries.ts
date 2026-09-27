// Checks that the committed boundary files agree with each other.
// Counts come from the data itself (never hardcoded), and totals must reconcile.
// Run: npm run validate:boundaries (also runs in CI).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inBBox, inPolygon, type BBox, type PolygonFeature, type Position } from '../src/lib/geo.ts';
import { ROOT } from './lib/content.ts';

const DIR = join(ROOT, 'public', 'data', 'boundaries');
const read = (f: string) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

interface Town {
  name: string;
  type: string;
  county: string;
  population: number;
  wikipedia: string;
  label: Position;
  bbox: BBox;
}
interface County {
  name: string;
  population: number;
  municipalities: number;
  wikipedia: string;
  label: Position;
  bbox: BBox;
}

const meta = read('meta.json');
const towns: Record<string, Town> = read('municipalities.json');
const counties: Record<string, County> = read('counties.json');
const townShapes: PolygonFeature[] = read('municipalities.geojson').features;
const countyShapes: PolygonFeature[] = read('counties.geojson').features;
const errors: string[] = [];

const shapeIds = new Set(townShapes.map((f) => f.properties.id));
const tableIds = new Set(Object.keys(towns));
for (const id of shapeIds) if (!tableIds.has(id)) errors.push(`municipality ${id} has a shape but no record`);
for (const id of tableIds) if (!shapeIds.has(id)) errors.push(`municipality ${id} has a record but no shape`);
if (townShapes.length !== meta.municipalities) errors.push(`meta.json says ${meta.municipalities} municipalities, data has ${townShapes.length}`);
if (countyShapes.length !== meta.counties) errors.push(`meta.json says ${meta.counties} counties, data has ${countyShapes.length}`);

const byId = new Map(townShapes.map((f) => [f.properties.id, f]));
let total = 0;
for (const [id, t] of Object.entries(towns)) {
  total += t.population;
  if (!t.name || !t.type || !Number.isInteger(t.population) || t.population <= 0) errors.push(`${id}: missing name, type or population`);
  if (!counties[t.county]) errors.push(`${t.name}: county ${t.county} not found`);
  if (!/^https:\/\/en\.wikipedia\.org\/wiki\//.test(t.wikipedia)) errors.push(`${t.name}: missing Wikipedia link`);
  if (!inBBox(t.label, t.bbox)) errors.push(`${t.name}: label point is outside its bounding box`);
  const shape = byId.get(id);
  if (shape && !inPolygon(t.label, shape.geometry)) errors.push(`${t.name}: label point is not inside the town (check towns-inside-towns)`);
}
if (total !== meta.state_population_2020) errors.push(`municipal populations add up to ${total}, not ${meta.state_population_2020}`);

let countyTotal = 0;
for (const [id, c] of Object.entries(counties)) {
  countyTotal += c.population;
  const members = Object.values(towns).filter((t) => t.county === id);
  if (members.length !== c.municipalities) errors.push(`${c.name}: says ${c.municipalities} municipalities, data has ${members.length}`);
  if (!/^https:\/\/en\.wikipedia\.org\/wiki\//.test(c.wikipedia)) errors.push(`${c.name}: missing Wikipedia link`);
}
if (countyTotal !== total) errors.push(`county populations add up to ${countyTotal}, municipalities to ${total}`);

const mask = read('outside-nj.geojson');
if (mask.type !== 'FeatureCollection' || mask.features?.length !== 1 || !['Polygon', 'MultiPolygon'].includes(mask.features[0].geometry?.type)) {
  errors.push('outside-nj.geojson must be a FeatureCollection with one (multi)polygon: the area outside New Jersey');
}

if (errors.length > 0) {
  console.error(`Boundary data has ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`Boundary data OK: ${tableIds.size} municipalities in ${countyShapes.length} counties, population ${total.toLocaleString('en-US')} (2020 Census).`);
