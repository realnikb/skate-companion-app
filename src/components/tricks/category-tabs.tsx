import type { TrickCategory } from "@/types/trick";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import styles from "./category-tabs.module.scss";

type CategoryTabsProps = {
    categories: TrickCategory[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
};

export function CategoryTabs({
    categories,
    selectedCategory,
    onSelectCategory,
}: CategoryTabsProps) {
    return (
        <nav className={styles.tabs} aria-label="Trick categories">
            {categories.map((category) => {
                const isSelected = category.slug === selectedCategory;

                return (
                    <button
                        key={category.slug}
                        className={isSelected ? styles.selectedTab : styles.tab}
                        style={getCategoryTheme(category)}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelectCategory(category.slug)}
                    >
                        {category.name}
                    </button>
                );
            })}
        </nav>
    );
}
