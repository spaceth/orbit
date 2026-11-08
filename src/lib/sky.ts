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

const aimOffset = new Vector3();
const aimHorizontal = new Vector3();

/** Azimuth from north toward east, and elevation, of a scene point from the observer. */
export function directionToAzimuthElevation(
  frame: ObserverFrame,
  target: Vector3,
): { azimuth: number; elevation: number } | null {
  aimOffset.copy(target).sub(frame.position);
  if (aimOffset.lengthSq() < 1e-10) {
    return null;
  }
  aimOffset.normalize();
  const sinElevation = Math.min(1, Math.max(-1, aimOffset.dot(frame.up)));
  const elevation = Math.asin(sinElevation) / DEG;
  aimHorizontal.copy(aimOffset).addScaledVector(frame.up, -sinElevation);
  if (aimHorizontal.lengthSq() < 1e-10) {
    return { azimuth: 0, elevation };
  }
  return {
    azimuth: Math.atan2(aimHorizontal.dot(frame.east), aimHorizontal.dot(frame.north)) / DEG,
    elevation,
  };
}

function wrapDegrees(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

/** Move the ground look toward a target. The step is a visual angle, so azimuth slows near the zenith. */
export function slewLook(
  azimuthDeg: number,
  elevationDeg: number,
  targetAzimuthDeg: number,
  targetElevationDeg: number,
  deltaSeconds: number,
  degreesPerSecond = 110,
): { azimuth: number; elevation: number } {
  const deltaAzimuth = wrapDegrees(targetAzimuthDeg - azimuthDeg);
  const deltaElevation = targetElevationDeg - elevationDeg;
  const angular = Math.hypot(deltaAzimuth * Math.cos(elevationDeg * DEG), deltaElevation);
  const step = Math.max(0, degreesPerSecond * deltaSeconds);
  if (angular < 0.05 || angular <= step) {
    return { azimuth: wrapDegrees(targetAzimuthDeg), elevation: targetElevationDeg };
  }
  const fraction = step / angular;
  return {
    azimuth: wrapDegrees(azimuthDeg + deltaAzimuth * fraction),
    elevation: elevationDeg + deltaElevation * fraction,
  };
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

const dragLook = new Vector3();
const dragRight = new Vector3();
const dragHorizontal = new Vector3();

/**
 * Turn the ground view so the sky stays under the pointer. dx and dy are CSS
 * pixels, positive right and down. Yaw is scaled by 1/cos(elevation) so a
 * horizontal drag moves the sky by the same angle the pointer crossed.
 */
export function dragLookByPointer(
  frame: ObserverFrame,
  azimuthDeg: number,
  elevationDeg: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
  fovDeg: number,
  minElevation = -8,
  maxElevation = 88,
): { azimuth: number; elevation: number } {
  if (width < 1 || height < 1 || (dx === 0 && dy === 0)) {
    return { azimuth: azimuthDeg, elevation: elevationDeg };
  }

  const elevation = elevationDeg * DEG;
  const cosElevation = Math.max(0.02, Math.cos(elevation));
  const verticalFov = fovDeg * DEG;
  const halfWidth = Math.tan(verticalFov / 2) * (width / height);
  const yaw = Math.atan(halfWidth * ((2 * dx) / width)) / cosElevation;
  const pitchRoomUp = maxElevation * DEG - elevation;
  const pitchRoomDown = elevation - minElevation * DEG;
  const pitch = Math.min(
    pitchRoomUp,
    Math.max(-pitchRoomDown, Math.atan(Math.tan(verticalFov / 2) * ((2 * dy) / height))),
  );

  const look = lookDirection(frame, azimuthDeg, elevationDeg, dragLook);
  look.applyAxisAngle(frame.up, yaw);
  const right = dragRight.crossVectors(look, frame.up);
  if (right.lengthSq() > 1e-10) {
    right.normalize();
    look.applyAxisAngle(right, pitch);
  }

  const sinElevation = Math.min(1, Math.max(-1, look.dot(frame.up)));
  const horizontal = dragHorizontal.copy(look).addScaledVector(frame.up, -sinElevation);
  const azimuth =
    horizontal.lengthSq() > 1e-10
      ? Math.atan2(horizontal.dot(frame.east), horizontal.dot(frame.north)) / DEG
      : azimuthDeg;

  return {
    azimuth,
    elevation: Math.min(maxElevation, Math.max(minElevation, Math.asin(sinElevation) / DEG)),
  };
}
