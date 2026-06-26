import type { SatelliteRecord } from "@/types/satellite";

/**
 * Thailand satellite registry.
 *
 * To add a satellite: append an entry with a unique `id` (URL slug) and NORAD ID.
 * To remove one: delete its entry — the API allowlist and UI update automatically.
 *
 * Localized descriptions live in `src/data/satellite-i18n.ts`.
 */
export const SATELLITES = [
  {
    id: "theos-2",
    noradId: 58016,
    name: "THEOS-2",
    purpose: "Earth Observation",
    launchDate: "2023-10-09",
    launchVehicle: "Vega",
    operator: "GISTDA",
  },
  {
    id: "knacksat-2",
    noradId: 67683,
    name: "KnackSat-2",
    purpose: "Education",
    launchDate: "2026-02-03",
    launchVehicle: "H3/ISS/JEM/J-SSOD",
  },
  {
    id: "theos",
    noradId: 33396,
    name: "THEOS",
    purpose: "Earth Observation",
    launchDate: "2008-10-01",
    launchVehicle: "Dnepr",
    operator: "GISTDA",
  },
  {
    id: "thaicom-4",
    noradId: 28786,
    name: "Thaicom 4",
    purpose: "Communication",
    launchDate: "2005-08-11",
    launchVehicle: "Ariane 5",
    operator: "Thaicom",
  },
  {
    id: "thaicom-6",
    noradId: 39500,
    name: "Thaicom 6",
    purpose: "Communication",
    launchDate: "2013-12-03",
    launchVehicle: "Falcon 9",
    operator: "Thaicom",
  },
  {
    id: "thaicom-7",
    noradId: 40141,
    name: "Thaicom 7",
    purpose: "Communication",
    launchDate: "2014-09-10",
    launchVehicle: "Falcon 9",
    operator: "Thaicom",
  },
  {
    id: "thaicom-8",
    noradId: 41552,
    name: "Thaicom 8",
    purpose: "Communication",
    launchDate: "2016-05-27",
    launchVehicle: "Falcon 9",
    operator: "Thaicom",
  },
  {
    id: "napa-2",
    noradId: 48963,
    name: "Napa-2",
    purpose: "Military",
    launchDate: "2021-07-01",
    launchVehicle: "Falcon 9",
  },
] as const satisfies readonly SatelliteRecord[];
