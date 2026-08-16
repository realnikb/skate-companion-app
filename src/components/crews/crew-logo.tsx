import styles from "./crew-logo.module.scss";

export function CrewLogo({ initials, accent, size = "large" }: { initials: string; accent: string; size?: "small" | "medium" | "large" }) {
    return <span className={`${styles.logo} ${styles[size]}`} style={{ "--crew-accent": accent } as React.CSSProperties} aria-label={`${initials} crew logo`}><i />{initials}</span>;
}
