"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft,Heart,MessageCircle,Share2,Volume2,VolumeX } from "lucide-react";
import { useEffect,useRef,useState } from "react";
import { loadMoreFootyPosts,toggleSocialPostLike } from "@/app/(site)/social/actions";
import { useToast } from "@/components/ui/toast";
import type { SocialPost } from "@/lib/social/get-posts";
import styles from "./footy-feed.module.scss";

const clipFor=(post:SocialPost)=>post.media.find(item=>item.type==="video")?.url??post.videoUrl;

function FootyClip({post,signedIn,muted,onMutedChange}:{post:SocialPost;signedIn:boolean;muted:boolean;onMutedChange:(muted:boolean)=>void}){
  const toast=useToast(),[liked,setLiked]=useState(post.likedByViewer),[likes,setLikes]=useState(post.likes),video=clipFor(post);
  const destination=post.author.crewSlug?`/social/crew/${post.author.crewSlug}`:`/social/${post.author.handle}`;
  const toggleLike=async()=>{if(!signedIn){toast({kind:"info",title:"Sign in to like clips",description:"Create an account or sign in to join the community."});return}const before=liked;setLiked(!before);setLikes(value=>value+(before?-1:1));const result=await toggleSocialPostLike(post.id);if(!result.ok){setLiked(before);setLikes(value=>value+(before?1:-1));toast({kind:"error",title:"Couldn’t update like",description:result.message})}};
  const share=async()=>{const url=`${window.location.origin}/social#post-${post.id}`;try{if(navigator.share)await navigator.share({title:`Clip by ${post.author.name}`,text:post.body.slice(0,140),url});else{await navigator.clipboard.writeText(url);toast({kind:"success",title:"Link copied"})}}catch(error){if(!(error instanceof DOMException&&error.name==="AbortError"))toast({kind:"error",title:"Couldn’t share this clip"})}};
  if(!video)return null;
  return <article className={styles.clip} data-footy-clip>
    <video src={video} muted={muted} loop playsInline preload="metadata" onClick={event=>event.currentTarget.paused?void event.currentTarget.play():event.currentTarget.pause()}/>
    <div className={styles.shade}/>
    <div className={styles.details}><Link href={destination} className={styles.author}>{post.author.avatarUrl?<Image src={post.author.avatarUrl} alt="" width={45} height={45} unoptimized/>:<span>{post.author.initials}</span>}<span><strong>{post.author.name}</strong><small>@{post.author.handle}</small></span></Link><p>{post.body}</p>{post.location&&<small className={styles.location}>{post.location}</small>}</div>
    <div className={styles.actions}><button type="button" onClick={toggleLike} data-active={liked} aria-label={`${likes} likes`}><span><Heart fill={liked?"currentColor":"none"}/></span><strong>{likes}</strong></button><Link href={`/social#post-${post.id}`} aria-label={`${post.comments} comments`}><span><MessageCircle/></span><strong>{post.comments}</strong></Link><button type="button" onClick={share} aria-label="Share clip"><span><Share2/></span><strong>Share</strong></button><button type="button" onClick={()=>onMutedChange(!muted)} aria-label={muted?"Turn sound on":"Mute sound"}><span>{muted?<VolumeX/>:<Volume2/>}</span><strong>{muted?"Muted":"Sound"}</strong></button></div>
  </article>;
}

export function FootyFeed({initialPosts,initialHasMore,signedIn}:{initialPosts:SocialPost[];initialHasMore:boolean;signedIn:boolean}){
  const [posts,setPosts]=useState(initialPosts),[hasMore,setHasMore]=useState(initialHasMore),[loading,setLoading]=useState(false),[muted,setMuted]=useState(true),feed=useRef<HTMLElement>(null),sentinel=useRef<HTMLDivElement>(null),offset=useRef(initialPosts.length),loadingRef=useRef(false);
  useEffect(()=>{const root=feed.current;if(!root)return;const observer=new IntersectionObserver(entries=>{for(const entry of entries){const video=entry.target.querySelector("video");if(!(video instanceof HTMLVideoElement))continue;if(entry.isIntersecting&&entry.intersectionRatio>=.7)void video.play().catch(()=>{});else video.pause()}},{root,threshold:[.25,.7]});root.querySelectorAll("[data-footy-clip]").forEach(item=>observer.observe(item));return()=>observer.disconnect()},[posts]);
  useEffect(()=>{const target=sentinel.current,root=feed.current;if(!target||!root||!hasMore)return;const observer=new IntersectionObserver(async entries=>{if(!entries[0]?.isIntersecting||loadingRef.current)return;loadingRef.current=true;setLoading(true);try{const page=await loadMoreFootyPosts(offset.current);setPosts(current=>{const known=new Set(current.map(post=>post.id)),fresh=page.posts.filter(post=>!known.has(post.id));offset.current+=page.posts.length;return [...current,...fresh]});setHasMore(page.hasMore)}finally{loadingRef.current=false;setLoading(false)}},{root,rootMargin:"100% 0px"});observer.observe(target);return()=>observer.disconnect()},[hasMore]);
  if(!posts.length)return <main className={styles.empty}><Link href="/social"><ArrowLeft/>Social feed</Link><div><strong>No footy yet.</strong><p>Post a video to start the community clip feed.</p></div></main>;
  return <main className={styles.page}><header><Link href="/social"><ArrowLeft/>Social</Link><div><strong>Footy</strong><small>Swipe for the next clip</small></div></header><section className={styles.feed} ref={feed}>{posts.map(post=><FootyClip post={post} signedIn={signedIn} muted={muted} onMutedChange={setMuted} key={post.id}/>)}<div className={styles.loader} ref={sentinel} aria-live="polite">{loading&&<span>Loading more footy…</span>}</div></section></main>;
}
