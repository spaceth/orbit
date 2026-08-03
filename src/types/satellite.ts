/** App-normalized Orbit Mean-Elements Message (CCSDS OMM / CelesTrak GP JSON). */
export interface OmmData {
  noradId: number;
  name: string;
  objectId?: string;
  epoch: string;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raOfAscNode: number;
  argOfPericenter: number;
  meanAnomaly: number;
  bstar: number;
  meanMotionDot: number;
  meanMotionDdot: number;
  ephemerisType: number;
  classificationType: string;
  elementSetNo: number;
  revAtEpoch: number;
}

export interface SatelliteTelemetry {
  apogeeKm: number;
  perigeeKm: number;
  altitudeKm: number;
  velocityKmS: number;
}

export type SatellitePurpose =
  | "Communication"
  | "Military"
  | "Education"
  | "Earth Observation"
  | "Technology Demonstration"
  | "Science";

/** Static registry entry — add or remove satellites in `src/data/satellites.ts`. */
export interface SatelliteRecord {
  id: string;
  noradId: number;
  name: string;
  purpose: SatellitePurpose;
  description?: string;
  launchDate?: string;
  launchVehicle?: string;
  operator?: string;
  manufacturer?: string;
}

/** Ended missions — add or remove in `src/data/legacy-satellites.ts`. */
export interface LegacySatelliteRecord {
  id: string;
  name: string;
  purpose: SatellitePurpose;
  endOfMission: string;
  /** Historical NORAD ID for display only — not tracked. */
  noradId?: number;
  launchDate?: string;
  launchVehicle?: string;
  operator?: string;
}

/** Planned spacecraft — add or remove in `src/data/future-satellites.ts`. */
export interface FutureSatelliteRecord {
  id: string;
  name: string;
  purpose: SatellitePurpose;
  launchInfo: string;
  operator?: string;
}
