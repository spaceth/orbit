import { useSyncExternalStore } from "react";

import cities from "@/data/cities.json";

export type PlaceGroupId = "city" | "narit" | "gistda" | "dark-sky";

export interface City {
  id: string;
  group: PlaceGroupId;
  name: { en: string; th: string };
  lat: number;
  lon: number;
}

export const CITIES = cities as readonly City[];

export function placeGroups(): { id: PlaceGroupId; places: City[] }[] {
  const groups: { id: PlaceGroupId; places: City[] }[] = [];
  for (const place of CITIES) {
    const existing = groups.find((group) => group.id === place.group);
    if (existing) {
      existing.places.push(place);
    } else {
      groups.push({ id: place.group, places: [place] });
    }
  }
  return groups;
}

export interface ObserverLocation {
  lat: number;
  lon: number;
  cityId: string | null;
  nonce: number;
}

const STORAGE_KEY = "orbit-ground-location";

const DEFAULT_OBSERVER: ObserverLocation = {
  lat: CITIES[0]?.lat ?? 13.75398,
  lon: CITIES[0]?.lon ?? 100.50144,
  cityId: CITIES[0]?.id ?? null,
  nonce: 0,
};

let current = DEFAULT_OBSERVER;
let hydrated = false;
let autoLocateAttempted = false;
const listeners = new Set<() => void>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readStored(): ObserverLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as {
      lat?: unknown;
      lon?: unknown;
      cityId?: unknown;
    };
    if (typeof parsed.lat !== "number" || typeof parsed.lon !== "number") {
      return null;
    }
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lon)) {
      return null;
    }
    const cityId = typeof parsed.cityId === "string" ? parsed.cityId : null;
    const knownCity = cityId ? CITIES.find((city) => city.id === cityId) : undefined;
    return {
      lat: knownCity ? knownCity.lat : clamp(parsed.lat, -90, 90),
      lon: knownCity ? knownCity.lon : clamp(parsed.lon, -180, 180),
      cityId: knownCity ? knownCity.id : null,
      nonce: 1,
    };
  } catch {
    return null;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") {
    return;
  }
  hydrated = true;
  const stored = readStored();
  if (stored) {
    current = stored;
  }
}

function hasStoredObserver(): boolean {
  hydrate();
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function remember(next: ObserverLocation) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat: next.lat, lon: next.lon, cityId: next.cityId }),
    );
  } catch {
    // Private browsing can reject storage. The view still uses the choice.
  }
}

export function subscribeObserver(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getObserver(): ObserverLocation {
  hydrate();
  return current;
}

export function getServerObserver(): ObserverLocation {
  return DEFAULT_OBSERVER;
}

export function setObserverLocation(next: ObserverLocation) {
  current = next;
  remember(next);
  emit();
}

export function shouldAutoLocate(): boolean {
  return !autoLocateAttempted && !hasStoredObserver();
}

export function markAutoLocateAttempted() {
  autoLocateAttempted = true;
}

export function useObserverLocation(): ObserverLocation {
  return useSyncExternalStore(subscribeObserver, getObserver, getServerObserver);
}
