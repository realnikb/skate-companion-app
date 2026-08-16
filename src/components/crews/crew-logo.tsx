import styles from "./crew-logo.module.scss";

/* eslint-disable @next/next/no-img-element -- Crew logos are user-uploaded with intrinsic dimensions unavailable here. */

export function CrewLogo({ initials, accent, imageUrl, size = "large" }: { initials: string; accent: string; imageUrl?: string; size?: "small" | "medium" | "large" }) {
    return <span className={`${styles.logo} ${styles[size]}`} style={{ "--crew-accent": accent } as React.CSSProperties} aria-label={`${initials} crew logo`}><i />{imageUrl ? <img src={imageUrl} alt="" /> : initials}</span>;
}
