/* eslint-disable @next/next/no-img-element -- User uploads have no known intrinsic dimensions. */
"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { SocialVideo } from "./social-video";
import styles from "./social.module.scss";

type Media = { url: string; type: "image" | "video" };

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function VideoThumbnail({ src }: { src: string }) {
  const [duration, setDuration] = useState<number>();
  return (
    <div className={styles.videoThumbnail}>
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
      <span className={styles.videoThumbnailPlay} aria-hidden="true">
        <Play fill="currentColor" />
      </span>
      {duration !== undefined && Number.isFinite(duration) && (
        <small>{formatDuration(duration)}</small>
      )}
    </div>
  );
}

export function PostGallery({
  media,
  variant = "slideshow",
}: {
  media: Media[];
  variant?: "collage" | "slideshow";
}) {
  const [viewportRef, embla] = useEmblaCarousel({
    loop: media.length > 1,
    watchDrag: media.length > 1,
  });
  const [active, setActive] = useState(0);
  const syncActive = useCallback(() => {
    if (embla) setActive(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", syncActive).on("reInit", syncActive);
    return () => {
      embla.off("select", syncActive).off("reInit", syncActive);
    };
  }, [embla, syncActive]);

  const previous = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  if (!media.length) return null;
  if (variant === "collage") {
    if (media.length === 1) {
      const entry = media[0];
      return entry.type === "video" ? (
        <VideoThumbnail src={entry.url} />
      ) : (
        <img
          className={styles.singlePostImage}
          src={entry.url}
          alt="Post attachment"
        />
      );
    }
    const visible = media.slice(0, 5),
      remaining = media.length - visible.length;
    return (
      <div className={styles.postCollage} data-count={visible.length}>
        {visible.map((entry, index) => (
          <div className={styles.collageTile} key={`${entry.url}-${index}`}>
            {entry.type === "video" ? (
              <VideoThumbnail src={entry.url} />
            ) : (
              <img
                src={entry.url}
                alt={`Post gallery image ${index + 1} of ${media.length}`}
              />
            )}{" "}
            {index === visible.length - 1 && remaining > 0 && (
              <span className={styles.collageMore}>+{remaining}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={styles.postGallery}
      role="region"
      aria-roledescription="carousel"
      aria-label="Post media"
      tabIndex={media.length > 1 ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          previous();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          next();
        }
      }}
    >
      <div className={styles.postGalleryViewport} ref={viewportRef}>
        <div className={styles.postGalleryTrack}>
          {media.map((item, index) => (
            <div
              className={styles.postGallerySlide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${media.length}`}
              key={`${item.url}-${index}`}
            >
              {item.type === "video" ? (
                <SocialVideo src={item.url} />
              ) : (
                <img
                  src={item.url}
                  alt={
                    media.length > 1
                      ? `Post gallery image ${index + 1} of ${media.length}`
                      : "Post attachment"
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {media.length > 1 && (
        <>
          <button
            type="button"
            className={styles.galleryPrevious}
            onClick={(event) => {
              event.stopPropagation();
              previous();
            }}
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className={styles.galleryNext}
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            aria-label="Next slide"
          >
            <ChevronRight />
          </button>
          <span className={styles.galleryCount} aria-live="polite">
            {active + 1} / {media.length}
          </span>
          <div className={styles.galleryDots} aria-label="Choose slide">
            {media.map((_, index) => (
              <button
                type="button"
                data-active={index === active}
                aria-current={index === active ? "true" : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  embla?.scrollTo(index);
                }}
                aria-label={`Show slide ${index + 1}`}
                key={index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
