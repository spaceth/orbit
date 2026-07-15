"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { resolveSatelliteRoute } from "@/lib/satellite-routes";

function cleanDeepLinkUrl() {
  if (typeof window === "undefined") {
    return;
  }
  if (window.location.pathname === "/") {
    return;
  }
  window.history.replaceState(null, "", "/");
}

/**
 * Applies a satellite deep-link from the URL once (e.g. /theos-2), then cleans
 * the address bar to `/` without a Next.js navigation so the globe stays mounted.
 * In-app focus is client state only — this hook does not update the URL on select.
 */
export function useSatelliteRouteSync({
  loading,
  availableNoradIds,
  selectNoradId,
  selectFutureId,
  onFocusSatellite,
}: {
  loading: boolean;
  availableNoradIds: number[];
  selectNoradId: (noradId: number) => void;
  selectFutureId: (id: string) => void;
  onFocusSatellite: () => void;
}) {
  const pathname = usePathname();
  const satelliteIdFromPath = pathname === "/" ? null : pathname.replace(/^\//, "");
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    if (deepLinkHandled.current) {
      return;
    }

    if (!satelliteIdFromPath) {
      deepLinkHandled.current = true;
      return;
    }

    const route = resolveSatelliteRoute(satelliteIdFromPath);
    if (!route) {
      deepLinkHandled.current = true;
      return;
    }

    if (route.type === "future") {
      onFocusSatellite();
      selectFutureId(route.id);
      cleanDeepLinkUrl();
      deepLinkHandled.current = true;
      return;
    }

    if (loading) {
      return;
    }

    if (!availableNoradIds.includes(route.noradId)) {
      deepLinkHandled.current = true;
      cleanDeepLinkUrl();
      return;
    }

    onFocusSatellite();
    selectNoradId(route.noradId);
    cleanDeepLinkUrl();
    deepLinkHandled.current = true;
  }, [
    satelliteIdFromPath,
    loading,
    availableNoradIds,
    selectNoradId,
    selectFutureId,
    onFocusSatellite,
  ]);
}
