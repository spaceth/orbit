"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

import { parseTle } from "@/lib/orbit";
import type { ThemeColors } from "@/lib/theme";
import type { SatelliteTelemetry, TleData } from "@/types/satellite";

import { CameraController } from "./camera-controller";
import { CameraViewportOffset } from "./camera-viewport-offset";
import { Earth } from "./earth";
import { OrbitTrail } from "./orbit-trail";
import { SatelliteMarker } from "./satellite-marker";

interface GlobeSceneProps {
  tles: TleData[];
  themeColors: ThemeColors;
  hiddenNoradIds: ReadonlySet<number>;
  activeNoradId: number | null;
  highlightedNoradId: number | null;
  onSelectNoradId: (noradId: number) => void;
  onHoverNoradId: (noradId: number | null) => void;
  onDeselect: () => void;
  onTelemetryUpdate: (noradId: number, telemetry: SatelliteTelemetry) => void;
}

function SceneContent({
  tles,
  themeColors,
  hiddenNoradIds,
  activeNoradId,
  highlightedNoradId,
  onSelectNoradId,
  onHoverNoradId,
  onDeselect,
  onTelemetryUpdate,
}: GlobeSceneProps) {
  const satellites = useMemo(
    () =>
      tles.map((tle) => ({
        noradId: tle.noradId,
        satrec: parseTle(tle),
      })),
    [tles],
  );

  return (
    <>
      <color attach="background" args={[themeColors.canvasBackground]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 2, 5]} intensity={2} />
      <directionalLight position={[-3, -1, -2]} intensity={0.6} />
      <Earth colors={themeColors} onClick={onDeselect} />

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

      <CameraController activeNoradId={activeNoradId} satellites={satellites} />
      <CameraViewportOffset />
    </>
  );
}

export function GlobeScene(props: GlobeSceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={props.onDeselect}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
