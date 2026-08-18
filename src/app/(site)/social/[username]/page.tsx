import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleDot, Gamepad2, Monitor, Users } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { SocialPostList } from "@/components/social/social-post-list";
import { getSocialPosts } from "@/lib/social/get-posts";
import { createClient } from "@/lib/supabase/server";
import styles from "./profile.module.scss";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  return { title: `@${(await params).username} | Skate Companion` };
}
export default async function SkaterProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const username = decodeURIComponent((await params).username);
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id,handle,display_name,avatar_path,bio,playstation_gamertag,xbox_gamertag,ea_id,steam_gamertag,youtube_url,tiktok_url,instagram_url",
    )
    .ilike("handle", username)
    .maybeSingle();
  if (error || !profile) notFound();
  const [{ data: crews }, posts] = await Promise.all([
    supabase
      .from("crews")
      .select("slug,name")
      .eq("owner_id", profile.id)
      .eq("is_published", true),
    getSocialPosts(),
  ]);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const avatarUrl =
    profile.avatar_path && base
      ? `${base}/storage/v1/object/public/profile-media/${profile.avatar_path}`
      : undefined;
  const identities = [
    ["PlayStation", profile.playstation_gamertag, <Gamepad2 key="ps" />],
    ["Xbox", profile.xbox_gamertag, <CircleDot key="xbox" />],
    ["EA", profile.ea_id, <strong key="ea">EA</strong>],
    ["Steam", profile.steam_gamertag, <Monitor key="steam" />],
  ] as const;
  const socials = [
    ["YouTube", profile.youtube_url, YoutubeIcon],
    ["TikTok", profile.tiktok_url, TiktokIcon],
    ["Instagram", profile.instagram_url, InstagramIcon],
  ] as const;
  const profilePosts = posts.filter(
    (post) => post.author.handle.toLowerCase() === profile.handle.toLowerCase(),
  );
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.avatar}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${profile.display_name}'s profile picture`}
              fill
              sizes="144px"
              unoptimized
            />
          ) : (
            <span>{profile.display_name.slice(0, 1)}</span>
          )}
        </div>
        <div>
          <span>Skater profile</span>
          <h1>{profile.display_name}</h1>
          <p>@{profile.handle}</p>
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        </div>
      </section>
      <div className={styles.layout}>
        <section className={styles.feed}>
          <header>
            <span>Latest posts</span>
            <h2>From {profile.display_name}</h2>
          </header>
          {profilePosts.length ? (
            <SocialPostList posts={profilePosts} />
          ) : (
            <p className={styles.empty}>No posts yet.</p>
          )}
        </section>
        <aside>
          {identities.some(([, value]) => value) && (
            <section>
              <span>Skate with me on:</span>
              <div className={styles.identities}>
                {identities.flatMap(([label, value, icon]) =>
                  value
                    ? [
                        <div key={label}>
                          <i>{icon}</i>
                          <p>
                            <small>{label}</small>
                            <strong>{value}</strong>
                          </p>
                        </div>,
                      ]
                    : [],
                )}
              </div>
            </section>
          )}
          {socials.some(([, url]) => url) && (
            <section>
              <span>Socials</span>
              <div className={styles.socials}>
                {socials.flatMap(([label, url, icon]) =>
                  url
                    ? [
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          key={label}
                        >
                          <HugeiconsIcon icon={icon} />
                          {label}
                        </a>,
                      ]
                    : [],
                )}
              </div>
            </section>
          )}
          {crews && crews.length > 0 && (
            <section>
              <span>Crews</span>
              <div className={styles.socials}>
                {crews.map((crew) => (
                  <Link href={`/social/crew/${crew.slug}`} key={crew.slug}>
                    <Users />
                    {crew.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
