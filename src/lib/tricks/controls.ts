import type {
    ControlButton,
    ControlInput,
    ControlVariant,
    NormalizedControlInput,
    SkaterStance,
    TrickControls,
} from "@/types/trick";

const buttons = new Set<ControlButton>([
    "left-trigger", "right-trigger", "left-bumper", "right-bumper",
    "face-top", "face-right", "face-bottom", "face-left",
    "dpad-up", "dpad-right", "dpad-down", "dpad-left",
]);
const buttonActions = new Set(["press", "hold", "release"]);
const stickActions = new Set(["flick", "scoop", "scoop-then-flick", "rotate", "hold", "release"]);

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedInput(value: unknown): value is NormalizedControlInput {
    if (!record(value)) return false;
    if (value.join !== undefined && value.join !== "and" && value.join !== "or") return false;
    if (value.type === "button") return buttons.has(value.control as ControlButton) && buttonActions.has(String(value.action));
    if (value.type !== "stick" || (value.stick !== "left" && value.stick !== "right") || !stickActions.has(String(value.action)) || !record(value.path) || !Array.isArray(value.path.points)) return false;
    return value.path.points.length <= 128 && value.path.points.every((point) => record(point) && typeof point.x === "number" && Number.isFinite(point.x) && Math.abs(point.x) <= 1 && typeof point.y === "number" && Number.isFinite(point.y) && Math.abs(point.y) <= 1);
}

export function parseTrickControls(value: unknown): TrickControls | null {
    if (!record(value) || value.version !== 2 || (value.authoredStance !== "goofy" && value.authoredStance !== "regular") || !Array.isArray(value.variants)) return null;
    const valid = value.variants.every((variant) => record(variant)
        && (variant.context === undefined || typeof variant.context === "string")
        && (variant.stanceBehavior === "mirror" || variant.stanceBehavior === "fixed")
        && Array.isArray(variant.steps)
        && variant.steps.every((step) => record(step) && Array.isArray(step.inputs) && step.inputs.length > 0 && step.inputs.every(normalizedInput)));
    return valid ? value as unknown as TrickControls : null;
}

function legacyButton(control: Exclude<ControlInput, { type: "stick" }>): NormalizedControlInput {
    if (control.type === "face-button") return { type: "button", control: `face-${control.position}`, action: control.action };
    if (control.type === "d-pad") return { type: "button", control: `dpad-${control.direction}`, action: control.action };
    return { type: "button", control: `${control.side}-${control.type === "trigger" ? "trigger" : "bumper"}`, action: control.action };
}

function upgradeLegacy(value: unknown): TrickControls | null {
    if (!Array.isArray(value)) return null;
    const inputs: NormalizedControlInput[] = [];
    for (const item of value) {
        if (!record(item) || typeof item.type !== "string") return null;
        const control = item as unknown as ControlInput;
        if (control.type === "stick") {
            if ((control.stick !== "left" && control.stick !== "right") || !stickActions.has(control.action)) return null;
            inputs.push({ type: "stick", stick: control.stick, action: control.action, path: { points: [] } });
        } else if (["face-button", "d-pad", "trigger", "bumper"].includes(control.type)) inputs.push(legacyButton(control as Exclude<ControlInput, { type: "stick" }>));
        else return null;
    }
    return { version: 2, authoredStance: "goofy", variants: inputs.length ? [{ stanceBehavior: "mirror", steps: inputs.map((input) => ({ inputs: [input] })) }] : [] };
}

export function normalizeTrickControls(value: unknown): TrickControls {
    return parseTrickControls(value) ?? upgradeLegacy(value) ?? { version: 2, authoredStance: "goofy", variants: [] };
}

function mirrorInput(input: NormalizedControlInput): NormalizedControlInput {
    if (input.type === "stick") return { ...input, path: { ...input.path, points: input.path.points.map(({ x, y }) => ({ x: -x, y })) } };
    if (input.control === "left-trigger") return { ...input, control: "right-trigger" };
    if (input.control === "right-trigger") return { ...input, control: "left-trigger" };
    return input;
}

export function controlsForStance(controls: TrickControls, stance: SkaterStance): ControlVariant[] {
    if (controls.authoredStance === stance) return controls.variants;
    return controls.variants.map((variant) => variant.stanceBehavior === "fixed" ? variant : {
        ...variant,
        steps: variant.steps.map((step) => ({ inputs: step.inputs.map(mirrorInput) })),
    });
}

export function hasControls(controls: TrickControls) {
    return controls.variants.some((variant) => variant.steps.some((step) => step.inputs.length));
}
