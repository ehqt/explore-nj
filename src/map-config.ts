import type { LngLatBoundsLike, StyleSpecification } from 'maplibre-gl';

// Muted, low-label basemap so our own layers stand out.
// OpenFreeMap: free, no API key, no cookies; MapLibre adds the required attribution.
export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

// Used if the basemap style can't be fetched. Plain background only.
export const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eef0f2' } }],
};

// New Jersey's extent, used for the initial view.
export const NJ_BOUNDS: LngLatBoundsLike = [
  [-75.57, 38.92],
  [-73.88, 41.36],
];

// How far the user can pan: NJ plus enough margin to keep NYC and Philadelphia in view.
// It's wide on purpose: MapLibre won't show anything outside these bounds, so a narrow
// box would force wide screens to zoom in and cut off the north and south of the state.
export const MAX_BOUNDS: LngLatBoundsLike = [
  [-80.0, 37.6],
  [-69.5, 42.6],
];
