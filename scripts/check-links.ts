// Checks that every link in the content still loads.
// Run by a scheduled workflow that opens a GitHub issue for broken links; it
// never blocks a deploy. Usage: npm run check-links -- [--report file.md]
//
// Some sites refuse automated requests (403) or rate-limit (429). Those are
// listed separately for a person to check in a browser, not counted as broken.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SOURCES } from '../src/config.ts';
import { loadContent, ROOT } from './lib/content.ts';

const USER_AGENT = 'ExploreNJ-LinkCheck/1.0 (+https://github.com/ehqt/explore-nj)';
const TIMEOUT_MS = 20_000;
const RETRIES = 2;
const DELAY_PER_HOST_MS = 1_000;
const CACHE_FILE = join(ROOT, '.cache', 'link-check.json');
const CACHE_OK_DAYS = 7;

type Outcome = 'ok' | 'broken' | 'blocked' | 'homepage-redirect';

interface Result {
  url: string;
  outcome: Outcome;
  detail: string;
  usedBy: string[];
}

type Cache = Record<string, { checked: string }>;

function readCache(): Cache {
  try {
    return existsSync(CACHE_FILE) ? (JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as Cache) : {};
  } catch {
    return {};
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  return fetch(url, {
    method,
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function checkUrl(url: string): Promise<{ outcome: Outcome; detail: string }> {
  let lastError = '';
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(2_000 * 2 ** (attempt - 1));
    try {
      // Many servers mishandle HEAD, so fall back to GET before judging.
      let res = await request(url, 'HEAD');
      if (res.status >= 400) res = await request(url, 'GET');
      await res.body?.cancel();

      if (res.status === 403 || res.status === 429) {
        return { outcome: 'blocked', detail: `HTTP ${res.status} (refuses automated checks; open it in a browser)` };
      }
      if (res.status >= 500) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      if (res.status >= 400) return { outcome: 'broken', detail: `HTTP ${res.status}` };

      // A deep link that lands on the site's front page usually means the page is gone.
      const original = new URL(url);
      const final = new URL(res.url);
      if (original.pathname.length > 1 && (final.pathname === '/' || final.pathname === '') && res.redirected) {
        return { outcome: 'homepage-redirect', detail: `redirects to ${res.url}` };
      }
      return { outcome: 'ok', detail: `HTTP ${res.status}` };
    } catch (e) {
      lastError = (e as Error).name === 'TimeoutError' ? 'timed out' : (e as Error).message;
    }
  }
  return { outcome: 'broken', detail: `${lastError} (after ${RETRIES + 1} tries)` };
}

// Collect every link and which files use it.
const { entries } = loadContent();
const usedBy = new Map<string, Set<string>>();
const add = (url: string | undefined, file: string) => {
  if (!url) return;
  if (!usedBy.has(url)) usedBy.set(url, new Set());
  usedBy.get(url)!.add(file);
};
for (const e of entries) {
  for (const s of e.meta.sources) {
    add(s.url, e.file);
    add(s.archive_url, e.file);
  }
  add(e.meta.official_url, e.file);
  add(e.meta.photo?.source_url, e.file);
  add(e.meta.photo?.license_url, e.file);
}

// Links the app itself shows on town and county cards.
for (const url of Object.values(SOURCES)) add(url, 'src/config.ts');

const cache = readCache();
const now = new Date();
const freshSince = new Date(now.getTime() - CACHE_OK_DAYS * 86_400_000).toISOString();

// One request at a time per host, with a pause between them.
const byHost = new Map<string, string[]>();
for (const url of usedBy.keys()) {
  const host = new URL(url).host;
  if (!byHost.has(host)) byHost.set(host, []);
  byHost.get(host)!.push(url);
}

const results: Result[] = [];
let skipped = 0;
await Promise.all(
  [...byHost.values()].map(async (urls) => {
    for (const url of urls) {
      if (cache[url] && cache[url].checked >= freshSince) {
        skipped++;
        continue;
      }
      const { outcome, detail } = await checkUrl(url);
      results.push({ url, outcome, detail, usedBy: [...usedBy.get(url)!].sort() });
      if (outcome === 'ok') cache[url] = { checked: now.toISOString() };
      else delete cache[url];
      await sleep(DELAY_PER_HOST_MS);
    }
  }),
);

mkdirSync(dirname(CACHE_FILE), { recursive: true });
writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

const broken = results.filter((r) => r.outcome === 'broken' || r.outcome === 'homepage-redirect');
const blocked = results.filter((r) => r.outcome === 'blocked');
const lines: string[] = [
  `Checked ${results.length} link(s); ${skipped} skipped because they passed within the last ${CACHE_OK_DAYS} days.`,
  '',
];
if (broken.length > 0) {
  lines.push(`### Broken (${broken.length})`, '');
  for (const r of broken) lines.push(`- ${r.url} — ${r.detail}. Used in: ${r.usedBy.join(', ')}`);
  lines.push('');
}
if (blocked.length > 0) {
  lines.push(`### Check by hand (${blocked.length})`, '', 'These sites refuse automated requests, so a person needs to open them.', '');
  for (const r of blocked) lines.push(`- ${r.url} — ${r.detail}. Used in: ${r.usedBy.join(', ')}`);
  lines.push('');
}
if (broken.length === 0 && blocked.length === 0) lines.push('All links loaded.');

const report = lines.join('\n');
console.log(report);
const reportArg = process.argv.indexOf('--report');
if (reportArg !== -1 && process.argv[reportArg + 1]) writeFileSync(process.argv[reportArg + 1], report);

process.exit(broken.length > 0 ? 1 : 0);
