import type { Json } from "@/types/database";
import type { StickPathPreset, StickPoint } from "@/types/trick";

export function parseStickPoints(value: unknown): StickPoint[] | null {
    if (!Array.isArray(value) || value.length < 1 || value.length > 128) return null;
    const points = value.every((point) => typeof point === "object" && point !== null
        && typeof (point as StickPoint).x === "number" && Number.isFinite((point as StickPoint).x) && Math.abs((point as StickPoint).x) <= 1
        && typeof (point as StickPoint).y === "number" && Number.isFinite((point as StickPoint).y) && Math.abs((point as StickPoint).y) <= 1);
    return points ? value as StickPoint[] : null;
}

export function mapStickPath(row: { id: string; slug: string; name: string; points: Json }): StickPathPreset {
    const points = parseStickPoints(row.points);
    if (!points) throw new Error(`Stick path "${row.slug}" has malformed points.`);
    return { id: row.id, slug: row.slug, name: row.name, points };
}
