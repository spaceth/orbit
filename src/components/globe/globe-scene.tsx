"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

import { parseOmm } from "@/lib/orbit";
import type { ThemeColors } from "@/lib/theme";
import type { OmmData, SatelliteTelemetry } from "@/types/satellite";

import { CameraController } from "./camera-controller";
import { CameraViewportOffset } from "./camera-viewport-offset";
import { Earth } from "./earth";
import { Moon } from "./moon";
import { OrbitTrail } from "./orbit-trail";
import { SatelliteMarker } from "./satellite-marker";

interface GlobeSceneProps {
  omms: OmmData[];
  themeColors: ThemeColors;
  hiddenNoradIds: ReadonlySet<number>;
  activeNoradId: number | null;
  highlightedNoradId: number | null;
  mobileReadingMode: boolean;
  onSelectNoradId: (noradId: number) => void;
  onHoverNoradId: (noradId: number | null) => void;
  onEarthDoubleClick: () => void;
  onDeselect: () => void;
  earthFocused: boolean;
  earthFocusRequest: number;
  onTelemetryUpdate: (noradId: number, telemetry: SatelliteTelemetry) => void;
}

function SceneContent({
  omms,
  themeColors,
  hiddenNoradIds,
  activeNoradId,
  highlightedNoradId,
  mobileReadingMode,
  onSelectNoradId,
  onHoverNoradId,
  onEarthDoubleClick,
  earthFocused,
  earthFocusRequest,
  onTelemetryUpdate,
}: GlobeSceneProps) {
  const satellites = useMemo(
    () =>
      omms.map((omm) => ({
        noradId: omm.noradId,
        satrec: parseOmm(omm),
        omm,
      })),
    [omms],
  );

  return (
    <>
      <color attach="background" args={[themeColors.canvasBackground]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 2, 5]} intensity={2} />
      <directionalLight position={[-3, -1, -2]} intensity={0.6} />
      <Earth colors={themeColors} onDoubleClick={onEarthDoubleClick} />
      <Moon bodyColor={themeColors.muted} />

      {satellites.map((satellite) => {
        if (hiddenNoradIds.has(satellite.noradId)) {
          return null;
        }

        const isHighlighted =
          highlightedNoradId !== null && satellite.noradId === highlightedNoradId;
        const isActive = activeNoradId !== null && satellite.noradId === activeNoradId;

        return (
          <group key={satellite.noradId}>
            <OrbitTrail
              satrec={satellite.satrec}
              color={themeColors.orbitTrail}
              isHighlighted={isHighlighted}
              isActive={isActive}
              onHover={() => onHoverNoradId(satellite.noradId)}
              onUnhover={() => onHoverNoradId(null)}
              onSelect={() => onSelectNoradId(satellite.noradId)}
            />
            <SatelliteMarker
              noradId={satellite.noradId}
              satrec={satellite.satrec}
              omm={satellite.omm}
              color={themeColors.marker}
              isHighlighted={isHighlighted}
              isActive={isActive}
              onTelemetryUpdate={onTelemetryUpdate}
              onHover={() => onHoverNoradId(satellite.noradId)}
              onUnhover={() => onHoverNoradId(null)}
              onSelect={() => onSelectNoradId(satellite.noradId)}
            />
          </group>
        );
      })}

      <CameraController
        activeNoradId={activeNoradId}
        earthFocused={earthFocused}
        earthFocusRequest={earthFocusRequest}
        satellites={satellites}
      />
      <CameraViewportOffset mobileReadingMode={mobileReadingMode} />
    </>
  );
}

export function GlobeScene(props: GlobeSceneProps) {
  const handlePointerMissed = (event: MouseEvent) => {
    if (event.type === "dblclick") {
      props.onDeselect();
    }
  };

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={handlePointerMissed}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
