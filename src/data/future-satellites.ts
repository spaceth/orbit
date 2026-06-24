import type { FutureSatelliteRecord } from "@/types/satellite";

/**
 * Upcoming Thailand satellites not yet in orbit.
 *
 * To add one: append an entry with a unique `id`.
 * To remove one: delete its entry.
 *
 * Localized descriptions live in `src/data/satellite-i18n.ts`.
 */
export const FUTURE_SATELLITES = [
  {
    id: "tsc-1",
    name: "TSC-1",
    purpose: "Science",
    launchInfo: "2027",
    operator: "NARIT",
  },
  {
    id: "theos-3",
    name: "THEOS-3",
    purpose: "Earth Observation",
    launchInfo: "2027",
    operator: "GISTDA",
  },
] as const satisfies readonly FutureSatelliteRecord[];
