"use client";

import Image from "next/image";
import { Camera, CheckCircle2, Gamepad2, Minus, Plus, Save, UserRound, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { ControllerPreference } from "@/components/tricks/controller-preference";
import { useControllerPreference } from "@/hooks/use-controller-preference";
import { useStancePreference, type SkaterStance } from "@/hooks/use-stance-preference";
import type { ControllerPlatform } from "@/types/trick";
import { updateProfile, type ProfileState } from "./actions";
import styles from "./account.module.scss";

type Props={displayName:string;handle:string;email:string;avatarUrl?:string;controller:ControllerPlatform;stance:SkaterStance};
const initialState:ProfileState={status:"idle"};
const cropSize=280;

type CropImage={url:string;width:number;height:number;name:string};

export function ProfileEditor(props:Props){
 const [state,action,pending]=useActionState(updateProfile,initialState);
 const [displayName,setDisplayName]=useState(props.displayName),[handle,setHandle]=useState(props.handle.startsWith("skater_")?props.displayName.replace(/[^A-Za-z0-9_]/g,"").slice(0,24):props.handle);
 const [avatarPreview,setAvatarPreview]=useState(props.avatarUrl),[controller,setController]=useState(props.controller),[stance,setStance]=useState(props.stance);
 const [cropImage,setCropImage]=useState<CropImage>(),[croppedAvatar,setCroppedAvatar]=useState<File>(),[zoom,setZoom]=useState(1),[position,setPosition]=useState({x:0,y:0});
 const drag=useRef<{x:number;y:number;startX:number;startY:number}|undefined>(undefined);
 const {setPlatform:saveControllerLocally}=useControllerPreference(),{setStance:saveStanceLocally}=useStancePreference();
 useEffect(()=>()=>{if(avatarPreview?.startsWith("blob:"))URL.revokeObjectURL(avatarPreview)},[avatarPreview]);
 const chooseController=(next:ControllerPlatform)=>{setController(next);saveControllerLocally(next)};
 const chooseStance=(next:SkaterStance)=>{setStance(next);saveStanceLocally(next)};
 const baseScale=cropImage?Math.max(cropSize/cropImage.width,cropSize/cropImage.height):1;
 const clampPosition=(x:number,y:number,nextZoom=zoom)=>cropImage?{
  x:Math.max(-(cropImage.width*baseScale*nextZoom-cropSize)/2,Math.min((cropImage.width*baseScale*nextZoom-cropSize)/2,x)),
  y:Math.max(-(cropImage.height*baseScale*nextZoom-cropSize)/2,Math.min((cropImage.height*baseScale*nextZoom-cropSize)/2,y)),
 }:{x:0,y:0};
 const openCropper=(file:File)=>{
  const url=URL.createObjectURL(file),image=new window.Image();
  image.onload=()=>{setCropImage({url,width:image.naturalWidth,height:image.naturalHeight,name:file.name});setZoom(1);setPosition({x:0,y:0})};
  image.src=url;
 };
 const applyCrop=async()=>{
  if(!cropImage)return;
  const image=new window.Image();
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject();image.src=cropImage.url});
  const canvas=document.createElement("canvas"),outputSize=512,scale=baseScale*zoom,ratio=outputSize/cropSize;
  canvas.width=outputSize;canvas.height=outputSize;
  canvas.getContext("2d")?.drawImage(image,(cropSize/2+position.x-cropImage.width*scale/2)*ratio,(cropSize/2+position.y-cropImage.height*scale/2)*ratio,cropImage.width*scale*ratio,cropImage.height*scale*ratio);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",.9));
  if(!blob)return;
  const file=new File([blob],`${cropImage.name.replace(/\.[^.]+$/,"") || "avatar"}.webp`,{type:"image/webp"}),preview=URL.createObjectURL(blob);
  if(avatarPreview?.startsWith("blob:"))URL.revokeObjectURL(avatarPreview);
  setCroppedAvatar(file);setAvatarPreview(preview);URL.revokeObjectURL(cropImage.url);setCropImage(undefined);
 };
 const submit=(formData:FormData)=>{if(croppedAvatar)formData.set("avatar",croppedAvatar);action(formData)};
 return <form action={submit} className={styles.profileForm} id="profile-settings">
  <section className={styles.profileIntro}>
   <div className={styles.avatar}>{avatarPreview?<Image src={avatarPreview} alt="Your profile picture" fill sizes="112px" unoptimized/>:<UserRound aria-hidden="true"/>}</div>
   <div><span>Profile picture</span><h2>Make it yours.</h2><p>JPG, PNG, WebP or GIF. Up to 5 MB.</p><label className={styles.uploadButton} htmlFor="avatar"><Camera/> Choose picture</label><input className={styles.fileInput} id="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event=>{const file=event.target.files?.[0];if(file)openCropper(file);event.target.value=""}}/></div>
  </section>
  <section className={styles.formSection}>
   <div className={styles.sectionHeading}><UserRound/><div><span>Your details</span><h2>Profile</h2></div></div>
   <div className={styles.fields}><label>Display name<input name="display_name" value={displayName} onChange={event=>setDisplayName(event.target.value)} maxLength={50} autoComplete="nickname" required/></label><label>Profile tag<input name="handle" value={handle} onChange={event=>setHandle(event.target.value.replace(/[^A-Za-z0-9_]/g,""))} minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required/><small>This is how you appear in tags: @{handle||"YourName"}</small></label><label>Email address<input name="email" type="email" defaultValue={props.email} maxLength={254} autoComplete="email" required/><small>Changing this requires confirmation by email.</small></label></div>
  </section>
  <section className={styles.formSection}>
   <div className={styles.sectionHeading}><Gamepad2/><div><span>Your setup</span><h2>Skate preferences</h2></div></div>
   <div className={styles.preferences}><ControllerPreference platform={controller} onChange={chooseController}/><div className={styles.stancePreference}><span>Stance</span><div role="group" aria-label="Stance preference">{(["regular","goofy"] as const).map(option=><button key={option} type="button" aria-pressed={stance===option} onClick={()=>chooseStance(option)}>{option}</button>)}</div></div></div>
   <input type="hidden" name="preferred_controller" value={controller}/><input type="hidden" name="stance" value={stance}/>
  </section>
  <footer className={styles.formFooter}><p className={state.status==="error"?styles.error:styles.success} role={state.message?"status":undefined}>{state.message&&<>{state.status==="success"&&<CheckCircle2/>} {state.message}</>}</p><button type="submit" disabled={pending}><Save/> {pending?"Saving…":"Save changes"}</button></footer>
  {cropImage&&<div className={styles.cropOverlay} role="dialog" aria-modal="true" aria-labelledby="crop-title">
   <div className={styles.cropDialog}>
    <header><div><span>Profile picture</span><h2 id="crop-title">Position your photo</h2><p>Drag and zoom until it looks right in the circle.</p></div><button type="button" aria-label="Cancel cropping" onClick={()=>{URL.revokeObjectURL(cropImage.url);setCropImage(undefined)}}><X/></button></header>
    <div className={styles.cropViewport} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,startX:position.x,startY:position.y}}} onPointerMove={event=>{if(drag.current)setPosition(clampPosition(drag.current.startX+event.clientX-drag.current.x,drag.current.startY+event.clientY-drag.current.y))}} onPointerUp={()=>{drag.current=undefined}} onPointerCancel={()=>{drag.current=undefined}}>
     <Image src={cropImage.url} alt="Crop preview" width={cropImage.width} height={cropImage.height} unoptimized draggable={false} style={{width:cropImage.width*baseScale*zoom,height:cropImage.height*baseScale*zoom,transform:`translate(${position.x}px, ${position.y}px)`}}/>
     <div aria-hidden="true"/>
    </div>
    <div className={styles.zoomControl}><Minus aria-hidden="true"/><input aria-label="Zoom profile picture" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event=>{const next=Number(event.target.value);setZoom(next);setPosition(current=>clampPosition(current.x,current.y,next))}}/><Plus aria-hidden="true"/></div>
    <footer><button type="button" className={styles.cancelCrop} onClick={()=>{URL.revokeObjectURL(cropImage.url);setCropImage(undefined)}}>Cancel</button><button type="button" className={styles.applyCrop} onClick={applyCrop}>Use this crop</button></footer>
   </div>
  </div>}
 </form>
}
