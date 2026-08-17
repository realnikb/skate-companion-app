import { createClient } from "@/lib/supabase/server";

export type SocialPost = { id:string; body:string; type:string; media:{url:string;type:"image"|"video"}[]; imageUrl?:string; videoUrl?:string; uploadedVideo?:boolean; location?:string; mapPin?:{mapName:string;x:number;y:number;assetRoot:string;tileUrl:string;minZoom:number;maxZoom:number;bounds:[[number,number],[number,number]]}; tags:{id:string;name:string;handle?:string;crewSlug?:string;kind:"skater"|"crew"}[]; createdAt:string; likes:number; comments:number; likedByViewer:boolean; commentItems:{id:string;body:string;createdAt:string;author:{name:string;handle:string}}[]; author:{name:string;handle:string;crewSlug?:string;initials:string} };

export async function getSocialPosts():Promise<SocialPost[]>{
  const supabase=await createClient();
  const {data:posts,error}=await supabase.from("social_posts").select("*").eq("is_published",true).order("created_at",{ascending:false}).limit(30);
  if(error||!posts?.length)return [];
  const postIds=posts.map(post=>post.id);
  const {data:auth}=await supabase.auth.getClaims();const viewerId=typeof auth?.claims?.sub==="string"?auth.claims.sub:null;
  const [{data:userTags},{data:crewTags},{data:postMedia},{data:comments},{data:viewerLikes}]=await Promise.all([
    supabase.from("social_post_user_tags").select("post_id,user_id").in("post_id",postIds),
    supabase.from("social_post_crew_tags").select("post_id,crew_id").in("post_id",postIds),
    supabase.from("social_post_media").select("post_id,storage_path,media_type,position").in("post_id",postIds).order("position"),
    supabase.from("social_post_comments").select("id,post_id,user_id,body,created_at").in("post_id",postIds).order("created_at"),
    viewerId?supabase.from("social_post_likes").select("post_id").eq("user_id",viewerId).in("post_id",postIds):Promise.resolve({data:[]}),
  ]);
  const userIds=[...new Set([...posts.map(post=>post.author_id),...(userTags??[]).map(tag=>tag.user_id),...(comments??[]).map(comment=>comment.user_id)])];
  const crewIds=[...new Set([...posts.flatMap(post=>post.crew_id?[post.crew_id]:[]),...(crewTags??[]).map(tag=>tag.crew_id)])];
  const mapIds=[...new Set(posts.flatMap(post=>post.map_id?[post.map_id]:[]))];
  const [{data:profiles},{data:crews},{data:maps}]=await Promise.all([
    supabase.from("profiles").select("id,display_name,handle").in("id",userIds),
    crewIds.length?supabase.from("crews").select("id,name,slug").in("id",crewIds):Promise.resolve({data:[]}),
    mapIds.length?supabase.from("skate_maps").select("id,name,asset_root,tile_url,min_zoom,max_zoom,bounds").in("id",mapIds):Promise.resolve({data:[]}),
  ]);
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
  return posts.map(post=>{
    const crew=crews?.find(item=>item.id===post.crew_id),profile=profiles?.find(item=>item.id===post.author_id),map=maps?.find(item=>item.id===post.map_id);
    const position=Array.isArray(post.map_position)&&post.map_position.length===2?post.map_position:null;
    const name=crew?.name??profile?.display_name??"Skater";
    const legacyUrl=post.image_path&&base?`${base}/storage/v1/object/public/social-media/${post.image_path}`:undefined;
    const media=(postMedia??[]).filter(item=>item.post_id===post.id).map(item=>({url:`${base}/storage/v1/object/public/social-media/${item.storage_path}`,type:item.media_type}));
    if(!media.length&&legacyUrl)media.push({url:legacyUrl,type:post.media_type??"image"});
    const tags:SocialPost["tags"]=[
      ...(userTags??[]).filter(tag=>tag.post_id===post.id).flatMap(tag=>{const tagged=profiles?.find(item=>item.id===tag.user_id);return tagged?[{id:tagged.id,name:tagged.display_name,handle:tagged.handle,kind:"skater" as const}]:[]}),
      ...(crewTags??[]).filter(tag=>tag.post_id===post.id).flatMap(tag=>{const tagged=crews?.find(item=>item.id===tag.crew_id);return tagged?[{id:tagged.id,name:tagged.name,crewSlug:tagged.slug,kind:"crew" as const}]:[]}),
    ];
    const commentItems=(comments??[]).filter(comment=>comment.post_id===post.id).map(comment=>{const author=profiles?.find(item=>item.id===comment.user_id);return{id:comment.id,body:comment.body,createdAt:comment.created_at,author:{name:author?.display_name??"Skater",handle:author?.handle??"skater"}}});
    return {id:post.id,body:post.body,type:post.post_type,media,imageUrl:post.media_type==="video"?undefined:legacyUrl,videoUrl:post.media_type==="video"?legacyUrl:post.external_video_url??undefined,uploadedVideo:post.media_type==="video",location:post.location??undefined,mapPin:map&&position&&typeof position[0]==="number"&&typeof position[1]==="number"?{mapName:map.name,x:position[0],y:position[1],assetRoot:map.asset_root,tileUrl:map.tile_url,minZoom:map.min_zoom,maxZoom:map.max_zoom,bounds:map.bounds as [[number,number],[number,number]]}:undefined,tags,createdAt:post.created_at,likes:post.likes_count,comments:post.comments_count,likedByViewer:(viewerLikes??[]).some(like=>like.post_id===post.id),commentItems,author:{name,handle:profile?.handle??"skater",crewSlug:crew?.slug,initials:name.split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase()}};
  });
}
