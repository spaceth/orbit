export interface MySatellite {
  noradId: number;
  name: string;
}

export const MY_SATELLITE_STORAGE_KEY = "orbit-my-satellites";
export const MY_SATELLITE_LIMIT = 50;
const NAME_LIMIT = 80;

/** CelesTrak Alpha-5, with I and O omitted. A = 10 … Z = 33. */
const ALPHA5 = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export type MySatelliteInput =
  | { ok: true; noradId: number }
  | { ok: false };

function decodeCatalogField(field: string): number | null {
  const normalized = field.trim().toUpperCase();
  if (!/^[0-9A-HJ-NP-Z]\d{4}$/.test(normalized)) {
    return null;
  }

  const first = normalized[0];
  const rest = Number.parseInt(normalized.slice(1), 10);
  const prefix =
    first >= "0" && first <= "9"
      ? Number.parseInt(first, 10)
      : ALPHA5.indexOf(first) + 10;

  if (prefix < 0) {
    return null;
  }

  const noradId = prefix * 10000 + rest;
  return noradId >= 1 ? noradId : null;
}

function catalogFromTleLine(line: string): number | null {
  if (line.length < 7) {
    return null;
  }
  return decodeCatalogField(line.slice(2, 7));
}

/** Accept a catalog number, or a two- or three-line element set. */
export function parseNoradOrTle(input: string): MySatelliteInput {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false };
  }

  if (/^[1-9]\d{0,8}$/.test(trimmed)) {
    return { ok: true, noradId: Number(trimmed) };
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const line1 = lines.find((line) => line.startsWith("1 ") && line.length >= 68);
  const line2 = lines.find((line) => line.startsWith("2 ") && line.length >= 68);
  if (!line1 || !line2) {
    return { ok: false };
  }

  const fromLine1 = catalogFromTleLine(line1);
  const fromLine2 = catalogFromTleLine(line2);
  if (fromLine1 === null || fromLine1 !== fromLine2) {
    return { ok: false };
  }

  return { ok: true, noradId: fromLine1 };
}

export function readMySatellites(): MySatellite[] {
  try {
    const raw = localStorage.getItem(MY_SATELLITE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const satellites: MySatellite[] = [];
    const seen = new Set<number>();
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const noradId = (entry as { noradId?: unknown }).noradId;
      const name = (entry as { name?: unknown }).name;
      if (typeof noradId !== "number" || !Number.isInteger(noradId) || noradId < 1) {
        continue;
      }
      if (typeof name !== "string" || seen.has(noradId)) {
        continue;
      }
      const trimmed = name.trim().slice(0, NAME_LIMIT);
      if (!trimmed) {
        continue;
      }
      seen.add(noradId);
      satellites.push({ noradId, name: trimmed });
      if (satellites.length >= MY_SATELLITE_LIMIT) {
        break;
      }
    }
    return satellites;
  } catch {
    return [];
  }
}

export function writeMySatellites(satellites: readonly MySatellite[]) {
  localStorage.setItem(MY_SATELLITE_STORAGE_KEY, JSON.stringify(satellites));
}

let storedSatellites: MySatellite[] = [];
let storageHydrated = false;
const storageListeners = new Set<() => void>();

function hydrateMySatellites() {
  if (storageHydrated || typeof window === "undefined") {
    return;
  }
  storedSatellites = readMySatellites();
  storageHydrated = true;
}

export function subscribeMySatellites(listener: () => void) {
  hydrateMySatellites();
  storageListeners.add(listener);
  return () => {
    storageListeners.delete(listener);
  };
}

export function getMySatellites(): MySatellite[] {
  hydrateMySatellites();
  return storedSatellites;
}

const EMPTY_MY_SATELLITES: MySatellite[] = [];

export function getServerMySatellites(): MySatellite[] {
  return EMPTY_MY_SATELLITES;
}

export function setStoredMySatellites(satellites: readonly MySatellite[]) {
  storedSatellites = satellites.slice();
  if (typeof window !== "undefined") {
    writeMySatellites(storedSatellites);
  }
  for (const listener of storageListeners) {
    listener();
  }
}

export function normalizeMySatelliteName(name: string): string | null {
  const trimmed = name.trim().slice(0, NAME_LIMIT);
  return trimmed.length > 0 ? trimmed : null;
}
