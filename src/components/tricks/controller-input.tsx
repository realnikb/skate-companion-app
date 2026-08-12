import Image from "next/image";

import type { ControllerPlatform, NormalizedControlInput } from "@/types/trick";
import styles from "./controller-input.module.scss";

type InputPresentation = { icon: string; label: string };

const buttonPresentation = {
    xbox: {
        "face-top": ["xbox_button_y", "Y"], "face-right": ["xbox_button_b", "B"], "face-bottom": ["xbox_button_a", "A"], "face-left": ["xbox_button_x", "X"],
        "left-trigger": ["xbox_lt", "LT"], "right-trigger": ["xbox_rt", "RT"], "left-bumper": ["xbox_lb", "LB"], "right-bumper": ["xbox_rb", "RB"],
        "dpad-up": ["xbox_dpad_up", "D-pad up"], "dpad-right": ["xbox_dpad_right", "D-pad right"], "dpad-down": ["xbox_dpad_down", "D-pad down"], "dpad-left": ["xbox_dpad_left", "D-pad left"],
    },
    playstation: {
        "face-top": ["playstation_button_triangle", "Triangle"], "face-right": ["playstation_button_circle", "Circle"], "face-bottom": ["playstation_button_cross", "Cross"], "face-left": ["playstation_button_square", "Square"],
        "left-trigger": ["playstation_trigger_l2", "L2"], "right-trigger": ["playstation_trigger_r2", "R2"], "left-bumper": ["playstation_trigger_l1", "L1"], "right-bumper": ["playstation_trigger_r1", "R1"],
        "dpad-up": ["playstation_dpad_up", "D-pad up"], "dpad-right": ["playstation_dpad_right", "D-pad right"], "dpad-down": ["playstation_dpad_down", "D-pad down"], "dpad-left": ["playstation_dpad_left", "D-pad left"],
    },
} as const;

function presentation(input: Extract<NormalizedControlInput, { type: "button" }>, platform: ControllerPlatform): InputPresentation {
    const [file, label] = buttonPresentation[platform][input.control];
    return { icon: `/controller-icons/${platform}/${file}.svg`, label };
}

function StickMovement({ input }: { input: Extract<NormalizedControlInput, { type: "stick" }> }) {
    const path = input.path.points.map((point, index) => `${index ? "L" : "M"} ${32 + point.x * 22} ${32 + point.y * 22}`).join(" ");
    return <svg className={styles.icon} viewBox="0 0 64 64" role="img" aria-label={`${input.stick} stick ${input.action}`}>
        <defs><marker id="control-arrow" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="9.5" refY="5.5" orient="auto"><path className={styles.markerArrow} d="M0 0 11 5.5 0 11Z" /></marker></defs>
        <circle className={styles.stickDisc} cx="32" cy="32" r="22" />
        {input.path.points.length > 1 && <path className={styles.motionPath} d={path} markerEnd="url(#control-arrow)" />}
    </svg>;
}

export function ControllerInput({ input, platform }: { input: NormalizedControlInput; platform: ControllerPlatform }) {
    if (input.type === "stick") return <div className={`${styles.input} ${styles.stickInput}`}><StickMovement input={input} /><span>{input.stick} stick<small>{input.action.replaceAll("-", " ")}</small></span></div>;
    const item = presentation(input, platform);
    return <div className={styles.input}><Image className={styles.icon} src={item.icon} alt="" width={64} height={64} unoptimized /><span>{item.label}<small>{input.action}</small></span></div>;
}
