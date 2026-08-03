"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SATELLITES, getSatelliteByNoradId } from "@/lib/satellites";
import { getAllFallbackOmms, getFallbackOmm } from "@/lib/omm-fallback";
import { getFutureSatelliteById } from "@/lib/future-satellites";
import { getLegacySatelliteById } from "@/lib/legacy-satellites";
import type { OmmData, SatelliteTelemetry } from "@/types/satellite";

async function fetchOmmForSatellite(noradId: number): Promise<OmmData | null> {
  try {
    const response = await fetch(`/api/omm/${noradId}`);
    if (response.ok) {
      return (await response.json()) as OmmData;
    }
  } catch {
    // Fall through to bundled fallback below.
  }

  return getFallbackOmm(noradId) ?? null;
}

export function useSatellites() {
  const [omms, setOmms] = useState<OmmData[]>([]);
  const [telemetryById, setTelemetryById] = useState<Record<number, SatelliteTelemetry>>({});
  const [activeNoradId, setActiveNoradId] = useState<number | null>(null);
  const [activeLegacyId, setActiveLegacyId] = useState<string | null>(null);
  const [activeFutureId, setActiveFutureId] = useState<string | null>(null);
  const [hoverNoradId, setHoverNoradId] = useState<number | null>(null);
  const [hoverLegacyId, setHoverLegacyId] = useState<string | null>(null);
  const [hoverFutureId, setHoverFutureId] = useState<string | null>(null);
  const [hiddenNoradIds, setHiddenNoradIds] = useState<ReadonlySet<number>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const retryLoadOmms = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOmms() {
      setLoading(true);
      setLoadError(false);

      try {
        const results = await Promise.all(
          SATELLITES.map((satellite) => fetchOmmForSatellite(satellite.noradId)),
        );

        const data = results.filter((value): value is OmmData => value !== null);

        if (!cancelled) {
          if (data.length === 0) {
            const fallbackOmms = getAllFallbackOmms();
            if (fallbackOmms.length > 0) {
              setOmms(fallbackOmms);
              return;
            }
            setOmms([]);
            setLoadError(true);
            return;
          }
          setOmms(data);
        }
      } catch {
        if (!cancelled) {
          const fallbackOmms = getAllFallbackOmms();
          if (fallbackOmms.length > 0) {
            setOmms(fallbackOmms);
          } else {
            setOmms([]);
            setLoadError(true);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOmms();

    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const deselect = useCallback(() => {
    setActiveNoradId(null);
    setActiveLegacyId(null);
    setActiveFutureId(null);
    setHoverNoradId(null);
    setHoverLegacyId(null);
    setHoverFutureId(null);
  }, []);

  const selectNoradId = useCallback((noradId: number) => {
    setActiveLegacyId(null);
    setActiveFutureId(null);
    setHoverLegacyId(null);
    setHoverFutureId(null);
    setActiveNoradId(noradId);
  }, []);

  const selectLegacyId = useCallback((id: string) => {
    setActiveNoradId(null);
    setActiveFutureId(null);
    setHoverNoradId(null);
    setHoverFutureId(null);
    setActiveLegacyId(id);
  }, []);

  const selectFutureId = useCallback((id: string) => {
    setActiveNoradId(null);
    setActiveLegacyId(null);
    setHoverNoradId(null);
    setHoverLegacyId(null);
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

  const activeOmm = useMemo(
    () =>
      activeNoradId === null
        ? null
        : (omms.find((omm) => omm.noradId === activeNoradId) ?? null),
    [omms, activeNoradId],
  );

  const activeTelemetry = useMemo(
    () => (activeNoradId === null ? null : (telemetryById[activeNoradId] ?? null)),
    [activeNoradId, telemetryById],
  );

  const activeLegacySatellite = useMemo(
    () => (activeLegacyId === null ? null : (getLegacySatelliteById(activeLegacyId) ?? null)),
    [activeLegacyId],
  );

  const activeFutureSatellite = useMemo(
    () => (activeFutureId === null ? null : (getFutureSatelliteById(activeFutureId) ?? null)),
    [activeFutureId],
  );

  const availableNoradIds = useMemo(() => omms.map((omm) => omm.noradId), [omms]);

  return {
    omms,
    loading,
    loadError,
    retryLoadOmms,
    activeNoradId,
    activeLegacyId,
    activeFutureId,
    hoverNoradId,
    hoverLegacyId,
    hoverFutureId,
    highlightedNoradId,
    activeSatellite,
    activeLegacySatellite,
    activeFutureSatellite,
    activeOmm,
    activeTelemetry,
    availableNoradIds,
    hiddenNoradIds,
    selectNoradId,
    selectLegacyId,
    selectFutureId,
    setHoverNoradId,
    setHoverLegacyId,
    setHoverFutureId,
    deselect,
    updateTelemetry,
    toggleVisibility,
  };
}
