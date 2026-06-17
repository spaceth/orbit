"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { SatellitePanel } from "@/components/satellite-panel";
import { SiteFooter } from "@/components/site-footer";
import { SpaceTHLogo } from "@/components/spaceth-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSatellites } from "@/hooks/use-satellites";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { FUTURE_SATELLITES } from "@/lib/future-satellites";
import { SATELLITES } from "@/lib/satellites";

const GlobeScene = dynamic(
  () => import("@/components/globe/globe-scene").then((mod) => mod.GlobeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted">
        Loading globe…
      </div>
    ),
  },
);

export function OrbitViewer() {
  const themeColors = useThemeColors();
  const [mobileReadingMode, setMobileReadingMode] = useState(false);
  const handleMobileReadingModeChange = useCallback((readingMode: boolean) => {
    setMobileReadingMode(readingMode);
  }, []);
  const {
    tles,
    loading,
    error,
    activeNoradId,
    activeFutureId,
    highlightedNoradId,
    hoverFutureId,
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
  } = useSatellites();

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground transition-colors">
      <SpaceTHLogo />
      <ThemeToggle />
      <div className="satellite-shell max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-20 sm:contents">
        <SiteFooter />
        <SatellitePanel
          satellites={SATELLITES}
          futureSatellites={FUTURE_SATELLITES}
          availableNoradIds={availableNoradIds}
          hiddenNoradIds={hiddenNoradIds}
          activeNoradId={activeNoradId}
          activeFutureId={activeFutureId}
          highlightedNoradId={highlightedNoradId}
          hoverFutureId={hoverFutureId}
          activeSatellite={activeSatellite}
          activeFutureSatellite={activeFutureSatellite}
          activeTle={activeTle}
          activeTelemetry={activeTelemetry}
          onSelectNoradId={selectNoradId}
          onSelectFutureId={selectFutureId}
          onHoverNoradId={setHoverNoradId}
          onHoverFutureId={setHoverFutureId}
          onToggleVisibility={toggleVisibility}
          onMobileReadingModeChange={handleMobileReadingModeChange}
          loading={loading}
          error={error}
        />
      </div>
      <div className="absolute inset-0">
        {tles.length > 0 ? (
          <GlobeScene
            tles={tles}
            themeColors={themeColors}
            hiddenNoradIds={hiddenNoradIds}
            activeNoradId={activeNoradId}
            highlightedNoradId={highlightedNoradId}
            mobileReadingMode={mobileReadingMode}
            onSelectNoradId={selectNoradId}
            onHoverNoradId={setHoverNoradId}
            onDeselect={deselect}
            onTelemetryUpdate={updateTelemetry}
          />
        ) : null}
      </div>
    </div>
  );
}
