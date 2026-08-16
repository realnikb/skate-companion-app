import type { Metadata } from "next";
import { CrewDirectory } from "@/components/crews/crew-directory";
import { getCrews } from "@/lib/crews/get-crews";

export const metadata: Metadata = { title: "Crews | Skate Companion", description: "Discover skate crews, watch their latest videos and find crews recruiting new skaters." };
export const dynamic = "force-dynamic";
export default async function CrewsPage() { return <CrewDirectory crews={await getCrews()} />; }
