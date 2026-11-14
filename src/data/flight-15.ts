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
  epoch: "2026-11-15T03:07:36.000000",
  meanMotion: 16.022151649822,
  eccentricity: 0.001197761555,
  inclination: 30.530018319922,
  raOfAscNode: 174.567099720556,
  argOfPericenter: 356.379668742284,
  meanAnomaly: 66.490430556135,
  bstar: 0,
  meanMotionDot: 0,
  meanMotionDdot: 0,
  ephemerisType: 0,
  classificationType: "U",
  elementSetNo: 2,
  revAtEpoch: 0,
  raw: {
    OBJECT_NAME: FLIGHT_15_NAME,
    OBJECT_ID: "99999",
    CENTER_NAME: "EARTH",
    REF_FRAME: "TEME",
    TIME_SYSTEM: "UTC",
    MEAN_ELEMENT_THEORY: "SGP4",
    EPOCH: "2026-11-15T03:07:36.000000",
    MEAN_MOTION: 16.022151649822,
    ECCENTRICITY: 0.001197761555,
    INCLINATION: 30.530018319922,
    RA_OF_ASC_NODE: 174.567099720556,
    ARG_OF_PERICENTER: 356.379668742284,
    MEAN_ANOMALY: 66.490430556135,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: "U",
    NORAD_CAT_ID: FLIGHT_15_NORAD_ID,
    ELEMENT_SET_NO: 2,
    REV_AT_EPOCH: 0,
    BSTAR: 0,
    MEAN_MOTION_DOT: 0,
    MEAN_MOTION_DDOT: 0,
  },
};
