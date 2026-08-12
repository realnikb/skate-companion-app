import type { ControllerPlatform } from "@/types/trick";
import styles from "./controller-preference.module.scss";

type ControllerPreferenceProps = {
    platform: ControllerPlatform;
    onChange: (platform: ControllerPlatform) => void;
};

const platforms: Array<{
    value: ControllerPlatform;
    label: string;
}> = [
    { value: "xbox", label: "Xbox" },
    { value: "playstation", label: "PlayStation" },
];

export function ControllerPreference({
    platform,
    onChange,
}: ControllerPreferenceProps) {
    return (
        <div className={styles.preference}>
            <span className={styles.label}>Controls</span>
            <div className={styles.options} role="group" aria-label="Controller preference">
                {platforms.map((option) => {
                    const isSelected = option.value === platform;

                    return (
                        <button
                            key={option.value}
                            className={isSelected ? styles.selectedOption : styles.option}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onChange(option.value)}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
