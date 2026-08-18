"use client";

import { useActionState } from "react";
import {
  createCrew,
  updateCrew,
  type CrewActionState,
} from "@/app/studio/crews/actions";
import styles from "@/app/studio/studio.module.scss";

export function CrewForm({
  children,
  editing = false,
}: {
  children: React.ReactNode;
  editing?: boolean;
}) {
  const action = editing ? updateCrew : createCrew;
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  } satisfies CrewActionState);
  return (
    <form action={formAction} className={styles.formGrid}>
      {children}
      <div className={styles.formActions}>
        {state.message && (
          <p className={styles.error} role="status">
            {state.message}
          </p>
        )}
        <button disabled={pending}>
          {pending ? "Saving…" : editing ? "Save crew" : "Create crew"}
        </button>
      </div>
    </form>
  );
}
