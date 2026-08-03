import { NextResponse } from "next/server";

import { isAllowedNoradId } from "@/lib/satellites";
import { getFallbackOmm } from "@/lib/omm-fallback";
import { fetchOmmFromCelestrak } from "@/lib/omm";

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
    const omm = await fetchOmmFromCelestrak(noradId);
    return NextResponse.json(omm);
  } catch {
    const fallback = getFallbackOmm(noradId);
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: "Failed to fetch OMM" }, { status: 503 });
  }
}
