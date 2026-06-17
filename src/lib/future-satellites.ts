import { FUTURE_SATELLITES } from "@/data/future-satellites";
import type { FutureSatelliteRecord } from "@/types/satellite";

export { FUTURE_SATELLITES };

const futureSatelliteById = new Map<string, FutureSatelliteRecord>(
  FUTURE_SATELLITES.map((satellite) => [satellite.id, satellite]),
);

export function getFutureSatelliteById(id: string): FutureSatelliteRecord | undefined {
  return futureSatelliteById.get(id);
}
