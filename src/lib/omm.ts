import type { OMMJsonObject } from "satellite.js";

import type { OmmData } from "@/types/satellite";

const CELESTRAK_GP_URL =
  "https://celestrak.org/NORAD/elements/gp.php";
const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU_KM3_S2 = 398600.4418;
const SECONDS_PER_DAY = 86_400;

/** CelesTrak GP JSON / CCSDS OMM field names (uppercase). */
export type CelestrakOmmJson = OMMJsonObject;

function toNumber(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric OMM field: ${value}`);
  }
  return parsed;
}

export function normalizeOmm(raw: CelestrakOmmJson): OmmData {
  const noradId = toNumber(raw.NORAD_CAT_ID);
  const objectId =
    typeof raw.OBJECT_ID === "string" && raw.OBJECT_ID.length > 0
      ? raw.OBJECT_ID
      : undefined;

  return {
    noradId,
    name: raw.OBJECT_NAME,
    objectId,
    epoch: raw.EPOCH,
    meanMotion: toNumber(raw.MEAN_MOTION),
    eccentricity: toNumber(raw.ECCENTRICITY),
    inclination: toNumber(raw.INCLINATION),
    raOfAscNode: toNumber(raw.RA_OF_ASC_NODE),
    argOfPericenter: toNumber(raw.ARG_OF_PERICENTER),
    meanAnomaly: toNumber(raw.MEAN_ANOMALY),
    bstar: toNumber(raw.BSTAR),
    meanMotionDot: toNumber(raw.MEAN_MOTION_DOT),
    meanMotionDdot: toNumber(raw.MEAN_MOTION_DDOT),
    ephemerisType: toNumber(raw.EPHEMERIS_TYPE ?? 0),
    classificationType: raw.CLASSIFICATION_TYPE ?? "U",
    elementSetNo: toNumber(raw.ELEMENT_SET_NO),
    revAtEpoch: toNumber(raw.REV_AT_EPOCH ?? 0),
  };
}

/** Convert app OmmData back to the shape satellite.js `json2satrec` expects. */
export function ommToJsonObject(omm: OmmData): OMMJsonObject {
  return {
    OBJECT_NAME: omm.name,
    OBJECT_ID: omm.objectId ?? "",
    EPOCH: omm.epoch,
    MEAN_MOTION: omm.meanMotion,
    ECCENTRICITY: omm.eccentricity,
    INCLINATION: omm.inclination,
    RA_OF_ASC_NODE: omm.raOfAscNode,
    ARG_OF_PERICENTER: omm.argOfPericenter,
    MEAN_ANOMALY: omm.meanAnomaly,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: omm.classificationType === "C" ? "C" : "U",
    NORAD_CAT_ID: omm.noradId,
    ELEMENT_SET_NO: omm.elementSetNo,
    REV_AT_EPOCH: omm.revAtEpoch,
    BSTAR: omm.bstar,
    MEAN_MOTION_DOT: omm.meanMotionDot,
    MEAN_MOTION_DDOT: omm.meanMotionDdot,
  };
}

export function getOrbitalAltitudesFromOmm(omm: Pick<OmmData, "eccentricity" | "meanMotion">): {
  apogeeKm: number;
  perigeeKm: number;
} {
  const meanMotionRadPerSec = (omm.meanMotion * 2 * Math.PI) / SECONDS_PER_DAY;
  const semiMajorAxisKm =
    (EARTH_MU_KM3_S2 / (meanMotionRadPerSec * meanMotionRadPerSec)) ** (1 / 3);

  return {
    apogeeKm: semiMajorAxisKm * (1 + omm.eccentricity) - EARTH_RADIUS_KM,
    perigeeKm: semiMajorAxisKm * (1 - omm.eccentricity) - EARTH_RADIUS_KM,
  };
}

export async function fetchOmmFromCelestrak(noradId: number): Promise<OmmData> {
  const url = `${CELESTRAK_GP_URL}?CATNR=${noradId}&FORMAT=json`;
  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`OMM fetch failed with status ${response.status}`);
  }

  const data = (await response.json()) as CelestrakOmmJson[] | CelestrakOmmJson;

  if (typeof data === "string") {
    // CelesTrak returns plain text errors for missing objects.
    throw new Error(`OMM fetch failed: ${data}`);
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record || typeof record !== "object" || !("NORAD_CAT_ID" in record)) {
    throw new Error(`OMM fetch returned no elements for NORAD ${noradId}`);
  }

  return normalizeOmm(record);
}
