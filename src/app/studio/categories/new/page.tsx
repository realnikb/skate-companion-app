import Link from "next/link";

import { StudioForm } from "@/components/studio/studio-form";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../../studio.module.scss";

export default async function NewCategoryPage() {
  const { supabase } = await requireStudioUser();
  const { data: categories, error } = await supabase
    .from("trick_categories")
    .select("id,name")
    .is("parent_id", null)
    .order("sort_order")
    .order("name");
  if (error)
    throw new Error(`Unable to load parent categories: ${error.message}`);

  return (
    <main className={styles.content}>
      <header className={styles.editorHeader}>
        <div>
          <Link href="/studio/categories">← Back to categories</Link>
          <h1>New category</h1>
        </div>
        <span className={`${styles.status} ${styles.draft}`}>New draft</span>
      </header>
      <StudioForm kind="new-category">
        <section className={`${styles.panel} ${styles.detailsPanel}`}>
          <h2>Category details</h2>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="name">Name *</label>
              <input id="name" name="name" required autoFocus />
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Slug *</label>
              <input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="street-skating"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" />
          </div>
        </section>
        <aside className={`${styles.panel} ${styles.publishingPanel}`}>
          <h2>Structure</h2>
          <div className={styles.field}>
            <label htmlFor="parent_id">Parent category</label>
            <select id="parent_id" name="parent_id" defaultValue="">
              <option value="">Top-level category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <p className={styles.settingsNote}>
            New categories start as drafts and are placed at the end of the
            catalogue. You can customise artwork, colours, page copy and
            ordering after creation.
          </p>
        </aside>
      </StudioForm>
    </main>
  );
}
