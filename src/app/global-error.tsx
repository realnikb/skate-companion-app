"use client";

import { useEffect } from "react";
import { SkateErrorScreen } from "@/components/errors/skate-error-screen";

export default function GlobalError({
  error,
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <SkateErrorScreen kind="error" onRetry={unstable_retry} />
      </body>
    </html>
  );
}
