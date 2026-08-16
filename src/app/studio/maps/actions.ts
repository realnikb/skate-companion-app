"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioUser } from "@/lib/studio/auth";
import type { Json } from "@/types/database";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const json = (data: FormData, key: string, fallback: Json): Json => { try { return JSON.parse(text(data,key)) as Json; } catch { return fallback; } };

export async function createMap(data: FormData) {
    const { supabase } = await requireStudioUser();
    const name=text(data,"name"), slug=text(data,"slug"), assetRoot=text(data,"asset_root");
    if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !assetRoot.startsWith("/")) throw new Error("Enter a name, valid slug and public asset root.");
    const { data: created, error } = await supabase.from("skate_maps").insert({ name,slug,asset_root:assetRoot,description:text(data,"description")||null,is_published:false }).select("id").single();
    if (error) throw new Error(error.message);
    redirect(`/studio/maps/${created.id}`);
}

export async function saveMap(mapId: string, data: FormData) {
    const { supabase } = await requireStudioUser();
    const districts = json(data,"districts",[]) as Array<{id?:string;slug:string;name:string;colour:string;icon_path:string|null;marker_position:Json;polygon:Json;sort_order:number}>;
    const { error } = await supabase.from("skate_maps").update({ name:text(data,"name"),slug:text(data,"slug"),description:text(data,"description")||null,asset_root:text(data,"asset_root"),is_published:text(data,"is_published")==="true",updated_at:new Date().toISOString() }).eq("id",mapId);
    if (error) throw new Error(error.message);
    const retainedIds=districts.flatMap(district=>district.id?[district.id]:[]);
    const existing=await supabase.from("map_districts").select("id").eq("map_id",mapId);
    const removed=(existing.data??[]).map(row=>row.id).filter(id=>!retainedIds.includes(id));
    if(removed.length){const deleted=await supabase.from("map_districts").delete().in("id",removed);if(deleted.error)throw new Error(deleted.error.message);}
    for (const district of districts) {
        const payload={map_id:mapId,slug:district.slug,name:district.name,colour:district.colour,icon_path:district.icon_path,marker_position:district.marker_position,polygon:district.polygon,sort_order:district.sort_order,updated_at:new Date().toISOString()};
        const result=district.id ? await supabase.from("map_districts").update(payload).eq("id",district.id) : await supabase.from("map_districts").insert(payload);
        if(result.error) throw new Error(result.error.message);
    }
    revalidatePath("/studio/maps"); revalidatePath(`/studio/maps/${mapId}`); revalidatePath("/spots");
}
