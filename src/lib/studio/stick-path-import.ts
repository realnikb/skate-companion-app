import { parseStickPoints } from "@/lib/tricks/stick-paths";
import type { StickPoint } from "@/types/trick";

export type StickPathImportInput = {
  id: string;
  slug: string;
  name: string;
  points: StickPoint[];
};
export type ExistingStickPath = StickPathImportInput;
export type StickPathImportAction = "create" | "update" | "unchanged" | "error";
export type StickPathImportPreview = {
  action: StickPathImportAction;
  input: StickPathImportInput | null;
  existingId?: string;
  changes: string[];
  error?: string;
  index: number;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function samePoints(left: StickPoint[], right: StickPoint[]) {
  return (
    left.length === right.length &&
    left.every(
      (point, index) =>
        point.x === right[index].x && point.y === right[index].y,
    )
  );
}

export function readStickPathImport(raw: string): unknown[] {
  const parsed: unknown = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.stick_inputs)) return record.stick_inputs;
    if (Array.isArray(record.stick_paths)) return record.stick_paths;
  }
  throw new Error(
    'Expected a JSON array, or an object containing a "stick_inputs" or "stick_paths" array.',
  );
}

function validateRow(value: unknown): {
  input: StickPathImportInput | null;
  error?: string;
} {
  if (typeof value !== "object" || value === null)
    return { input: null, error: "Entry must be an object." };
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const points = parseStickPoints(row.points);
  if (!uuidPattern.test(id))
    return { input: null, error: "A valid UUID id is required." };
  if (!slugPattern.test(slug))
    return {
      input: null,
      error:
        "Slug must contain lowercase letters, numbers, and single hyphens only.",
    };
  if (!name || name.length > 160)
    return { input: null, error: "Name must be between 1 and 160 characters." };
  if (!points)
    return {
      input: null,
      error:
        "Points must contain 1–128 finite x/y coordinates between -1 and 1.",
    };
  return { input: { id, slug, name, points } };
}

export function previewStickPathImport(
  rows: unknown[],
  existing: ExistingStickPath[],
): StickPathImportPreview[] {
  const byId = new Map(existing.map((path) => [path.id, path]));
  const bySlug = new Map(existing.map((path) => [path.slug, path]));
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  return rows.map((row, index) => {
    const validated = validateRow(row);
    if (!validated.input)
      return {
        action: "error",
        input: null,
        changes: [],
        error: validated.error,
        index,
      };
    const input = validated.input;
    if (seenIds.has(input.id))
      return {
        action: "error",
        input,
        changes: [],
        error: `Duplicate id ${input.id} in this file.`,
        index,
      };
    if (seenSlugs.has(input.slug))
      return {
        action: "error",
        input,
        changes: [],
        error: `Duplicate slug /${input.slug} in this file.`,
        index,
      };
    seenIds.add(input.id);
    seenSlugs.add(input.slug);
    const idMatch = byId.get(input.id);
    const slugMatch = bySlug.get(input.slug);
    if (idMatch && slugMatch && idMatch.id !== slugMatch.id)
      return {
        action: "error",
        input,
        changes: [],
        error: `Id matches /${idMatch.slug}, but slug matches a different row.`,
        index,
      };
    const match = idMatch ?? slugMatch;
    if (!match)
      return { action: "create", input, changes: ["New stick control"], index };
    const changes: string[] = [];
    if (match.slug !== input.slug)
      changes.push(`slug: /${match.slug} → /${input.slug}`);
    if (match.name !== input.name)
      changes.push(`name: ${match.name} → ${input.name}`);
    if (!samePoints(match.points, input.points))
      changes.push(
        `path: ${match.points.length} → ${input.points.length} points`,
      );
    return {
      action: changes.length ? "update" : "unchanged",
      input,
      existingId: match.id,
      changes,
      index,
    };
  });
}
