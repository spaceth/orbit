import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  gstime,
  json2satrec,
  propagate,
  radiansToDegrees,
  type SatRec,
} from "satellite.js";

import type { OmmData } from "@/types/satellite";

import { ommToJsonObject } from "./omm";

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const MIN_PASS_MS = 20_000;
const COMPASS_POINTS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

export interface PredictedPass {
  aosMs: number;
  losMs: number;
  maxElevationMs: number;
  maxElevationDeg: number;
  aosAzimuthDeg: number;
  losAzimuthDeg: number;
}

export type PassForecast =
  | { kind: "passes"; passes: PredictedPass[] }
  | { kind: "always-above" }
  | { kind: "none" };

interface Look {
  azimuthDeg: number;
  elevationDeg: number;
}

interface Observer {
  longitude: number;
  latitude: number;
  height: number;
}

function orbitalPeriodMs(satrec: SatRec): number {
  return ((2 * Math.PI) / satrec.no) * 60 * 1000;
}

function normalizeAzimuth(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

export function compassPoint(azimuthDeg: number): string {
  const index = Math.round(normalizeAzimuth(azimuthDeg) / 22.5) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index];
}

function isGeostationary(omm: OmmData): boolean {
  return omm.meanMotion > 0.98 && omm.meanMotion < 1.03 && omm.inclination < 10;
}

function lookAt(satrec: SatRec, timeMs: number, observer: Observer): Look | null {
  const propagated = propagate(satrec, new Date(timeMs));
  if (!propagated?.position) {
    return null;
  }

  const ecf = eciToEcf(propagated.position, gstime(new Date(timeMs)));
  const look = ecfToLookAngles(observer, ecf);
  return {
    azimuthDeg: normalizeAzimuth(radiansToDegrees(look.azimuth)),
    elevationDeg: radiansToDegrees(look.elevation),
  };
}

function refineCrossing(
  satrec: SatRec,
  observer: Observer,
  startMs: number,
  endMs: number,
  rising: boolean,
): number {
  let low = startMs;
  let high = endMs;
  for (let step = 0; step < 24; step += 1) {
    const mid = (low + high) / 2;
    const look = lookAt(satrec, mid, observer);
    const above = look !== null && look.elevationDeg > 0;
    if (above === rising) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return (low + high) / 2;
}

function findPeak(
  satrec: SatRec,
  observer: Observer,
  aosMs: number,
  losMs: number,
): { timeMs: number; elevationDeg: number } | null {
  const span = losMs - aosMs;
  const step = Math.min(15_000, Math.max(2_000, span / 40));
  let bestMs = aosMs;
  let bestElevation = Number.NEGATIVE_INFINITY;

  for (let timeMs = aosMs; timeMs <= losMs; timeMs += step) {
    const look = lookAt(satrec, timeMs, observer);
    if (look && look.elevationDeg > bestElevation) {
      bestElevation = look.elevationDeg;
      bestMs = timeMs;
    }
  }

  let left = Math.max(aosMs, bestMs - step);
  let right = Math.min(losMs, bestMs + step);
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const first = left + (right - left) / 3;
    const second = right - (right - left) / 3;
    const firstLook = lookAt(satrec, first, observer);
    const secondLook = lookAt(satrec, second, observer);
    if ((firstLook?.elevationDeg ?? -90) < (secondLook?.elevationDeg ?? -90)) {
      left = first;
    } else {
      right = second;
    }
  }

  const timeMs = (left + right) / 2;
  const look = lookAt(satrec, timeMs, observer);
  if (!look || look.elevationDeg <= 0) {
    return null;
  }
  return { timeMs, elevationDeg: look.elevationDeg };
}

function buildPass(
  satrec: SatRec,
  observer: Observer,
  aosMs: number,
  losMs: number,
): PredictedPass | null {
  if (losMs - aosMs < MIN_PASS_MS) {
    return null;
  }

  const peak = findPeak(satrec, observer, aosMs, losMs);
  const rise = lookAt(satrec, aosMs, observer);
  const set = lookAt(satrec, losMs, observer);
  if (!peak || !rise || !set) {
    return null;
  }

  return {
    aosMs,
    losMs,
    maxElevationMs: peak.timeMs,
    maxElevationDeg: peak.elevationDeg,
    aosAzimuthDeg: rise.azimuthDeg,
    losAzimuthDeg: set.azimuthDeg,
  };
}

function findHorizonBefore(
  satrec: SatRec,
  observer: Observer,
  fromMs: number,
  limitMs: number,
): number {
  let previousMs = fromMs;
  let cursor = fromMs;
  const step = 20_000;
  while (cursor > limitMs) {
    cursor = Math.max(limitMs, cursor - step);
    const look = lookAt(satrec, cursor, observer);
    if (!look || look.elevationDeg <= 0) {
      return refineCrossing(satrec, observer, cursor, previousMs, true);
    }
    previousMs = cursor;
  }
  return limitMs;
}

function findHorizonAfter(
  satrec: SatRec,
  observer: Observer,
  fromMs: number,
  limitMs: number,
): number {
  let previousMs = fromMs;
  let cursor = fromMs;
  const step = 20_000;
  while (cursor < limitMs) {
    cursor = Math.min(limitMs, cursor + step);
    const look = lookAt(satrec, cursor, observer);
    if (!look || look.elevationDeg <= 0) {
      return refineCrossing(satrec, observer, previousMs, cursor, false);
    }
    previousMs = cursor;
  }
  return limitMs;
}

/** Next three days of passes above the horizon, from SGP4. */
export function predictPasses(
  omm: OmmData,
  latitudeDeg: number,
  longitudeDeg: number,
  startMs: number,
): PassForecast {
  let satrec: SatRec;
  try {
    satrec = json2satrec(ommToJsonObject(omm));
  } catch {
    return { kind: "none" };
  }

  const observer: Observer = {
    longitude: degreesToRadians(longitudeDeg),
    latitude: degreesToRadians(latitudeDeg),
    height: 0,
  };
  const endMs = startMs + WINDOW_MS;

  if (isGeostationary(omm)) {
    let minimumElevation = Number.POSITIVE_INFINITY;
    const coarseMs = 10 * 60 * 1000;
    for (let timeMs = startMs; timeMs <= endMs; timeMs += coarseMs) {
      const look = lookAt(satrec, timeMs, observer);
      if (look) {
        minimumElevation = Math.min(minimumElevation, look.elevationDeg);
      }
    }
    if (minimumElevation > 1) {
      return { kind: "always-above" };
    }
  }
  const periodMs = orbitalPeriodMs(satrec);
  const stepMs = Math.min(30_000, Math.max(10_000, periodMs / 200));
  const samples: { timeMs: number; elevationDeg: number }[] = [];

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepMs) {
    const look = lookAt(satrec, timeMs, observer);
    if (look) {
      samples.push({ timeMs, elevationDeg: look.elevationDeg });
    }
  }
  const endLook = lookAt(satrec, endMs, observer);
  if (endLook && samples[samples.length - 1]?.timeMs !== endMs) {
    samples.push({ timeMs: endMs, elevationDeg: endLook.elevationDeg });
  }

  if (samples.length === 0) {
    return { kind: "none" };
  }

  const minimumElevation = samples.reduce(
    (minimum, sample) => Math.min(minimum, sample.elevationDeg),
    Number.POSITIVE_INFINITY,
  );
  if (isGeostationary(omm) && minimumElevation > 0) {
    return { kind: "always-above" };
  }

  const passes: PredictedPass[] = [];
  let openAos: number | null = null;
  if (samples[0].elevationDeg > 0) {
    openAos = findHorizonBefore(
      satrec,
      observer,
      samples[0].timeMs,
      samples[0].timeMs - Math.min(periodMs, 6 * 60 * 60 * 1000),
    );
  }

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const wasAbove = previous.elevationDeg > 0;
    const isAbove = current.elevationDeg > 0;
    if (!wasAbove && isAbove) {
      openAos = refineCrossing(satrec, observer, previous.timeMs, current.timeMs, true);
    } else if (wasAbove && !isAbove && openAos !== null) {
      const losMs = refineCrossing(satrec, observer, previous.timeMs, current.timeMs, false);
      const pass = buildPass(satrec, observer, openAos, losMs);
      if (pass && pass.losMs > startMs && pass.aosMs < endMs) {
        passes.push(pass);
      }
      openAos = null;
    }
  }

  if (openAos !== null) {
    const losMs = findHorizonAfter(
      satrec,
      observer,
      endMs,
      endMs + Math.min(periodMs, 6 * 60 * 60 * 1000),
    );
    const pass = buildPass(satrec, observer, openAos, losMs);
    if (pass && pass.losMs > startMs && pass.aosMs < endMs) {
      passes.push(pass);
    }
  }

  passes.sort((left, right) => left.maxElevationMs - right.maxElevationMs);
  return passes.length > 0 ? { kind: "passes", passes } : { kind: "none" };
}
