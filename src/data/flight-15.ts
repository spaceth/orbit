import type { OmmData } from "@/types/satellite";

/**
 * Built-in My Satellites entry from `flight-15.omm` in the repo root.
 * NORAD 99999 is a placeholder. This orbit is not in the public catalog.
 */
export const FLIGHT_15_ROUTE_ID = "flight-15";
export const FLIGHT_15_NORAD_ID = 99999;
export const FLIGHT_15_NAME = "STARSHIP FLIGHT 15";

export const FLIGHT_15_OMM: OmmData = {
  noradId: FLIGHT_15_NORAD_ID,
  name: FLIGHT_15_NAME,
  objectId: "99999",
  epoch: "2026-11-15T10:55:00.000000",
  meanMotion: 16.040453972207,
  eccentricity: 0.005792716213,
  inclination: 30.471644869045,
  raOfAscNode: 171.893221080653,
  argOfPericenter: 44.806065337749,
  meanAnomaly: 97.707458888766,
  bstar: 0,
  meanMotionDot: 0,
  meanMotionDdot: 0,
  ephemerisType: 0,
  classificationType: "U",
  elementSetNo: 1,
  revAtEpoch: 0,
  raw: {
    OBJECT_NAME: FLIGHT_15_NAME,
    OBJECT_ID: "99999",
    CENTER_NAME: "EARTH",
    REF_FRAME: "TEME",
    TIME_SYSTEM: "UTC",
    MEAN_ELEMENT_THEORY: "SGP4",
    EPOCH: "2026-11-15T10:55:00.000000",
    MEAN_MOTION: 16.040453972207,
    ECCENTRICITY: 0.005792716213,
    INCLINATION: 30.471644869045,
    RA_OF_ASC_NODE: 171.893221080653,
    ARG_OF_PERICENTER: 44.806065337749,
    MEAN_ANOMALY: 97.707458888766,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: "U",
    NORAD_CAT_ID: FLIGHT_15_NORAD_ID,
    ELEMENT_SET_NO: 1,
    REV_AT_EPOCH: 0,
    BSTAR: 0,
    MEAN_MOTION_DOT: 0,
    MEAN_MOTION_DDOT: 0,
  },
};
