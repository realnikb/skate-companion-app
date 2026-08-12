import { Play, Repeat2 } from "lucide-react";

import styles from "./trick-video-placeholder.module.scss";

type TrickVideoPlaceholderProps = {
    trickName: string;
};

export function TrickVideoPlaceholder({ trickName }: TrickVideoPlaceholderProps) {
    return (
        <div className={styles.video} role="img" aria-label={`Looping video placeholder for ${trickName}`}>
            <div className={styles.frame}>
                <div className={styles.playMark}>
                    <Play aria-hidden="true" size={30} fill="currentColor" />
                </div>
                <div className={styles.deckLine} aria-hidden="true" />
                <div className={styles.loopBadge}>
                    <Repeat2 aria-hidden="true" size={16} />
                    Loop
                </div>
            </div>
        </div>
    );
}
