import type { Metadata } from "next";
import { CrewDirectory } from "@/components/crews/crew-directory";

export const metadata: Metadata = { title: "Crews | Skate Companion", description: "Discover skate crews, watch their latest videos and find crews recruiting new skaters." };
export default function CrewsPage() { return <CrewDirectory />; }
