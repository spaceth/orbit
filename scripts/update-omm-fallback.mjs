#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** Keep in sync with `src/data/satellites.ts`. */
const NORAD_IDS = [58016, 100466, 67683, 33396, 28786, 39500, 40141, 41552];

const CELESTRAK_GP_URL = "https://celestrak.org/NORAD/elements/gp.php";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(root, "src/data/omm-fallback.json");

function toNumber(value) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric OMM field: ${value}`);
  }
  return parsed;
}

function normalizeOmm(raw) {
  return {
    noradId: toNumber(raw.NORAD_CAT_ID),
    name: raw.OBJECT_NAME,
    objectId:
      typeof raw.OBJECT_ID === "string" && raw.OBJECT_ID.length > 0
        ? raw.OBJECT_ID
        : undefined,
    epoch: raw.EPOCH,
    meanMotion: toNumber(raw.MEAN_MOTION),
    eccentricity: toNumber(raw.ECCENTRICITY),
    inclination: toNumber(raw.INCLINATION),
    raOfAscNode: toNumber(raw.RA_OF_ASC_NODE),
    argOfPericenter: toNumber(raw.ARG_OF_PERICENTER),
    meanAnomaly: toNumber(raw.MEAN_ANOMALY),
    bstar: toNumber(raw.BSTAR),
    meanMotionDot: toNumber(raw.MEAN_MOTION_DOT),
    meanMotionDdot: toNumber(raw.MEAN_MOTION_DDOT),
    ephemerisType: toNumber(raw.EPHEMERIS_TYPE ?? 0),
    classificationType: raw.CLASSIFICATION_TYPE ?? "U",
    elementSetNo: toNumber(raw.ELEMENT_SET_NO),
    revAtEpoch: toNumber(raw.REV_AT_EPOCH ?? 0),
  };
}

async function fetchOmm(noradId) {
  const response = await fetch(
    `${CELESTRAK_GP_URL}?CATNR=${noradId}&FORMAT=json`,
  );
  if (!response.ok) {
    throw new Error(`OMM fetch failed for ${noradId} (${response.status})`);
  }

  const data = await response.json();
  if (typeof data === "string") {
    throw new Error(`OMM fetch failed for ${noradId}: ${data}`);
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record || typeof record !== "object" || !("NORAD_CAT_ID" in record)) {
    throw new Error(`OMM fetch returned no elements for NORAD ${noradId}`);
  }

  return normalizeOmm(record);
}

const omms = await Promise.all(NORAD_IDS.map((noradId) => fetchOmm(noradId)));

const payload = {
  updatedAt: new Date().toISOString(),
  omms,
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${omms.length} fallback OMMs to ${outputPath}`);
