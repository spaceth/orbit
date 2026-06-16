"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh, PerspectiveCamera } from "three";

import { getEcfPosition, getTelemetry } from "@/lib/orbit";
import type { SatRec } from "@/lib/orbit";
import { getWorldScaleForPixelDiameter } from "@/lib/screen-scale";
import type { SatelliteTelemetry } from "@/types/satellite";

const SELECTED_MARKER_PIXEL_SIZE = 7;
const UNSELECTED_MARKER_PIXEL_SIZE = 3;
const MARKER_GEOMETRY_DIAMETER = 1;

interface SatelliteMarkerProps {
  noradId: number;
  satrec: SatRec;
  color: string;
  isHighlighted: boolean;
  isActive: boolean;
  onTelemetryUpdate: (noradId: number, telemetry: SatelliteTelemetry) => void;
  onHover: () => void;
  onUnhover: () => void;
  onSelect: () => void;
}

export function SatelliteMarker({
  noradId,
  satrec,
  color,
  isHighlighted,
  isActive,
  onTelemetryUpdate,
  onHover,
  onUnhover,
  onSelect,
}: SatelliteMarkerProps) {
  const markerRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const lastUpdateRef = useRef(0);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const date = new Date();

    const position = getEcfPosition(satrec, date);
    if (!position || !markerRef.current) {
      return;
    }

    markerRef.current.position.copy(position);

    const camera = state.camera as PerspectiveCamera;
    const markerPixelSize = isActive
      ? SELECTED_MARKER_PIXEL_SIZE
      : UNSELECTED_MARKER_PIXEL_SIZE;
    const markerScale = getWorldScaleForPixelDiameter(
      camera,
      position,
      markerPixelSize,
      state.size.height,
      MARKER_GEOMETRY_DIAMETER,
    );
    markerRef.current.scale.setScalar(markerScale);

    if (glowRef.current) {
      glowRef.current.position.copy(position);
      glowRef.current.scale.setScalar(markerScale * 1.9);
    }

    if (now - lastUpdateRef.current > 0.1) {
      const telemetry = getTelemetry(satrec, date);
      if (telemetry) {
        onTelemetryUpdate(noradId, telemetry);
        lastUpdateRef.current = now;
      }
    }
  });

  return (
    <group>
      <mesh
        ref={markerRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onUnhover();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHighlighted ? 0.6 : 0.45}
          toneMapped={false}
        />
      </mesh>
      {isActive ? (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
