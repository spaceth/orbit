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
  epoch: "2026-11-15T09:38:00.000000",
  meanMotion: 16.00135404137,
  eccentricity: 0.000940495959,
  inclination: 30.506360930558,
  raOfAscNode: 171.755441003814,
  argOfPericenter: 123.702642451987,
  meanAnomaly: 77.68591150885,
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
    EPOCH: "2026-11-15T09:38:00.000000",
    MEAN_MOTION: 16.00135404137,
    ECCENTRICITY: 0.000940495959,
    INCLINATION: 30.506360930558,
    RA_OF_ASC_NODE: 171.755441003814,
    ARG_OF_PERICENTER: 123.702642451987,
    MEAN_ANOMALY: 77.68591150885,
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
