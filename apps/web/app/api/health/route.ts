import { NextResponse } from "next/server";

import { createHealthStatus } from "../../../features/health/health.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json(createHealthStatus(), {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
