import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Footprints, LogOut, Route, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CreateCrewForm } from "@/components/crews/create-crew-form";
import { signOut } from "./actions";
import styles from "./account.module.scss";

export const metadata: Metadata = { title: "Your account | Skate Companion", robots: { index: false, follow: false } };

export default async function AccountPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/account/sign-in");
    const email = typeof data.claims.email === "string" ? data.claims.email : "Signed-in skater";
    const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";
    const { data: profile } = userId ? await supabase.from("profiles").select("display_name,handle").eq("id", userId).maybeSingle() : { data: null };
    const { data: ownedCrews } = userId ? await supabase.from("crews").select("slug,name,recruitment_status").eq("owner_id", userId).order("created_at", { ascending: false }) : { data: [] };

    return (
        <main className={styles.page}>
            <header>
                <div><span>Your account</span><h1>Welcome back.</h1><p>{email}</p></div>
                <form action={signOut}><button type="submit"><LogOut /> Sign out</button></form>
            </header>
            <section className={styles.grid}>
                <article className={styles.crewCard}><Users /><span>Crews</span><h2>{ownedCrews?.length ? "Crews you own" : "Your crew identity"}</h2>{ownedCrews?.length ? ownedCrews.map(crew => <Link key={crew.slug} href={`/crews/${crew.slug}`}>{crew.name} · {crew.recruitment_status}</Link>) : <><p>Create your crew page and you’ll be shown publicly as its verified owner.</p><a href="#create-crew">Create your crew</a></>}</article>
                <article><Footprints /><span>Preferences</span><h2>Your skating setup</h2><p>Stance and controller syncing is coming next.</p><Link href="/">Edit guest preferences</Link></article>
                <article><Bookmark /><span>Library</span><h2>Favourite tricks</h2><p>Your saved trick library will live here.</p><small>Coming soon</small></article>
                <article><Route /><span>Sessions</span><h2>Saved lines</h2><p>Build and sync your favourite lines across devices.</p><small>Coming soon</small></article>
            </section>
            <CreateCrewForm displayName={profile?.display_name ?? ""} handle={profile?.handle ?? ""} />
        </main>
    );
}
