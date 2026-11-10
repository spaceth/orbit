import { SATELLITES } from "@/data/satellites";
import type { SatelliteRecord } from "@/types/satellite";

export { SATELLITES };

const satelliteByNoradId = new Map<number, SatelliteRecord>(
  SATELLITES.map((satellite) => [satellite.noradId, satellite]),
);

export function getSatelliteByNoradId(noradId: number): SatelliteRecord | undefined {
  return satelliteByNoradId.get(noradId);
}
