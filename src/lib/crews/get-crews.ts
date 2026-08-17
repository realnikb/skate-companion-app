import { createClient } from "@/lib/supabase/server";
import { crewAccent, languageInfo, type Crew, type RecruitmentStatus } from "./crews";

function mediaUrl(path:string|null){const base=process.env.NEXT_PUBLIC_SUPABASE_URL;return path&&base?`${base.replace(/\/$/,"")}/storage/v1/object/public/crew-media/${path}`:undefined;}
export async function getCrews():Promise<Crew[]> {
    const supabase=await createClient();
    const {data:rows,error}=await supabase.from("crews").select("*").eq("is_published",true).order("created_at",{ascending:false});
    if(error||!rows?.length)return [];
    const ids=rows.map(row=>row.id),ownerIds=[...new Set(rows.map(row=>row.owner_id).filter((id):id is string=>Boolean(id)))];
    const [profilesResult,membersResult,linksResult,discordResult,videosResult]=await Promise.all([
        ownerIds.length?supabase.from("profiles").select("id,handle,display_name").in("id",ownerIds):Promise.resolve({data:[],error:null}),
        supabase.from("crew_members").select("crew_id,user_id,role").in("crew_id",ids),
        supabase.from("crew_links").select("crew_id,platform,url").in("crew_id",ids).order("sort_order"),
        supabase.from("crew_discord_integrations").select("*").in("crew_id",ids),
        supabase.from("crew_videos").select("crew_id,title,video_type").in("crew_id",ids).eq("is_published",true).order("published_at",{ascending:false}),
    ]);
    const memberUserIds=[...new Set((membersResult.data??[]).map(member=>member.user_id))];
    const {data:memberProfiles}=memberUserIds.length?await supabase.from("profiles").select("id,handle,display_name").in("id",memberUserIds):{data:[]};
    return rows.map(row=>{
        const owner=profilesResult.data?.find(profile=>profile.id===row.owner_id);
        const members=(membersResult.data??[]).filter(member=>member.crew_id===row.id).map(member=>{const profile=memberProfiles?.find(item=>item.id===member.user_id);return {handle:profile?.handle??"skater",displayName:profile?.display_name??"Skater",role:member.role.split("-").map(part=>part[0]?.toUpperCase()+part.slice(1)).join(" ")};});
        const links=(linksResult.data??[]).filter(link=>link.crew_id===row.id).map(link=>({label:link.platform[0].toUpperCase()+link.platform.slice(1),href:link.url}));
        const discord=discordResult.data?.find(item=>item.crew_id===row.id); const discordLink=links.find(link=>link.label==="Discord");
        return {id:row.id,slug:row.slug,name:row.name,initials:row.name.split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase(),tagline:row.tagline??"",description:row.description??"",location:row.location??"Worldwide",platform:row.platform??"Cross-platform",style:row.styles,languages:row.languages.map(languageInfo),recruitment:row.recruitment_status as RecruitmentStatus,memberCount:members.length,followerCount:"0",accent:row.primary_color??crewAccent(row.slug),logoUrl:mediaUrl(row.logo_path),bannerUrl:mediaUrl(row.banner_path),ownerId:row.owner_id,owner:{handle:owner?.handle??"unclaimed",displayName:owner?.display_name??"Unclaimed crew"},members,socials:links,discord:discord&&discordLink?{inviteUrl:discordLink.href,serverName:discord.guild_name,memberCount:discord.approximate_member_count,onlineCount:discord.approximate_online_count}:undefined,videos:(videosResult.data??[]).filter(video=>video.crew_id===row.id).map(video=>({title:video.title,type:video.video_type,duration:"",plays:"",color:row.primary_color??crewAccent(row.slug)}))};
    });
}
export async function getCrew(slug:string){return (await getCrews()).find(crew=>crew.slug===slug);}
