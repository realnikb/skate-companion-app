"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Trick } from "@/types/trick";

const storageKey = "skate-companion:session-line";
const changeEvent = "skate-companion:session-line-change";
const supportedCategories = new Set(["flip-tricks", "grinds", "plants", "grabs", "dark-tricks"]);

export function isSessionTrick(trick: Trick) {
    return supportedCategories.has(trick.category);
}

function getSnapshot() {
    return window.localStorage.getItem(storageKey) ?? "[]";
}

function subscribe(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(changeEvent, onStoreChange);
    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEvent, onStoreChange);
    };
}

export function useSessionLine(tricks: Trick[]) {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
    const slugs = useMemo(() => {
        try {
            const saved: unknown = JSON.parse(snapshot);
            return Array.isArray(saved)
                ? saved.filter((slug): slug is string => typeof slug === "string")
                    .filter((slug) => tricks.some((trick) => trick.slug === slug && isSessionTrick(trick)))
                    .slice(0, 3)
                : [];
        } catch {
            return [];
        }
    }, [snapshot, tricks]);

    const save = (nextSlugs: string[]) => {
        window.localStorage.setItem(storageKey, JSON.stringify(nextSlugs.slice(0, 3)));
        window.dispatchEvent(new Event(changeEvent));
    };

    return { slugs, save };
}
