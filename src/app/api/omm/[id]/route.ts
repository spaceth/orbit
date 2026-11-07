import { NextResponse } from "next/server";

import { getFallbackOmm } from "@/lib/omm-fallback";
import { fetchOmmFromCelestrak } from "@/lib/omm";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[1-9]\d{0,8}$/.test(id)) {
    return NextResponse.json({ error: "Satellite not found" }, { status: 404 });
  }

  const noradId = Number(id);

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
