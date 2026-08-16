import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Bell, ExternalLink, MapPin, Play, Users } from "lucide-react";

import { CrewLogo } from "@/components/crews/crew-logo";
import { crews, getCrew, recruitmentLabels } from "@/lib/crews/crews";
import styles from "./crew.module.scss";

export function generateStaticParams() { return crews.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: PageProps<"/crews/[slug]">): Promise<Metadata> {
    const crew = getCrew((await params).slug);
    return crew ? { title: `${crew.name} | Crews`, description: crew.description } : {};
}

export default async function CrewPage({ params }: PageProps<"/crews/[slug]">) {
    const crew = getCrew((await params).slug);
    if (!crew) notFound();
    return <main className={styles.page} style={{ "--crew-accent": crew.accent } as React.CSSProperties}>
        <section className={styles.hero}>
            <Link className={styles.back} href="/crews"><ArrowLeft /> All crews</Link>
            <div className={styles.glow} />
            <div className={styles.identity}><CrewLogo initials={crew.initials} accent={crew.accent} /><div><span className={styles.status} data-status={crew.recruitment}><i />{recruitmentLabels[crew.recruitment]}</span><h1>{crew.name}</h1><p>{crew.tagline}</p></div></div>
            <div className={styles.actions}>{crew.recruitment === "recruiting" ? <Link href="/account/sign-in">Apply to crew <ArrowUpRight /></Link> : crew.recruitment === "closed" ? <button><Bell /> Notify me when recruiting</button> : <button><Bell /> Follow crew</button>}</div>
        </section>
        <nav className={styles.subnav}><a href="#latest">Latest</a><a href="#about">About</a><a href="#roster">Roster</a><a href="#links">Links</a></nav>
        <div className={styles.content}>
            <section className={styles.main}>
                <div className={styles.heading} id="latest"><div><span>From the crew</span><h2>Latest videos</h2></div><small>{crew.videos.length} releases</small></div>
                <div className={styles.videos}>{crew.videos.map((video, index) => <article className={index === 0 ? styles.featuredVideo : ""} key={video.title} style={{ "--video-color": video.color } as React.CSSProperties}><div className={styles.thumbnail}><span>{crew.initials}</span><button aria-label={`Play ${video.title}`}><Play fill="currentColor" /></button><small>{video.duration}</small></div><div><span>{video.type}</span><h3>{video.title}</h3><p>{video.plays} plays</p></div></article>)}</div>
                <div className={styles.heading} id="roster"><div><span>Who’s involved</span><h2>Crew roster</h2></div><small>{crew.memberCount} members</small></div>
                <div className={styles.roster}>{crew.members.map((member) => <article key={member.handle}><span>{member.displayName.slice(0, 1)}</span><div><strong>{member.displayName}</strong><small>@{member.handle}</small></div><em data-owner={member.role === "Owner"}>{member.role}</em></article>)}</div>
            </section>
            <aside>
                <section id="about"><span>About the crew</span><p>{crew.description}</p><dl><div><dt><Users /> Crew size</dt><dd>{crew.memberCount} skaters</dd></div><div><dt><MapPin /> Based in</dt><dd>{crew.location}</dd></div></dl></section>
                <section className={styles.languagePanel}><span>Languages spoken</span><div>{crew.languages.map((language) => <p key={language.code}><i aria-hidden="true">{language.flag}</i><strong>{language.name}</strong><small>{language.code.toUpperCase()}</small></p>)}</div></section>
                <section className={styles.owner}><span>Run by</span><div><i>{crew.owner.displayName.slice(0,1)}</i><p><strong>{crew.owner.displayName}</strong><small>@{crew.owner.handle} · Crew owner</small></p><ArrowUpRight /></div><small>Ownership is verified by Skate Companion</small></section>
                <section id="links"><span>Find them online</span><div className={styles.links}>{crew.socials.map((social) => <a href={social.href} target="_blank" rel="noreferrer" key={social.label}>{social.label}<ExternalLink /></a>)}</div></section>
                <section className={styles.recruitment}><span>Recruitment</span><h3>{recruitmentLabels[crew.recruitment]}</h3><p>{crew.recruitment === "recruiting" ? "Looking for active skaters who care about filming, grounded style and a good session." : crew.recruitment === "invite-only" ? "The crew is not accepting applications, but may invite skaters they meet in the community." : "This crew’s roster is currently full. Follow them to hear when entries reopen."}</p></section>
            </aside>
        </div>
    </main>;
}
