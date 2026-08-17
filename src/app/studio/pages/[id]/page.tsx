import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicationStatus } from "@/components/studio/publication-status";
import { StudioForm } from "@/components/studio/studio-form";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../../studio.module.scss";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase } = await requireStudioUser();
    const { data: page, error } = await supabase.from("content_pages").select("*").eq("id", id).maybeSingle();
    if (error || !page) notFound();

    return <main className={styles.content}>
        <header className={styles.editorHeader}><div><Link href="/studio/pages">← Back to pages</Link><h1>{page.title}</h1></div><span className={page.is_published ? styles.status : `${styles.status} ${styles.draft}`}>{page.is_published ? "Published" : "Draft"}</span></header>
        <StudioForm kind="page" isPublished={page.is_published} lastSavedAt={page.updated_at} lastSavedBy={page.last_edited_by}>
            <input type="hidden" name="id" value={page.id} />
            <section className={`${styles.panel} ${styles.detailsPanel}`}>
                <h2>Page details</h2>
                <div className={styles.fieldRow}><div className={styles.field}><label htmlFor="title">Title *</label><input id="title" name="title" defaultValue={page.title} required /></div><div className={styles.field}><label htmlFor="slug">Slug *</label><input id="slug" name="slug" defaultValue={page.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div></div>
                <div className={styles.field}><label htmlFor="eyebrow">Eyebrow</label><input id="eyebrow" name="eyebrow" defaultValue={page.eyebrow ?? ""} /></div>
                <div className={styles.field}><label htmlFor="summary">Summary</label><textarea id="summary" name="summary" rows={3} defaultValue={page.summary ?? ""} /></div>
                <div className={styles.field}><label htmlFor="body">Page content *</label><textarea className={styles.pageBodyEditor} id="body" name="body" rows={28} defaultValue={page.body} required /><small>Use ## for section headings, ### for subheadings and - for bullet points.</small></div>
            </section>
            <aside className={`${styles.panel} ${styles.publishingPanel}`}><h2>Publishing</h2><PublicationStatus isPublished={page.is_published} contentType="page" />{page.is_published && <Link className={styles.secondaryButton} href={`/${page.slug}`} target="_blank">View public page ↗</Link>}</aside>
        </StudioForm>
    </main>;
}
