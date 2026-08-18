/* eslint-disable @next/next/no-img-element -- User avatars have no known intrinsic dimensions. */
"use client";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { SocialPost } from "@/lib/social/get-posts";
import { PostGallery } from "./post-gallery";
import { PostInteractions } from "./post-interactions";
import { PostMapDrawer } from "./post-map-drawer";
import styles from "./social.module.scss";
export function PostCard({
  post,
  signedIn = false,
  onOpenMobileFeed,
}: {
  post: SocialPost;
  signedIn?: boolean;
  onOpenMobileFeed?: () => void;
}) {
  const [focused, setFocused] = useState(false),
    destination = post.author.crewSlug
      ? `/social/crew/${post.author.crewSlug}`
      : `/social/${post.author.handle}`,
    hasVideo = post.media.some((item) => item.type === "video");
  const openPost = () => {
    if (window.matchMedia("(max-width: 760px)").matches && onOpenMobileFeed) {
      onOpenMobileFeed();
      return;
    }
    setFocused(true);
  };
  return (
    <article className={styles.post} id={`post-${post.id}`}>
      <header onClick={openPost}>
        {post.author.avatarUrl ? (
          <img
            className={styles.postAvatar}
            src={post.author.avatarUrl}
            alt=""
          />
        ) : (
          <span>{post.author.initials}</span>
        )}
        <div>
          <Link href={destination} onClick={(event) => event.stopPropagation()}>
            {post.author.name}
          </Link>
          <small>
            @{post.author.handle} ·{" "}
            {new Date(post.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </small>
        </div>
      </header>
      <p className={styles.postBody} onClick={openPost}>
        {post.body}
      </p>
      {post.location && (
        <div className={styles.location}>
          <MapPin />
          {post.location}
        </div>
      )}
      {post.mapPin && <PostMapDrawer pin={post.mapPin} />}{" "}
      {post.tags.length > 0 && (
        <div className={styles.featured}>
          <strong>Featuring</strong>
          {post.tags.map((tag) =>
            tag.crewSlug ? (
              <Link
                href={`/social/crew/${tag.crewSlug}`}
                key={`${tag.kind}:${tag.id}`}
              >
                {tag.name}
              </Link>
            ) : (
              <Link
                href={`/social/${tag.handle}`}
                key={`${tag.kind}:${tag.id}`}
              >
                @{tag.handle}
              </Link>
            ),
          )}
        </div>
      )}
      <div
        className={`${styles.galleryFocus} ${hasVideo ? styles.galleryFocusVideo : ""}`}
        onClick={openPost}
      >
        <PostGallery media={post.media} variant="collage" />
      </div>
      {post.videoUrl && !post.uploadedVideo && (
        <a
          className={styles.videoLink}
          href={post.videoUrl}
          target="_blank"
          rel="noreferrer"
        >
          Watch video <ExternalLink />
        </a>
      )}
      <PostInteractions
        post={post}
        signedIn={signedIn}
        open={focused}
        onOpenChange={setFocused}
      />
    </article>
  );
}
