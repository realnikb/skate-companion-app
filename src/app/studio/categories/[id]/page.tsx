import Link from "next/link";
import { notFound } from "next/navigation";

import { StudioForm } from "@/components/studio/studio-form";
import { PublicationStatus } from "@/components/studio/publication-status";
import { CategoryThemeEditor } from "@/components/studio/category-theme-editor";
import { MediaField } from "@/components/studio/media-field";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../../studio.module.scss";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase } = await requireStudioUser();
    const [{ data: category, error }, { count }, { data: categories }] = await Promise.all([
        supabase.from("trick_categories").select("*").eq("id", id).maybeSingle(),
        supabase.from("tricks").select("id", { count: "exact", head: true }).eq("category_id", id),
        supabase.from("trick_categories").select("id,name,parent_id").neq("id", id).order("sort_order").order("name"),
    ]);
    if (error || !category) notFound();

    return (
        <main className={styles.content}>
            <header className={styles.editorHeader}><div><Link href="/studio/categories">← Back to categories</Link><h1>{category.name}</h1></div><span className={category.is_published ? styles.status : `${styles.status} ${styles.draft}`}>{category.is_published ? "Published" : "Draft"}</span></header>
            <StudioForm kind="category" isPublished={category.is_published}>
                <input type="hidden" name="id" value={category.id} />
                <section className={`${styles.panel} ${styles.detailsPanel}`}>
                    <h2>Category details</h2>
                    <div className={styles.fieldRow}><div className={styles.field}><label htmlFor="name">Name *</label><input id="name" name="name" defaultValue={category.name} required /></div><div className={styles.field}><label htmlFor="slug">Slug *</label><input id="slug" name="slug" defaultValue={category.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div></div>
                    <div className={styles.field}><label htmlFor="description">Description</label><textarea id="description" name="description" defaultValue={category.description ?? ""} /></div>
                    <h2>Category page copy</h2>
                    <div className={styles.field}><label htmlFor="page_eyebrow">Hero eyebrow</label><input id="page_eyebrow" name="page_eyebrow" defaultValue={category.page_eyebrow ?? "EA Skate Online Skatepedia"} /></div>
                    <div className={styles.field}><label htmlFor="page_heading">Hero heading</label><input id="page_heading" name="page_heading" defaultValue={category.page_heading ?? "How to do {category}"} /><small>Use {"{category}"} to insert the category name.</small></div>
                    <div className={styles.field}><label htmlFor="popular_heading">Popular tricks heading</label><input id="popular_heading" name="popular_heading" defaultValue={category.popular_heading ?? "Popular {category}"} /><small>Use {"{category}"} to insert the category name.</small></div>
                </section>
                <section className={`${styles.panel} ${styles.mediaPanel}`}>
                    <div className={styles.sectionHeading}><div><span>Media</span><h2>Category hero</h2></div><p>Set the background artwork used at the top of this category page.</p></div>
                    <MediaField trickId={category.id} kind="category-hero" name="hero_image_path" label="Hero image" accept="image/*" defaultPath={category.hero_image_path} />
                </section>
                <CategoryThemeEditor name={category.name} accentColor={category.accent_color} gradientStartColor={category.gradient_start_color} gradientMiddleColor={category.gradient_middle_color} gradientEndColor={category.gradient_end_color} />
                <aside className={`${styles.panel} ${styles.publishingPanel}`}>
                    <h2>Publishing</h2>
                    <PublicationStatus isPublished={category.is_published} contentType="category" />
                    <div className={styles.field}><label htmlFor="parent_id">Parent category</label><select id="parent_id" name="parent_id" defaultValue={category.parent_id ?? ""}><option value="">Top-level category</option>{categories?.filter((item) => item.parent_id !== category.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                    <div className={styles.field}><label htmlFor="sort_order">Sort order</label><input id="sort_order" name="sort_order" type="number" defaultValue={category.sort_order} /></div>
                    <p className={styles.settingsNote}>{count ?? 0} tricks currently belong to this category.</p>
                </aside>
            </StudioForm>
        </main>
    );
}
