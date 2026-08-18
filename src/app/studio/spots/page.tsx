import Link from "next/link";
import { MapPin } from "lucide-react";
import { requireStudioUser } from "@/lib/studio/auth";
import styles from "../studio.module.scss";
export default async function StudioSpots() {
  const { supabase } = await requireStudioUser();
  const [{ data: spots }, { data: maps }] = await Promise.all([
    supabase
      .from("map_spots")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("skate_maps").select("id,name"),
  ]);
  const names = new Map((maps ?? []).map((map) => [map.id, map.name]));
  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <span>Community moderation</span>
          <h1>Spots</h1>
          <p>
            Review player submissions and manage published, popular and
            real-world-inspired locations.
          </p>
        </div>
      </header>
      <div className={styles.categoryGrid}>
        {spots?.map((spot) => (
          <Link
            className={styles.categoryCard}
            href={`/studio/spots/${spot.id}`}
            key={spot.id}
          >
            <header>
              <MapPin />
              <div>
                <h2>{spot.name}</h2>
                <small>{names.get(spot.map_id) ?? "Unknown map"}</small>
              </div>
            </header>
            <p>{spot.description}</p>
            <footer>
              {spot.is_published ? "Published" : "Needs review"} ·{" "}
              {spot.category}
            </footer>
          </Link>
        ))}
      </div>
    </main>
  );
}
