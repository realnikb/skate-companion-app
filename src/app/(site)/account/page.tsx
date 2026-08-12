import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Footprints, LogOut, Route } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import styles from "./account.module.scss";

export const metadata: Metadata = { title: "Your account | Skate Companion", robots: { index: false, follow: false } };

export default async function AccountPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/account/sign-in");
    const email = typeof data.claims.email === "string" ? data.claims.email : "Signed-in skater";

    return (
        <main className={styles.page}>
            <header>
                <div><span>Your account</span><h1>Welcome back.</h1><p>{email}</p></div>
                <form action={signOut}><button type="submit"><LogOut /> Sign out</button></form>
            </header>
            <section className={styles.grid}>
                <article><Footprints /><span>Preferences</span><h2>Your skating setup</h2><p>Stance and controller syncing is coming next.</p><Link href="/">Edit guest preferences</Link></article>
                <article><Bookmark /><span>Library</span><h2>Favourite tricks</h2><p>Your saved trick library will live here.</p><small>Coming soon</small></article>
                <article><Route /><span>Sessions</span><h2>Saved lines</h2><p>Build and sync your favourite lines across devices.</p><small>Coming soon</small></article>
            </section>
        </main>
    );
}
