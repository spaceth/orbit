import type { OmmData } from "@/types/satellite";

/**
 * Built-in My Satellites entry from `flight-15.omm` in the repo root.
 * NORAD 99999 is a placeholder. This orbit is not in the public catalog.
 */
export const FLIGHT_15_ROUTE_ID = "flight-15";
export const FLIGHT_15_NORAD_ID = 99999;
export const FLIGHT_15_NAME = "STARSHIP FLIGHT 15";

export const FLIGHT_15_OMM: OmmData = {
  noradId: 99999,
  name: "Starship Flight 14",
  objectId: "99999",
  epoch: "2026-11-14T01:32:00.000000",
  meanMotion: 15.995171074753271,
  eccentricity: 0.016556499392192,
  inclination: 30.531667249174774,
  raOfAscNode: 173.941708937621883,
  argOfPericenter: 316.062188542434285,
  meanAnomaly: 82.376543931865868,
  bstar: 0,
  meanMotionDot: 0,
  meanMotionDdot: 0,
  ephemerisType: 0,
  classificationType: "U",
  elementSetNo: 0,
  revAtEpoch: 0,
  raw: {
    OBJECT_NAME: "Starship Flight 14",
    OBJECT_ID: "99999",
    CENTER_NAME: "EARTH",
    REF_FRAME: "TEME",
    TIME_SYSTEM: "UTC",
    MEAN_ELEMENT_THEORY: "SGP4",
    EPOCH: "2026-11-14T01:32:00.000000",
    MEAN_MOTION: 15.995171074753271,
    ECCENTRICITY: 0.016556499392192,
    INCLINATION: 30.531667249174774,
    RA_OF_ASC_NODE: 173.941708937621883,
    ARG_OF_PERICENTER: 316.062188542434285,
    MEAN_ANOMALY: 82.376543931865868,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: "U",
    NORAD_CAT_ID: 99999,
    ELEMENT_SET_NO: 0,
    REV_AT_EPOCH: 0,
    BSTAR: 0,
    MEAN_MOTION_DOT: 0,
    MEAN_MOTION_DDOT: 0,
  },
};
