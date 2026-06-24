"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SATELLITES, getSatelliteByNoradId } from "@/lib/satellites";
import { getAllFallbackTles, getFallbackTle } from "@/lib/tle-fallback";
import { getFutureSatelliteById } from "@/lib/future-satellites";
import type { SatelliteTelemetry, TleData } from "@/types/satellite";

async function fetchTleForSatellite(noradId: number): Promise<TleData | null> {
  try {
    const response = await fetch(`/api/tle/${noradId}`);
    if (response.ok) {
      return (await response.json()) as TleData;
    }
  } catch {
    // Fall through to bundled fallback below.
  }

  return getFallbackTle(noradId) ?? null;
}

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
  const [loadAttempt, setLoadAttempt] = useState(0);

  const retryLoadTles = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTles() {
      setLoading(true);
      setLoadError(false);

      try {
        const results = await Promise.all(
          SATELLITES.map((satellite) => fetchTleForSatellite(satellite.noradId)),
        );

        const data = results.filter((value): value is TleData => value !== null);

        if (!cancelled) {
          if (data.length === 0) {
            const fallbackTles = getAllFallbackTles();
            if (fallbackTles.length > 0) {
              setTles(fallbackTles);
              return;
            }
            setTles([]);
            setLoadError(true);
            return;
          }
          setTles(data);
        }
      } catch {
        if (!cancelled) {
          const fallbackTles = getAllFallbackTles();
          if (fallbackTles.length > 0) {
            setTles(fallbackTles);
          } else {
            setTles([]);
            setLoadError(true);
          }
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
  }, [loadAttempt]);

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
    retryLoadTles,
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
