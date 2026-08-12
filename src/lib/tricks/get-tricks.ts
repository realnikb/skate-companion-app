import { createClient } from "@/lib/supabase/server";
import { mapTrick } from "@/lib/tricks/mapper";
import { matchesTrickSearch } from "@/lib/tricks/search";
import type { Trick } from "@/types/trick";

type GetTricksOptions = {
    categorySlug?: string;
    searchText?: string;
};

export async function getTricks(options: GetTricksOptions = {}): Promise<Trick[]> {
    const supabase = await createClient();

    let query = supabase
        .from("tricks")
        .select(`
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
        `)
        .eq("is_published", true)
        .eq("trick_categories.is_published", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (options.categorySlug) {
        const { data: selectedCategory } = await supabase.from("trick_categories").select("id").eq("slug", options.categorySlug).maybeSingle();
        const { data: children } = selectedCategory
            ? await supabase.from("trick_categories").select("id").eq("parent_id", selectedCategory.id).eq("is_published", true)
            : { data: [] };
        const categoryIds = [selectedCategory?.id, ...(children ?? []).map((category) => category.id)].filter((id): id is string => Boolean(id));
        if (categoryIds.length) query = query.in("category_id", categoryIds);
        else query = query.eq("trick_categories.slug", options.categorySlug);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to load tricks: ${error.message}`);
    }

    if (!data) {
        throw new Error("Failed to load tricks: no data returned.");
    }

    // Metrics are optional during rollout so an unapplied migration never takes
    // the whole trick library offline.
    const trickIds = data.map((row) => row.id);
    const { data: metrics } = trickIds.length
        ? await supabase
            .from("trick_metrics")
            .select("trick_id, view_count, favourite_count")
            .in("trick_id", trickIds)
        : { data: [] };
    const metricsByTrickId = new Map(
        (metrics ?? []).map((metric) => [metric.trick_id, metric]),
    );
    const mappedTricks = data.map((row) => mapTrick({
        ...row,
        trick_metrics: metricsByTrickId.get(row.id) ?? null,
    }));

    if (!options.searchText) {
        return mappedTricks;
    }

    return mappedTricks.filter((trick) => matchesTrickSearch(trick, options.searchText ?? ""));
}
