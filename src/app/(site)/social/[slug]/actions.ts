"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CrewBrandState = { status: "idle" | "success" | "error"; message?: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function updateCrewBrand(_state: CrewBrandState, data: FormData): Promise<CrewBrandState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;
  if (!userId) return { status: "error", message: "Sign in to edit this crew." };
  const crewId = value(data, "crew_id"), slug = value(data, "slug"), primaryColor = value(data, "primary_color").toUpperCase(), banner = data.get("banner");
  if (!/^#[0-9A-F]{6}$/.test(primaryColor)) return { status: "error", message: "Choose a valid primary colour." };
  const { data: crew } = await supabase.from("crews").select("owner_id,banner_path").eq("id", crewId).maybeSingle();
  if (!crew || crew.owner_id !== userId) return { status: "error", message: "Only the crew owner can change its branding." };
  let bannerPath = crew.banner_path;
  let uploadedPath: string | null = null;
  if (banner instanceof File && banner.size) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(banner.type) || banner.size > 10 * 1024 * 1024) return { status: "error", message: "Use a JPG, PNG or WebP banner up to 10 MB." };
    const extension = banner.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    uploadedPath = `${userId}/banners/${crypto.randomUUID()}.${extension}`;
    const uploaded = await supabase.storage.from("crew-media").upload(uploadedPath, banner, { contentType: banner.type, upsert: false });
    if (uploaded.error) return { status: "error", message: uploaded.error.message };
    bannerPath = uploadedPath;
  }
  const saved = await supabase.from("crews").update({ primary_color: primaryColor, banner_path: bannerPath }).eq("id", crewId);
  if (saved.error) {
    if (uploadedPath) await supabase.storage.from("crew-media").remove([uploadedPath]);
    return { status: "error", message: saved.error.message };
  }
  if (uploadedPath && crew.banner_path) await supabase.storage.from("crew-media").remove([crew.banner_path]);
  revalidatePath(`/social/${slug}`); revalidatePath("/social"); revalidatePath("/account");
  return { status: "success", message: "Crew branding updated." };
}
