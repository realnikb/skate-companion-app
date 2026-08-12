import { createClient } from "@/lib/supabase/server";
import { mapCategory } from "@/lib/tricks/mapper";
import type { TrickCategory } from "@/types/trick";

export async function getCategories(): Promise<TrickCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("trick_categories")
        .select("id, slug, name, description, page_eyebrow, page_heading, popular_heading, hero_image_path, accent_color, gradient_start_color, gradient_middle_color, gradient_end_color, parent_id, sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        throw new Error(`Failed to load trick categories: ${error.message}`);
    }

    if (!data) {
        throw new Error("Failed to load trick categories: no data returned.");
    }

    return data.map(mapCategory);
}
