#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** Keep in sync with `src/data/satellites.ts`. */
const NORAD_IDS = [58016, 67683, 33396, 28786, 39500, 40141, 41552, 48963];

const TLE_API_BASE = "https://tle.ivanstanojevic.me/api/tle";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(root, "src/data/tle-fallback.json");

async function fetchTle(noradId) {
  const response = await fetch(`${TLE_API_BASE}/${noradId}`);
  if (!response.ok) {
    throw new Error(`TLE fetch failed for ${noradId} (${response.status})`);
  }

  const data = await response.json();
  return {
    noradId: data.satelliteId,
    name: data.name,
    line1: data.line1,
    line2: data.line2,
    date: data.date,
  };
}

const tles = await Promise.all(NORAD_IDS.map((noradId) => fetchTle(noradId)));

const payload = {
  updatedAt: new Date().toISOString(),
  tles,
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${tles.length} fallback TLEs to ${outputPath}`);
