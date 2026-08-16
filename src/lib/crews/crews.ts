export type RecruitmentStatus = "recruiting" | "invite-only" | "closed";
export type Crew = {
    id: string; slug: string; name: string; initials: string; tagline: string; description: string;
    location: string; platform: string; style: string[]; languages: { code: string; name: string; flag: string }[];
    recruitment: RecruitmentStatus; memberCount: number; followerCount: string; accent: string; logoUrl?: string;
    owner: { handle: string; displayName: string }; members: { handle: string; displayName: string; role: string }[];
    socials: { label: string; href: string }[]; discord?: { inviteUrl: string; serverName: string; memberCount?: number; onlineCount?: number };
    videos: { title: string; type: string; duration: string; plays: string; color: string }[];
};

export const recruitmentLabels: Record<RecruitmentStatus,string> = { recruiting:"Recruiting now", "invite-only":"Invite only", closed:"Entries closed" };
const languageNames = new Intl.DisplayNames(["en"],{type:"language"});
const flags:Record<string,string>={en:"🌐",fr:"🇫🇷",de:"🇩🇪",es:"🇪🇸",pt:"🇵🇹",nl:"🇳🇱",it:"🇮🇹",pl:"🇵🇱",ja:"🇯🇵",ko:"🇰🇷",zh:"🇨🇳",ru:"🇺🇦"};
export function languageInfo(code:string){return {code,name:languageNames.of(code)??code.toUpperCase(),flag:flags[code]??"🌐"};}
export function crewAccent(slug:string){const colours=["#b8ff35","#ff645d","#79a7ff","#eecb57","#b88cff","#52d8bd"];return colours[[...slug].reduce((sum,char)=>sum+char.charCodeAt(0),0)%colours.length];}
