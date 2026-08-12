"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpRight,
    BookOpen,
    ChevronRight,
    Compass,
    Gamepad2,
    Home,
    Newspaper,
    ImageIcon,
    Check,
    ListPlus,
    Lightbulb,
    Plus,
    Play,
    Search,
    Star,
    UserRound,
    X,
} from "lucide-react";

import type { Trick, TrickCategory } from "@/types/trick";
import { isSessionTrick, useSessionLine } from "@/hooks/use-session-line";
import { useTrickHistory } from "@/hooks/use-trick-history";
import { useFavouriteTrickSlugs } from "@/hooks/use-favourite-tricks";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { matchesTrickSearch, parseTrickLine } from "@/lib/tricks/search";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import styles from "./home-page.module.scss";

type HomePageProps = {
    tricks: Trick[];
    categories: TrickCategory[];
    configError?: string;
};

const archiveSeasons = [
    { year: "2026", label: "The Come Up", detail: "14 stories" },
    { year: "2025", label: "New Ground", detail: "28 stories" },
    { year: "2024", label: "First Push", detail: "19 stories" },
];

export function HomePage({ tricks, categories, configError }: HomePageProps) {
    const router = useRouter();
    const [homeSearchQuery, setHomeSearchQuery] = useState("");
    const [isHomeSearchOpen, setIsHomeSearchOpen] = useState(false);
    const [isTrickPickerOpen, setIsTrickPickerOpen] = useState(false);
    const [pickerQuery, setPickerQuery] = useState("");
    const { slugs: sessionLineSlugs, save: saveSessionLine } = useSessionLine(tricks);
    const trickHistory = useTrickHistory(tricks);
    const favouriteTrickSlugs = useFavouriteTrickSlugs();
    const sessionLine = sessionLineSlugs
        .map((slug) => tricks.find((trick) => trick.slug === slug))
        .filter((trick): trick is Trick => Boolean(trick));
    const homeSearchResults = useMemo(() => {
        if (!homeSearchQuery.trim()) return [];
        return tricks
            .filter(isSessionTrick)
            .filter((trick) => matchesTrickSearch(trick, homeSearchQuery))
            .slice(0, 6);
    }, [homeSearchQuery, tricks]);
    const homeLineSearch = useMemo(
        () => parseTrickLine(homeSearchQuery, tricks.filter(isSessionTrick)),
        [homeSearchQuery, tricks],
    );
    const pickerResults = useMemo(() => {
        const availableTricks = tricks.filter(
            (trick) => isSessionTrick(trick) && !sessionLineSlugs.includes(trick.slug),
        );
        if (!pickerQuery.trim()) return availableTricks.slice(0, 6);
        return availableTricks.filter((trick) => matchesTrickSearch(trick, pickerQuery)).slice(0, 8);
    }, [pickerQuery, sessionLineSlugs, tricks]);
    const popularTricks = useMemo(
        () => [...tricks]
            .sort((a, b) => (
                (b.viewCount + (b.favouriteCount * 5))
                - (a.viewCount + (a.favouriteCount * 5))
                || a.sortOrder - b.sortOrder
            ))
            .slice(0, 5),
        [tricks],
    );
    const continueTricks = useMemo(() => trickHistory.slice(0, 4)
        .map((entry) => tricks.find((candidate) => candidate.slug === entry.slug)!), [trickHistory, tricks]);
    const favouriteTricks = useMemo(() => [...favouriteTrickSlugs]
        .reverse()
        .map((slug) => tricks.find((candidate) => candidate.slug === slug))
        .filter((trick): trick is Trick => Boolean(trick))
        .slice(0, 4), [favouriteTrickSlugs, tricks]);

    const addToSessionLine = (slug: string) => {
        if (sessionLineSlugs.includes(slug) || sessionLineSlugs.length >= 3) return;
        saveSessionLine([...sessionLineSlugs, slug]);
    };

    const buildSearchedLine = () => {
        if (!homeLineSearch.isComplete) return;
        saveSessionLine(homeLineSearch.tricks.map((trick) => trick.slug));
        setIsHomeSearchOpen(false);
        document.getElementById("session-line")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const openTrickPicker = () => {
        setPickerQuery("");
        setIsTrickPickerOpen(true);
    };

    const moveSessionTrick = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sessionLineSlugs.length) return;
        const reordered = [...sessionLineSlugs];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        saveSessionLine(reordered);
    };

    const openLearning = (slug?: string) => {
        const targetSlug = slug ?? tricks[0]?.slug;
        if (!targetSlug) return;
        router.push(`/tricks/${encodeURIComponent(targetSlug)}`);
    };

    return (
        <main className={styles.homeShell}>
            {configError && <section className={styles.configError} role="alert"><p className={styles.kicker}>Configuration</p><h2>Supabase environment missing</h2><p>{configError}</p></section>}
            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p>Welcome back,</p>
                    <h1>Kyler</h1>
                    <h2>What are we skating today?</h2>
                    <div className={styles.heroSearchArea}>
                        <form
                            className={styles.heroSearch}
                            onSubmit={(event) => {
                                event.preventDefault();
                                buildSearchedLine();
                            }}
                        >
                            <Search size={21} />
                            <input
                                aria-label="Search for a trick or type multiple tricks to build a line"
                                placeholder="Try ‘treflip to nose grind’"
                                value={homeSearchQuery}
                                onFocus={() => setIsHomeSearchOpen(true)}
                                onChange={(event) => {
                                    setHomeSearchQuery(event.target.value);
                                    setIsHomeSearchOpen(true);
                                }}
                            />
                            <button
                                aria-label={homeLineSearch.isComplete ? "Build this trick line" : "View trick search results"}
                                type="submit"
                                onClick={() => setIsHomeSearchOpen(true)}
                            ><ArrowUpRight /></button>
                        </form>
                        {isHomeSearchOpen && homeSearchQuery.trim() && (
                            <div className={styles.searchResults}>
                                <div className={styles.searchResultsHeader}>
                                    <span>{homeLineSearch.isLineQuery ? "Your trick line" : homeSearchResults.length ? "Add a trick to your line" : "No matching tricks"}</span>
                                    <button aria-label="Close search results" onClick={() => setIsHomeSearchOpen(false)}><X /></button>
                                </div>
                                {homeLineSearch.isLineQuery ? (
                                    <div className={styles.lineSearchResult}>
                                        <div className={styles.linePreview}>
                                            {homeLineSearch.segments.map((segment, index) => {
                                                const trick = homeLineSearch.matches[index];
                                                return (
                                                    <span key={`${segment}-${index}`} className={trick ? styles.resolvedLineTrick : styles.unresolvedLineTrick}>
                                                        {trick?.name ?? segment}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {homeLineSearch.segments.length > 3 ? (
                                            <p>Session lines can contain up to three tricks.</p>
                                        ) : homeLineSearch.unresolved.length > 0 ? (
                                            <p>We couldn’t find: {homeLineSearch.unresolved.join(", ")}. Try another name or alias.</p>
                                        ) : homeLineSearch.isComplete ? (
                                            <button type="button" onClick={buildSearchedLine}>Build this line <ArrowUpRight /></button>
                                        ) : (
                                            <p>Add at least two different tricks, joined with “to”.</p>
                                        )}
                                    </div>
                                ) : homeSearchResults.map((trick) => {
                                    const isPinned = sessionLineSlugs.includes(trick.slug);
                                    const isFull = sessionLineSlugs.length >= 3 && !isPinned;
                                    return (
                                        <button
                                            className={styles.searchResult}
                                            key={trick.slug}
                                            disabled={isPinned || isFull}
                                            onClick={() => addToSessionLine(trick.slug)}
                                        >
                                            <span><strong>{trick.name}</strong><small>{trick.context ?? trick.category}</small></span>
                                            <span className={isPinned ? styles.pinnedResult : ""}>{isPinned ? <Check /> : <Plus />}{isPinned ? "Pinned" : isFull ? "Line full" : "Add"}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className={styles.filterChips}>
                        <button onClick={() => openLearning()}><Star /> Tricks</button>
                        <button><Compass /> Spots</button>
                        <button onClick={() => document.getElementById("tutorials")?.scrollIntoView({ behavior: "smooth" })}><BookOpen /> Tutorials</button>
                        <button onClick={() => document.getElementById("news")?.scrollIntoView({ behavior: "smooth" })}><Newspaper /> News</button>
                        <button><Gamepad2 /> Season Pass</button>
                    </div>
                </div>
                <div className={styles.heroImage}>
                    <Image
                        src="/images/home/hero.png"
                        alt="Skateboarder in action"
                        fill
                        priority
                        sizes="(max-width: 800px) 100vw, 55vw"
                    />
                </div>
            </section>

            <section className={styles.sessionSection} id="session-line">
                <div className={styles.sectionHeading}>
                    <div><ListPlus /><h2>Current session line</h2><span>{sessionLine.length} / 3 tricks</span></div>
                    {sessionLine.length > 0 && <button onClick={() => saveSessionLine([])}>Clear line <X /></button>}
                </div>

                {sessionLine.length === 0 ? (
                    <button className={styles.emptySession} onClick={openTrickPicker}>
                        <span><Plus /></span>
                        <strong>Build your first session line</strong>
                        <small>Search above and pin up to three tricks in the order you want to perform them.</small>
                    </button>
                ) : (
                    <div className={styles.sessionLine}>
                        {sessionLine.map((trick, index) => (
                            <article className={styles.sessionTrick} key={trick.slug}>
                                <div className={styles.sessionTrickHeader}>
                                    <span className={styles.sessionIndex}>0{index + 1}</span>
                                    <div><small>{trick.context ?? trick.category}</small><h3>{trick.name}</h3></div>
                                    <div className={styles.sessionActions}>
                                        <button aria-label={`Move ${trick.name} earlier`} disabled={index === 0} onClick={() => moveSessionTrick(index, -1)}><ArrowUp /></button>
                                        <button aria-label={`Move ${trick.name} later`} disabled={index === sessionLine.length - 1} onClick={() => moveSessionTrick(index, 1)}><ArrowDown /></button>
                                        <button aria-label={`Remove ${trick.name}`} onClick={() => saveSessionLine(sessionLineSlugs.filter((slug) => slug !== trick.slug))}><X /></button>
                                    </div>
                                </div>

                                <button className={styles.sessionPreview} onClick={() => openLearning(trick.slug)} aria-label={`Watch ${trick.name} preview`}>
                                    {trick.posterUrl ? (
                                        <Image src={trick.posterUrl} alt="" fill sizes="(max-width: 800px) 100vw, 33vw" />
                                    ) : (
                                        <span className={styles.sessionPreviewFallback}><Play /><small>Preview available in guide</small></span>
                                    )}
                                    <span className={styles.sessionPreviewLabel}><Play fill="currentColor" /> Preview</span>
                                </button>

                                <div className={styles.sessionCommandHeader}>
                                    <span><Gamepad2 /><strong>Controller inputs</strong></span>
                                    <small>Execute in order</small>
                                </div>
                                <button className={styles.sessionCommand} onClick={() => openLearning(trick.slug)} aria-label={`View full controls for ${trick.name}`}>
                                    <div className={styles.sessionCommandImage}>
                                        <Image
                                            src={trick.controlsImageUrl}
                                            alt={`${trick.name} controller inputs`}
                                            fill
                                            sizes="(max-width: 800px) 100vw, 33vw"
                                            style={{
                                                objectFit: "cover",
                                                transform: "translateY(-15px)",
                                            }}
                                        />
                                    </div>
                                    <ChevronRight />
                                </button>
                            </article>
                        ))}
                        {sessionLine.length < 3 && (
                            <button className={styles.addSessionTrick} onClick={openTrickPicker}>
                                <Plus /><span>Add trick <small>{3 - sessionLine.length} slot{3 - sessionLine.length === 1 ? "" : "s"} left</small></span>
                            </button>
                        )}
                    </div>
                )}
            </section>

            {favouriteTricks.length > 0 && (
                <section className={styles.contentSection}>
                    <div className={styles.sectionHeading}>
                        <div><Star fill="currentColor" /><h2>Your favourites</h2></div>
                        <button onClick={() => router.push("/tricks")}>Browse tricks <ArrowUpRight /></button>
                    </div>
                    <div className={styles.continueGrid}>
                        {favouriteTricks.map((trick) => {
                            const trickCategory = categories.find((item) => item.slug === trick.category);
                            return (
                                <button className={styles.continueCard} key={trick.id} style={getCategoryTheme(trickCategory ?? trick.category)} onClick={() => openLearning(trick.slug)}>
                                    <span className={styles.continueImage}>
                                        {(trick.posterUrl ?? trick.originalPosterUrl) ? <Image src={(trick.posterUrl ?? trick.originalPosterUrl)!} alt={`${trick.name} trick preview`} fill sizes="(max-width: 800px) 76vw, 25vw" /> : <span className={styles.cardPlaceholder}><ImageIcon /><small>Visual coming soon</small></span>}
                                        <span className={styles.favouriteBadge}><Star fill="currentColor" /> Favourite</span>
                                    </span>
                                    <span className={styles.continueCopy}><strong>{trick.name}</strong><small>{trickCategory?.name ?? trick.category.replaceAll("-", " ")}</small></span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className={styles.contentSection}>
                <div className={styles.sectionHeading}>
                    <div><h2>Continue where you left off</h2></div>
                    <button onClick={() => router.push("/tricks")}>View all <ArrowUpRight /></button>
                </div>
                {continueTricks.length ? (
                    <div className={styles.continueGrid}>
                        {continueTricks.map((trick) => {
                            const trickCategory = categories.find((item) => item.slug === trick.category);
                            return (
                                <button className={styles.continueCard} key={trick.id} style={getCategoryTheme(trickCategory ?? trick.category)} onClick={() => openLearning(trick.slug)}>
                                    <span className={styles.continueImage}>
                                        {(trick.posterUrl ?? trick.originalPosterUrl) ? <Image src={(trick.posterUrl ?? trick.originalPosterUrl)!} alt={`${trick.name} trick preview`} fill sizes="(max-width: 800px) 76vw, 25vw" /> : <span className={styles.cardPlaceholder}><ImageIcon /><small>Visual coming soon</small></span>}
                                    </span>
                                    <span className={styles.continueCopy}><strong>{trick.name}</strong><small>{trickCategory?.name ?? trick.category.replaceAll("-", " ")}</small></span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <button className={styles.emptyContinue} onClick={() => router.push("/tricks")}><BookOpen /><span><strong>Start learning a trick</strong><small>Your recently viewed guides and progress will appear here.</small></span><ArrowUpRight /></button>
                )}
            </section>

            <section className={styles.popularSection}>
                <div className={styles.sectionHeading}>
                    <div><h2>Popular tricks</h2></div>
                    <button onClick={() => router.push("/tricks")}>View all <ArrowUpRight /></button>
                </div>
                <div className={styles.featureGrid}>
                    {popularTricks.map((trick, index) => (
                        <button className={styles.featureCard} key={trick.id} style={getCategoryTheme(categories.find((item) => item.slug === trick.category) ?? trick.category)} onClick={() => openLearning(trick.slug)}>
                            <span className={styles.rank} aria-label={`Popularity rank ${index + 1}`}>{index + 1}</span>
                            {trick.posterUrl ? (
                                <Image
                                    className={styles.featureImage}
                                    src={trick.posterUrl}
                                    alt={`${trick.name} trick in EA Skate`}
                                    fill
                                    sizes="(max-width: 800px) 58vw, 20vw"
                                />
                            ) : (
                                <span className={styles.cardPlaceholder}><ImageIcon /><small>Visual coming soon</small></span>
                            )}
                            <span className={styles.cardCopy}><strong>{trick.name}</strong><small>{trick.context ?? trick.category.replaceAll("-", " ")}</small></span>
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.splitSection}>
                <div className={styles.tutorialPanel} id="tutorials">
                    <div className={styles.sectionHeading}>
                        <div><span>02</span><h2>Tutorials</h2></div>
                    </div>
                    <button className={styles.tutorialFeature} onClick={() => openLearning("kickflip")}>
                        <span className={styles.tutorialPlaceholder}><ImageIcon /><small>Photo placeholder</small></span>
                        <span className={styles.tutorialCopy}><small>New / Fundamentals</small><strong>Kickflips:<br />from flick to catch</strong><em>6 min watch <Play size={13} fill="currentColor" /></em></span>
                    </button>
                </div>
                <div className={styles.recentPanel}>
                    <div className={styles.sectionHeading}>
                        <div><span>03</span><h2>Recently viewed</h2></div>
                    </div>
                    {["Kickflip", "BS Powerslide", "360 Flip"].map((name, index) => {
                        const trick = tricks.find((item) => item.name === name);
                        return (
                            <button key={name} className={styles.recentItem} onClick={() => openLearning(trick?.slug)}>
                                <span className={styles.recentNumber}>0{index + 1}</span>
                                <span><strong>{name}</strong><small>{trick?.context ?? "Flatground"} · {index + 2} min</small></span>
                                <span className={styles.progress}><i style={{ width: `${78 - index * 21}%` }} /></span>
                                <ChevronRight />
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className={styles.archiveSection} id="archives">
                <div className={styles.sectionHeading}>
                    <div><span>04</span><h2>Season archives</h2></div>
                    <p>Revisit the eras that shaped your game.</p>
                </div>
                <div className={styles.archiveGrid}>
                    {archiveSeasons.map((season) => (
                        <button key={season.year}>
                            <small>{season.year}</small>
                            <strong>{season.label}</strong>
                            <span>{season.detail}<ArrowUpRight /></span>
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.newsSection} id="news">
                <div className={styles.newsLead}><span>Update 1.7</span><h2>A new city is<br />on the horizon.</h2><p>Fresh spots, new challenges, and more ways to leave your mark. Catch up on everything coming to the game.</p><button>Read the dispatch <ArrowUpRight /></button></div>
                <div className={styles.newsImage}><ImageIcon /><span>News image placeholder</span></div>
            </section>

            <Dialog open={isTrickPickerOpen} onOpenChange={setIsTrickPickerOpen}>
                <DialogContent className={styles.trickPicker} showCloseButton={false}>
                    <div className={styles.pickerHeader}>
                        <div>
                            <span className={styles.pickerEyebrow}>Session line · {sessionLine.length} / 3</span>
                            <DialogTitle className={styles.pickerTitle}>Add a trick</DialogTitle>
                            <DialogDescription className={styles.pickerDescription}>Find the next trick in your line.</DialogDescription>
                        </div>
                        <button className={styles.pickerClose} aria-label="Close trick picker" onClick={() => setIsTrickPickerOpen(false)}><X /></button>
                    </div>

                    <label className={styles.pickerSearch}>
                        <Search />
                        <input
                            autoFocus
                            type="search"
                            value={pickerQuery}
                            placeholder="Search by trick name or alias…"
                            onChange={(event) => setPickerQuery(event.target.value)}
                        />
                        {pickerQuery && <button type="button" aria-label="Clear search" onClick={() => setPickerQuery("")}><X /></button>}
                    </label>

                    <div className={styles.aliasTip}>
                        <Lightbulb />
                        <p><strong>Did you know?</strong> You can search using alternate names—try “tre flip” for a 360 Flip.</p>
                    </div>

                    <div className={styles.pickerResults} aria-live="polite">
                        <span className={styles.pickerResultsLabel}>{pickerQuery.trim() ? `${pickerResults.length} matches` : "Suggested tricks"}</span>
                        {pickerResults.length > 0 ? pickerResults.map((trick) => (
                            <button
                                className={styles.pickerResult}
                                key={trick.slug}
                                onClick={() => {
                                    addToSessionLine(trick.slug);
                                    setPickerQuery("");
                                    if (sessionLine.length === 2) setIsTrickPickerOpen(false);
                                }}
                            >
                                <span className={styles.pickerResultIcon}><Gamepad2 /></span>
                                <span className={styles.pickerResultCopy}>
                                    <strong>{trick.name}</strong>
                                    <small>{trick.context ?? trick.category}{trick.aliases[0] ? ` · Also known as ${trick.aliases[0]}` : ""}</small>
                                </span>
                                <span className={styles.pickerAdd}><Plus /> Add</span>
                            </button>
                        )) : (
                            <div className={styles.noPickerResults}>
                                <Search />
                                <strong>No tricks found</strong>
                                <small>Try a shorter name or an alternate name.</small>
                            </div>
                        )}
                    </div>

                    <div className={styles.pickerFooter}>
                        <span>{3 - sessionLine.length} slot{3 - sessionLine.length === 1 ? "" : "s"} remaining</span>
                        <button onClick={() => setIsTrickPickerOpen(false)}>{sessionLine.length ? "Done" : "Cancel"}</button>
                    </div>
                </DialogContent>
            </Dialog>

            <nav className={styles.mobileNav} aria-label="Mobile navigation">
                <button className={styles.activeMobile}><Home /><span>Home</span></button>
                <button onClick={() => openLearning()}><BookOpen /><span>Learn</span></button>
                <button onClick={() => document.getElementById("news")?.scrollIntoView({ behavior: "smooth" })}><Gamepad2 /><span>News</span></button>
                <button><UserRound /><span>Profile</span></button>
            </nav>
        </main>
    );
}
