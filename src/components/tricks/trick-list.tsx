import type { Trick } from "@/types/trick";
import { TrickListItem } from "@/components/tricks/trick-list-item";
import styles from "./trick-list.module.scss";

type TrickListProps = {
  tricks: Trick[];
  selectedTrickSlug: string;
  searchQuery: string;
  onSelectTrick: (slug: string) => void;
};

export function TrickList({
  tricks,
  selectedTrickSlug,
  searchQuery,
  onSelectTrick,
}: TrickListProps) {
  return (
    <section className={styles.panel} aria-labelledby="trick-list-title">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Selected Set</p>
        <h2 id="trick-list-title">Tricks</h2>
      </div>

      {tricks.length > 0 ? (
        <ul className={styles.list}>
          {tricks.map((trick) => (
            <TrickListItem
              key={trick.slug}
              trick={trick}
              isSelected={trick.slug === selectedTrickSlug}
              onSelect={onSelectTrick}
            />
          ))}
        </ul>
      ) : (
        <div className={styles.emptyState} role="status">
          <p>
            No tricks match {searchQuery ? `"${searchQuery}"` : "this filter"}.
          </p>
          <span>Try another name or alias.</span>
        </div>
      )}
    </section>
  );
}
