import { FLIGHT_15_NORAD_ID, FLIGHT_15_ROUTE_ID } from "@/data/flight-15";
import { FUTURE_SATELLITES } from "@/data/future-satellites";
import { LEGACY_SATELLITES } from "@/data/legacy-satellites";
import { SATELLITES } from "@/data/satellites";
import type { SatelliteRecord } from "@/types/satellite";

export type SatelliteRouteTarget =
  | { type: "in-orbit"; noradId: number }
  | { type: "legacy"; id: string }
  | { type: "future"; id: string }
  | { type: "my"; noradId: number };

const inOrbitById = new Map<string, SatelliteRecord>(
  SATELLITES.map((satellite) => [satellite.id, satellite]),
);

const legacyIds = new Set<string>(LEGACY_SATELLITES.map((satellite) => satellite.id));
const futureIds = new Set<string>(FUTURE_SATELLITES.map((satellite) => satellite.id));

export function isSatelliteRouteId(id: string): boolean {
  return (
    id === FLIGHT_15_ROUTE_ID ||
    inOrbitById.has(id) ||
    legacyIds.has(id) ||
    futureIds.has(id)
  );
}

export function resolveSatelliteRoute(id: string): SatelliteRouteTarget | undefined {
  if (id === FLIGHT_15_ROUTE_ID) {
    return { type: "my", noradId: FLIGHT_15_NORAD_ID };
  }

  const inOrbit = inOrbitById.get(id);
  if (inOrbit) {
    return { type: "in-orbit", noradId: inOrbit.noradId };
  }

  if (legacyIds.has(id)) {
    return { type: "legacy", id };
  }

  if (futureIds.has(id)) {
    return { type: "future", id };
  }

  return undefined;
}

export function getSatelliteRouteIds(): string[] {
  return [
    FLIGHT_15_ROUTE_ID,
    ...SATELLITES.map((satellite) => satellite.id),
    ...LEGACY_SATELLITES.map((satellite) => satellite.id),
    ...FUTURE_SATELLITES.map((satellite) => satellite.id),
  ];
}
