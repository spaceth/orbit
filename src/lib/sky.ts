import { gstime } from "satellite.js";
import { Matrix4, Vector3 } from "three";

/**
 * NASA SVS Deep Star Maps are raster plates, so the ground sky is drawn from
 * catalog coordinates instead. Stars to magnitude 6 come from XHIP, the
 * Extended Hipparcos Compilation (Anderson & Francis, 2012). Constellation
 * lines are the IAU figures, with Olaf Frohn's adjustments, from d3-celestial
 * (BSD-3-Clause, https://github.com/ofrohn/d3-celestial). Positions are J2000
 * right ascension and declination, rotated into the same Earth-fixed scene
 * frame the satellites already use.
 */
export const SKY_RADIUS = 90;
const OBSERVER_HEIGHT = 1.004;
const DEG = Math.PI / 180;

export interface ObserverFrame {
  position: Vector3;
  up: Vector3;
  north: Vector3;
  east: Vector3;
}

export function raDecToEci(raDeg: number, decDeg: number, target = new Vector3()): Vector3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const cosDec = Math.cos(dec);
  return target.set(cosDec * Math.cos(ra), cosDec * Math.sin(ra), Math.sin(dec));
}

export function skyMatrixForDate(date: Date, target = new Matrix4()): Matrix4 {
  const theta = gstime(date);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  return target.set(
    cosTheta,
    sinTheta,
    0,
    0,
    0,
    0,
    1,
    0,
    sinTheta,
    -cosTheta,
    0,
    0,
    0,
    0,
    0,
    1,
  );
}

export function observerFrame(latDeg: number, lonDeg: number, frame?: ObserverFrame): ObserverFrame {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosLon = Math.cos(lon);
  const sinLon = Math.sin(lon);
  const result = frame ?? {
    position: new Vector3(),
    up: new Vector3(),
    north: new Vector3(),
    east: new Vector3(),
  };

  result.up.set(cosLat * cosLon, sinLat, -cosLat * sinLon);
  result.position.copy(result.up).multiplyScalar(OBSERVER_HEIGHT);
  result.north.set(-sinLat * cosLon, cosLat, sinLat * sinLon).normalize();
  result.east.set(-sinLon, 0, -cosLon).normalize();
  return result;
}

export function lookDirection(
  frame: ObserverFrame,
  azimuthDeg: number,
  elevationDeg: number,
  target = new Vector3(),
): Vector3 {
  const azimuth = azimuthDeg * DEG;
  const elevation = elevationDeg * DEG;
  const cosElevation = Math.cos(elevation);
  return target
    .copy(frame.north)
    .multiplyScalar(Math.cos(azimuth) * cosElevation)
    .addScaledVector(frame.east, Math.sin(azimuth) * cosElevation)
    .addScaledVector(frame.up, Math.sin(elevation));
}
