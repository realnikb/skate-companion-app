"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStudioUser } from "@/lib/studio/auth";
import type { Json } from "@/types/database";
import { parseTrickControls } from "@/lib/tricks/controls";
import { mapStickPath } from "@/lib/tricks/stick-paths";
import type { TrickControls } from "@/types/trick";

export type StudioActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  savedAt?: string;
  savedBy?: string;
};

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function nullable(formData: FormData, key: string) {
  const item = value(formData, key);
  return item || null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function validHexColor(color: string) {
  return /^#[0-9a-f]{6}$/i.test(color);
}

const trickDifficulties = new Set([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

function difficultyValue(formData: FormData) {
  const difficulty = value(formData, "difficulty");
  return trickDifficulties.has(difficulty)
    ? (difficulty as "beginner" | "intermediate" | "advanced" | "expert")
    : null;
}

export async function createTrick(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const name = value(formData, "name");
  const slug = value(formData, "slug");
  const categoryId = value(formData, "category_id");
  const description = value(formData, "description");
  if (!name || !slug || !categoryId || !description)
    return {
      status: "error",
      message: "Complete every required field before creating the draft.",
    };
  if (!validSlug(slug))
    return {
      status: "error",
      message: "Slug must contain lowercase letters, numbers and hyphens only.",
    };

  const { supabase, user } = await requireStudioUser();
  const { data: lastTrick } = await supabase
    .from("tricks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: trick, error } = await supabase
    .from("tricks")
    .insert({
      name,
      slug,
      category_id: categoryId,
      description,
      difficulty: difficultyValue(formData),
      aliases: [],
      controls: { version: 2, authoredStance: "goofy", variants: [] },
      video_path: "",
      controls_reference_path: "",
      controls_clean_path: "",
      is_published: false,
      needs_control_review: true,
      needs_description_review: true,
      sort_order: (lastTrick?.sort_order ?? 0) + 10,
      last_edited_by: user.email,
    })
    .select("id")
    .single();
  if (error)
    return {
      status: "error",
      message:
        error.code === "23505" ? "That slug is already in use." : error.message,
    };
  revalidatePath("/studio");
  revalidatePath("/studio/tricks");
  redirect(`/studio/tricks/${trick.id}`);
}

export async function createCategory(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const name = value(formData, "name");
  const slug = value(formData, "slug");
  const description = nullable(formData, "description");
  const parentId = nullable(formData, "parent_id");

  if (!name || !slug)
    return { status: "error", message: "Category name and slug are required." };
  if (!validSlug(slug))
    return {
      status: "error",
      message: "Slug must contain lowercase letters, numbers and hyphens only.",
    };

  const { supabase } = await requireStudioUser();
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("trick_categories")
      .select("id")
      .eq("id", parentId)
      .maybeSingle();
    if (parentError || !parent)
      return { status: "error", message: "Select a valid parent category." };
  }

  const { data: lastCategory, error: orderError } = await supabase
    .from("trick_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) return { status: "error", message: orderError.message };

  const { data: category, error } = await supabase
    .from("trick_categories")
    .insert({
      name,
      slug,
      description,
      parent_id: parentId,
      sort_order: (lastCategory?.sort_order ?? 0) + 10,
      is_published: false,
    })
    .select("id")
    .single();
  if (error)
    return {
      status: "error",
      message:
        error.code === "23505" ? "That slug is already in use." : error.message,
    };

  revalidatePath("/studio");
  revalidatePath("/studio/categories");
  redirect(`/studio/categories/${category.id}`);
}

export async function createPage(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const title = value(formData, "title");
  const slug = value(formData, "slug");
  if (!title || !slug)
    return { status: "error", message: "Page title and slug are required." };
  if (!validSlug(slug))
    return {
      status: "error",
      message: "Slug must contain lowercase letters, numbers and hyphens only.",
    };

  const { supabase, user } = await requireStudioUser();
  const { data: page, error } = await supabase
    .from("content_pages")
    .insert({
      title,
      slug,
      eyebrow: nullable(formData, "eyebrow"),
      summary: nullable(formData, "summary"),
      body: value(formData, "body"),
      is_published: false,
      last_edited_by: user.email,
    })
    .select("id")
    .single();
  if (error)
    return {
      status: "error",
      message:
        error.code === "23505" ? "That slug is already in use." : error.message,
    };
  revalidatePath("/studio/pages");
  redirect(`/studio/pages/${page.id}`);
}

export async function updatePage(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const id = value(formData, "id");
  const title = value(formData, "title");
  const slug = value(formData, "slug");
  const body = value(formData, "body");
  if (!id || !title || !slug || !body)
    return {
      status: "error",
      message: "Title, slug and page content are required.",
    };
  if (!validSlug(slug))
    return {
      status: "error",
      message: "Slug must contain lowercase letters, numbers and hyphens only.",
    };

  const { supabase, user } = await requireStudioUser();
  const { data: savedPage, error } = await supabase
    .from("content_pages")
    .update({
      title,
      slug,
      eyebrow: nullable(formData, "eyebrow"),
      summary: nullable(formData, "summary"),
      body,
      is_published: value(formData, "publication_status") === "published",
      last_edited_by: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("updated_at,last_edited_by")
    .maybeSingle();
  if (error)
    return {
      status: "error",
      message:
        error.code === "23505" ? "That slug is already in use." : error.message,
    };
  if (!savedPage)
    return {
      status: "error",
      message:
        "The page could not be updated. Refresh and confirm your Studio access.",
    };
  revalidatePath("/studio/pages");
  revalidatePath(`/studio/pages/${id}`);
  revalidatePath(`/${slug}`);
  return {
    status: "success",
    message: "Page saved.",
    savedAt: savedPage.updated_at,
    savedBy: savedPage.last_edited_by ?? user.email,
  };
}

export async function updateTrick(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const id = value(formData, "id");
  const name = value(formData, "name");
  const slug = value(formData, "slug");
  const categoryId = value(formData, "category_id");
  const description = value(formData, "description");
  const videoPath = value(formData, "video_path");
  const controlsReferencePath = value(formData, "controls_reference_path");
  const controlsCleanPath = value(formData, "controls_clean_path");

  if (!id || !name || !categoryId || !description || !videoPath) {
    return {
      status: "error",
      message: "Complete every required field before saving.",
    };
  }
  if (!validSlug(slug))
    return {
      status: "error",
      message: "Slug must contain lowercase letters, numbers and hyphens only.",
    };

  let parsedControls: TrickControls;
  try {
    const parsed = JSON.parse(value(formData, "controls")) as unknown;
    const validated = parseTrickControls(parsed);
    if (!validated) throw new Error("Invalid normalized controls");
    parsedControls = validated;
  } catch {
    return {
      status: "error",
      message:
        "Controls are invalid. Every step needs at least one valid input and every path point must stay inside the stick area.",
    };
  }

  const aliases = value(formData, "aliases")
    .split(/[\n,]/)
    .map((alias) => alias.trim())
    .filter(Boolean);
  const { supabase, user } = await requireStudioUser();
  const pathIds = [
    ...new Set(
      parsedControls.variants.flatMap((variant) =>
        variant.steps.flatMap((step) =>
          step.inputs.flatMap((input) =>
            input.type === "stick" && input.pathId ? [input.pathId] : [],
          ),
        ),
      ),
    ),
  ];
  const { data: savedPaths, error: pathError } = pathIds.length
    ? await supabase
        .from("stick_paths")
        .select("id,slug,name,points")
        .in("id", pathIds)
    : { data: [], error: null };
  if (pathError)
    return {
      status: "error",
      message: `Could not validate stick paths: ${pathError.message}`,
    };
  if ((savedPaths ?? []).length !== pathIds.length)
    return {
      status: "error",
      message:
        "One or more selected stick paths no longer exist. Choose another path and try again.",
    };
  const pointsByPathId = new Map(
    (savedPaths ?? []).map((row) => {
      const path = mapStickPath(row);
      return [path.id, path.points] as const;
    }),
  );
  const hydratedControls = structuredClone(parsedControls);
  hydratedControls.variants.forEach((variant) =>
    variant.steps.forEach((step) =>
      step.inputs.forEach((input) => {
        if (input.type === "stick" && input.pathId)
          input.path.points =
            pointsByPathId.get(input.pathId) ?? input.path.points;
      }),
    ),
  );
  const controls = hydratedControls as unknown as Json;
  const { data: savedTrick, error } = await supabase
    .from("tricks")
    .update({
      name,
      slug,
      category_id: categoryId,
      description,
      difficulty: difficultyValue(formData),
      detected_description: nullable(formData, "detected_description"),
      context: nullable(formData, "context"),
      aliases,
      controls,
      video_path: videoPath,
      guide_video_path: nullable(formData, "guide_video_path"),
      poster_path: nullable(formData, "poster_path"),
      original_poster_path: nullable(formData, "original_poster_path"),
      controls_reference_path: controlsReferencePath,
      controls_clean_path: controlsCleanPath,
      source_frame_path: nullable(formData, "source_frame_path"),
      source_start_seconds: nullableNumber(formData, "source_start_seconds"),
      source_end_seconds: nullableNumber(formData, "source_end_seconds"),
      ocr_confidence: nullableNumber(formData, "ocr_confidence"),
      needs_name_review: formData.has("needs_name_review"),
      needs_control_review: formData.has("needs_control_review"),
      needs_description_review: formData.has("needs_description_review"),
      sort_order: numberValue(formData, "sort_order"),
      is_published: value(formData, "publication_status") === "published",
      last_edited_by: user.email,
    })
    .eq("id", id)
    .select("updated_at,last_edited_by")
    .maybeSingle();

  if (error) return { status: "error", message: error.message };
  if (!savedTrick)
    return {
      status: "error",
      message:
        "The trick could not be updated. Refresh the page, sign in again, and confirm your account still has Studio access.",
    };
  revalidatePath("/studio");
  revalidatePath("/studio/tricks");
  revalidatePath(`/studio/tricks/${id}`);
  revalidatePath("/");
  revalidatePath("/tricks");
  revalidatePath(`/tricks/${slug}`);
  if (value(formData, "intent") === "save-and-next") {
    const { data: orderedTricks, error: nextError } = await supabase
      .from("tricks")
      .select("id")
      .order("name");
    if (nextError)
      return {
        status: "error",
        message: `Changes were saved, but the next trick could not be found: ${nextError.message}`,
        savedAt: savedTrick.updated_at,
        savedBy: savedTrick.last_edited_by ?? user.email,
      };
    const currentIndex = (orderedTricks ?? []).findIndex(
      (trick) => trick.id === id,
    );
    const nextId =
      currentIndex >= 0 ? orderedTricks?.[currentIndex + 1]?.id : undefined;
    redirect(nextId ? `/studio/tricks/${nextId}` : "/studio/tricks");
  }
  return {
    status: "success",
    message: "All changes saved",
    savedAt: savedTrick.updated_at,
    savedBy: savedTrick.last_edited_by ?? user.email,
  };
}

export async function updateCategory(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  const id = value(formData, "id");
  const name = value(formData, "name");
  const slug = value(formData, "slug");
  const accentColor = value(formData, "accent_color");
  const gradientStartColor = value(formData, "gradient_start_color");
  const gradientMiddleColor = value(formData, "gradient_middle_color");
  const gradientEndColor = value(formData, "gradient_end_color");
  if (!id || !name)
    return { status: "error", message: "Category name is required." };
  if (!validSlug(slug))
    return {
      status: "error",
      message: "Slug must contain lowercase letters, numbers and hyphens only.",
    };
  if (
    ![
      accentColor,
      gradientStartColor,
      gradientMiddleColor,
      gradientEndColor,
    ].every(validHexColor)
  )
    return {
      status: "error",
      message: "Every category colour must be a six-digit hex colour.",
    };

  const { supabase } = await requireStudioUser();
  const { error } = await supabase
    .from("trick_categories")
    .update({
      name,
      slug,
      description: nullable(formData, "description"),
      page_eyebrow: nullable(formData, "page_eyebrow"),
      page_heading: nullable(formData, "page_heading"),
      popular_heading: nullable(formData, "popular_heading"),
      hero_image_path: nullable(formData, "hero_image_path"),
      accent_color: accentColor.toUpperCase(),
      gradient_start_color: gradientStartColor.toUpperCase(),
      gradient_middle_color: gradientMiddleColor.toUpperCase(),
      gradient_end_color: gradientEndColor.toUpperCase(),
      parent_id: nullable(formData, "parent_id"),
      sort_order: numberValue(formData, "sort_order"),
      is_published: value(formData, "publication_status") === "published",
    })
    .eq("id", id);

  if (error) return { status: "error", message: error.message };
  revalidatePath("/studio");
  revalidatePath("/studio/categories");
  revalidatePath(`/studio/categories/${id}`);
  revalidatePath("/");
  revalidatePath("/tricks");
  revalidatePath(`/tricks/${slug}`);
  return { status: "success", message: "Category saved." };
}

export async function reorderCategories(
  _state: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  let ids: string[];
  try {
    const parsed: unknown = JSON.parse(value(formData, "category_ids"));
    if (
      !Array.isArray(parsed) ||
      !parsed.every((id) => typeof id === "string") ||
      new Set(parsed).size !== parsed.length
    )
      throw new Error();
    ids = parsed;
  } catch {
    return {
      status: "error",
      message: "The category order was invalid. Refresh and try again.",
    };
  }
  const { supabase } = await requireStudioUser();
  const { data: current, error: readError } = await supabase
    .from("trick_categories")
    .select("id");
  if (readError) return { status: "error", message: readError.message };
  if (
    ids.length !== current.length ||
    current.some((category) => !ids.includes(category.id))
  )
    return {
      status: "error",
      message:
        "Categories changed while you were editing. Refresh and try again.",
    };
  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("trick_categories")
        .update({ sort_order: (index + 1) * 10 })
        .eq("id", id),
    ),
  );
  const error = results.find((result) => result.error)?.error;
  if (error) return { status: "error", message: error.message };
  revalidatePath("/studio/categories");
  revalidatePath("/tricks");
  return { status: "success", message: "Frontend category order saved." };
}
