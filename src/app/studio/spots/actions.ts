"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudioUser } from "@/lib/studio/auth";
const value = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();
export async function saveSpot(id: string, data: FormData) {
  const { supabase } = await requireStudioUser();
  const category = value(data, "category");
  if (!["community", "popular", "city-echo"].includes(category))
    throw new Error("Invalid category.");
  let position: unknown;
  try {
    position = JSON.parse(value(data, "position"));
  } catch {
    throw new Error("Invalid position.");
  }
  const { data: saved, error } = await supabase
    .from("map_spots")
    .update({
      map_id: value(data, "map_id"),
      district_id: value(data, "district_id") || null,
      name: value(data, "name"),
      slug: value(data, "slug"),
      description: value(data, "description"),
      category,
      position: position as [number, number],
      is_published: value(data, "is_published") === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,is_published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!saved)
    throw new Error(
      "The spot could not be updated. Refresh the page, sign in again, and confirm your account still has Studio access.",
    );
  revalidatePath(`/studio/spots/${id}`);
  revalidatePath("/studio/spots");
  revalidatePath("/spots");
  redirect(`/studio/spots/${id}`);
}
export async function deleteSpot(id: string) {
  const { supabase } = await requireStudioUser();
  const { error } = await supabase.from("map_spots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/studio/spots");
  revalidatePath("/spots");
  redirect("/studio/spots");
}
export async function setMediaPublished(
  mediaId: string,
  spotId: string,
  published: boolean,
) {
  const { supabase } = await requireStudioUser();
  const { error } = await supabase
    .from("spot_media")
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", mediaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/spots/${spotId}`);
  revalidatePath("/spots");
}
export async function setMediaCover(mediaId: string, spotId: string) {
  const { supabase } = await requireStudioUser();
  await supabase
    .from("spot_media")
    .update({ is_cover: false })
    .eq("spot_id", spotId);
  const { error } = await supabase
    .from("spot_media")
    .update({
      is_cover: true,
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/spots/${spotId}`);
  revalidatePath("/spots");
}
export async function deleteMedia(mediaId: string, spotId: string) {
  const { supabase } = await requireStudioUser();
  const { data } = await supabase
    .from("spot_media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();
  if (data)
    await supabase.storage.from("spot-media").remove([data.storage_path]);
  const { error } = await supabase
    .from("spot_media")
    .delete()
    .eq("id", mediaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/spots/${spotId}`);
  revalidatePath("/spots");
}
export async function deleteComment(commentId: string, spotId: string) {
  const { supabase } = await requireStudioUser();
  const { error } = await supabase
    .from("spot_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studio/spots/${spotId}`);
  revalidatePath("/spots");
}
