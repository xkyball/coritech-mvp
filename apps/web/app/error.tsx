"use client";

import { useEffect } from "react";

import { GlobalErrorSurface } from "../features/errors/ErrorSurfaces";
import { reportRuntimeError } from "../features/errors/error-handling.mjs";

export default function AppError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    reportRuntimeError(error, { surface: "app-error" });
  }, [error]);

  return <GlobalErrorSurface reset={reset} />;
}
