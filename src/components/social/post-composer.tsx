"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CalendarDays, FileText, ImagePlus, MapPin, Send, Video, X } from "lucide-react";
import { createSocialPost, type PostState } from "@/app/(site)/social/actions";
import { PostMapPicker, type PostMapOption } from "./post-map-picker";
import { PostTagPicker, type PostTagOption } from "./post-tag-picker";
import styles from "./social.module.scss";

const initial: PostState = { status: "idle" };
type Mode = "text" | "media" | "session" | "spot";
type Props = { playerName?: string; ownedCrews?: { id: string; name: string }[]; maps?: PostMapOption[]; tagOptions?: PostTagOption[]; signedIn?: boolean };

export function PostComposer({ playerName, ownedCrews = [], maps = [], tagOptions = [], signedIn = true }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [gate, setGate] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tagPickerKey, setTagPickerKey] = useState(0);
  const [state, action, pending] = useActionState(async (previous: PostState, data: FormData) => {
    const next = await createSocialPost(previous, data);
    if (next.status === "success") { form.current?.reset(); setShowMap(false); setTagPickerKey((key) => key + 1); }
    return next;
  }, initial);
  const name = playerName ?? "You";
  const engage = (next: Mode) => { setMode(next); if (!signedIn) setGate(true); };

  return <form ref={form} action={action} className={styles.composer} onSubmit={(event) => { if (!signedIn) { event.preventDefault(); setGate(true); } }}>
    <header><span>{signedIn ? name.slice(0, 1).toUpperCase() : "+"}</span><textarea name="body" required maxLength={2000} placeholder="What's good?" onFocus={() => { if (!signedIn) setGate(true); }} /></header>
    <div className={styles.quickActions}>
      <button type="button" onClick={() => engage("media")} data-active={mode === "media"}><ImagePlus />Photo / Video</button>
      <button type="button" onClick={() => engage("text")} data-active={mode === "text"}><FileText />Text</button>
      <button type="button" onClick={() => engage("session")} data-active={mode === "session"}><CalendarDays />Session</button>
      <button type="button" onClick={() => engage("spot")} data-active={mode === "spot"}><MapPin />Spot</button>
    </div>
    {signedIn && <>
      <div className={styles.attachmentPanel}>
        <label>Post as<select name="identity"><option value="player">{name}</option>{ownedCrews.map((crew) => <option value={`crew:${crew.id}`} key={crew.id}>{crew.name}</option>)}</select></label>
        <input type="hidden" name="post_type" value={mode === "media" ? "video" : mode === "text" ? "post" : mode} />
        {mode === "media" && <><label className={styles.file}><ImagePlus />Choose photo<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label><label><Video />Video link<input name="external_video_url" type="url" placeholder="YouTube, Vimeo..." /></label></>}
        {mode === "session" && <label><CalendarDays />When<input name="session_at" type="datetime-local" /></label>}
        {(mode === "session" || mode === "spot") && <label><MapPin />Location<input name="location" maxLength={120} placeholder="Name this place (optional)" /></label>}
        {(mode === "media" || mode === "session" || mode === "spot") && <button className={styles.mapToggle} type="button" onClick={() => setShowMap((visible) => !visible)} data-active={showMap}><MapPin />{showMap ? "Hide game map" : "Pin on game map"}</button>}
      </div>
      <PostTagPicker key={tagPickerKey} options={tagOptions} />
      {showMap && <PostMapPicker maps={maps} />}
    </>}
    {state.message && <p data-error={state.status === "error"}>{state.message}</p>}
    {signedIn && <button className={styles.publish} disabled={pending}><Send />{pending ? "Posting..." : "Post"}</button>}
    {gate && <div className={styles.accountGate} role="dialog" aria-modal="true" aria-label="Create an account to post"><button type="button" className={styles.closeGate} onClick={() => setGate(false)} aria-label="Close"><X /></button><span className={styles.gateIcon}><Send /></span><strong>Ready to share it?</strong><p>Create a free account to post photos, video links and updates with the skate community.</p><Link href="/account/sign-up?next=/social">Create free account</Link><Link className={styles.signInLink} href="/account/sign-in?next=/social">I already have an account</Link></div>}
  </form>;
}
