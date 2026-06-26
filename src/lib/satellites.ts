import { SATELLITES } from "@/data/satellites";
import type { SatelliteRecord } from "@/types/satellite";

export { SATELLITES };

export type NoradId = (typeof SATELLITES)[number]["noradId"];

const satelliteByNoradId = new Map<number, SatelliteRecord>(
  SATELLITES.map((satellite) => [satellite.noradId, satellite]),
);

const satelliteById = new Map<string, SatelliteRecord>(
  SATELLITES.map((satellite) => [satellite.id, satellite]),
);

const allowedNoradIds = new Set<number>(SATELLITES.map((satellite) => satellite.noradId));

export function isAllowedNoradId(noradId: number): boolean {
  return allowedNoradIds.has(noradId);
}

export function getSatelliteByNoradId(noradId: number): SatelliteRecord | undefined {
  return satelliteByNoradId.get(noradId);
}

export function getSatelliteById(id: string): SatelliteRecord | undefined {
  return satelliteById.get(id);
}
