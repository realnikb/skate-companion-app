"use client";

import { useActionState, useState } from "react";

import { createCategory, createTrick, updateCategory, updateTrick, type StudioActionState } from "@/app/studio/actions";
import styles from "@/app/studio/studio.module.scss";

const initialState: StudioActionState = { status: "idle" };

type StudioFormProps = {
    kind: "trick" | "new-trick" | "category" | "new-category";
    children: React.ReactNode;
    lastSavedAt?: string;
    lastSavedBy?: string | null;
    isPublished?: boolean;
};

function savedLabel(value?: string) {
    if (!value) return "Not saved yet";
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function StudioForm({ kind, children, lastSavedAt, lastSavedBy, isPublished = false }: StudioFormProps) {
    const action = kind === "trick" ? updateTrick : kind === "new-trick" ? createTrick : kind === "new-category" ? createCategory : updateCategory;
    const [dirty, setDirty] = useState(false);
    const [publicationStatus, setPublicationStatus] = useState<"draft" | "published">(isPublished ? "published" : "draft");
    const [savedPublicationStatus, setSavedPublicationStatus] = useState<"draft" | "published">(isPublished ? "published" : "draft");
    const [state, formAction, pending] = useActionState(async (previousState: StudioActionState, formData: FormData) => {
        const nextState = await action(previousState, formData);
        setDirty(nextState.status === "error");
        if (nextState.status === "success") setSavedPublicationStatus(publicationStatus);
        return nextState;
    }, initialState);

    const savedAt = state.savedAt ?? lastSavedAt;
    const savedBy = state.savedBy ?? lastSavedBy;
    const isExistingEntry = kind === "trick" || kind === "category";
    const saveLabel = publicationStatus === "published"
        ? (savedPublicationStatus === "published" ? "Update" : "Publish")
        : (savedPublicationStatus === "published" ? "Switch to draft" : "Save draft");

    return (
        <form action={formAction} className={styles.formGrid} onChange={(event) => {
            setDirty(true);
            const target = event.target;
            if (target instanceof HTMLInputElement && target.name === "publication_status" && (target.value === "draft" || target.value === "published")) setPublicationStatus(target.value);
        }}>
            {isExistingEntry && (
                <div className={styles.saveBar}>
                    <div className={styles.saveStatus}>
                        <span className={dirty ? styles.unsavedDot : styles.savedDot} aria-hidden="true" />
                        <div>
                            <strong>{dirty ? "Unsaved changes" : state.status === "success" ? "All changes saved" : "Up to date"}</strong>
                            <small>{savedBy ? `Last saved by ${savedBy} · ${savedLabel(savedAt)}` : `Last saved ${savedLabel(savedAt)}`}</small>
                        </div>
                    </div>
                    {state.status === "error" && <p className={styles.error} role="status">{state.message}</p>}
                    <div className={`${styles.currentPublicationStatus} ${publicationStatus === "published" ? styles.currentPublished : styles.currentDraft}`}><span aria-hidden="true" />{publicationStatus === "published" ? "Published" : "Draft"}</div>
                    <div className={styles.saveButtons}>
                        {kind === "trick" && <button className={styles.saveNextButton} type="submit" name="intent" value="save-and-next" disabled={pending}>{pending ? "Saving…" : "Update and go to next"}</button>}
                        <button type="submit" name="intent" value="save" disabled={pending || !dirty}>{pending ? "Saving…" : saveLabel}</button>
                    </div>
                </div>
            )}
            {children}
            {!isExistingEntry && (
                <div className={styles.formActions}>
                    {state.message && <p className={state.status === "error" ? styles.error : undefined} role="status">{state.message}</p>}
                    <button type="submit" disabled={pending}>{pending ? "Saving…" : kind === "new-trick" || kind === "new-category" ? "Create draft" : "Save changes"}</button>
                </div>
            )}
        </form>
    );
}
