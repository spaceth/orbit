import { NextResponse } from "next/server";

import { isAllowedNoradId } from "@/lib/satellites";
import { getFallbackTle } from "@/lib/tle-fallback";
import { fetchTleFromApi } from "@/lib/tle";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const noradId = Number.parseInt(id, 10);

  if (!Number.isFinite(noradId) || !isAllowedNoradId(noradId)) {
    return NextResponse.json({ error: "Satellite not allowed" }, { status: 403 });
  }

  try {
    const tle = await fetchTleFromApi(noradId);
    return NextResponse.json(tle);
  } catch {
    const fallback = getFallbackTle(noradId);
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: "Failed to fetch TLE" }, { status: 503 });
  }
}
