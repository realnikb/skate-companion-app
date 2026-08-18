"use client";

import { useEffect } from "react";
import { SkateErrorScreen } from "@/components/errors/skate-error-screen";

export default function Error({
  error,
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <SkateErrorScreen kind="error" onRetry={unstable_retry} />;
}
