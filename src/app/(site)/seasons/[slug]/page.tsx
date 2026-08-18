import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import styles from "./season.module.scss";

type Season = {
  number: string;
  title: string;
  subtitle: string;
  date: string;
  run: string;
  image: string;
  source: string;
  intro: string;
  sections: { label: string; title: string; copy: string; items: string[] }[];
};

const seasons: Record<string, Season> = {
  "season-4": {
    number: "04",
    title: "Season 4",
    subtitle: "X Games Arrives",
    date: "May 28, 2026",
    run: "June 2 – August 25, 2026",
    image: "/images/home/seasons/season-4.png",
    source: "https://www.ea.com/games/skate/skate/news/skate-season-4",
    intro:
      "The San Van Open turns the city into a summer-long skate festival, opening the Stadium and building toward X Games San Van.",
    sections: [
      {
        label: "New ground",
        title: "The Stadium opens",
        copy: "Lucre Financial Stadium becomes the centre of the season, pairing huge-air lines with competition layouts. Hedgemont also receives a newly designed Community Park built for smoother sessions.",
        items: [
          "The Stadium interior",
          "A rebuilt Hedgemont Community Park",
          "Summer lighting and refreshed city artwork",
        ],
      },
      {
        label: "Gameplay",
        title: "Fingerflips and Spot Battles",
        copy: "Season 4 expands the trick library with a deep set of fingerflip variations. Mid-season, X Games Spot Battles bring a three-round, turn-based contest where every landed sequence counts.",
        items: [
          "Fingerflip variations and Skatepedia guides",
          "X Games Spot Battles",
          "Skater Codes for finding friends",
          "Task pinning and gameplay-density controls",
        ],
      },
      {
        label: "Season life",
        title: "A louder San Van",
        copy: "Go Skate Weekend and X Games headline the event calendar, while 21 soundtrack additions and thousands of new pedestrian dialogue lines give the city a fresh summer pulse.",
        items: [
          "31+ seasonal and event challenges",
          "273+ daily, weekly, monthly and event tasks",
          "New gear from Spitfire, Real, Thunder, Quasi and more",
        ],
      },
    ],
  },
  "season-3": {
    number: "03",
    title: "Season 3",
    subtitle: "The Isle of Grom",
    date: "March 5, 2026",
    run: "March 10 – June 2, 2026",
    image: "/images/home/seasons/season-3.png",
    source: "https://www.ea.com/games/skate/skate/news/skate-season-3",
    intro:
      "Fluid Flashback looks to skateboarding’s formative 1970s era, bringing warm colour, new routes and a long-awaited return to the Isle of Grom.",
    sections: [
      {
        label: "New ground",
        title: "Return to Grom",
        copy: "San Van takes on a bold seventies-inspired visual identity. The Isle of Grom returns alongside a skateable route through Tri Towers Garage and new Speedline challenges.",
        items: [
          "The Isle of Grom",
          "Tri Towers Garage",
          "Technical and time-trial Speedlines",
          "Skate Paddy’s, Grom and Creator events",
        ],
      },
      {
        label: "Gameplay",
        title: "Dark tricks after dark",
        copy: "Dark flips and darkslides broaden the technical trick set, while improved boneless behaviour makes the classics more responsive and reliable.",
        items: [
          "Six dark-flip variations",
          "Frontside and backside darkslides",
          "Improved boneless tricks",
          "Opt-in party collision",
        ],
      },
      {
        label: "Create",
        title: "Make it your own",
        copy: "Loadouts make it easier to save complete skater setups. Tattoos arrive with flexible placement, while new Replay Editor effects offer more control over the colour, lens and speed of every clip.",
        items: [
          "Skater loadouts",
          "52 tattoo designs",
          "Replay exposure, temperature and saturation controls",
          "Keyframed playback speed and fisheye-style distortion",
        ],
      },
    ],
  },
  "season-2": {
    number: "02",
    title: "Season 2",
    subtitle: "Back to the 80s",
    date: "November 25, 2025",
    run: "December 2, 2025 – March 10, 2026",
    image: "/images/home/seasons/season-2.png",
    source: "https://www.ea.com/games/skate/skate/news/skate-season-2",
    intro:
      "Future Radical rewinds San Van to the eighties with neon, arcades and punk-versus-pop energy—plus more ways to skate together.",
    sections: [
      {
        label: "New ground",
        title: "The city goes radical",
        copy: "The season opens permanent new skateable areas across rooftops and underground spaces, wrapped in San Van’s first full retro-futurist makeover.",
        items: [
          "Casper Hotel Rooftop",
          "Eelside Tunnels",
          "Museum of Natural History Roof Patio",
          "Canal Building",
        ],
      },
      {
        label: "Gameplay",
        title: "Impossible gets real",
        copy: "Impossibles arrive in a Skate game for the first time, supported by a much larger handplant system with held, fakie and chained variations.",
        items: [
          "Impossible and front-foot impossible families",
          "16 handplant variants",
          "Held and chained handplants",
          "New control and HUD settings",
        ],
      },
      {
        label: "Together",
        title: "Built for the crew",
        copy: "A new co-op mode, party voice chat and world beacons make meeting up easier. The Replay Editor also gets its first major toolset expansion for more deliberate clips.",
        items: [
          "Co-op play and party voice chat",
          "Party Beacons",
          "Advanced Replay Editor trimming and keyframes",
          "100 skate.Pass tiers and new brand gear",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(seasons).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/seasons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const season = seasons[slug];
  if (!season) return {};
  const description = `${season.subtitle}: highlights from ${season.title} of skate.`;
  return {
    title: `${season.title} — ${season.subtitle}`,
    description,
    alternates: { canonical: `/seasons/${slug}` },
    openGraph: {
      title: `${season.title} — ${season.subtitle}`,
      description,
      type: "article",
      images: [{ url: season.image, alt: `${season.title} artwork` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${season.title} — ${season.subtitle}`,
      description,
      images: [season.image],
    },
  };
}

export default async function SeasonPage({
  params,
}: PageProps<"/seasons/[slug]">) {
  const { slug } = await params;
  const season = seasons[slug];
  if (!season) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <Image
          src={season.image}
          alt={`${season.title} promotional artwork`}
          fill
          preload
          sizes="100vw"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <Link className={styles.back} href="/#archives">
            <ArrowLeft /> Season archives
          </Link>
          <p className={styles.eyebrow}>
            Season {season.number} <span>·</span> {season.date}
          </p>
          <h1>{season.title}</h1>
          <p className={styles.subtitle}>{season.subtitle}</p>
          <p className={styles.run}>{season.run}</p>
        </div>
      </header>

      <article className={styles.article}>
        <p className={styles.lede}>{season.intro}</p>
        {season.sections.map((section) => (
          <section key={section.title}>
            <p className={styles.sectionLabel}>{section.label}</p>
            <h2>{section.title}</h2>
            <p>{section.copy}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <aside>
          <p>Adapted from the official season overview.</p>
          <a href={season.source} target="_blank" rel="noreferrer">
            Read the full article on EA <ArrowUpRight />
          </a>
        </aside>
      </article>
    </main>
  );
}
