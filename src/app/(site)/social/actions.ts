"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PostState = { status: "idle" | "error" | "success"; message?: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

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
  const image = data.get("image");

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

  let imagePath: string | null = null;
  if (image instanceof File && image.size) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type) || image.size > 10 * 1024 * 1024) return { status: "error", message: "Use a JPG, PNG, WebP or GIF up to 10 MB." };
    const extension = image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const uploaded = await supabase.storage.from("social-media").upload(imagePath, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
    if (uploaded.error) return { status: "error", message: uploaded.error.message };
  }

  const crewId = identity.startsWith("crew:") ? identity.slice(5) : null;
  const inserted = await supabase.from("social_posts").insert({ author_id: userId, crew_id: crewId, body, post_type: postType, image_path: imagePath, external_video_url: externalVideo, location, session_at: sessionRaw ? new Date(sessionRaw).toISOString() : null, map_id: mapId, map_position: mapPosition, is_published: true }).select("id").single();
  if (inserted.error) {
    if (imagePath) await supabase.storage.from("social-media").remove([imagePath]);
    return { status: "error", message: inserted.error.message };
  }
  const tagWrites = await Promise.all([
    taggedUserIds.length ? supabase.from("social_post_user_tags").insert(taggedUserIds.map((taggedUserId) => ({ post_id: inserted.data.id, user_id: taggedUserId }))) : Promise.resolve({ error: null }),
    taggedCrewIds.length ? supabase.from("social_post_crew_tags").insert(taggedCrewIds.map((taggedCrewId) => ({ post_id: inserted.data.id, crew_id: taggedCrewId }))) : Promise.resolve({ error: null }),
  ]);
  const tagError = tagWrites.find((result) => result.error)?.error;
  if (tagError) {
    await supabase.from("social_posts").delete().eq("id", inserted.data.id);
    if (imagePath) await supabase.storage.from("social-media").remove([imagePath]);
    return { status: "error", message: tagError.message };
  }
  revalidatePath("/social");
  return { status: "success", message: "Posted." };
}
