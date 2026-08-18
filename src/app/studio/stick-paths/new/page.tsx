import Link from "next/link";

import { StickPathEditor } from "@/components/studio/stick-path-editor";
import styles from "../../studio.module.scss";

export default function NewStickPathPage() {
  return (
    <main className={styles.content}>
      <header className={styles.editorHeader}>
        <div>
          <Link href="/studio/stick-paths">← Back to stick paths</Link>
          <h1>New stick path</h1>
        </div>
      </header>
      <section className={styles.panel}>
        <StickPathEditor />
      </section>
    </main>
  );
}
