import type { Metadata } from "next";
import { CrewDiscovery } from "@/components/crews/crew-discovery";
import { getCrews } from "@/lib/crews/get-crews";
export const metadata: Metadata = {
  title: "Find a crew | Skate Companion",
  description:
    "Discover EA Skate crews by style, location, language and recruitment status.",
};
export const dynamic = "force-dynamic";
export default async function CrewsPage() {
  return <CrewDiscovery crews={await getCrews()} />;
}
