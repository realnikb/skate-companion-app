import Link from "next/link";

import { StudioForm } from "@/components/studio/studio-form";
import styles from "../../studio.module.scss";

export default function NewPage() {
    return <main className={styles.content}>
        <header className={styles.editorHeader}><div><Link href="/studio/pages">← Back to pages</Link><h1>New page</h1></div><span className={`${styles.status} ${styles.draft}`}>New draft</span></header>
        <StudioForm kind="new-page">
            <section className={`${styles.panel} ${styles.detailsPanel}`}>
                <h2>Page details</h2>
                <div className={styles.fieldRow}><div className={styles.field}><label htmlFor="title">Title *</label><input id="title" name="title" required autoFocus /></div><div className={styles.field}><label htmlFor="slug">Slug *</label><input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="about-us" /></div></div>
                <div className={styles.field}><label htmlFor="eyebrow">Eyebrow</label><input id="eyebrow" name="eyebrow" placeholder="About Skate Companion" /></div>
                <div className={styles.field}><label htmlFor="summary">Summary</label><textarea id="summary" name="summary" rows={3} /></div>
                <div className={styles.field}><label htmlFor="body">Page content</label><textarea className={styles.pageBodyEditor} id="body" name="body" rows={22} placeholder={'## Section heading\n\nWrite paragraphs here.\n\n- Add list items with a dash'} /></div>
            </section>
            <aside className={`${styles.panel} ${styles.publishingPanel}`}><h2>Publishing</h2><p className={styles.settingsNote}>New pages begin as drafts. After creation, review the public preview and publish when ready.</p></aside>
        </StudioForm>
    </main>;
}
