"use client";
import Link from "next/link";
import { Users } from "lucide-react";
import { CrewLogo } from "./crew-logo";
import { PostComposer } from "@/components/social/post-composer";
import { PostCard } from "@/components/social/post-card";
import type { PostMapOption } from "@/components/social/post-map-picker";
import type { PostTagOption } from "@/components/social/post-tag-picker";
import type { Crew } from "@/lib/crews/crews";
import type { SocialPost } from "@/lib/social/get-posts";
import styles from "./crew-directory.module.scss";
export function CrewDirectory({crews,posts,maps,tagOptions,viewer}:{crews:Crew[];posts:SocialPost[];maps:PostMapOption[];tagOptions:PostTagOption[];viewer?:{name:string;ownedCrews:{id:string;name:string}[]}}){return <main className={styles.page}>
<section className={styles.hero}><span className={styles.eyebrow}>The community, connected</span><h1>See what’s<br/><em>happening.</em></h1><p>Posts from skaters and crews across the whole Skate Companion community.</p></section>
<section className={styles.social}><div className={styles.socialIntro}><div><span className={styles.eyebrow}>Social feed</span><h2>Everyone’s latest.</h2></div><Link href="/social/crews">Find a crew <Users/></Link></div>{crews.length>0&&<div className={styles.stories}>{crews.map(crew=><Link href={`/social/crew/${crew.slug}`} key={crew.id}><span style={{"--crew-accent":crew.accent} as React.CSSProperties}><CrewLogo initials={crew.initials} accent={crew.accent} imageUrl={crew.logoUrl} size="medium"/></span><strong>{crew.name}</strong><small>{crew.recruitment==="recruiting"?"Recruiting":"View crew"}</small></Link>)}</div>}<div className={styles.socialGrid}><div className={styles.feed}>{viewer?<PostComposer playerName={viewer.name} ownedCrews={viewer.ownedCrews} maps={maps} tagOptions={tagOptions}/>:<PostComposer signedIn={false} maps={maps} tagOptions={tagOptions}/>}{posts.map(post=><PostCard post={post} key={post.id}/>)}</div><aside className={styles.rail}><section><div className={styles.railHeading}><h3>Crews to watch</h3><Link href="/social/crews">Discover</Link></div><div className={styles.suggestions}>{crews.slice(0,4).map(crew=><Link href={`/social/crew/${crew.slug}`} key={crew.id}><CrewLogo initials={crew.initials} accent={crew.accent} imageUrl={crew.logoUrl} size="small"/><span><strong>{crew.name}</strong><small>{crew.memberCount} members · {crew.languages[0]?.flag}</small></span><i>{crew.recruitment==="recruiting"?"Join":"View"}</i></Link>)}</div></section></aside></div></section>
</main>}
