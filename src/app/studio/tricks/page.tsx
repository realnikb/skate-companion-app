import Link from "next/link";

import { requireStudioUser } from "@/lib/studio/auth";
import { StudioTrickFilters } from "@/components/studio/studio-trick-filters";
import { hasControls, normalizeTrickControls } from "@/lib/tricks/controls";
import styles from "../studio.module.scss";

type SearchParams = Promise<{ q?: string; category?: string; status?: string; input?: string; page?: string }>;
const PAGE_SIZE = 25;

export default async function StudioTricksPage({ searchParams }: { searchParams: SearchParams }) {
    const filters = await searchParams;
    const { supabase } = await requireStudioUser();
    const [{ data: tricks, error }, { data: categories }] = await Promise.all([
        supabase.from("tricks").select("id,slug,name,aliases,category_id,context,controls,controls_reference_path,is_published,needs_name_review,needs_control_review,needs_description_review,updated_at,trick_categories(name,slug)").order("name"),
        supabase.from("trick_categories").select("id,name,slug").order("sort_order").order("name"),
    ]);
    if (error) throw new Error(`Unable to load Studio tricks: ${error.message}`);

    const query = filters.q?.trim().toLowerCase() ?? "";
    const filtered = (tricks ?? []).filter((trick) => {
        const matchesQuery = !query
            || trick.name.toLowerCase().includes(query)
            || trick.slug.toLowerCase().includes(query)
            || trick.context?.toLowerCase().includes(query)
            || trick.aliases.some((alias) => alias.toLowerCase().includes(query));
        const matchesCategory = !filters.category || trick.category_id === filters.category;
        const needsReview = trick.needs_name_review || trick.needs_control_review || trick.needs_description_review;
        const matchesStatus = !filters.status || (filters.status === "published" && trick.is_published) || (filters.status === "draft" && !trick.is_published) || (filters.status === "review" && needsReview);
        const usesOldScreenshotOnly = Boolean(trick.controls_reference_path) && !hasControls(normalizeTrickControls(trick.controls));
        const matchesInputMethod = !filters.input || (filters.input === "legacy-reference" && usesOldScreenshotOnly);
        return matchesQuery && matchesCategory && matchesStatus && matchesInputMethod;
    });
    const requestedPage = Number.parseInt(filters.page ?? "1", 10);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), pageCount);
    const pageTricks = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const pageHref = (page: number) => {
        const params = new URLSearchParams();
        if (filters.q) params.set("q", filters.q);
        if (filters.category) params.set("category", filters.category);
        if (filters.status) params.set("status", filters.status);
        if (filters.input) params.set("input", filters.input);
        if (page > 1) params.set("page", String(page));
        const queryString = params.toString();
        return queryString ? `/studio/tricks?${queryString}` : "/studio/tricks";
    };

    return (
        <main className={styles.content}>
            <header className={styles.pageHeader}><div><span>Catalogue</span><h1>Tricks</h1><p>{filtered.length} of {tricks?.length ?? 0} tricks</p></div><Link className={styles.primaryButton} href="/studio/tricks/new">Add trick</Link></header>
            <StudioTrickFilters categories={categories ?? []} initialQuery={filters.q ?? ""} initialCategory={filters.category ?? ""} initialStatus={filters.status ?? ""} initialInputMethod={filters.input ?? ""} />
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead><tr><th>Trick</th><th>Category</th><th>Status</th><th>Review</th><th>Updated</th><th></th></tr></thead>
                    <tbody>{pageTricks.length ? pageTricks.map((trick) => {
                        const needsReview = trick.needs_name_review || trick.needs_control_review || trick.needs_description_review;
                        return <tr className={styles.clickableRow} key={trick.id}><td><Link className={styles.rowLink} href={`/studio/tricks/${trick.id}`}><strong>{trick.name}</strong><small>{trick.slug}</small></Link></td><td>{trick.trick_categories?.name ?? "Uncategorised"}</td><td><span className={`${styles.status} ${!trick.is_published ? styles.draft : ""}`}>{trick.is_published ? "Published" : "Draft"}</span></td><td>{needsReview ? <span className={styles.review}>Needs review</span> : <small>Clear</small>}</td><td><small>{new Date(trick.updated_at).toLocaleDateString("en-GB")}</small></td><td><Link className={styles.editLink} href={`/studio/tricks/${trick.id}`}>Edit</Link></td></tr>;
                    }) : <tr><td className={styles.empty} colSpan={6}>No tricks match those filters.</td></tr>}</tbody>
                </table>
            </div>
            {pageCount > 1 && <nav className={styles.pagination} aria-label="Tricks pagination">
                <Link href={pageHref(currentPage - 1)} aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined}>Previous</Link>
                <span>Page {currentPage} of {pageCount}</span>
                <Link href={pageHref(currentPage + 1)} aria-disabled={currentPage === pageCount} tabIndex={currentPage === pageCount ? -1 : undefined}>Next</Link>
            </nav>}
        </main>
    );
}
