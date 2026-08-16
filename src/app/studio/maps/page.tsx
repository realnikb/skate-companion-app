import Link from "next/link";
import { Map, Plus } from "lucide-react";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../studio.module.scss";

export default async function MapsPage(){const {supabase}=await requireStudioUser();const {data}=await supabase.from("skate_maps").select("id,name,slug,description,is_published").order("name");return <main className={styles.content}><header className={styles.pageHeader}><div><span>World data</span><h1>Maps</h1><p>Manage game maps, district boundaries and community spot locations.</p></div><Link className={styles.primaryButton} href="/studio/maps/new"><Plus/>New map</Link></header><div className={styles.categoryGrid}>{data?.map(map=><Link className={styles.categoryCard} href={`/studio/maps/${map.id}`} key={map.id}><header><Map/><div><h2>{map.name}</h2><small>/{map.slug}</small></div></header><p>{map.description||"No description"}</p><footer>{map.is_published?"Published":"Draft"}</footer></Link>)}</div></main>}
