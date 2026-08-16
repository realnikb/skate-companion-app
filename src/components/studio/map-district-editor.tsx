"use client";

import Script from "next/script";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./map-district-editor.module.scss";

export type DistrictDraft={id?:string;slug:string;name:string;colour:string;icon_path:string|null;marker_position:[number,number];polygon:[number,number][];sort_order:number};
type Point={lat:number;lng:number};
type Layer={addTo:(map:MapInstance)=>Layer;remove:()=>void};
type Marker={addTo:(map:MapInstance)=>Marker;remove:()=>void;on:(event:string,handler:(event:{target:{getLatLng:()=>Point}})=>void)=>Marker};
type MapInstance={fitBounds:(bounds:object)=>void;on:(event:string,handler:(event:{latlng:Point})=>void)=>void;off:(event:string)=>void;remove:()=>void};
type Leaflet={CRS:{Simple:object};latLngBounds:(bounds:[[number,number],[number,number]])=>object;map:(node:HTMLDivElement,options:Record<string,unknown>)=>MapInstance;tileLayer:(url:string,options:Record<string,unknown>)=>Layer;divIcon:(options:Record<string,unknown>)=>object;marker:(position:[number,number],options:Record<string,unknown>)=>Marker;polygon:(points:[number,number][],options:Record<string,unknown>)=>Layer};

const leaflet=()=> (window as unknown as {L?:Leaflet}).L;
const toLeaflet=([x,y]:[number,number],bounds:[[number,number],[number,number]]):[number,number]=>[bounds[1][0]+(bounds[0][0]-bounds[1][0])*y/100,bounds[0][1]+(bounds[1][1]-bounds[0][1])*x/100];
const toPercent=(point:Point,bounds:[[number,number],[number,number]]):[number,number]=>[Math.round((point.lng-bounds[0][1])/(bounds[1][1]-bounds[0][1])*1000)/10,Math.round((bounds[1][0]-point.lat)/(bounds[1][0]-bounds[0][0])*1000)/10];

export function MapDistrictEditor({initial,assetRoot,tileUrl="tiles/{z}/{x}/{y}.webp",bounds=[[-135,0],[0,240]],minZoom=0,maxZoom=5}:{initial:DistrictDraft[];assetRoot:string;tileUrl?:string;bounds?:[[number,number],[number,number]];minZoom?:number;maxZoom?:number}){
    const [items,setItems]=useState(initial),[selected,setSelected]=useState(0),[drawing,setDrawing]=useState(false),[ready,setReady]=useState(false);
    const mapNode=useRef<HTMLDivElement>(null),mapRef=useRef<MapInstance|null>(null),layers=useRef<Layer[]>([]),selectedRef=useRef(selected),drawingRef=useRef(drawing);
    const current=items[selected];
    const update=(patch:Partial<DistrictDraft>)=>setItems(all=>all.map((item,index)=>index===selectedRef.current?{...item,...patch}:item));

    useEffect(()=>{selectedRef.current=selected;drawingRef.current=drawing},[drawing,selected]);

    useEffect(()=>{const L=leaflet();if(!ready||!L||!mapNode.current||mapRef.current)return;const mapBounds=L.latLngBounds(bounds),map=L.map(mapNode.current,{crs:L.CRS.Simple,minZoom,maxZoom,zoomSnap:.25,maxBounds:mapBounds,maxBoundsViscosity:1});L.tileLayer(`${assetRoot}/${tileUrl}`,{tileSize:256,minZoom,maxZoom,maxNativeZoom:maxZoom,noWrap:true,bounds:mapBounds}).addTo(map);map.fitBounds(mapBounds);map.on("click",event=>{if(!drawingRef.current)return;const index=selectedRef.current,point=toPercent(event.latlng,bounds);setItems(all=>all.map((item,i)=>i===index?{...item,polygon:[...item.polygon,point]}:item))});mapRef.current=map;return()=>{map.remove();mapRef.current=null}},[assetRoot,bounds,maxZoom,minZoom,ready,tileUrl]);

    useEffect(()=>{const L=leaflet(),map=mapRef.current;if(!ready||!L||!map)return;layers.current.forEach(layer=>layer.remove());layers.current=[];items.forEach((district,index)=>{if(district.polygon.length>2)layers.current.push(L.polygon(district.polygon.map(point=>toLeaflet(point,bounds)),{color:district.colour,fillColor:district.colour,fillOpacity:.13,weight:index===selected?5:3,interactive:false}).addTo(map));const marker=L.marker(toLeaflet(district.marker_position,bounds),{draggable:true,icon:L.divIcon({className:"studio-district-icon",iconSize:[132,76],iconAnchor:[66,38],html:`<div class="studio-district-marker" style="--district:${district.colour}">${district.icon_path?`<img src="${district.icon_path}" alt="">`:""}<strong>${district.name}</strong></div>`})}).addTo(map).on("click",()=>setSelected(index)).on("dragend",event=>{const position=toPercent(event.target.getLatLng(),bounds);setItems(all=>all.map((item,i)=>i===index?{...item,marker_position:position}:item))});layers.current.push(marker)});return()=>{layers.current.forEach(layer=>layer.remove());layers.current=[]}},[bounds,items,ready,selected]);

    return <section className={styles.editor}><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={()=>setReady(true)}/><input type="hidden" name="districts" value={JSON.stringify(items)}/><div ref={mapNode} className={styles.leafletCanvas}/><aside><header><strong>Districts</strong><button type="button" onClick={()=>{setItems(all=>[...all,{slug:"new-district",name:"New district",colour:"#3d7eff",icon_path:null,marker_position:[50,50],polygon:[],sort_order:all.length*10}]);setSelected(items.length)}}><Plus/>Add</button></header>{items.map((district,index)=><button type="button" className={index===selected?styles.active:""} key={district.id??`${district.slug}-${index}`} onClick={()=>setSelected(index)}><i style={{background:district.colour}}/>{district.name}</button>)}{current&&<div className={styles.fields}><label>Name<input value={current.name} onChange={event=>update({name:event.target.value})}/></label><label>Slug<input value={current.slug} onChange={event=>update({slug:event.target.value})}/></label><label>Colour<input type="color" value={current.colour} onChange={event=>update({colour:event.target.value})}/></label><label>Icon path<input value={current.icon_path??""} onChange={event=>update({icon_path:event.target.value||null})}/></label><p>{drawing?"Click directly on the Leaflet map to add boundary vertices.":"Drag the district logo to reposition it."}</p><button type="button" className={drawing?styles.drawing:""} onClick={()=>{if(!drawing)update({polygon:[]});setDrawing(value=>!value)}}>{drawing?"Finish boundary":"Redraw boundary"}</button><button type="button" onClick={()=>update({polygon:[]})}><RotateCcw/>Clear points</button><button type="button" onClick={()=>{setItems(all=>all.filter((_,index)=>index!==selected));setSelected(0)}}><Trash2/>Remove</button></div>}</aside></section>;
}
