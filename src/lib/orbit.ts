import {
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";
import type { SatRec } from "satellite.js";
import { Vector3 } from "three";

import type { SatelliteTelemetry, TleData } from "@/types/satellite";

import { getOrbitalAltitudesFromTle } from "./tle";

export type { SatRec };

const EARTH_RADIUS_KM = 6371;

const TRAIL_STEPS = 180;
const GEO_RING_STEPS = 240;
const STATIONARY_TRAIL_THRESHOLD = 0.08;

export function parseTle(tle: TleData): SatRec {
  return twoline2satrec(tle.line1, tle.line2);
}

function ecfToVector(position: { x: number; y: number; z: number }): Vector3 {
  return new Vector3(position.x, position.z, -position.y).multiplyScalar(
    1 / EARTH_RADIUS_KM,
  );
}

function getOrbitalPeriodMs(satrec: SatRec): number {
  const meanMotionRadPerMin = satrec.no;
  const periodMinutes = (2 * Math.PI) / meanMotionRadPerMin;
  return periodMinutes * 60 * 1000;
}

export function getTelemetry(satrec: SatRec, tleLine2: string, date: Date): SatelliteTelemetry | null {
  const result = propagate(satrec, date);
  if (
    !result ||
    !result.position ||
    result.position === true ||
    !result.velocity ||
    result.velocity === true
  ) {
    return null;
  }

  const gmst = gstime(date);
  const geodetic = eciToGeodetic(result.position, gmst);
  const velocity = result.velocity;
  const velocityKmS = Math.sqrt(
    velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z,
  );
  const { apogeeKm, perigeeKm } = getOrbitalAltitudesFromTle(tleLine2);

  return {
    apogeeKm,
    perigeeKm,
    altitudeKm: geodetic.height,
    velocityKmS,
  };
}

export function getEcfPosition(satrec: SatRec, date: Date): Vector3 | null {
  const result = propagate(satrec, date);
  if (!result?.position || result.position === true) {
    return null;
  }

  const gmst = gstime(date);
  const ecf = eciToEcf(result.position, gmst);
  return ecfToVector(ecf);
}

export function sampleOrbitTrail(satrec: SatRec, startDate: Date): Vector3[] {
  const periodMs = getOrbitalPeriodMs(satrec);
  const step = periodMs / TRAIL_STEPS;
  const points: Vector3[] = [];

  // Render trail from one orbit in the past up to "now".
  for (let offset = -periodMs; offset <= 0; offset += step) {
    const date = new Date(startDate.getTime() + offset);
    const position = getEcfPosition(satrec, date);
    if (position) {
      points.push(position);
    }
  }

  if (isStationaryTrail(points)) {
    const anchor = points[points.length - 1] ?? points[0];
    const radius = anchor?.length() ?? 6.6;
    return createGeoRing(radius, anchor);
  }

  return points;
}

export function isGeostationaryTrail(points: Vector3[]): boolean {
  if (points.length < 100) {
    return false;
  }

  const avgRadius =
    points.reduce((sum, point) => sum + point.length(), 0) / points.length;
  const avgAbsY =
    points.reduce((sum, point) => sum + Math.abs(point.y), 0) / points.length;

  return avgRadius > 5 && avgAbsY < 0.12;
}

function isStationaryTrail(points: Vector3[]): boolean {
  if (points.length < 3) {
    return false;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    minZ = Math.min(minZ, point.z);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    maxZ = Math.max(maxZ, point.z);
  }

  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  return span < STATIONARY_TRAIL_THRESHOLD;
}

function createGeoRing(radius: number, anchor: Vector3): Vector3[] {
  const points: Vector3[] = [];
  const anchorAngle = Math.atan2(anchor.z, anchor.x);

  for (let index = 0; index <= GEO_RING_STEPS; index += 1) {
    const angle = anchorAngle + (index / GEO_RING_STEPS) * Math.PI * 2;
    points.push(
      new Vector3(
        Math.cos(angle) * radius,
        anchor.y,
        Math.sin(angle) * radius,
      ),
    );
  }

  return points;
}
