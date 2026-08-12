import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { createClient } from "@/lib/supabase/server";
import { getTricks } from "@/lib/tricks/get-tricks";
import type { Trick } from "@/types/trick";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    let tricks: Trick[] = [];
    let isAuthenticated = false;

    try { tricks = await getTricks(); } catch { /* Page-level error states remain responsible for data failures. */ }
    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getClaims();
        isAuthenticated = Boolean(data?.claims);
    } catch { /* Public pages remain available when auth is unavailable. */ }

    return <><SiteHeader tricks={tricks} isAuthenticated={isAuthenticated} />{children}<SiteFooter /></>;
}
