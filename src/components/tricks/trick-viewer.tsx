"use client";

import { useEffect, useMemo, useState } from "react";

import type { ControllerPlatform, Trick, TrickCategory } from "@/types/trick";
import type { SkaterStance } from "@/hooks/use-stance-preference";
import { setTrickFavourite, useFavouriteTrickSlugs } from "@/hooks/use-favourite-tricks";
import { recordTrickVisit } from "@/hooks/use-trick-history";
import { createClient } from "@/lib/supabase/client";
import { RelatedTricks } from "./related-tricks";
import { TrickViewerContent } from "./trick-viewer-content";
import { TrickViewerHero } from "./trick-viewer-hero";
import { TrickViewerNavigation } from "./trick-viewer-navigation";
import { findRelatedTricks, getPopularityRank, getRank } from "./trick-viewer-utils";
import styles from "./trick-viewer.module.scss";

type TrickViewerProps = {
    trick: Trick | null;
    tricks: Trick[];
    category: TrickCategory | null;
    categories: TrickCategory[];
    controllerPlatform: ControllerPlatform;
    stance: SkaterStance;
    onControllerPlatformChange: (platform: ControllerPlatform) => void;
    onStanceChange: (stance: SkaterStance) => void;
    previousTrick?: Trick;
    nextTrick?: Trick;
};

const viewedThisSession = new Set<string>();

export function TrickViewer({ trick, tricks, category, categories, controllerPlatform, stance, onControllerPlatformChange, onStanceChange, previousTrick, nextTrick }: TrickViewerProps) {
    const favouriteSlugs = useFavouriteTrickSlugs();
    const [metricAdjustments, setMetricAdjustments] = useState<Record<string, { views: number; favourites: number }>>({});

    useEffect(() => {
        if (trick) recordTrickVisit(trick.slug);
    }, [trick]);

    useEffect(() => {
        if (!trick || viewedThisSession.has(trick.id)) return;
        viewedThisSession.add(trick.id);

        console.info("[trick-metrics] Recording view", { trickId: trick.id, slug: trick.slug });
        void createClient().rpc("record_trick_view", { target_trick_id: trick.id }).then(({ error }) => {
            if (error) {
                viewedThisSession.delete(trick.id);
                console.error("[trick-metrics] View failed", { trickId: trick.id, message: error.message, code: error.code, details: error.details });
                return;
            }
            console.info("[trick-metrics] View recorded", { trickId: trick.id, slug: trick.slug });
        });
    }, [trick]);

    const rankedTricks = useMemo(() => tricks.map((candidate) => ({
        ...candidate,
        viewCount: candidate.viewCount + (metricAdjustments[candidate.id]?.views ?? 0),
        favouriteCount: candidate.favouriteCount + (metricAdjustments[candidate.id]?.favourites ?? 0),
    })), [metricAdjustments, tricks]);

    if (!trick) {
        return <article className={styles.viewer}><div className={styles.emptyViewer}><p>No trick selected</p><span>Choose another category or clear the search.</span></div></article>;
    }

    const currentMetrics = rankedTricks.find((candidate) => candidate.id === trick.id) ?? trick;
    const isFavourite = favouriteSlugs.includes(trick.slug);
    const toggleFavourite = () => {
        const amount = isFavourite ? -1 : 1;
        setTrickFavourite(trick.slug, !isFavourite);
        setMetricAdjustments((current) => ({
            ...current,
            [trick.id]: { views: current[trick.id]?.views ?? 0, favourites: (current[trick.id]?.favourites ?? 0) + amount },
        }));
        console.info("[trick-metrics] Updating favourite", { trickId: trick.id, slug: trick.slug, amount });
        void createClient().rpc("change_trick_favourite", { target_trick_id: trick.id, amount }).then(({ error }) => {
            if (error) console.error("[trick-metrics] Favourite update failed", { trickId: trick.id, message: error.message, code: error.code, details: error.details });
            else console.info("[trick-metrics] Favourite updated", { trickId: trick.id, slug: trick.slug, amount });
        });
    };

    return <article className={styles.viewer} aria-live="polite">
        <TrickViewerHero
            trick={trick}
            category={category}
            controllerPlatform={controllerPlatform}
            stance={stance}
            isFavourite={isFavourite}
            onToggleFavourite={toggleFavourite}
            popularityRank={getPopularityRank(rankedTricks, trick.id)}
            viewRank={getRank(rankedTricks, trick.id, "viewCount")}
            favouriteRank={getRank(rankedTricks, trick.id, "favouriteCount")}
            currentMetrics={currentMetrics}
        />
        <TrickViewerContent trick={trick} category={category} controllerPlatform={controllerPlatform} stance={stance} onControllerPlatformChange={onControllerPlatformChange} onStanceChange={onStanceChange} />
        <TrickViewerNavigation previousTrick={previousTrick} nextTrick={nextTrick} />
        <RelatedTricks relatedTricks={findRelatedTricks(rankedTricks, trick).map(({ trick: related }) => related)} categories={categories} />
    </article>;
}
