"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, ArrowUpRight, Bell, Check, ChevronLeft, ChevronRight, Footprints, Gamepad2, LogIn, Plus, Search, SlidersHorizontal, UserPlus, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

import { isSessionTrick, useSessionLine } from "@/hooks/use-session-line";
import { useControllerPreference } from "@/hooks/use-controller-preference";
import { useStancePreference } from "@/hooks/use-stance-preference";
import { matchesTrickSearch, parseTrickLine } from "@/lib/tricks/search";
import type { Trick } from "@/types/trick";
import styles from "./site-header.module.scss";

export function SiteHeader({ tricks, isAuthenticated, avatarUrl }: { tricks: Trick[]; isAuthenticated: boolean; avatarUrl?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { slugs, save } = useSessionLine(tricks);
    const { platform, setPlatform } = useControllerPreference();
    const { stance, setStance } = useStancePreference();
    const results = useMemo(() => query.trim() ? tricks.filter(isSessionTrick).filter((trick) => matchesTrickSearch(trick, query)).slice(0, 6) : [], [query, tricks]);
    const lineSearch = useMemo(() => parseTrickLine(query, tricks.filter(isSessionTrick)), [query, tricks]);
    const isLearning = pathname.startsWith("/tricks");
    const isSpots = pathname.startsWith("/spots");
    const isCrews = pathname.startsWith("/social");

    const buildLine = () => {
        if (!lineSearch.isComplete) return;
        save(lineSearch.tricks.map((trick) => trick.slug));
        setIsOpen(false);
        router.push("/#session-line");
    };

    return (
        <header className={styles.header}>
            <Link className={styles.wordmark} href="/" aria-label="Skate Companion home">SC<span>+</span></Link>
            <nav className={styles.navigation} aria-label="Primary navigation">
                <Link className={!isLearning && pathname === "/" ? styles.active : ""} href="/">Home</Link>
                <Link className={isLearning ? styles.active : ""} href="/tricks">Learning</Link>
                <Link className={isSpots ? styles.active : ""} href="/spots">Spots</Link>
                <Link className={isCrews ? styles.active : ""} href="/social">Social</Link>
                <Link href="/#news">News</Link>
            </nav>
            <div className={styles.actions}>
                <div className={`${styles.search} ${isOpen ? styles.searchOpen : ""}`}>
                    <form onSubmit={(event) => { event.preventDefault(); buildLine(); }}>
                        <input autoFocus={isOpen} aria-label="Search tricks or build a trick line" placeholder="Search for tricks, tutorials, spots and more..." tabIndex={isOpen ? 0 : -1} value={query} onChange={(event) => setQuery(event.target.value)} />
                        <button type="button" aria-label={isOpen ? "Close search" : "Open search"} aria-expanded={isOpen} onClick={() => { setIsAccountMenuOpen(false); setIsSettingsOpen(false); setIsOpen((open) => !open); }}>{isOpen ? <X /> : <Search />}</button>
                    </form>
                    {isOpen && query.trim() && (
                        <div className={styles.results}>
                            <div className={styles.resultsHeader}><span>{lineSearch.isLineQuery ? "Your trick line" : results.length ? "Add a trick to your line" : "No matching tricks"}</span><button onClick={() => setIsOpen(false)} aria-label="Close results"><X /></button></div>
                            {lineSearch.isLineQuery ? (
                                <div className={styles.lineResult}>
                                    <div>{lineSearch.segments.map((segment, index) => <span key={`${segment}-${index}`} data-resolved={Boolean(lineSearch.matches[index])}>{lineSearch.matches[index]?.name ?? segment}</span>)}</div>
                                    {lineSearch.isComplete ? <button onClick={buildLine}>Build this line <ArrowUpRight /></button> : <p>{lineSearch.segments.length > 3 ? "Session lines can contain up to three tricks." : lineSearch.unresolved.length ? `We couldn’t find: ${lineSearch.unresolved.join(", ")}.` : "Join at least two tricks with “to”."}</p>}
                                </div>
                            ) : results.map((trick) => {
                                const pinned = slugs.includes(trick.slug);
                                const full = slugs.length >= 3 && !pinned;
                                return <button className={styles.result} key={trick.slug} disabled={pinned || full} onClick={() => save([...slugs, trick.slug])}><span><strong>{trick.name}</strong><small>{trick.context ?? trick.category}</small></span><span>{pinned ? <Check /> : <Plus />}{pinned ? "Pinned" : full ? "Line full" : "Add"}</span></button>;
                            })}
                        </div>
                    )}
                </div>
                <button className={styles.circleButton} aria-label="Notifications"><Bell /><i /></button>
                <div className={styles.accountMenuWrap}>
                    <button className={`${styles.circleButton} ${isAuthenticated ? styles.accountActive : ""}`} aria-label="Open account menu" aria-expanded={isAccountMenuOpen} onClick={() => { setIsOpen(false); setIsAccountMenuOpen((open) => !open); setIsSettingsOpen(false); }}>{avatarUrl ? <Image className={styles.accountAvatar} src={avatarUrl} alt="Your profile picture" width={44} height={44} unoptimized /> : <UserRound />}</button>
                    {isAccountMenuOpen && (
                        <div className={styles.accountMenu}>
                            {!isSettingsOpen ? <>
                                <div className={styles.accountMenuHeading}><span>{isAuthenticated ? "Your account" : "Skate Companion"}</span><button aria-label="Close account menu" onClick={() => setIsAccountMenuOpen(false)}><X /></button></div>
                                {isAuthenticated ? (
                                    <Link className={styles.accountMenuItem} href="/account" onClick={() => setIsAccountMenuOpen(false)}><UserRound /><span><strong>My account</strong><small>Favourites, lines and profile</small></span><ChevronRight /></Link>
                                ) : <>
                                    <Link className={`${styles.accountMenuItem} ${styles.signUpItem}`} href="/account/sign-up" onClick={() => setIsAccountMenuOpen(false)}><UserPlus /><span><strong>Sign up <em>It’s free</em></strong><small>Save tricks, lines and preferences</small></span><ChevronRight /></Link>
                                    <Link className={styles.accountMenuItem} href="/account/sign-in" onClick={() => setIsAccountMenuOpen(false)}><LogIn /><span><strong>Sign in</strong><small>Welcome back</small></span><ChevronRight /></Link>
                                </>}
                                <button className={styles.accountMenuItem} onClick={() => setIsSettingsOpen(true)}><SlidersHorizontal /><span><strong>My settings</strong><small>Stance and controller</small></span><ChevronRight /></button>
                            </> : <>
                            <div className={styles.accountMenuHeading}><button className={styles.backButton} aria-label="Back to account menu" onClick={() => setIsSettingsOpen(false)}><ChevronLeft /></button><span>My settings</span><button aria-label="Close account menu" onClick={() => setIsAccountMenuOpen(false)}><X /></button></div>
                            <p className={styles.settingsNote}>{isAuthenticated ? "Account syncing is coming next." : "Saved on this device. No account needed."}</p>
                            <fieldset>
                                <legend><Footprints /> Stance</legend>
                                <div className={styles.preferenceOptions}>
                                    <button className={stance === "regular" ? styles.selectedPreference : ""} aria-pressed={stance === "regular"} onClick={() => setStance("regular")}><Footprints /><span>Regular<small>Left foot forward</small></span></button>
                                    <button className={stance === "goofy" ? styles.selectedPreference : ""} aria-pressed={stance === "goofy"} onClick={() => setStance("goofy")}><ArrowLeftRight /><span>Goofy<small>Right foot forward</small></span></button>
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend><Gamepad2 /> Controller</legend>
                                <div className={styles.preferenceOptions}>
                                    <button className={platform === "xbox" ? styles.selectedPreference : ""} aria-pressed={platform === "xbox"} onClick={() => setPlatform("xbox")}><Gamepad2 /><span>Xbox<small>ABXY controls</small></span></button>
                                    <button className={platform === "playstation" ? styles.selectedPreference : ""} aria-pressed={platform === "playstation"} onClick={() => setPlatform("playstation")}><Gamepad2 /><span>PlayStation<small>Shape controls</small></span></button>
                                </div>
                            </fieldset>
                            </>}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
