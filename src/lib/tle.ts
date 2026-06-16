import type { TleData } from "@/types/satellite";

const TLE_API_BASE = "https://tle.ivanstanojevic.me/api/tle";

interface TleApiResponse {
  satelliteId: number;
  name: string;
  line1: string;
  line2: string;
  date: string;
}

export async function fetchTleFromApi(noradId: number): Promise<TleData> {
  const response = await fetch(`${TLE_API_BASE}/${noradId}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TLE fetch failed with status ${response.status}`);
  }

  const data = (await response.json()) as TleApiResponse;

  return {
    noradId: data.satelliteId,
    name: data.name,
    line1: data.line1,
    line2: data.line2,
    date: data.date,
  };
}
