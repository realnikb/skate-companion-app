import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "./sign-in-form";
import styles from "./sign-in.module.scss";

export const metadata: Metadata = {
    title: "Sign in | Skate Companion",
    description: "Sign in to sync your Skate Companion preferences, favourites, and lines.",
    robots: { index: false, follow: false },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next: requestedNext } = await searchParams;
    const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/account";
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) redirect(next);

    return (
        <main className={styles.loginPage}>
            <Link className={styles.loginWordmark} href="/" aria-label="Skate Companion home">SC<span>+</span></Link>
            <section className={styles.loginCard}>
                <div className={styles.loginIcon}><LockKeyhole /></div>
                <span className={styles.loginEyebrow}>Skate Companion account</span>
                <h1>Welcome back.</h1>
                <p>Enter your email and we’ll send you a secure link to sign in.</p>
                <SignInForm nextPath={next} />
                <p className={styles.switchAuth}>New to Skate Companion? <Link href="/account/sign-up">Create a free account</Link></p>
            </section>
            <span className={styles.loginFoot}>Passwordless and secure</span>
        </main>
    );
}
