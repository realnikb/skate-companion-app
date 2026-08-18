import Link from "next/link";
import { FileText } from "lucide-react";

import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../studio.module.scss";

export default async function StudioPagesPage() {
  const { supabase } = await requireStudioUser();
  const { data: pages, error } = await supabase
    .from("content_pages")
    .select("id,slug,title,summary,is_published,updated_at")
    .order("title");
  if (error) throw new Error(`Unable to load Studio pages: ${error.message}`);

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <span>Site content</span>
          <h1>Pages</h1>
          <p>{pages?.length ?? 0} informational and policy pages.</p>
        </div>
        <Link className={styles.primaryButton} href="/studio/pages/new">
          New page
        </Link>
      </header>
      <div className={styles.categoryGrid}>
        {pages?.map((page) => (
          <Link
            className={styles.categoryCard}
            href={`/studio/pages/${page.id}`}
            key={page.id}
          >
            <header>
              <FileText />
              <div>
                <h2>{page.title}</h2>
                <small>/{page.slug}</small>
              </div>
            </header>
            <p>{page.summary || "No page summary yet."}</p>
            <footer>
              <span
                className={
                  page.is_published
                    ? styles.status
                    : `${styles.status} ${styles.draft}`
                }
              >
                {page.is_published ? "Published" : "Draft"}
              </span>
              <span>
                Updated{" "}
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "medium",
                }).format(new Date(page.updated_at))}
              </span>
            </footer>
          </Link>
        ))}
      </div>
    </main>
  );
}
