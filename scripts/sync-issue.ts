// Keeps one GitHub issue per maintenance topic in sync with a report.
// Usage: node scripts/sync-issue.ts "<title>" <report.md> <true|false>
//   true  -> open the issue, or update its body if it's already open
//   false -> close the issue if it's open
// Uses the gh CLI, which GitHub Actions provides (GH_TOKEN must be set).

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [title, reportFile, active] = process.argv.slice(2);
if (!title || !reportFile || !['true', 'false'].includes(active)) {
  console.error('Usage: node scripts/sync-issue.ts "<title>" <report.md> <true|false>');
  process.exit(2);
}

const gh = (...args: string[]) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
const body = `${readFileSync(reportFile, 'utf8')}\n\n_Updated automatically by the Content maintenance workflow._`;

const open = JSON.parse(gh('issue', 'list', '--state', 'open', '--search', `in:title "${title}"`, '--json', 'number,title')) as {
  number: number;
  title: string;
}[];
const existing = open.find((i) => i.title === title);

if (active === 'true') {
  if (existing) {
    gh('issue', 'edit', String(existing.number), '--body', body);
    console.log(`Updated issue #${existing.number}`);
  } else {
    console.log(gh('issue', 'create', '--title', title, '--body', body));
  }
} else if (existing) {
  gh('issue', 'close', String(existing.number), '--comment', 'All clear on the latest check.');
  console.log(`Closed issue #${existing.number}`);
} else {
  console.log('Nothing to report.');
}
