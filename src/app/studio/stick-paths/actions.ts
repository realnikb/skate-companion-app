"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStudioUser } from "@/lib/studio/auth";
import { parseStickPoints } from "@/lib/tricks/stick-paths";
import type { Json } from "@/types/database";

export type StickPathActionState = { status: "idle" | "success" | "error"; message?: string };
const value = (formData: FormData, key: string) => { const item = formData.get(key); return typeof item === "string" ? item.trim() : ""; };

function fields(formData: FormData) {
    const name = value(formData, "name");
    if (!name) return null;
    try {
        const points = parseStickPoints(JSON.parse(value(formData, "points")));
        return points ? { name, points: points as unknown as Json } : null;
    } catch { return null; }
}

function slugify(name: string) {
    return name.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stick-path";
}

async function availableSlug(supabase: Awaited<ReturnType<typeof requireStudioUser>>["supabase"], name: string, excludeId?: string) {
    const base = slugify(name);
    const { data, error } = await supabase.from("stick_paths").select("id,slug").like("slug", `${base}%`);
    if (error) throw new Error(error.message);
    const used = new Set((data ?? []).filter((path) => path.id !== excludeId).map((path) => path.slug));
    if (!used.has(base)) return base;
    let suffix = 2;
    while (used.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

export async function createStickPath(_state: StickPathActionState, formData: FormData): Promise<StickPathActionState> {
    const input = fields(formData);
    if (!input) return { status: "error", message: "Enter a name and at least one valid path point." };
    const { supabase } = await requireStudioUser();
    let slug: string;
    try { slug = await availableSlug(supabase, input.name); } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Could not generate a unique slug." }; }
    const { data, error } = await supabase.from("stick_paths").insert({ ...input, slug }).select("id").single();
    if (error) return { status: "error", message: error.message };
    revalidatePath("/studio/stick-paths");
    if (value(formData, "intent") === "save-and-new") redirect("/studio/stick-paths/new");
    redirect(`/studio/stick-paths/${data.id}`);
}

export async function updateStickPath(_state: StickPathActionState, formData: FormData): Promise<StickPathActionState> {
    const id = value(formData, "id");
    const input = fields(formData);
    if (!id || !input) return { status: "error", message: "Enter a name and at least one valid path point." };
    const { supabase } = await requireStudioUser();
    let slug: string;
    try { slug = await availableSlug(supabase, input.name, id); } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Could not generate a unique slug." }; }
    const { error } = await supabase.from("stick_paths").update({ ...input, slug }).eq("id", id);
    if (error) return { status: "error", message: error.message };
    revalidatePath("/studio/stick-paths");
    revalidatePath(`/studio/stick-paths/${id}`);
    if (value(formData, "intent") === "save-and-new") redirect("/studio/stick-paths/new");
    return { status: "success", message: "Stick path saved." };
}
