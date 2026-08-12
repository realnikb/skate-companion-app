"use client";

import { useState } from "react";

import styles from "@/app/studio/studio.module.scss";

type CategoryThemeEditorProps = {
    name: string;
    accentColor: string;
    gradientStartColor: string;
    gradientMiddleColor: string;
    gradientEndColor: string;
};

export function CategoryThemeEditor({ name, accentColor, gradientStartColor, gradientMiddleColor, gradientEndColor }: CategoryThemeEditorProps) {
    const [accent, setAccent] = useState(accentColor);
    const [start, setStart] = useState(gradientStartColor);
    const [middle, setMiddle] = useState(gradientMiddleColor);
    const [end, setEnd] = useState(gradientEndColor);

    return (
        <section className={`${styles.panel} ${styles.colourPanel}`}>
            <div className={styles.colourHeading}><div><h2>Category colours</h2><p>The accent identifies the category. Three colour stops create its card artwork gradient.</p></div><span className={styles.colourSwatch} style={{ background: accent }} aria-hidden="true" /></div>
            <div className={styles.colourPreview} style={{ background: `linear-gradient(180deg, transparent 34%, rgba(8, 8, 11, .96) 100%), linear-gradient(135deg, ${start} 0%, ${middle} 52%, ${end} 100%)` }}>
                <span>Preview</span><strong>{name}</strong><small style={{ color: accent }}>{name}</small>
            </div>
            <div className={styles.colourFields}>
                <label><span>Accent</span><input type="color" name="accent_color" value={accent} onChange={(event) => setAccent(event.target.value)} /><code>{accent.toUpperCase()}</code></label>
                <label><span>Gradient start</span><input type="color" name="gradient_start_color" value={start} onChange={(event) => setStart(event.target.value)} /><code>{start.toUpperCase()}</code></label>
                <label><span>Gradient middle</span><input type="color" name="gradient_middle_color" value={middle} onChange={(event) => setMiddle(event.target.value)} /><code>{middle.toUpperCase()}</code></label>
                <label><span>Gradient end</span><input type="color" name="gradient_end_color" value={end} onChange={(event) => setEnd(event.target.value)} /><code>{end.toUpperCase()}</code></label>
            </div>
        </section>
    );
}
