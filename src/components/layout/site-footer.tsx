import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import styles from "./site-footer.module.scss";

function SkateboardIcon() {
    return (
        <svg viewBox="0 0 28 20" aria-hidden="true">
            <path d="M2 8.5c1.7 0 2.7-.8 3.2-2.5h17.6c.5 1.7 1.5 2.5 3.2 2.5-.2 2.3-2 3.7-4.8 3.7H6.8C4 12.2 2.2 10.8 2 8.5Z" />
            <circle cx="8" cy="15.5" r="1.7" />
            <circle cx="20" cy="15.5" r="1.7" />
        </svg>
    );
}

export function SiteFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.brand}>
                <Link className={styles.wordmark} href="/" aria-label="Skate Companion home">SC<span>+</span></Link>
                <p aria-label="Built by fans with love"><SkateboardIcon /><span>Built by fans with</span><Heart className={styles.heart} aria-hidden="true" /></p>
            </div>
            <div className={styles.skateBrand}>
                <Image src="/skate-logo.webp" alt="skate." width={401} height={112} />
                <span>Unofficial fan companion</span>
            </div>
            <small>© 2026 Skate Companion</small>
        </footer>
    );
}
