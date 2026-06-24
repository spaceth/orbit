"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SATELLITES, getSatelliteByNoradId } from "@/lib/satellites";
import { getFutureSatelliteById } from "@/lib/future-satellites";
import type { SatelliteTelemetry, TleData } from "@/types/satellite";

export function useSatellites() {
  const [tles, setTles] = useState<TleData[]>([]);
  const [telemetryById, setTelemetryById] = useState<Record<number, SatelliteTelemetry>>({});
  const [activeNoradId, setActiveNoradId] = useState<number | null>(null);
  const [activeFutureId, setActiveFutureId] = useState<string | null>(null);
  const [hoverNoradId, setHoverNoradId] = useState<number | null>(null);
  const [hoverFutureId, setHoverFutureId] = useState<string | null>(null);
  const [hiddenNoradIds, setHiddenNoradIds] = useState<ReadonlySet<number>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTles() {
      setLoading(true);
      setLoadError(false);

      try {
        const results = await Promise.all(
          SATELLITES.map(async (satellite) => {
            const response = await fetch(`/api/tle/${satellite.noradId}`);
            if (!response.ok) {
              return null;
            }
            return (await response.json()) as TleData;
          }),
        );

        const data = results.filter((value): value is TleData => value !== null);

        if (!cancelled) {
          if (data.length === 0) {
            throw new Error("No TLE data available");
          }
          setTles(data);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTles();

    return () => {
      cancelled = true;
    };
  }, []);

  const deselect = useCallback(() => {
    setActiveNoradId(null);
    setActiveFutureId(null);
    setHoverNoradId(null);
    setHoverFutureId(null);
  }, []);

  const selectNoradId = useCallback((noradId: number) => {
    setActiveFutureId(null);
    setActiveNoradId(noradId);
  }, []);

  const selectFutureId = useCallback((id: string) => {
    setActiveNoradId(null);
    setHoverNoradId(null);
    setActiveFutureId(id);
  }, []);

  const updateTelemetry = useCallback((noradId: number, telemetry: SatelliteTelemetry) => {
    setTelemetryById((current) => ({ ...current, [noradId]: telemetry }));
  }, []);

  const toggleVisibility = useCallback((noradId: number) => {
    setHiddenNoradIds((current) => {
      const next = new Set(current);
      if (next.has(noradId)) {
        next.delete(noradId);
      } else {
        next.add(noradId);
        setActiveNoradId((active) => (active === noradId ? null : active));
        setHoverNoradId((hover) => (hover === noradId ? null : hover));
      }
      return next;
    });
  }, []);

  const highlightedNoradId = hoverNoradId ?? activeNoradId;

  const activeSatellite = useMemo(
    () => (activeNoradId === null ? null : (getSatelliteByNoradId(activeNoradId) ?? null)),
    [activeNoradId],
  );

  const activeTle = useMemo(
    () =>
      activeNoradId === null
        ? null
        : (tles.find((tle) => tle.noradId === activeNoradId) ?? null),
    [tles, activeNoradId],
  );

  const activeTelemetry = useMemo(
    () => (activeNoradId === null ? null : (telemetryById[activeNoradId] ?? null)),
    [activeNoradId, telemetryById],
  );

  const activeFutureSatellite = useMemo(
    () => (activeFutureId === null ? null : (getFutureSatelliteById(activeFutureId) ?? null)),
    [activeFutureId],
  );

  const availableNoradIds = useMemo(() => tles.map((tle) => tle.noradId), [tles]);

  return {
    tles,
    loading,
    loadError,
    activeNoradId,
    activeFutureId,
    hoverNoradId,
    hoverFutureId,
    highlightedNoradId,
    activeSatellite,
    activeFutureSatellite,
    activeTle,
    activeTelemetry,
    availableNoradIds,
    hiddenNoradIds,
    selectNoradId,
    selectFutureId,
    setHoverNoradId,
    setHoverFutureId,
    deselect,
    updateTelemetry,
    toggleVisibility,
  };
}
