// Map layers for content entries: place pins, feature outlines and labels, and the
// soft North / Central / South Jersey labels.

import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { REGION_LABELS, REGION_TOPIC_ID } from '../config';
import type { AppData } from '../data';
import { PILLARS, pillarImage, type Pillar } from '../pillars';

export const ENTRY_LAYERS = {
  pins: 'place-pins',
  featureFill: 'feature-fill',
  featureLine: 'feature-line',
  featureHit: 'feature-hit',
  featureLabel: 'feature-label',
  regionLabel: 'region-label',
} as const;

const FEATURE_COLOR = '#2e6b3a';
const FONT = ['Noto Sans Regular'];
const FONT_ITALIC = ['Noto Sans Italic'];

export function addEntryLayers(map: MapLibreMap, data: AppData): void {
  for (const pillar of Object.keys(PILLARS) as Pillar[]) {
    map.addImage(`pin-${pillar}`, pillarImage(pillar, 2), { pixelRatio: 2 });
  }

  const places: FeatureCollection = {
    type: 'FeatureCollection',
    features: data.entries
      .filter((e) => e.kind === 'place' && e.location)
      .map((e) => ({
        type: 'Feature',
        properties: { id: e.id, name: e.name, pillar: e.pillar },
        geometry: { type: 'Point', coordinates: [e.location!.lng, e.location!.lat] },
      })),
  };
  const features = data.entries.filter((e) => e.kind === 'feature' && e.geometry);
  const outlines: FeatureCollection = {
    type: 'FeatureCollection',
    features: features.flatMap((e) =>
      e.geometry!.features.map((f) => ({ ...f, properties: { id: e.id } })),
    ),
  };
  const featureLabels: FeatureCollection = {
    type: 'FeatureCollection',
    features: features
      .filter((e) => e.label)
      .map((e) => ({ type: 'Feature', properties: { id: e.id, name: e.name }, geometry: { type: 'Point', coordinates: e.label! } })),
  };

  map.addSource('feature-outlines', { type: 'geojson', data: outlines });
  map.addSource('feature-labels', { type: 'geojson', data: featureLabels });
  map.addSource('places', { type: 'geojson', data: places });

  // Feature areas are lightly tinted but not clickable inside, so the county or town
  // underneath still is. Only the outline (with a generous invisible hit area) and the
  // label open the feature.
  map.addLayer({ id: ENTRY_LAYERS.featureFill, type: 'fill', source: 'feature-outlines', paint: { 'fill-color': FEATURE_COLOR, 'fill-opacity': 0.06 } });
  map.addLayer({
    id: ENTRY_LAYERS.featureLine,
    type: 'line',
    source: 'feature-outlines',
    paint: { 'line-color': FEATURE_COLOR, 'line-width': 1.5, 'line-dasharray': [3, 2], 'line-opacity': 0.8 },
  });
  map.addLayer({ id: ENTRY_LAYERS.featureHit, type: 'line', source: 'feature-outlines', paint: { 'line-width': 14, 'line-opacity': 0 } });
  map.addLayer({
    id: ENTRY_LAYERS.featureLabel,
    type: 'symbol',
    source: 'feature-labels',
    layout: { 'text-field': ['get', 'name'], 'text-font': FONT_ITALIC, 'text-size': 13, 'text-max-width': 8 },
    paint: { 'text-color': FEATURE_COLOR, 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
  });

  // Soft region labels, only once the Jersey 101 topic that explains them exists.
  if (data.entries.some((e) => e.id === REGION_TOPIC_ID)) {
    map.addSource('region-labels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: REGION_LABELS.map((r) => ({ type: 'Feature', properties: { name: r.name }, geometry: { type: 'Point', coordinates: r.at } })),
      },
    });
    map.addLayer({
      id: ENTRY_LAYERS.regionLabel,
      type: 'symbol',
      source: 'region-labels',
      maxzoom: 8.2,
      layout: { 'text-field': ['get', 'name'], 'text-font': FONT_ITALIC, 'text-size': 20, 'text-letter-spacing': 0.1, 'text-allow-overlap': true },
      paint: { 'text-color': '#5b6673', 'text-opacity': 0.45 },
    });
  }

  // Pins overlap rather than cluster, so every pillar color stays visible in dense
  // areas. Names appear when zoomed in and drop out where they'd collide.
  map.addLayer({
    id: ENTRY_LAYERS.pins,
    type: 'symbol',
    source: 'places',
    layout: {
      'icon-image': ['concat', 'pin-', ['get', 'pillar']],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['step', ['zoom'], '', 10, ['get', 'name']],
      'text-font': FONT,
      'text-size': 12,
      'text-anchor': 'top',
      'text-offset': [0, 0.9],
      'text-optional': true,
      'text-max-width': 9,
    },
    paint: { 'text-color': '#1c2530', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
  });
}
