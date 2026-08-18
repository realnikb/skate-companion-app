"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/studio/studio.module.scss";

export function ImageCropper({
  file,
  aspectRatio,
  outputWidth,
  outputHeight,
  label,
  onCancel,
  onCrop,
  busy = false,
}: {
  file: File;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  label: string;
  onCancel: () => void;
  onCrop: (blob: Blob) => void | Promise<void>;
  busy?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    image = useRef<HTMLImageElement | undefined>(undefined);
  const dragStart = useRef<
    | { clientX: number; clientY: number; cropX: number; cropY: number }
    | undefined
  >(undefined);
  const [cropX, setCropX] = useState(50),
    [cropY, setCropY] = useState(50),
    [zoom, setZoom] = useState(1);
  useEffect(() => {
    const url = URL.createObjectURL(file),
      next = new Image();
    next.onload = () => {
      image.current = next;
      drawCrop(next, canvas.current, 50, 50, 1);
    };
    next.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (image.current)
      drawCrop(image.current, canvas.current, cropX, cropY, zoom);
  }, [cropX, cropY, zoom]);
  return (
    <div className={styles.cropWorkbench}>
      <header>
        <div>
          <strong>{label}</strong>
          <span>
            Drag to reposition · scroll to zoom · {outputWidth} × {outputHeight}{" "}
            output
          </span>
        </div>
        <b>EDITING</b>
      </header>
      <div className={styles.cropStage}>
        <canvas
          ref={canvas}
          width={Math.round(640)}
          height={Math.round(640 / aspectRatio)}
          aria-label={`${label} crop`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragStart.current = {
              clientX: event.clientX,
              clientY: event.clientY,
              cropX,
              cropY,
            };
          }}
          onPointerMove={(event) => {
            const start = dragStart.current;
            if (!start) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            setCropX(
              clamp(
                start.cropX -
                  ((event.clientX - start.clientX) / bounds.width) * 100,
              ),
            );
            setCropY(
              clamp(
                start.cropY -
                  ((event.clientY - start.clientY) / bounds.height) * 100,
              ),
            );
          }}
          onPointerUp={() => {
            dragStart.current = undefined;
          }}
          onPointerCancel={() => {
            dragStart.current = undefined;
          }}
          onWheel={(event) => {
            event.preventDefault();
            setZoom((current) =>
              Math.max(1, Math.min(3, current - event.deltaY * 0.002)),
            );
          }}
        />
        <div className={styles.cropGrid} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <label className={styles.zoomControl}>
        Zoom{" "}
        <input
          type="range"
          min="1"
          max="3"
          step=".01"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
        <output>{zoom.toFixed(2)}×</output>
      </label>
      <div className={styles.cropActions}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!image.current) return;
            const output = document.createElement("canvas");
            output.width = outputWidth;
            output.height = outputHeight;
            drawCrop(image.current, output, cropX, cropY, zoom);
            const blob = await new Promise<Blob | null>((resolve) =>
              output.toBlob(resolve, "image/webp", 0.9),
            );
            if (blob) await onCrop(blob);
          }}
        >
          {busy ? "Saving…" : "Use this crop"}
        </button>
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
function drawCrop(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement | null,
  xPercent: number,
  yPercent: number,
  zoom: number,
) {
  if (!canvas) return;
  const targetRatio = canvas.width / canvas.height,
    sourceRatio = image.naturalWidth / image.naturalHeight;
  let cropWidth: number, cropHeight: number;
  if (sourceRatio > targetRatio) {
    cropHeight = image.naturalHeight / zoom;
    cropWidth = cropHeight * targetRatio;
  } else {
    cropWidth = image.naturalWidth / zoom;
    cropHeight = cropWidth / targetRatio;
  }
  const sourceX = (image.naturalWidth - cropWidth) * (xPercent / 100),
    sourceY = (image.naturalHeight - cropHeight) * (yPercent / 100);
  canvas
    .getContext("2d")
    ?.drawImage(
      image,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
}
