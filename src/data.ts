// Loads the app's data files. Paths go through BASE_URL because the site lives
// under /explore-nj/ on GitHub Pages.

import type { BBox, Position } from './lib/geo';

export interface Town {
  name: string;
  type: string;
  county: string;
  population: number;
  population_note?: string;
  wikidata: string;
  wikipedia: string;
  label: Position;
  bbox: BBox;
}

export interface County {
  name: string;
  population: number;
  municipalities: number;
  wikidata: string;
  wikipedia: string;
  label: Position;
  bbox: BBox;
}

export interface Paragraph {
  text: string;
  sources: string[];
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  archive_url: string | null;
  further_reading: boolean;
}

export interface Entry {
  id: string;
  kind: 'place' | 'feature' | 'topic' | 'county';
  name: string;
  summary: string;
  pillar: 'geography' | 'history' | 'culture';
  tags: string[];
  location: { lng: number; lat: number } | null;
  county_fips: string | null;
  municipalities: string[];
  related: string[];
  official_url: string | null;
  photo: {
    file: string;
    alt: string;
    author: string;
    license: string;
    license_url: string;
    source_url: string;
    modified: string;
  } | null;
  sections: { heading: string | null; paragraphs: Paragraph[] }[];
  sources: Source[];
  last_reviewed: string;
}

export interface BoundaryMeta {
  boundaries: string;
  boundaries_url: string;
  population: string;
  population_url: string;
}

export interface AppData {
  towns: Record<string, Town>;
  counties: Record<string, County>;
  entries: Entry[];
  meta: BoundaryMeta;
}

export const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(dataUrl(path));
  if (!res.ok) throw new Error(`Couldn't load ${path} (HTTP ${res.status})`);
  return (await res.json()) as T;
}

export async function loadData(): Promise<AppData> {
  const [towns, counties, entries, meta] = await Promise.all([
    getJson<Record<string, Town>>('boundaries/municipalities.json'),
    getJson<Record<string, County>>('boundaries/counties.json'),
    getJson<Entry[]>('entries.json'),
    getJson<BoundaryMeta>('boundaries/meta.json'),
  ]);
  return { towns, counties, entries, meta };
}
