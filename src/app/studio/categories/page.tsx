import Link from "next/link";

import { CategoryOrderEditor } from "@/components/studio/category-order-editor";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../studio.module.scss";

export default async function StudioCategoriesPage() {
    const { supabase } = await requireStudioUser();
    const [{ data: categories, error }, { data: tricks }] = await Promise.all([
        supabase.from("trick_categories").select("*").order("sort_order").order("name"),
        supabase.from("tricks").select("category_id"),
    ]);
    if (error) throw new Error(`Unable to load Studio categories: ${error.message}`);
    const counts = new Map<string, number>();
    tricks?.forEach((trick) => counts.set(trick.category_id, (counts.get(trick.category_id) ?? 0) + 1));

    return (
        <main className={styles.content}>
            <header className={styles.pageHeader}><div><span>Catalogue structure</span><h1>Categories</h1><p>{categories?.length ?? 0} categories organise the trick catalogue.</p></div><Link className={styles.primaryButton} href="/studio/categories/new">New category</Link></header>
            <CategoryOrderEditor categories={(categories ?? []).map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description, isPublished: category.is_published, trickCount: counts.get(category.id) ?? 0, parentName: categories?.find((candidate) => candidate.id === category.parent_id)?.name }))} />
        </main>
    );
}
