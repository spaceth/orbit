import type { FutureSatelliteRecord, SatelliteRecord } from "@/types/satellite";

export type SatelliteSortKey = "launchDate" | "type" | "alphabet" | "operator";

export const SATELLITE_SORT_OPTIONS: { value: SatelliteSortKey; label: string }[] = [
  { value: "alphabet", label: "Alphabet" },
  { value: "launchDate", label: "Launch date" },
  { value: "type", label: "Type" },
  { value: "operator", label: "Operator" },
];

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortSatellites(
  satellites: readonly SatelliteRecord[],
  sortBy: SatelliteSortKey,
): SatelliteRecord[] {
  const sorted = [...satellites];

  switch (sortBy) {
    case "launchDate":
      sorted.sort((a, b) => {
        const aTime = a.launchDate ? Date.parse(a.launchDate) : Number.NEGATIVE_INFINITY;
        const bTime = b.launchDate ? Date.parse(b.launchDate) : Number.NEGATIVE_INFINITY;
        return bTime - aTime || compareNames(a.name, b.name);
      });
      break;
    case "type":
      sorted.sort(
        (a, b) => compareNames(a.purpose, b.purpose) || compareNames(a.name, b.name),
      );
      break;
    case "alphabet":
      sorted.sort((a, b) => compareNames(a.name, b.name));
      break;
    case "operator":
      sorted.sort((a, b) => {
        const aOperator = a.operator ?? "";
        const bOperator = b.operator ?? "";
        if (!aOperator && bOperator) {
          return 1;
        }
        if (aOperator && !bOperator) {
          return -1;
        }
        return compareNames(aOperator, bOperator) || compareNames(a.name, b.name);
      });
      break;
  }

  return sorted;
}

export function sortFutureSatellites(
  satellites: readonly FutureSatelliteRecord[],
  sortBy: SatelliteSortKey,
): FutureSatelliteRecord[] {
  const sorted = [...satellites];

  switch (sortBy) {
    case "launchDate":
      sorted.sort((a, b) => {
        const aYear = Number.parseInt(a.launchInfo, 10);
        const bYear = Number.parseInt(b.launchInfo, 10);
        const aValue = Number.isFinite(aYear) ? aYear : Number.NEGATIVE_INFINITY;
        const bValue = Number.isFinite(bYear) ? bYear : Number.NEGATIVE_INFINITY;
        return bValue - aValue || compareNames(a.name, b.name);
      });
      break;
    case "type":
      sorted.sort(
        (a, b) => compareNames(a.purpose, b.purpose) || compareNames(a.name, b.name),
      );
      break;
    case "alphabet":
      sorted.sort((a, b) => compareNames(a.name, b.name));
      break;
    case "operator":
      sorted.sort((a, b) => {
        const aOperator = a.operator ?? "";
        const bOperator = b.operator ?? "";
        if (!aOperator && bOperator) {
          return 1;
        }
        if (aOperator && !bOperator) {
          return -1;
        }
        return compareNames(aOperator, bOperator) || compareNames(a.name, b.name);
      });
      break;
  }

  return sorted;
}
