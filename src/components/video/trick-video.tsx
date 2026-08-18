import styles from "./trick-video.module.scss";

type TrickVideoProps = {
  src: string;
  poster?: string;
  title: string;
};

export function TrickVideo({ src, poster, title }: TrickVideoProps) {
  return (
    <div className={styles.videoFrame}>
      <video
        key={src}
        className={styles.video}
        src={src}
        poster={poster}
        aria-label={`${title} demonstration`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      <div className={styles.label}>Trick demonstration</div>
    </div>
  );
}
