"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, CalendarDays, Clock3, Flame, Heart, MapPin, MessageCircle, Play, Search, Share2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { CrewLogo } from "./crew-logo";
import { crews, recruitmentLabels, type RecruitmentStatus } from "@/lib/crews/crews";
import styles from "./crew-directory.module.scss";

type Filter = "all" | RecruitmentStatus;

export function CrewDirectory() {
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const visible = useMemo(() => crews.filter((crew) => (filter === "all" || crew.recruitment === filter) && `${crew.name} ${crew.location} ${crew.style.join(" ")} ${crew.languages.map((language) => `${language.name} ${language.code}`).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);
    const toggleLike = (postId: string) => setLikedPosts((current) => {
        const next = new Set(current);
        if (next.has(postId)) next.delete(postId); else next.add(postId);
        return next;
    });

    return <main className={styles.page}>
        <section className={styles.hero}>
            <span className={styles.eyebrow}>The community, organised</span>
            <h1>Find your<br /><em>people.</em></h1>
            <p>Discover crews, watch their latest edits and find the skaters you want to roll with.</p>
            <div className={styles.stats}><span><strong>84</strong> active crews</span><span><strong>1,240</strong> skaters</span><span><strong>17</strong> recruiting now</span></div>
        </section>

        <section className={styles.social}>
            <div className={styles.socialIntro}><div><span className={styles.eyebrow}>Crew pulse</span><h2>What’s happening.</h2></div><p>Fresh clips, sessions and updates from across the community.</p></div>
            <div className={styles.stories} aria-label="Latest crew stories">
                {crews.map((crew) => <Link href={`/crews/${crew.slug}`} key={crew.slug}><span style={{ "--crew-accent": crew.accent } as React.CSSProperties}><CrewLogo initials={crew.initials} accent={crew.accent} size="medium" /></span><strong>{crew.name}</strong><small>{crew.recruitment === "recruiting" ? "Recruiting" : "New update"}</small></Link>)}
            </div>
            <div className={styles.socialGrid}>
                <div className={styles.feed}>
                    <article className={styles.post}>
                        <header><CrewLogo initials="NS" accent="#b8ff35" size="small" /><div><Link href="/crews/night-shift">Night Shift</Link><span>2h · Market Mile</span></div><button>•••</button></header>
                        <p>The city hits different after midnight. Three spots, one battery and a line we’ve been chasing all week. <b>#nightshift</b> <b>#realism</b></p>
                        <div className={`${styles.postMedia} ${styles.nightMedia}`}><span className={styles.mediaLabel}>NEW CREW TAPE</span><strong>LAST TRAIN<br />HOME</strong><button aria-label="Play Last Train Home"><Play fill="currentColor" /></button><small>03:18</small></div>
                        <footer><button data-active={likedPosts.has("night")} onClick={() => toggleLike("night")}><Heart fill={likedPosts.has("night") ? "currentColor" : "none"} /> {likedPosts.has("night") ? 413 : 412}</button><button><MessageCircle /> 28</button><button><Share2 /> Share</button><button aria-label="Save post"><Bookmark /></button></footer>
                    </article>
                    <article className={styles.post}>
                        <header><CrewLogo initials="SR" accent="#79a7ff" size="small" /><div><Link href="/crews/sidewalk-radio">Sidewalk Radio</Link><span>5h · Gullcrest Village</span></div><button>•••</button></header>
                        <p>Open roll-out this Sunday. No tryout, no pressure—just bring a line you’re working on. New skaters welcome. 👋</p>
                        <div className={`${styles.postMedia} ${styles.sessionMedia}`}><span className={styles.mediaLabel}>OPEN SESSION · SUNDAY</span><strong>ROLL OUT<br />07</strong><div className={styles.sessionSpot}><MapPin /> Gullcrest Plaza · 7PM BST</div></div>
                        <footer><button data-active={likedPosts.has("radio")} onClick={() => toggleLike("radio")}><Heart fill={likedPosts.has("radio") ? "currentColor" : "none"} /> {likedPosts.has("radio") ? 99 : 98}</button><button><MessageCircle /> 14</button><button><Share2 /> Share</button><button aria-label="Save post"><Bookmark /></button></footer>
                    </article>
                </div>
                <aside className={styles.rail}>
                    <section><div className={styles.railHeading}><h3>Upcoming sessions</h3><a href="#discover">View all</a></div><article className={styles.event}><span><CalendarDays /></span><div><strong>Sunday Roll Out</strong><small><Clock3 /> Sun 7:00 PM</small><small><MapPin /> Gullcrest Plaza</small></div></article><button className={styles.eventButton}>I’m interested</button></section>
                    <section><div className={styles.railHeading}><h3><Flame /> Trending in crews</h3><a href="#discover">View all</a></div><ol className={styles.trending}><li><b>01</b><span style={{ background: "#435c22" }}>NS</span><div><strong>Last Train Home</strong><small>Night Shift · 18.4k plays</small></div></li><li><b>02</b><span style={{ background: "#60322d" }}>DR</span><div><strong>Twenty Four Rails</strong><small>Dead Rail Society · 12.1k</small></div></li><li><b>03</b><span style={{ background: "#314961" }}>SR</span><div><strong>Sunday Rollout 06</strong><small>Sidewalk Radio · 3.7k</small></div></li></ol></section>
                    <section><div className={styles.railHeading}><h3>Crews to watch</h3><a href="#discover">Discover</a></div><div className={styles.suggestions}>{crews.slice(1,4).map((crew) => <Link href={`/crews/${crew.slug}`} key={crew.slug}><CrewLogo initials={crew.initials} accent={crew.accent} size="small" /><span><strong>{crew.name}</strong><small>{crew.memberCount} members · {crew.languages[0].flag}</small></span><i>{crew.recruitment === "recruiting" ? "Join" : "View"}</i></Link>)}</div></section>
                </aside>
            </div>
        </section>

        <section className={styles.directory} id="discover">
            <div className={styles.toolbar}>
                <div className={styles.filters} aria-label="Filter crews">
                    {(["all", "recruiting", "invite-only", "closed"] as Filter[]).map((value) => <button key={value} data-active={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All crews" : recruitmentLabels[value]}</button>)}
                </div>
                <label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crews, languages, regions…" /></label>
            </div>
            <div className={styles.sectionHeading}><div><span>Community crews</span><h2>Make some noise.</h2></div><small>{visible.length} crews shown</small></div>
            <div className={styles.grid}>
                {visible.map((crew, index) => <Link className={styles.card} href={`/crews/${crew.slug}`} key={crew.slug} style={{ "--crew-accent": crew.accent } as React.CSSProperties}>
                    <div className={styles.cardTop}><CrewLogo initials={crew.initials} accent={crew.accent} size="medium" /><span className={styles.status} data-status={crew.recruitment}><i />{recruitmentLabels[crew.recruitment]}</span></div>
                    <div className={styles.cardNumber}>0{index + 1}</div>
                    <div className={styles.cardBody}><h3>{crew.name}</h3><p>{crew.tagline}</p><div className={styles.tags}>{crew.style.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
                    <div className={styles.languages} aria-label={`Languages spoken: ${crew.languages.map((language) => language.name).join(", ")}`}><small>Languages</small>{crew.languages.map((language) => <span title={language.name} key={language.code}>{language.flag}<i>{language.name}</i></span>)}</div>
                    <div className={styles.cardFooter}><span><Users /> {crew.memberCount} members</span><span>{crew.location}</span><ArrowUpRight /></div>
                </Link>)}
            </div>
            {!visible.length && <div className={styles.empty}>No crews match that search. Try another style or region.</div>}
        </section>
    </main>;
}
