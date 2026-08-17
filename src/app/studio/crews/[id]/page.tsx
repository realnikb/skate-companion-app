import Link from "next/link";
import { notFound } from "next/navigation";
import { CrewFields } from "@/components/studio/crew-fields";
import { CrewForm } from "@/components/studio/crew-form";
import { DeleteCrewForm } from "@/components/studio/delete-crew-form";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../../studio.module.scss";

export default async function EditCrewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params, { supabase } = await requireStudioUser();
    const [{ data: crew, error }, { data: profiles }, { count: memberCount }] = await Promise.all([supabase.from("crews").select("*").eq("id", id).maybeSingle(), supabase.from("profiles").select("id,handle,display_name").order("display_name"), supabase.from("crew_members").select("user_id", { count: "exact", head: true }).eq("crew_id", id)]);
    if (error || !crew) notFound();
    return <main className={styles.content}><header className={styles.editorHeader}><div><Link href="/studio/crews">← Back to crews</Link><h1>{crew.name}</h1><p>{memberCount ?? 0} crew members</p></div><span className={crew.is_published ? styles.status : `${styles.status} ${styles.draft}`}>{crew.is_published ? "Published" : "Draft"}</span></header><CrewForm editing><CrewFields profiles={profiles ?? []} crew={crew} /></CrewForm><DeleteCrewForm id={crew.id} name={crew.name} /></main>;
}
