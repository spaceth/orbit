"use client";

import dynamic from "next/dynamic";

import { SatellitePanel } from "@/components/satellite-panel";
import { SpaceTHLogo } from "@/components/spaceth-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSatellites } from "@/hooks/use-satellites";
import { useThemeColors } from "@/hooks/use-theme-colors";
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
  const {
    tles,
    loading,
    error,
    activeNoradId,
    highlightedNoradId,
    activeSatellite,
    activeTle,
    activeTelemetry,
    availableNoradIds,
    hiddenNoradIds,
    selectNoradId,
    setHoverNoradId,
    deselect,
    updateTelemetry,
    toggleVisibility,
  } = useSatellites();

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground transition-colors">
      <SpaceTHLogo />
      <ThemeToggle />
      <SatellitePanel
        satellites={SATELLITES}
        availableNoradIds={availableNoradIds}
        hiddenNoradIds={hiddenNoradIds}
        activeNoradId={activeNoradId}
        highlightedNoradId={highlightedNoradId}
        activeSatellite={activeSatellite}
        activeTle={activeTle}
        activeTelemetry={activeTelemetry}
        onSelectNoradId={selectNoradId}
        onHoverNoradId={setHoverNoradId}
        onToggleVisibility={toggleVisibility}
        loading={loading}
        error={error}
      />
      <div className="absolute inset-0">
        {tles.length > 0 ? (
          <GlobeScene
            tles={tles}
            themeColors={themeColors}
            hiddenNoradIds={hiddenNoradIds}
            activeNoradId={activeNoradId}
            highlightedNoradId={highlightedNoradId}
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
