import Link from "next/link";
import { StickPathImporter } from "@/components/studio/stick-path-importer";
import { requireStudioUser } from "@/lib/studio/auth";
import { mapStickPath } from "@/lib/tricks/stick-paths";
import styles from "../../studio.module.scss";

export default async function ImportStickPathsPage() {
  const { supabase } = await requireStudioUser();
  const { data, error } = await supabase
    .from("stick_paths")
    .select("id,slug,name,points")
    .order("name");
  if (error) throw new Error(`Unable to load stick paths: ${error.message}`);
  return (
    <main className={styles.content}>
      <header className={styles.editorHeader}>
        <div>
          <Link href="/studio/stick-paths">← Back to stick paths</Link>
          <h1>Import stick controls</h1>
        </div>
      </header>
      <StickPathImporter existing={(data ?? []).map(mapStickPath)} />
    </main>
  );
}
