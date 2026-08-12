import Link from "next/link";
import { notFound } from "next/navigation";

import { StickPathEditor } from "@/components/studio/stick-path-editor";
import { requireStudioUser } from "@/lib/studio/auth";
import { mapStickPath } from "@/lib/tricks/stick-paths";
import styles from "../../studio.module.scss";

export default async function EditStickPathPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase } = await requireStudioUser();
    const { data, error } = await supabase.from("stick_paths").select("id,slug,name,points").eq("id", id).maybeSingle();
    if (error || !data) notFound();
    const path = mapStickPath(data);
    return <main className={styles.content}><header className={styles.editorHeader}><div><Link href="/studio/stick-paths">← Back to stick paths</Link><h1>{path.name}</h1></div></header><section className={styles.panel}><StickPathEditor path={path} /></section></main>;
}
