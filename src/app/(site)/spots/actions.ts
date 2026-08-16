"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const value=(data:FormData,key:string)=>String(data.get(key)??"").trim();
export async function createCommunitySpot(data:FormData){const supabase=await createClient();const {data:auth}=await supabase.auth.getClaims();const userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;if(!userId)throw new Error("Sign in to add a spot.");const name=value(data,"name"),description=value(data,"description"),mapId=value(data,"map_id"),raw=value(data,"position");let position:unknown;try{position=JSON.parse(raw)}catch{throw new Error("Drop a valid map pin first.")}if(!name||!description||!mapId||!Array.isArray(position)||position.length!==2)throw new Error("Name, description and pin are required.");const slug=`${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${Date.now().toString(36)}`;const {error}=await supabase.from("map_spots").insert({map_id:mapId,created_by:userId,slug,name,description,category:"community",position:position as [number,number],is_published:false});if(error)throw new Error(error.message);revalidatePath("/spots")}
