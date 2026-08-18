"use client";

import { useActionState } from "react";
import { ImagePlus, Palette, Save } from "lucide-react";
import { updateCrewBrand, type CrewBrandState } from "./actions";
import styles from "./crew.module.scss";

const initial: CrewBrandState = { status: "idle" };
export function CrewBrandEditor({
  crewId,
  slug,
  color,
}: {
  crewId: string;
  slug: string;
  color: string;
}) {
  const [state, action, pending] = useActionState(updateCrewBrand, initial);
  return (
    <form action={action} className={styles.brandEditor}>
      <input type="hidden" name="crew_id" value={crewId} />
      <input type="hidden" name="slug" value={slug} />
      <header>
        <div>
          <span>Owner controls</span>
          <strong>Page branding</strong>
        </div>
        <Palette />
      </header>
      <label>
        <span>Primary colour</span>
        <input type="color" name="primary_color" defaultValue={color} />
      </label>
      <label className={styles.bannerUpload}>
        <ImagePlus />
        <span>
          <strong>Change banner</strong>
          <small>Wide JPG, PNG or WebP · up to 10 MB</small>
        </span>
        <input
          type="file"
          name="banner"
          accept="image/jpeg,image/png,image/webp"
        />
      </label>
      {state.message && (
        <p data-error={state.status === "error"}>{state.message}</p>
      )}
      <button disabled={pending}>
        <Save />
        {pending ? "Saving..." : "Save branding"}
      </button>
    </form>
  );
}
