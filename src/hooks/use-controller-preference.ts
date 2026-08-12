"use client";
import { useSyncExternalStore } from "react";
import type { ControllerPlatform } from "@/types/trick";
const key = "skate-companion:controller-platform";
const eventName = "skate-companion:controller-platform-change";
function snapshot(): ControllerPlatform { return window.localStorage.getItem(key) === "playstation" ? "playstation" : "xbox"; }
function subscribe(onChange: () => void) { window.addEventListener("storage", onChange); window.addEventListener(eventName, onChange); return () => { window.removeEventListener("storage", onChange); window.removeEventListener(eventName, onChange); }; }
export function useControllerPreference() {
    const platform = useSyncExternalStore(subscribe, snapshot, (): ControllerPlatform => "xbox");
    const setPlatform = (next: ControllerPlatform) => {
        window.localStorage.setItem(key, next);
        window.dispatchEvent(new Event(eventName));
    };
    return { platform, setPlatform };
}
