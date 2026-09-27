// Every card has its own URL, e.g. /explore-nj/town/freehold-borough/.
// The same paths are prerendered at build time (scripts/prerender.ts), so shared
// links show a preview and search engines can index them.

import type { AppData } from './data';

export type Selection =
  | { kind: 'town'; id: string }
  | { kind: 'county'; id: string }
  | { kind: 'entry'; id: string }
  | { kind: 'jersey-101' };

const BASE = import.meta.env.BASE_URL;

export function pathFor(data: AppData, sel: Selection | null): string {
  if (!sel) return BASE;
  switch (sel.kind) {
    case 'town':
      return `${BASE}town/${data.towns[sel.id].slug}/`;
    case 'county':
      return `${BASE}county/${data.counties[sel.id].slug}/`;
    case 'jersey-101':
      return `${BASE}jersey-101/`;
    case 'entry': {
      const entry = data.entries.find((e) => e.id === sel.id)!;
      // A county write-up lives on its county's page.
      if (entry.kind === 'county' && entry.county_fips) return pathFor(data, { kind: 'county', id: entry.county_fips });
      return `${BASE}${entry.kind}/${entry.id}/`;
    }
  }
}

export function selectionFromPath(data: AppData, pathname: string): Selection | null {
  if (!pathname.startsWith(BASE)) return null;
  const [section, slug] = pathname.slice(BASE.length).split('/').filter(Boolean);
  if (section === 'jersey-101') return { kind: 'jersey-101' };
  if (!slug) return null;
  if (section === 'town') {
    const id = Object.keys(data.towns).find((k) => data.towns[k].slug === slug);
    return id ? { kind: 'town', id } : null;
  }
  if (section === 'county') {
    const id = Object.keys(data.counties).find((k) => data.counties[k].slug === slug);
    return id ? { kind: 'county', id } : null;
  }
  const entry = data.entries.find((e) => e.kind === section && e.id === slug);
  return entry ? { kind: 'entry', id: entry.id } : null;
}

export const sameSelection = (a: Selection | null, b: Selection | null) =>
  JSON.stringify(a) === JSON.stringify(b);
