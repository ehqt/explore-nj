import * as maplibregl from 'maplibre-gl';
// MapLibre finds its worker through a runtime URL the bundler can't see, so
// bundle the worker explicitly and tell MapLibre where it ended up.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { countyCard, entryCard, townCard } from './cards';
import { loadData, type AppData } from './data';
import type { BBox } from './lib/geo';
import { BASEMAP_STYLE_URL, FALLBACK_STYLE, MAX_BOUNDS, NJ_BOUNDS } from './map-config';
import { addBoundaryLayers, LAYERS, showSelection, TOWN_ZOOM } from './map/layers';
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

  const openTown = (id: string) => {
    const card = townCard(data, id);
    panel.open(card.html, card.title);
    showSelection(map, { kind: 'town', id });
    fit(data.towns[id].bbox, { maxZoom: 13, minZoom: TOWN_ZOOM + 0.2 });
  };
  const openCounty = (id: string) => {
    const card = countyCard(data, id);
    panel.open(card.html, card.title);
    showSelection(map, { kind: 'county', id });
    // Stay just below town zoom so the whole county reads as one shape.
    fit(data.counties[id].bbox, { maxZoom: TOWN_ZOOM - 0.05 });
  };
  const openEntry = (id: string) => {
    const card = entryCard(data, id);
    if (!card) return;
    panel.open(card.html, card.title);
    showSelection(map, null);
    const entry = data.entries.find((e) => e.id === id);
    if (entry?.location) {
      map.easeTo({ center: [entry.location.lng, entry.location.lat], zoom: Math.max(map.getZoom(), 12), padding: panel.mapPadding(), ...motion() });
    }
  };

  enableHover(map, LAYERS.countyFill, 'counties');
  enableHover(map, LAYERS.townFill, 'towns');

  // One click handler with a fixed precedence: towns when zoomed in, counties otherwise.
  // (Pins and feature outlines join the top of this order in the next build step.)
  map.on('click', (e) => {
    const layer = map.getZoom() >= TOWN_ZOOM ? LAYERS.townFill : LAYERS.countyFill;
    const hit = map.queryRenderedFeatures(e.point, { layers: [layer] })[0];
    const id = hit?.properties?.id as string | undefined;
    if (!id) return panel.close();
    if (layer === LAYERS.townFill) openTown(id);
    else openCounty(id);
  });

  panel.onClick((target) => {
    if (target.dataset.county) openCounty(target.dataset.county);
    else if (target.dataset.entry) openEntry(target.dataset.entry);
    else if (target.dataset.zoomCounty) fit(data.counties[target.dataset.zoomCounty].bbox, { minZoom: TOWN_ZOOM + 0.2 });
  });
  panel.onClose(() => showSelection(map, null));
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
        wireInteractions(map, data, panel);
      } catch (err) {
        console.error(err);
        showNotice(strings.dataFailed);
      }
    });
  }
}
