/* eslint-disable @next/next/no-img-element -- User uploads have no known intrinsic dimensions. */
"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { Heart, MessageCircle, Plus, Send, Share2, X } from "lucide-react";
import {
  addSocialPostComment,
  toggleSocialPostLike,
} from "@/app/(site)/social/actions";
import {
  Dialog,
  DialogContent as BaseDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  removeSocialMedia,
  uploadSocialMedia,
} from "@/lib/social/upload-media";
import type { SocialPost } from "@/lib/social/get-posts";
import { PostGallery } from "./post-gallery";
import { PostMapDrawer } from "./post-map-drawer";
import { AccountGateDialog } from "@/components/account/account-gate-dialog";
import styles from "./social.module.scss";

const DialogContent = (props: ComponentProps<typeof BaseDialogContent>) => (
  <BaseDialogContent fullscreen {...props} />
);

export function PostInteractions({
  post,
  signedIn,
  open,
  onOpenChange,
}: {
  post: SocialPost;
  signedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast(),
    [liked, setLiked] = useState(post.likedByViewer),
    [likes, setLikes] = useState(post.likes),
    [comments, setComments] = useState(post.commentItems),
    [comment, setComment] = useState(""),
    [attachment, setAttachment] = useState<File | null>(null),
    [preview, setPreview] = useState<string>(),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<number>(),
    [accountGate, setAccountGate] = useState(false);
  const draftKey = `social-comment-draft:${post.id}`;
  useEffect(() => {
    const draft = sessionStorage.getItem(draftKey);
    if (!draft) return;
    queueMicrotask(() => setComment(draft));
  }, [draftKey]);
  const toggleLike = async () => {
    if (!signedIn) {
      toast({
        kind: "info",
        title: "Sign in to like posts",
        description: "Create an account or sign in to join the conversation.",
      });
      return;
    }
    const before = liked;
    setLiked(!before);
    setLikes((count) => count + (before ? -1 : 1));
    const result = await toggleSocialPostLike(post.id);
    if (!result.ok) {
      setLiked(before);
      setLikes((count) => count + (before ? 1 : -1));
      toast({
        kind: "error",
        title: "Couldn’t update like",
        description: result.message,
      });
    }
  };
  const choose = (file?: File) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setAttachment(file);
    setPreview(URL.createObjectURL(file));
  };
  const clearAttachment = () => {
    if (preview) URL.revokeObjectURL(preview);
    setAttachment(null);
    setPreview(undefined);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signedIn) {
      sessionStorage.setItem(draftKey, comment);
      setAccountGate(true);
      return;
    }
    setBusy(true);
    let uploaded: Awaited<ReturnType<typeof uploadSocialMedia>> | undefined;
    try {
      if (attachment) {
        setProgress(0);
        uploaded = await uploadSocialMedia(attachment, setProgress);
      }
      const result = await addSocialPostComment(
        post.id,
        comment,
        uploaded
          ? {
              path: uploaded.path,
              type: uploaded.mediaType,
              mimeType: uploaded.mimeType,
              size: uploaded.size,
            }
          : undefined,
      );
      if (!result.ok || !result.comment) {
        if (uploaded) await removeSocialMedia(uploaded.path);
        toast({
          kind: "error",
          title: "Couldn’t post comment",
          description: result.message,
        });
        return;
      }
      setComments((items) => [...items, result.comment!]);
      setComment("");
      sessionStorage.removeItem(draftKey);
      clearAttachment();
      toast({ kind: "success", title: "Reply posted" });
    } catch (error) {
      if (uploaded) await removeSocialMedia(uploaded.path);
      toast({
        kind: "error",
        title: "Couldn’t upload reply",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
      setProgress(undefined);
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/social#post-${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: `Post by ${post.author.name}`,
          text: post.body.slice(0, 140),
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        toast({ kind: "success", title: "Link copied" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ kind: "error", title: "Couldn’t share this post" });
    }
  };
  return (
    <>
      <footer className={styles.postActions}>
        <button
          type="button"
          onClick={toggleLike}
          data-active={liked}
          aria-pressed={liked}
        >
          <Heart fill={liked ? "currentColor" : "none"} /> {likes}
        </button>
        <button type="button" onClick={() => onOpenChange(true)}>
          <MessageCircle /> {comments.length}
        </button>
        <button type="button" onClick={share}>
          <Share2 /> Share
        </button>
      </footer>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={styles.postFocus} showCloseButton>
          <DialogHeader className={styles.focusHeader}>
            <DialogTitle className={styles.focusLogo}>
              SC<span>+</span>
            </DialogTitle>
            <DialogDescription>Focused post</DialogDescription>
          </DialogHeader>
          <div className={styles.focusLayout}>
            <section className={styles.focusPost}>
              <PostGallery media={post.media} />
            </section>
            <section className={styles.focusDiscussion}>
              <header>
                <strong>Conversation</strong>
                <span>{comments.length}</span>
              </header>
              <div className={styles.commentList}>
                <article className={styles.conversationStarter}>
                  {post.author.avatarUrl ? (
                    <img src={post.author.avatarUrl} alt="" />
                  ) : (
                    <span>{post.author.initials}</span>
                  )}
                  <div>
                    <strong>
                      {post.author.name} <small>@{post.author.handle}</small>
                    </strong>
                    <p>{post.body}</p>
                    <time>
                      {new Date(post.createdAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                </article>
                {post.mapPin && (
                  <PostMapDrawer pin={post.mapPin} variant="preview" />
                )}
                {comments.map((item) => (
                  <article key={item.id}>
                    {item.author.avatarUrl ? (
                      <img src={item.author.avatarUrl} alt="" />
                    ) : (
                      <span>{item.author.name.slice(0, 1).toUpperCase()}</span>
                    )}
                    <div>
                      <strong>
                        {item.author.name} <small>@{item.author.handle}</small>
                      </strong>
                      <p>{item.body}</p>
                      {item.media &&
                        (item.media.type === "video" ? (
                          <video
                            src={item.media.url}
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <img
                            className={styles.commentMedia}
                            src={item.media.url}
                            alt="Reply attachment"
                          />
                        ))}
                      <time>
                        {new Date(item.createdAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                  </article>
                ))}
                {!comments.length && (
                  <p className={styles.emptyComments}>
                    No replies yet. Start the conversation.
                  </p>
                )}
              </div>
              <form className={styles.commentComposer} onSubmit={submit}>
                {preview && (
                  <div className={styles.replyPreview}>
                    {attachment?.type.startsWith("video/") ? (
                      <video src={preview} />
                    ) : (
                      <img src={preview} alt="Reply preview" />
                    )}
                    <button
                      type="button"
                      onClick={clearAttachment}
                      aria-label="Remove attachment"
                    >
                      <X />
                    </button>
                  </div>
                )}
                <div className={styles.replyInput}>
                  {signedIn ? (
                    <label aria-label="Add a photo or video">
                      <Plus />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                        onChange={(event) => choose(event.target.files?.[0])}
                      />
                    </label>
                  ) : (
                    <button
                      className={styles.guestAttachment}
                      type="button"
                      onClick={() => {
                        if (comment) sessionStorage.setItem(draftKey, comment);
                        setAccountGate(true);
                      }}
                      aria-label="Add a photo or video"
                    >
                      <Plus />
                    </button>
                  )}
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
                    placeholder={
                      signedIn ? "Write a reply…" : "Write your reply…"
                    }
                  />
                  <button
                    className={styles.replySubmit}
                    disabled={busy}
                    aria-label={
                      progress !== undefined
                        ? `Uploading ${progress}%`
                        : busy
                          ? "Posting reply"
                          : "Send reply"
                    }
                  >
                    <Send />
                    <span className="sr-only">Send reply</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        </DialogContent>
      </Dialog>
      <AccountGateDialog
        open={accountGate}
        onOpenChange={setAccountGate}
        title="Got something to say?"
        description="Create your free account to comment and join the community."
      />
    </>
  );
}
