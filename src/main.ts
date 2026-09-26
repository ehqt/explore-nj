import * as maplibregl from 'maplibre-gl';
// MapLibre finds its worker through a runtime URL the bundler can't see, so
// bundle the worker explicitly and tell MapLibre where it ended up.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { strings } from './strings';
import { BASEMAP_STYLE_URL, FALLBACK_STYLE, MAX_BOUNDS, NJ_BOUNDS } from './map-config';

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

function initMap(container: HTMLElement): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    style: BASEMAP_STYLE_URL,
    bounds: NJ_BOUNDS,
    fitBoundsOptions: { padding: 24 },
    maxBounds: MAX_BOUNDS,
    minZoom: 6.5,
    maxZoom: 16,
    attributionControl: { compact: false },
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

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

maplibregl.setWorkerUrl(maplibreWorkerUrl);

setText('tagline', strings.tagline);
setText('privacy-note', strings.privacyNote);

const container = document.getElementById('map');
if (container) {
  if (hasWebGL()) {
    initMap(container);
  } else {
    container.classList.add('map--unsupported');
    container.textContent = strings.noWebGL;
  }
}
