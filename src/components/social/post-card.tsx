import Link from "next/link";
import { ExternalLink,MapPin } from "lucide-react";
import type { SocialPost } from "@/lib/social/get-posts";
import { PostGallery } from "./post-gallery";
import { PostInteractions } from "./post-interactions";
import { PostMapDrawer } from "./post-map-drawer";
import styles from "./social.module.scss";
export function PostCard({post,signedIn=false}:{post:SocialPost;signedIn?:boolean}){const destination=post.author.crewSlug?`/social/crew/${post.author.crewSlug}`:`/social/${post.author.handle}`;return <article className={styles.post} id={`post-${post.id}`}><header><span>{post.author.initials}</span><div><Link href={destination}>{post.author.name}</Link><small>@{post.author.handle} · {new Date(post.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</small></div><i>{post.type}</i></header><p>{post.body}</p>{post.location&&<div className={styles.location}><MapPin/>{post.location}</div>}{post.mapPin&&<PostMapDrawer pin={post.mapPin}/>} {post.tags.length>0&&<div className={styles.featured}><strong>Featuring</strong>{post.tags.map(tag=>tag.crewSlug?<Link href={`/social/crew/${tag.crewSlug}`} key={`${tag.kind}:${tag.id}`}>{tag.name}</Link>:<Link href={`/social/${tag.handle}`} key={`${tag.kind}:${tag.id}`}>@{tag.handle}</Link>)}</div>}<PostGallery media={post.media}/>{post.videoUrl&&!post.uploadedVideo&&<a className={styles.videoLink} href={post.videoUrl} target="_blank" rel="noreferrer">Watch video <ExternalLink/></a>}<PostInteractions post={post} signedIn={signedIn}/></article>}
