/* eslint-disable @next/next/no-img-element -- Local object URLs have no stable dimensions. */
"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CalendarDays, ImagePlus, MapPin, Send, Users, X } from "lucide-react";
import { createSocialPost, type PostState } from "@/app/(site)/social/actions";
import { removeSocialMedia, uploadSocialMedia } from "@/lib/social/upload-media";
import { PostMapPicker, type PostMapOption } from "./post-map-picker";
import { PostTagPicker, type PostTagOption } from "./post-tag-picker";
import styles from "./social.module.scss";

const initial: PostState = { status: "idle" };
type Mode = "post" | "media" | "session" | "spot";
type Props = { playerName?: string; ownedCrews?: { id: string; name: string }[]; maps?: PostMapOption[]; tagOptions?: PostTagOption[]; signedIn?: boolean };
const acceptedMedia = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];

export function PostComposer({ playerName, ownedCrews = [], maps = [], tagOptions = [], signedIn = true }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("post");
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gate, setGate] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tagPickerKey, setTagPickerKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [state, action, pending] = useActionState(async (previous: PostState, data: FormData): Promise<PostState> => {
    let uploadedPath: string | null = null;
    try {
      if (media) {
        setUploadProgress(0);
        const uploaded = await uploadSocialMedia(media, setUploadProgress);
        uploadedPath = uploaded.path;
        data.delete("media");
        data.set("uploaded_media_path", uploaded.path);
        data.set("uploaded_media_type", uploaded.mediaType);
        data.set("uploaded_media_mime", uploaded.mimeType);
        data.set("uploaded_media_size", String(uploaded.size));
      }
    } catch (error) {
      setUploadProgress(null);
      return { status: "error", message: error instanceof Error ? error.message : "The upload failed. Please try again." };
    }
    const next = await createSocialPost(previous, data);
    if (next.status === "error" && uploadedPath) await removeSocialMedia(uploadedPath);
    setUploadProgress(null);
    if (next.status === "success") {
      form.current?.reset(); setExpanded(false); setMode("post"); setMedia(null); setPreview((url) => { if (url) URL.revokeObjectURL(url); return null; }); setShowMap(false); setTagPickerKey((key) => key + 1);
    }
    return next;
  }, initial);
  const name = playerName ?? "You";

  const engage = (next: Mode) => { setMode(next); setExpanded(true); if (!signedIn) setGate(true); };
  const chooseMedia = () => { engage("media"); if (signedIn) mediaInput.current?.click(); };
  const attach = (file?: File) => {
    if (!file || !acceptedMedia.includes(file.type)) return;
    if (!signedIn) { setGate(true); return; }
    const transfer = new DataTransfer(); transfer.items.add(file);
    if (mediaInput.current) mediaInput.current.files = transfer.files;
    setPreview((url) => { if (url) URL.revokeObjectURL(url); return URL.createObjectURL(file); });
    setMedia(file); setMode("media"); setExpanded(true);
  };

  return <form ref={form} action={action} className={styles.composer} data-dragging={dragging} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); attach(event.dataTransfer.files[0]); }} onSubmit={(event) => { if (!signedIn) { event.preventDefault(); setGate(true); } }}>
    <header><span>{signedIn ? name.slice(0, 1).toUpperCase() : "+"}</span><textarea name="body" required maxLength={2000} rows={1} placeholder={`What's on your mind, ${name}?`} onFocus={() => { setExpanded(true); if (!signedIn) setGate(true); }} /></header>
    <input ref={mediaInput} className={styles.hiddenMediaInput} name="media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={(event) => attach(event.target.files?.[0])} />
    {preview && <div className={styles.mediaPreview}>{media?.type.startsWith("video/") ? <video src={preview} controls /> : <img src={preview} alt="Post upload preview" />}<button type="button" onClick={() => { setMedia(null); setPreview((url) => { if (url) URL.revokeObjectURL(url); return null; }); if (mediaInput.current) mediaInput.current.value = ""; }} aria-label="Remove attachment"><X /></button><span>{media?.name}</span></div>}
    <div className={styles.quickActions}>
      <button type="button" onClick={chooseMedia} data-active={mode === "media"}><ImagePlus />Photo / Video</button>
      <button type="button" onClick={() => engage("session")} data-active={mode === "session"}><CalendarDays />Session</button>
      <button type="button" onClick={() => engage("spot")} data-active={mode === "spot"}><MapPin />Spot</button>
    </div>
    {signedIn && expanded && <>
      <div className={styles.attachmentPanel}>
        {ownedCrews.length > 0 && <label><Users />Post as<select name="identity"><option value="player">{name}</option>{ownedCrews.map((crew) => <option value={`crew:${crew.id}`} key={crew.id}>{crew.name}</option>)}</select></label>}
        <input type="hidden" name="post_type" value={mode === "media" ? "post" : mode} />
        {mode === "session" && <label><CalendarDays />When<input name="session_at" type="datetime-local" /></label>}
        {(mode === "session" || mode === "spot") && <label><MapPin />Location<input name="location" maxLength={120} placeholder="Name this place (optional)" /></label>}
        {(mode === "media" || mode === "session" || mode === "spot") && <button className={styles.mapToggle} type="button" onClick={() => setShowMap((visible) => !visible)} data-active={showMap}><MapPin />{showMap ? "Hide game map" : "Pin on game map"}</button>}
      </div>
      <PostTagPicker key={tagPickerKey} options={tagOptions} />
      {showMap && <PostMapPicker maps={maps} />}
    </>}
    {dragging && <div className={styles.dropPrompt}><ImagePlus /><strong>Drop your photo or video</strong></div>}
    {state.message && <p data-error={state.status === "error"}>{state.message}</p>}
    {uploadProgress!==null&&<div className={styles.uploadProgress}><span style={{width:`${uploadProgress}%`}}/><small>Uploading {uploadProgress}%</small></div>}
    {signedIn && expanded && <button className={styles.publish} disabled={pending}><Send />{uploadProgress!==null?`Uploading ${uploadProgress}%`:pending?"Posting...":"Post"}</button>}
    {gate && <div className={styles.accountGate} role="dialog" aria-modal="true" aria-label="Create an account to post"><button type="button" className={styles.closeGate} onClick={() => setGate(false)} aria-label="Close"><X /></button><span className={styles.gateIcon}><Send /></span><strong>Ready to share it?</strong><p>Create a free account to post photos, videos and updates with the skate community.</p><Link href="/account/sign-up?next=/social">Create free account</Link><Link className={styles.signInLink} href="/account/sign-in?next=/social">I already have an account</Link></div>}
  </form>;
}
