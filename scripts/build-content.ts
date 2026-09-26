// Validates content, then writes the approved entries to public/data/entries.json
// for the app. Refuses to write anything if validation fails.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileForApp, loadContent, ROOT } from './lib/content.ts';

const { entries, errors } = loadContent();
if (errors.length > 0) {
  console.error(`Content has ${errors.length} error(s). Run "npm run validate" for details.`);
  process.exit(1);
}

const data = compileForApp(entries);
const outDir = join(ROOT, 'public', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entries.json'), JSON.stringify(data));
console.log(`Wrote ${data.length} approved entries (of ${entries.length}) to public/data/entries.json`);
