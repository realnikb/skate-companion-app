export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            stick_paths: {
                Row: { id: string; slug: string; name: string; points: Json; created_at: string; updated_at: string };
                Insert: { id?: string; slug: string; name: string; points?: Json; created_at?: string; updated_at?: string };
                Update: { id?: string; slug?: string; name?: string; points?: Json; created_at?: string; updated_at?: string };
                Relationships: [];
            };
            studio_admins: {
                Row: {
                    user_id: string;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    created_at?: string;
                };
                Update: {
                    user_id?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
            trick_categories: {
                Row: {
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
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    description?: string | null;
                    page_eyebrow?: string | null;
                    page_heading?: string | null;
                    popular_heading?: string | null;
                    hero_image_path?: string | null;
                    accent_color?: string;
                    gradient_start_color?: string;
                    gradient_middle_color?: string;
                    gradient_end_color?: string;
                    parent_id?: string | null;
                    sort_order?: number;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    slug?: string;
                    name?: string;
                    description?: string | null;
                    page_eyebrow?: string | null;
                    page_heading?: string | null;
                    popular_heading?: string | null;
                    hero_image_path?: string | null;
                    accent_color?: string;
                    gradient_start_color?: string;
                    gradient_middle_color?: string;
                    gradient_end_color?: string;
                    parent_id?: string | null;
                    sort_order?: number;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            tricks: {
                Row: {
                    id: string;
                    category_id: string;
                    slug: string;
                    name: string;
                    description: string;
                    difficulty: "beginner" | "intermediate" | "advanced" | "expert" | null;
                    detected_description: string | null;
                    context: string | null;
                    aliases: string[];
                    controls: Json;
                    video_path: string;
                    guide_video_path: string | null;
                    poster_path: string | null;
                    original_poster_path: string | null;
                    controls_reference_path: string;
                    controls_clean_path: string;
                    source_frame_path: string | null;
                    source_start_seconds: number | null;
                    source_end_seconds: number | null;
                    ocr_confidence: number | null;
                    needs_name_review: boolean;
                    needs_control_review: boolean;
                    needs_description_review: boolean;
                    sort_order: number;
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                    last_edited_by: string | null;
                };
                Insert: {
                    id?: string;
                    category_id: string;
                    slug: string;
                    name: string;
                    description: string;
                    difficulty?: "beginner" | "intermediate" | "advanced" | "expert" | null;
                    detected_description?: string | null;
                    context?: string | null;
                    aliases?: string[];
                    controls?: Json;
                    video_path: string;
                    guide_video_path?: string | null;
                    poster_path?: string | null;
                    original_poster_path?: string | null;
                    controls_reference_path: string;
                    controls_clean_path: string;
                    source_frame_path?: string | null;
                    source_start_seconds?: number | null;
                    source_end_seconds?: number | null;
                    ocr_confidence?: number | null;
                    needs_name_review?: boolean;
                    needs_control_review?: boolean;
                    needs_description_review?: boolean;
                    sort_order?: number;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    last_edited_by?: string | null;
                };
                Update: {
                    id?: string;
                    category_id?: string;
                    slug?: string;
                    name?: string;
                    description?: string;
                    difficulty?: "beginner" | "intermediate" | "advanced" | "expert" | null;
                    detected_description?: string | null;
                    context?: string | null;
                    aliases?: string[];
                    controls?: Json;
                    video_path?: string;
                    guide_video_path?: string | null;
                    poster_path?: string | null;
                    original_poster_path?: string | null;
                    controls_reference_path?: string;
                    controls_clean_path?: string;
                    source_frame_path?: string | null;
                    source_start_seconds?: number | null;
                    source_end_seconds?: number | null;
                    ocr_confidence?: number | null;
                    needs_name_review?: boolean;
                    needs_control_review?: boolean;
                    needs_description_review?: boolean;
                    sort_order?: number;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    last_edited_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "tricks_category_id_fkey";
                        columns: ["category_id"];
                        isOneToOne: false;
                        referencedRelation: "trick_categories";
                        referencedColumns: ["id"];
                    },
                ];
            };
            trick_metrics: {
                Row: {
                    trick_id: string;
                    view_count: number;
                    favourite_count: number;
                    updated_at: string;
                };
                Insert: {
                    trick_id: string;
                    view_count?: number;
                    favourite_count?: number;
                    updated_at?: string;
                };
                Update: {
                    trick_id?: string;
                    view_count?: number;
                    favourite_count?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "trick_metrics_trick_id_fkey";
                        columns: ["trick_id"];
                        isOneToOne: true;
                        referencedRelation: "tricks";
                        referencedColumns: ["id"];
                    },
                ];
            };
        };
        Views: Record<string, never>;
        Functions: {
            is_studio_admin: {
                Args: Record<string, never>;
                Returns: boolean;
            };
            set_updated_at: {
                Args: Record<string, never>;
                Returns: unknown;
            };
            record_trick_view: {
                Args: { target_trick_id: string };
                Returns: undefined;
            };
            change_trick_favourite: {
                Args: { target_trick_id: string; amount: number };
                Returns: undefined;
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};
