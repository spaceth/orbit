import { notFound } from "next/navigation";

import { OrbitViewer } from "@/components/orbit-viewer";
import { getSatelliteRouteIds, isSatelliteRouteId } from "@/lib/satellite-routes";

export function generateStaticParams() {
  return getSatelliteRouteIds().map((satelliteId) => ({ satelliteId }));
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
