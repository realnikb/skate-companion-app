import Link from "next/link";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../studio.module.scss";

export default async function CrewsPage() {
    const { supabase } = await requireStudioUser();
    const [{ data: crews, error }, { data: profiles }] = await Promise.all([supabase.from("crews").select("id,name,slug,owner_id,location,recruitment_status,is_published,created_at").order("created_at", { ascending: false }), supabase.from("profiles").select("id,handle,display_name")]);
    if (error) throw new Error(`Unable to load crews: ${error.message}`);
    const owners = new Map((profiles ?? []).map(profile => [profile.id, profile]));
    return <main className={styles.content}><header className={styles.pageHeader}><div><span>Community management</span><h1>Crews</h1><p>Create crews, assign owners, and control what appears in the public directory.</p></div><Link className={styles.primaryButton} href="/studio/crews/new">New crew</Link></header><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Crew</th><th>Owner</th><th>Location</th><th>Recruitment</th><th>Status</th><th /></tr></thead><tbody>{crews?.map(crew => { const owner = owners.get(crew.owner_id); return <tr key={crew.id}><td><strong>{crew.name}</strong><small>/{crew.slug}</small></td><td>{owner ? `${owner.display_name} (@${owner.handle})` : "Unknown"}</td><td>{crew.location || "—"}</td><td>{crew.recruitment_status}</td><td><span className={crew.is_published ? styles.status : `${styles.status} ${styles.draft}`}>{crew.is_published ? "Published" : "Draft"}</span></td><td><Link href={`/studio/crews/${crew.id}`}>Manage</Link></td></tr>})}{!crews?.length && <tr><td className={styles.empty} colSpan={6}>No crews yet. Create the first one.</td></tr>}</tbody></table></div></main>;
}
