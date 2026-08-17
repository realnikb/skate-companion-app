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
 const displayName=field(data,"display_name"),handle=field(data,"handle"),name=field(data,"name"),tagline=field(data,"tagline"),description=field(data,"description"),location=field(data,"location"),platform=field(data,"platform"),recruitment=field(data,"recruitment_status"),discordUrl=field(data,"discord_url"),primaryColor=field(data,"primary_color").toUpperCase();
 const styles=field(data,"styles").split(",").map(value=>value.trim()).filter(Boolean).slice(0,8),languages=data.getAll("languages").map(String).filter(code=>/^[a-z]{2}$/.test(code)).slice(0,12),logo=data.get("logo"),banner=data.get("banner");
 if(!displayName||!name||!tagline||!description||!location||!handle.match(/^[A-Za-z0-9_]{3,24}$/))return {status:"error",message:"Complete the required fields and use a profile handle with 3–24 letters, numbers or underscores."};
 if(!/^#[0-9A-F]{6}$/.test(primaryColor))return {status:"error",message:"Choose a valid primary colour."};
 if(!languages.length)return {status:"error",message:"Choose at least one language."};
 if(!(logo instanceof File)||!logo.size)return {status:"error",message:"Add your crew logo."};
 if(!["image/jpeg","image/png","image/webp"].includes(logo.type)||logo.size>5*1024*1024)return {status:"error",message:"Use a JPG, PNG or WebP logo up to 5 MB."};
 if(banner instanceof File&&banner.size&&(!["image/jpeg","image/png","image/webp"].includes(banner.type)||banner.size>10*1024*1024))return {status:"error",message:"Use a JPG, PNG or WebP banner up to 10 MB."};
 const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);if(slug.length<3)return {status:"error",message:"Choose a crew name with at least three letters or numbers."};
 const profile=await supabase.from("profiles").upsert({id:userId,handle,display_name:displayName},{onConflict:"id"});if(profile.error)return {status:"error",message:profile.error.message.includes("unique")?"That profile handle is already taken.":profile.error.message};
 const extension=logo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"")||"webp",logoPath=`${userId}/social/${crypto.randomUUID()}.${extension}`;
 const upload=await supabase.storage.from("crew-media").upload(logoPath,logo,{contentType:logo.type,upsert:false});if(upload.error)return {status:"error",message:upload.error.message};
 let bannerPath:string|null=null;if(banner instanceof File&&banner.size){const bannerExtension=banner.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"")||"webp";bannerPath=`${userId}/banners/${crypto.randomUUID()}.${bannerExtension}`;const bannerUpload=await supabase.storage.from("crew-media").upload(bannerPath,banner,{contentType:banner.type,upsert:false});if(bannerUpload.error){await supabase.storage.from("crew-media").remove([logoPath]);return {status:"error",message:bannerUpload.error.message};}}
 const inserted=await supabase.from("crews").insert({owner_id:userId,slug,name,tagline,description,logo_path:logoPath,banner_path:bannerPath,primary_color:primaryColor,location,platform,styles,languages,recruitment_status:recruitment as "recruiting"|"invite-only"|"closed",recruitment_details:field(data,"recruitment_details")||null,is_published:true}).select("id").single();
 if(inserted.error){await supabase.storage.from("crew-media").remove([logoPath,...(bannerPath?[bannerPath]:[])]);return {status:"error",message:inserted.error.message.includes("unique")?"A crew already uses that name.":inserted.error.message};}
 const crewId=inserted.data.id;await supabase.from("crew_members").insert({crew_id:crewId,user_id:userId,role:"owner"});
 const links=[["youtube",field(data,"youtube_url")],["tiktok",field(data,"tiktok_url")],["instagram",field(data,"instagram_url")],["website",field(data,"website_url")]].filter((entry):entry is [string,string]=>Boolean(entry[1]));
 if(links.length)await supabase.from("crew_links").insert(links.map(([platform,url],sort_order)=>({crew_id:crewId,platform,url,sort_order})));
 const inviteCode=parseDiscordInviteCode(discordUrl);if(discordUrl&&inviteCode){try{const discord=await getDiscordInvitePreview(inviteCode);await supabase.from("crew_links").insert({crew_id:crewId,platform:"discord",url:`https://discord.gg/${discord.inviteCode}`,sort_order:links.length});await supabase.from("crew_discord_integrations").insert({crew_id:crewId,invite_code:discord.inviteCode,guild_id:discord.guildId,guild_name:discord.guildName,guild_icon_url:discord.guildIconUrl,approximate_member_count:discord.memberCount,approximate_online_count:discord.onlineCount,last_synced_at:new Date().toISOString()});}catch{/* Crew creation succeeds even when Discord is temporarily unavailable. */}}
 revalidatePath("/social");revalidatePath("/social/crews");revalidatePath("/account");return {status:"success",slug:`crew/${slug}`};
}

export async function updateOwnedCrew(_state:CreateCrewState,data:FormData):Promise<CreateCrewState>{
 const supabase=await createClient(),{data:auth}=await supabase.auth.getClaims(),userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
 if(!userId)return {status:"error",message:"Sign in to edit your crew."};
 const id=field(data,"id"),name=field(data,"name"),tagline=field(data,"tagline"),description=field(data,"description"),location=field(data,"location"),platform=field(data,"platform"),recruitment=field(data,"recruitment_status"),primaryColor=field(data,"primary_color").toUpperCase();
 const styles=field(data,"styles").split(",").map(value=>value.trim()).filter(Boolean).slice(0,8),languages=data.getAll("languages").map(String).filter(code=>/^[a-z]{2}$/.test(code)).slice(0,12);
 if(!id||!name||!tagline||!description||!location)return {status:"error",message:"Complete all required crew details."};
 if(!/^#[0-9A-F]{6}$/.test(primaryColor)||!languages.length||!["recruiting","invite-only","closed"].includes(recruitment))return {status:"error",message:"Choose a valid colour, language and recruitment status."};
 const {data:existing,error:loadError}=await supabase.from("crews").select("slug,logo_path,banner_path").eq("id",id).eq("owner_id",userId).maybeSingle();
 if(loadError||!existing)return {status:"error",message:"Crew not found or you no longer have permission to edit it."};
 const upload=async(file:FormDataEntryValue|null,kind:string,limit:number)=>{if(!(file instanceof File)||!file.size)return null;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>limit)throw new Error(`Use a JPG, PNG or WebP under ${Math.round(limit/1048576)} MB.`);const extension=file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"")||"webp",path=`${userId}/${kind}s/${crypto.randomUUID()}.${extension}`,result=await supabase.storage.from("crew-media").upload(path,file,{contentType:file.type});if(result.error)throw new Error(result.error.message);return path};
 try{
  const logoPath=await upload(data.get("logo"),"logo",5*1048576),bannerPath=await upload(data.get("banner"),"banner",10*1048576);
  const saved=await supabase.from("crews").update({name,tagline,description,location,platform,primary_color:primaryColor,styles,languages,recruitment_status:recruitment as "recruiting"|"invite-only"|"closed",recruitment_details:field(data,"recruitment_details")||null,logo_path:logoPath??existing.logo_path,banner_path:bannerPath??existing.banner_path,updated_at:new Date().toISOString()}).eq("id",id).eq("owner_id",userId);
  if(saved.error)return {status:"error",message:saved.error.message};
  const linkValues=[["youtube",field(data,"youtube_url")],["tiktok",field(data,"tiktok_url")],["instagram",field(data,"instagram_url")],["website",field(data,"website_url")],["discord",field(data,"discord_url")]].filter((entry):entry is [string,string]=>Boolean(entry[1]));
  const deleted=await supabase.from("crew_links").delete().eq("crew_id",id);if(deleted.error)return {status:"error",message:`Crew saved, but links could not be updated: ${deleted.error.message}`};
  if(linkValues.length){const links=await supabase.from("crew_links").insert(linkValues.map(([linkPlatform,url],sort_order)=>({crew_id:id,platform:linkPlatform,url,sort_order})));if(links.error)return {status:"error",message:`Crew saved, but links could not be updated: ${links.error.message}`};}
  const replaced=[logoPath?existing.logo_path:null,bannerPath?existing.banner_path:null].filter((path):path is string=>Boolean(path));if(replaced.length)await supabase.storage.from("crew-media").remove(replaced);
  revalidatePath("/account");revalidatePath(`/account/crews/${id}`);revalidatePath("/social");revalidatePath("/social/crews");revalidatePath(`/social/crew/${existing.slug}`);return {status:"success",message:"Crew saved.",slug:existing.slug};
 }catch(error){return {status:"error",message:error instanceof Error?error.message:"The crew could not be saved."};}
}

export type ProfileState={status:"idle"|"success"|"error";message?:string};

export async function updateProfile(_state:ProfileState,data:FormData):Promise<ProfileState>{
 void _state;
 const supabase=await createClient(),{data:auth}=await supabase.auth.getClaims(),userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
 if(!userId)return {status:"error",message:"Your session expired. Sign in and try again."};
 const displayName=field(data,"display_name"),handle=field(data,"handle"),email=field(data,"email").toLowerCase(),currentEmail=typeof auth?.claims?.email==="string"?auth.claims.email.toLowerCase():"",controller=field(data,"preferred_controller"),stance=field(data,"stance");
 const playstationGamertag=field(data,"playstation_gamertag"),xboxGamertag=field(data,"xbox_gamertag"),eaId=field(data,"ea_id"),steamGamertag=field(data,"steam_gamertag"),youtubeUrl=field(data,"youtube_url"),tiktokUrl=field(data,"tiktok_url"),instagramUrl=field(data,"instagram_url");
 if(!displayName||displayName.length>50)return {status:"error",message:"Display name must be between 1 and 50 characters."};
 if(!/^[A-Za-z0-9_]{3,24}$/.test(handle))return {status:"error",message:"Your profile tag must use 3–24 letters, numbers or underscores."};
 if(!email||email.length>254||!email.includes("@"))return {status:"error",message:"Enter a valid email address."};
 if(controller!=="xbox"&&controller!=="playstation")return {status:"error",message:"Choose a valid controller."};
 if(stance!=="regular"&&stance!=="goofy")return {status:"error",message:"Choose a valid stance."};
 if([playstationGamertag,xboxGamertag,eaId,steamGamertag].some(value=>value.length>64))return {status:"error",message:"Gaming IDs must be 64 characters or fewer."};
 if([youtubeUrl,tiktokUrl,instagramUrl].some(value=>value&&!/^https:\/\//i.test(value)))return {status:"error",message:"Social links must start with https://"};
 const existing=await supabase.from("profiles").select("avatar_path,handle").eq("id",userId).maybeSingle();
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
 const saved=await supabase.from("profiles").upsert({id:userId,handle,display_name:displayName,avatar_path:avatarPath,preferred_controller:controller,stance,playstation_gamertag:playstationGamertag||null,xbox_gamertag:xboxGamertag||null,ea_id:eaId||null,steam_gamertag:steamGamertag||null,youtube_url:youtubeUrl||null,tiktok_url:tiktokUrl||null,instagram_url:instagramUrl||null},{onConflict:"id"});
 if(saved.error){if(avatarPath&&avatarPath!==existing.data?.avatar_path)await supabase.storage.from("profile-media").remove([avatarPath]);return {status:"error",message:/unique|duplicate/i.test(saved.error.message)?"That profile tag is already taken.":"We couldn't save your profile. Try again."};}
 if(existing.data?.avatar_path&&avatarPath!==existing.data.avatar_path)await supabase.storage.from("profile-media").remove([existing.data.avatar_path]);
 const authChanges:{data:Record<string,string>;email?:string}={data:{display_name:displayName}};
 if(email!==currentEmail)authChanges.email=email;
 const authUpdate=await supabase.auth.updateUser(authChanges);
 if(authUpdate.error)return {status:"error",message:"Your profile was saved, but the email address could not be changed."};
 revalidatePath("/account");revalidatePath("/social");
 return {status:"success",message:email!==currentEmail?"Profile saved. Check both email inboxes to confirm your new address.":"Profile saved."};
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
