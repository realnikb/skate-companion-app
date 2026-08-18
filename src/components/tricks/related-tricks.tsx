import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Trick, TrickCategory } from "@/types/trick";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import styles from "./trick-viewer.module.scss";

type RelatedTricksProps = {
  relatedTricks: Trick[];
  categories: TrickCategory[];
};

export function RelatedTricks({
  relatedTricks,
  categories,
}: RelatedTricksProps) {
  if (!relatedTricks.length) return null;

  return (
    <section className={styles.related}>
      <div className={styles.relatedHeading}>
        <h2>Related tricks</h2>
        <Link href="/tricks">
          Explore all tricks <ArrowRight />
        </Link>
      </div>
      <div className={styles.relatedGrid}>
        {relatedTricks.map((related) => {
          const relatedCategory = categories.find(
            (item) => item.slug === related.category,
          );
          return (
            <Link
              key={related.id}
              href={`/tricks/${related.slug}`}
              style={getCategoryTheme(relatedCategory ?? related.category)}
            >
              <span className={styles.relatedImage}>
                {(related.posterUrl ?? related.originalPosterUrl) && (
                  <Image
                    src={(related.posterUrl ?? related.originalPosterUrl)!}
                    alt={`${related.name} trick preview`}
                    fill
                    sizes="(max-width: 720px) 12rem, 25vw"
                  />
                )}
              </span>
              <span className={styles.relatedCopy}>
                <small>
                  {relatedCategory?.name ??
                    related.category.replaceAll("-", " ")}
                </small>
                <strong>{related.name}</strong>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
