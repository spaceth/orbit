import type { Locale } from "@/lib/localization";

/** How far the timeline can move from the present, in either direction. */
export const PREDICTION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/** Real-time, then faster steps so a low-Earth orbit is visible within seconds. */
export const SIMULATION_RATES = [1, 10, 60, 300, 1000] as const;

export interface SimulationClock {
  anchorRealMs: number;
  anchorSimMs: number;
  rate: number;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();
const clockFormatters = new Map<Locale, Intl.DateTimeFormat>();

export function clampSimulationOffset(offsetMs: number): number {
  if (offsetMs > PREDICTION_WINDOW_MS) {
    return PREDICTION_WINDOW_MS;
  }
  if (offsetMs < -PREDICTION_WINDOW_MS) {
    return -PREDICTION_WINDOW_MS;
  }
  return offsetMs;
}

export function createSimulationClock(realNow = Date.now()): SimulationClock {
  return { anchorRealMs: realNow, anchorSimMs: realNow, rate: 1 };
}

/** Simulation time, parked at the ±3 day edges so a fast rate cannot run past them. */
export function readSimulationMs(clock: SimulationClock, realNow = Date.now()): number {
  const elapsed = realNow - clock.anchorRealMs;
  let simMs = clock.anchorSimMs + elapsed * clock.rate;
  const min = realNow - PREDICTION_WINDOW_MS;
  const max = realNow + PREDICTION_WINDOW_MS;
  if (simMs < min || simMs > max) {
    simMs = simMs < min ? min : max;
    clock.anchorRealMs = realNow;
    clock.anchorSimMs = simMs;
  }
  return simMs;
}

export function seekSimulationClock(
  clock: SimulationClock,
  offsetMs: number,
  realNow = Date.now(),
) {
  clock.anchorRealMs = realNow;
  clock.anchorSimMs = realNow + clampSimulationOffset(offsetMs);
}

export function setSimulationRate(clock: SimulationClock, rate: number, realNow = Date.now()) {
  const simMs = readSimulationMs(clock, realNow);
  clock.anchorRealMs = realNow;
  clock.anchorSimMs = simMs;
  clock.rate = rate;
}

export function resetSimulationClock(clock: SimulationClock, realNow = Date.now()) {
  clock.anchorRealMs = realNow;
  clock.anchorSimMs = realNow;
  clock.rate = 1;
}

export function stepSimulationRate(rate: number, direction: -1 | 1): number {
  const index = SIMULATION_RATES.indexOf(rate as (typeof SIMULATION_RATES)[number]);
  const next = Math.min(SIMULATION_RATES.length - 1, Math.max(0, (index < 0 ? 0 : index) + direction));
  return SIMULATION_RATES[next];
}

export function formatSimulationDate(date: Date, locale: Locale): string {
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short",
    });
    dateFormatters.set(locale, formatter);
  }
  return formatter.format(date);
}

export function formatSimulationClock(date: Date, locale: Locale): string {
  let formatter = clockFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    clockFormatters.set(locale, formatter);
  }
  return formatter.format(date);
}

export interface OffsetParts {
  days: number;
  hours: number;
  minutes: number;
  ahead: boolean;
}

/** Rounded offset for the label. Null when the simulation is on the present. */
export function getOffsetParts(offsetMs: number): OffsetParts | null {
  if (offsetMs === 0) {
    return null;
  }

  const totalMinutes = Math.max(1, Math.round(Math.abs(offsetMs) / MINUTE_MS));
  return {
    days: Math.floor(totalMinutes / (24 * 60)),
    hours: Math.floor((totalMinutes % (24 * 60)) / 60),
    minutes: totalMinutes % 60,
    ahead: offsetMs > 0,
  };
}

export function offsetFromPointer(clientX: number, rect: DOMRect): number {
  const span = rect.width || 1;
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / span));
  return clampSimulationOffset((ratio * 2 - 1) * PREDICTION_WINDOW_MS);
}

export function thumbRatio(offsetMs: number): number {
  return (clampSimulationOffset(offsetMs) / PREDICTION_WINDOW_MS + 1) / 2;
}

export const TIMELINE_HOUR_STEP_MS = HOUR_MS;
export const TIMELINE_DAY_STEP_MS = DAY_MS;
