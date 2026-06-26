import { SATELLITES } from "@/data/satellites";
import { FUTURE_SATELLITES } from "@/data/future-satellites";
import type { SatelliteRecord } from "@/types/satellite";

export type SatelliteRouteTarget =
  | { type: "in-orbit"; noradId: number }
  | { type: "future"; id: string };

const inOrbitById = new Map<string, SatelliteRecord>(
  SATELLITES.map((satellite) => [satellite.id, satellite]),
);

const futureIds = new Set<string>(FUTURE_SATELLITES.map((satellite) => satellite.id));

export function isSatelliteRouteId(id: string): boolean {
  return inOrbitById.has(id) || futureIds.has(id);
}

export function resolveSatelliteRoute(id: string): SatelliteRouteTarget | undefined {
  const inOrbit = inOrbitById.get(id);
  if (inOrbit) {
    return { type: "in-orbit", noradId: inOrbit.noradId };
  }

  if (futureIds.has(id)) {
    return { type: "future", id };
  }

  return undefined;
}

export function getSatelliteRouteIds(): string[] {
  return [...SATELLITES.map((satellite) => satellite.id), ...FUTURE_SATELLITES.map((s) => s.id)];
}
