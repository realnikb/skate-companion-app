"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireStudioUser } from "@/lib/studio/auth";

export type CrewActionState = { status: "idle" | "error"; message?: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const nullable = (data: FormData, key: string) => value(data, key) || null;
const roles = new Set(["recruiting", "invite-only", "closed"]);

function fields(data: FormData) {
    const name = value(data, "name"), slug = value(data, "slug"), ownerId = value(data, "owner_id");
    const primaryColor = value(data, "primary_color").toUpperCase();
    const recruitmentStatus = value(data, "recruitment_status");
    if (!name || !ownerId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Name, owner and a valid lowercase slug are required.");
    if (!/^#[0-9A-F]{6}$/.test(primaryColor)) throw new Error("Choose a valid primary colour.");
    if (!roles.has(recruitmentStatus)) throw new Error("Choose a valid recruitment status.");
    return { owner_id: ownerId, name, slug, tagline: nullable(data, "tagline"), description: nullable(data, "description"), location: nullable(data, "location"), platform: nullable(data, "platform"), primary_color: primaryColor, styles: value(data, "styles").split(",").map(item => item.trim()).filter(Boolean).slice(0, 8), languages: value(data, "languages").split(",").map(item => item.trim().toLowerCase()).filter(item => /^[a-z]{2}$/.test(item)).slice(0, 12), recruitment_status: recruitmentStatus as "recruiting" | "invite-only" | "closed", recruitment_details: nullable(data, "recruitment_details"), is_published: value(data, "is_published") === "true" };
}

async function uploadImage(supabase: Awaited<ReturnType<typeof requireStudioUser>>["supabase"], userId: string, file: FormDataEntryValue | null, kind: string, limit: number) {
    if (!(file instanceof File) || !file.size) return null;
    if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(file.type) || file.size > limit) throw new Error(`Use a JPG, PNG, WebP or GIF under ${Math.round(limit / 1048576)} MB.`);
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const path = `${userId}/studio/${kind}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("crew-media").upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    return path;
}

export async function createCrew(_state: CrewActionState, data: FormData): Promise<CrewActionState> {
    try {
        const { supabase, user } = await requireStudioUser(), crewFields = fields(data);
        const logoPath = await uploadImage(supabase, user.id, data.get("logo"), "logo", 5 * 1048576);
        if (!logoPath) return { status: "error", message: "A crew logo is required." };
        const bannerPath = await uploadImage(supabase, user.id, data.get("banner"), "banner", 10 * 1048576);
        const { data: crew, error } = await supabase.from("crews").insert({ ...crewFields, logo_path: logoPath, banner_path: bannerPath }).select("id").single();
        if (error) { await supabase.storage.from("crew-media").remove([logoPath, ...(bannerPath ? [bannerPath] : [])]); return { status: "error", message: error.code === "23505" ? "That slug is already in use." : error.message }; }
        const member = await supabase.from("crew_members").insert({ crew_id: crew.id, user_id: crewFields.owner_id, role: "owner" });
        if (member.error) return { status: "error", message: `Crew created, but its owner could not be added: ${member.error.message}` };
        revalidatePath("/studio/crews"); revalidatePath("/social"); redirect(`/studio/crews/${crew.id}`);
    } catch (error) { unstable_rethrow(error); return { status: "error", message: error instanceof Error ? error.message : "The crew could not be created." }; }
}

export async function updateCrew(_state: CrewActionState, data: FormData): Promise<CrewActionState> {
    try {
        const id = value(data, "id"); if (!id) return { status: "error", message: "Crew ID is missing." };
        const { supabase, user } = await requireStudioUser(), crewFields = fields(data);
        const { data: existing } = await supabase.from("crews").select("owner_id,logo_path,banner_path,slug").eq("id", id).maybeSingle();
        if (!existing) return { status: "error", message: "Crew not found." };
        const newLogo = await uploadImage(supabase, user.id, data.get("logo"), "logo", 5 * 1048576);
        const newBanner = await uploadImage(supabase, user.id, data.get("banner"), "banner", 10 * 1048576);
        const { error } = await supabase.from("crews").update({ ...crewFields, logo_path: newLogo ?? existing.logo_path, banner_path: newBanner ?? existing.banner_path, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) return { status: "error", message: error.code === "23505" ? "That slug is already in use." : error.message };
        if (existing.owner_id !== crewFields.owner_id) {
            await supabase.from("crew_members").upsert({ crew_id: id, user_id: crewFields.owner_id, role: "owner" }, { onConflict: "crew_id,user_id" });
            await supabase.from("crew_members").update({ role: "member" }).eq("crew_id", id).eq("user_id", existing.owner_id);
        }
        const replaced = [newLogo ? existing.logo_path : null, newBanner ? existing.banner_path : null].filter((path): path is string => Boolean(path));
        if (replaced.length) await supabase.storage.from("crew-media").remove(replaced);
        revalidatePath(`/studio/crews/${id}`); revalidatePath("/studio/crews"); revalidatePath("/social"); revalidatePath(`/social/${existing.slug}`); revalidatePath(`/social/${crewFields.slug}`);
        redirect(`/studio/crews/${id}`);
    } catch (error) { unstable_rethrow(error); return { status: "error", message: error instanceof Error ? error.message : "The crew could not be saved." }; }
}

export async function deleteCrew(data: FormData) {
    const id = value(data, "id"), { supabase } = await requireStudioUser();
    const { data: crew } = await supabase.from("crews").select("logo_path,banner_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("crews").delete().eq("id", id); if (error) throw new Error(error.message);
    const paths = [crew?.logo_path, crew?.banner_path].filter((path): path is string => Boolean(path)); if (paths.length) await supabase.storage.from("crew-media").remove(paths);
    revalidatePath("/studio/crews"); revalidatePath("/social"); redirect("/studio/crews");
}
