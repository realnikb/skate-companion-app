import type { Json } from "@/types/database";
import type { Trick, TrickCategory } from "@/types/trick";
import { normalizeTrickControls, parseTrickControls } from "@/lib/tricks/controls";
import { getTrickMediaUrl } from "@/lib/supabase/media";

type CategoryRow = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    page_eyebrow: string | null;
    page_heading: string | null;
    popular_heading: string | null;
    hero_image_path: string | null;
    accent_color: string;
    gradient_start_color: string;
    gradient_middle_color: string;
    gradient_end_color: string;
    parent_id: string | null;
    sort_order: number;
};

type TrickRow = {
    id: string;
    category_id: string;
    slug: string;
    name: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced" | "expert" | null;
    context: string | null;
    aliases: string[];
    controls: Json;
    video_path: string;
    guide_video_path: string | null;
    poster_path: string | null;
    original_poster_path: string | null;
    controls_reference_path: string;
    controls_clean_path: string;
    sort_order: number;
    trick_categories: {
        slug: string;
    } | null;
    trick_metrics?: {
        view_count: number;
        favourite_count: number;
    } | null;
};

function mapControls(value: Json) {
    const controls = parseTrickControls(value) ?? (Array.isArray(value) ? normalizeTrickControls(value) : null);
    if (!controls) throw new Error("Malformed trick controls returned from database.");
    return controls;
}

export function mapCategory(row: CategoryRow): TrickCategory {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description ?? undefined,
        pageEyebrow: row.page_eyebrow ?? undefined,
        pageHeading: row.page_heading ?? undefined,
        popularHeading: row.popular_heading ?? undefined,
        heroImageUrl: getTrickMediaUrl(row.hero_image_path),
        accentColor: row.accent_color,
        gradientStartColor: row.gradient_start_color,
        gradientMiddleColor: row.gradient_middle_color,
        gradientEndColor: row.gradient_end_color,
        parentId: row.parent_id ?? undefined,
        sortOrder: row.sort_order,
    };
}

export function mapTrick(row: TrickRow): Trick {
    if (!row.trick_categories) {
        throw new Error(`Published trick is missing its category relation: ${row.slug}`);
    }

    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.trick_categories.slug,
        categoryId: row.category_id,
        description: row.description,
        difficulty: row.difficulty ?? undefined,
        context: row.context ?? undefined,
        aliases: row.aliases,
        controls: mapControls(row.controls),
        videoUrl: getTrickMediaUrl(row.video_path),
        guideVideoUrl: getTrickMediaUrl(row.guide_video_path),
        posterUrl: getTrickMediaUrl(row.poster_path),
        originalPosterUrl: getTrickMediaUrl(row.original_poster_path),
        controlsImageUrl: getTrickMediaUrl(row.controls_clean_path)!,
        controlsReferenceUrl: getTrickMediaUrl(row.controls_reference_path)!,
        viewCount: row.trick_metrics?.view_count ?? 0,
        favouriteCount: row.trick_metrics?.favourite_count ?? 0,
        sortOrder: row.sort_order,
    };
}
