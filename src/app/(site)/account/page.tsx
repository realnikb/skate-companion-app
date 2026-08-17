import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Footprints, LogOut, Route, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { ProfileEditor } from "./profile-editor";
import styles from "./account.module.scss";

export const metadata: Metadata = { title: "Your account | Skate Companion", robots: { index: false, follow: false } };

export default async function AccountPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/account/sign-in");
    const email = typeof data.claims.email === "string" ? data.claims.email : "Signed-in skater";
    const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";
    const { data: profile } = userId ? await supabase.from("profiles").select("display_name,handle,avatar_path,preferred_controller,stance,playstation_gamertag,xbox_gamertag,ea_id,steam_gamertag,youtube_url,tiktok_url,instagram_url,updated_at").eq("id", userId).maybeSingle() : { data: null };
    const { data: ownedCrews } = userId ? await supabase.from("crews").select("id,slug,name,recruitment_status").eq("owner_id", userId).order("created_at", { ascending: false }) : { data: [] };

    return (
        <main className={styles.page}>
            <header>
                <div><span>Your account</span><h1>Welcome back.</h1><p>{email}</p></div>
                <form action={signOut}><button type="submit"><LogOut /> Sign out</button></form>
            </header>
            <ProfileEditor displayName={profile?.display_name ?? email.split("@")[0] ?? "Skater"} handle={profile?.handle ?? `skater_${userId.replaceAll("-","").slice(0,12)}`} email={email} avatarUrl={profile?.avatar_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/profile-media/${profile.avatar_path}?v=${encodeURIComponent(profile.updated_at)}` : undefined} controller={profile?.preferred_controller ?? "xbox"} stance={profile?.stance ?? "regular"} playstationGamertag={profile?.playstation_gamertag ?? ""} xboxGamertag={profile?.xbox_gamertag ?? ""} eaId={profile?.ea_id ?? ""} steamGamertag={profile?.steam_gamertag ?? ""} youtubeUrl={profile?.youtube_url ?? ""} tiktokUrl={profile?.tiktok_url ?? ""} instagramUrl={profile?.instagram_url ?? ""} />
            <section className={styles.grid}>
                <article className={styles.crewCard}><Users /><span>Crews</span><h2>{ownedCrews?.length ? "Crews you own" : "Your crew identity"}</h2>{ownedCrews?.length ? ownedCrews.map(crew => <Link key={crew.id} href={`/account/crews/${crew.id}`}>Edit {crew.name} · {crew.recruitment_status}</Link>) : <><p>Create your crew page and you’ll be shown publicly as its verified owner.</p><Link href="/account/crews/new">Create your crew</Link></>}</article>
                <article><Footprints /><span>Preferences</span><h2>Your skating setup</h2><p>Your stance and controller are now saved to your account and this device.</p><a href="#profile-settings">Edit above</a></article>
                <article><Bookmark /><span>Library</span><h2>Favourite tricks</h2><p>Your saved trick library will live here.</p><small>Coming soon</small></article>
                <article><Route /><span>Sessions</span><h2>Saved lines</h2><p>Build and sync your favourite lines across devices.</p><small>Coming soon</small></article>
            </section>
        </main>
    );
}
