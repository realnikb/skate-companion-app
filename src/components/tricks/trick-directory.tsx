"use client";

import { ArrowRight, ArrowUpRight, Flame, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { matchesTrickSearch } from "@/lib/tricks/search";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import type { Trick, TrickCategory } from "@/types/trick";
import styles from "./trick-directory.module.scss";
import { hasControls } from "@/lib/tricks/controls";

function popularity(trick: Trick) {
    return trick.viewCount + (trick.favouriteCount * 5);
}

function popularFirst(tricks: Trick[]) {
    return [...tricks].sort((a, b) => popularity(b) - popularity(a) || a.sortOrder - b.sortOrder);
}

function belongsToCategory(trick: Trick, category: TrickCategory, categories: TrickCategory[]) {
    const directCategory = categories.find((item) => item.id === trick.categoryId);
    return trick.categoryId === category.id || directCategory?.parentId === category.id;
}

function categoryCopy(value: string | undefined, fallback: string, category: TrickCategory) {
    return (value || fallback).replaceAll("{category}", category.name);
}

function TrickCard({ categories, priority, trick }: { categories: TrickCategory[]; priority?: boolean; trick: Trick }) {
    const category = categories.find((item) => item.slug === trick.category);
    const categoryName = category?.name ?? trick.category;
    return (
        <article className={styles.card} style={getCategoryTheme(category ?? trick.category)}>
            <Link href={`/tricks/${trick.slug}`} aria-label={`Learn how to do a ${trick.name} in EA Skate`}>
                <div className={styles.image}>
                    {trick.posterUrl ? <Image src={trick.posterUrl} alt={`${trick.name} trick in EA Skate`} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" priority={priority} /> : <div className={styles.fallback}>{trick.name.slice(0, 2)}</div>}
                    <span>{categoryName}</span>
                </div>
                <div className={styles.cardBody}><div><h3>{trick.name}</h3><ArrowUpRight aria-hidden="true" /></div><p>{trick.description}</p><footer>{hasControls(trick.controls) && <span>Controls</span>}{trick.videoUrl && <span>Demo clip</span>}{trick.guideVideoUrl && <span>Video guide</span>}</footer></div>
            </Link>
        </article>
    );
}

function CardGrid({ categories, tricks, priority = false }: { categories: TrickCategory[]; tricks: Trick[]; priority?: boolean }) {
    return <div className={styles.grid}>{tricks.map((trick, index) => <TrickCard categories={categories} trick={trick} priority={priority && index < 3} key={trick.id} />)}</div>;
}

export function TrickDirectory({ activeCategory, categories, tricks }: { activeCategory?: TrickCategory; categories: TrickCategory[]; tricks: Trick[] }) {
    const [query, setQuery] = useState("");
    const searchResults = useMemo(() => query.trim() ? popularFirst(tricks.filter((trick) => matchesTrickSearch(trick, query))) : [], [query, tricks]);
    const ranked = useMemo(() => popularFirst(tricks), [tricks]);

    return (
        <>
            <section className={styles.finder} aria-label="Find an EA Skate trick">
                <div className={styles.searchWrap}><Search aria-hidden="true" /><label className={styles.srOnly} htmlFor="trick-search">Search the EA Skate trick guide</label><input id="trick-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a trick (yes, even aliases like tre flip to find 360 flips)" autoComplete="off" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear trick search"><X /></button>}</div>
                <nav className={styles.filters} aria-label="Browse tricks by type"><Link className={!activeCategory ? styles.activeFilter : ""} href="/tricks">All tricks <span>{activeCategory ? "" : tricks.length}</span></Link>{categories.map((item) => <Link className={activeCategory?.slug === item.slug ? styles.activeFilter : ""} style={getCategoryTheme(item)} href={`/tricks/${item.slug}`} key={item.slug}>{item.name}</Link>)}</nav>
            </section>

            {query.trim() ? (
                <section className={styles.results} aria-labelledby="search-results-heading"><header><div><span>Search results</span><h2 id="search-results-heading">Matches for “{query}”</h2></div><p aria-live="polite">{searchResults.length} {searchResults.length === 1 ? "guide" : "guides"}</p></header>{searchResults.length ? <CardGrid categories={categories} tricks={searchResults} /> : <div className={styles.empty}><Search /><h3>No trick guides found</h3><p>Try another trick name or spelling.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}</section>
            ) : activeCategory ? (
                <div className={styles.directorySections}>
                    <section className={styles.results} aria-labelledby="popular-category-heading"><header><div><span className={styles.popularLabel}><Flame /> Popular tricks</span><h2 id="popular-category-heading" className={styles.categoryHeading} style={getCategoryTheme(activeCategory)}>{categoryCopy(activeCategory.popularHeading, "Popular {category}", activeCategory)}</h2></div></header><CardGrid categories={categories} tricks={ranked.slice(0, 6)} priority /></section>
                    <section className={`${styles.results} ${styles.allGuides}`} aria-labelledby="all-category-heading"><header><div><span>Complete Skatepedia</span><h2 id="all-category-heading" className={styles.categoryHeading} style={getCategoryTheme(activeCategory)}>All {activeCategory.name}</h2></div><p>{tricks.length} guides</p></header><CardGrid categories={categories} tricks={ranked} /></section>
                </div>
            ) : (
                <div className={styles.directorySections}>
                    <section className={styles.results} aria-labelledby="popular-tricks-heading"><header><div><span className={styles.popularLabel}><Flame /> Popular tricks</span><h2 id="popular-tricks-heading">Popular trick guides</h2></div></header><CardGrid categories={categories} tricks={ranked.slice(0, 6)} priority /></section>
                    {categories.map((item) => {
                        const categoryTricks = popularFirst(tricks.filter((trick) => belongsToCategory(trick, item, categories)));
                        if (!categoryTricks.length) return null;
                        return <section className={`${styles.results} ${styles.categorySection}`} aria-labelledby={`category-${item.slug}`} key={item.slug}><header><div><span>Browse by type</span><h2 id={`category-${item.slug}`} className={styles.categoryHeading} style={getCategoryTheme(item)}>{item.name}</h2></div><Link href={`/tricks/${item.slug}`} style={getCategoryTheme(item)}>View all {categoryTricks.length} <ArrowRight /></Link></header>{item.description && <p className={styles.categoryDescription}>{item.description}</p>}<CardGrid categories={categories} tricks={categoryTricks.slice(0, 3)} /></section>;
                    })}
                </div>
            )}
        </>
    );
}
