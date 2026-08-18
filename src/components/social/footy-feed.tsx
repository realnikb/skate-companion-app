/* eslint-disable @next/next/no-img-element -- Comment media can have unknown intrinsic dimensions. */
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Heart,
  MessageCircle,
  SquarePen,
  Send,
  Share2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  addSocialPostComment,
  loadMoreFootyPosts,
  toggleSocialPostLike,
} from "@/app/(site)/social/actions";
import { AccountGateDialog } from "@/components/account/account-gate-dialog";
import { useToast } from "@/components/ui/toast";
import type { SocialPost } from "@/lib/social/get-posts";
import { PostMapDrawer } from "./post-map-drawer";
import styles from "./footy-feed.module.scss";

const clipFor = (post: SocialPost) =>
  post.media.find((item) => item.type === "video")?.url ?? post.videoUrl;
const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function Avatar({
  name,
  url,
  size = 38,
}: {
  name: string;
  url?: string;
  size?: number;
}) {
  return url ? (
    <Image src={url} alt="" width={size} height={size} unoptimized />
  ) : (
    <span>
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}

function FootyComments({
  post,
  signedIn,
  onClose,
  onCommentAdded,
}: {
  post: SocialPost;
  signedIn: boolean;
  onClose: () => void;
  onCommentAdded: (comment: SocialPost["commentItems"][number]) => void;
}) {
  const toast = useToast(),
    [comments, setComments] = useState(post.commentItems),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [accountGate, setAccountGate] = useState(false),
    list = useRef<HTMLDivElement>(null);
  const draftKey = `social-comment-draft:${post.id}`;
  useEffect(() => {
    const draft = sessionStorage.getItem(draftKey);
    if (draft) queueMicrotask(() => setComment(draft));
  }, [draftKey]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signedIn) {
      sessionStorage.setItem(draftKey, comment);
      setAccountGate(true);
      return;
    }
    setBusy(true);
    try {
      const result = await addSocialPostComment(post.id, comment);
      if (!result.ok || !result.comment) {
        toast({
          kind: "error",
          title: "Couldn’t post comment",
          description: result.message,
        });
        return;
      }
      setComments((items) => [...items, result.comment!]);
      onCommentAdded(result.comment);
      setComment("");
      sessionStorage.removeItem(draftKey);
      requestAnimationFrame(() =>
        list.current?.scrollTo({
          top: list.current.scrollHeight,
          behavior: "smooth",
        }),
      );
      toast({ kind: "success", title: "Comment posted" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside
      className={styles.comments}
      aria-label={`Comments on ${post.author.name}'s clip`}
    >
      <header>
        <div>
          <strong>Comments</strong>
          <span>{comments.length}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close comments">
          <X />
        </button>
      </header>
      <div className={styles.commentList} ref={list}>
        {post.mapPin && <PostMapDrawer pin={post.mapPin} variant="preview" />}
        {comments.map((item) => (
          <article key={item.id}>
            <div className={styles.commentAvatar}>
              <Avatar name={item.author.name} url={item.author.avatarUrl} />
            </div>
            <div>
              <p>
                <strong>{item.author.name}</strong>
                <small>
                  @{item.author.handle} · {formatDate(item.createdAt)}
                </small>
              </p>
              <div className={styles.commentBody}>{item.body}</div>
              {item.media &&
                (item.media.type === "video" ? (
                  <video src={item.media.url} controls preload="metadata" />
                ) : (
                  <img src={item.media.url} alt="Comment attachment" />
                ))}
            </div>
          </article>
        ))}
        {!comments.length && (
          <div className={styles.noComments}>
            <MessageCircle />
            <strong>Start the conversation</strong>
            <p>Be the first to leave a comment on this footy.</p>
          </div>
        )}
      </div>
      <form className={styles.commentForm} onSubmit={submit}>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          required
          maxLength={2000}
          placeholder={signedIn ? "Add a comment…" : "Write a comment…"}
        />
        <button
          disabled={busy || !comment.trim()}
          aria-label={busy ? "Posting comment" : "Post comment"}
        >
          <Send />
        </button>
      </form>
      <AccountGateDialog
        open={accountGate}
        onOpenChange={setAccountGate}
        title="Got something to say?"
        description="Create your free account to comment and join the community."
      />
    </aside>
  );
}

function FootyClip({
  post,
  signedIn,
  muted,
  onMutedChange,
  onOpenComments,
  onOpenAccountGate,
}: {
  post: SocialPost;
  signedIn: boolean;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  onOpenComments: () => void;
  onOpenAccountGate: () => void;
}) {
  const toast = useToast(),
    [liked, setLiked] = useState(post.likedByViewer),
    [likes, setLikes] = useState(post.likes),
    video = clipFor(post);
  const destination = post.author.crewSlug
    ? `/social/crew/${post.author.crewSlug}`
    : `/social/${post.author.handle}`;
  const toggleLike = async () => {
    if (!signedIn) {
      toast({
        kind: "info",
        title: "Sign in to like clips",
        description: "Create an account or sign in to join the community.",
      });
      return;
    }
    const before = liked;
    setLiked(!before);
    setLikes((value) => value + (before ? -1 : 1));
    const result = await toggleSocialPostLike(post.id);
    if (!result.ok) {
      setLiked(before);
      setLikes((value) => value + (before ? 1 : -1));
      toast({
        kind: "error",
        title: "Couldn’t update like",
        description: result.message,
      });
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/social#post-${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: `Clip by ${post.author.name}`,
          text: post.body.slice(0, 140),
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        toast({ kind: "success", title: "Link copied" });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast({ kind: "error", title: "Couldn’t share this clip" });
    }
  };
  const togglePlayback = (target: HTMLVideoElement) => {
    const clip = target.closest("[data-footy-clip]");
    clip
      ?.querySelectorAll("video")
      .forEach((item) => (target.paused ? void item.play() : item.pause()));
  };
  if (!video) return null;
  return (
    <article className={styles.clip} data-footy-clip>
      <video
        className={styles.videoBackdrop}
        style={{ zIndex: 0 }}
        src={video}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <video
        className={styles.videoMain}
        style={{ zIndex: 1 }}
        src={video}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={(event) => togglePlayback(event.currentTarget)}
      />
      <div className={styles.shade} style={{ zIndex: 2 }} />
      <div className={styles.details} style={{ zIndex: 3 }}>
        <Link href={destination} className={styles.author}>
          <Avatar
            name={post.author.name}
            url={post.author.avatarUrl}
            size={45}
          />
          <span>
            <strong>{post.author.name}</strong>
            <small>@{post.author.handle}</small>
          </span>
        </Link>
        <p>{post.body}</p>
        {post.location && (
          <small className={styles.location}>{post.location}</small>
        )}
      </div>
      <div className={styles.actions} style={{ zIndex: 3 }}>
        <Link
          href="/social#social-composer"
          className={styles.createPost}
          aria-label="Create a new post"
          onClick={(event) => {
            if (!signedIn) {
              event.preventDefault();
              onOpenAccountGate();
            }
          }}
        >
          <SquarePen />
        </Link>
        <button
          type="button"
          onClick={toggleLike}
          data-active={liked}
          aria-label={`${likes} likes`}
        >
          <span>
            <Heart fill={liked ? "currentColor" : "none"} />
          </span>
          <strong>{likes}</strong>
        </button>
        <button
          type="button"
          onClick={onOpenComments}
          aria-label={`${post.comments} comments`}
        >
          <span>
            <MessageCircle />
          </span>
          <strong>{post.comments}</strong>
        </button>
        <button type="button" onClick={share} aria-label="Share clip">
          <span>
            <Share2 />
          </span>
          <strong>Share</strong>
        </button>
        <button
          type="button"
          onClick={() => onMutedChange(!muted)}
          aria-label={muted ? "Turn sound on" : "Mute sound"}
        >
          <span>{muted ? <VolumeX /> : <Volume2 />}</span>
          <strong>{muted ? "Muted" : "Sound"}</strong>
        </button>
      </div>
    </article>
  );
}

export function FootyFeed({
  initialPosts,
  initialHasMore,
  signedIn,
}: {
  initialPosts: SocialPost[];
  initialHasMore: boolean;
  signedIn: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts),
    [hasMore, setHasMore] = useState(initialHasMore),
    [loading, setLoading] = useState(false),
    [muted, setMuted] = useState(true),
    [commentPostId, setCommentPostId] = useState<string>(),
    [composeAccountGate, setComposeAccountGate] = useState(false),
    [activeIndex, setActiveIndex] = useState(0),
    feed = useRef<HTMLElement>(null),
    sentinel = useRef<HTMLDivElement>(null),
    offset = useRef(initialPosts.length),
    loadingRef = useRef(false);
  const commentPost = posts.find((post) => post.id === commentPostId);
  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const videos = entry.target.querySelectorAll("video");
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7)
            videos.forEach((video) => void video.play().catch(() => {}));
          else videos.forEach((video) => video.pause());
        }
      },
      { root, threshold: [0.25, 0.7] },
    );
    root
      .querySelectorAll("[data-footy-clip]")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [posts]);
  useEffect(() => {
    const target = sentinel.current,
      root = feed.current;
    if (!target || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
          const page = await loadMoreFootyPosts(offset.current);
          setPosts((current) => {
            const known = new Set(current.map((post) => post.id)),
              fresh = page.posts.filter((post) => !known.has(post.id));
            offset.current += page.posts.length;
            return [...current, ...fresh];
          });
          setHasMore(page.hasMore);
        } finally {
          loadingRef.current = false;
          setLoading(false);
        }
      },
      { root, rootMargin: "100% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore]);
  const move = (direction: -1 | 1) => {
    const root = feed.current;
    if (root)
      root.scrollTo({
        top: (activeIndex + direction) * root.clientHeight,
        behavior: "smooth",
      });
  };
  const addComment = (item: SocialPost["commentItems"][number]) =>
    setPosts((current) =>
      current.map((post) =>
        post.id === commentPostId
          ? {
              ...post,
              comments: post.comments + 1,
              commentItems: [...post.commentItems, item],
            }
          : post,
      ),
    );
  if (!posts.length)
    return (
      <main className={styles.empty}>
        <Link href="/social">
          <ArrowLeft />
          Social feed
        </Link>
        <div>
          <strong>No footy yet.</strong>
          <p>Post a video to start the community clip feed.</p>
        </div>
      </main>
    );
  return (
    <main className={styles.page} data-comments-open={Boolean(commentPost)}>
      <header>
        <Link href="/social">
          <ArrowLeft />
          Social
        </Link>
        <div>
          <strong>Footy</strong>
          <small>Swipe for the next clip</small>
        </div>
      </header>
      <div className={styles.stage}>
        <section
          className={styles.feed}
          ref={feed}
          onScroll={(event) =>
            setActiveIndex(
              Math.max(
                0,
                Math.min(
                  posts.length - 1,
                  Math.round(
                    event.currentTarget.scrollTop /
                      event.currentTarget.clientHeight,
                  ),
                ),
              ),
            )
          }
        >
          {posts.map((post) => (
            <FootyClip
              post={post}
              signedIn={signedIn}
              muted={muted}
              onMutedChange={setMuted}
              onOpenComments={() => setCommentPostId(post.id)}
              onOpenAccountGate={() => setComposeAccountGate(true)}
              key={post.id}
            />
          ))}
          <div className={styles.loader} ref={sentinel} aria-live="polite">
            {loading && <span>Loading more footy…</span>}
          </div>
        </section>
        {commentPost && (
          <FootyComments
            key={commentPost.id}
            post={commentPost}
            signedIn={signedIn}
            onClose={() => setCommentPostId(undefined)}
            onCommentAdded={addComment}
          />
        )}
      </div>
      <nav className={styles.clipNav} aria-label="Clip navigation">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={activeIndex === 0}
          aria-label="Previous clip"
        >
          <ArrowUp />
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={activeIndex === posts.length - 1 && !hasMore}
          aria-label="Next clip"
        >
          <ArrowDown />
        </button>
      </nav>
      <AccountGateDialog
        open={composeAccountGate}
        onOpenChange={setComposeAccountGate}
        title="Ready to share it?"
        description="Create a free account to post photos, videos and updates with the skate community."
        nextPath="/social#social-composer"
      />
    </main>
  );
}
