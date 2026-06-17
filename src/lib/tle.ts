import type { TleData } from "@/types/satellite";

const TLE_API_BASE = "https://tle.ivanstanojevic.me/api/tle";
const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU_KM3_S2 = 398600.4418;
const SECONDS_PER_DAY = 86_400;

interface TleApiResponse {
  satelliteId: number;
  name: string;
  line1: string;
  line2: string;
  date: string;
}

export interface TleOrbitalElements {
  eccentricity: number;
  meanMotionRevPerDay: number;
}

/** Eccentricity and mean motion as encoded on TLE line 2. */
export function parseTleOrbitalElements(line2: string): TleOrbitalElements {
  return {
    eccentricity: Number.parseFloat(`0.${line2.slice(26, 33).trim()}`),
    meanMotionRevPerDay: Number.parseFloat(line2.slice(52, 63).trim()),
  };
}

export function getOrbitalAltitudesFromTle(line2: string): {
  apogeeKm: number;
  perigeeKm: number;
} {
  const { eccentricity, meanMotionRevPerDay } = parseTleOrbitalElements(line2);
  const meanMotionRadPerSec = (meanMotionRevPerDay * 2 * Math.PI) / SECONDS_PER_DAY;
  const semiMajorAxisKm =
    (EARTH_MU_KM3_S2 / (meanMotionRadPerSec * meanMotionRadPerSec)) ** (1 / 3);

  return {
    apogeeKm: semiMajorAxisKm * (1 + eccentricity) - EARTH_RADIUS_KM,
    perigeeKm: semiMajorAxisKm * (1 - eccentricity) - EARTH_RADIUS_KM,
  };
}

export async function fetchTleFromApi(noradId: number): Promise<TleData> {
  const response = await fetch(`${TLE_API_BASE}/${noradId}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TLE fetch failed with status ${response.status}`);
  }

  const data = (await response.json()) as TleApiResponse;

  return {
    noradId: data.satelliteId,
    name: data.name,
    line1: data.line1,
    line2: data.line2,
    date: data.date,
  };
}
