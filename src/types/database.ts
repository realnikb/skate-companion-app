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
            profiles: {
                Row:{id:string;handle:string;display_name:string;avatar_path:string|null;bio:string|null;preferred_controller:"xbox"|"playstation";stance:"regular"|"goofy";created_at:string;updated_at:string};
                Insert:{id:string;handle:string;display_name:string;avatar_path?:string|null;bio?:string|null;preferred_controller?:"xbox"|"playstation";stance?:"regular"|"goofy";created_at?:string;updated_at?:string};
                Update:{id?:string;handle?:string;display_name?:string;avatar_path?:string|null;bio?:string|null;preferred_controller?:"xbox"|"playstation";stance?:"regular"|"goofy";created_at?:string;updated_at?:string};Relationships:[];
            };
            crews: {
                Row:{id:string;owner_id:string;slug:string;name:string;tagline:string|null;description:string|null;logo_path:string;banner_path:string|null;location:string|null;platform:string|null;styles:string[];languages:string[];recruitment_status:"recruiting"|"invite-only"|"closed";recruitment_details:string|null;is_published:boolean;created_at:string;updated_at:string};
                Insert:{id?:string;owner_id:string;slug:string;name:string;tagline?:string|null;description?:string|null;logo_path:string;banner_path?:string|null;location?:string|null;platform?:string|null;styles?:string[];languages?:string[];recruitment_status?:"recruiting"|"invite-only"|"closed";recruitment_details?:string|null;is_published?:boolean;created_at?:string;updated_at?:string};
                Update:{id?:string;owner_id?:string;slug?:string;name?:string;tagline?:string|null;description?:string|null;logo_path?:string;banner_path?:string|null;location?:string|null;platform?:string|null;styles?:string[];languages?:string[];recruitment_status?:"recruiting"|"invite-only"|"closed";recruitment_details?:string|null;is_published?:boolean;created_at?:string;updated_at?:string};Relationships:[];
            };
            crew_members:{Row:{crew_id:string;user_id:string;role:"owner"|"co-owner"|"captain"|"recruiter"|"filmer"|"member"|"prospect";joined_at:string};Insert:{crew_id:string;user_id:string;role?:"owner"|"co-owner"|"captain"|"recruiter"|"filmer"|"member"|"prospect";joined_at?:string};Update:{crew_id?:string;user_id?:string;role?:"owner"|"co-owner"|"captain"|"recruiter"|"filmer"|"member"|"prospect";joined_at?:string};Relationships:[]};
            crew_links:{Row:{id:string;crew_id:string;platform:string;url:string;sort_order:number};Insert:{id?:string;crew_id:string;platform:string;url:string;sort_order?:number};Update:{id?:string;crew_id?:string;platform?:string;url?:string;sort_order?:number};Relationships:[]};
            crew_videos:{Row:{id:string;crew_id:string;created_by:string|null;title:string;description:string|null;video_url:string;thumbnail_path:string|null;video_type:string;is_published:boolean;published_at:string;created_at:string};Insert:{id?:string;crew_id:string;created_by?:string|null;title:string;description?:string|null;video_url:string;thumbnail_path?:string|null;video_type?:string;is_published?:boolean;published_at?:string;created_at?:string};Update:{id?:string;crew_id?:string;created_by?:string|null;title?:string;description?:string|null;video_url?:string;thumbnail_path?:string|null;video_type?:string;is_published?:boolean;published_at?:string;created_at?:string};Relationships:[]};
            crew_discord_integrations:{Row:{crew_id:string;invite_code:string;guild_id:string;guild_name:string;guild_icon_url:string|null;approximate_member_count:number;approximate_online_count:number;last_synced_at:string|null;created_at:string;updated_at:string};Insert:{crew_id:string;invite_code:string;guild_id:string;guild_name:string;guild_icon_url?:string|null;approximate_member_count?:number;approximate_online_count?:number;last_synced_at?:string|null;created_at?:string;updated_at?:string};Update:{crew_id?:string;invite_code?:string;guild_id?:string;guild_name?:string;guild_icon_url?:string|null;approximate_member_count?:number;approximate_online_count?:number;last_synced_at?:string|null;created_at?:string;updated_at?:string};Relationships:[]};
            skate_maps: {
                Row: { id:string; slug:string; name:string; description:string|null; asset_root:string; tile_url:string; tile_size:number; min_zoom:number; max_zoom:number; bounds:Json; is_published:boolean; created_at:string; updated_at:string };
                Insert: { id?:string; slug:string; name:string; description?:string|null; asset_root:string; tile_url?:string; tile_size?:number; min_zoom?:number; max_zoom?:number; bounds?:Json; is_published?:boolean; created_at?:string; updated_at?:string };
                Update: { id?:string; slug?:string; name?:string; description?:string|null; asset_root?:string; tile_url?:string; tile_size?:number; min_zoom?:number; max_zoom?:number; bounds?:Json; is_published?:boolean; created_at?:string; updated_at?:string };
                Relationships: [];
            };
            map_districts: {
                Row: { id:string; map_id:string; slug:string; name:string; colour:string; icon_path:string|null; marker_position:Json|null; polygon:Json; sort_order:number; created_at:string; updated_at:string };
                Insert: { id?:string; map_id:string; slug:string; name:string; colour?:string; icon_path?:string|null; marker_position?:Json|null; polygon?:Json; sort_order?:number; created_at?:string; updated_at?:string };
                Update: { id?:string; map_id?:string; slug?:string; name?:string; colour?:string; icon_path?:string|null; marker_position?:Json|null; polygon?:Json; sort_order?:number; created_at?:string; updated_at?:string };
                Relationships: [];
            };
            map_spots: {
                Row: { id:string; map_id:string; district_id:string|null; created_by:string|null; slug:string; name:string; description:string; category:string; position:Json; is_published:boolean; created_at:string; updated_at:string };
                Insert: { id?:string; map_id:string; district_id?:string|null; created_by?:string|null; slug:string; name:string; description?:string; category?:string; position:Json; is_published?:boolean; created_at?:string; updated_at?:string };
                Update: { id?:string; map_id?:string; district_id?:string|null; created_by?:string|null; slug?:string; name?:string; description?:string; category?:string; position?:Json; is_published?:boolean; created_at?:string; updated_at?:string };
                Relationships: [];
            };
            spot_reviews: {
                Row: { id:string; spot_id:string; user_id:string; rating:number; body:string|null; created_at:string; updated_at:string };
                Insert: { id?:string; spot_id:string; user_id:string; rating:number; body?:string|null; created_at?:string; updated_at?:string };
                Update: { id?:string; spot_id?:string; user_id?:string; rating?:number; body?:string|null; created_at?:string; updated_at?:string };
                Relationships: [];
            };
            spot_media: {
                Row:{id:string;spot_id:string;created_by:string|null;storage_path:string;media_type:string;caption:string|null;is_cover:boolean;is_published:boolean;created_at:string;updated_at:string};
                Insert:{id?:string;spot_id:string;created_by?:string|null;storage_path:string;media_type:string;caption?:string|null;is_cover?:boolean;is_published?:boolean;created_at?:string;updated_at?:string};
                Update:{id?:string;spot_id?:string;created_by?:string|null;storage_path?:string;media_type?:string;caption?:string|null;is_cover?:boolean;is_published?:boolean;created_at?:string;updated_at?:string};Relationships:[];
            };
            spot_comments: {
                Row:{id:string;spot_id:string;user_id:string|null;body:string;is_published:boolean;created_at:string;updated_at:string};
                Insert:{id?:string;spot_id:string;user_id?:string|null;body:string;is_published?:boolean;created_at?:string;updated_at?:string};
                Update:{id?:string;spot_id?:string;user_id?:string|null;body?:string;is_published?:boolean;created_at?:string;updated_at?:string};Relationships:[];
            };
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
