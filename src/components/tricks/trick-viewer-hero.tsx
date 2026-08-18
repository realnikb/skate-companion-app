import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Eye, Heart, Medal, Play, Star } from "lucide-react";

import type { ControllerPlatform, Trick, TrickCategory } from "@/types/trick";
import type { SkaterStance } from "@/hooks/use-stance-preference";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import { TrickVideo } from "@/components/video/trick-video";
import { ordinal } from "./trick-viewer-utils";
import styles from "./trick-viewer.module.scss";

type TrickViewerHeroProps = {
  trick: Trick;
  category: TrickCategory | null;
  controllerPlatform: ControllerPlatform;
  stance: SkaterStance;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  popularityRank: number;
  viewRank: number;
  favouriteRank: number;
  currentMetrics: Trick;
};

export function TrickViewerHero({
  trick,
  category,
  controllerPlatform,
  stance,
  isFavourite,
  onToggleFavourite,
  popularityRank,
  viewRank,
  favouriteRank,
  currentMetrics,
}: TrickViewerHeroProps) {
  const difficulty = trick.difficulty
    ? `${trick.difficulty[0].toUpperCase()}${trick.difficulty.slice(1)}`
    : "All levels";
  const categoryTheme = category ?? trick.category;
  const indefiniteArticle = /^[aeiou]/i.test(trick.name) ? "an" : "a";
  const pageTitle = `How to do ${indefiniteArticle} ${trick.name} in EA skate.`;

  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/tricks">Tricks</Link>
          <ChevronRight aria-hidden="true" />
          {category ? (
            <Link
              href={`/tricks/${category.slug}`}
              style={getCategoryTheme(category)}
            >
              {category.name}
            </Link>
          ) : (
            <span>All tricks</span>
          )}
          <ChevronRight aria-hidden="true" />
          <span aria-current="page">{trick.name}</span>
        </nav>
        <div className={styles.titleRow}>
          <h1 aria-label={pageTitle}>
            <span>How to do {indefiniteArticle}</span>
            {trick.name}
            <small>in EA skate.</small>
          </h1>
          <button
            className={isFavourite ? styles.favouriteActive : styles.favourite}
            type="button"
            onClick={onToggleFavourite}
            aria-label={
              isFavourite
                ? `Remove ${trick.name} from favourites`
                : `Favourite ${trick.name}`
            }
          >
            <Star size={26} fill={isFavourite ? "currentColor" : "none"} />
          </button>
        </div>
        <span
          className={styles.difficulty}
          style={getCategoryTheme(categoryTheme)}
        >
          {difficulty}
        </span>
        <p className={styles.quickAnswer}>
          <strong>Quick answer:</strong> Use the{" "}
          {controllerPlatform === "xbox" ? "Xbox" : "PlayStation"} inputs below
          in order, then match the demonstration timing to land the {trick.name}
          . Your saved setup is {stance} stance.
        </p>
        <p className={styles.intro}>{trick.description}</p>
        <div className={styles.stats}>
          <div>
            <Medal />
            <strong>{ordinal(popularityRank)}</strong>
            <span>Popularity</span>
          </div>
          {currentMetrics.viewCount > 0 && viewRank <= 50 && (
            <div>
              <Eye />
              <strong>{ordinal(viewRank)}</strong>
              <span>Most viewed</span>
            </div>
          )}
          {currentMetrics.favouriteCount > 0 && favouriteRank <= 50 && (
            <div>
              <Heart />
              <strong>{ordinal(favouriteRank)}</strong>
              <span>Most favourited</span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.media}>
        {trick.videoUrl ? (
          <TrickVideo
            src={trick.videoUrl}
            poster={trick.posterUrl}
            title={trick.name}
          />
        ) : trick.posterUrl ? (
          <Image
            src={trick.posterUrl}
            alt={`${trick.name} demonstration`}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
          />
        ) : (
          <div className={styles.mediaPlaceholder}>
            <Play fill="currentColor" />
            <span>{trick.name} demonstration</span>
            <small>Video coming soon</small>
          </div>
        )}
      </div>
    </section>
  );
}
