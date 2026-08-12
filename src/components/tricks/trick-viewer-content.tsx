import Image from "next/image";
import { ArrowLeftRight, BookOpen, Footprints, Gamepad2 } from "lucide-react";

import type { ControllerPlatform, Trick, TrickCategory } from "@/types/trick";
import type { SkaterStance } from "@/hooks/use-stance-preference";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import { controlsForStance, hasControls } from "@/lib/tricks/controls";
import { ControlSequence } from "./control-sequence";
import styles from "./trick-viewer.module.scss";

type TrickViewerContentProps = {
    trick: Trick;
    category: TrickCategory | null;
    controllerPlatform: ControllerPlatform;
    stance: SkaterStance;
    onControllerPlatformChange: (platform: ControllerPlatform) => void;
    onStanceChange: (stance: SkaterStance) => void;
};

export function TrickViewerContent({ trick, category, controllerPlatform, stance, onControllerPlatformChange, onStanceChange }: TrickViewerContentProps) {
    const difficulty = trick.difficulty ? `${trick.difficulty[0].toUpperCase()}${trick.difficulty.slice(1)}` : "All levels";
    const categoryTheme = category ?? trick.category;
    const indefiniteArticle = /^[aeiou]/i.test(trick.name) ? "an" : "a";
    const variants = controlsForStance(trick.controls, stance);

    return <>
        <div className={styles.infoGrid} style={getCategoryTheme(categoryTheme)}>
            <section className={`${styles.contentCard} ${styles.controlsCard}`}>
                <h2><BookOpen /> How to do {indefiniteArticle} {trick.name}</h2>
                {hasControls(trick.controls) ? <ControlSequence variants={variants} platform={controllerPlatform} />
                    : <div className={styles.controlsImage}><Image src={trick.controlsReferenceUrl} alt={`${trick.name} controls`} fill sizes="(max-width: 900px) 100vw, 60vw" style={{ objectFit: "cover", objectPosition: "center 35%" }} /></div>}
                <p>Work through the {controllerPlatform === "xbox" ? "Xbox" : "PlayStation"} inputs from left to right. Keep each movement deliberate and smooth, and use the looping demonstration to match the setup, flick, and landing timing.</p>
            </section>
        </div>
        <section className={styles.contentCard}>
            <div className={styles.detailsHeading}>
                <h2><Gamepad2 /> {trick.name} controls and details</h2>
                <p>Choose your setup — the controls above update instantly.</p>
            </div>
            <div className={styles.details}>
                <div><span>Category</span><strong className={styles.categoryValue} style={getCategoryTheme(categoryTheme)}>{category?.name ?? trick.category}</strong></div>
                <div><span>Difficulty</span><strong>{difficulty}</strong></div>
                <div className={styles.editableDetail}>
                    <span><Gamepad2 /> Controller <em>Change</em></span>
                    <div className={styles.detailOptions} role="group" aria-label="Choose controller">
                        <button type="button" aria-pressed={controllerPlatform === "xbox"} onClick={() => onControllerPlatformChange("xbox")}>Xbox</button>
                        <button type="button" aria-pressed={controllerPlatform === "playstation"} onClick={() => onControllerPlatformChange("playstation")}>PlayStation</button>
                    </div>
                </div>
                <div className={styles.editableDetail}>
                    <span><Footprints /> Stance <em>Change</em></span>
                    <div className={styles.detailOptions} role="group" aria-label="Choose stance">
                        <button type="button" aria-pressed={stance === "regular"} onClick={() => onStanceChange("regular")}><span>Regular</span><small>Left foot</small></button>
                        <button type="button" aria-pressed={stance === "goofy"} onClick={() => onStanceChange("goofy")}><span>Goofy</span><small>Right foot</small><ArrowLeftRight aria-hidden="true" /></button>
                    </div>
                </div>
            </div>
        </section>
    </>;
}
