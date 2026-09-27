// Loads every content entry, validates it, and compiles it into app data.
// Used by scripts/validate-content.ts (CI) and scripts/build-content.ts (build).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_DIR = join(ROOT, 'content');
const IMAGES_DIR = join(ROOT, 'public', 'images');

export type Kind = 'place' | 'feature' | 'topic' | 'county';
export type Pillar = 'geography' | 'history' | 'culture';
export type Stage = 'drafted' | 'source-checked' | 'second-pass' | 'approved';

const KIND_DIRS: Record<string, Kind> = {
  places: 'place',
  features: 'feature',
  topics: 'topic',
  counties: 'county',
};

const STAGE_ORDER: Stage[] = ['drafted', 'source-checked', 'second-pass', 'approved'];

// New Jersey's extent with a small margin. Anything outside is almost always
// a typo or GeoJSON's [lng, lat] order swapped.
const NJ_BBOX = { west: -75.6, south: 38.9, east: -73.85, north: 41.4 };

// Section headings allowed in the prose, and which kinds may use them.
const SECTIONS: Record<string, { kinds: Kind[]; requiredFor?: Kind[] }> = {
  'Why it matters': { kinds: ['place', 'feature', 'topic', 'county'], requiredFor: ['place'] },
  'Worth a visit?': { kinds: ['place', 'feature'] },
};

const RECHECK_MONTHS = { volatile: 6, stable: 24 };

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessed: string;
  archive_url?: string;
  further_reading?: boolean;
}

export interface Photo {
  file: string;
  alt: string;
  author: string;
  license: string;
  license_url: string;
  source_url: string;
  modified: string;
}

export interface ReviewStage {
  stage: Stage;
  date: string;
  by: string;
  note?: string;
}

export interface Frontmatter {
  id: string;
  kind: Kind;
  name: string;
  summary: string;
  pillar: Pillar;
  tags?: Pillar[];
  location?: { lng: number; lat: number };
  geometry?: string;
  geometry_source?: string;
  county_fips?: string;
  related?: string[];
  open_to_public?: boolean;
  official_url?: string;
  volatile?: boolean;
  hard_history?: boolean;
  photo?: Photo;
  sources: Source[];
  review: ReviewStage[];
}

export interface Paragraph {
  /** Markdown text with the [@source] markers removed. */
  text: string;
  /** Ids of the sources that support this paragraph. */
  sources: string[];
}

export interface Section {
  heading: string | null;
  paragraphs: Paragraph[];
}

export interface Entry {
  file: string;
  meta: Frontmatter;
  sections: Section[];
  stage: Stage;
  approved: boolean;
  recheckDue: string;
}

export interface Problem {
  file: string;
  message: string;
}

export interface LoadResult {
  entries: Entry[];
  errors: Problem[];
  warnings: Problem[];
}

const CITATION = /\[@([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

function createValidator() {
  const schema = JSON.parse(readFileSync(join(CONTENT_DIR, 'schema', 'entry.schema.json'), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  // ajv-formats is CommonJS; depending on the loader its function sits on .default.
  const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default ??
    addFormatsModule) as (a: Ajv2020) => void;
  addFormats(ajv);
  return ajv.compile(schema);
}

function splitFrontmatter(raw: string): { yaml: string; body: string } | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  return match ? { yaml: match[1], body: match[2] } : null;
}

function parseBody(body: string): Section[] {
  const sections: Section[] = [{ heading: null, paragraphs: [] }];
  for (const block of body.split(/\r?\n\s*\r?\n/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const heading = /^##\s+(.+)$/.exec(trimmed);
    if (heading && !trimmed.includes('\n')) {
      sections.push({ heading: heading[1].trim(), paragraphs: [] });
      continue;
    }
    const sources = [...trimmed.matchAll(CITATION)].map((m) => m[1]);
    const text = trimmed.replace(CITATION, '').replace(/[ \t]+$/gm, '').replace(/\s+([.,;:])/g, '$1').trim();
    sections[sections.length - 1].paragraphs.push({ text, sources: [...new Set(sources)] });
  }
  return sections.filter((s) => s.heading !== null || s.paragraphs.length > 0);
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function inBbox(lng: number, lat: number): boolean {
  return lng >= NJ_BBOX.west && lng <= NJ_BBOX.east && lat >= NJ_BBOX.south && lat <= NJ_BBOX.north;
}

function* allPositions(coords: unknown): Generator<[number, number]> {
  if (Array.isArray(coords) && typeof coords[0] === 'number') {
    yield [coords[0] as number, coords[1] as number];
  } else if (Array.isArray(coords)) {
    for (const c of coords) yield* allPositions(c);
  }
}

const GEOMETRY_TYPES = new Set(['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']);

export function loadGeometry(file: string): { geometry: unknown; problems: string[] } {
  const path = join(CONTENT_DIR, 'geometry', file);
  if (!existsSync(path)) return { geometry: null, problems: [`geometry file content/geometry/${file} does not exist`] };
  const problems: string[] = [];
  let json: { type?: string; features?: { geometry?: { type?: string; coordinates?: unknown } }[]; geometry?: unknown };
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { geometry: null, problems: [`geometry file ${file} is not valid JSON: ${(e as Error).message}`] };
  }
  const geometries =
    json.type === 'FeatureCollection'
      ? (json.features ?? []).map((f) => f.geometry)
      : json.type === 'Feature'
        ? [json.geometry as { type?: string; coordinates?: unknown }]
        : [json as { type?: string; coordinates?: unknown }];
  if (geometries.length === 0) problems.push(`geometry file ${file} has no features`);
  let outside = 0;
  for (const g of geometries) {
    if (!g || !GEOMETRY_TYPES.has(g.type ?? '')) {
      problems.push(`geometry file ${file} contains a ${g?.type ?? 'missing'} geometry; expected polygons or lines`);
      continue;
    }
    for (const [lng, lat] of allPositions(g.coordinates)) if (!inBbox(lng, lat)) outside++;
  }
  if (outside > 0) {
    problems.push(`geometry file ${file} has ${outside} coordinate(s) outside New Jersey (swapped lng/lat, or wrong projection?)`);
  }
  return { geometry: json, problems };
}

export function loadContent(): LoadResult {
  const validate = createValidator();
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const entries: Entry[] = [];

  for (const [dir, kind] of Object.entries(KIND_DIRS)) {
    const dirPath = join(CONTENT_DIR, dir);
    if (!existsSync(dirPath)) continue;
    for (const name of readdirSync(dirPath).filter((n) => n.endsWith('.md')).sort()) {
      const path = join(dirPath, name);
      const file = relative(ROOT, path);
      const err = (message: string) => errors.push({ file, message });
      const warn = (message: string) => warnings.push({ file, message });

      const parts = splitFrontmatter(readFileSync(path, 'utf8'));
      if (!parts) {
        err('missing frontmatter: the file must start with a --- block');
        continue;
      }
      let meta: Frontmatter;
      try {
        // The YAML "core" schema keeps dates like 2026-09-26 as plain strings.
        meta = parseYaml(parts.yaml, { schema: 'core' }) as Frontmatter;
      } catch (e) {
        err(`frontmatter is not valid YAML: ${(e as Error).message}`);
        continue;
      }
      if (!validate(meta)) {
        for (const e of validate.errors ?? []) {
          const where = e.instancePath ? e.instancePath.slice(1).replaceAll('/', '.') : '(top level)';
          // The kind-specific rules report twice: once for the field, once for the "if/then". Keep one clear message.
          if (e.keyword === 'if') continue;
          if (e.keyword === 'false schema') {
            err(`"${where}" isn't allowed on a ${(meta as { kind?: string }).kind ?? 'entry of this kind'}`);
            continue;
          }
          const extra = e.keyword === 'additionalProperties' ? ` "${(e.params as { additionalProperty: string }).additionalProperty}"` : '';
          const allowed = e.keyword === 'enum' ? ` (${(e.params as { allowedValues: unknown[] }).allowedValues.join(', ')})` : '';
          err(`${where}: ${e.message}${extra}${allowed}`);
        }
        continue;
      }

      if (meta.id !== basename(name, '.md')) err(`id "${meta.id}" must match the file name "${basename(name, '.md')}"`);
      if (meta.kind !== kind) err(`kind is "${meta.kind}" but the file is in content/${dir}/ (expected "${kind}")`);
      if (meta.tags?.includes(meta.pillar)) err(`tags repeat the primary pillar "${meta.pillar}"`);

      if (meta.location && !inBbox(meta.location.lng, meta.location.lat)) {
        err(`location (${meta.location.lng}, ${meta.location.lat}) is outside New Jersey. Check that lng and lat aren't swapped.`);
      }
      if (meta.geometry) for (const p of loadGeometry(meta.geometry).problems) err(p);
      if (meta.photo && !existsSync(join(IMAGES_DIR, meta.photo.file))) {
        err(`photo file public/images/${meta.photo.file} does not exist`);
      }

      // Review history must move forward through the stages, and approval is a person's job.
      const stages = meta.review.map((r) => r.stage);
      for (let i = 1; i < stages.length; i++) {
        if (STAGE_ORDER.indexOf(stages[i]) < STAGE_ORDER.indexOf(stages[i - 1])) {
          err(`review stages go backwards: "${stages[i - 1]}" then "${stages[i]}"`);
        }
      }
      if (stages[0] !== 'drafted') err('the first review stage must be "drafted"');
      for (const r of meta.review) {
        if (r.stage === 'approved' && /claude/i.test(r.by)) err('only a person can approve an entry');
        if (r.stage === 'second-pass' && /drafting/i.test(r.by)) {
          err('the second pass must be done by a separate verifier, not the drafting session');
        }
      }
      const stage = stages[stages.length - 1];
      if (stage === 'approved' && !stages.includes('second-pass')) err('approved without a second-pass stage');

      // Sources and citations.
      const sourceIds = new Set<string>();
      for (const s of meta.sources) {
        if (sourceIds.has(s.id)) err(`source id "${s.id}" is used twice`);
        sourceIds.add(s.id);
      }
      if (meta.geometry_source && !sourceIds.has(meta.geometry_source)) {
        err(`geometry_source "${meta.geometry_source}" is not in sources`);
      }

      const sections = parseBody(parts.body);
      const cited = new Set<string>();
      if (meta.geometry_source) cited.add(meta.geometry_source);
      let intro = 0;
      for (const section of sections) {
        if (section.heading !== null) {
          const rule = SECTIONS[section.heading];
          if (!rule) {
            err(`unknown section "## ${section.heading}". Allowed: ${Object.keys(SECTIONS).map((h) => `"## ${h}"`).join(', ')}`);
          } else if (!rule.kinds.includes(meta.kind)) {
            err(`"## ${section.heading}" isn't allowed on a ${meta.kind}`);
          }
          if (section.paragraphs.length === 0) err(`"## ${section.heading}" is empty`);
        } else {
          intro = section.paragraphs.length;
        }
        for (const p of section.paragraphs) {
          const preview = `"${p.text.slice(0, 50)}${p.text.length > 50 ? '…' : ''}"`;
          if (p.sources.length === 0) err(`paragraph ${preview} has no [@source] citation`);
          for (const id of p.sources) {
            cited.add(id);
            if (!sourceIds.has(id)) err(`paragraph ${preview} cites [@${id}], which is not in sources`);
          }
          if (/<\/?[a-z][^>]*>/i.test(p.text)) err(`paragraph ${preview} contains HTML; use plain Markdown`);
          if (/\]\(/.test(p.text)) err(`paragraph ${preview} contains a link; put links in sources instead`);
          if (/^#/.test(p.text)) err(`paragraph ${preview} looks like a heading; only "## " headings are allowed`);
        }
      }
      for (const [heading, rule] of Object.entries(SECTIONS)) {
        if (rule.requiredFor?.includes(meta.kind) && !sections.some((s) => s.heading === heading)) {
          err(`a ${meta.kind} needs a "## ${heading}" section`);
        }
      }
      if (intro === 0) err('the text needs at least one paragraph before any section heading');
      if (meta.kind === 'place' && (intro < 2 || intro > 3)) warn(`a place should have 2–3 intro paragraphs (has ${intro})`);

      for (const s of meta.sources) {
        if (s.further_reading && cited.has(s.id)) err(`source "${s.id}" is marked further_reading but is cited for a claim`);
        if (!s.further_reading && !cited.has(s.id)) err(`source "${s.id}" is never cited; cite it or mark it further_reading`);
      }

      const visit = sections.some((s) => s.heading === 'Worth a visit?');
      if (visit && meta.open_to_public !== true) err('"## Worth a visit?" requires open_to_public: true');
      if (visit && !meta.official_url) err('"## Worth a visit?" requires official_url for current hours and access');
      if (meta.hard_history && stage === 'approved' && !meta.review.some((r) => r.note)) {
        warn('hard-history entry approved with no review note on outside review or community sources');
      }

      const lastDate = meta.review[meta.review.length - 1].date;
      const recheckDue = addMonths(lastDate, meta.volatile ? RECHECK_MONTHS.volatile : RECHECK_MONTHS.stable);
      entries.push({ file, meta, sections, stage, approved: stage === 'approved', recheckDue });
    }
  }

  // Checks across entries.
  const byId = new Map<string, Entry>();
  for (const e of entries) {
    if (byId.has(e.meta.id)) errors.push({ file: e.file, message: `id "${e.meta.id}" is also used by ${byId.get(e.meta.id)!.file}` });
    byId.set(e.meta.id, e);
  }
  const fips = new Map<string, string>();
  for (const e of entries) {
    if (e.meta.county_fips) {
      if (fips.has(e.meta.county_fips)) {
        errors.push({ file: e.file, message: `county_fips ${e.meta.county_fips} is also used by ${fips.get(e.meta.county_fips)}` });
      }
      fips.set(e.meta.county_fips, e.file);
    }
    for (const id of e.meta.related ?? []) {
      const target = byId.get(id);
      if (!target) errors.push({ file: e.file, message: `related entry "${id}" does not exist` });
      else if (id === e.meta.id) errors.push({ file: e.file, message: 'related lists the entry itself' });
      else if (e.approved && !target.approved) {
        errors.push({ file: e.file, message: `approved entry links to "${id}", which isn't approved yet` });
      }
    }
  }

  return { entries, errors, warnings };
}

/** The data the app loads: approved entries only, with geometry inlined. */
export function compileForApp(entries: Entry[]) {
  return entries
    .filter((e) => e.approved)
    .map((e) => {
      const m = e.meta;
      return {
        id: m.id,
        kind: m.kind,
        name: m.name,
        summary: m.summary,
        pillar: m.pillar,
        tags: m.tags ?? [],
        location: m.location ?? null,
        geometry: m.geometry ? loadGeometry(m.geometry).geometry : null,
        county_fips: m.county_fips ?? null,
        related: m.related ?? [],
        official_url: m.official_url ?? null,
        photo: m.photo ?? null,
        sections: e.sections,
        sources: m.sources.map(({ id, title, publisher, url, archive_url, further_reading }) => ({
          id,
          title,
          publisher,
          url,
          archive_url: archive_url ?? null,
          further_reading: further_reading ?? false,
        })),
        last_reviewed: m.review[m.review.length - 1].date,
      };
    });
}
