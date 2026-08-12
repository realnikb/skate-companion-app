const trickMediaBucket = "trick-media";

export function getTrickMediaUrl(path: string | null): string | undefined {
    if (!path) return undefined;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is required to resolve trick media.");
    }

    const normalizedPath = path.replace(/^\/+/, "");
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${trickMediaBucket}/${normalizedPath}`;
}
