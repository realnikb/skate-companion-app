import { HomePage } from "@/components/home/home-page";
import { SupabaseConfigError } from "@/lib/supabase/config";
import { getTricks } from "@/lib/tricks/get-tricks";
import { getCategories } from "@/lib/tricks/get-categories";
import type { Trick, TrickCategory } from "@/types/trick";

export const dynamic = "force-dynamic";

export default async function Home() {
    let tricks: Trick[] = [];
    let categories: TrickCategory[] = [];
    let configError: string | undefined;

    try {
        [tricks, categories] = await Promise.all([getTricks(), getCategories()]);
    } catch (error) {
        if (error instanceof SupabaseConfigError) {
            configError = error.message;
        } else {
            throw error;
        }
    }

    return <HomePage tricks={tricks} categories={categories} configError={configError} />;
}
