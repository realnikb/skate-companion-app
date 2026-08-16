"use client";

import Link from "next/link";
import { ArrowUpRight, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { CrewLogo } from "./crew-logo";
import { crews, recruitmentLabels, type RecruitmentStatus } from "@/lib/crews/crews";
import styles from "./crew-directory.module.scss";

type Filter = "all" | RecruitmentStatus;

export function CrewDirectory() {
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const visible = useMemo(() => crews.filter((crew) => (filter === "all" || crew.recruitment === filter) && `${crew.name} ${crew.location} ${crew.style.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);

    return <main className={styles.page}>
        <section className={styles.hero}>
            <span className={styles.eyebrow}>The community, organised</span>
            <h1>Find your<br /><em>people.</em></h1>
            <p>Discover crews, watch their latest edits and find the skaters you want to roll with.</p>
            <div className={styles.stats}><span><strong>84</strong> active crews</span><span><strong>1,240</strong> skaters</span><span><strong>17</strong> recruiting now</span></div>
        </section>

        <section className={styles.directory}>
            <div className={styles.toolbar}>
                <div className={styles.filters} aria-label="Filter crews">
                    {(["all", "recruiting", "invite-only", "closed"] as Filter[]).map((value) => <button key={value} data-active={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All crews" : recruitmentLabels[value]}</button>)}
                </div>
                <label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crews, styles, regions…" /></label>
            </div>
            <div className={styles.sectionHeading}><div><span>Community crews</span><h2>Make some noise.</h2></div><small>{visible.length} crews shown</small></div>
            <div className={styles.grid}>
                {visible.map((crew, index) => <Link className={styles.card} href={`/crews/${crew.slug}`} key={crew.slug} style={{ "--crew-accent": crew.accent } as React.CSSProperties}>
                    <div className={styles.cardTop}><CrewLogo initials={crew.initials} accent={crew.accent} size="medium" /><span className={styles.status} data-status={crew.recruitment}><i />{recruitmentLabels[crew.recruitment]}</span></div>
                    <div className={styles.cardNumber}>0{index + 1}</div>
                    <div className={styles.cardBody}><h3>{crew.name}</h3><p>{crew.tagline}</p><div className={styles.tags}>{crew.style.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
                    <div className={styles.cardFooter}><span><Users /> {crew.memberCount} members</span><span>{crew.location}</span><ArrowUpRight /></div>
                </Link>)}
            </div>
            {!visible.length && <div className={styles.empty}>No crews match that search. Try another style or region.</div>}
        </section>
    </main>;
}
