import type { ControlVariant, ControllerPlatform, NormalizedControlInput } from "@/types/trick";
import { ControllerInput } from "./controller-input";
import styles from "./trick-viewer.module.scss";

function groupAlternatives(inputs: NormalizedControlInput[]) {
    return inputs.reduce<NormalizedControlInput[][]>((groups, input, index) => {
        if (index > 0 && input.join === "or") groups.at(-1)!.push(input);
        else groups.push([input]);
        return groups;
    }, []);
}

export function ControlSequence({ variants, platform, compact = false }: { variants: ControlVariant[]; platform: ControllerPlatform; compact?: boolean }) {
    return <div className={`${styles.controlVariants} ${compact ? styles.compactControlVariants : ""}`}>{variants.map((variant, variantIndex) => <div className={styles.controlVariant} key={variantIndex}>
        {variant.context && <strong className={styles.controlContext}>{variant.context}</strong>}
        <div className={styles.controlStrip}>{variant.steps.map((step, stepIndex) => <div className={styles.sequencePart} key={stepIndex}>
            {stepIndex > 0 && <span className={styles.thenLabel}>Then</span>}
            <div className={styles.controlStep}>{groupAlternatives(step.inputs).map((group, groupIndex) => <div className={styles.controlRequirement} key={groupIndex}>
                {groupIndex > 0 && <span className={styles.andLabel}>And</span>}
                <div className={styles.alternativeGroup}>{group.map((input, inputIndex) => <div className={styles.controlChord} key={inputIndex}>
                    {inputIndex > 0 && <span className={styles.orLabel}>Or</span>}
                    <ControllerInput input={input} platform={platform} compact={compact} />
                </div>)}</div>
            </div>)}</div>
        </div>)}</div>
    </div>)}</div>;
}
