import type { Metadata } from "next";
import { CrewDirectory } from "@/components/crews/crew-directory";
import type { PostMapOption } from "@/components/social/post-map-picker";
import type { PostTagOption } from "@/components/social/post-tag-picker";
import { getCrews } from "@/lib/crews/get-crews";
import { getSocialPosts } from "@/lib/social/get-posts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Social | Skate Companion", description: "Share skate posts, discover crews and see what the community is doing." };
export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [crews, posts] = await Promise.all([getCrews(), getSocialPosts()]);
  const supabase = await createClient();
  const [{ data: auth }, { data: mapRows }, { data: profileRows }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("skate_maps").select("id,name,asset_root,tile_url,min_zoom,max_zoom,bounds").eq("is_published", true).order("created_at"),
    supabase.from("profiles").select("id,display_name,handle").order("display_name").limit(500),
  ]);
  const maps: PostMapOption[] = (mapRows ?? []).map((map) => ({ id: map.id, name: map.name, assetRoot: map.asset_root, tileUrl: map.tile_url, minZoom: map.min_zoom, maxZoom: map.max_zoom, bounds: map.bounds as PostMapOption["bounds"] }));
  const tagOptions: PostTagOption[] = [
    ...(profileRows ?? []).map((profile) => ({ id: profile.id, name: profile.display_name, handle: profile.handle, kind: "skater" as const })),
    ...crews.map((crew) => ({ id: crew.id, name: crew.name, slug: crew.slug, kind: "crew" as const })),
  ];
  const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;
  let viewer: undefined | { name: string; avatarUrl?: string; ownedCrews: { id: string; name: string }[] };
  if (userId) {
    const [{ data: profile }, { data: owned }] = await Promise.all([
      supabase.from("profiles").select("display_name,avatar_path").eq("id", userId).maybeSingle(),
      supabase.from("crews").select("id,name").eq("owner_id", userId),
    ]);
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const avatarUrl = profile?.avatar_path && base ? `${base}/storage/v1/object/public/profile-media/${profile.avatar_path}` : undefined;
    viewer = { name: profile?.display_name ?? (typeof auth?.claims?.email === "string" ? auth.claims.email.split("@")[0] : "Skater"), avatarUrl, ownedCrews: owned ?? [] };
  }
  return <CrewDirectory crews={crews} posts={posts} maps={maps} tagOptions={tagOptions} viewer={viewer} />;
}
