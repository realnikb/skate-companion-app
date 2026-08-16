/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Bookmark, ChevronDown, Clock3, Heart, LocateFixed, MapPin, Maximize2, MessageCircle, Minimize2, Plus, Search, Share2, Star, Users, X, ZoomIn, ZoomOut } from "lucide-react";

import { AccountBenefitsPrompt } from "@/components/account/account-benefits-prompt";
import { addSpotComment, createCommunitySpot, rateSpot, uploadSpotMedia } from "@/app/(site)/spots/actions";
import styles from "./spots-map.module.scss";

type Category = "popular" | "city-echo" | "community";
type LeafletBounds = object;
type LeafletLayer = { addTo: (map: LeafletMapInstance) => LeafletLayer; remove: () => void };
type LeafletPoint={lat:number;lng:number};
type LeafletMapInstance = { remove: () => void; zoomIn: () => void; zoomOut: () => void; fitBounds: (bounds: LeafletBounds, options?: Record<string, unknown>) => void; on:(event:string,handler:(event:{latlng:LeafletPoint})=>void)=>void; off:(event:string,handler:(event:{latlng:LeafletPoint})=>void)=>void; invalidateSize:()=>void };
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
export type Spot = {
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
    persisted?: boolean;
    media?:Array<{id:string;url:string;type:"image"|"video";caption:string|null}>;
    comments?:Array<{id:string;body:string;createdAt:string}>;
};

const fallbackSpots: Spot[] = [
    { id: "stalefish", name: "Stalefish Backlot", district: "Hedgemont", category: "popular", x: 39, y: 43, rating: 4.9, ratings: 128, favourites: 342, description: "A compact little playground tucked behind Stalefish Bevvie Co. Curbs, banks and a perfect loading dock make it an easy place to lose an afternoon.", tags: ["Street", "Curbs", "DIY lines"], quote: "The flow here is ridiculous. Every little wall becomes part of the line.", author: "KickflipKarl", palette: "orange" },
    { id: "waterfront", name: "Brickswich Banks", district: "Brickswich", category: "city-echo", x: 68, y: 35, rating: 4.7, ratings: 86, favourites: 219, description: "Long brick banks and clean ledges beside the waterfront. A San Vansterdam landmark with more than a little real-world DNA.", tags: ["Banks", "Ledges", "Real-World Inspired"], quote: "Best place on the map for long, unbroken lines.", author: "MinaGrinds", palette: "blue" },
    { id: "underpass", name: "The Overpass", district: "Market Mile", category: "community", x: 54, y: 67, rating: 4.5, ratings: 47, favourites: 111, description: "A community find beneath the freeway. Rough ground, endless pillars and a few surprisingly technical gaps.", tags: ["Gaps", "Technical", "Community"], quote: "Bring speed and a little imagination. It rewards both.", author: "rollaway", palette: "violet" },
    { id: "uni", name: "SVU Quad", district: "Hedgemont", category: "popular", x: 26, y: 29, rating: 4.8, ratings: 101, favourites: 280, description: "Wide stairs, rails and smooth plazas. A reliable session starter with room for the whole crew.", tags: ["Rails", "Stairs", "Plaza"], quote: "Meet here, warm up, then see where the session goes.", author: "sarah_skates", palette: "green" },
    { id: "drain", name: "Copperhead Drain", district: "Gullcrest", category: "community", x: 78, y: 63, rating: 4.3, ratings: 31, favourites: 74, description: "A half-hidden concrete channel with steep walls and some wonderfully awkward transfers.", tags: ["Transition", "Hidden gem", "Concrete"], quote: "It looks impossible until you find the right angle.", author: "waxedcurb", palette: "pink" },
];

const labels: Record<Category, string> = { popular: "Popular", "city-echo": "Real-World Inspired", community: "Community finds" };
const sanVanBounds: [[number, number], [number, number]] = [[-135, 0], [0, 240]];
export type MapPresentation = { id:string; name:string; assetRoot:string; tileUrl:string; minZoom:number; maxZoom:number; bounds:[[number,number],[number,number]]; districts:Array<{name:string;icon:string;x:number;y:number;accent:string;points:[number,number][]}>; spots?:Spot[] };
const fallbackDistricts = [
    { name: "Gullcrest Village", icon: "/maps/san-van/icons/gullcrest_village.png", x: 31, y: 35, accent: "#E6B735" },
    { name: "Hedgemont", icon: "/maps/san-van/icons/hedgemont.png", x: 63, y: 30, accent: "#D52AAA" },
    { name: "Market Mile", icon: "/maps/san-van/icons/market_mile.png", x: 35, y: 70, accent: "#299FC0" },
    { name: "Brickswich", icon: "/maps/san-van/icons/brickswich.png", x: 68, y: 72, accent: "#E95055" },
];
const districtBoundaries = [
    { name: "Gullcrest Village", accent: "#E6B735", points: [[49.292981,23.084407],[49.588756,35.981683],[46.96955,37.111581],[44.94399,42.196211],[44.082085,53.699101],[42.491883,51.595031],[40.037603,60.221102],[35.025859,57.739629],[30.939849,52.849787],[26.641327,42.496298],[23.174508,32.973544],[22.116031,29.328506],[24.787982,23.683067],[25.732292,23.652891],[26.414512,24.447809],[28.488503,19.621652],[32.480952,11.455217],[36.525736,4.782538],[41.461556,.721224],[49.292981,23.084407]] },
    { name: "Hedgemont", accent: "#D52AAA", points: [[49.261848,22.923834],[49.579319,35.837207],[47.007723,36.937795],[44.975847,41.92705],[44.183357,49.58622],[44.061454,53.666444],[49.388851,60.636758],[57.890566,61.029204],[60.261264,60.897235],[65.917982,60.629372],[77.994001,62.955089],[83.109196,64.049503],[82.935231,60.209432],[82.808022,57.970305],[79.047428,40.135313],[71.40597,11.057216],[69.326334,6.450556],[62.612845,-.412093],[59.881474,-2.060032],[56.278909,-2.432884],[53.392496,-2.383956],[51.929597,-2.186225],[49.261848,22.923834]] },
    { name: "Market Mile", accent: "#299FC0", points: [[26.641327,42.378133],[30.936316,52.658519],[35.077913,57.621464],[40.037603,60.102936],[42.491883,51.476865],[43.63387,53.014183],[49.344861,60.454735],[57.334932,60.899168],[57.859669,75.452201],[58.648558,97.334371],[50.135519,98.420606],[36.408213,90.784718],[24.078552,74.417922],[20.145057,66.34477],[18.176383,61.214761],[17.365196,56.53983],[17.390994,50.522542],[19.433095,40.887305],[22.280859,34.113655],[21.848261,32.486083],[21.904097,29.831949],[22.133105,29.307965],[26.641327,42.378133]] },
    { name: "Brickswich", accent: "#E95055", points: [[58.571099,97.380039],[59.412172,97.288905],[64.423301,92.453934],[70.3879,88.527186],[74.757754,89.282307],[79.313075,84.685744],[82.634419,77.379182],[83.351334,70.094385],[83.099194,63.969159],[77.931186,62.692491],[65.937578,60.38381],[63.81024,60.569914],[58.571099,97.380039]] },
] as const;

export function SpotsMap({presentation,isAuthenticated=false}:{presentation?:MapPresentation;isAuthenticated?:boolean}) {
    const mapDistricts=presentation?.districts??fallbackDistricts.map(d=>({...d,points:(districtBoundaries.find(b=>b.name===d.name)?.points??[]).map(([x,y])=>[x,y] as [number,number])}));
    const spots=presentation?.spots??fallbackSpots;
    const coordinateBounds=presentation?.bounds??sanVanBounds;
    const [activeId, setActiveId] = useState("stalefish");
    const [filter, setFilter] = useState<Category | "all">("all");
    const [query, setQuery] = useState("");
    const [saved, setSaved] = useState<string[]>(["stalefish"]);
    const [rating, setRating] = useState(0);
    const [ratingGate,setRatingGate]=useState(false);
    const [contributeGate,setContributeGate]=useState(false);
    const [addMode, setAddMode] = useState(false);
    const [isFullscreen,setIsFullscreen]=useState(false);
    const [pendingPosition,setPendingPosition]=useState<[number,number]|null>(null);
    const [mapMenuOpen, setMapMenuOpen] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const mapNode = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<LeafletMapInstance | null>(null);
    const mapBounds = useRef<LeafletBounds | null>(null);
    const spotMarkers = useRef<LeafletMarker[]>([]);
    const districtMarkers = useRef<LeafletMarker[]>([]);
    const districtPolygons = useRef<LeafletLayer[]>([]);
    const pendingMarker=useRef<LeafletMarker|null>(null);
    const active = spots.find((spot) => spot.id === activeId) ?? null;

    const visible = useMemo(() => spots.filter((spot) => (filter === "all" || spot.category === filter) && `${spot.name} ${spot.district}`.toLowerCase().includes(query.toLowerCase())), [filter, query, spots]);

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

    useEffect(()=>{const timer=setTimeout(()=>mapInstance.current?.invalidateSize(),50);return()=>clearTimeout(timer)},[isFullscreen]);

    useEffect(()=>{
        const map=mapInstance.current,L=window.L;
        if(!mapReady||!map||!L||!addMode||!isAuthenticated||pendingPosition)return;
        const handle=(event:{latlng:LeafletPoint})=>{const [[minLat,minLng],[maxLat,maxLng]]=coordinateBounds;const point:[number,number]=[Math.round((event.latlng.lng-minLng)/(maxLng-minLng)*1000)/10,Math.round((maxLat-event.latlng.lat)/(maxLat-minLat)*1000)/10];setPendingPosition(point);pendingMarker.current=L.marker([event.latlng.lat,event.latlng.lng],{interactive:false,icon:L.divIcon({className:"drop-pin-icon",iconSize:[42,50],iconAnchor:[21,46],html:'<span class="drop-pin"><span></span></span>'})}).addTo(map)};
        map.on("click",handle);return()=>map.off("click",handle);
    },[addMode,coordinateBounds,isAuthenticated,mapReady,pendingPosition]);

    const cancelAdd=()=>{pendingMarker.current?.remove();pendingMarker.current=null;setPendingPosition(null);setAddMode(false)};

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
    const submitRating=async(value:number)=>{if(!isAuthenticated){setRatingGate(true);return}if(!active?.persisted)return;setRating(value);await rateSpot(active.id,value)};

    return (
        <main className={styles.page}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setMapReady(true)} />
            <header className={styles.hero}>
                <div><span className={styles.eyebrow}><MapPin /> Community map</span><h1>Find your next <em>spot.</em></h1><p>Discover the places San Van skates. Save your favourites, share a hidden gem and see where the community keeps coming back to.</p></div>
                <button className={styles.addButton} onClick={() => {setActiveId("");setAddMode(true)}}><Plus /> Add a spot</button>
            </header>

            <section className={`${styles.mapShell} ${isFullscreen?styles.fullscreen:""}`}>
                <div className={styles.toolbar}>
                    <div className={styles.mapPicker}>
                        <button className={styles.mapPickerButton} aria-expanded={mapMenuOpen} onClick={() => setMapMenuOpen((open) => !open)}><span><small>Map</small>{presentation?.name??"San Vansterdam"}</span><ChevronDown /></button>
                        {mapMenuOpen && <div className={styles.mapMenu}><button className={styles.currentMap}><span>SV</span><div><strong>San Vansterdam</strong><small>Downtown districts</small></div><i>Active</i></button><button disabled><span>IG</span><div><strong>Isle of Grom</strong><small>Coming soon</small></div></button><button disabled><span>ST</span><div><strong>Stadium</strong><small>Coming soon</small></div></button></div>}
                    </div>
                    <label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spots or districts" /></label>
                    <div className={styles.filters}>
                        {(["all", "popular", "city-echo", "community"] as const).map((item) => <button key={item} data-category={item} className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)}>{item === "popular" && <Star />}{item === "city-echo" && <MapPin />}{item === "community" && <Users />}{item === "all" ? "All spots" : labels[item]}{item === "all" && <span>{spots.length}</span>}</button>)}
                    </div>
                    <button className={styles.fullscreenButton} onClick={()=>setIsFullscreen(value=>!value)}>{isFullscreen?<Minimize2/>:<Maximize2/>}{isFullscreen?"Exit full screen":"Full screen"}</button>
                </div>

                <div className={styles.map} aria-label="Map of community skate spots">
                    <div ref={mapNode} className={styles.leafletMap} />
                    <div className={styles.mapTint} />
                    <div className={styles.mapControls}><button aria-label="Zoom in" onClick={() => mapInstance.current?.zoomIn()}><ZoomIn /></button><button aria-label="Zoom out" onClick={() => mapInstance.current?.zoomOut()}><ZoomOut /></button><button aria-label="Reset map view" onClick={() => { if (mapInstance.current && mapBounds.current) mapInstance.current.fitBounds(mapBounds.current); }}><LocateFixed /></button></div>
                    <div className={styles.legend}><span className={styles.popularKey}><Star /> Popular</span><span className={styles.echoKey}><MapPin /> Real-World Inspired</span><span className={styles.communityKey}><Users /> Community</span></div>
                    {addMode&&isAuthenticated&&!pendingPosition&&<div className={styles.dropInstruction}><MapPin/><span><strong>Drop your pin</strong><small>Click the exact spot on the map</small></span><button onClick={cancelAdd}><X/></button></div>}
                    {visible.length === 0 && <div className={styles.noResults}>No spots found. Try another search.</div>}
                </div>

                {active && <aside className={styles.drawer} aria-label={`${active.name} details`}>
                    {active.media?.[0]?<div className={styles.mediaHero}>{active.media[0].type==="video"?<video controls preload="metadata" src={active.media[0].url}/>:<img src={active.media[0].url} alt={active.media[0].caption??active.name}/>}<span>{active.district}</span><button aria-label="Close spot details" onClick={() => setActiveId("")}><X /></button></div>:<div className={`${styles.photo} ${styles[active.palette]}`}><div className={styles.photoNoise} /><span>{active.district}</span><button aria-label="Close spot details" onClick={() => setActiveId("")}><X /></button><div className={styles.photoCaption}>No community media yet</div></div>}
                    <div className={styles.drawerBody}>
                        <div className={styles.spotMeta}><span>{labels[active.category]}</span><span>•</span><span>{active.district}</span></div>
                        <h2>{active.name}</h2>
                        <div className={styles.stats}><strong><Star /> {active.rating}</strong><span>{active.ratings} ratings</span><span><Heart /> {active.favourites} favourites</span></div>
                        <div className={styles.tags}>{active.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                        <p className={styles.description}>{active.description}</p>
                        {Boolean(active.media?.length)&&<section className={styles.mediaGrid}>{active.media!.slice(1).map(item=><figure key={item.id}>{item.type==="video"?<video controls preload="metadata" src={item.url}/>:<img src={item.url} alt={item.caption??`${active.name} community upload`}/>} {item.caption&&<figcaption>{item.caption}</figcaption>}</figure>)}</section>}
                        <div className={styles.actions}><button className={saved.includes(active.id) ? styles.saved : ""} onClick={() => toggleSaved(active.id)}><Bookmark />{saved.includes(active.id) ? "Saved" : "Favourite"}</button><button><Share2 /> Share</button></div>
                        <section className={styles.rate}><div><strong>Rate this spot</strong><span>{rating ? `You gave it ${rating} stars` : isAuthenticated?"How was your session?":"Sign in to leave a rating"}</span></div><div>{[1,2,3,4,5].map((value) => <button key={value} aria-label={`Rate ${value} stars`} onClick={() => submitRating(value)} className={value <= rating ? styles.rated : ""}><Star /></button>)}</div></section>
                        <section className={styles.discussion}><header><strong><MessageCircle /> Spot talk</strong><span>{active.comments?.length??0} comments</span></header>{active.comments?.length?active.comments.map(comment=><blockquote key={comment.id}>“{comment.body}”<footer><span>S</span><div><strong>Community skater</strong><small><Clock3 /> {new Date(comment.createdAt).toLocaleDateString()}</small></div></footer></blockquote>):<p className={styles.emptyTalk}>No comments yet. Start the spot talk.</p>}{active.persisted&&(isAuthenticated?<><form action={addSpotComment} className={styles.commentForm}><input type="hidden" name="spot_id" value={active.id}/><textarea name="body" required maxLength={2000} placeholder="Share a line, tip or session update…"/><button type="submit">Post comment</button></form><form action={uploadSpotMedia} className={styles.uploadForm}><input type="hidden" name="spot_id" value={active.id}/><label>Add a photo or video<input type="file" name="media" required accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"/></label><input name="caption" maxLength={240} placeholder="Optional caption"/><button type="submit">Submit media for review</button></form></>:<button className={styles.reply} onClick={()=>setContributeGate(true)}>Sign in to contribute</button>)}</section>
                    </div>
                </aside>}
            </section>

            {addMode&&!isAuthenticated&&<div className={styles.modalBackdrop} onMouseDown={cancelAdd}><section className={styles.modal} onMouseDown={event=>event.stopPropagation()}><button className={styles.modalClose} onClick={cancelAdd}><X/></button><AccountBenefitsPrompt title="Sign in to add a spot." description="Community pins belong to players, so you’ll need a free account before sharing one."/></section></div>}
            {ratingGate&&<div className={styles.modalBackdrop} onMouseDown={()=>setRatingGate(false)}><section className={styles.modal} onMouseDown={event=>event.stopPropagation()}><button className={styles.modalClose} onClick={()=>setRatingGate(false)}><X/></button><AccountBenefitsPrompt title="Sign in to review spots." description="Ratings come from identifiable community accounts so every player gets one fair vote per spot."/></section></div>}
            {contributeGate&&<div className={styles.modalBackdrop} onMouseDown={()=>setContributeGate(false)}><section className={styles.modal} onMouseDown={event=>event.stopPropagation()}><button className={styles.modalClose} onClick={()=>setContributeGate(false)}><X/></button><AccountBenefitsPrompt title="Sign in to join spot talk." description="Create a free account to add comments, photos and session videos to this spot."/></section></div>}
            {addMode&&isAuthenticated&&pendingPosition&&<div className={styles.modalBackdrop}><form action={createCommunitySpot} className={styles.modal} onSubmit={()=>cancelAdd()}><button type="button" className={styles.modalClose} onClick={cancelAdd}><X/></button><span className={styles.eyebrow}><Users/> New community spot</span><h2>Tell us about it.</h2><p>Your pin is set at {pendingPosition[0].toFixed(1)}, {pendingPosition[1].toFixed(1)}. Only Studio editors can create Real-World Inspired spots.</p><input type="hidden" name="map_id" value={presentation?.id??"00000000-0000-4000-8000-000000000001"}/><input type="hidden" name="position" value={JSON.stringify(pendingPosition)}/><label>Spot name<input name="name" autoFocus required placeholder="e.g. The library ledges"/></label><label>What makes it worth a session?<textarea name="description" required placeholder="Describe the obstacles, flow and best lines…"/></label><button className={styles.submitButton} type="submit"><Plus/>Submit community spot</button></form></div>}
        </main>
    );
}
