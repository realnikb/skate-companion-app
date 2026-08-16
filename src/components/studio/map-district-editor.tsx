"use client";

import Script from "next/script";
import { PenTool, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./map-district-editor.module.scss";

export type DistrictDraft = { id?: string; slug: string; name: string; colour: string; icon_path: string | null; marker_position: [number, number]; polygon: [number, number][]; sort_order: number };
type Point = { lat: number; lng: number };
type Layer = { addTo: (map: MapInstance) => Layer; remove: () => void };
type Marker = { addTo: (map: MapInstance) => Marker; remove: () => void; on: (event: string, handler: (event: { target: { getLatLng: () => Point } }) => void) => Marker };
type Polygon = Layer & { getLatLngs: () => Point[][]; on: (event: string, handler: () => void) => Polygon; pm: { enable: (options: Record<string, unknown>) => void; disable: () => void } };
type GeomanEvent = { layer: Polygon };
type MapInstance = {
    fitBounds: (bounds: object) => void;
    on: (event: string, handler: (event: GeomanEvent) => void) => void;
    off: (event: string) => void;
    remove: () => void;
    pm: { enableDraw: (shape: string, options: Record<string, unknown>) => void; disableDraw: (shape?: string) => void };
};
type Leaflet = { CRS: { Simple: object }; latLngBounds: (bounds: [[number, number], [number, number]]) => object; map: (node: HTMLDivElement, options: Record<string, unknown>) => MapInstance; tileLayer: (url: string, options: Record<string, unknown>) => Layer; divIcon: (options: Record<string, unknown>) => object; marker: (position: [number, number], options: Record<string, unknown>) => Marker; polygon: (points: [number, number][], options: Record<string, unknown>) => Polygon };

const leaflet = () => (window as unknown as { L?: Leaflet }).L;
const toLeaflet = ([x, y]: [number, number], bounds: [[number, number], [number, number]]): [number, number] => [bounds[1][0] + (bounds[0][0] - bounds[1][0]) * y / 100, bounds[0][1] + (bounds[1][1] - bounds[0][1]) * x / 100];
const toPercent = (point: Point, bounds: [[number, number], [number, number]]): [number, number] => [Math.round((point.lng - bounds[0][1]) / (bounds[1][1] - bounds[0][1]) * 1000) / 10, Math.round((bounds[1][0] - point.lat) / (bounds[1][0] - bounds[0][0]) * 1000) / 10];

export function MapDistrictEditor({ initial, assetRoot, tileUrl = "tiles/{z}/{x}/{y}.webp", bounds = [[-135, 0], [0, 240]], minZoom = 0, maxZoom = 5 }: { initial: DistrictDraft[]; assetRoot: string; tileUrl?: string; bounds?: [[number, number], [number, number]]; minZoom?: number; maxZoom?: number }) {
    const [items, setItems] = useState(initial);
    const [selected, setSelected] = useState(0);
    const [leafletReady, setLeafletReady] = useState(false);
    const [geomanReady, setGeomanReady] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const mapNode = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapInstance | null>(null);
    const layers = useRef<Layer[]>([]);
    const selectedRef = useRef(selected);
    const current = items[selected];

    const update = (patch: Partial<DistrictDraft>) => setItems(all => all.map((item, index) => index === selectedRef.current ? { ...item, ...patch } : item));
    useEffect(() => { selectedRef.current = selected; }, [selected]);

    useEffect(() => {
        const L = leaflet();
        if (!leafletReady || !geomanReady || !L || !mapNode.current || mapRef.current) return;
        const mapBounds = L.latLngBounds(bounds);
        const map = L.map(mapNode.current, { crs: L.CRS.Simple, minZoom, maxZoom, zoomSnap: .25, maxBounds: mapBounds, maxBoundsViscosity: 1 });
        L.tileLayer(`${assetRoot}/${tileUrl}`, { tileSize: 256, minZoom, maxZoom, maxNativeZoom: maxZoom, noWrap: true, bounds: mapBounds, pmIgnore: true }).addTo(map);
        map.fitBounds(mapBounds);
        map.on("pm:create", event => {
            const points = event.layer.getLatLngs()[0].map(point => toPercent(point, bounds));
            event.layer.remove();
            update({ polygon: points });
            setDrawing(false);
        });
        mapRef.current = map;
        return () => { map.remove(); mapRef.current = null; };
    }, [assetRoot, bounds, geomanReady, leafletReady, maxZoom, minZoom, tileUrl]);

    useEffect(() => {
        const L = leaflet(), map = mapRef.current;
        if (!geomanReady || !L || !map) return;
        layers.current.forEach(layer => layer.remove());
        layers.current = [];
        items.forEach((district, index) => {
            if (district.polygon.length > 2) {
                const polygon = L.polygon(district.polygon.map(point => toLeaflet(point, bounds)), { color: district.colour, fillColor: district.colour, fillOpacity: .13, weight: index === selected ? 5 : 3, pmIgnore: index !== selected }).addTo(map) as Polygon;
                const sync = () => setItems(all => all.map((item, itemIndex) => itemIndex === index ? { ...item, polygon: polygon.getLatLngs()[0].map(point => toPercent(point, bounds)) } : item));
                if (index === selected) {
                    polygon.pm.enable({ allowSelfIntersection: false, hideMiddleMarkers: false, preventMarkerRemoval: false, removeVertexOn: "contextmenu", snappable: false });
                    polygon.on("pm:edit", sync).on("pm:vertexadded", sync).on("pm:vertexremoved", sync);
                }
                layers.current.push(polygon);
            }
            const marker = L.marker(toLeaflet(district.marker_position, bounds), { draggable: true, pmIgnore: true, icon: L.divIcon({ className: "studio-district-icon", iconSize: [132, 76], iconAnchor: [66, 38], html: `<div class="studio-district-marker" style="--district:${district.colour}">${district.icon_path ? `<img src="${district.icon_path}" alt="">` : ""}<strong>${district.name}</strong></div>` }) }).addTo(map).on("click", () => setSelected(index)).on("dragend", event => {
                const position = toPercent(event.target.getLatLng(), bounds);
                setItems(all => all.map((item, itemIndex) => itemIndex === index ? { ...item, marker_position: position } : item));
            });
            layers.current.push(marker);
        });
        return () => { layers.current.forEach(layer => layer.remove()); layers.current = []; };
    }, [bounds, geomanReady, items, selected]);

    const startBoundary = () => {
        const map = mapRef.current;
        if (!map || !current) return;
        map.pm.disableDraw();
        setDrawing(true);
        map.pm.enableDraw("Polygon", { allowSelfIntersection: false, snappable: false, finishOn: "dblclick", pathOptions: { color: current.colour, fillColor: current.colour, fillOpacity: .13, weight: 4 } });
    };

    return <section className={styles.editor}>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/@geoman-io/leaflet-geoman-free@2.18.3/dist/leaflet-geoman.css" />
        <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setLeafletReady(true)} />
        {leafletReady && <Script src="https://unpkg.com/@geoman-io/leaflet-geoman-free@2.18.3/dist/leaflet-geoman.min.js" strategy="afterInteractive" onLoad={() => setGeomanReady(true)} />}
        <input type="hidden" name="districts" value={JSON.stringify(items)} />
        <div className={styles.mapStage}><div ref={mapNode} className={styles.leafletCanvas} /><div className={styles.polygonTools}><span><strong>{current?.name}</strong><small>{current?.polygon.length ?? 0} points</small></span><button type="button" className={!drawing ? styles.toolActive : ""} onClick={() => { mapRef.current?.pm.disableDraw(); setDrawing(false); }}>Edit vertices</button><button type="button" className={drawing ? styles.toolActive : ""} onClick={startBoundary}><PenTool />New boundary</button></div></div>
        <aside><header><strong>Districts</strong><button type="button" onClick={() => { setItems(all => [...all, { slug: "new-district", name: "New district", colour: "#3d7eff", icon_path: null, marker_position: [50, 50], polygon: [], sort_order: all.length * 10 }]); setSelected(items.length); }}><Plus />Add</button></header>{items.map((district, index) => <button type="button" className={index === selected ? styles.active : ""} key={district.id ?? `${district.slug}-${index}`} onClick={() => { mapRef.current?.pm.disableDraw(); setDrawing(false); setSelected(index); }}><i style={{ background: district.colour }} />{district.name}</button>)}{current && <div className={styles.fields}><label>Name<input value={current.name} onChange={event => update({ name: event.target.value })} /></label><label>Slug<input value={current.slug} onChange={event => update({ slug: event.target.value })} /></label><label>Colour<input type="color" value={current.colour} onChange={event => update({ colour: event.target.value })} /></label><label>Icon path<input value={current.icon_path ?? ""} onChange={event => update({ icon_path: event.target.value || null })} /></label><p>{drawing ? "Click to place vertices and double-click to finish." : "Drag white vertices to reshape. Drag a translucent midpoint to insert a new point. Right-click a vertex to remove it."}</p><button type="button" onClick={startBoundary}><RotateCcw />Replace boundary</button><button type="button" onClick={() => { setItems(all => all.filter((_, index) => index !== selected)); setSelected(0); }}><Trash2 />Remove district</button></div>}</aside>
    </section>;
}
