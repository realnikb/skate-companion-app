import Image from "next/image";
import { BookOpen, Gamepad2 } from "lucide-react";

import type { ControllerPlatform, Trick, TrickCategory } from "@/types/trick";
import type { SkaterStance } from "@/hooks/use-stance-preference";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import { controlsForStance, hasControls } from "@/lib/tricks/controls";
import { ControlSequence } from "./control-sequence";
import styles from "./trick-viewer.module.scss";

type TrickViewerContentProps = { trick: Trick; category: TrickCategory | null; controllerPlatform: ControllerPlatform; stance: SkaterStance };

export function TrickViewerContent({ trick, category, controllerPlatform, stance }: TrickViewerContentProps) {
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
            <h2><Gamepad2 /> {trick.name} controls and details</h2>
            <div className={styles.details}>
                <div><span>Category</span><strong className={styles.categoryValue} style={getCategoryTheme(categoryTheme)}>{category?.name ?? trick.category}</strong></div>
                <div><span>Difficulty</span><strong>{difficulty}</strong></div>
                <div><span>Controller</span><strong>{controllerPlatform === "xbox" ? "Xbox" : "PlayStation"}</strong></div>
                <div><span>Stance</span><strong>{stance === "regular" ? "Regular · left foot forward" : "Goofy · right foot forward"}</strong></div>
            </div>
        </section>
    </>;
}
