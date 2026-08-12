"use client";

/* eslint-disable @next/next/no-img-element -- Supabase artwork dimensions are user supplied. */

import { useEffect, useRef, useState } from "react";

import styles from "@/app/studio/studio.module.scss";
import { createClient } from "@/lib/supabase/client";
import { getTrickMediaUrl } from "@/lib/supabase/media";

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

function clamp(value: number) {
    return Math.max(0, Math.min(100, value));
}

export function MediaField({ accept, defaultOriginalPath, defaultPath, kind, label, name, originalName, required, trickId }: MediaFieldProps) {
    const [path, setPath] = useState(defaultPath ?? "");
    const [originalPath, setOriginalPath] = useState(defaultOriginalPath ?? "");
    const [status, setStatus] = useState<string>();
    const [uploading, setUploading] = useState(false);
    const [posterFile, setPosterFile] = useState<File>();
    const [cropX, setCropX] = useState(50);
    const [cropY, setCropY] = useState(50);
    const [zoom, setZoom] = useState(1);
    const cropCanvas = useRef<HTMLCanvasElement>(null);
    const cropImage = useRef<HTMLImageElement>(null);
    const dragStart = useRef<{ clientX: number; clientY: number; cropX: number; cropY: number } | undefined>(undefined);
    const url = path ? getTrickMediaUrl(path) : undefined;
    const originalUrl = originalPath ? getTrickMediaUrl(originalPath) : undefined;
    const canRemove = kind === "controls-clean" || kind === "controls-reference";

    function removeMedia(button: HTMLButtonElement) {
        setPath("");
        setStatus("Removed. Save changes to apply this update.");
        button.form?.dispatchEvent(new Event("change", { bubbles: true }));
    }

    useEffect(() => {
        if (!posterFile) return;
        const objectUrl = URL.createObjectURL(posterFile);
        const image = new Image();
        image.onload = () => {
            cropImage.current = image;
            drawCrop(image, cropCanvas.current, cropX, cropY, zoom);
        };
        image.src = objectUrl;
        return () => URL.revokeObjectURL(objectUrl);
        // Crop values are handled by the dedicated redraw effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posterFile]);

    useEffect(() => {
        if (cropImage.current) drawCrop(cropImage.current, cropCanvas.current, cropX, cropY, zoom);
    }, [cropX, cropY, zoom]);

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
            setCropX(50);
            setCropY(50);
            setZoom(1);
            setPosterFile(file);
            setStatus("Original saved. Drag the image to frame the card thumbnail.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Could not upload the original artwork.");
        } finally {
            setUploading(false);
        }
    }

    async function uploadPosterCrop() {
        const image = cropImage.current;
        if (!image) return;
        setUploading(true);
        setStatus("Generating the 1280 × 720 card thumbnail…");
        const output = document.createElement("canvas");
        output.width = 1280;
        output.height = 720;
        drawCrop(image, output, cropX, cropY, zoom);
        const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/webp", .9));
        try {
            if (!blob) throw new Error("The browser could not generate the thumbnail.");
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
                {posterFile && (
                    <div className={styles.cropWorkbench}>
                        <header><div><strong>Frame the card thumbnail</strong><span>Drag to reposition · scroll to zoom · 16:9 output</span></div><b>EDITING</b></header>
                        <div className={styles.cropStage}>
                            <canvas
                                ref={cropCanvas}
                                width="640"
                                height="360"
                                aria-label="Interactive poster thumbnail crop"
                                onPointerDown={(event) => {
                                    event.currentTarget.setPointerCapture(event.pointerId);
                                    dragStart.current = { clientX: event.clientX, clientY: event.clientY, cropX, cropY };
                                }}
                                onPointerMove={(event) => {
                                    const start = dragStart.current;
                                    if (!start) return;
                                    const bounds = event.currentTarget.getBoundingClientRect();
                                    setCropX(clamp(start.cropX - ((event.clientX - start.clientX) / bounds.width) * 100));
                                    setCropY(clamp(start.cropY - ((event.clientY - start.clientY) / bounds.height) * 100));
                                }}
                                onPointerUp={() => { dragStart.current = undefined; }}
                                onPointerCancel={() => { dragStart.current = undefined; }}
                                onWheel={(event) => {
                                    event.preventDefault();
                                    setZoom((current) => Math.max(1, Math.min(3, current - event.deltaY * .002)));
                                }}
                            />
                            <div className={styles.cropGrid} aria-hidden="true"><i /><i /><i /><i /></div>
                        </div>
                        <label className={styles.zoomControl}>Zoom <input type="range" min="1" max="3" step=".01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><output>{zoom.toFixed(2)}×</output></label>
                        <div className={styles.cropActions}><button type="button" onClick={() => setPosterFile(undefined)}>Cancel</button><button type="button" disabled={uploading} onClick={() => void uploadPosterCrop()}>{uploading ? "Uploading…" : "Use this thumbnail"}</button></div>
                    </div>
                )}
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

function drawCrop(image: HTMLImageElement, canvas: HTMLCanvasElement | null, xPercent: number, yPercent: number, zoom: number) {
    if (!canvas) return;
    const targetRatio = canvas.width / canvas.height;
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    let cropWidth: number;
    let cropHeight: number;
    if (sourceRatio > targetRatio) { cropHeight = image.naturalHeight / zoom; cropWidth = cropHeight * targetRatio; }
    else { cropWidth = image.naturalWidth / zoom; cropHeight = cropWidth / targetRatio; }
    const sourceX = (image.naturalWidth - cropWidth) * (xPercent / 100);
    const sourceY = (image.naturalHeight - cropHeight) * (yPercent / 100);
    canvas.getContext("2d")?.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
}
