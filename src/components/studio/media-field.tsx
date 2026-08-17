"use client";

/* eslint-disable @next/next/no-img-element -- Supabase artwork dimensions are user supplied. */

import { useState } from "react";

import styles from "@/app/studio/studio.module.scss";
import { createClient } from "@/lib/supabase/client";
import { getTrickMediaUrl } from "@/lib/supabase/media";
import { ImageCropper } from "./image-cropper";

type MediaFieldProps = {
    accept: "image/*" | "video/*";
    defaultOriginalPath?: string | null;
    defaultPath: string | null;
    kind: "video" | "guide-video" | "poster" | "category-hero" | "controls-clean" | "controls-reference";
    label: string;
    name: string;
    originalName?: string;
    required?: boolean;
    trickId: string;
};

function safeExtension(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
    return extension || (file.type.startsWith("video/") ? "mp4" : "webp");
}

export function MediaField({ accept, defaultOriginalPath, defaultPath, kind, label, name, originalName, required, trickId }: MediaFieldProps) {
    const [path, setPath] = useState(defaultPath ?? "");
    const [originalPath, setOriginalPath] = useState(defaultOriginalPath ?? "");
    const [status, setStatus] = useState<string>();
    const [uploading, setUploading] = useState(false);
    const [posterFile, setPosterFile] = useState<File>();
    const url = path ? getTrickMediaUrl(path) : undefined;
    const originalUrl = originalPath ? getTrickMediaUrl(originalPath) : undefined;
    const canRemove = kind === "controls-clean" || kind === "controls-reference";

    function removeMedia(button: HTMLButtonElement) {
        setPath("");
        setStatus("Removed. Save changes to apply this update.");
        button.form?.dispatchEvent(new Event("change", { bubbles: true }));
    }

    async function upload(file: File | Blob, storageKind: string, extension: string) {
        const folder = kind === "category-hero" ? "categories" : "tricks";
        const objectPath = `${folder}/${trickId}/${storageKind}-${Date.now()}.${extension}`;
        const { error } = await createClient().storage.from("trick-media").upload(objectPath, file, {
            cacheControl: "3600",
            contentType: file.type || undefined,
            upsert: false,
        });
        if (error) throw error;
        return objectPath;
    }

    async function choosePoster(file: File) {
        setUploading(true);
        setStatus("Preserving the original artwork…");
        try {
            const uploadedOriginal = await upload(file, "poster-original", safeExtension(file));
            setOriginalPath(uploadedOriginal);
            setPosterFile(file);
            setStatus("Original saved. Drag the image to frame the card thumbnail.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Could not upload the original artwork.");
        } finally {
            setUploading(false);
        }
    }

    async function uploadPosterCrop(blob: Blob) {
        setUploading(true);
        setStatus("Generating the 1280 × 720 card thumbnail…");
        try {
            setPath(await upload(blob, "poster-thumbnail", "webp"));
            setPosterFile(undefined);
            setStatus("Both versions are ready. Save changes to apply them.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Could not upload the thumbnail.");
        } finally {
            setUploading(false);
        }
    }

    async function chooseRegularMedia(file: File) {
        setUploading(true);
        setStatus(`Uploading ${file.name}…`);
        try {
            setPath(await upload(file, kind, safeExtension(file)));
            setStatus("Uploaded. Save changes to use this file.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Upload failed.");
        } finally {
            setUploading(false);
        }
    }

    const chooser = (
        <label className={styles.uploadButton}>
            {uploading ? "Uploading…" : kind === "poster" ? "Replace artwork" : `Choose ${accept === "video/*" ? "video" : "image"}`}
            <input type="file" accept={accept} disabled={uploading} onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void (kind === "poster" ? choosePoster(file) : chooseRegularMedia(file));
                event.currentTarget.value = "";
            }} />
        </label>
    );

    if (kind === "poster") {
        return (
            <div className={`${styles.mediaField} ${styles.heroArtwork}`}>
                <div className={styles.heroArtworkHeader}>
                    <div><span>Hero artwork</span><strong>Background + card thumbnail</strong><p>Keep the full original for the page atmosphere, then frame a separate 16:9 card image.</p></div>
                    {chooser}
                </div>
                <div className={styles.posterVersions}>
                    <div><span>1 · Original background</span><div className={styles.originalPreview}>{originalUrl ? <img src={originalUrl} alt="Original poster preview" /> : <em>No original uploaded</em>}</div></div>
                    <div><span>2 · Card thumbnail</span><div className={styles.thumbnailPreview}>{url ? <img src={url} alt="Cropped thumbnail preview" /> : <em>No thumbnail created</em>}</div></div>
                </div>
                {posterFile && <ImageCropper file={posterFile} aspectRatio={16 / 9} outputWidth={1280} outputHeight={720} label="Frame the card thumbnail" busy={uploading} onCancel={() => setPosterFile(undefined)} onCrop={uploadPosterCrop} />}
                <input type="hidden" name={name} value={path} />
                {originalName && <input type="hidden" name={originalName} value={originalPath} />}
                {status && <p className={styles.uploadStatus} role="status">{status}</p>}
            </div>
        );
    }

    return (
        <div className={styles.mediaField}>
            <div className={styles.mediaHeading}>
                <span>{label}{required ? " *" : ""}</span>
                <div className={styles.mediaActions}>
                    {canRemove && path && <button type="button" className={styles.removeMediaButton} onClick={(event) => removeMedia(event.currentTarget)}>Remove image</button>}
                    {chooser}
                </div>
            </div>
            <div className={styles.mediaPreview}>{url ? (accept === "video/*" ? <video key={url} src={url} controls playsInline preload="metadata" /> : <img key={url} src={url} alt={`${label} preview`} />) : <span>No media selected</span>}</div>
            <input type="hidden" name={name} value={path} />
            {status && <p className={styles.uploadStatus} role="status">{status}</p>}
        </div>
    );
}
