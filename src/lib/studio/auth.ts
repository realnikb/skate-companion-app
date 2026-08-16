import "server-only";

import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireStudioUser() {
    const supabase = await createClient();

    const { data: claimsData } = await supabase.auth.getClaims();

    if (!claimsData?.claims) redirect("/account/sign-in?next=/studio");

    const { data: membership, error } = await supabase
        .from("studio_admins")
        .select("user_id")
        .eq("user_id", String(claimsData.claims.sub))
        .maybeSingle();

    if (error || !membership) notFound();

    return {
        supabase,
        user: {
            id: String(claimsData.claims.sub),
            email: typeof claimsData.claims.email === "string" ? claimsData.claims.email : "Studio administrator",
        },
    };
}
