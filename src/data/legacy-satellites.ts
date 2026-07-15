import type { LegacySatelliteRecord } from "@/types/satellite";

/**
 * Thailand satellites whose primary mission has ended.
 *
 * Legacy satellites are list/detail only — not tracked on the globe.
 * Localized descriptions live in `src/data/satellite-i18n.ts`.
 */
export const LEGACY_SATELLITES = [
  {
    id: "knacksat-1",
    noradId: 43761,
    name: "KnackSat-1",
    purpose: "Education",
    launchDate: "2018-12-03",
    launchVehicle: "Falcon 9",
    operator: "KMUTNB",
    endOfMission: "2020",
  },
  {
    id: "napa-1",
    noradId: 46320,
    name: "Napa-1",
    purpose: "Military",
    launchDate: "2020-09-03",
    launchVehicle: "Vega",
    operator: "RTAF",
    endOfMission: "2023-09-03",
  },
  {
    id: "bccsat-1",
    noradId: 48041,
    name: "BCCSat-1",
    purpose: "Education",
    launchDate: "2021-03-22",
    launchVehicle: "Soyuz-2",
    operator: "BCC",
    endOfMission: "2024-09-19",
  },
  {
    id: "napa-2",
    noradId: 48963,
    name: "Napa-2",
    purpose: "Military",
    launchDate: "2021-07-01",
    launchVehicle: "Falcon 9",
    operator: "RTAF",
    endOfMission: "2024-07-01",
  },
  {
    id: "logsat-2",
    noradId: 62689,
    name: "LogSat-2",
    purpose: "Technology Demonstration",
    launchDate: "2025-01-15",
    launchVehicle: "Falcon 9",
    operator: "EOS Orbit",
    endOfMission: "2026",
  },
] as const satisfies readonly LegacySatelliteRecord[];
