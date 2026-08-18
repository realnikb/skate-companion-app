import Link from "next/link";
import { ArrowRight, FolderTree, Shapes } from "lucide-react";

import { requireStudioUser } from "@/lib/studio/auth";
import styles from "./studio.module.scss";

export default async function StudioPage() {
  const { supabase } = await requireStudioUser();
  const [
    { count: trickCount },
    { count: categoryCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from("tricks").select("id", { count: "exact", head: true }),
    supabase
      .from("trick_categories")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("tricks")
      .select("id", { count: "exact", head: true })
      .or(
        "needs_name_review.eq.true,needs_control_review.eq.true,needs_description_review.eq.true",
      ),
  ]);

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <span>Content workspace</span>
          <h1>Studio</h1>
          <p>Manage the trick catalogue that powers Skate Companion.</p>
        </div>
      </header>
      <section className={styles.stats}>
        <article>
          <Shapes />
          <span>Tricks</span>
          <strong>{trickCount ?? 0}</strong>
          <small>{reviewCount ?? 0} need review</small>
        </article>
        <article>
          <FolderTree />
          <span>Categories</span>
          <strong>{categoryCount ?? 0}</strong>
          <small>Catalogue groups</small>
        </article>
      </section>
      <section className={styles.quickLinks}>
        <Link href="/studio/tricks">
          <span>
            <Shapes />
            <strong>Find and edit tricks</strong>
            <small>
              Search the catalogue, review metadata and publish changes.
            </small>
          </span>
          <ArrowRight />
        </Link>
        <Link href="/studio/categories">
          <span>
            <FolderTree />
            <strong>Manage categories</strong>
            <small>
              Edit category names, descriptions, ordering and visibility.
            </small>
          </span>
          <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
