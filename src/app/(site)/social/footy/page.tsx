import type { Metadata } from "next";
import { FootyFeed } from "@/components/social/footy-feed";
import { getFootyPosts } from "@/lib/social/get-posts";
import { createClient } from "@/lib/supabase/server";

export const metadata:Metadata={title:"Footy | Skate Companion",description:"Swipe through the latest skate clips from the community."};
export const dynamic="force-dynamic";
const PAGE_SIZE=10;

export default async function FootyPage(){
  const [page,supabase]=await Promise.all([getFootyPosts(0,PAGE_SIZE+1),createClient()]);
  const {data:auth}=await supabase.auth.getClaims();
  return <FootyFeed initialPosts={page.slice(0,PAGE_SIZE)} initialHasMore={page.length>PAGE_SIZE} signedIn={Boolean(auth?.claims)}/>;
}
