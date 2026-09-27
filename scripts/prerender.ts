// Runs after `vite build`. Writes a real page for every card (entries, towns,
// counties, Jersey 101) with its own title, description, canonical link and
// link-preview tags, plus a sitemap (submit it in Google Search Console; a robots.txt
// wouldn't work for a site that lives under /explore-nj/). The app then opens the right card from the URL.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SITE_URL } from '../src/config.ts';
import { ROOT } from './lib/content.ts';

const DIST = join(ROOT, 'dist');
const DATA = join(ROOT, 'public', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

interface Page {
  path: string; // relative to the site root, e.g. "town/freehold-borough/"
  title: string;
  description: string;
  image?: string;
  body: string; // plain HTML for readers without JavaScript and for search engines
}

const esc = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const clip = (t: string, n = 200) => (t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t);
const plain = (md: string) => md.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n: number) => n.toLocaleString('en-US');

interface Entry {
  id: string;
  kind: string;
  name: string;
  summary: string;
  county_fips: string | null;
  photo: { file: string } | null;
  sections: { heading: string | null; paragraphs: { text: string }[] }[];
  sources: { title: string; url: string }[];
}
const entries: Entry[] = read('entries.json');
const towns: Record<string, { name: string; slug: string; type: string; county: string; population: number }> = read(
  'boundaries/municipalities.json',
);
const counties: Record<string, { name: string; slug: string; population: number; municipalities: number }> = read(
  'boundaries/counties.json',
);

const entryBody = (e: Entry) =>
  e.sections
    .map((s) => `${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${s.paragraphs.map((p) => `<p>${esc(plain(p.text))}</p>`).join('')}`)
    .join('') +
  `<h2>Sources</h2><ul>${e.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul>`;

const pages: Page[] = [
  {
    path: '',
    title: 'Explore NJ',
    description: "A map-centered guide to New Jersey's geography, history and culture for new residents.",
    body: `<h1>Explore NJ</h1><p>A map-centered guide to New Jersey's geography, history and culture for new residents. This site needs JavaScript to show the map.</p>`,
  },
  {
    path: 'jersey-101/',
    title: 'Jersey 101',
    description: 'Short explainers on the things newcomers to New Jersey hear about.',
    body: `<h1>Jersey 101</h1><ul>${entries
      .filter((e) => e.kind === 'topic')
      .map((e) => `<li><a href="${SITE_URL}topic/${e.id}/">${esc(e.name)}</a>: ${esc(e.summary)}</li>`)
      .join('')}</ul>`,
  },
];

for (const e of entries) {
  if (e.kind === 'county') continue; // shown on its county's page below
  pages.push({
    path: `${e.kind}/${e.id}/`,
    title: e.name,
    description: e.summary,
    image: e.photo ? `images/${e.photo.file}` : undefined,
    body: `<h1>${esc(e.name)}</h1>${entryBody(e)}`,
  });
}

for (const [id, c] of Object.entries(counties)) {
  const blurb = entries.find((e) => e.kind === 'county' && e.county_fips === id);
  const facts = `${fmt(c.population)} residents (2020 Census), ${c.municipalities} municipalities.`;
  pages.push({
    path: `county/${c.slug}/`,
    title: c.name,
    description: blurb ? blurb.summary : `${c.name}, New Jersey: ${facts}`,
    image: blurb?.photo ? `images/${blurb.photo.file}` : undefined,
    body: `<h1>${esc(c.name)}</h1><p>${esc(facts)}</p>${blurb ? entryBody(blurb) : ''}`,
  });
}

for (const t of Object.values(towns)) {
  const county = counties[t.county].name;
  const description = `${t.name} is a ${t.type} in ${county}, New Jersey, with ${fmt(t.population)} residents (2020 Census).`;
  pages.push({ path: `town/${t.slug}/`, title: `${t.name} (${capitalize(t.type)}, ${county})`, description, body: `<h1>${esc(t.name)}</h1><p>${esc(description)}</p>` });
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!template.includes('<!-- page-meta') || !template.includes('<!-- page-content')) {
  throw new Error('dist/index.html is missing the page-meta or page-content markers');
}

function render(page: Page): string {
  const url = `${SITE_URL}${page.path}`;
  const title = page.path ? `${page.title} · Explore NJ` : page.title;
  const image = `${SITE_URL}${page.image ?? 'og-default.png'}`;
  const description = clip(page.description);
  const meta = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Explore NJ" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
  return template
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<!-- page-meta[^>]*-->/, meta)
    .replace(/<!-- page-content[^>]*-->/, `<noscript><div class="prerendered">${page.body}</div></noscript>`);
}

for (const page of pages) {
  const file = join(DIST, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(page));
}

// Unknown addresses get the app, which shows the map; search engines are told to skip it.
writeFileSync(
  join(DIST, '404.html'),
  render({ path: '', title: 'Page not found', description: 'This page does not exist.', body: '<h1>Page not found</h1>' }).replace(
    '</head>',
    '  <meta name="robots" content="noindex" />\n  </head>',
  ),
);

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${esc(`${SITE_URL}${p.path}`)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`,
);
console.log(`Prerendered ${pages.length} pages, plus 404.html and sitemap.xml`);
