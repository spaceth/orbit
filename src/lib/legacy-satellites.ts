import { LEGACY_SATELLITES } from "@/data/legacy-satellites";
import type { LegacySatelliteRecord } from "@/types/satellite";

export { LEGACY_SATELLITES };

const legacySatelliteById = new Map<string, LegacySatelliteRecord>(
  LEGACY_SATELLITES.map((satellite) => [satellite.id, satellite]),
);

export function getLegacySatelliteById(id: string): LegacySatelliteRecord | undefined {
  return legacySatelliteById.get(id);
}
