"use client";

/* eslint-disable @next/next/no-img-element -- user-supplied Supabase media has unknown dimensions. */
import { useRef, useState } from "react";
import { ImageCropper } from "./image-cropper";
import styles from "@/app/studio/studio.module.scss";

export function ImageCropField({
  name,
  label,
  defaultUrl,
  required,
  aspectRatio,
  outputWidth,
  outputHeight,
}: {
  name: string;
  label: string;
  defaultUrl?: string;
  required?: boolean;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
}) {
  const input = useRef<HTMLInputElement>(null),
    [source, setSource] = useState<File>(),
    [preview, setPreview] = useState(defaultUrl);
  return (
    <div className={styles.mediaField}>
      <div className={styles.mediaHeading}>
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        <label className={styles.uploadButton}>
          Choose image
          <input
            ref={input}
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required={required && !defaultUrl}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) setSource(file);
            }}
          />
        </label>
      </div>
      <div className={styles.mediaPreview}>
        {preview ? (
          <img src={preview} alt={`Current ${label.toLowerCase()}`} />
        ) : (
          <span>No image selected</span>
        )}
      </div>
      {source && (
        <ImageCropper
          file={source}
          aspectRatio={aspectRatio}
          outputWidth={outputWidth}
          outputHeight={outputHeight}
          label={`Crop ${label.toLowerCase()}`}
          onCancel={() => {
            setSource(undefined);
            if (input.current) input.current.value = "";
          }}
          onCrop={(blob) => {
            const file = new File([blob], `${name}.webp`, {
                type: "image/webp",
              }),
              transfer = new DataTransfer();
            transfer.items.add(file);
            if (input.current) input.current.files = transfer.files;
            setPreview(URL.createObjectURL(blob));
            setSource(undefined);
            input.current?.form?.dispatchEvent(
              new Event("change", { bubbles: true }),
            );
          }}
        />
      )}
    </div>
  );
}
