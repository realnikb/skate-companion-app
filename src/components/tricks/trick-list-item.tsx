import type { Trick } from "@/types/trick";
import styles from "./trick-list-item.module.scss";

type TrickListItemProps = {
  trick: Trick;
  isSelected: boolean;
  onSelect: (slug: string) => void;
};

export function TrickListItem({
  trick,
  isSelected,
  onSelect,
}: TrickListItemProps) {
  return (
    <li>
      <button
        className={isSelected ? styles.selectedItem : styles.item}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(trick.slug)}
      >
        <span className={styles.name}>{trick.name}</span>
        {trick.context ? (
          <span className={styles.context}>{trick.context}</span>
        ) : null}
      </button>
    </li>
  );
}
