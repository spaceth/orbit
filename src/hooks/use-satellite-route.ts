"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { resolveSatelliteRoute } from "@/lib/satellite-routes";
import { getSatelliteByNoradId } from "@/lib/satellites";

export function useSatelliteRouteSync({
  loading,
  availableNoradIds,
  activeNoradId,
  activeFutureId,
  selectNoradId,
  selectFutureId,
  deselect,
  onFocusSatellite,
  onClearFocus,
}: {
  loading: boolean;
  availableNoradIds: number[];
  activeNoradId: number | null;
  activeFutureId: string | null;
  selectNoradId: (noradId: number) => void;
  selectFutureId: (id: string) => void;
  deselect: () => void;
  onFocusSatellite: () => void;
  onClearFocus: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const satelliteIdFromPath = pathname === "/" ? null : pathname.replace(/^\//, "");

  useEffect(() => {
    if (!satelliteIdFromPath) {
      if (activeNoradId !== null || activeFutureId !== null) {
        onClearFocus();
        deselect();
      }
      return;
    }

    const route = resolveSatelliteRoute(satelliteIdFromPath);
    if (!route) {
      return;
    }

    if (route.type === "future") {
      if (activeFutureId !== route.id) {
        onFocusSatellite();
        selectFutureId(route.id);
      }
      return;
    }

    if (loading) {
      return;
    }

    if (!availableNoradIds.includes(route.noradId)) {
      return;
    }

    if (activeNoradId !== route.noradId) {
      onFocusSatellite();
      selectNoradId(route.noradId);
    }
  }, [
    satelliteIdFromPath,
    loading,
    availableNoradIds,
    activeNoradId,
    activeFutureId,
    selectNoradId,
    selectFutureId,
    deselect,
    onFocusSatellite,
    onClearFocus,
  ]);

  const navigateToNoradId = useCallback(
    (noradId: number) => {
      const satellite = getSatelliteByNoradId(noradId);
      if (!satellite) {
        return;
      }
      router.replace(`/${satellite.id}`, { scroll: false });
    },
    [router],
  );

  const navigateToFutureId = useCallback(
    (id: string) => {
      router.replace(`/${id}`, { scroll: false });
    },
    [router],
  );

  const navigateHome = useCallback(() => {
    router.replace("/", { scroll: false });
  }, [router]);

  return {
    satelliteIdFromPath,
    navigateToNoradId,
    navigateToFutureId,
    navigateHome,
  };
}
