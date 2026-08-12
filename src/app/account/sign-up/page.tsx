import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, LockKeyhole } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "../sign-in/sign-in-form";
import styles from "../sign-in/sign-in.module.scss";

export const metadata: Metadata = {
    title: "Create your free account | Skate Companion",
    description: "Create a free Skate Companion account to sync your preferences, favourites, and lines.",
    robots: { index: false, follow: false },
};

export default async function SignUpPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/account");

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <Link className={styles.logo} href="/" aria-label="Back to Skate Companion"><Image src="/skate-logo.webp" alt="Skate" width={401} height={112} priority /><span>companion</span></Link>
                <div className={styles.freeBadge}>Free account · No password</div>
                <h1>Save every trick. Keep every line.</h1>
                <p className={styles.intro}>Create your free account and keep your skating setup synced wherever you play.</p>
                <SignInForm mode="sign-up" />
                <p className={styles.switchAuth}>Already have an account? <Link href="/account/sign-in">Sign in</Link></p>
                <div className={styles.trust}><LockKeyhole /><span>Secure, passwordless sign-up. We’ll only email you to access your account.</span></div>
            </section>
            <aside className={styles.art} aria-hidden="true">
                <div className={styles.artLabel}>Your companion on and off the board.</div>
                <strong>Everything you’re learning,<br />saved in one place.</strong>
                <ul><li><Check /> Save favourite tricks</li><li><Check /> Build and keep session lines</li><li><Check /> Sync your stance and controls</li></ul>
                <span className={styles.artFoot}>Free to join. Built for skaters.</span>
            </aside>
        </main>
    );
}
