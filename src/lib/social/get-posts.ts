import { createClient } from "@/lib/supabase/server";

export type SocialPost = { id: string; body: string; type: string; imageUrl?: string; videoUrl?: string; uploadedVideo?: boolean; location?: string; mapPin?: { mapName: string; x: number; y: number }; tags: { id: string; name: string; handle?: string; crewSlug?: string; kind: "skater" | "crew" }[]; createdAt: string; likes: number; comments: number; author: { name: string; handle: string; crewSlug?: string; initials: string } };

export async function getSocialPosts(): Promise<SocialPost[]> {
  const supabase = await createClient();
  const { data: posts, error } = await supabase.from("social_posts").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(30);
  if (error || !posts?.length) return [];
  const postIds = posts.map((post) => post.id);
  const [{ data: userTags }, { data: crewTags }] = await Promise.all([
    supabase.from("social_post_user_tags").select("post_id,user_id").in("post_id", postIds),
    supabase.from("social_post_crew_tags").select("post_id,crew_id").in("post_id", postIds),
  ]);
  const userIds = [...new Set([...posts.map((post) => post.author_id), ...(userTags ?? []).map((tag) => tag.user_id)])];
  const crewIds = [...new Set([...posts.flatMap((post) => post.crew_id ? [post.crew_id] : []), ...(crewTags ?? []).map((tag) => tag.crew_id)])];
  const mapIds = [...new Set(posts.flatMap((post) => post.map_id ? [post.map_id] : []))];
  const [{ data: profiles }, { data: crews }, { data: maps }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,handle").in("id", userIds),
    crewIds.length ? supabase.from("crews").select("id,name,slug").in("id", crewIds) : Promise.resolve({ data: [] }),
    mapIds.length ? supabase.from("skate_maps").select("id,name").in("id", mapIds) : Promise.resolve({ data: [] }),
  ]);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return posts.map((post) => {
    const crew = crews?.find((item) => item.id === post.crew_id);
    const profile = profiles?.find((item) => item.id === post.author_id);
    const map = maps?.find((item) => item.id === post.map_id);
    const position = Array.isArray(post.map_position) && post.map_position.length === 2 ? post.map_position : null;
    const name = crew?.name ?? profile?.display_name ?? "Skater";
    const mediaUrl = post.image_path && base ? `${base}/storage/v1/object/public/social-media/${post.image_path}` : undefined;
    const tags: SocialPost["tags"] = [
      ...(userTags ?? []).filter((tag) => tag.post_id === post.id).flatMap((tag) => { const tagged = profiles?.find((item) => item.id === tag.user_id); return tagged ? [{ id: tagged.id, name: tagged.display_name, handle: tagged.handle, kind: "skater" as const }] : []; }),
      ...(crewTags ?? []).filter((tag) => tag.post_id === post.id).flatMap((tag) => { const tagged = crews?.find((item) => item.id === tag.crew_id); return tagged ? [{ id: tagged.id, name: tagged.name, crewSlug: tagged.slug, kind: "crew" as const }] : []; }),
    ];
    return { id: post.id, body: post.body, type: post.post_type, imageUrl: post.media_type === "video" ? undefined : mediaUrl, videoUrl: post.media_type === "video" ? mediaUrl : post.external_video_url ?? undefined, uploadedVideo: post.media_type === "video", location: post.location ?? undefined, mapPin: map && position && typeof position[0] === "number" && typeof position[1] === "number" ? { mapName: map.name, x: position[0], y: position[1] } : undefined, tags, createdAt: post.created_at, likes: post.likes_count, comments: post.comments_count, author: { name, handle: profile?.handle ?? "skater", crewSlug: crew?.slug, initials: name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase() } };
  });
}
