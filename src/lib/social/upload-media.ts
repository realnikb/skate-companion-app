import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type DirectUpload = {
  path: string;
  mediaType: "image" | "video";
  mimeType: string;
  size: number;
};

export async function uploadSocialMedia(
  file: File,
  onProgress: (percentage: number) => void,
): Promise<DirectUpload> {
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const limit = mediaType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (!allowed.has(file.type) || file.size > limit)
    throw new Error(
      "Use an image up to 10 MB or an MP4, WebM or MOV video up to 100 MB.",
    );
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Your session expired. Sign in and try again.");
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || (mediaType === "video" ? "mp4" : "webp");
  const path = `${session.user.id}/social/${crypto.randomUUID()}.${extension}`;
  const { url, publishableKey } = getSupabaseConfig();
  const objectUrl = `${url.replace(/\/$/, "")}/storage/v1/object/social-media/${path.split("/").map(encodeURIComponent).join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", objectUrl);
    request.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    request.setRequestHeader("apikey", publishableKey);
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("x-upsert", "false");
    request.setRequestHeader("cache-control", "max-age=31536000");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () =>
      reject(new Error("The upload was interrupted. Please try again."));
    request.onabort = () => reject(new Error("The upload was cancelled."));
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(
            new Error(
              JSON.parse(request.responseText || "{}").message ||
                `Upload failed (${request.status}).`,
            ),
          );
    request.send(file);
  });
  onProgress(100);
  return { path, mediaType, mimeType: file.type, size: file.size };
}

export async function removeSocialMedia(path: string) {
  await createClient().storage.from("social-media").remove([path]);
}
