import type { SatelliteRecord } from "@/types/satellite";

/**
 * Thailand satellite registry.
 *
 * To add a satellite: append an entry here with a unique NORAD ID.
 * To remove one: delete its entry — the API allowlist and UI update automatically.
 *
 * Optional fields (description, launchDate, operator, manufacturer) are shown in the
 * detail panel when present; add more metadata to `SatelliteRecord` as needed.
 */
export const SATELLITES = [
  {
    noradId: 58016,
    name: "THEOS-2",
    purpose: "Earth Observation",
    description: "Second-generation Earth observation satellite for Thailand.",
    launchDate: "2023-10-09",
    operator: "GISTDA",
  },
  {
    noradId: 67683,
    name: "KnackSat-2",
    purpose: "Education",
    description: "Educational CubeSat built by students at King Mongkut's University of Technology North Bangkok.",
    launchDate: "2025-01-14",
  },
  {
    noradId: 33396,
    name: "THEOS",
    purpose: "Earth Observation",
    description: "Thailand's first Earth observation satellite.",
    launchDate: "2008-10-01",
    operator: "GISTDA",
  },
  {
    noradId: 28786,
    name: "Thaicom 4",
    purpose: "Communication",
    description: "GEO communications satellite (IPSTAR).",
    launchDate: "2005-08-11",
    operator: "Thaicom",
  },
  {
    noradId: 39500,
    name: "Thaicom 6",
    purpose: "Communication",
    launchDate: "2013-12-03",
    operator: "Thaicom",
  },
  {
    noradId: 40141,
    name: "Thaicom 7",
    purpose: "Communication",
    launchDate: "2014-09-10",
    operator: "Thaicom",
  },
  {
    noradId: 41552,
    name: "Thaicom 8",
    purpose: "Communication",
    launchDate: "2016-05-27",
    operator: "Thaicom",
  },
  {
    noradId: 48963,
    name: "Napa-2",
    purpose: "Military",
    description: "Earth observation satellite for defence and security applications.",
    launchDate: "2021-09-09",
  },
] as const satisfies readonly SatelliteRecord[];
