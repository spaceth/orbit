import { gstime } from "satellite.js";
import { Vector3 } from "three";

/** Mean Earth radius used elsewhere in the globe scene (km). */
const EARTH_RADIUS_KM = 6371;

/** Mean lunar radius (km). */
export const MOON_RADIUS_KM = 1737.4;

/** Scene-unit Moon radius relative to Earth = 1. */
export const MOON_RADIUS_SCENE = MOON_RADIUS_KM / EARTH_RADIUS_KM;

const DEG2RAD = Math.PI / 180;

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

function normalizeDegrees(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/**
 * Low-precision geocentric Moon position (Meeus-style).
 * Accurate enough for visualization (~tens of km to ~1° depending on term set).
 * Returns Earth-fixed scene coordinates with Earth radius = 1 (same frame as satellites).
 */
export function getMoonEcfPosition(date: Date): Vector3 {
  const T = (julianDay(date) - 2451545.0) / 36525;

  // Mean elements (degrees)
  const Lp = normalizeDegrees(
    218.3164477 +
      481267.88123421 * T -
      0.0015786 * T * T +
      (T * T * T) / 538841 -
      (T * T * T * T) / 65194000,
  );
  const D = normalizeDegrees(
    297.8501921 +
      445267.1114034 * T -
      0.0018819 * T * T +
      (T * T * T) / 545868 -
      (T * T * T * T) / 113065000,
  );
  const M = normalizeDegrees(
    357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000,
  );
  const Mp = normalizeDegrees(
    134.9633964 +
      477198.8675055 * T +
      0.0087414 * T * T +
      (T * T * T) / 69699 -
      (T * T * T * T) / 14712000,
  );
  const F = normalizeDegrees(
    93.272095 +
      483202.0175233 * T -
      0.0036539 * T * T -
      (T * T * T) / 3526000 +
      (T * T * T * T) / 863310000,
  );
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const E2 = E * E;

  const d = D * DEG2RAD;
  const m = M * DEG2RAD;
  const mp = Mp * DEG2RAD;
  const f = F * DEG2RAD;

  // Longitude periodic terms (arcseconds) — primary set from Meeus
  let sumL =
    6288774 * Math.sin(mp) +
    1274027 * Math.sin(2 * d - mp) +
    658314 * Math.sin(2 * d) +
    213618 * Math.sin(2 * mp) -
    185116 * E * Math.sin(m) -
    114332 * Math.sin(2 * f) +
    58793 * Math.sin(2 * d - 2 * mp) +
    57066 * E * Math.sin(2 * d - m - mp) +
    53322 * Math.sin(2 * d + mp) +
    45758 * E * Math.sin(2 * d - m) -
    40923 * E * Math.sin(m - mp) -
    34720 * Math.sin(d) -
    30383 * E * Math.sin(m + mp) +
    15327 * Math.sin(2 * d - 2 * f) -
    12528 * Math.sin(mp + 2 * f) +
    10980 * Math.sin(mp - 2 * f);

  // Latitude periodic terms (arcseconds)
  let sumB =
    5128122 * Math.sin(f) +
    280602 * Math.sin(mp + f) +
    277693 * Math.sin(mp - f) +
    173237 * Math.sin(2 * d - f) +
    55413 * Math.sin(2 * d - mp + f) +
    46271 * Math.sin(2 * d - mp - f) +
    32573 * Math.sin(2 * d + f) +
    17198 * Math.sin(2 * mp + f) +
    9266 * Math.sin(2 * d + mp - f) +
    8822 * Math.sin(2 * mp - f) +
    8216 * E * Math.sin(2 * d - m - f);

  // Distance periodic terms (kilometers)
  let sumR =
    -20905355 * Math.cos(mp) -
    3699111 * Math.cos(2 * d - mp) -
    2955968 * Math.cos(2 * d) -
    569925 * Math.cos(2 * mp) +
    48888 * E * Math.cos(m) -
    3149 * Math.cos(2 * f) +
    246158 * Math.cos(2 * d - 2 * mp) -
    152138 * E * Math.cos(2 * d - m - mp) -
    170733 * Math.cos(2 * d + mp) -
    204586 * E * Math.cos(2 * d - m) -
    129620 * E * Math.cos(m - mp) +
    108743 * Math.cos(d) +
    104755 * E * Math.cos(m + mp) +
    79661 * Math.cos(mp - 2 * f);

  // A few E² terms that matter at visualization scale
  sumL +=
    26145 * E2 * Math.sin(2 * d - 2 * m - mp) -
    17176 * E2 * Math.sin(2 * m) -
    14767 * E2 * Math.sin(2 * d - 2 * m);

  const lambda = (Lp + sumL / 1_000_000) * DEG2RAD;
  const beta = (sumB / 1_000_000) * DEG2RAD;
  const distanceKm = 385000.56 + sumR / 1000;

  // True obliquity of the ecliptic (degrees → rad)
  const epsilon =
    (23.439291 -
      0.0130042 * T -
      0.00000016 * T * T +
      0.000000504 * T * T * T) *
    DEG2RAD;

  const cosBeta = Math.cos(beta);
  const sinBeta = Math.sin(beta);
  const cosLambda = Math.cos(lambda);
  const sinLambda = Math.sin(lambda);
  const cosEps = Math.cos(epsilon);
  const sinEps = Math.sin(epsilon);

  // Geocentric equatorial (ECI / TEME-like for viz)
  const x = distanceKm * cosBeta * cosLambda;
  const y = distanceKm * (cosBeta * sinLambda * cosEps - sinBeta * sinEps);
  const z = distanceKm * (cosBeta * sinLambda * sinEps + sinBeta * cosEps);

  // Rotate ECI → ECF with GMST (same convention as satellite markers)
  const gmst = gstime(date);
  const cosG = Math.cos(gmst);
  const sinG = Math.sin(gmst);
  const ecfX = cosG * x + sinG * y;
  const ecfY = -sinG * x + cosG * y;
  const ecfZ = z;

  // Match satellite.js ECF → Three.js: (x, z, -y) / R⊕
  return new Vector3(ecfX, ecfZ, -ecfY).multiplyScalar(1 / EARTH_RADIUS_KM);
}
