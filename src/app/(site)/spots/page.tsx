import type { Metadata } from "next";

import { SpotsMap, type MapPresentation } from "@/components/spots/spots-map";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const metadata: Metadata = {
    title: "Skate Spots | Skate Companion",
    description: "Find, save and share the best places to skate in San Vansterdam.",
};

const pair=(value:Json|null):[number,number]=>Array.isArray(value)&&value.length>=2?[Number(value[0]),Number(value[1])]:[50,50];
const polygon=(value:Json):[number,number][]=>Array.isArray(value)?value.filter(Array.isArray).map(point=>[Number(point[0]),Number(point[1])]):[];

export default async function SpotsPage() {
    let presentation:MapPresentation|undefined;
    let isAuthenticated=false;
    try{const supabase=await createClient();const [{data:map},{data:auth}]=await Promise.all([supabase.from("skate_maps").select("*").eq("is_published",true).order("created_at").limit(1).maybeSingle(),supabase.auth.getClaims()]);isAuthenticated=Boolean(auth?.claims);if(map){const {data:districts}=await supabase.from("map_districts").select("*").eq("map_id",map.id).order("sort_order");presentation={id:map.id,name:map.name,assetRoot:map.asset_root,tileUrl:map.tile_url,minZoom:map.min_zoom,maxZoom:map.max_zoom,bounds:map.bounds as [[number,number],[number,number]],districts:(districts??[]).map(d=>{const [x,y]=pair(d.marker_position);return{name:d.name,icon:d.icon_path??"",x,y,accent:d.colour,points:polygon(d.polygon)}})}}}catch{/* Static San Van fallback remains available before migration is applied. */}
    return <SpotsMap presentation={presentation} isAuthenticated={isAuthenticated}/>;
}
