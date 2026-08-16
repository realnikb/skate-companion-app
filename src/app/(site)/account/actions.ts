"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDiscordInvitePreview, parseDiscordInviteCode } from "@/lib/discord/invite";

export type CreateCrewState={status:"idle"|"error"|"success";message?:string;slug?:string};
const field=(data:FormData,key:string)=>String(data.get(key)??"").trim();
export async function createCrew(_state:CreateCrewState,data:FormData):Promise<CreateCrewState>{
 const supabase=await createClient(),{data:auth}=await supabase.auth.getClaims(),userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
 if(!userId)return {status:"error",message:"Sign in to create a crew."};
 const displayName=field(data,"display_name"),handle=field(data,"handle").toLowerCase(),name=field(data,"name"),tagline=field(data,"tagline"),description=field(data,"description"),location=field(data,"location"),platform=field(data,"platform"),recruitment=field(data,"recruitment_status"),discordUrl=field(data,"discord_url");
 const styles=field(data,"styles").split(",").map(value=>value.trim()).filter(Boolean).slice(0,8),languages=data.getAll("languages").map(String).filter(code=>/^[a-z]{2}$/.test(code)).slice(0,12),logo=data.get("logo");
 if(!displayName||!name||!tagline||!description||!location||!handle.match(/^[a-z0-9_]{3,24}$/))return {status:"error",message:"Complete the required fields and use a profile handle with 3–24 letters, numbers or underscores."};
 if(!languages.length)return {status:"error",message:"Choose at least one language."};
 if(!(logo instanceof File)||!logo.size)return {status:"error",message:"Add your crew logo."};
 if(!["image/jpeg","image/png","image/webp"].includes(logo.type)||logo.size>5*1024*1024)return {status:"error",message:"Use a JPG, PNG or WebP logo up to 5 MB."};
 const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);if(slug.length<3)return {status:"error",message:"Choose a crew name with at least three letters or numbers."};
 const profile=await supabase.from("profiles").upsert({id:userId,handle,display_name:displayName},{onConflict:"id"});if(profile.error)return {status:"error",message:profile.error.message.includes("unique")?"That profile handle is already taken.":profile.error.message};
 const extension=logo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"")||"webp",logoPath=`${userId}/crews/${crypto.randomUUID()}.${extension}`;
 const upload=await supabase.storage.from("crew-media").upload(logoPath,logo,{contentType:logo.type,upsert:false});if(upload.error)return {status:"error",message:upload.error.message};
 const inserted=await supabase.from("crews").insert({owner_id:userId,slug,name,tagline,description,logo_path:logoPath,location,platform,styles,languages,recruitment_status:recruitment as "recruiting"|"invite-only"|"closed",recruitment_details:field(data,"recruitment_details")||null,is_published:true}).select("id").single();
 if(inserted.error){await supabase.storage.from("crew-media").remove([logoPath]);return {status:"error",message:inserted.error.message.includes("unique")?"A crew already uses that name.":inserted.error.message};}
 const crewId=inserted.data.id;await supabase.from("crew_members").insert({crew_id:crewId,user_id:userId,role:"owner"});
 const links=[["youtube",field(data,"youtube_url")],["tiktok",field(data,"tiktok_url")],["instagram",field(data,"instagram_url")],["website",field(data,"website_url")]].filter((entry):entry is [string,string]=>Boolean(entry[1]));
 if(links.length)await supabase.from("crew_links").insert(links.map(([platform,url],sort_order)=>({crew_id:crewId,platform,url,sort_order})));
 const inviteCode=parseDiscordInviteCode(discordUrl);if(discordUrl&&inviteCode){try{const discord=await getDiscordInvitePreview(inviteCode);await supabase.from("crew_links").insert({crew_id:crewId,platform:"discord",url:`https://discord.gg/${discord.inviteCode}`,sort_order:links.length});await supabase.from("crew_discord_integrations").insert({crew_id:crewId,invite_code:discord.inviteCode,guild_id:discord.guildId,guild_name:discord.guildName,guild_icon_url:discord.guildIconUrl,approximate_member_count:discord.memberCount,approximate_online_count:discord.onlineCount,last_synced_at:new Date().toISOString()});}catch{/* Crew creation succeeds even when Discord is temporarily unavailable. */}}
 revalidatePath("/crews");revalidatePath("/account");return {status:"success",slug};
}

export type ProfileState={status:"idle"|"success"|"error";message?:string};

export async function updateProfile(_state:ProfileState,data:FormData):Promise<ProfileState>{
 void _state;
 const supabase=await createClient(),{data:auth}=await supabase.auth.getClaims(),userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
 if(!userId)return {status:"error",message:"Your session expired. Sign in and try again."};
 const displayName=field(data,"display_name"),email=field(data,"email").toLowerCase(),currentEmail=typeof auth.claims.email==="string"?auth.claims.email.toLowerCase():"",controller=field(data,"preferred_controller"),stance=field(data,"stance");
 if(!displayName||displayName.length>50)return {status:"error",message:"Display name must be between 1 and 50 characters."};
 if(!email||email.length>254||!email.includes("@"))return {status:"error",message:"Enter a valid email address."};
 if(controller!=="xbox"&&controller!=="playstation")return {status:"error",message:"Choose a valid controller."};
 if(stance!=="regular"&&stance!=="goofy")return {status:"error",message:"Choose a valid stance."};
 const existing=await supabase.from("profiles").select("avatar_path").eq("id",userId).maybeSingle();
 if(existing.error)return {status:"error",message:"We couldn't load your profile. Try again."};
 let avatarPath=existing.data?.avatar_path??null;
 const avatar=data.get("avatar");
 if(avatar instanceof File&&avatar.size>0){
  if(!new Set(["image/jpeg","image/png","image/webp","image/gif"]).has(avatar.type)||avatar.size>5*1024*1024)return {status:"error",message:"Choose a JPG, PNG, WebP or GIF up to 5 MB."};
  const extension=avatar.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg",nextPath=`${userId}/avatar-${crypto.randomUUID()}.${extension}`;
  const uploaded=await supabase.storage.from("profile-media").upload(nextPath,avatar,{contentType:avatar.type,upsert:false});
  if(uploaded.error)return {status:"error",message:"We couldn't upload that picture. Try again."};
  avatarPath=nextPath;
 }
 const saved=await supabase.from("profiles").upsert({id:userId,handle:`skater_${userId.replaceAll("-","").slice(0,12)}`,display_name:displayName,avatar_path:avatarPath,preferred_controller:controller,stance},{onConflict:"id"});
 if(saved.error){if(avatarPath&&avatarPath!==existing.data?.avatar_path)await supabase.storage.from("profile-media").remove([avatarPath]);return {status:"error",message:"We couldn't save your profile. Try again."};}
 if(existing.data?.avatar_path&&avatarPath!==existing.data.avatar_path)await supabase.storage.from("profile-media").remove([existing.data.avatar_path]);
 const authChanges:{data:Record<string,string>;email?:string}={data:{display_name:displayName}};
 if(email!==currentEmail)authChanges.email=email;
 const authUpdate=await supabase.auth.updateUser(authChanges);
 if(authUpdate.error)return {status:"error",message:"Your profile was saved, but the email address could not be changed."};
 revalidatePath("/account");
 return {status:"success",message:email!==currentEmail?"Profile saved. Check both email inboxes to confirm your new address.":"Profile saved."};
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
