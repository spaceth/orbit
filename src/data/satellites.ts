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
    model: { src: "/models/satellites/theos-2.glb" },
  },
  {
    id: "knacksat-2",
    noradId: 67683,
    name: "KnackSat-2",
    purpose: "Education",
    launchDate: "2026-02-03",
    launchVehicle: "H3/ISS/JEM/J-SSOD",
    model: {
      src: "/models/satellites/knacksat-2.glb",
      available: true,
      orbitWorldScale: 0.014,
      focusDistance: 0.05,
      orbitAlignment: {
        forwardAxis: "+Y",
        nadirAxis: "+Z",
        smoothing: 7,
      },
    },
  },
  {
    id: "theos",
    noradId: 33396,
    name: "THEOS",
    purpose: "Earth Observation",
    launchDate: "2008-10-01",
    launchVehicle: "Dnepr",
    operator: "GISTDA",
    model: { src: "/models/satellites/theos.glb" },
  },
  {
    id: "thaicom-4",
    noradId: 28786,
    name: "Thaicom 4",
    purpose: "Communication",
    launchDate: "2005-08-11",
    launchVehicle: "Ariane 5",
    operator: "Thaicom",
    model: { src: "/models/satellites/thaicom-4.glb" },
  },
  {
    id: "thaicom-6",
    noradId: 39500,
    name: "Thaicom 6",
    purpose: "Communication",
    launchDate: "2013-12-03",
    launchVehicle: "Falcon 9",
    operator: "Thaicom",
    model: { src: "/models/satellites/thaicom-6.glb" },
  },
  {
    id: "thaicom-7",
    noradId: 40141,
    name: "Thaicom 7",
    purpose: "Communication",
    launchDate: "2014-09-10",
    launchVehicle: "Falcon 9",
    operator: "Thaicom",
    model: { src: "/models/satellites/thaicom-7.glb" },
  },
  {
    id: "thaicom-8",
    noradId: 41552,
    name: "Thaicom 8",
    purpose: "Communication",
    launchDate: "2016-05-27",
    launchVehicle: "Falcon 9",
    operator: "Thaicom",
    model: { src: "/models/satellites/thaicom-8.glb" },
  },
] as const satisfies readonly SatelliteRecord[];
