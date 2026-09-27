import * as maplibregl from 'maplibre-gl';
// MapLibre finds its worker through a runtime URL the bundler can't see, so
// bundle the worker explicitly and tell MapLibre where it ended up.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import type { FeatureCollection } from 'geojson';
import { countyCard, entryCard, jersey101Card, townCard } from './cards';
import { loadData, type AppData } from './data';
import type { BBox } from './lib/geo';
import { BASEMAP_STYLE_URL, FALLBACK_STYLE, MAX_BOUNDS, NJ_BOUNDS } from './map-config';
import { addEntryLayers, ENTRY_LAYERS } from './map/entry-layers';
import { addBoundaryLayers, LAYERS, showSelection, TOWN_ZOOM } from './map/layers';
import { PILLARS, pillarSvg } from './pillars';
import { pathFor, sameSelection, selectionFromPath, type Selection } from './router';
import { createSearch } from './search';
import { createPanel, type Panel } from './panel';
import { strings } from './strings';

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showNotice(text: string): void {
  const el = document.getElementById('notice');
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motion = () => ({ duration: reducedMotion.matches ? 0 : 900 });

function initMap(container: HTMLElement): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    style: BASEMAP_STYLE_URL,
    bounds: NJ_BOUNDS,
    fitBoundsOptions: { padding: 24 },
    maxBounds: MAX_BOUNDS,
    minZoom: 6.5,
    maxZoom: 16,
    // Top left, so the phone bottom sheet never covers the required map credits.
    attributionControl: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: false }), 'top-left');
  // Zoom buttons sit top left too; the side panel covers the right edge.
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
  map.getCanvas().setAttribute('aria-label', strings.mapLabel);

  // If the basemap style itself can't load, fall back to a plain background.
  let styleLoaded = false;
  map.once('style.load', () => {
    styleLoaded = true;
  });
  map.on('error', (event) => {
    if (styleLoaded) return;
    console.error('Basemap failed to load', event.error);
    styleLoaded = true;
    map.setStyle(FALLBACK_STYLE);
    showNotice(strings.basemapFailed);
  });
  return map;
}

function enableHover(map: maplibregl.Map, layer: string, source: string): void {
  let hovered: string | number | undefined;
  const clear = () => {
    if (hovered !== undefined) map.setFeatureState({ source, id: hovered }, { hover: false });
    hovered = undefined;
    map.getCanvas().style.cursor = '';
  };
  map.on('mousemove', layer, (e) => {
    const id = e.features?.[0]?.id;
    if (id === hovered) return;
    clear();
    if (id !== undefined) {
      hovered = id;
      map.setFeatureState({ source, id }, { hover: true });
      map.getCanvas().style.cursor = 'pointer';
    }
  });
  map.on('mouseleave', layer, clear);
}

function wireInteractions(map: maplibregl.Map, data: AppData, panel: Panel): void {
  const fit = (bbox: BBox, options: maplibregl.FitBoundsOptions = {}) =>
    map.fitBounds(bbox, { padding: panel.mapPadding(), ...motion(), ...options });
  let current: Selection | null = null;

  /** Opens a card and moves the map to it. `history` says whether to add a browser history step. */
  const show = (sel: Selection | null, history: 'push' | 'replace' | 'none' = 'push', animate = true) => {
    const move = animate ? motion() : { duration: 0 };
    if (!sel) {
      panel.close();
    } else if (sel.kind === 'town') {
      const card = townCard(data, sel.id);
      panel.open(card.html, card.title);
      showSelection(map, { kind: 'town', id: sel.id });
      fit(data.towns[sel.id].bbox, { maxZoom: 13, minZoom: TOWN_ZOOM + 0.2, ...move });
    } else if (sel.kind === 'county') {
      const card = countyCard(data, sel.id);
      panel.open(card.html, card.title);
      showSelection(map, { kind: 'county', id: sel.id });
      // Stay just below town zoom so the whole county reads as one shape.
      fit(data.counties[sel.id].bbox, { maxZoom: TOWN_ZOOM - 0.05, ...move });
    } else if (sel.kind === 'jersey-101') {
      const card = jersey101Card(data);
      panel.open(card.html, card.title);
      showSelection(map, null);
    } else {
      const entry = data.entries.find((e) => e.id === sel.id);
      if (entry?.kind === 'county' && entry.county_fips) return show({ kind: 'county', id: entry.county_fips }, history, animate);
      const card = entryCard(data, sel.id);
      if (!entry || !card) return show(null, history, animate);
      panel.open(card.html, card.title);
      showSelection(map, null);
      if (entry.location) {
        map.easeTo({ center: [entry.location.lng, entry.location.lat], zoom: Math.max(map.getZoom(), 12), padding: panel.mapPadding(), ...move });
      } else if (entry.geometry) {
        const box = bboxOf(entry.geometry);
        if (box) fit(box, move);
      }
    }
    current = sel;
    document.title = sel ? `${panel.title()} · Explore NJ` : 'Explore NJ';
    const path = pathFor(data, sel);
    if (history === 'push' && path !== location.pathname) window.history.pushState(null, '', path);
    if (history === 'replace') window.history.replaceState(null, '', path);
  };

  enableHover(map, LAYERS.countyFill, 'counties');
  enableHover(map, LAYERS.townFill, 'towns');
  for (const layer of [ENTRY_LAYERS.pins, ENTRY_LAYERS.featureHit, ENTRY_LAYERS.featureLabel]) {
    map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
  }

  // One click handler with a fixed precedence: pin, then feature outline or label,
  // then town (when zoomed in) or county.
  map.on('click', (e) => {
    const near = (px: number): [maplibregl.PointLike, maplibregl.PointLike] => [
      [e.point.x - px, e.point.y - px],
      [e.point.x + px, e.point.y + px],
    ];
    const pin = map.queryRenderedFeatures(near(8), { layers: [ENTRY_LAYERS.pins] })[0];
    if (pin) return show({ kind: 'entry', id: pin.properties.id });
    const feature = map.queryRenderedFeatures(near(4), { layers: [ENTRY_LAYERS.featureLabel, ENTRY_LAYERS.featureHit] })[0];
    if (feature) return show({ kind: 'entry', id: feature.properties.id });
    const layer = map.getZoom() >= TOWN_ZOOM ? LAYERS.townFill : LAYERS.countyFill;
    const id = map.queryRenderedFeatures(e.point, { layers: [layer] })[0]?.properties?.id as string | undefined;
    if (!id) return show(null);
    show({ kind: layer === LAYERS.townFill ? 'town' : 'county', id });
  });

  panel.onClick((target) => {
    if (target.dataset.county) show({ kind: 'county', id: target.dataset.county });
    else if (target.dataset.entry) show({ kind: 'entry', id: target.dataset.entry });
    else if (target.dataset.zoomCounty) fit(data.counties[target.dataset.zoomCounty].bbox, { minZoom: TOWN_ZOOM + 0.2 });
  });
  // Closing the panel (button, Esc) returns to the home URL.
  panel.onClose(() => {
    showSelection(map, null);
    if (current) {
      current = null;
      document.title = 'Explore NJ';
      if (location.pathname !== import.meta.env.BASE_URL) window.history.pushState(null, '', import.meta.env.BASE_URL);
    }
  });
  // Back and forward buttons (including a phone's back gesture) move between cards.
  window.addEventListener('popstate', () => {
    const sel = selectionFromPath(data, location.pathname);
    if (!sameSelection(sel, current)) show(sel, 'none');
  });

  createSearch(document.getElementById('search')!, data, (target) => show(target));
  const jersey101 = document.getElementById('jersey-101-button');
  if (jersey101) jersey101.addEventListener('click', () => show({ kind: 'jersey-101' }));
  const home = document.getElementById('home-link') as HTMLAnchorElement | null;
  if (home) {
    home.href = import.meta.env.BASE_URL;
    home.addEventListener('click', (e) => {
      e.preventDefault();
      show(null);
      map.fitBounds(NJ_BOUNDS, { padding: 24, ...motion() });
    });
  }
  renderLegend(document.getElementById('legend'));

  // Open whatever the address points at (a shared link, or a prerendered page).
  const initial = selectionFromPath(data, location.pathname);
  if (initial) show(initial, 'replace', false);
}

function bboxOf(fc: FeatureCollection): BBox | null {
  let box: BBox | null = null;
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [x, y] = c as [number, number];
      box = box ? [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)] : [x, y, x, y];
    } else if (Array.isArray(c)) c.forEach(walk);
  };
  for (const f of fc.features) if (f.geometry && 'coordinates' in f.geometry) walk(f.geometry.coordinates);
  return box;
}

function renderLegend(el: HTMLElement | null): void {
  if (!el) return;
  el.innerHTML = `<p class="legend-title">${strings.legendTitle}</p><ul>${(Object.keys(PILLARS) as (keyof typeof PILLARS)[])
    .map((p) => `<li>${pillarSvg(p)} ${PILLARS[p].label}</li>`)
    .join('')}</ul>`;
  el.hidden = false;
}

maplibregl.setWorkerUrl(maplibreWorkerUrl);

setText('tagline', strings.tagline);
setText('privacy-note', strings.privacyNote);

const container = document.getElementById('map');
if (container) {
  if (!hasWebGL()) {
    container.classList.add('map--unsupported');
    container.textContent = strings.noWebGL;
  } else {
    const map = initMap(container);
    // Test hook for local development only; not present in production builds.
    if (import.meta.env.DEV) (window as unknown as { __map: maplibregl.Map }).__map = map;
    const panel = createPanel(document.body);
    const dataReady = loadData();
    map.once('load', async () => {
      try {
        const data = await dataReady;
        await addBoundaryLayers(map, data);
        addEntryLayers(map, data);
        document.getElementById('prerendered')?.remove();
        wireInteractions(map, data, panel);
      } catch (err) {
        console.error(err);
        showNotice(strings.dataFailed);
      }
    });
  }
}
