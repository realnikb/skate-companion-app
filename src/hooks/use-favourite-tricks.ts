"use client";

import { useMemo, useSyncExternalStore } from "react";

const storageKey = "skate-companion:favourite-tricks";
const changeEvent = "skate-companion:favourite-tricks-change";

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

function parseFavourites(snapshot: string) {
    try {
        const value: unknown = JSON.parse(snapshot);
        return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === "string") : [];
    } catch {
        return [];
    }
}

export function setTrickFavourite(slug: string, isFavourite: boolean) {
    const current = parseFavourites(getSnapshot()).filter((savedSlug) => savedSlug !== slug);
    const next = isFavourite ? [...current, slug] : current;
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(changeEvent));
}

export function useFavouriteTrickSlugs() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
    return useMemo(() => parseFavourites(snapshot), [snapshot]);
}
