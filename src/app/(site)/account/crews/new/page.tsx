import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateCrewForm } from "@/components/crews/create-crew-form";
import { createClient } from "@/lib/supabase/server";
import styles from "../../account.module.scss";

export default async function NewAccountCrewPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getClaims();
    const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;
    if (!userId) redirect("/account/sign-in?next=/account/crews/new");
    const { data: profile } = await supabase.from("profiles").select("display_name,handle").eq("id", userId).maybeSingle();
    return <main className={styles.page}><header><div><span>Your profile</span><h1>Create a crew.</h1><p><Link href="/account">← Back to account</Link></p></div></header><CreateCrewForm displayName={profile?.display_name ?? ""} handle={profile?.handle ?? ""} /></main>;
}
