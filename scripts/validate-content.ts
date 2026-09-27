// Checks every content entry and prints a readable report.
// Exits with status 1 if anything is wrong. Run: npm run validate

import { loadBoundaries, loadContent, type Entry, type Pillar } from './lib/content.ts';

const { entries, errors, warnings } = loadContent();

function count<T extends string>(items: Entry[], key: (e: Entry) => T): string {
  const counts = new Map<T, number>();
  for (const e of items) counts.set(key(e), (counts.get(key(e)) ?? 0) + 1);
  return [...counts].map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
}

console.log(`Checked ${entries.length} entries.\n`);

console.log('Distribution (targets: ~60 places, ~10 features, ~10 topics; each pillar about a third)');
console.log(`  All entries by kind:     ${count(entries, (e) => e.meta.kind)}`);
console.log(`  All entries by pillar:   ${count(entries, (e) => e.meta.pillar as Pillar)}`);
console.log(`  By review stage:         ${count(entries, (e) => e.stage)}`);
const approved = entries.filter((e) => e.approved);
console.log(`  Approved (on the site):  ${approved.length}`);
const boundaries = loadBoundaries();
if (boundaries) {
  const placesByCounty = new Map<string, number>();
  for (const e of entries.filter((x) => x.meta.kind === 'place')) {
    for (const c of new Set(e.towns.map((t) => boundaries.towns[t]?.county))) {
      if (c) placesByCounty.set(c, (placesByCounty.get(c) ?? 0) + 1);
    }
  }
  const thin = Object.entries(boundaries.counties)
    .filter(([id]) => (placesByCounty.get(id) ?? 0) < 2)
    .map(([id, c]) => `${c.name.replace(' County', '')} ${placesByCounty.get(id) ?? 0}`);
  console.log(`  Counties with fewer than 2 places (target: none): ${thin.length}/21${thin.length ? ` (${thin.join(', ')})` : ''}`);
}
console.log();

const today = new Date().toISOString().slice(0, 10);
const due = approved.filter((e) => e.recheckDue <= today);
if (due.length > 0) {
  console.log(`Due for re-checking (${due.length}):`);
  for (const e of due) console.log(`  ${e.file} (due ${e.recheckDue})`);
  console.log();
}

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ${w.file}: ${w.message}`);
  console.log();
}

if (errors.length > 0) {
  console.log(`Errors (${errors.length}):`);
  for (const e of errors) console.log(`  ${e.file}: ${e.message}`);
  process.exit(1);
}
console.log('No errors.');
