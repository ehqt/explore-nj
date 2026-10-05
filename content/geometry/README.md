# Geometry files

Shapes for "feature" entries (areas and lines drawn on the map). Every file is
WGS84 GeoJSON, simplified to keep the site fast. Each file's origin and license
is listed here; the entry's `geometry_source` cites the same source.

| File | Source | License | How it was made |
|---|---|---|---|
| `pinelands.geojson` | OpenStreetMap relation [11017763](https://www.openstreetmap.org/relation/11017763) "Pinelands National Reserve", downloaded 2026-09-26 via polygons.openstreetmap.fr | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), © OpenStreetMap contributors | `mapshaper pnr-osm.geojson -simplify 8% keep-shapes -clean -o format=geojson geojson-type=FeatureCollection precision=0.0001` |
| `barnegat-bay.geojson` | U.S. Census Bureau TIGER/Line 2025 AREAWATER, Ocean County ([tl_2025_34029_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_34029_areawater.zip)), the one polygon with `FULLNAME` "Barnegat Bay" (HYDROID 11010886870179), downloaded 2026-10-02. It covers the water the Census names Barnegat Bay, about 40.07°N to 39.66°N; Manahawkin Bay and Little Egg Harbor are separate polygons and are not included | Public domain (U.S. Government work) | `mapshaper tl_2025_34029_areawater.shp -filter 'FULLNAME == "Barnegat Bay"' -proj wgs84 -dissolve -simplify 10% keep-shapes -o barnegat-bay.geojson format=geojson geojson-type=FeatureCollection precision=0.0001` (mapshaper 0.7.68) |

## Why not the Pinelands Commission's own boundary?

The Pinelands Commission publishes the official boundary under two sets of terms.
The shapefile download (https://www.nj.gov/pinelands/home/maps/datas/pma.txt)
says the data is for internal use only and may not be redistributed without
written permission. The ArcGIS layer
(https://www.arcgis.com/home/item.html?id=dbea9eaee8a44908afedb0aff7abc9ac)
only asks for credit. Until the Commission confirms in writing that a simplified
outline can be published, we use OpenStreetMap's version, which is clearly
licensed for reuse.
