"use client";

import { TrickViewer } from "@/components/tricks/trick-viewer";
import { useControllerPreference } from "@/hooks/use-controller-preference";
import { useStancePreference } from "@/hooks/use-stance-preference";
import type { Trick, TrickCategory } from "@/types/trick";
import styles from "./trick-page-content.module.scss";

export function TrickPageContent({
  trick,
  tricks,
  category,
  categories,
}: {
  trick: Trick;
  tricks: Trick[];
  category: TrickCategory | null;
  categories: TrickCategory[];
}) {
  const { platform: controllerPlatform, setPlatform: setControllerPlatform } =
    useControllerPreference();
  const { stance, setStance } = useStancePreference();
  const categoryTricks = tricks.filter(
    (item) => item.category === trick.category,
  );
  const index = categoryTricks.findIndex((item) => item.slug === trick.slug);
  const previousTrick = index > 0 ? categoryTricks[index - 1] : undefined;
  const nextTrick = index >= 0 ? categoryTricks[index + 1] : undefined;

  return (
    <main className={styles.main}>
      {(trick.originalPosterUrl ?? trick.posterUrl) && (
        <div
          className={styles.posterBackdrop}
          style={{
            backgroundImage: `url("${trick.originalPosterUrl ?? trick.posterUrl}")`,
          }}
          aria-hidden="true"
        />
      )}
      <section
        className={styles.content}
        aria-label={`${trick.name} trick guide`}
      >
        <TrickViewer
          trick={trick}
          tricks={tricks}
          category={category}
          categories={categories}
          controllerPlatform={controllerPlatform}
          stance={stance}
          onControllerPlatformChange={setControllerPlatform}
          onStanceChange={setStance}
          previousTrick={previousTrick}
          nextTrick={nextTrick}
        />
      </section>
    </main>
  );
}
