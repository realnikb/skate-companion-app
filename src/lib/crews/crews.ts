export type RecruitmentStatus = "recruiting" | "invite-only" | "closed";

export type Crew = {
    slug: string;
    name: string;
    initials: string;
    tagline: string;
    description: string;
    location: string;
    platform: string;
    style: string[];
    recruitment: RecruitmentStatus;
    memberCount: number;
    followerCount: string;
    accent: string;
    owner: { handle: string; displayName: string };
    members: { handle: string; displayName: string; role: string }[];
    socials: { label: string; href: string }[];
    videos: { title: string; type: string; duration: string; plays: string; color: string }[];
};

export const crews: Crew[] = [
    {
        slug: "night-shift", name: "Night Shift", initials: "NS", tagline: "After dark. All terrain.",
        description: "A film-first crew chasing believable lines through San Van after the lights come on. Clean catches, long lenses, no shortcuts.",
        location: "UK · EU", platform: "Cross-platform", style: ["Realism", "Filming"], recruitment: "recruiting",
        memberCount: 12, followerCount: "2.8k", accent: "#b8ff35", owner: { handle: "marlow", displayName: "Marlow" },
        members: [
            { handle: "marlow", displayName: "Marlow", role: "Owner" },
            { handle: "lowlight", displayName: "Lowlight", role: "Filmer" },
            { handle: "cass", displayName: "Cass", role: "Captain" },
            { handle: "juno", displayName: "Juno", role: "Member" },
        ],
        socials: [{ label: "YouTube", href: "https://youtube.com" }, { label: "Discord", href: "https://discord.com" }, { label: "Instagram", href: "https://instagram.com" }],
        videos: [
            { title: "NOCTURNE — Full Crew Tape", type: "Crew tape", duration: "08:42", plays: "18.4k", color: "#435c22" },
            { title: "Last Train Home", type: "Street edit", duration: "03:18", plays: "7.2k", color: "#4e344f" },
            { title: "Marlow: Market Mile", type: "Part", duration: "02:06", plays: "4.9k", color: "#304c57" },
        ],
    },
    {
        slug: "dead-rail-society", name: "Dead Rail Society", initials: "DR", tagline: "Technical by nature.",
        description: "Trick-line obsessives building technical sequences one rail at a time.", location: "North America", platform: "PC",
        style: ["Trick lines", "Technical"], recruitment: "invite-only", memberCount: 8, followerCount: "1.9k", accent: "#ff645d",
        owner: { handle: "kickturn", displayName: "Kickturn" }, members: [{ handle: "kickturn", displayName: "Kickturn", role: "Owner" }],
        socials: [{ label: "TikTok", href: "https://tiktok.com" }, { label: "YouTube", href: "https://youtube.com" }],
        videos: [{ title: "Twenty Four Rails", type: "Trick line", duration: "04:11", plays: "12.1k", color: "#60322d" }],
    },
    {
        slug: "sidewalk-radio", name: "Sidewalk Radio", initials: "SR", tagline: "Pull up. Everyone skates.",
        description: "A relaxed social crew for new faces, strange spots and good sessions.", location: "Worldwide", platform: "Cross-platform",
        style: ["Social", "All skill levels"], recruitment: "recruiting", memberCount: 31, followerCount: "956", accent: "#79a7ff",
        owner: { handle: "olliepop", displayName: "Olliepop" }, members: [{ handle: "olliepop", displayName: "Olliepop", role: "Owner" }],
        socials: [{ label: "Discord", href: "https://discord.com" }, { label: "Instagram", href: "https://instagram.com" }],
        videos: [{ title: "Sunday Rollout 06", type: "Session", duration: "05:35", plays: "3.7k", color: "#314961" }],
    },
    {
        slug: "good-form", name: "Good Form", initials: "GF", tagline: "Make every frame count.",
        description: "A small collective focused on polished edits and grounded, cinematic skating.", location: "EU", platform: "PlayStation",
        style: ["Realism", "Cinematic"], recruitment: "closed", memberCount: 6, followerCount: "4.1k", accent: "#eecb57",
        owner: { handle: "frames", displayName: "Frames" }, members: [{ handle: "frames", displayName: "Frames", role: "Owner" }],
        socials: [{ label: "YouTube", href: "https://youtube.com" }, { label: "Instagram", href: "https://instagram.com" }],
        videos: [{ title: "Form / 04", type: "Crew tape", duration: "09:02", plays: "24.6k", color: "#5d512a" }],
    },
];

export function getCrew(slug: string) { return crews.find((crew) => crew.slug === slug); }

export const recruitmentLabels: Record<RecruitmentStatus, string> = {
    recruiting: "Recruiting now", "invite-only": "Invite only", closed: "Entries closed",
};
