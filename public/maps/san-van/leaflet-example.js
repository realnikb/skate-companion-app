export async function createSanVanMap(element, assetRoot = "/maps/san-van") {
  const manifest = await fetch(`${assetRoot}/map-manifest.json`).then((r) =>
    r.json(),
  );
  const bounds = L.latLngBounds(manifest.leaflet_bounds);

  const map = L.map(element, {
    crs: L.CRS.Simple,
    minZoom: manifest.min_zoom,
    maxZoom: manifest.max_zoom,
    zoomSnap: 0.25,
    maxBounds: bounds.pad(0.1),
    maxBoundsViscosity: 1,
  });

  L.tileLayer(`${assetRoot}/${manifest.tile_url}`, {
    tileSize: manifest.tile_size,
    minZoom: manifest.min_zoom,
    maxZoom: manifest.max_zoom,
    maxNativeZoom: manifest.max_native_zoom,
    noWrap: true,
    bounds,
    attribution: "Game map imagery extracted from the local client dataset",
  }).addTo(map);

  map.fitBounds(bounds);
  return map;
}
