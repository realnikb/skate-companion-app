import Link from "next/link";

import { StudioForm } from "@/components/studio/studio-form";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../../studio.module.scss";

export default async function NewTrickPage() {
  const { supabase } = await requireStudioUser();
  const { data: categories, error } = await supabase
    .from("trick_categories")
    .select("id,name,parent_id,is_published")
    .order("sort_order")
    .order("name");
  if (error)
    throw new Error(`Unable to load trick categories: ${error.message}`);
  return (
    <main className={styles.content}>
      <header className={styles.editorHeader}>
        <div>
          <Link href="/studio/tricks">← Back to tricks</Link>
          <h1>Add a trick</h1>
        </div>
      </header>
      <StudioForm kind="new-trick">
        <section className={`${styles.panel} ${styles.detailsPanel}`}>
          <h2>Start from scratch</h2>
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
                placeholder="kickflip-underflip"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="category_id">Category *</label>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories?.map((category) => {
                const parent = categories.find(
                  (candidate) => candidate.id === category.parent_id,
                );
                return (
                  <option key={category.id} value={category.id}>
                    {parent ? `${parent.name} / ` : ""}
                    {category.name}
                    {category.is_published ? "" : " (draft)"}
                  </option>
                );
              })}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" name="difficulty" defaultValue="">
              <option value="">Not set</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="description">Description *</label>
            <textarea id="description" name="description" required />
          </div>
        </section>
        <aside className={`${styles.panel} ${styles.publishingPanel}`}>
          <h2>What happens next</h2>
          <p>
            Create a private draft, then add video, artwork, aliases and
            publishing details in the full editor. Controller artwork is
            optional for combination tricks.
          </p>
        </aside>
      </StudioForm>
    </main>
  );
}
