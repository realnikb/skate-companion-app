"use client";

import { useEffect,useState } from "react";
import { MapPin,X } from "lucide-react";
import { Drawer,DrawerClose,DrawerContent,DrawerDescription,DrawerHeader,DrawerTitle,DrawerTrigger } from "@/components/ui/drawer";
import type { SocialPost } from "@/lib/social/get-posts";
import { skateboardMarkerHtml } from "@/components/maps/leaflet-map-theme";
import mapTheme from "@/components/maps/leaflet-map-theme.module.scss";
import { cn } from "@/lib/utils";
import styles from "./social.module.scss";

export function PostMapDrawer({pin}:{pin:NonNullable<SocialPost["mapPin"]>}){
  const [open,setOpen]=useState(false),[mapNode,setMapNode]=useState<HTMLDivElement|null>(null);
  useEffect(()=>{
    if(!open||!mapNode)return;
    let disposed=false,cleanup=()=>{};
    void import("leaflet").then(L=>{
      if(disposed)return;
      const bounds=L.latLngBounds(pin.bounds),map=L.map(mapNode,{crs:L.CRS.Simple,zoomControl:true,attributionControl:false,minZoom:pin.minZoom,maxZoom:pin.maxZoom,maxBounds:bounds,maxBoundsViscosity:1});
      L.tileLayer(`${pin.assetRoot}/${pin.tileUrl}`,{tileSize:256,minZoom:pin.minZoom,maxZoom:pin.maxZoom,maxNativeZoom:pin.maxZoom,noWrap:true,bounds}).addTo(map);
      const [[minLat,minLng],[maxLat,maxLng]]=pin.bounds,point:L.LatLngTuple=[maxLat-(pin.y/100)*(maxLat-minLat),minLng+(pin.x/100)*(maxLng-minLng)];
      L.marker(point,{icon:L.divIcon({className:"skate-map-marker",iconSize:[46,46],iconAnchor:[23,42],html:skateboardMarkerHtml})}).addTo(map);
      map.fitBounds(bounds,{animate:false});
      const resize=()=>{map.invalidateSize();map.setView(point,Math.max(pin.minZoom,Math.min(pin.maxZoom,4)),{animate:false})};
      const timers=[window.setTimeout(resize,50),window.setTimeout(resize,500)];
      const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(mapNode);
      cleanup=()=>{timers.forEach(window.clearTimeout);observer.disconnect();map.remove()};
    });
    return()=>{disposed=true;cleanup()};
  },[open,pin,mapNode]);
  return <Drawer open={open} onOpenChange={setOpen} showSwipeHandle><DrawerTrigger className={styles.locationButton} onClick={event=>event.stopPropagation()}><MapPin/>Pinned on {pin.mapName}</DrawerTrigger><DrawerContent className={styles.mapDrawer}><DrawerHeader><div><DrawerTitle>{pin.mapName}</DrawerTitle><DrawerDescription>The exact location pinned to this post.</DrawerDescription></div><DrawerClose aria-label="Close map"><X/></DrawerClose></DrawerHeader><div ref={setMapNode} className={cn(styles.postMapCanvas,mapTheme.canvas)}/></DrawerContent></Drawer>;
}
