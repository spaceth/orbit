"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { AppToggles } from "@/components/app-toggles";
import { type ViewMode } from "@/components/view-mode-toggle";
import { GlobeLoading } from "@/components/globe-loading";
import { OrbitTimeline } from "@/components/orbit-timeline";
import { SatellitePanel } from "@/components/satellite-panel";
import { SimulationTimeProvider } from "@/components/simulation-time-provider";
import { SiteFooter } from "@/components/site-footer";
import { SpaceTHLogo } from "@/components/spaceth-logo";
import { useMySatellites } from "@/hooks/use-my-satellites";
import { useSatelliteRouteSync } from "@/hooks/use-satellite-route";
import { useSatellites } from "@/hooks/use-satellites";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useLocationFocusRequest, useObserverLocation } from "@/lib/observer-location";
import { FUTURE_SATELLITES } from "@/lib/future-satellites";
import { LEGACY_SATELLITES } from "@/lib/legacy-satellites";
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
  const [viewMode, setViewMode] = useState<ViewMode>("space");
  const [groundEntry, setGroundEntry] = useState(0);
  const [groundTrackRequest, setGroundTrackRequest] = useState(0);
  const observer = useObserverLocation();
  const locationFocusRequest = useLocationFocusRequest();
  const handleMobileReadingModeChange = useCallback((readingMode: boolean) => {
    setMobileReadingMode(readingMode);
  }, []);
  const focusEarth = useCallback(() => {
    setEarthFocused(true);
    setEarthFocusRequest((request) => request + 1);
  }, []);
  const {
    omms,
    loading,
    loadError,
    retryLoadOmms,
    activeNoradId,
    activeLegacyId,
    activeFutureId,
    hoverNoradId,
    highlightedNoradId,
    hoverLegacyId,
    hoverFutureId,
    activeSatellite,
    activeLegacySatellite,
    activeFutureSatellite,
    activeOmm,
    activeTelemetry,
    telemetryById,
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
  } = useSatellites();
  const {
    satellites: mySatellites,
    omms: myOmms,
    failedNoradIds: myFailedNoradIds,
    adding: myAdding,
    activeNoradId: activeMyNoradId,
    hoverNoradId: hoverMyNoradId,
    setHoverNoradId: setHoverMyNoradId,
    selectNoradId: selectMyNoradId,
    deselect: deselectMy,
    addSatellite: addMySatellite,
    renameSatellite: renameMySatellite,
    removeSatellite: removeMySatellite,
  } = useMySatellites();

  const globeOmms = useMemo(() => {
    const seen = new Set(omms.map((omm) => omm.noradId));
    return [...omms, ...myOmms.filter((omm) => !seen.has(omm.noradId))];
  }, [omms, myOmms]);
  const globeActiveNoradId = activeMyNoradId ?? activeNoradId;
  const globeHighlightedNoradId =
    hoverMyNoradId ?? hoverNoradId ?? activeMyNoradId ?? activeNoradId;
  const activeMyTelemetry =
    activeMyNoradId === null ? null : (telemetryById[activeMyNoradId] ?? null);

  const changeViewMode = useCallback(
    (mode: ViewMode) => {
      if (mode === "ground" && viewMode !== "ground") {
        setGroundEntry((entry) => entry + 1);
      }
      setViewMode(mode);
    },
    [viewMode],
  );

  const releaseEarthFocus = useCallback(() => {
    setEarthFocused(false);
  }, []);

  const selectCatalogNoradId = useCallback(
    (noradId: number) => {
      deselectMy();
      selectNoradId(noradId);
    },
    [deselectMy, selectNoradId],
  );

  const selectCatalogLegacyId = useCallback(
    (id: string) => {
      deselectMy();
      selectLegacyId(id);
    },
    [deselectMy, selectLegacyId],
  );

  const selectCatalogFutureId = useCallback(
    (id: string) => {
      deselectMy();
      selectFutureId(id);
    },
    [deselectMy, selectFutureId],
  );

  useSatelliteRouteSync({
    loading,
    availableNoradIds,
    selectNoradId: selectCatalogNoradId,
    selectLegacyId: selectCatalogLegacyId,
    selectFutureId: selectCatalogFutureId,
    onFocusSatellite: releaseEarthFocus,
  });

  const handleSelectNoradId = useCallback(
    (noradId: number) => {
      setGroundTrackRequest((request) => request + 1);
      releaseEarthFocus();
      const mineOnly =
        mySatellites.some((satellite) => satellite.noradId === noradId) &&
        !availableNoradIds.includes(noradId);
      if (mineOnly) {
        deselect();
        selectMyNoradId(noradId);
        return;
      }
      deselectMy();
      selectNoradId(noradId);
    },
    [
      availableNoradIds,
      deselect,
      deselectMy,
      releaseEarthFocus,
      mySatellites,
      selectMyNoradId,
      selectNoradId,
    ],
  );

  const handleSelectMyNoradId = useCallback(
    (noradId: number) => {
      setGroundTrackRequest((request) => request + 1);
      releaseEarthFocus();
      deselect();
      selectMyNoradId(noradId);
    },
    [deselect, releaseEarthFocus, selectMyNoradId],
  );

  const handleSelectLegacyId = useCallback(
    (id: string) => {
      releaseEarthFocus();
      selectCatalogLegacyId(id);
    },
    [releaseEarthFocus, selectCatalogLegacyId],
  );

  const handleSelectFutureId = useCallback(
    (id: string) => {
      releaseEarthFocus();
      selectCatalogFutureId(id);
    },
    [releaseEarthFocus, selectCatalogFutureId],
  );

  const handleToggleVisibility = useCallback(
    (noradId: number) => {
      const willHide = !hiddenNoradIds.has(noradId);
      toggleVisibility(noradId);
      if (willHide && activeMyNoradId === noradId) {
        deselectMy();
      }
    },
    [activeMyNoradId, deselectMy, hiddenNoradIds, toggleVisibility],
  );

  const handleEarthDoubleClick = useCallback(() => {
    deselect();
    deselectMy();
    focusEarth();
  }, [deselect, deselectMy, focusEarth]);

  const handleDeselect = useCallback(() => {
    releaseEarthFocus();
    deselect();
    deselectMy();
  }, [releaseEarthFocus, deselect, deselectMy]);

  return (
    <SimulationTimeProvider>
      <div className="relative h-full min-h-dvh w-full overflow-hidden bg-background text-foreground transition-colors">
      <SpaceTHLogo />
      <AppToggles viewMode={viewMode} onViewModeChange={changeViewMode} />
      <div className="satellite-shell max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-20 max-sm:pb-[env(safe-area-inset-bottom)] sm:contents">
        <SiteFooter />
        <SatellitePanel
          satellites={SATELLITES}
          legacySatellites={LEGACY_SATELLITES}
          futureSatellites={FUTURE_SATELLITES}
          availableNoradIds={availableNoradIds}
          hiddenNoradIds={hiddenNoradIds}
          activeNoradId={activeNoradId}
          activeLegacyId={activeLegacyId}
          activeFutureId={activeFutureId}
          highlightedNoradId={highlightedNoradId}
          hoverLegacyId={hoverLegacyId}
          hoverFutureId={hoverFutureId}
          activeSatellite={activeSatellite}
          activeLegacySatellite={activeLegacySatellite}
          activeFutureSatellite={activeFutureSatellite}
          activeOmm={activeOmm}
          activeTelemetry={activeTelemetry}
          onSelectNoradId={handleSelectNoradId}
          onSelectLegacyId={handleSelectLegacyId}
          onSelectFutureId={handleSelectFutureId}
          onHoverNoradId={setHoverNoradId}
          onHoverLegacyId={setHoverLegacyId}
          onHoverFutureId={setHoverFutureId}
          onToggleVisibility={handleToggleVisibility}
          mySatellites={mySatellites}
          myOmms={myOmms}
          myFailedNoradIds={myFailedNoradIds}
          activeMyNoradId={activeMyNoradId}
          hoverMyNoradId={hoverMyNoradId}
          activeMyTelemetry={activeMyTelemetry}
          myAdding={myAdding}
          onAddMySatellite={addMySatellite}
          onSelectMyNoradId={handleSelectMyNoradId}
          onHoverMyNoradId={setHoverMyNoradId}
          onRenameMySatellite={renameMySatellite}
          onRemoveMySatellite={removeMySatellite}
          onMobileReadingModeChange={handleMobileReadingModeChange}
          loading={loading}
          loadError={loadError}
          onRetryLoadOmms={retryLoadOmms}
        />
      </div>
      <OrbitTimeline mobileReadingMode={mobileReadingMode} />
      <div className="absolute inset-0">
        <GlobeScene
          omms={globeOmms}
          themeColors={themeColors}
          hiddenNoradIds={hiddenNoradIds}
          activeNoradId={globeActiveNoradId}
          highlightedNoradId={globeHighlightedNoradId}
          mobileReadingMode={mobileReadingMode}
          onSelectNoradId={handleSelectNoradId}
          onHoverNoradId={setHoverNoradId}
          onEarthDoubleClick={handleEarthDoubleClick}
          onDeselect={handleDeselect}
          earthFocused={earthFocused}
          earthFocusRequest={earthFocusRequest}
          groundView={viewMode === "ground"}
          groundEntry={groundEntry}
          groundTrackRequest={groundTrackRequest}
          latitude={observer.lat}
          longitude={observer.lon}
          locationFocusRequest={locationFocusRequest}
          onTelemetryUpdate={updateTelemetry}
        />
      </div>
      </div>
    </SimulationTimeProvider>
  );
}
