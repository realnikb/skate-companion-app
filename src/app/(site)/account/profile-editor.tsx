"use client";

import Image from "next/image";
import { Camera, CheckCircle2, Gamepad2, Save, UserRound } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { ControllerPreference } from "@/components/tricks/controller-preference";
import { useControllerPreference } from "@/hooks/use-controller-preference";
import { useStancePreference, type SkaterStance } from "@/hooks/use-stance-preference";
import type { ControllerPlatform } from "@/types/trick";
import { updateProfile, type ProfileState } from "./actions";
import styles from "./account.module.scss";

type Props={displayName:string;email:string;avatarUrl?:string;controller:ControllerPlatform;stance:SkaterStance};
const initialState:ProfileState={status:"idle"};

export function ProfileEditor(props:Props){
 const [state,action,pending]=useActionState(updateProfile,initialState);
 const [avatarPreview,setAvatarPreview]=useState(props.avatarUrl),[controller,setController]=useState(props.controller),[stance,setStance]=useState(props.stance);
 const {setPlatform:saveControllerLocally}=useControllerPreference(),{setStance:saveStanceLocally}=useStancePreference();
 useEffect(()=>()=>{if(avatarPreview?.startsWith("blob:"))URL.revokeObjectURL(avatarPreview)},[avatarPreview]);
 const chooseController=(next:ControllerPlatform)=>{setController(next);saveControllerLocally(next)};
 const chooseStance=(next:SkaterStance)=>{setStance(next);saveStanceLocally(next)};
 return <form action={action} className={styles.profileForm} id="profile-settings">
  <section className={styles.profileIntro}>
   <div className={styles.avatar}>{avatarPreview?<Image src={avatarPreview} alt="Your profile picture" fill sizes="112px" unoptimized/>:<UserRound aria-hidden="true"/>}</div>
   <div><span>Profile picture</span><h2>Make it yours.</h2><p>JPG, PNG, WebP or GIF. Up to 5 MB.</p><label className={styles.uploadButton} htmlFor="avatar"><Camera/> Choose picture</label><input className={styles.fileInput} id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event=>{const file=event.target.files?.[0];if(file)setAvatarPreview(URL.createObjectURL(file))}}/></div>
  </section>
  <section className={styles.formSection}>
   <div className={styles.sectionHeading}><UserRound/><div><span>Your details</span><h2>Profile</h2></div></div>
   <div className={styles.fields}><label>Display name<input name="display_name" defaultValue={props.displayName} maxLength={50} autoComplete="nickname" required/></label><label>Email address<input name="email" type="email" defaultValue={props.email} maxLength={254} autoComplete="email" required/><small>Changing this requires confirmation by email.</small></label></div>
  </section>
  <section className={styles.formSection}>
   <div className={styles.sectionHeading}><Gamepad2/><div><span>Your setup</span><h2>Skate preferences</h2></div></div>
   <div className={styles.preferences}><ControllerPreference platform={controller} onChange={chooseController}/><div className={styles.stancePreference}><span>Stance</span><div role="group" aria-label="Stance preference">{(["regular","goofy"] as const).map(option=><button key={option} type="button" aria-pressed={stance===option} onClick={()=>chooseStance(option)}>{option}</button>)}</div></div></div>
   <input type="hidden" name="preferred_controller" value={controller}/><input type="hidden" name="stance" value={stance}/>
  </section>
  <footer className={styles.formFooter}><p className={state.status==="error"?styles.error:styles.success} role={state.message?"status":undefined}>{state.message&&<>{state.status==="success"&&<CheckCircle2/>} {state.message}</>}</p><button type="submit" disabled={pending}><Save/> {pending?"Saving…":"Save changes"}</button></footer>
 </form>
}
