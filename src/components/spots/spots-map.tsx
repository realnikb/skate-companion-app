"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Bookmark, ChevronDown, Clock3, Heart, LocateFixed, MapPin, MessageCircle, Plus, Search, Share2, Sparkles, Star, Users, X, ZoomIn, ZoomOut } from "lucide-react";

import styles from "./spots-map.module.scss";

type Category = "popular" | "city-echo" | "community";
type LeafletBounds = object;
type LeafletLayer = { addTo: (map: LeafletMapInstance) => LeafletLayer; remove: () => void };
type LeafletMapInstance = { remove: () => void; zoomIn: () => void; zoomOut: () => void; fitBounds: (bounds: LeafletBounds, options?: Record<string, unknown>) => void };
type LeafletMarker = { addTo: (map: LeafletMapInstance) => LeafletMarker; on: (event: string, handler: () => void) => LeafletMarker; remove: () => void };
type LeafletApi = {
    CRS: { Simple: object };
    map: (element: HTMLDivElement, options: Record<string, unknown>) => LeafletMapInstance;
    latLngBounds: (bounds: [[number, number], [number, number]]) => LeafletBounds;
    tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMapInstance) => void };
    divIcon: (options: Record<string, unknown>) => object;
    marker: (position: [number, number], options: Record<string, unknown>) => LeafletMarker;
    polygon: (positions: [number, number][], options: Record<string, unknown>) => LeafletLayer;
};

declare global { interface Window { L?: LeafletApi } }
type Spot = {
    id: string;
    name: string;
    district: string;
    category: Category;
    x: number;
    y: number;
    rating: number;
    ratings: number;
    favourites: number;
    description: string;
    tags: string[];
    quote: string;
    author: string;
    palette: string;
};

const spots: Spot[] = [
    { id: "stalefish", name: "Stalefish Backlot", district: "Hedgemont", category: "popular", x: 39, y: 43, rating: 4.9, ratings: 128, favourites: 342, description: "A compact little playground tucked behind Stalefish Bevvie Co. Curbs, banks and a perfect loading dock make it an easy place to lose an afternoon.", tags: ["Street", "Curbs", "DIY lines"], quote: "The flow here is ridiculous. Every little wall becomes part of the line.", author: "KickflipKarl", palette: "orange" },
    { id: "waterfront", name: "Brickswich Banks", district: "Brickswich", category: "city-echo", x: 68, y: 35, rating: 4.7, ratings: 86, favourites: 219, description: "Long brick banks and clean ledges beside the waterfront. A San Vansterdam landmark with more than a little real-world DNA.", tags: ["Banks", "Ledges", "City Echo"], quote: "Best place on the map for long, unbroken lines.", author: "MinaGrinds", palette: "blue" },
    { id: "underpass", name: "The Overpass", district: "Market Mile", category: "community", x: 54, y: 67, rating: 4.5, ratings: 47, favourites: 111, description: "A community find beneath the freeway. Rough ground, endless pillars and a few surprisingly technical gaps.", tags: ["Gaps", "Technical", "Community"], quote: "Bring speed and a little imagination. It rewards both.", author: "rollaway", palette: "violet" },
    { id: "uni", name: "SVU Quad", district: "Hedgemont", category: "popular", x: 26, y: 29, rating: 4.8, ratings: 101, favourites: 280, description: "Wide stairs, rails and smooth plazas. A reliable session starter with room for the whole crew.", tags: ["Rails", "Stairs", "Plaza"], quote: "Meet here, warm up, then see where the session goes.", author: "sarah_skates", palette: "green" },
    { id: "drain", name: "Copperhead Drain", district: "Gullcrest", category: "community", x: 78, y: 63, rating: 4.3, ratings: 31, favourites: 74, description: "A half-hidden concrete channel with steep walls and some wonderfully awkward transfers.", tags: ["Transition", "Hidden gem", "Concrete"], quote: "It looks impossible until you find the right angle.", author: "waxedcurb", palette: "pink" },
];

const labels: Record<Category, string> = { popular: "Popular", "city-echo": "City Echoes", community: "Community finds" };
const sanVanBounds: [[number, number], [number, number]] = [[-135, 0], [0, 240]];
export type MapPresentation = { id:string; name:string; assetRoot:string; tileUrl:string; minZoom:number; maxZoom:number; bounds:[[number,number],[number,number]]; districts:Array<{name:string;icon:string;x:number;y:number;accent:string;points:[number,number][]}> };
const fallbackDistricts = [
    { name: "Gullcrest Village", icon: "/maps/san-van/icons/gullcrest_village.png", x: 31, y: 35, accent: "#c79f02" },
    { name: "Hedgemont", icon: "/maps/san-van/icons/hedgemont.png", x: 63, y: 30, accent: "#9930c1" },
    { name: "Market Mile", icon: "/maps/san-van/icons/market_mile.png", x: 35, y: 70, accent: "#2f6dc2" },
    { name: "Brickswich", icon: "/maps/san-van/icons/brickswich.png", x: 68, y: 72, accent: "#c45157" },
];
const districtBoundaries = [
    { name: "Gullcrest Village", accent: "#d3a915", points: [[28, 8], [47, 3], [49, 42], [40, 43], [43, 58], [33, 61], [25, 50], [13, 54], [20, 24]] },
    { name: "Hedgemont", accent: "#b238d0", points: [[48, 3], [70, 5], [78, 17], [81, 53], [52, 48], [49, 42]] },
    { name: "Market Mile", accent: "#3881d9", points: [[13, 54], [25, 50], [33, 61], [43, 58], [51, 49], [52, 94], [42, 97], [28, 91], [19, 74]] },
    { name: "Brickswich", accent: "#d2585e", points: [[51, 49], [81, 53], [82, 70], [76, 80], [65, 89], [52, 94]] },
] as const;

export function SpotsMap({presentation}:{presentation?:MapPresentation}) {
    const mapDistricts=presentation?.districts??fallbackDistricts.map(d=>({...d,points:(districtBoundaries.find(b=>b.name===d.name)?.points??[]).map(([x,y])=>[x,y] as [number,number])}));
    const [activeId, setActiveId] = useState("stalefish");
    const [filter, setFilter] = useState<Category | "all">("all");
    const [query, setQuery] = useState("");
    const [saved, setSaved] = useState<string[]>(["stalefish"]);
    const [rating, setRating] = useState(0);
    const [addMode, setAddMode] = useState(false);
    const [mapMenuOpen, setMapMenuOpen] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const mapNode = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<LeafletMapInstance | null>(null);
    const mapBounds = useRef<LeafletBounds | null>(null);
    const spotMarkers = useRef<LeafletMarker[]>([]);
    const districtMarkers = useRef<LeafletMarker[]>([]);
    const districtPolygons = useRef<LeafletLayer[]>([]);
    const active = spots.find((spot) => spot.id === activeId) ?? null;

    const visible = useMemo(() => spots.filter((spot) => (filter === "all" || spot.category === filter) && `${spot.name} ${spot.district}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);

    useEffect(() => {
        const stored = localStorage.getItem("skate-companion-favourite-spots");
        if (stored) queueMicrotask(() => setSaved(JSON.parse(stored)));
    }, []);

    useEffect(() => {
        if (!mapReady || !mapNode.current || mapInstance.current || !window.L) return;
        const L = window.L;
        const bounds = L.latLngBounds(presentation?.bounds??sanVanBounds);
        const minZoom=presentation?.minZoom??0,maxZoom=presentation?.maxZoom??5;
        const map = L.map(mapNode.current, { crs: L.CRS.Simple, zoomControl: false, attributionControl: false, minZoom, maxZoom, zoomSnap: .25, maxBounds: bounds, maxBoundsViscosity: 1 });
        L.tileLayer(`${presentation?.assetRoot??"/maps/san-van"}/${presentation?.tileUrl??"tiles/{z}/{x}/{y}.webp"}`, { tileSize: 256, minZoom, maxZoom, maxNativeZoom: maxZoom, noWrap: true, bounds }).addTo(map);
        map.fitBounds(bounds, { animate: false });
        mapInstance.current = map;
        mapBounds.current = bounds;
        return () => { spotMarkers.current.forEach((marker) => marker.remove()); districtMarkers.current.forEach((marker) => marker.remove()); districtPolygons.current.forEach((polygon) => polygon.remove()); map.remove(); mapInstance.current = null; mapBounds.current = null; };
    }, [mapReady, presentation]);

    useEffect(() => {
        if (!mapReady || !mapInstance.current || !window.L) return;
        districtPolygons.current = mapDistricts.map((district) => window.L!.polygon(
            district.points.map(([x, y]) => [-135 * y / 100, 240 * x / 100] as [number, number]),
            { className: "district-boundary", color: district.accent, fillColor: district.accent, fillOpacity: .105, opacity: .9, weight: 4, lineCap: "round", lineJoin: "round", interactive: false },
        ).addTo(mapInstance.current!));
        return () => { districtPolygons.current.forEach((polygon) => polygon.remove()); districtPolygons.current = []; };
    }, [mapDistricts, mapReady]);

    useEffect(() => {
        if (!mapReady || !mapInstance.current || !window.L) return;
        districtMarkers.current = mapDistricts.map((district) => window.L!.marker([-135 * district.y / 100, 240 * district.x / 100], {
            interactive: false,
            icon: window.L!.divIcon({
                className: "leaflet-district-icon",
                iconSize: [150, 96],
                iconAnchor: [75, 48],
                html: `<div class="district-marker" style="--district-accent:${district.accent}"><img src="${district.icon}" alt=""><strong>${district.name}</strong></div>`,
            }),
        }).addTo(mapInstance.current!));
        return () => { districtMarkers.current.forEach((marker) => marker.remove()); districtMarkers.current = []; };
    }, [mapDistricts, mapReady]);

    useEffect(() => {
        if (!mapReady || !mapInstance.current || !window.L) return;
        spotMarkers.current.forEach((marker) => marker.remove());
        spotMarkers.current = visible.map((spot) => {
            const isActive = activeId === spot.id;
            return window.L!.marker([-135 * spot.y / 100, 240 * spot.x / 100], {
                icon: window.L!.divIcon({
                    className: "leaflet-spot-icon",
                    iconSize: isActive ? [176, 54] : [38, 46],
                    iconAnchor: [19, 42],
                    html: `<span class="spot-pin spot-pin--${spot.category}${isActive ? " is-active" : ""}">${spot.category === "popular" ? "&#9733;" : spot.category === "city-echo" ? "&#9679;" : "&#9670;"}</span>${isActive ? `<strong class="spot-label">${spot.name}<small>${spot.rating} &#9733; &middot; ${spot.favourites} saves</small></strong>` : ""}`,
                }),
            }).addTo(mapInstance.current!).on("click", () => setActiveId(spot.id));
        });
        return () => { spotMarkers.current.forEach((marker) => marker.remove()); spotMarkers.current = []; };
    }, [activeId, mapReady, visible]);

    const toggleSaved = (id: string) => {
        const next = saved.includes(id) ? saved.filter((spotId) => spotId !== id) : [...saved, id];
        setSaved(next);
        localStorage.setItem("skate-companion-favourite-spots", JSON.stringify(next));
    };

    return (
        <main className={styles.page}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setMapReady(true)} />
            <header className={styles.hero}>
                <div><span className={styles.eyebrow}><MapPin /> Community map</span><h1>Find your next <em>spot.</em></h1><p>Discover the places San Van skates. Save your favourites, share a hidden gem and see where the community keeps coming back to.</p></div>
                <button className={styles.addButton} onClick={() => setAddMode(true)}><Plus /> Add a spot</button>
            </header>

            <section className={styles.mapShell}>
                <div className={styles.toolbar}>
                    <div className={styles.mapPicker}>
                        <button className={styles.mapPickerButton} aria-expanded={mapMenuOpen} onClick={() => setMapMenuOpen((open) => !open)}><span><small>Map</small>{presentation?.name??"San Vansterdam"}</span><ChevronDown /></button>
                        {mapMenuOpen && <div className={styles.mapMenu}><button className={styles.currentMap}><span>SV</span><div><strong>San Vansterdam</strong><small>Downtown districts</small></div><i>Active</i></button><button disabled><span>IG</span><div><strong>Isle of Grom</strong><small>Coming soon</small></div></button><button disabled><span>ST</span><div><strong>Stadium</strong><small>Coming soon</small></div></button></div>}
                    </div>
                    <label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spots or districts" /></label>
                    <div className={styles.filters}>
                        {(["all", "popular", "city-echo", "community"] as const).map((item) => <button key={item} className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)}>{item === "popular" && <Sparkles />}{item === "city-echo" && <MapPin />}{item === "community" && <Users />}{item === "all" ? "All spots" : labels[item]}{item === "all" && <span>{spots.length}</span>}</button>)}
                    </div>
                    <button className={styles.areaButton}>All districts <ChevronDown /></button>
                </div>

                <div className={styles.map} aria-label="Map of community skate spots">
                    <div ref={mapNode} className={styles.leafletMap} />
                    <div className={styles.mapTint} />
                    <div className={styles.mapControls}><button aria-label="Zoom in" onClick={() => mapInstance.current?.zoomIn()}><ZoomIn /></button><button aria-label="Zoom out" onClick={() => mapInstance.current?.zoomOut()}><ZoomOut /></button><button aria-label="Reset map view" onClick={() => { if (mapInstance.current && mapBounds.current) mapInstance.current.fitBounds(mapBounds.current); }}><LocateFixed /></button></div>
                    <div className={styles.legend}><span><i className={styles.popularDot} /> Popular</span><span><i className={styles.echoDot} /> City Echo</span><span><i className={styles.communityDot} /> Community</span></div>
                    {visible.length === 0 && <div className={styles.noResults}>No spots found. Try another search.</div>}
                </div>

                {active && <aside className={styles.drawer} aria-label={`${active.name} details`}>
                    <div className={`${styles.photo} ${styles[active.palette]}`}><div className={styles.photoNoise} /><span>{active.district}</span><button aria-label="Close spot details" onClick={() => setActiveId("")}><X /></button><div className={styles.photoCaption}>Community photo <small>by {active.author}</small></div></div>
                    <div className={styles.drawerBody}>
                        <div className={styles.spotMeta}><span>{labels[active.category]}</span><span>•</span><span>{active.district}</span></div>
                        <h2>{active.name}</h2>
                        <div className={styles.stats}><strong><Star /> {active.rating}</strong><span>{active.ratings} ratings</span><span><Heart /> {active.favourites} favourites</span></div>
                        <div className={styles.tags}>{active.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                        <p className={styles.description}>{active.description}</p>
                        <div className={styles.actions}><button className={saved.includes(active.id) ? styles.saved : ""} onClick={() => toggleSaved(active.id)}><Bookmark />{saved.includes(active.id) ? "Saved" : "Favourite"}</button><button><Share2 /> Share</button></div>
                        <section className={styles.rate}><div><strong>Rate this spot</strong><span>{rating ? `You gave it ${rating} stars` : "How was your session?"}</span></div><div>{[1,2,3,4,5].map((value) => <button key={value} aria-label={`Rate ${value} stars`} onClick={() => setRating(value)} className={value <= rating ? styles.rated : ""}><Star /></button>)}</div></section>
                        <section className={styles.discussion}><header><strong><MessageCircle /> Spot talk</strong><button>View all 18</button></header><blockquote>“{active.quote}”<footer><span>{active.author.slice(0, 1).toUpperCase()}</span><div><strong>@{active.author}</strong><small><Clock3 /> 2h ago</small></div></footer></blockquote><button className={styles.reply}>Join the discussion</button></section>
                    </div>
                </aside>}
            </section>

            {addMode && <div className={styles.modalBackdrop} onMouseDown={() => setAddMode(false)}><section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}><button className={styles.modalClose} onClick={() => setAddMode(false)}><X /></button><span className={styles.eyebrow}><MapPin /> New community spot</span><h2>Drop your pin.</h2><p>Click anywhere on the San Van map to mark the exact place, then tell the community what makes it worth a session.</p><label>Spot name<input autoFocus placeholder="e.g. The library ledges" /></label><label>What makes it worth a session?<textarea placeholder="Describe the obstacles, flow and best lines…" /></label><button className={styles.submitButton} onClick={() => setAddMode(false)}><Plus /> Save draft spot</button></section></div>}
        </main>
    );
}
