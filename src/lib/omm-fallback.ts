import fallbackData from "@/data/omm-fallback.json";
import type { OmmData } from "@/types/satellite";

export const OMM_FALLBACK_UPDATED_AT = fallbackData.updatedAt;

const fallbackByNoradId = new Map<number, OmmData>(
  fallbackData.omms.map((omm) => [omm.noradId, omm as OmmData]),
);

export function getFallbackOmm(noradId: number): OmmData | undefined {
  return fallbackByNoradId.get(noradId);
}

export function getAllFallbackOmms(): OmmData[] {
  return [...fallbackData.omms] as OmmData[];
}
