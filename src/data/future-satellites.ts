import type { FutureSatelliteRecord } from "@/types/satellite";

/**
 * Upcoming Thailand satellites not yet in orbit.
 *
 * To add one: append an entry with a unique `id`.
 * To remove one: delete its entry.
 */
export const FUTURE_SATELLITES = [
  {
    id: "tsc-1",
    name: "TSC-1",
    purpose: "Science",
    description:
      "TSC-1 is a technology demonstration satellite developed by National Astronomical Research Institute of Thailand. It will test new technologies for satellite communication, navigation, and Earth observation.",
    launchInfo: "2027",
    operator: "NARIT",
  },
  {
    id: "theos-3",
    name: "THEOS-3",
    purpose: "Earth Observation",
    description:
      "Planned third-generation Earth observation satellite for Thailand, continuing GISTDA's remote sensing capabilities for mapping, agriculture, and disaster monitoring.",
    launchInfo: "2027",
    operator: "GISTDA",
  }
] as const satisfies readonly FutureSatelliteRecord[];
