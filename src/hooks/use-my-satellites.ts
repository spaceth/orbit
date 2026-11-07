"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  MY_SATELLITE_LIMIT,
  getMySatellites,
  getServerMySatellites,
  normalizeMySatelliteName,
  parseNoradOrTle,
  setStoredMySatellites,
  subscribeMySatellites,
} from "@/lib/my-satellites";
import type { OmmData } from "@/types/satellite";

export type AddMySatelliteResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "notFound" | "unavailable" | "limit" };

async function fetchOmm(noradId: number): Promise<OmmData | "missing" | "unavailable"> {
  try {
    const response = await fetch(`/api/omm/${noradId}`);
    if (response.status === 503) {
      return "unavailable";
    }
    if (!response.ok) {
      return "missing";
    }
    const omm = (await response.json()) as OmmData;
    if (!omm || omm.noradId !== noradId || typeof omm.name !== "string") {
      return "missing";
    }
    return omm;
  } catch {
    return "unavailable";
  }
}

export function useMySatellites() {
  const satellites = useSyncExternalStore(
    subscribeMySatellites,
    getMySatellites,
    getServerMySatellites,
  );
  const [omms, setOmms] = useState<OmmData[]>([]);
  const [failedNoradIds, setFailedNoradIds] = useState<ReadonlySet<number>>(() => new Set());
  const [adding, setAdding] = useState(false);
  const [activeNoradId, setActiveNoradId] = useState<number | null>(null);
  const [hoverNoradId, setHoverNoradId] = useState<number | null>(null);
  const ommsRef = useRef<OmmData[]>([]);
  const noradKey = satellites.map((satellite) => satellite.noradId).join(",");

  useEffect(() => {
    const ids = noradKey.length === 0 ? [] : noradKey.split(",").map((id) => Number(id));
    let cancelled = false;

    async function load() {
      const results = await Promise.all(
        ids.map(async (noradId) => ({ noradId, result: await fetchOmm(noradId) })),
      );
      if (cancelled) {
        return;
      }

      const previous = new Map(ommsRef.current.map((omm) => [omm.noradId, omm]));
      const next: OmmData[] = [];
      const failed = new Set<number>();

      for (const { noradId, result } of results) {
        if (result !== "missing" && result !== "unavailable") {
          next.push(result);
          continue;
        }
        const kept = previous.get(noradId);
        if (kept) {
          next.push(kept);
        } else {
          failed.add(noradId);
        }
      }

      ommsRef.current = next;
      setOmms(next);
      setFailedNoradIds(failed);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [noradKey]);

  const deselect = useCallback(() => {
    setActiveNoradId(null);
    setHoverNoradId(null);
  }, []);

  const selectNoradId = useCallback((noradId: number) => {
    setActiveNoradId(noradId);
  }, []);

  const addSatellite = useCallback(
    async (input: string): Promise<AddMySatelliteResult> => {
      const parsed = parseNoradOrTle(input);
      if (!parsed.ok) {
        return { ok: false, reason: "invalid" };
      }

      const current = getMySatellites();
      if (current.some((satellite) => satellite.noradId === parsed.noradId)) {
        setActiveNoradId(parsed.noradId);
        return { ok: true };
      }

      if (current.length >= MY_SATELLITE_LIMIT) {
        return { ok: false, reason: "limit" };
      }

      setAdding(true);
      try {
        const result = await fetchOmm(parsed.noradId);
        if (result === "missing") {
          return { ok: false, reason: "notFound" };
        }
        if (result === "unavailable") {
          return { ok: false, reason: "unavailable" };
        }

        const name = normalizeMySatelliteName(result.name) ?? `NORAD ${result.noradId}`;
        const latest = getMySatellites();
        if (!latest.some((satellite) => satellite.noradId === result.noradId)) {
          setStoredMySatellites([...latest, { noradId: result.noradId, name }]);
        }
        const nextOmms = [
          ...ommsRef.current.filter((omm) => omm.noradId !== result.noradId),
          result,
        ];
        ommsRef.current = nextOmms;
        setOmms(nextOmms);
        setFailedNoradIds((failed) => {
          if (!failed.has(result.noradId)) {
            return failed;
          }
          const next = new Set(failed);
          next.delete(result.noradId);
          return next;
        });
        setActiveNoradId(result.noradId);
        return { ok: true };
      } finally {
        setAdding(false);
      }
    },
    [],
  );

  const renameSatellite = useCallback((noradId: number, name: string) => {
    const nextName = normalizeMySatelliteName(name);
    if (!nextName) {
      return;
    }
    setStoredMySatellites(
      getMySatellites().map((satellite) =>
        satellite.noradId === noradId ? { ...satellite, name: nextName } : satellite,
      ),
    );
  }, []);

  const removeSatellite = useCallback((noradId: number) => {
    setStoredMySatellites(getMySatellites().filter((satellite) => satellite.noradId !== noradId));
    const nextOmms = ommsRef.current.filter((omm) => omm.noradId !== noradId);
    ommsRef.current = nextOmms;
    setOmms(nextOmms);
    setFailedNoradIds((failed) => {
      if (!failed.has(noradId)) {
        return failed;
      }
      const next = new Set(failed);
      next.delete(noradId);
      return next;
    });
    setActiveNoradId((current) => (current === noradId ? null : current));
    setHoverNoradId((current) => (current === noradId ? null : current));
  }, []);

  return {
    satellites,
    omms,
    failedNoradIds,
    adding,
    activeNoradId,
    hoverNoradId,
    setHoverNoradId,
    selectNoradId,
    deselect,
    addSatellite,
    renameSatellite,
    removeSatellite,
  };
}
