"use client";
import Link from "next/link";
import { ChevronRight,Plus } from "lucide-react";
import { useMemo,useRef,useState } from "react";
import { CrewLogo } from "./crew-logo";
import { PostComposer } from "@/components/social/post-composer";
import { PostCard } from "@/components/social/post-card";
import type { PostMapOption } from "@/components/social/post-map-picker";
import type { PostTagOption } from "@/components/social/post-tag-picker";
import type { Crew } from "@/lib/crews/crews";
import type { SocialPost } from "@/lib/social/get-posts";
import styles from "./crew-directory.module.scss";

type FeedTab="following"|"all"|"crews";
export function CrewDirectory({crews,posts,maps,tagOptions,viewer}:{crews:Crew[];posts:SocialPost[];maps:PostMapOption[];tagOptions:PostTagOption[];viewer?:{name:string;avatarUrl?:string;ownedCrews:{id:string;name:string}[]}}){
const [tab,setTab]=useState<FeedTab>("all"),stories=useRef<HTMLDivElement>(null);
const visible=useMemo(()=>tab==="crews"?posts.filter(post=>Boolean(post.author.crewSlug)):posts,[posts,tab]);
const startPost=()=>{document.getElementById("social-composer")?.scrollIntoView({behavior:"smooth",block:"center"});window.setTimeout(()=>document.querySelector<HTMLTextAreaElement>("#social-composer textarea")?.focus(),450)};
return <main className={styles.page}>
<section className={styles.hero}><span className={styles.eyebrow}>The community, connected</span><h1>See what’s<br/><em>happening.</em></h1><p>Posts from skaters and crews across the whole Skate Companion community.</p></section>
<section className={styles.social}><div className={styles.socialIntro}><div><span className={styles.eyebrow}>Social feed</span><h2>What’s rolling right now.</h2></div></div>
<nav className={styles.feedTabs} aria-label="Filter social feed">{(["following","all","crews"] as FeedTab[]).map(value=><button type="button" data-active={tab===value} onClick={()=>setTab(value)} key={value}>{value[0].toUpperCase()+value.slice(1)}</button>)}</nav>
<div className={styles.crewStrip}><span className={styles.stripLabel}>Your crews</span><div className={styles.stories} ref={stories}><Link className={styles.createCrewStory} href={viewer?"/account/crews/new":"/account/sign-up?next=/account/crews/new"}><span><Plus/></span><strong>Your crew</strong><small>Create</small></Link>{crews.map(crew=><Link className={styles.crewStory} href={`/social/crew/${crew.slug}`} key={crew.id}><span style={{"--crew-accent":crew.accent} as React.CSSProperties}><CrewLogo initials={crew.initials} accent={crew.accent} imageUrl={crew.logoUrl} size="medium"/></span><strong>{crew.name}</strong><small>{crew.recruitment==="recruiting"?"Recruiting":"View crew"}</small></Link>)}</div>{crews.length>3&&<button className={styles.storyNext} type="button" onClick={()=>stories.current?.scrollBy({left:420,behavior:"smooth"})} aria-label="Show more crews"><ChevronRight/></button>}</div>
<div className={styles.socialGrid}><div className={styles.feed}><div id="social-composer">{viewer?<PostComposer playerName={viewer.name} avatarUrl={viewer.avatarUrl} ownedCrews={viewer.ownedCrews} maps={maps} tagOptions={tagOptions}/>:<PostComposer signedIn={false} maps={maps} tagOptions={tagOptions}/>}</div>{tab==="following"&&<p className={styles.feedContext}>Posts from the people and crews you follow</p>}{visible.map(post=><PostCard post={post} signedIn={Boolean(viewer)} key={post.id}/>)}{!visible.length&&<div className={styles.emptyFeed}><strong>Nothing here yet.</strong><span>{tab==="crews"?"Crew posts will appear here as they’re published.":"Follow skaters and crews to shape your feed."}</span></div>}</div><aside className={styles.rail}><section><div className={styles.railHeading}><h3>Crews to watch</h3><Link href="/social/crews">Discover</Link></div><div className={styles.suggestions}>{crews.slice(0,4).map(crew=><Link href={`/social/crew/${crew.slug}`} key={crew.id}><CrewLogo initials={crew.initials} accent={crew.accent} imageUrl={crew.logoUrl} size="small"/><span><strong>{crew.name}</strong><small>{crew.memberCount} members · {crew.languages[0]?.flag}</small></span><i>{crew.recruitment==="recruiting"?"Join":"View"}</i></Link>)}</div></section></aside></div></section>
<button className={styles.newPostButton} type="button" onClick={startPost} aria-label="Create a new post"><Plus/><span>New post</span></button>
</main>}
