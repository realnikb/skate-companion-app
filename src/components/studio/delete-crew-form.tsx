"use client";

import { deleteCrew } from "@/app/studio/crews/actions";
import styles from "@/app/studio/studio.module.scss";

export function DeleteCrewForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCrew}
      className={styles.dangerZone}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <div>
        <strong>Delete crew</strong>
        <p>
          Permanently removes the crew, roster, links, videos, and uploaded
          branding.
        </p>
      </div>
      <button>Delete crew</button>
    </form>
  );
}
