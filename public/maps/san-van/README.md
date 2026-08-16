# San Van Leaflet map bundle

This directory is a portable map package.

## Contents

- `tiles/{z}/{x}/{y}.webp`: XYZ raster tiles, zoom levels 0–5.
- `map-manifest.json`: dimensions, bounds, zoom configuration and coordinate conventions.
- `icons/`: transparent district marker icons and their metadata.
- `data/district_boundaries.geojson`: reserved for recovered district polygons.
- `data/points_of_interest.geojson`: reserved for recovered POIs.
- `leaflet-example.js`: minimal Leaflet integration.

The map uses `L.CRS.Simple`, not geographic latitude/longitude. Leaflet coordinates are `[lat, lng]`, with `[0, 0]` at the top-left. Longitude increases to the right and latitude becomes negative moving down. At native zoom 5, one Leaflet map unit equals 32 source pixels. This convention keeps XYZ tile `{x}` and `{y}` indices positive.

```js
const pixelToLeaflet = (x, y) => [-y / 32, x / 32];
const leafletToPixel = (lat, lng) => [lng * 32, -lat * 32];
```

The base raster is ready. The two GeoJSON files are intentionally empty until district boundary and POI coordinates have been verified from the client data.
