import { createClient } from "@/lib/supabase/server";
import { mapTrick } from "@/lib/tricks/mapper";
import type { Trick } from "@/types/trick";

export async function getTrick(slug: string): Promise<Trick> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tricks")
    .select(
      `
            id,
            category_id,
            slug,
            name,
            description,
            difficulty,
            context,
            aliases,
            controls,
            video_path,
            guide_video_path,
            poster_path,
            original_poster_path,
            controls_reference_path,
            controls_clean_path,
            sort_order,
            trick_categories!inner (
                slug
            )
        `,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("trick_categories.is_published", true)
    .single();

  if (error) {
    throw new Error(`Failed to load trick "${slug}": ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to load trick "${slug}": no data returned.`);
  }

  const { data: metric } = await supabase
    .from("trick_metrics")
    .select("view_count, favourite_count")
    .eq("trick_id", data.id)
    .maybeSingle();

  return mapTrick({ ...data, trick_metrics: metric ?? null });
}
