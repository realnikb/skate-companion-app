"use client";

import { useActionState, useRef, useState } from "react";

import { createStickPath, updateStickPath, type StickPathActionState } from "@/app/studio/stick-paths/actions";
import type { StickPathPreset, StickPoint } from "@/types/trick";
import styles from "./stick-path-editor.module.scss";

function pathData(points: StickPoint[]) { return points.map((point, index) => `${index ? "L" : "M"} ${50 + point.x * 40} ${50 + point.y * 40}`).join(" "); }

function edgeArc(start: StickPoint, target: StickPoint, direction: "clockwise" | "anticlockwise") {
    const startAngle = Math.atan2(start.y, start.x);
    const targetAngle = Math.atan2(target.y, target.x);
    let sweep = targetAngle - startAngle;
    if (direction === "clockwise" && sweep <= 0) sweep += Math.PI * 2;
    if (direction === "anticlockwise" && sweep >= 0) sweep -= Math.PI * 2;
    const count = Math.max(2, Math.ceil(Math.abs(sweep) / (Math.PI / 24)));
    return Array.from({ length: count }, (_, index) => { const angle = startAngle + sweep * ((index + 1) / count); return { x: Math.round(Math.cos(angle) * 1000) / 1000, y: Math.round(Math.sin(angle) * 1000) / 1000 }; });
}

export function StickPathEditor({ path }: { path?: StickPathPreset }) {
    const [points, setPoints] = useState<StickPoint[]>(path?.points ?? [{ x: 0, y: 0 }]);
    const [mode, setMode] = useState<"straight" | "clockwise" | "anticlockwise">("straight");
    const svg = useRef<SVGSVGElement>(null);
    const action = path ? updateStickPath : createStickPath;
    const [state, formAction, pending] = useActionState(action, { status: "idle" } as StickPathActionState);

    function addPoint(event: React.MouseEvent<SVGSVGElement>) {
        const bounds = svg.current!.getBoundingClientRect();
        let x = ((event.clientX - bounds.left) / bounds.width * 100 - 50) / 40;
        let y = ((event.clientY - bounds.top) / bounds.height * 100 - 50) / 40;
        const distance = Math.hypot(x, y);
        if (distance > 1) { x /= distance; y /= distance; }
        let next = { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
        const last = points.at(-1)!;
        if (mode !== "straight" && Math.hypot(last.x, last.y) >= .82) {
            const length = Math.hypot(next.x, next.y) || 1;
            next = { x: next.x / length, y: next.y / length };
            setPoints((current) => [...current, ...edgeArc(last, next, mode)].slice(-128));
        } else setPoints((current) => [...current, next].slice(-128));
    }

    return <form action={formAction} className={styles.form}>
        {path && <input type="hidden" name="id" value={path.id} />}
        <input type="hidden" name="points" value={JSON.stringify(points)} />
        <div className={styles.fields}><label>Name<input name="name" defaultValue={path?.name} placeholder="e.g. Bottom-left scoop to top-right" required /><small>The slug is generated automatically and made unique.</small></label></div>
        <div className={styles.workspace}>
            <div className={styles.modes}><button type="button" className={mode === "straight" ? styles.active : undefined} onClick={() => setMode("straight")}>Straight</button><button type="button" className={mode === "clockwise" ? styles.active : undefined} onClick={() => setMode("clockwise")}>Edge ↻</button><button type="button" className={mode === "anticlockwise" ? styles.active : undefined} onClick={() => setMode("anticlockwise")}>Edge ↺</button></div>
            <svg ref={svg} viewBox="0 0 100 100" onClick={addPoint} role="img" aria-label="Click points to construct this reusable stick path"><defs><marker id="path-arrow" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#f4d000" /></marker></defs><circle cx="50" cy="50" r="40" /><line x1="10" y1="50" x2="90" y2="50" /><line x1="50" y1="10" x2="50" y2="90" /><path d={pathData(points)} markerEnd={points.length > 1 ? "url(#path-arrow)" : undefined} /><circle className={styles.start} cx="50" cy="50" r="2.5" /></svg>
            <div className={styles.pathActions}><p>Paths begin in the centre. Add rigid points with Straight, or follow the outside using either edge direction.</p><button type="button" onClick={() => setPoints([{ x: 0, y: 0 }])}>Reset</button></div>
        </div>
        <footer>{state.message && <p className={state.status === "error" ? styles.error : undefined}>{state.message}</p>}<button className={styles.saveAndNew} type="submit" name="intent" value="save-and-new" disabled={pending}>{pending ? "Saving…" : "Save and create new"}</button><button type="submit" name="intent" value="save" disabled={pending}>{pending ? "Saving…" : path ? "Save stick path" : "Create stick path"}</button></footer>
    </form>;
}
