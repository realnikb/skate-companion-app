import Link from "next/link";

import { ControllerInput } from "@/components/tricks/controller-input";
import { requireStudioUser } from "@/lib/studio/auth";
import { mapStickPath } from "@/lib/tricks/stick-paths";
import styles from "../studio.module.scss";

export default async function StickPathsPage() {
    const { supabase } = await requireStudioUser();
    const { data, error } = await supabase.from("stick_paths").select("id,slug,name,points").order("name");
    if (error) throw new Error(`Unable to load stick paths: ${error.message}`);
    const paths = (data ?? []).map(mapStickPath);
    return <main className={styles.content}><header className={styles.pageHeader}><div><span>Reusable controls</span><h1>Stick paths</h1><p>Draw each gesture once, then reuse it across any number of trick combinations.</p></div><div className={styles.headerActions}><Link className={styles.secondaryButton} href="/studio/stick-paths/import">Import JSON</Link><Link className={styles.primaryButton} href="/studio/stick-paths/new">New stick path</Link></div></header><div className={styles.categoryGrid}>{paths.map((path) => <Link className={styles.categoryCard} href={`/studio/stick-paths/${path.id}`} key={path.id}><header><div><h2>{path.name}</h2><small>/{path.slug}</small></div></header><ControllerInput input={{ type: "stick", stick: "right", action: "scoop", pathId: path.id, path: { points: path.points } }} platform="xbox" /></Link>)}{!paths.length && <p className={styles.empty}>No reusable stick paths yet.</p>}</div></main>;
}
