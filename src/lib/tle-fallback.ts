import fallbackData from "@/data/tle-fallback.json";
import type { TleData } from "@/types/satellite";

export const TLE_FALLBACK_UPDATED_AT = fallbackData.updatedAt;

const fallbackByNoradId = new Map<number, TleData>(
  fallbackData.tles.map((tle) => [tle.noradId, tle as TleData]),
);

export function getFallbackTle(noradId: number): TleData | undefined {
  return fallbackByNoradId.get(noradId);
}

export function getAllFallbackTles(): TleData[] {
  return [...fallbackData.tles] as TleData[];
}
