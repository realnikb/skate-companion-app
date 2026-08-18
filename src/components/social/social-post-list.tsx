"use client";

import { useState } from "react";
import type { SocialPost } from "@/lib/social/get-posts";
import { DoomScrollFeed } from "./footy-feed";
import { PostCard } from "./post-card";

/** Keeps profile and filtered feeds on the same mobile post viewer as Footy. */
export function SocialPostList({
  posts,
  signedIn = false,
}: {
  posts: SocialPost[];
  signedIn?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const selectedIndex = selectedId
    ? posts.findIndex((post) => post.id === selectedId)
    : -1;
  return (
    <>
      {posts.map((post) => (
        <PostCard
          post={post}
          signedIn={signedIn}
          onOpenMobileFeed={() => setSelectedId(post.id)}
          key={post.id}
        />
      ))}
      {selectedIndex >= 0 && (
        <div
          style={{
            position: "fixed",
            zIndex: 100,
            top: "4.6rem",
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <DoomScrollFeed
            initialPosts={posts}
            initialHasMore={false}
            initialIndex={selectedIndex}
            mode="social"
            signedIn={signedIn}
            onClose={() => setSelectedId(undefined)}
          />
        </div>
      )}
    </>
  );
}
