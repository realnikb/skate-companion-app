import Link from "next/link";
import { Bookmark, MapPin, MessageCircle, Sparkles } from "lucide-react";
import styles from "./account-benefits-prompt.module.scss";

export function AccountBenefitsPrompt({title="Make this map yours.",description="Create a free account to add spots and join the San Van community."}:{title?:string;description?:string}){
    return <div className={styles.prompt}><span><Sparkles/>Free account</span><h2>{title}</h2><p>{description}</p><ul><li><MapPin/><span><strong>Share spots</strong><small>Drop precise pins for the community.</small></span></li><li><Bookmark/><span><strong>Save favourites</strong><small>Keep your best session locations close.</small></span></li><li><MessageCircle/><span><strong>Join spot talk</strong><small>Rate locations and share your lines.</small></span></li></ul><div><Link href="/account/sign-up">Create an account</Link><Link href="/account/sign-in">I already have one</Link></div></div>
}
