import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Trick } from "@/types/trick";
import styles from "./trick-viewer.module.scss";

type TrickViewerNavigationProps = { previousTrick?: Trick; nextTrick?: Trick };

export function TrickViewerNavigation({
  previousTrick,
  nextTrick,
}: TrickViewerNavigationProps) {
  if (!previousTrick && !nextTrick) return null;

  return (
    <nav className={styles.trickPager} aria-label="Previous and next tricks">
      {previousTrick && (
        <Link
          href={`/tricks/${previousTrick.slug}`}
          className={styles.previousTrick}
        >
          <span className={styles.pagerImage}>
            {(previousTrick.posterUrl ?? previousTrick.originalPosterUrl) && (
              <Image
                src={
                  (previousTrick.posterUrl ?? previousTrick.originalPosterUrl)!
                }
                alt=""
                fill
                sizes="(max-width: 720px) 34vw, 12rem"
              />
            )}
          </span>
          <span className={styles.pagerCopy}>
            <small>
              <ChevronLeft /> Previous trick
            </small>
            <strong>{previousTrick.name}</strong>
          </span>
        </Link>
      )}
      {nextTrick && (
        <Link href={`/tricks/${nextTrick.slug}`} className={styles.nextTrick}>
          <span className={styles.pagerCopy}>
            <small>
              Next trick <ChevronRight />
            </small>
            <strong>{nextTrick.name}</strong>
          </span>
          <span className={styles.pagerImage}>
            {(nextTrick.posterUrl ?? nextTrick.originalPosterUrl) && (
              <Image
                src={(nextTrick.posterUrl ?? nextTrick.originalPosterUrl)!}
                alt=""
                fill
                sizes="(max-width: 720px) 34vw, 12rem"
              />
            )}
          </span>
        </Link>
      )}
    </nav>
  );
}
