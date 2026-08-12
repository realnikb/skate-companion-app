"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import styles from "@/app/studio/studio.module.scss";

type Category = { id: string; name: string };

export function StudioTrickFilters({ categories, initialCategory, initialQuery, initialStatus }: {
    categories: Category[];
    initialCategory: string;
    initialQuery: string;
    initialStatus: string;
}) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);
    const [status, setStatus] = useState(initialStatus);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    function navigate(nextQuery: string, nextCategory: string, nextStatus: string, delay = 0) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            const params = new URLSearchParams();
            if (nextQuery.trim()) params.set("q", nextQuery.trim());
            if (nextCategory) params.set("category", nextCategory);
            if (nextStatus) params.set("status", nextStatus);
            const search = params.toString();
            router.replace(search ? `/studio/tricks?${search}` : "/studio/tricks", { scroll: false });
        }, delay);
    }

    return (
        <form className={styles.toolbar} onSubmit={(event) => { event.preventDefault(); navigate(query, category, status); }}>
            <input
                name="q"
                type="search"
                value={query}
                placeholder="Search name, alias, slug or context…"
                aria-label="Search tricks by name, alias, slug or context"
                onChange={(event) => {
                    const next = event.target.value;
                    setQuery(next);
                    navigate(next, category, status, 200);
                }}
            />
            <select name="category" value={category} aria-label="Filter by category" onChange={(event) => { const next = event.target.value; setCategory(next); navigate(query, next, status); }}>
                <option value="">All categories</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="status" value={status} aria-label="Filter by status" onChange={(event) => { const next = event.target.value; setStatus(next); navigate(query, category, next); }}>
                <option value="">Any status</option><option value="published">Published</option><option value="draft">Drafts</option><option value="review">Needs review</option>
            </select>
            <button type="submit"><Search size={14} /> Find</button>
            {(query || category || status) && <Link href="/studio/tricks" onClick={() => { clearTimeout(timer.current); setQuery(""); setCategory(""); setStatus(""); }}>Clear</Link>}
        </form>
    );
}
