"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Check, MapPin, RotateCcw } from "lucide-react";
import styles from "./social.module.scss";
import mapTheme from "@/components/maps/leaflet-map-theme.module.scss";
import { cn } from "@/lib/utils";
import { skateboardMarkerHtml } from "@/components/maps/leaflet-map-theme";

export type PostMapOption = {
  id: string;
  name: string;
  assetRoot: string;
  tileUrl: string;
  minZoom: number;
  maxZoom: number;
  bounds: [[number, number], [number, number]];
};
type Point = { lat: number; lng: number };
type MapApi = {
  remove: () => void;
  fitBounds: (bounds: object, options?: object) => void;
  on: (event: string, handler: (event: { latlng: Point }) => void) => void;
  off: (event: string, handler: (event: { latlng: Point }) => void) => void;
  invalidateSize: () => void;
};
type Marker = { addTo: (map: MapApi) => Marker; remove: () => void };
type Leaflet = {
  CRS: { Simple: object };
  map: (node: HTMLDivElement, options: object) => MapApi;
  latLngBounds: (bounds: [[number, number], [number, number]]) => object;
  tileLayer: (url: string, options: object) => { addTo: (map: MapApi) => void };
  divIcon: (options: object) => object;
  marker: (point: [number, number], options: object) => Marker;
};

export function PostMapPicker({ maps }: { maps: PostMapOption[] }) {
  const [mapId, setMapId] = useState(maps[0]?.id ?? ""),
    [ready, setReady] = useState(false),
    [position, setPosition] = useState<[number, number] | null>(null),
    node = useRef<HTMLDivElement>(null),
    instance = useRef<MapApi | null>(null),
    marker = useRef<Marker | null>(null),
    selected = maps.find((map) => map.id === mapId) ?? maps[0];
  useEffect(() => {
    if (!ready || !node.current || !selected) return;
    const L = (window as unknown as { L?: Leaflet }).L;
    if (!L) return;
    instance.current?.remove();
    marker.current = null;
    const bounds = L.latLngBounds(selected.bounds),
      map = L.map(node.current, {
        crs: L.CRS.Simple,
        zoomControl: true,
        attributionControl: false,
        minZoom: selected.minZoom,
        maxZoom: selected.maxZoom,
        maxBounds: bounds,
        maxBoundsViscosity: 1,
      });
    L.tileLayer(`${selected.assetRoot}/${selected.tileUrl}`, {
      tileSize: 256,
      minZoom: selected.minZoom,
      maxZoom: selected.maxZoom,
      maxNativeZoom: selected.maxZoom,
      noWrap: true,
      bounds,
    }).addTo(map);
    map.fitBounds(bounds, { animate: false });
    const click = (event: { latlng: Point }) => {
      const [[minLat, minLng], [maxLat, maxLng]] = selected.bounds,
        x = Math.max(
          0,
          Math.min(
            100,
            ((event.latlng.lng - minLng) / (maxLng - minLng)) * 100,
          ),
        ),
        y = Math.max(
          0,
          Math.min(
            100,
            ((maxLat - event.latlng.lat) / (maxLat - minLat)) * 100,
          ),
        );
      setPosition([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
      marker.current?.remove();
      marker.current = L.marker([event.latlng.lat, event.latlng.lng], {
        icon: L.divIcon({
          className: "skate-map-marker",
          iconSize: [46, 46],
          iconAnchor: [23, 42],
          html: skateboardMarkerHtml,
        }),
      }).addTo(map);
    };
    map.on("click", click);
    instance.current = map;
    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.off("click", click);
      map.remove();
      instance.current = null;
    };
  }, [mapId, ready, selected]);
  const clear = () => {
    setPosition(null);
    marker.current?.remove();
    marker.current = null;
  };
  if (!maps.length)
    return (
      <div className={styles.noMaps}>No published maps are available yet.</div>
    );
  return (
    <div className={styles.mapPicker}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <header>
        <label>
          Game map
          <select
            value={mapId}
            onChange={(event) => {
              setMapId(event.target.value);
              clear();
            }}
          >
            {maps.map((map) => (
              <option value={map.id} key={map.id}>
                {map.name}
              </option>
            ))}
          </select>
        </label>
        {position ? (
          <div className={styles.mapPinConfirmation}>
            <span>
              <Check />
            </span>
            <p>
              <strong>Pin placed</strong>
              <small>Click elsewhere to move it</small>
            </p>
            <button type="button" onClick={clear}>
              <RotateCcw />
              Clear pin
            </button>
          </div>
        ) : (
          <div className={styles.mapPinHint}>
            <MapPin />
            <span>
              <strong>Choose your spot</strong>
              <small>Click the exact place on the map</small>
            </span>
          </div>
        )}
      </header>
      <div ref={node} className={cn(styles.pickerMap, mapTheme.canvas)} />
      <input type="hidden" name="map_id" value={position ? mapId : ""} />
      <input
        type="hidden"
        name="map_position"
        value={position ? JSON.stringify(position) : ""}
      />
    </div>
  );
}
