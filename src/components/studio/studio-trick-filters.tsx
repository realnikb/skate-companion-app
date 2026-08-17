"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import styles from "@/app/studio/studio.module.scss";

type Category = { id: string; name: string };

export function StudioTrickFilters({ categories, initialCategory, initialInputMethod, initialQuery, initialStatus }: {
    categories: Category[];
    initialCategory: string;
    initialInputMethod: string;
    initialQuery: string;
    initialStatus: string;
}) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);
    const [inputMethod, setInputMethod] = useState(initialInputMethod);
    const [status, setStatus] = useState(initialStatus);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    function navigate(nextQuery: string, nextCategory: string, nextStatus: string, nextInputMethod: string, delay = 0) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            const params = new URLSearchParams();
            if (nextQuery.trim()) params.set("q", nextQuery.trim());
            if (nextCategory) params.set("category", nextCategory);
            if (nextStatus) params.set("status", nextStatus);
            if (nextInputMethod) params.set("input", nextInputMethod);
            const search = params.toString();
            router.replace(search ? `/studio/tricks?${search}` : "/studio/tricks", { scroll: false });
        }, delay);
    }

    return (
        <form className={styles.toolbar} onSubmit={(event) => { event.preventDefault(); navigate(query, category, status, inputMethod); }}>
            <input
                name="q"
                type="search"
                value={query}
                placeholder="Search name, alias, slug or context…"
                aria-label="Search tricks by name, alias, slug or context"
                onChange={(event) => {
                    const next = event.target.value;
                    setQuery(next);
                    navigate(next, category, status, inputMethod, 200);
                }}
            />
            <select name="category" value={category} aria-label="Filter by category" onChange={(event) => { const next = event.target.value; setCategory(next); navigate(query, next, status, inputMethod); }}>
                <option value="">All categories</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="status" value={status} aria-label="Filter by status" onChange={(event) => { const next = event.target.value; setStatus(next); navigate(query, category, next, inputMethod); }}>
                <option value="">Any status</option><option value="published">Published</option><option value="draft">Drafts</option><option value="review">Needs review</option>
            </select>
            <select name="input" value={inputMethod} aria-label="Filter by input method" onChange={(event) => { const next = event.target.value; setInputMethod(next); navigate(query, category, status, next); }}>
                <option value="">Any input method</option><option value="legacy-reference">Old screenshot only</option>
            </select>
            <button type="submit"><Search size={14} /> Find</button>
            {(query || category || status || inputMethod) && <Link href="/studio/tricks" onClick={() => { clearTimeout(timer.current); setQuery(""); setCategory(""); setStatus(""); setInputMethod(""); }}>Clear</Link>}
        </form>
    );
}
