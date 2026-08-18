"use client";
import Link from "next/link";
import { ArrowUpRight, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { CrewLogo } from "./crew-logo";
import {
  recruitmentLabels,
  type Crew,
  type RecruitmentStatus,
} from "@/lib/crews/crews";
import styles from "./crew-directory.module.scss";
type Filter = "all" | RecruitmentStatus;
export function CrewDiscovery({ crews }: { crews: Crew[] }) {
  const [filter, setFilter] = useState<Filter>("all"),
    [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      crews.filter(
        (crew) =>
          (filter === "all" || crew.recruitment === filter) &&
          `${crew.name} ${crew.location} ${crew.style.join(" ")} ${crew.languages.map((language) => `${language.name} ${language.code}`).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [crews, filter, query],
  );
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Find your people</span>
        <h1>
          Crews to
          <br />
          <em>skate with.</em>
        </h1>
        <p>Search by style, region, language, and recruitment status.</p>
      </section>
      <section className={styles.directory} id="discover">
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {(["all", "recruiting", "invite-only", "closed"] as Filter[]).map(
              (value) => (
                <button
                  key={value}
                  data-active={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value === "all" ? "All crews" : recruitmentLabels[value]}
                </button>
              ),
            )}
          </div>
          <label className={styles.search}>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search crews, languages, regions…"
            />
          </label>
        </div>
        <div className={styles.sectionHeading}>
          <div>
            <span>Community crews</span>
            <h2>
              {crews.length
                ? "Find your next session."
                : "The first crew starts here."}
            </h2>
          </div>
          <small>{visible.length} crews shown</small>
        </div>
        <div className={styles.grid}>
          {visible.map((crew, index) => (
            <Link
              className={styles.card}
              href={`/social/crew/${crew.slug}`}
              key={crew.id}
              style={{ "--crew-accent": crew.accent } as React.CSSProperties}
            >
              <div className={styles.cardTop}>
                <CrewLogo
                  initials={crew.initials}
                  accent={crew.accent}
                  imageUrl={crew.logoUrl}
                  size="medium"
                />
                <span className={styles.status} data-status={crew.recruitment}>
                  <i />
                  {recruitmentLabels[crew.recruitment]}
                </span>
              </div>
              <div className={styles.cardNumber}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className={styles.cardBody}>
                <h3>{crew.name}</h3>
                <p>{crew.tagline}</p>
                <div className={styles.tags}>
                  {crew.style.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={styles.cardSignals}>
                <div className={styles.languages}>
                  {crew.languages.map((language) => (
                    <span title={language.name} key={language.code}>
                      {language.flag}
                      <i>{language.name}</i>
                    </span>
                  ))}
                </div>
                {crew.discord && (
                  <span className={styles.discordCount}>
                    Discord · {crew.discord.memberCount?.toLocaleString()}
                  </span>
                )}
              </div>
              <div className={styles.cardFooter}>
                <span>
                  <Users /> {crew.memberCount} members
                </span>
                <span>{crew.location}</span>
                <ArrowUpRight />
              </div>
            </Link>
          ))}
        </div>
        {!visible.length && (
          <div className={styles.empty}>
            {crews.length ? (
              "No crews match that search."
            ) : (
              <>
                <strong>No crews yet.</strong>
                <span>
                  Create yours from your account and it will appear here.
                </span>
                <Link href="/account/crews/new">
                  Create a crew <ArrowUpRight />
                </Link>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
