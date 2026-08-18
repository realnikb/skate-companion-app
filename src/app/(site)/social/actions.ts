"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFootyPosts, getSocialPosts } from "@/lib/social/get-posts";

export type PostState = { status: "idle" | "error" | "success"; message?: string; postId?: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

const SOCIAL_FEED_PAGE_SIZE = 10;

export async function loadMoreSocialPosts(offset: number) {
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  const posts = await getSocialPosts(safeOffset, SOCIAL_FEED_PAGE_SIZE + 1);
  return { posts: posts.slice(0, SOCIAL_FEED_PAGE_SIZE), hasMore: posts.length > SOCIAL_FEED_PAGE_SIZE };
}

export async function loadMoreFootyPosts(offset:number){
  const safeOffset=Number.isInteger(offset)&&offset>=0?offset:0;
  const posts=await getFootyPosts(safeOffset,SOCIAL_FEED_PAGE_SIZE+1);
  return {posts:posts.slice(0,SOCIAL_FEED_PAGE_SIZE),hasMore:posts.length>SOCIAL_FEED_PAGE_SIZE};
}

export async function createSocialPost(_state: PostState, data: FormData): Promise<PostState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;
  if (!userId) return { status: "error", message: "Sign in to post." };

  const body = value(data, "body");
  const identity = value(data, "identity");
  const postType = value(data, "post_type") as "post" | "session" | "spot" | "video";
  const location = value(data, "location") || null;
  const externalVideo = value(data, "external_video_url") || null;
  const sessionRaw = value(data, "session_at");
  const mapId = value(data, "map_id") || null;
  const mapPositionRaw = value(data, "map_position");
  const taggedUserIds = [...new Set(data.getAll("tagged_user_ids").map(String))];
  const taggedCrewIds = [...new Set(data.getAll("tagged_crew_ids").map(String))];
  const media = data.get("media") ?? data.get("image");
  const directPaths = data.getAll("uploaded_media_path").map(String);
  const directTypes = data.getAll("uploaded_media_type").map(String) as ("image" | "video")[];
  const directMimes = data.getAll("uploaded_media_mime").map(String);
  const directSizes = data.getAll("uploaded_media_size").map(Number);

  if (!body || body.length > 2000) return { status: "error", message: "Write something up to 2,000 characters." };
  if (externalVideo && !externalVideo.startsWith("https://")) return { status: "error", message: "Video links must use HTTPS." };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (taggedUserIds.length > 20 || taggedCrewIds.length > 20 || [...taggedUserIds, ...taggedCrewIds].some((id) => !uuid.test(id))) return { status: "error", message: "You can tag up to 20 skaters and 20 crews." };

  let mapPosition: [number, number] | null = null;
  if (mapId || mapPositionRaw) {
    try {
      const parsed: unknown = JSON.parse(mapPositionRaw);
      if (!mapId || !Array.isArray(parsed) || parsed.length !== 2 || parsed.some((coordinate) => typeof coordinate !== "number" || !Number.isFinite(coordinate) || coordinate < 0 || coordinate > 100)) throw new Error();
      mapPosition = [parsed[0] as number, parsed[1] as number];
    } catch {
      return { status: "error", message: "Choose a valid point on a game map." };
    }
    const { data: publishedMap } = await supabase.from("skate_maps").select("id").eq("id", mapId).eq("is_published", true).maybeSingle();
    if (!publishedMap) return { status: "error", message: "That game map is no longer available." };
  }

  if(directPaths.length>10||directPaths.length!==directTypes.length||directPaths.length!==directMimes.length||directPaths.length!==directSizes.length||(directTypes.includes("video")&&directPaths.length>1))return {status:"error",message:"Choose up to 10 photos or one video."};
  let imagePath: string | null = directPaths[0]??null;
  let mediaType: "image" | "video" | null = directTypes[0]??null;
  for(let index=0;index<directPaths.length;index++) {
    const directPath=directPaths[index],directType=directTypes[index],directMime=directMimes[index],directSize=directSizes[index];
    const directLimit = directType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    const allowedMimes = directType === "video" ? ["video/mp4", "video/webm", "video/quicktime"] : ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!directPath.startsWith(`${userId}/social/`) || !["image", "video"].includes(directType) || !allowedMimes.includes(directMime) || !Number.isFinite(directSize) || directSize <= 0 || directSize > directLimit) return { status: "error", message: "The uploaded media details are invalid." };
    const folder = directPath.slice(0, directPath.lastIndexOf("/")), fileName = directPath.slice(directPath.lastIndexOf("/") + 1);
    const { data: stored } = await supabase.storage.from("social-media").list(folder, { search: fileName, limit: 2 });
    if (!stored?.some((object) => object.name === fileName)) return { status: "error", message: "We couldn't verify the uploaded media. Please try again." };
  }
  if (media instanceof File && media.size) {
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    mediaType = imageTypes.includes(media.type) ? "image" : videoTypes.includes(media.type) ? "video" : null;
    const limit = mediaType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!mediaType || media.size > limit) return { status: "error", message: "Use a JPG, PNG, WebP or GIF up to 10 MB, or an MP4, WebM or MOV up to 100 MB." };
    const extension = media.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (mediaType === "video" ? "mp4" : "webp");
    imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const uploaded = await supabase.storage.from("social-media").upload(imagePath, media, { contentType: media.type, cacheControl: "31536000", upsert: false });
    if (uploaded.error) return { status: "error", message: uploaded.error.message };
  }

  const crewId = identity.startsWith("crew:") ? identity.slice(5) : null;
  const inserted = await supabase.from("social_posts").insert({ author_id: userId, crew_id: crewId, body, post_type: mediaType === "video" ? "video" : postType, image_path: imagePath, media_type: mediaType, external_video_url: externalVideo, location, session_at: sessionRaw ? new Date(sessionRaw).toISOString() : null, map_id: mapId, map_position: mapPosition, is_published: true }).select("id").single();
  if (inserted.error) {
    if (directPaths.length) await supabase.storage.from("social-media").remove(directPaths);
    return { status: "error", message: inserted.error.message };
  }
  if(directPaths.length){const gallery=await supabase.from("social_post_media").insert(directPaths.map((storage_path,position)=>({post_id:inserted.data.id,storage_path,media_type:directTypes[position],position})));if(gallery.error){await supabase.from("social_posts").delete().eq("id",inserted.data.id);await supabase.storage.from("social-media").remove(directPaths);return {status:"error",message:gallery.error.message};}}
  const selfLike = await supabase.from("social_post_likes").insert({ post_id: inserted.data.id, user_id: userId });
  if (selfLike.error) {
    await supabase.from("social_posts").delete().eq("id", inserted.data.id);
    if (directPaths.length) await supabase.storage.from("social-media").remove(directPaths);
    return { status: "error", message: selfLike.error.message };
  }
  const tagWrites = await Promise.all([
    taggedUserIds.length ? supabase.from("social_post_user_tags").insert(taggedUserIds.map((taggedUserId) => ({ post_id: inserted.data.id, user_id: taggedUserId }))) : Promise.resolve({ error: null }),
    taggedCrewIds.length ? supabase.from("social_post_crew_tags").insert(taggedCrewIds.map((taggedCrewId) => ({ post_id: inserted.data.id, crew_id: taggedCrewId }))) : Promise.resolve({ error: null }),
  ]);
  const tagError = tagWrites.find((result) => result.error)?.error;
  if (tagError) {
    await supabase.from("social_posts").delete().eq("id", inserted.data.id);
    if (directPaths.length) await supabase.storage.from("social-media").remove(directPaths);
    return { status: "error", message: tagError.message };
  }
  revalidatePath("/social");
  return { status: "success", message: "Posted.", postId: inserted.data.id };
}

export async function toggleSocialPostLike(postId:string){
  const supabase=await createClient();const {data:auth}=await supabase.auth.getClaims();const userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
  if(!userId)return {ok:false,message:"Sign in to like posts."};
  const {data:existing}=await supabase.from("social_post_likes").select("post_id").eq("post_id",postId).eq("user_id",userId).maybeSingle();
  const result=existing?await supabase.from("social_post_likes").delete().eq("post_id",postId).eq("user_id",userId):await supabase.from("social_post_likes").insert({post_id:postId,user_id:userId});
  if(result.error)return {ok:false,message:result.error.message};
  revalidatePath("/social");return {ok:true,liked:!existing};
}

export async function addSocialPostComment(postId:string,body:string,media?:{path:string;type:"image"|"video";mimeType:string;size:number}){
  const supabase=await createClient();const {data:auth}=await supabase.auth.getClaims();const userId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
  if(!userId)return {ok:false,message:"Sign in to comment."};
  const clean=body.trim();if(!clean||clean.length>2000)return {ok:false,message:"Write a comment up to 2,000 characters."};
  if(media){const limit=media.type==="video"?100*1024*1024:10*1024*1024,allowed=media.type==="video"?["video/mp4","video/webm","video/quicktime"]:["image/jpeg","image/png","image/webp","image/gif"];if(!media.path.startsWith(`${userId}/social/`)||!allowed.includes(media.mimeType)||media.size<=0||media.size>limit)return {ok:false,message:"The reply attachment is invalid."};const folder=media.path.slice(0,media.path.lastIndexOf("/")),fileName=media.path.slice(media.path.lastIndexOf("/")+1),{data:stored}=await supabase.storage.from("social-media").list(folder,{search:fileName,limit:2});if(!stored?.some(object=>object.name===fileName))return {ok:false,message:"We couldn't verify the reply attachment."}}
  const {data,error}=await supabase.from("social_post_comments").insert({post_id:postId,user_id:userId,body:clean,media_path:media?.path??null,media_type:media?.type??null}).select("id,body,media_path,media_type,created_at").single();
  if(error)return {ok:false,message:error.message};
  const {data:profile}=await supabase.from("profiles").select("display_name,handle,avatar_path").eq("id",userId).maybeSingle();const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
  revalidatePath("/social");return {ok:true,comment:{id:data.id,body:data.body,createdAt:data.created_at,media:data.media_path&&data.media_type?{url:`${base}/storage/v1/object/public/social-media/${data.media_path}`,type:data.media_type}:undefined,author:{name:profile?.display_name??"Skater",handle:profile?.handle??"skater",avatarUrl:profile?.avatar_path&&base?`${base}/storage/v1/object/public/profile-media/${profile.avatar_path}`:undefined}}};
}
