import type { Metadata } from "next";
import {
  SpotsMap,
  type MapPresentation,
  type Spot,
} from "@/components/spots/spots-map";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const metadata: Metadata = {
  title: "Skate Spots | Skate Companion",
  description:
    "Find, save and share the best places to skate in San Vansterdam.",
};
const pair = (value: Json | null): [number, number] =>
  Array.isArray(value) && value.length >= 2
    ? [Number(value[0]), Number(value[1])]
    : [50, 50];
const polygon = (value: Json): [number, number][] =>
  Array.isArray(value)
    ? value
        .filter(Array.isArray)
        .map((point) => [Number(point[0]), Number(point[1])])
    : [];

export default async function SpotsPage() {
  let presentation: MapPresentation | undefined,
    isAuthenticated = false;
  try {
    const supabase = await createClient();
    const [{ data: map }, { data: auth }] = await Promise.all([
      supabase
        .from("skate_maps")
        .select("*")
        .eq("is_published", true)
        .order("created_at")
        .limit(1)
        .maybeSingle(),
      supabase.auth.getClaims(),
    ]);
    isAuthenticated = Boolean(auth?.claims);
    if (map) {
      const [{ data: districts }, { data: spotRows }] = await Promise.all([
        supabase
          .from("map_districts")
          .select("*")
          .eq("map_id", map.id)
          .order("sort_order"),
        supabase
          .from("map_spots")
          .select("*")
          .eq("map_id", map.id)
          .eq("is_published", true),
      ]);
      const spotIds = (spotRows ?? []).map((spot) => spot.id);
      const [{ data: reviews }, { data: media }, { data: comments }] =
        spotIds.length
          ? await Promise.all([
              supabase
                .from("spot_reviews")
                .select("spot_id,rating,body,created_at")
                .in("spot_id", spotIds),
              supabase
                .from("spot_media")
                .select("*")
                .in("spot_id", spotIds)
                .eq("is_published", true)
                .order("is_cover", { ascending: false }),
              supabase
                .from("spot_comments")
                .select("*")
                .in("spot_id", spotIds)
                .eq("is_published", true)
                .order("created_at", { ascending: false }),
            ])
          : [{ data: [] }, { data: [] }, { data: [] }];
      const districtNames = new Map(
        (districts ?? []).map((district) => [district.id, district.name]),
      );
      const publicSpots: Spot[] = (spotRows ?? []).map((row) => {
        const [x, y] = pair(row.position),
          spotReviews = (reviews ?? []).filter(
            (review) => review.spot_id === row.id,
          ),
          ratings = spotReviews.map((review) => review.rating);
        const spotMedia = (media ?? [])
          .filter((item) => item.spot_id === row.id)
          .map((item) => ({
            id: item.id,
            url: supabase.storage
              .from("spot-media")
              .getPublicUrl(item.storage_path).data.publicUrl,
            type: (item.media_type === "video" ? "video" : "image") as
              "video" | "image",
            caption: item.caption,
          }));
        const spotComments = [
          ...(comments ?? [])
            .filter((comment) => comment.spot_id === row.id)
            .map((comment) => ({
              id: comment.id,
              body: comment.body,
              createdAt: comment.created_at,
            })),
          ...spotReviews
            .filter((review) => review.body)
            .map((review) => ({
              id: `review-${review.spot_id}-${review.created_at}`,
              body: review.body!,
              createdAt: review.created_at,
            })),
        ];
        return {
          id: row.id,
          name: row.name,
          district: row.district_id
            ? (districtNames.get(row.district_id) ?? "Unassigned")
            : "Unassigned",
          category: (["popular", "city-echo", "community"].includes(
            row.category,
          )
            ? row.category
            : "community") as Spot["category"],
          x,
          y,
          rating: ratings.length
            ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
            : 0,
          ratings: ratings.length,
          favourites: 0,
          description: row.description,
          tags: [
            row.category === "city-echo"
              ? "Real-World Inspired"
              : row.category === "popular"
                ? "Popular"
                : "Community",
          ],
          quote:
            spotComments[0]?.body ??
            "Be the first to share a line from this spot.",
          author: "San Van skater",
          palette: "violet",
          persisted: true,
          media: spotMedia,
          comments: spotComments,
        };
      });
      presentation = {
        id: map.id,
        name: map.name,
        assetRoot: map.asset_root,
        tileUrl: map.tile_url,
        minZoom: map.min_zoom,
        maxZoom: map.max_zoom,
        bounds: map.bounds as [[number, number], [number, number]],
        districts: (districts ?? []).map((district) => {
          const [x, y] = pair(district.marker_position);
          return {
            name: district.name,
            icon: district.icon_path ?? "",
            x,
            y,
            accent: district.colour,
            points: polygon(district.polygon),
          };
        }),
        spots: publicSpots,
      };
    }
  } catch {
    /* Static San Van fallback remains available before migrations are applied. */
  }
  return (
    <SpotsMap presentation={presentation} isAuthenticated={isAuthenticated} />
  );
}
