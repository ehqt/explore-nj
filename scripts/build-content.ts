// Validates content, then writes the approved entries to public/data/entries.json
// for the app. Refuses to write anything if validation fails.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import mapshaper from 'mapshaper';
import { compileForApp, loadContent, ROOT } from './lib/content.ts';

const { entries, errors } = loadContent();
if (errors.length > 0) {
  console.error(`Content has ${errors.length} error(s). Run "npm run validate" for details.`);
  process.exit(1);
}

const data = compileForApp(entries);

// Features get a label point inside their shape (or on their line), where the map
// shows their name.
for (const entry of data) {
  if (!entry.geometry) continue;
  const out = await mapshaper.applyCommands('-i in.json -points inner -o format=geojson geojson-type=FeatureCollection out.json', {
    'in.json': JSON.stringify(entry.geometry),
  });
  const points = JSON.parse(out['out.json']) as { features?: { geometry: { coordinates: number[] } | null }[] };
  const coords = points.features?.find((f) => f.geometry)?.geometry?.coordinates;
  (entry as { label?: number[] }).label = coords?.map((n) => Math.round(n * 1e5) / 1e5);
}

const outDir = join(ROOT, 'public', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entries.json'), JSON.stringify(data));
console.log(`Wrote ${data.length} approved entries (of ${entries.length}) to public/data/entries.json`);
