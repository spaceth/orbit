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

export type SatelliteModelAxis = "+X" | "-X" | "+Y" | "-Y" | "+Z" | "-Z";

export interface SatelliteOrbitAlignmentConfig {
  /** Set false when a model must keep its authored world orientation. */
  enabled?: boolean;
  /** Local GLB axis that should point along the direction of travel. */
  forwardAxis?: SatelliteModelAxis;
  /** Local GLB axis that should point toward the center of Earth. */
  nadirAxis?: SatelliteModelAxis;
  /** Quaternion interpolation speed used while following the orbit. */
  smoothing?: number;
}

/** Optional GLB presentation shared by tracked, legacy, and future spacecraft. */
export interface SatelliteModelConfig {
  /** Public URL, normally `/models/satellites/<satellite-id>.glb`. */
  src: string;
  /** True only after the GLB file is installed and ready to render. */
  available?: boolean;
  /** Visual scale after the model has been normalized to a one-unit bounding box. */
  scale?: number;
  /** Three.js Euler rotation in radians. */
  rotation?: readonly [number, number, number];
  /** Local offset applied after normalization. */
  offset?: readonly [number, number, number];
  /** Stable visualization size in orbit-space units, where Earth has radius 1. */
  orbitWorldScale?: number;
  /** Camera distance from the spacecraft after focusing, in orbit-space units. */
  focusDistance?: number;
  /** Optional per-model axis mapping for orbit-following attitude visualization. */
  orbitAlignment?: SatelliteOrbitAlignmentConfig;
  /** Optional source attribution shown with detail previews. */
  credit?: string;
  creditUrl?: string;
  license?: string;
}

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
  model?: SatelliteModelConfig;
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
  model?: SatelliteModelConfig;
}

/** Planned spacecraft — add or remove in `src/data/future-satellites.ts`. */
export interface FutureSatelliteRecord {
  id: string;
  name: string;
  purpose: SatellitePurpose;
  launchInfo: string;
  operator?: string;
  model?: SatelliteModelConfig;
}
