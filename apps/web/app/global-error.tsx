"use client";

import { useEffect } from "react";

import { GlobalErrorSurface } from "../features/errors/ErrorSurfaces";
import { reportRuntimeError } from "../features/errors/error-handling.mjs";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    reportRuntimeError(error, { surface: "global-error" });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <GlobalErrorSurface reset={reset} />
      </body>
    </html>
  );
}
