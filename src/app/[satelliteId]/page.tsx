import { notFound } from "next/navigation";

import { OrbitViewer } from "@/components/orbit-viewer";
import { isSatelliteRouteId } from "@/lib/satellite-routes";
import { FUTURE_SATELLITES } from "@/lib/future-satellites";
import { SATELLITES } from "@/lib/satellites";

export function generateStaticParams() {
  return [
    ...SATELLITES.map((satellite) => ({ satelliteId: satellite.id })),
    ...FUTURE_SATELLITES.map((satellite) => ({ satelliteId: satellite.id })),
  ];
}

export default async function SatellitePage({
  params,
}: {
  params: Promise<{ satelliteId: string }>;
}) {
  const { satelliteId } = await params;

  if (!isSatelliteRouteId(satelliteId)) {
    notFound();
  }

  return <OrbitViewer />;
}
