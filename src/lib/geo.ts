// Small geometry helpers shared by the app and the build scripts.

export type Position = [number, number];
export type BBox = [number, number, number, number];

export interface PolygonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: Position[][] | Position[][][];
}

export interface PolygonFeature {
  properties: { id: string };
  geometry: PolygonGeometry;
}

function inRing([x, y]: Position, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** True if the point is inside the polygon and not inside one of its holes. */
export function inPolygon(point: Position, geometry: PolygonGeometry): boolean {
  const polygons = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates) as Position[][][];
  return polygons.some(([outer, ...holes]) => inRing(point, outer) && !holes.some((h) => inRing(point, h)));
}

export function inBBox([x, y]: Position, [w, s, e, n]: BBox): boolean {
  return x >= w && x <= e && y >= s && y <= n;
}

/** The id of the first feature containing the point, or null. */
export function featureAt(point: Position, features: PolygonFeature[]): string | null {
  for (const f of features) if (inPolygon(point, f.geometry)) return f.properties.id;
  return null;
}

/** Distance in kilometers between two points (haversine). */
export function distanceKm([lng1, lat1]: Position, [lng2, lat2]: Position): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
