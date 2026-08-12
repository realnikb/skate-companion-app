export class SupabaseConfigError extends Error {
    constructor(message = "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.") {
        super(message);
        this.name = "SupabaseConfigError";
    }
}

export function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
        throw new SupabaseConfigError();
    }

    return {
        url,
        publishableKey,
    };
}
