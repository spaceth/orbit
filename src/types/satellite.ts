export interface TleData {
  noradId: number;
  name: string;
  line1: string;
  line2: string;
  date: string;
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
  noradId: number;
  name: string;
  purpose: SatellitePurpose;
  description?: string;
  launchDate?: string;
  launchVehicle?: string;
  operator?: string;
  manufacturer?: string;
}

/** Planned spacecraft — add or remove in `src/data/future-satellites.ts`. */
export interface FutureSatelliteRecord {
  id: string;
  name: string;
  purpose: SatellitePurpose;
  description: string;
  launchInfo: string;
  operator?: string;
}
