import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/server";
import { getTricks } from "@/lib/tricks/get-tricks";
import type { Trick } from "@/types/trick";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let tricks: Trick[] = [];
  let isAuthenticated = false;
  let avatarUrl: string | undefined;
  let displayName: string | undefined;

  try {
    tricks = await getTricks();
  } catch {
    /* Page-level error states remain responsible for data failures. */
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
    const userId =
      typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_path,display_name")
        .eq("id", userId)
        .maybeSingle();
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
      avatarUrl =
        profile?.avatar_path && base
          ? `${base}/storage/v1/object/public/profile-media/${profile.avatar_path}`
          : undefined;
      displayName =
        profile?.display_name ??
        (typeof data?.claims?.email === "string"
          ? data.claims.email.split("@")[0]
          : "Skater");
    }
  } catch {
    /* Public pages remain available when auth is unavailable. */
  }

  return (
    <>
      <SiteHeader
        tricks={tricks}
        isAuthenticated={isAuthenticated}
        avatarUrl={avatarUrl}
        displayName={displayName}
      />
      {children}
      <SiteFooter />
      <MobileNav avatarUrl={avatarUrl} />
    </>
  );
}
