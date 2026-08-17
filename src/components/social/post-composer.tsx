/* eslint-disable @next/next/no-img-element -- Local object URLs have no stable dimensions. */
"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CalendarDays, ImagePlus, MapPin, Send, Users, X } from "lucide-react";
import { createSocialPost, type PostState } from "@/app/(site)/social/actions";
import { removeSocialMedia, uploadSocialMedia } from "@/lib/social/upload-media";
import { PostMapPicker, type PostMapOption } from "./post-map-picker";
import { PostTagPicker, type PostTagOption } from "./post-tag-picker";
import { useToast } from "@/components/ui/toast";
import styles from "./social.module.scss";

const initial: PostState = { status: "idle" };
type Mode = "post" | "media" | "session" | "spot";
type Props = { playerName?: string; avatarUrl?: string; ownedCrews?: { id: string; name: string }[]; maps?: PostMapOption[]; tagOptions?: PostTagOption[]; signedIn?: boolean };
const acceptedMedia = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];
const maxPhotos = 10;

export function PostComposer({ playerName, avatarUrl, ownedCrews = [], maps = [], tagOptions = [], signedIn = true }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("post");
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [media, setMedia] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [gate, setGate] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tagPickerKey, setTagPickerKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const toast = useToast();
  const [, action, pending] = useActionState(async (previous: PostState, data: FormData): Promise<PostState> => {
    const uploadedPaths: string[] = [];
    try {
      if (media.length) {
        setUploadProgress(0);
        data.delete("media");
        for (let index=0;index<media.length;index++) {
          const uploaded=await uploadSocialMedia(media[index],percentage=>setUploadProgress(Math.round(((index+percentage/100)/media.length)*100)));
          uploadedPaths.push(uploaded.path);
          data.append("uploaded_media_path",uploaded.path);
          data.append("uploaded_media_type",uploaded.mediaType);
          data.append("uploaded_media_mime",uploaded.mimeType);
          data.append("uploaded_media_size",String(uploaded.size));
        }
      }
    } catch (error) {
      await Promise.all(uploadedPaths.map(removeSocialMedia));
      setUploadProgress(null);
      const message=error instanceof Error ? error.message : "The upload failed. Please try again.";
      toast({kind:"error",title:"Upload failed",description:message});
      return { status: "error", message };
    }
    const next = await createSocialPost(previous, data);
    if (next.status === "error") await Promise.all(uploadedPaths.map(removeSocialMedia));
    setUploadProgress(null);
    if (next.status === "success") {
      form.current?.reset(); setExpanded(false); setMode("post"); setMedia([]); setPreviews((urls) => { urls.forEach(URL.revokeObjectURL); return []; }); setShowMap(false); setTagPickerKey((key) => key + 1);
      toast({kind:"success",title:"Post published",description:media.length>1?`${media.length} photos were added to your gallery.`:"Your post is now live."});
    } else if(next.message) {
      toast({kind:"error",title:"Couldn’t publish post",description:next.message});
    }
    return next;
  }, initial);
  const name = playerName ?? "You";

  const engage = (next: Mode) => { setMode(next); setExpanded(true); if (!signedIn) setGate(true); };
  const chooseMedia = () => { engage("media"); if (signedIn) mediaInput.current?.click(); };
  const attach = (files: FileList | File[]) => {
    if (!signedIn) { setGate(true); return; }
    const selected=Array.from(files).filter(file=>acceptedMedia.includes(file.type));
    if(!selected.length){toast({kind:"error",title:"Unsupported file",description:"Choose JPG, PNG, WebP, GIF, MP4, WebM or MOV files."});return;}
    const hasVideo=selected.some(file=>file.type.startsWith("video/"));
    if(hasVideo&&selected.length>1){toast({kind:"error",title:"Choose photos or one video",description:"Gallery posts support up to 10 photos. Videos must be uploaded on their own."});return;}
    const next=selected.slice(0,maxPhotos);
    if(selected.length>maxPhotos)toast({kind:"info",title:"First 10 photos selected",description:"A gallery can contain up to 10 photos."});
    setPreviews(urls=>{urls.forEach(URL.revokeObjectURL);return next.map(URL.createObjectURL)});
    setMedia(next); setMode("media"); setExpanded(true);
  };

  return <form ref={form} action={action} className={styles.composer} data-dragging={dragging} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); attach(event.dataTransfer.files); }} onSubmit={(event) => { if (!signedIn) { event.preventDefault(); setGate(true); } }}>
    <header><span>{signedIn && avatarUrl ? <img src={avatarUrl} alt="" /> : signedIn ? name.slice(0, 1).toUpperCase() : "+"}</span><textarea name="body" required maxLength={2000} rows={1} placeholder="What've you been skating?" onFocus={() => { setExpanded(true); if (!signedIn) setGate(true); }} /></header>
    <input ref={mediaInput} className={styles.hiddenMediaInput} name="media" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={(event) => event.target.files&&attach(event.target.files)} />
    {previews.length>0&&<div className={styles.mediaPreviewGrid} data-count={previews.length}>{previews.map((preview,index)=><div className={styles.mediaPreview} key={preview}>{media[index]?.type.startsWith("video/")?<video src={preview} controls/>:<img src={preview} alt={`Post upload preview ${index+1}`}/>}<button type="button" onClick={()=>{URL.revokeObjectURL(preview);setMedia(files=>files.filter((_,item)=>item!==index));setPreviews(urls=>urls.filter((_,item)=>item!==index));}} aria-label={`Remove ${media[index]?.name??"attachment"}`}><X/></button><span>{index+1} / {previews.length}</span></div>)}</div>}
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
    {dragging && <div className={styles.dropPrompt}><ImagePlus /><strong>Drop up to 10 photos or one video</strong></div>}
    {uploadProgress!==null&&<div className={styles.uploadProgress}><span style={{width:`${uploadProgress}%`}}/><small>Uploading {uploadProgress}%</small></div>}
    {signedIn && expanded && <button className={styles.publish} disabled={pending}><Send />{uploadProgress!==null?`Uploading ${uploadProgress}%`:pending?"Posting...":"Post"}</button>}
    {gate && <div className={styles.accountGate} role="dialog" aria-modal="true" aria-label="Create an account to post"><button type="button" className={styles.closeGate} onClick={() => setGate(false)} aria-label="Close"><X /></button><span className={styles.gateIcon}><Send /></span><strong>Ready to share it?</strong><p>Create a free account to post photos, videos and updates with the skate community.</p><Link href="/account/sign-up?next=/social">Create free account</Link><Link className={styles.signInLink} href="/account/sign-in?next=/social">I already have an account</Link></div>}
  </form>;
}
