"use server";

import { revalidatePath } from "next/cache";
import { requireStudioUser } from "@/lib/studio/auth";
import {
  previewStickPathImport,
  readStickPathImport,
  type ExistingStickPath,
} from "@/lib/studio/stick-path-import";
import { mapStickPath } from "@/lib/tricks/stick-paths";
import type { Json } from "@/types/database";

export type StickPathImportState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function importStickPaths(
  _state: StickPathImportState,
  formData: FormData,
): Promise<StickPathImportState> {
  const { supabase } = await requireStudioUser();
  const raw = formData.get("json");
  if (typeof raw !== "string" || !raw.trim())
    return { status: "error", message: "Choose or paste a JSON export first." };
  if (raw.length > 750_000)
    return {
      status: "error",
      message: "The import is too large (750 KB maximum).",
    };
  let rows: unknown[];
  try {
    rows = readStickPathImport(raw);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Invalid JSON.",
    };
  }
  if (!rows.length)
    return {
      status: "error",
      message: "The import contains no stick controls.",
    };
  if (rows.length > 500)
    return {
      status: "error",
      message: "An import can contain at most 500 stick controls.",
    };
  const { data, error } = await supabase
    .from("stick_paths")
    .select("id,slug,name,points");
  if (error) return { status: "error", message: error.message };
  let existing: ExistingStickPath[];
  try {
    existing = (data ?? []).map(mapStickPath);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Existing stick controls could not be validated.",
    };
  }
  const preview = previewStickPathImport(rows, existing);
  const invalid = preview.filter((item) => item.action === "error");
  if (invalid.length)
    return {
      status: "error",
      message: `Import stopped: ${invalid.length} invalid or ambiguous ${invalid.length === 1 ? "entry" : "entries"}. Preview the file again for details.`,
    };
  const changed = preview.filter(
    (item) => item.action === "create" || item.action === "update",
  );
  if (!changed.length)
    return {
      status: "success",
      message: `Nothing changed. All ${preview.length} stick controls already match.`,
    };
  const payload = changed.map((item) => ({
    id: item.existingId ?? item.input!.id,
    slug: item.input!.slug,
    name: item.input!.name,
    points: item.input!.points as unknown as Json,
  }));
  const { error: writeError } = await supabase
    .from("stick_paths")
    .upsert(payload, { onConflict: "id" });
  if (writeError)
    return {
      status: "error",
      message: `Import failed without applying changes: ${writeError.message}`,
    };
  const created = preview.filter((item) => item.action === "create").length;
  const updated = preview.filter((item) => item.action === "update").length;
  revalidatePath("/studio/stick-paths");
  revalidatePath("/studio/stick-paths/import");
  return {
    status: "success",
    message: `Import complete: ${created} created, ${updated} updated, ${preview.length - created - updated} unchanged.`,
  };
}
