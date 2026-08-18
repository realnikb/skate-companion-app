import type { Metadata } from "next";

import { TrickDirectory } from "@/components/tricks/trick-directory";
import { getCategories } from "@/lib/tricks/get-categories";
import { getTricks } from "@/lib/tricks/get-tricks";
import styles from "./tricks.module.scss";

export const metadata: Metadata = {
  title: "EA Skate Tricks Guide | Online Skatepedia",
  description:
    "Learn how to do tricks in EA Skate with the Skate Companion Online Skatepedia. Search flips, grabs, grinds and manuals with controls, videos and step-by-step guides.",
  keywords: [
    "EA Skate tricks",
    "how to do tricks in skate",
    "EA Skate Online Skatepedia",
    "Skate trick controls",
    "Skate trick guide",
  ],
  alternates: { canonical: "/tricks" },
  openGraph: {
    title: "EA Skate Online Skatepedia — Every Trick Explained",
    description:
      "Search EA Skate tricks by type and learn each trick with controls, video demonstrations and concise guides.",
    type: "website",
    url: "/tricks",
  },
};

export default async function TricksPage() {
  const [categories, tricks] = await Promise.all([
    getCategories(),
    getTricks(),
  ]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "EA Skate Online Skatepedia",
    description:
      "A searchable guide to EA Skate tricks, controls and video tutorials.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: tricks.length,
      itemListElement: tricks.map((trick, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `How to do a ${trick.name} in EA Skate`,
        url: `/tricks/${trick.slug}`,
      })),
    },
  };

  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span>Skate Companion presents</span>
          <h1>
            EA Skate Online
            <br />
            <em>Skatepedia</em>
          </h1>
          <p>
            Learn how to do tricks in EA Skate. Find controller inputs, video
            demonstrations and practical guides for flips, grabs, grinds,
            manuals and more.
          </p>
        </div>
      </section>
      <div className={styles.content}>
        <TrickDirectory categories={categories} tricks={tricks} />
      </div>
    </main>
  );
}
