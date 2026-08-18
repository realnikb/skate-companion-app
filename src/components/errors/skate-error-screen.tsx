"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./skate-error-screen.module.scss";

type SkateErrorScreenProps =
  | { kind: "not-found" }
  | { kind: "error"; onRetry: () => void };

export function SkateErrorScreen(props: SkateErrorScreenProps) {
  const isNotFound = props.kind === "not-found";
  const image = isNotFound
    ? "/images/errors/construction-detour.png"
    : "/images/errors/wrong-way.png";

  return (
    <main className={styles.screen}>
      <Image
        alt="A construction worker blocking a skater's route"
        className={styles.backdrop}
        fill
        priority
        sizes="100vw"
        src={image}
      />
      <div className={styles.scrim} />
      <section className={styles.card} aria-labelledby="error-title">
        <p className={styles.code}>{isNotFound ? "404" : "Bail!"}</p>
        <h1 id="error-title">
          {isNotFound ? "This spot is under construction." : "We hit a pebble."}
        </h1>
        <p>
          {isNotFound
            ? "Looks like this page got fenced off before we could skate it."
            : "That line did not land. Give it another push and we’ll get rolling again."}
        </p>
        <div className={styles.actions}>
          {isNotFound ? (
            <Link className={styles.primaryAction} href="/">
              Roll back home
            </Link>
          ) : (
            <button className={styles.primaryAction} onClick={props.onRetry} type="button">
              Try that line again
            </button>
          )}
          <Link className={styles.secondaryAction} href="/tricks">
            Browse tricks
          </Link>
        </div>
      </section>
    </main>
  );
}
