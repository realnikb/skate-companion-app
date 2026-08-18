import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import styles from "./weekly-grind.module.scss";

const title = "The Weekly Grind - Aug 11, 2026";
const description =
  "Block Parties returns for another weekend, X Games San Van enters week four, and the team shares its latest fixes and improvements.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/news/the-weekly-grind-aug-11-2026" },
  openGraph: {
    title,
    description,
    type: "article",
    publishedTime: "2026-08-11T00:00:00.000Z",
    images: [
      {
        url: "/images/home/weekly-grind-2026-08-11.png",
        width: 1080,
        height: 608,
        alt: "The Weekly Grind",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/home/weekly-grind-2026-08-11.png"],
  },
};

function List({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ul>{children}</ul>;
}

export default function WeeklyGrindPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link className={styles.back} href="/#news">
            <ArrowLeft /> Back to news
          </Link>
          <p className={styles.eyebrow}>
            The Weekly Grind <span>·</span> August 11, 2026
          </p>
          <h1>
            The Weekly
            <br />
            Grind.
          </h1>
          <p className={styles.intro}>
            Welcome back to The Weekly Grind, San Vanners!
          </p>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/images/home/weekly-grind-2026-08-11.png"
            alt="A skater grinding a rail in San Van beneath The Weekly Grind title"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
          />
        </div>
      </header>

      <article className={styles.article}>
        <p className={styles.lede}>Let’s roll!</p>
        <h2>What’s going on?</h2>
        <p>
          First, we had our weekend playtest of Meetups: Block Parties—and are
          stoked you jumped in. We’ve seen tons of comments on what worked, what
          you liked, what you didn’t, ideas and suggestions to improve the mode,
          and more—and we’ve shared the feedback and bugs with the team. Keep it
          comin’!
        </p>
        <p>
          We’re gonna run it back this weekend (Aug 14, 10AM PT to Aug 17, 10AM
          PT), so if you didn’t get a chance to test out Block Parties, dive in.
          The team is already working on tuning, tweaking, and some fixes, so
          make sure to hit up our{" "}
          <a
            href="https://forums.ea.com/discussions/skate-en/meetups-block-parties-feedback-thread/13625308"
            target="_blank"
            rel="noreferrer"
          >
            Feedback <ArrowUpRight />
          </a>{" "}
          and{" "}
          <a
            href="https://forums.ea.com/idea/skate-bug-reports-en/meetups-block-parties-bugs-megathread/13625297"
            target="_blank"
            rel="noreferrer"
          >
            Bug <ArrowUpRight />
          </a>{" "}
          threads to add your voice so the team can continue working on
          improvements.
        </p>
        <p>Speaking of—here’s what they’re tracking:</p>

        <section>
          <p className={styles.sectionLabel}>
            Fixed for the second weekend test
          </p>
          <h3>Busy Spots</h3>
          <List>
            <li>
              Removed the pool at Presidium Residences in Hedgemont from Block
              Party rotations
            </li>
          </List>
          <h3>Gap Distance Detection Issues</h3>
          <List>
            <li>Removed The Promenade in Market Mile</li>
            <li>
              Unfortunately, we’re unable to address generic Gap Distance
              challenges for this weekend
            </li>
          </List>
        </section>

        <section>
          <p className={styles.sectionLabel}>
            In-development improvements for full release
          </p>
          <h3>Pre-Round Score-Carrying Exploit</h3>
          <List>
            <li>Fixing issues with actions starting during Get Ready phase</li>
            <li>Removing Line Score challenges</li>
            <li>Reducing frequency of score-based challenges</li>
          </List>
          <h3>Challenge Detection Issues</h3>
          <List>
            <li>Fixing Gap distance challenge</li>
            <li>Fixing Ollie counts to include Boned Ollies</li>
            <li>Other various fixes</li>
          </List>
          <h3>Inconsistent Objective Zone Detection</h3>
          <List>
            <li>Fixed timing issues with the HUD</li>
          </List>
          <h3>Tricklining Too Dominant as a Strategy</h3>
          <List>
            <li>Adding specific trick challenges</li>
            <li>Removing generic score-based criteria</li>
            <li>Reducing overall frequency of score-based criteria</li>
          </List>
          <h3>Unclear Challenge Descriptions</h3>
          <List>
            <li>Improving challenge descriptions</li>
            <li>Adding trick-helper</li>
          </List>
        </section>

        <section>
          <p className={styles.sectionLabel}>
            Investigating for future improvements
          </p>
          <h3>Score Multiplier</h3>
          <List>
            <li>
              Investigating ways to improve fair competition by removing
              multipliers
            </li>
          </List>
        </section>

        <aside>
          <strong>Minor note</strong>
          <p>
            The Tix rewards for Block Parties are basically bonus Tix. They were
            not built into the tuning for the skate.Pass completion.
          </p>
        </aside>
        <p>
          We’re in week 4 of X Games San Van! Check out the mid-season{" "}
          <a
            href="https://www.ea.com/games/skate/skate/news/x-games-san-van-event"
            target="_blank"
            rel="noreferrer"
          >
            blog <ArrowUpRight />
          </a>{" "}
          for more details. Reminder: X Games San Van is currently Open
          Access—no Rip Chips or skate.Premium Pass required to get in and
          become a legend!
        </p>
        <p>
          The team is reviewing the X Games video contest submissions and we’ll
          be reaching out to finalists in the coming days/week.
        </p>
        <p>
          ICYMI—the Deck Design Winners have been finalized, and those decks
          will be coming in sometime during S5, free for everyone.
        </p>
      </article>
    </main>
  );
}
