"use client";

import { useSyncExternalStore } from "react";

export type SkaterStance = "regular" | "goofy";
const key = "skate-companion:stance";
const eventName = "skate-companion:stance-change";

function snapshot(): SkaterStance {
    return window.localStorage.getItem(key) === "goofy" ? "goofy" : "regular";
}

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(eventName, onChange);
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(eventName, onChange);
    };
}

export function useStancePreference() {
    const stance = useSyncExternalStore(subscribe, snapshot, (): SkaterStance => "regular");
    const setStance = (next: SkaterStance) => {
        window.localStorage.setItem(key, next);
        window.dispatchEvent(new Event(eventName));
    };
    return { stance, setStance };
}
