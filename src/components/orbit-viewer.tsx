"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { AppToggles } from "@/components/app-toggles";
import { GlobeLoading } from "@/components/globe-loading";
import { SatellitePanel } from "@/components/satellite-panel";
import { SiteFooter } from "@/components/site-footer";
import { SpaceTHLogo } from "@/components/spaceth-logo";
import { useSatellites } from "@/hooks/use-satellites";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { FUTURE_SATELLITES } from "@/lib/future-satellites";
import { SATELLITES } from "@/lib/satellites";

const GlobeScene = dynamic(
  () => import("@/components/globe/globe-scene").then((mod) => mod.GlobeScene),
  {
    ssr: false,
    loading: () => <GlobeLoading />,
  },
);

export function OrbitViewer() {
  const themeColors = useThemeColors();
  const [mobileReadingMode, setMobileReadingMode] = useState(false);
  const [earthFocused, setEarthFocused] = useState(false);
  const [earthFocusRequest, setEarthFocusRequest] = useState(0);
  const handleMobileReadingModeChange = useCallback((readingMode: boolean) => {
    setMobileReadingMode(readingMode);
  }, []);
  const focusEarth = useCallback(() => {
    setEarthFocused(true);
    setEarthFocusRequest((request) => request + 1);
  }, []);
  const {
    tles,
    loading,
    loadError,
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

  const handleSelectNoradId = useCallback(
    (noradId: number) => {
      setEarthFocused(false);
      selectNoradId(noradId);
    },
    [selectNoradId],
  );

  const handleSelectFutureId = useCallback(
    (id: string) => {
      setEarthFocused(false);
      selectFutureId(id);
    },
    [selectFutureId],
  );

  const handleEarthDoubleClick = useCallback(() => {
    deselect();
    focusEarth();
  }, [deselect, focusEarth]);

  const handleDeselect = useCallback(() => {
    setEarthFocused(false);
    deselect();
  }, [deselect]);

  return (
    <div className="relative h-full min-h-dvh w-full overflow-hidden bg-background text-foreground transition-colors">
      <SpaceTHLogo />
      <AppToggles />
      <div className="satellite-shell max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-20 max-sm:bg-white max-sm:pb-[env(safe-area-inset-bottom)] max-sm:dark:bg-black sm:contents">
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
          onSelectNoradId={handleSelectNoradId}
          onSelectFutureId={handleSelectFutureId}
          onHoverNoradId={setHoverNoradId}
          onHoverFutureId={setHoverFutureId}
          onToggleVisibility={toggleVisibility}
          onMobileReadingModeChange={handleMobileReadingModeChange}
          loading={loading}
          loadError={loadError}
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
            onSelectNoradId={handleSelectNoradId}
            onHoverNoradId={setHoverNoradId}
            onEarthDoubleClick={handleEarthDoubleClick}
            onDeselect={handleDeselect}
            earthFocused={earthFocused}
            earthFocusRequest={earthFocusRequest}
            onTelemetryUpdate={updateTelemetry}
          />
        ) : null}
      </div>
    </div>
  );
}
