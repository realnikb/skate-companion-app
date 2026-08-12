"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Trick } from "@/types/trick";

const storageKey = "skate-companion:trick-history";
const changeEvent = "skate-companion:trick-history-change";

export type TrickHistoryEntry = {
    slug: string;
    lastViewedAt: number;
};

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

function parseHistory(snapshot: string): TrickHistoryEntry[] {
    try {
        const value: unknown = JSON.parse(snapshot);
        if (!Array.isArray(value)) return [];
        return value.filter((entry): entry is TrickHistoryEntry => (
            typeof entry === "object"
            && entry !== null
            && typeof (entry as TrickHistoryEntry).slug === "string"
            && typeof (entry as TrickHistoryEntry).lastViewedAt === "number"
        ));
    } catch {
        return [];
    }
}

function saveHistory(entries: TrickHistoryEntry[]) {
    window.localStorage.setItem(storageKey, JSON.stringify(entries.slice(0, 24)));
    window.dispatchEvent(new Event(changeEvent));
}

export function recordTrickVisit(slug: string) {
    const history = parseHistory(getSnapshot());
    saveHistory([
        { slug, lastViewedAt: Date.now() },
        ...history.filter((entry) => entry.slug !== slug),
    ]);
}

export function useTrickHistory(tricks: Trick[]) {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
    return useMemo(() => parseHistory(snapshot)
        .filter((entry) => tricks.some((trick) => trick.slug === entry.slug))
        .sort((a, b) => b.lastViewedAt - a.lastViewedAt), [snapshot, tricks]);
}
