"use client";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import styles from "./social.module.scss";

type SocialVideoProps = { src: string; compact?: boolean };

export function SocialVideo({ src, compact = false }: SocialVideoProps) {
  return (
    <MediaPlayer
      className={`${styles.socialVideo} ${compact ? styles.socialVideoCompact : ""}`}
      src={src}
      load="visible"
      preload="metadata"
      playsInline
      onClick={(event) => event.stopPropagation()}
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
