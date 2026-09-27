// Builds the HTML for panel cards. Every value from data is escaped first.

import type { AppData, Entry, Source } from './data';
import { distanceKm, inPolygon, type PolygonGeometry, type Position } from './lib/geo';
import { PILLARS, pillarSvg } from './pillars';
import { CORRECTIONS_FORM_URL, SOURCES } from './config';
import { strings } from './strings';

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Escapes, then allows only **bold** and *italic* from the Markdown source. */
function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

const external = (url: string, label: string) =>
  `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;

const formatNumber = (n: number) => n.toLocaleString('en-US');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kmToMiles = (km: number) => km * 0.621371;

function correctionLink(subject: string, url: string): string {
  if (!CORRECTIONS_FORM_URL) return '';
  const form = CORRECTIONS_FORM_URL.replace('{subject}', encodeURIComponent(subject)).replace('{url}', encodeURIComponent(url));
  return `<p class="card-correction">${external(form, strings.reportCorrection)}</p>`;
}

function sourcesList(items: string[]): string {
  return `<section class="card-sources"><h3>${strings.sources}</h3><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></section>`;
}

function entrySource(s: Source): string {
  const archive = s.archive_url ? ` (${external(s.archive_url, strings.archivedCopy)})` : '';
  return `${external(s.url, s.title)}, ${escapeHtml(s.publisher)}${archive}`;
}

const censusSources = () => [
  `${external(SOURCES.censusBoundaries, strings.censusBoundaries)}, U.S. Census Bureau`,
  `${external(SOURCES.censusPopulation, strings.censusPopulation)}, U.S. Census Bureau`,
];

function placeList(places: Entry[], note?: (e: Entry) => string): string {
  return `<ul class="card-places">${places
    .map(
      (p) =>
        `<li><button type="button" class="link-button" data-entry="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>${note ? ` <span class="card-muted">${escapeHtml(note(p))}</span>` : ''}<br><span class="card-summary">${escapeHtml(p.summary)}</span></li>`,
    )
    .join('')}</ul>`;
}

function mapped(data: AppData): Entry[] {
  return data.entries.filter((e) => e.kind === 'place' && e.location);
}

export function townCard(data: AppData, id: string): { title: string; html: string } {
  const town = data.towns[id];
  const county = data.counties[town.county];
  const here = mapped(data).filter((e) => e.municipalities.includes(id));

  let places: string;
  if (here.length > 0) {
    places = `<h3>${strings.placesHere}</h3>${placeList(here)}`;
  } else {
    const nearest = mapped(data)
      .map((e) => ({ e, km: distanceKm(town.label, [e.location!.lng, e.location!.lat] as Position) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
    places = `<h3>${strings.placesHere}</h3><p>${escapeHtml(strings.noPlacesYet(town.name))}</p>`;
    if (nearest.length > 0) {
      const miles = new Map(nearest.map(({ e, km }) => [e.id, Math.max(1, Math.round(kmToMiles(km)))]));
      places += `<h3>${strings.nearestPlaces}</h3>${placeList(
        nearest.map((n) => n.e),
        (e) => strings.milesAway(miles.get(e.id)!),
      )}`;
    }
  }

  const html = `
    <p class="card-kicker">${escapeHtml(capitalize(town.type))} in <button type="button" class="link-button" data-county="${escapeHtml(town.county)}">${escapeHtml(county.name)}</button></p>
    <h2 class="card-title" tabindex="-1">${escapeHtml(town.name)}</h2>
    <p class="card-fact"><strong>${formatNumber(town.population)}</strong> ${strings.residents2020}${town.population_note ? `<br><span class="card-muted">${escapeHtml(town.population_note)}</span>` : ''}</p>
    ${places}
    <p>${external(town.wikipedia, strings.readMoreWikipedia(town.name))}</p>
    ${sourcesList([...censusSources(), `${external(town.wikipedia, strings.wikipediaArticle(town.name))}, Wikipedia`])}
    ${correctionLink(`${town.name} (${county.name})`, location.href)}
  `;
  return { title: town.name, html };
}

function entrySections(entry: Entry): string {
  return entry.sections
    .map(
      (s) =>
        `${s.heading ? `<h3>${escapeHtml(s.heading)}</h3>` : ''}${s.paragraphs.map((p) => `<p>${inlineMarkdown(p.text)}</p>`).join('')}`,
    )
    .join('');
}

export function countyCard(data: AppData, id: string): { title: string; html: string } {
  const county = data.counties[id];
  const blurb = data.entries.find((e) => e.kind === 'county' && e.county_fips === id);
  const places = mapped(data).filter((e) => e.municipalities.some((m) => data.towns[m]?.county === id));

  const html = `
    <p class="card-kicker">${strings.county}</p>
    <h2 class="card-title" tabindex="-1">${escapeHtml(county.name)}</h2>
    <p class="card-fact"><strong>${formatNumber(county.population)}</strong> ${strings.residents2020} · ${county.municipalities} ${strings.municipalities}</p>
    ${blurb ? entrySections(blurb) : ''}
    ${places.length > 0 ? `<h3>${strings.placesInCounty}</h3>${placeList(places)}` : ''}
    <p><button type="button" class="button" data-zoom-county="${escapeHtml(id)}">${strings.exploreTowns}</button></p>
    <p>${external(county.wikipedia, strings.readMoreWikipedia(county.name))}</p>
    ${sourcesList([
      ...(blurb ? blurb.sources.filter((s) => !s.further_reading).map(entrySource) : []),
      ...censusSources(),
      `${external(county.wikipedia, strings.wikipediaArticle(county.name))}, Wikipedia`,
    ])}
    ${correctionLink(county.name, location.href)}
  `;
  return { title: county.name, html };
}

function photoOrFallback(entry: Entry): string {
  if (entry.photo) {
    const p = entry.photo;
    return `<figure class="card-photo"><img src="${escapeHtml(`${import.meta.env.BASE_URL}images/${p.file}`)}" alt="${escapeHtml(p.alt)}" loading="lazy"><figcaption>${external(p.source_url, strings.photoCredit(p.author, p.license))}${p.modified ? ` (${escapeHtml(p.modified.toLowerCase())})` : ''}</figcaption></figure>`;
  }
  // No photo: a band in the pillar's color with its symbol, so cards still look finished.
  return `<div class="card-photo-fallback" style="--pillar:${PILLARS[entry.pillar].color}">${pillarSvg(entry.pillar, 28)}<span>${escapeHtml(PILLARS[entry.pillar].label)}</span></div>`;
}

/** Places whose pin falls inside a feature's outline. */
function placesInside(data: AppData, feature: Entry): Entry[] {
  const shapes = feature.geometry?.features.map((f) => f.geometry as PolygonGeometry) ?? [];
  return mapped(data).filter((e) => shapes.some((g) => inPolygon([e.location!.lng, e.location!.lat], g)));
}

export function entryCard(data: AppData, id: string): { title: string; html: string } | null {
  const entry = data.entries.find((e) => e.id === id);
  if (!entry) return null;
  const towns = entry.municipalities.map((m) => data.towns[m]).filter(Boolean);
  const kicker =
    entry.kind === 'topic'
      ? strings.jersey101
      : `${escapeHtml(PILLARS[entry.pillar].label)}${towns.length ? ` in ${towns.map((t) => escapeHtml(t.name)).join(', ')}` : ''}`;

  const related = entry.related.map((r) => data.entries.find((e) => e.id === r)).filter((e): e is Entry => Boolean(e));
  const inside = entry.kind === 'feature' ? placesInside(data, entry).filter((p) => !related.includes(p)) : [];
  const linked = [...related, ...inside];
  const linkedHeading = entry.kind === 'topic' ? strings.seeItHere : entry.kind === 'feature' ? strings.placesInFeature : strings.relatedEntries;

  const html = `
    <p class="card-kicker">${kicker}</p>
    <h2 class="card-title" tabindex="-1">${escapeHtml(entry.name)}</h2>
    ${entry.kind === 'topic' ? '' : photoOrFallback(entry)}
    ${entrySections(entry)}
    ${linked.length ? `<h3>${linkedHeading}</h3>${placeList(linked)}` : ''}
    ${entry.official_url ? `<p>${external(entry.official_url, strings.visitOfficialSite)}</p>` : ''}
    ${sourcesList(entry.sources.map(entrySource))}
    ${correctionLink(entry.name, location.href)}
  `;
  return { title: entry.name, html };
}

export function jersey101Card(data: AppData): { title: string; html: string } {
  const topics = data.entries.filter((e) => e.kind === 'topic').sort((a, b) => a.name.localeCompare(b.name));
  const html = `
    <p class="card-kicker">${strings.kindTopic}</p>
    <h2 class="card-title" tabindex="-1">${strings.jersey101}</h2>
    <p>${strings.jersey101Intro}</p>
    ${placeList(topics)}
  `;
  return { title: strings.jersey101, html };
}
