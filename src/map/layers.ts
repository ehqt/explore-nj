// Map sources and layers for counties and municipalities.

import type { ExpressionSpecification, FilterSpecification, GeoJSONSourceSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { dataUrl, type AppData } from '../data';

/** Towns appear (and become clickable) from this zoom; counties are clickable below it. */
export const TOWN_ZOOM = 9;

export const LAYERS = {
  outside: 'outside-nj',
  countyFill: 'county-fill',
  countyLine: 'county-line',
  countySelected: 'county-selected',
  countyLabel: 'county-label',
  townFill: 'town-fill',
  townLine: 'town-line',
  townSelected: 'town-selected',
  townLabel: 'town-label',
} as const;

const COLORS = {
  outside: '#f4f4f1',
  countyLine: '#7b8794',
  townLine: '#a6b0bb',
  hover: '#1f4e79',
  selected: '#1f4e79',
  label: '#2f3b47',
  labelHalo: '#ffffff',
};

const FONT = ['Noto Sans Regular'];
const FONT_BOLD = ['Noto Sans Bold'];

function labelPoints(items: Record<string, { name: string; label: [number, number] }>): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: Object.entries(items).map(([id, item]) => ({
      type: 'Feature',
      properties: { id, name: item.name.replace(/ County$/, '') },
      geometry: { type: 'Point', coordinates: item.label },
    })),
  };
}

/** Hide the basemap's place names inside New Jersey; ours replace them there. */
async function limitBasemapLabelsToOutsideNJ(map: MapLibreMap): Promise<void> {
  const res = await fetch(dataUrl('boundaries/outside-nj.geojson'));
  const outside = (await res.json()) as FeatureCollection;
  const shape = outside.features[0]?.geometry;
  if (!shape) return;
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol' || !('source-layer' in layer) || layer['source-layer'] !== 'place') continue;
    if (layer.id === 'label_state' || layer.id.startsWith('label_country')) continue;
    const existing = map.getFilter(layer.id);
    const within = ['within', shape] as unknown as ExpressionSpecification;
    map.setFilter(layer.id, (existing ? ['all', existing, within] : within) as FilterSpecification);
  }
}

export async function addBoundaryLayers(map: MapLibreMap, data: AppData): Promise<void> {
  const source = (path: string): GeoJSONSourceSpecification => ({
    type: 'geojson',
    data: dataUrl(path),
    promoteId: 'id',
  });
  map.addSource('outside-nj', { type: 'geojson', data: dataUrl('boundaries/outside-nj.geojson') });
  map.addSource('counties', source('boundaries/counties.geojson'));
  map.addSource('towns', source('boundaries/municipalities.geojson'));
  map.addSource('county-labels', { type: 'geojson', data: labelPoints(data.counties) });
  map.addSource('town-labels', { type: 'geojson', data: labelPoints(data.towns) });

  const hovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];
  const townOpacity = (visible: number): ExpressionSpecification =>
    ['interpolate', ['linear'], ['zoom'], TOWN_ZOOM - 0.5, 0, TOWN_ZOOM + 0.3, visible];

  map.addLayer({ id: LAYERS.outside, type: 'fill', source: 'outside-nj', paint: { 'fill-color': COLORS.outside, 'fill-opacity': 0.6 } });

  // Fills are nearly transparent: they exist to be hovered and clicked.
  map.addLayer({
    id: LAYERS.countyFill,
    type: 'fill',
    source: 'counties',
    maxzoom: TOWN_ZOOM,
    paint: { 'fill-color': COLORS.hover, 'fill-opacity': ['case', hovered, 0.12, 0.01] },
  });
  map.addLayer({
    id: LAYERS.townFill,
    type: 'fill',
    source: 'towns',
    minzoom: TOWN_ZOOM - 0.5,
    paint: { 'fill-color': COLORS.hover, 'fill-opacity': ['case', hovered, 0.12, 0.01] },
  });
  map.addLayer({
    id: LAYERS.townLine,
    type: 'line',
    source: 'towns',
    minzoom: TOWN_ZOOM - 0.5,
    paint: { 'line-color': COLORS.townLine, 'line-width': 0.8, 'line-opacity': townOpacity(1) },
  });
  map.addLayer({
    id: LAYERS.countyLine,
    type: 'line',
    source: 'counties',
    paint: {
      'line-color': COLORS.countyLine,
      'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1, 11, 2],
    },
  });
  map.addLayer({
    id: LAYERS.countySelected,
    type: 'line',
    source: 'counties',
    filter: ['==', ['get', 'id'], ''],
    paint: { 'line-color': COLORS.selected, 'line-width': 3 },
  });
  map.addLayer({
    id: LAYERS.townSelected,
    type: 'line',
    source: 'towns',
    filter: ['==', ['get', 'id'], ''],
    paint: { 'line-color': COLORS.selected, 'line-width': 2.5 },
  });
  map.addLayer({
    id: LAYERS.countyLabel,
    type: 'symbol',
    source: 'county-labels',
    maxzoom: TOWN_ZOOM,
    layout: { 'text-field': ['get', 'name'], 'text-font': FONT_BOLD, 'text-size': 12, 'text-transform': 'uppercase', 'text-letter-spacing': 0.05 },
    paint: { 'text-color': COLORS.label, 'text-halo-color': COLORS.labelHalo, 'text-halo-width': 1.5, 'text-opacity': 0.8 },
  });
  map.addLayer({
    id: LAYERS.townLabel,
    type: 'symbol',
    source: 'town-labels',
    minzoom: TOWN_ZOOM + 0.5,
    layout: { 'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 14, 14] },
    paint: { 'text-color': COLORS.label, 'text-halo-color': COLORS.labelHalo, 'text-halo-width': 1.5 },
  });

  await limitBasemapLabelsToOutsideNJ(map);
}

export function showSelection(map: MapLibreMap, selection: { kind: 'town' | 'county'; id: string } | null): void {
  map.setFilter(LAYERS.townSelected, ['==', ['get', 'id'], selection?.kind === 'town' ? selection.id : '']);
  map.setFilter(LAYERS.countySelected, ['==', ['get', 'id'], selection?.kind === 'county' ? selection.id : '']);
}
