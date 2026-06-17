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
    description: "THEOS-2 is Thailand’s high-resolution Earth observation satellite developed with Airbus. Operated by GISTDA, it captures detailed imagery for mapping, agriculture, forestry, water management, urban planning, and disaster response.",
    launchDate: "2023-10-09",
    operator: "GISTDA",
  },
  {
    noradId: 67683,
    name: "KnackSat-2",
    purpose: "Education",
    description: "KnackSat-2 is a Thai CubeSat developed by King Mongkut’s University of Technology North Bangkok. Deployed from the ISS in 2026, it supports education, satellite engineering, and hands-on space technology development in Thailand.",
    launchDate: "2025-01-14",
  },
  {
    noradId: 33396,
    name: "THEOS",
    purpose: "Earth Observation",
    description: "THEOS is Thailand’s first Earth observation satellite, launched in 2008 and operated by GISTDA. It provided satellite imagery for mapping, agriculture, natural resources, disaster monitoring, and national planning.",
    launchDate: "2008-10-01",
    operator: "GISTDA",
  },
  {
    noradId: 28786,
    name: "Thaicom 4",
    purpose: "Communication",
    description: "Thaicom 4, also known as IPSTAR, is Thailand’s high-throughput communications satellite launched in 2005. It provides broadband internet and data services across Asia-Pacific, supporting connectivity in remote and underserved areas.",
    launchDate: "2005-08-11",
    operator: "Thaicom",
  },
  {
    noradId: 39500,
    name: "Thaicom 6",
    purpose: "Communication",
    description: "Thaicom 6 is a high-throughput communications satellite launched in 2013. It provides broadband internet and data services across Asia-Pacific, supporting connectivity in remote and underserved areas.",
    launchDate: "2013-12-03",
    operator: "Thaicom",
  },
  {
    noradId: 40141,
    name: "Thaicom 7",
    purpose: "Communication",
    description: "Thaicom 7 is a high-throughput communications satellite launched in 2014. It provides broadband internet and data services across Asia-Pacific, supporting connectivity in remote and underserved areas.",
    launchDate: "2014-09-10",
    operator: "Thaicom",
  },
  {
    noradId: 41552,
    name: "Thaicom 8",
    purpose: "Communication",
    description: "Thaicom 8 is a high-throughput communications satellite launched in 2016. It provides broadband internet and data services across Asia-Pacific, supporting connectivity in remote and underserved areas.",
    launchDate: "2016-05-27",
    operator: "Thaicom",
  },
  {
    noradId: 48963,
    name: "Napa-2",
    purpose: "Military",
    description: "Napa-2 is a military Earth observation satellite developed by the Royal Thai Air Force. Launched in 2021, it provides surveillance and reconnaissance capabilities for defense and security operations.",
    launchDate: "2021-09-09",
  },
] as const satisfies readonly SatelliteRecord[];
