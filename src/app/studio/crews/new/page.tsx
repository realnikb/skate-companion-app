import Link from "next/link";
import { CrewFields } from "@/components/studio/crew-fields";
import { CrewForm } from "@/components/studio/crew-form";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../../studio.module.scss";

export default async function NewCrewPage() {
    const { supabase } = await requireStudioUser(); const { data: profiles, error } = await supabase.from("profiles").select("id,handle,display_name").order("display_name"); if (error) throw new Error(error.message);
    return <main className={styles.content}><header className={styles.editorHeader}><div><Link href="/studio/crews">← Back to crews</Link><h1>New crew</h1></div><span className={`${styles.status} ${styles.draft}`}>New draft</span></header><CrewForm><CrewFields profiles={profiles ?? []} /></CrewForm></main>;
}
