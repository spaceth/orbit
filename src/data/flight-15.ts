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
  epoch: "2026-11-14T23:55:59.999808",
  meanMotion: 15.99822242,
  eccentricity: 0.00206,
  inclination: 30.518,
  raOfAscNode: 175.2568,
  argOfPericenter: 0,
  meanAnomaly: 16.9563,
  bstar: 0,
  meanMotionDot: 0,
  meanMotionDdot: 0,
  ephemerisType: 0,
  classificationType: "U",
  elementSetNo: 0,
  revAtEpoch: 0,
  raw: {
    OBJECT_NAME: FLIGHT_15_NAME,
    OBJECT_ID: "99999",
    EPOCH: "2026-11-14T23:55:59.999808",
    MEAN_MOTION: 15.99822242,
    ECCENTRICITY: 0.00206,
    INCLINATION: 30.518,
    RA_OF_ASC_NODE: 175.2568,
    ARG_OF_PERICENTER: 0,
    MEAN_ANOMALY: 16.9563,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: "U",
    NORAD_CAT_ID: FLIGHT_15_NORAD_ID,
    ELEMENT_SET_NO: 0,
    REV_AT_EPOCH: 0,
    BSTAR: 0,
    MEAN_MOTION_DOT: 0,
    MEAN_MOTION_DDOT: 0,
  },
};
