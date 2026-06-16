export interface TleData {
  noradId: number;
  name: string;
  line1: string;
  line2: string;
  date: string;
}

export interface SatelliteTelemetry {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmS: number;
}

export type SatellitePurpose =
  | "Communication"
  | "Military"
  | "Education"
  | "Earth Observation";

/** Static registry entry — add or remove satellites in `src/data/satellites.ts`. */
export interface SatelliteRecord {
  noradId: number;
  name: string;
  purpose: SatellitePurpose;
  description?: string;
  launchDate?: string;
  operator?: string;
  manufacturer?: string;
}
