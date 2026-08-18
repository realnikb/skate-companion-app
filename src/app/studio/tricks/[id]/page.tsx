import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaField } from "@/components/studio/media-field";
import { ControlEditor } from "@/components/studio/control-editor";
import { StudioForm } from "@/components/studio/studio-form";
import { PublicationStatus } from "@/components/studio/publication-status";
import { requireStudioUser } from "@/lib/studio/auth";
import { normalizeTrickControls } from "@/lib/tricks/controls";
import { getTrickMediaUrl } from "@/lib/supabase/media";
import { mapStickPath } from "@/lib/tricks/stick-paths";
import styles from "../../studio.module.scss";

export default async function EditTrickPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireStudioUser();
  const [
    { data: trick, error },
    { data: categories },
    { data: stickPaths, error: stickPathError },
  ] = await Promise.all([
    supabase.from("tricks").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("trick_categories")
      .select("id,name,parent_id,is_published")
      .order("sort_order")
      .order("name"),
    supabase.from("stick_paths").select("id,slug,name,points").order("name"),
  ]);
  if (error || !trick) notFound();
  if (stickPathError)
    throw new Error(
      `Unable to load reusable stick paths: ${stickPathError.message}`,
    );

  return (
    <main className={styles.content}>
      <header className={styles.editorHeader}>
        <div>
          <Link href="/studio/tricks">← Back to tricks</Link>
          <h1>{trick.name}</h1>
        </div>
        <Link href={`/tricks/${trick.slug}`} target="_blank">
          View public page ↗
        </Link>
      </header>
      <StudioForm
        kind="trick"
        lastSavedAt={trick.updated_at}
        lastSavedBy={trick.last_edited_by}
        isPublished={trick.is_published}
      >
        <input type="hidden" name="id" value={trick.id} />
        <input type="hidden" name="sort_order" value={trick.sort_order} />
        <input
          type="hidden"
          name="detected_description"
          value={trick.detected_description ?? ""}
        />
        <input
          type="hidden"
          name="source_frame_path"
          value={trick.source_frame_path ?? ""}
        />
        <input
          type="hidden"
          name="source_start_seconds"
          value={trick.source_start_seconds ?? ""}
        />
        <input
          type="hidden"
          name="source_end_seconds"
          value={trick.source_end_seconds ?? ""}
        />
        <input
          type="hidden"
          name="ocr_confidence"
          value={trick.ocr_confidence ?? ""}
        />

        <section className={`${styles.panel} ${styles.detailsPanel}`}>
          <h2>Trick details</h2>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="name">Name *</label>
              <input id="name" name="name" defaultValue={trick.name} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Slug *</label>
              <input
                id="slug"
                name="slug"
                defaultValue={trick.slug}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="category_id">Category *</label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={trick.category_id}
            >
              {categories?.map((category) => {
                const parent = categories.find(
                  (candidate) => candidate.id === category.parent_id,
                );
                return (
                  <option key={category.id} value={category.id}>
                    {parent ? `${parent.name} / ` : ""}
                    {category.name}
                    {category.is_published ? "" : " (draft)"}
                  </option>
                );
              })}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={trick.difficulty ?? ""}
            >
              <option value="">Not set</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              defaultValue={trick.description}
              required
            />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="context">Context</label>
              <input
                id="context"
                name="context"
                defaultValue={trick.context ?? ""}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="aliases">Aliases</label>
              <input
                id="aliases"
                name="aliases"
                defaultValue={trick.aliases.join(", ")}
                placeholder="Comma separated"
              />
            </div>
          </div>
        </section>

        <aside className={`${styles.panel} ${styles.publishingPanel}`}>
          <h2>Publishing</h2>
          <PublicationStatus
            isPublished={trick.is_published}
            contentType="trick"
          />
          <div className={styles.checks}>
            <label>
              <input
                type="checkbox"
                name="needs_name_review"
                defaultChecked={trick.needs_name_review}
              />{" "}
              Name needs review
            </label>
            <label>
              <input
                type="checkbox"
                name="needs_control_review"
                defaultChecked={trick.needs_control_review}
              />{" "}
              Controls need review
            </label>
            <label>
              <input
                type="checkbox"
                name="needs_description_review"
                defaultChecked={trick.needs_description_review}
              />{" "}
              Description needs review
            </label>
          </div>
        </aside>

        <ControlEditor
          initialControls={normalizeTrickControls(trick.controls)}
          referenceUrl={getTrickMediaUrl(trick.controls_reference_path)}
          stickPaths={(stickPaths ?? []).map(mapStickPath)}
        />

        <section className={`${styles.panel} ${styles.mediaPanel}`}>
          <div className={styles.sectionHeading}>
            <div>
              <span>Media</span>
              <h2>Video & hero artwork</h2>
            </div>
            <p>
              Review the main visitor-facing assets, then replace anything that
              needs updating.
            </p>
          </div>
          <div className={styles.primaryMediaGrid}>
            <MediaField
              trickId={trick.id}
              kind="video"
              name="video_path"
              label="Demo clip"
              accept="video/*"
              defaultPath={trick.video_path}
              required
            />
            <MediaField
              trickId={trick.id}
              kind="guide-video"
              name="guide_video_path"
              label="Video guide"
              accept="video/*"
              defaultPath={trick.guide_video_path}
            />
            <MediaField
              trickId={trick.id}
              kind="poster"
              name="poster_path"
              label="Hero artwork"
              accept="image/*"
              defaultPath={trick.poster_path}
              originalName="original_poster_path"
              defaultOriginalPath={trick.original_poster_path}
            />
          </div>
          <details className={styles.secondaryMedia}>
            <summary>
              Controller artwork <span>2 assets</span>
            </summary>
            <div>
              <MediaField
                trickId={trick.id}
                kind="controls-clean"
                name="controls_clean_path"
                label="Clean controls"
                accept="image/*"
                defaultPath={trick.controls_clean_path}
              />
              <MediaField
                trickId={trick.id}
                kind="controls-reference"
                name="controls_reference_path"
                label="Control reference"
                accept="image/*"
                defaultPath={trick.controls_reference_path}
              />
            </div>
          </details>
        </section>
      </StudioForm>
    </main>
  );
}
